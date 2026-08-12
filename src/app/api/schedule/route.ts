import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthFromCookie } from '@/lib/auth';

export async function GET() {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Ensure all 30 slots exist
    const existingSlots = await prisma.scheduleSlot.findMany({
      orderBy: { dayNumber: 'asc' },
      include: { book: true },
    });

    const existingDays = new Set(existingSlots.map((s) => s.dayNumber));

    // Create missing slots
    for (let day = 1; day <= 30; day++) {
      if (!existingDays.has(day)) {
        await prisma.scheduleSlot.create({
          data: { dayNumber: day },
        });
      }
    }

    // Re-fetch all slots with book data
    const slots = await prisma.scheduleSlot.findMany({
      orderBy: { dayNumber: 'asc' },
      include: { book: true },
    });

    return Response.json({ slots });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return Response.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slots } = body as {
      slots: Array<{
        dayNumber: number;
        isEnabled: boolean;
        bookId: string | null;
        emailSubject: string;
        emailBody: string;
      }>;
    };

    if (!slots || !Array.isArray(slots) || slots.length !== 30) {
      return Response.json(
        { error: 'Must provide exactly 30 schedule slots' },
        { status: 400 }
      );
    }

    // CRITICAL VALIDATION: Check for duplicate books across enabled slots
    const enabledBookIds = slots
      .filter((s) => s.isEnabled && s.bookId)
      .map((s) => s.bookId!);

    const uniqueBookIds = new Set(enabledBookIds);
    if (enabledBookIds.length !== uniqueBookIds.size) {
      return Response.json(
        { error: 'Each book can only be assigned to one enabled day slot. Please remove duplicate book assignments.' },
        { status: 400 }
      );
    }

    // Validate that enabled slots have a bookId
    for (const slot of slots) {
      if (slot.isEnabled && !slot.bookId) {
        return Response.json(
          { error: `Day ${slot.dayNumber} is enabled but has no book assigned.` },
          { status: 400 }
        );
      }
    }

    // Update all slots in a transaction
    await prisma.$transaction(
      slots.map((slot) =>
        prisma.scheduleSlot.upsert({
          where: { dayNumber: slot.dayNumber },
          update: {
            isEnabled: slot.isEnabled,
            bookId: slot.bookId || null,
            emailSubject: slot.emailSubject,
            emailBody: slot.emailBody,
          },
          create: {
            dayNumber: slot.dayNumber,
            isEnabled: slot.isEnabled,
            bookId: slot.bookId || null,
            emailSubject: slot.emailSubject,
            emailBody: slot.emailBody,
          },
        })
      )
    );

    return Response.json({ success: true, message: 'Schedule saved successfully' });
  } catch (error) {
    console.error('Error saving schedule:', error);
    return Response.json({ error: 'Failed to save schedule' }, { status: 500 });
  }
}
