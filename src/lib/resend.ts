import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'freegift@notification.electedbooks.com';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
  }>;
}

export async function sendEmail({ to, subject, html, attachments }: SendEmailOptions) {
  const payload: Parameters<typeof resend.emails.send>[0] = {
    from: FROM_EMAIL,
    to,
    subject,
    html,
  };

  if (attachments && attachments.length > 0) {
    payload.attachments = attachments.map((att) => ({
      filename: att.filename,
      content: att.content,
    }));
  }

  const { data, error } = await resend.emails.send(payload);

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }

  return data;
}

export async function sendBatchEmails(emails: SendEmailOptions[]) {
  const payloads = emails.map(email => {
    const payload: Parameters<typeof resend.emails.send>[0] = {
      from: FROM_EMAIL,
      to: email.to,
      subject: email.subject,
      html: email.html,
    };

    if (email.attachments && email.attachments.length > 0) {
      payload.attachments = email.attachments.map((att) => ({
        filename: att.filename,
        content: att.content,
      }));
    }

    return payload;
  });

  const { data, error } = await resend.batch.send(payloads as any);

  if (error) {
    throw new Error(`Resend batch error: ${error.message}`);
  }

  return data;
}
