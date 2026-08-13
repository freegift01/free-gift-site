import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthFromCookie } from '@/lib/auth';

async function requireAuth() {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export const dynamic = 'force-dynamic';

// GET: Fetch all subscribers
export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const subscribers = await prisma.subscriber.findMany({
      orderBy: { startDate: 'desc' },
      select: {
        id: true,
        email: true,
        status: true,
        currentDay: true,
        startDate: true,
        lastSentAt: true,
      },
    });

    const broadcasts = await prisma.broadcastMessage.findMany({
      where: { status: 'SCHEDULED' }
    });
    
    const scheduleSlots = await prisma.scheduleSlot.findMany({
      where: { isEnabled: true },
      select: { dayNumber: true }
    });
    const enabledDays = new Set(scheduleSlots.map(s => s.dayNumber));

    const enrichedSubscribers = subscribers.map(sub => {
      const scheduleEntries: { label: string, date: Date }[] = [];
      
      // 1. Drip sequence
      if (sub.status === 'ACTIVE' && sub.currentDay <= 30) {
        for (let day = sub.currentDay; day <= 30; day++) {
          if (enabledDays.has(day)) {
            const date = new Date(sub.startDate);
            date.setDate(date.getDate() + (day - 1));
            scheduleEntries.push({ label: `Day ${day}: ${date.toLocaleDateString()}`, date });
          }
        }
      }

      // 2. Broadcasts
      const targetedBroadcasts = broadcasts.filter(b => 
        b.targetSubscriberIds.length === 0 || b.targetSubscriberIds.includes(sub.id)
      );
      
      for (const b of targetedBroadcasts) {
        const bDate = new Date(b.scheduledDate);
        scheduleEntries.push({ label: `Broadcast: ${bDate.toLocaleDateString()}`, date: bDate });
      }
      
      scheduleEntries.sort((a, b) => a.date.getTime() - b.date.getTime());

      return {
        ...sub,
        upcomingSchedule: scheduleEntries.map(e => e.label)
      };
    });

    return Response.json({ subscribers: enrichedSubscribers });
  } catch (error) {
    console.error('Fetch subscribers error:', error);
    return Response.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
  }
}

// PATCH: Bulk unsubscribe
export async function PATCH(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return Response.json({ error: 'No subscriber IDs provided' }, { status: 400 });
    }

    const result = await prisma.subscriber.updateMany({
      where: { id: { in: ids } },
      data: { status: 'UNSUBSCRIBED' },
    });

    return Response.json({ success: true, count: result.count });
  } catch (error) {
    console.error('Bulk unsubscribe error:', error);
    return Response.json({ error: 'Failed to unsubscribe' }, { status: 500 });
  }
}

// DELETE: Bulk permanent delete
export async function DELETE(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return Response.json({ error: 'No subscriber IDs provided' }, { status: 400 });
    }

    // First delete delivery logs for these subscribers
    await prisma.deliveryLog.deleteMany({
      where: { subscriberId: { in: ids } },
    });

    // Then delete the subscribers
    const result = await prisma.subscriber.deleteMany({
      where: { id: { in: ids } },
    });

    return Response.json({ success: true, count: result.count });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return Response.json({ error: 'Failed to delete subscribers' }, { status: 500 });
  }
}
