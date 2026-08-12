import { prisma } from './prisma';
import { sendEmail } from './resend';

/**
 * Send the drip email for a specific subscriber and day number.
 * Shared between immediate Day 1 trigger and cron job.
 */
export async function sendDripEmail(subscriberId: string, dayNumber: number): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the schedule slot for this day
    const slot = await prisma.scheduleSlot.findUnique({
      where: { dayNumber },
      include: { book: true },
    });

    if (!slot || !slot.isEnabled || !slot.bookId || !slot.book) {
      return { success: false, error: `Day ${dayNumber} slot is not configured or disabled` };
    }

    // Get the subscriber
    const subscriber = await prisma.subscriber.findUnique({
      where: { id: subscriberId },
    });

    if (!subscriber) {
      return { success: false, error: 'Subscriber not found' };
    }

    // Fetch the book file from Vercel Blob
    const response = await fetch(slot.book.blobUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch book file: ${response.statusText}`);
    }
    const fileBuffer = Buffer.from(await response.arrayBuffer());

    // Build the email body with a nice wrapper
    const emailHtml = `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📚 Your Free Ebook - Day ${dayNumber}</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          ${slot.emailBody || `<p>Here is your free ebook for Day ${dayNumber}!</p>`}
          <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
            📎 Your ebook "<strong>${slot.book.title}</strong>" is attached to this email.
          </p>
        </div>
        <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
          You're receiving this because you signed up for our 30-day free ebook series.
        </p>
      </div>
    `;

    // Send the email with attachment
    await sendEmail({
      to: subscriber.email,
      subject: slot.emailSubject || `Day ${dayNumber}: Your Free Ebook is Here! 📚`,
      html: emailHtml,
      attachments: [
        {
          filename: slot.book.filename,
          content: fileBuffer,
        },
      ],
    });

    // Log the delivery
    await prisma.deliveryLog.create({
      data: {
        subscriberId: subscriber.id,
        dayNumber,
        bookId: slot.book.id,
        status: 'SUCCESS',
      },
    });

    // Update subscriber progress
    const newDay = dayNumber + 1;
    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: {
        lastSentAt: new Date(),
        currentDay: newDay,
        status: newDay > 30 ? 'COMPLETED' : 'ACTIVE',
      },
    });

    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';

    // Try to log the failure
    try {
      const slot = await prisma.scheduleSlot.findUnique({ where: { dayNumber } });
      if (slot?.bookId) {
        await prisma.deliveryLog.create({
          data: {
            subscriberId,
            dayNumber,
            bookId: slot.bookId,
            status: 'FAILED',
            errorMsg,
          },
        });
      }
    } catch {
      // If logging fails, we still return the error
    }

    return { success: false, error: errorMsg };
  }
}
