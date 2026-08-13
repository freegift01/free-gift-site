import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateDripEmailPayload } from '@/lib/drip';
import { sendBatchEmails } from '@/lib/resend';
import pLimit from 'p-limit';

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
    const validSubscribers = [];

    // Filter out those who received an email less than 24 hours ago
    for (const subscriber of subscribers) {
      const referenceTime = subscriber.lastSentAt || subscriber.startDate;
      const hoursSinceLastSend = (Date.now() - referenceTime.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastSend < 24) {
        results.push({
          email: subscriber.email,
          day: subscriber.currentDay,
          success: false,
          error: 'Less than 24 hours since last send',
        });
      } else {
        validSubscribers.push(subscriber);
      }
    }

    // Chunk the valid subscribers (e.g., 50 at a time)
    const chunkSize = 50;
    const chunks = [];
    for (let i = 0; i < validSubscribers.length; i += chunkSize) {
      chunks.push(validSubscribers.slice(i, i + chunkSize));
    }

    const limit = pLimit(5); // Concurrency limit for DB updates

    for (const chunk of chunks) {
      // Build payloads in parallel
      const payloadPromises = chunk.map(sub => generateDripEmailPayload(sub.id, sub.currentDay));
      const resolvedPayloads = await Promise.all(payloadPromises);

      const emailsToSend: any[] = [];
      const successfulMetadata: Array<{ subscriberId: string; dayNumber: number; slotBookId: string }> = [];

      resolvedPayloads.forEach((res, idx) => {
        const sub = chunk[idx];
        if (res.success && res.data) {
          emailsToSend.push(res.data.emailPayload);
          successfulMetadata.push({
            subscriberId: res.data.subscriberId,
            dayNumber: res.data.dayNumber,
            slotBookId: res.data.slotBookId,
          });
        } else {
          results.push({ email: sub.email, day: sub.currentDay, success: false, error: res.error });
        }
      });

      if (emailsToSend.length > 0) {
        try {
          // Send the batch
          await sendBatchEmails(emailsToSend);

          // Update DB concurrently
          await Promise.all(successfulMetadata.map(meta => limit(async () => {
            const newDay = meta.dayNumber + 1;
            
            await prisma.deliveryLog.create({
              data: {
                subscriberId: meta.subscriberId,
                dayNumber: meta.dayNumber,
                bookId: meta.slotBookId,
                status: 'SUCCESS',
              },
            });

            await prisma.subscriber.update({
              where: { id: meta.subscriberId },
              data: {
                lastSentAt: new Date(),
                currentDay: newDay,
                status: newDay > 30 ? 'COMPLETED' : 'ACTIVE',
              },
            });

            results.push({ 
              email: emailsToSend.find(e => e.subject.includes(`Day ${meta.dayNumber}`))?.to || 'Unknown', 
              day: meta.dayNumber, 
              success: true 
            });
          })));
        } catch (batchError) {
          console.error('Batch send error:', batchError);
          // Mark all in this chunk as failed
          chunk.forEach(sub => {
            results.push({ email: sub.email, day: sub.currentDay, success: false, error: 'Batch dispatch failed' });
          });
        }
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    // ==========================================
    // BROADCAST SWEEP LOGIC
    // ==========================================
    const today = new Date().toISOString().split('T')[0];
    const broadcasts = await prisma.broadcastMessage.findMany({
      where: {
        scheduledDate: today,
        status: 'SCHEDULED',
      },
      include: { book: true },
    });

    let broadcastSuccessCount = 0;
    let broadcastFailCount = 0;

    for (const broadcast of broadcasts) {
      try {
        const targetSubscribers = await prisma.subscriber.findMany({
          where: {
            id: { in: broadcast.targetSubscriberIds },
            status: { not: 'UNSUBSCRIBED' },
          }
        });

        if (targetSubscribers.length === 0) {
          await prisma.broadcastMessage.update({
            where: { id: broadcast.id },
            data: { status: 'COMPLETED' }
          });
          continue;
        }

        let fileBuffer: Buffer | null = null;
        if (broadcast.book && broadcast.book.blobUrl) {
          const res = await fetch(broadcast.book.blobUrl);
          if (res.ok) {
            fileBuffer = Buffer.from(await res.arrayBuffer());
          }
        }

        const bChunkSize = 50;
        const bChunks = [];
        for (let i = 0; i < targetSubscribers.length; i += bChunkSize) {
          bChunks.push(targetSubscribers.slice(i, i + bChunkSize));
        }

        for (const bChunk of bChunks) {
          const emailsToSend = bChunk.map(sub => {
            const emailHtml = `
              <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 12px;">
                  ${broadcast.emailBody}
                  ${broadcast.book ? `<p style="margin-top: 20px; color: #6b7280; font-size: 14px;">📎 Attachment: <strong>${broadcast.book.title}</strong></p>` : ''}
                </div>
                <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    Don't want to receive these emails?
                    <a href="https://notification.electedbooks.com/api/unsubscribe?id=${sub.id}" style="color: #6366f1; text-decoration: underline;">Unsubscribe here</a>
                  </p>
                </div>
              </div>
            `;
            const payload: any = {
              to: sub.email,
              subject: broadcast.emailSubject,
              html: emailHtml,
            };
            if (fileBuffer && broadcast.book) {
              payload.attachments = [{ filename: broadcast.book.filename, content: fileBuffer }];
            }
            return payload;
          });

          try {
            await sendBatchEmails(emailsToSend);
            broadcastSuccessCount += emailsToSend.length;
          } catch (err) {
            console.error('Broadcast chunk error:', err);
            broadcastFailCount += emailsToSend.length;
          }
        }

        await prisma.broadcastMessage.update({
          where: { id: broadcast.id },
          data: { status: 'COMPLETED' }
        });

      } catch (err) {
        console.error('Broadcast error:', err);
        await prisma.broadcastMessage.update({
          where: { id: broadcast.id },
          data: { status: 'FAILED' }
        });
      }
    }

    return Response.json({
      success: true,
      message: `Drip cron completed. ${successCount} sent, ${failCount} skipped/failed out of ${subscribers.length} active subscribers. Broadcasts: ${broadcastSuccessCount} sent, ${broadcastFailCount} failed.`,
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
