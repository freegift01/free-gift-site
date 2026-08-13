import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthFromCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function requireAuth() {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

// GET: Fetch all broadcasts
export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const broadcasts = await prisma.broadcastMessage.findMany({
      orderBy: { createdAt: 'desc' },
      include: { book: true },
    });
    return Response.json(broadcasts);
  } catch (error) {
    console.error('Fetch broadcasts error:', error);
    return Response.json({ error: 'Failed to fetch broadcasts' }, { status: 500 });
  }
}

// POST: Schedule a new broadcast
export async function POST(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { scheduledDate, bookId, emailSubject, emailBody, targetSubscriberIds } = body;

    if (!scheduledDate || !emailSubject || !emailBody || !targetSubscriberIds || targetSubscriberIds.length === 0) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const broadcast = await prisma.broadcastMessage.create({
      data: {
        scheduledDate,
        bookId: bookId || null,
        emailSubject,
        emailBody,
        targetSubscriberIds,
        status: 'SCHEDULED',
      },
    });

    return Response.json(broadcast, { status: 201 });
  } catch (error) {
    console.error('Create broadcast error:', error);
    return Response.json({ error: 'Failed to schedule broadcast' }, { status: 500 });
  }
}

// DELETE: Cancel/Hard-delete a broadcast
export async function DELETE(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { id } = await request.json();

    if (!id) {
      return Response.json({ error: 'Broadcast ID is required' }, { status: 400 });
    }

    await prisma.broadcastMessage.delete({
      where: { id },
    });

    return Response.json({ success: true, message: 'Broadcast deleted successfully' });
  } catch (error) {
    console.error('Delete broadcast error:', error);
    return Response.json({ error: 'Failed to delete broadcast' }, { status: 500 });
  }
}
