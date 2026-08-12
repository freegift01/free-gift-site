import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendDripEmail } from '@/lib/drip';

export async function GET(request: NextRequest) {
  // Verify CRON_SECRET
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch all active subscribers with currentDay <= 30
    const subscribers = await prisma.subscriber.findMany({
      where: {
        status: 'ACTIVE',
        currentDay: { lte: 30 },
      },
    });

    const results: Array<{ email: string; day: number; success: boolean; error?: string }> = [];

    for (const subscriber of subscribers) {
      // Check if 24 hours have elapsed since startDate or lastSentAt
      const referenceTime = subscriber.lastSentAt || subscriber.startDate;
      const hoursSinceLastSend = (Date.now() - referenceTime.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastSend < 24) {
        results.push({
          email: subscriber.email,
          day: subscriber.currentDay,
          success: false,
          error: 'Less than 24 hours since last send',
        });
        continue;
      }

      // Send the drip email for this subscriber's current day
      const result = await sendDripEmail(subscriber.id, subscriber.currentDay);

      results.push({
        email: subscriber.email,
        day: subscriber.currentDay,
        success: result.success,
        error: result.error,
      });
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return Response.json({
      success: true,
      message: `Drip cron completed. ${successCount} sent, ${failCount} skipped/failed out of ${subscribers.length} active subscribers.`,
      results,
    });
  } catch (error) {
    console.error('Cron error:', error);
    return Response.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
