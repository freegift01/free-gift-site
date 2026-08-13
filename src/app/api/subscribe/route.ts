import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendDripEmail } from '@/lib/drip';
import { z } from 'zod';

const subscribeSchema = z.object({
  email: z.string().email('Invalid email format').trim().toLowerCase(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Strict server-side schema validation using Zod
    const validation = subscribeSchema.safeParse(body);
    if (!validation.success) {
      return Response.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }
    
    const { email } = validation.data;

    // Check if subscriber already exists
    const existing = await prisma.subscriber.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.status === 'ACTIVE') {
        return Response.json(
          { error: 'You are already subscribed and receiving daily ebooks!' },
          { status: 409 }
        );
      }

      // Re-activate if completed or unsubscribed
      await prisma.subscriber.update({
        where: { id: existing.id },
        data: {
          status: 'ACTIVE',
          currentDay: 1,
          startDate: new Date(),
          lastSentAt: null,
        },
      });

      // Trigger Day 1 email
      const result = await sendDripEmail(existing.id, 1);
      if (!result.success) {
        console.error('Failed to send Day 1 email:', result.error);
      }

      return Response.json({
        success: true,
        message: 'Your first free ebook has been sent! You will continue to receive a new free ebook daily for the next 30 days.',
      });
    }

    // Create new subscriber
    const subscriber = await prisma.subscriber.create({
      data: {
        email,
        status: 'ACTIVE',
        currentDay: 1,
        startDate: new Date(),
      },
    });

    // Immediately trigger Day 1 email
    const result = await sendDripEmail(subscriber.id, 1);
    if (!result.success) {
      console.error('Failed to send Day 1 email:', result.error);
      // Don't fail the subscription even if the first email fails
      // The cron job will retry
    }

    return Response.json({
      success: true,
      message: 'Your first free ebook has been sent! You will continue to receive a new free ebook daily for the next 30 days.',
    }, { status: 201 });
  } catch (error) {
    // Generic error masking
    console.error('Subscribe error:', error);
    return Response.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
