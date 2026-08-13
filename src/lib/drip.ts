import { prisma } from './prisma';
import { sendEmail, sendBatchEmails } from './resend';

export async function sendDripEmail(subscriberId: string, dayNumber: number): Promise<{ success: boolean; error?: string }> {
  try {
    const payloadResult = await generateDripEmailPayload(subscriberId, dayNumber);
    if (!payloadResult.success) {
      return { success: false, error: payloadResult.error };
    }

    const { emailPayload, slotBookId, subscriberId: subId } = payloadResult.data!;

    await sendEmail(emailPayload);

    await prisma.deliveryLog.create({
      data: {
        subscriberId: subId,
        dayNumber,
        bookId: slotBookId,
        status: 'SUCCESS',
      },
    });

    const newDay = dayNumber + 1;
    await prisma.subscriber.update({
      where: { id: subId },
      data: {
        lastSentAt: new Date(),
        currentDay: newDay,
        status: newDay > 30 ? 'COMPLETED' : 'ACTIVE',
      },
    });

    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

export async function generateDripEmailPayload(subscriberId: string, dayNumber: number) {
  const slot = await prisma.scheduleSlot.findUnique({
    where: { dayNumber },
    include: { book: true },
  });

  if (!slot || !slot.isEnabled || !slot.bookId || !slot.book) {
    return { success: false, error: `Day ${dayNumber} slot is not configured or disabled` };
  }

  const subscriber = await prisma.subscriber.findUnique({
    where: { id: subscriberId },
  });

  if (!subscriber) {
    return { success: false, error: 'Subscriber not found' };
  }

  const response = await fetch(slot.book.blobUrl);
  if (!response.ok) {
    return { success: false, error: `Failed to fetch book file: ${response.statusText}` };
  }
  const fileBuffer = Buffer.from(await response.arrayBuffer());

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
      <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px 0;">
          You're receiving this because you signed up for our 30-day free ebook series.
        </p>
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          Don't want to receive these emails?
          <a href="https://notification.electedbooks.com/api/unsubscribe?id=${subscriber.id}" style="color: #6366f1; text-decoration: underline;">Unsubscribe here</a>
        </p>
      </div>
    </div>
  `;

  return {
    success: true,
    data: {
      subscriberId: subscriber.id,
      dayNumber,
      slotBookId: slot.book.id,
      emailPayload: {
        to: subscriber.email,
        subject: slot.emailSubject || `Day ${dayNumber}: Your Free Ebook is Here! 📚`,
        html: emailHtml,
        attachments: [
          {
            filename: slot.book.filename,
            content: fileBuffer,
          },
        ],
      }
    }
  };
}
