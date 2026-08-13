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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();
    const { startDate } = body;

    if (!startDate) {
      return Response.json({ error: 'Start date is required' }, { status: 400 });
    }

    const date = new Date(startDate);
    if (isNaN(date.getTime())) {
      return Response.json({ error: 'Invalid date format' }, { status: 400 });
    }

    const updatedSubscriber = await prisma.subscriber.update({
      where: { id },
      data: { startDate: date },
    });

    return Response.json({ success: true, subscriber: updatedSubscriber });
  } catch (error: any) {
    console.error('Update start date error:', error);
    if (error.code === 'P2025') {
      return Response.json({ error: 'Subscriber not found' }, { status: 404 });
    }
    return Response.json({ error: 'Failed to update start date' }, { status: 500 });
  }
}
