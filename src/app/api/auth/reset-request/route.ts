import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const adminRecord = await prisma.adminAuth.findFirst();
    if (!adminRecord) {
      // If no admin record exists, there's no password to reset yet
      return Response.json({ error: 'No admin user found. Please login with environment variables and change your password first.' }, { status: 400 });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.adminAuth.update({
      where: { id: adminRecord.id },
      data: { resetToken, resetTokenExpiry }
    });

    const resetLink = `https://notification.electedbooks.com/akin/reset-password?token=${resetToken}`;

    await resend.emails.send({
      from: process.env.SENDER_EMAIL || 'freegift@notification.electedbooks.com',
      to: 'afosegzi123@gmail.com',
      subject: 'Admin Password Reset - notification.electedbooks.com',
      html: `
        <h2>Password Reset Request</h2>
        <p>You have requested to reset your admin password. Click the button below to reset it. This link is valid for 1 hour.</p>
        <br />
        <a href="${resetLink}" style="display:inline-block;padding:12px 24px;background-color:#4263eb;color:#fff;text-decoration:none;border-radius:6px;">Reset Password</a>
        <br /><br />
        <p>If you did not request this, you can safely ignore this email.</p>
      `
    });

    return Response.json({ success: true, message: 'Reset email sent' });
  } catch (error) {
    console.error('Reset request error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
