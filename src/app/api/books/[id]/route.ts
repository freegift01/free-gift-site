import { del } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { getAuthFromCookie } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) {
      return Response.json({ error: 'Book not found' }, { status: 404 });
    }

    // Remove any schedule slot assignments referencing this book
    await prisma.scheduleSlot.updateMany({
      where: { bookId: id },
      data: { bookId: null, isEnabled: false },
    });

    // Delete from Vercel Blob
    try {
      await del(book.blobUrl);
    } catch (e) {
      console.warn('Failed to delete blob, continuing with DB deletion:', e);
    }

    // Delete from database
    await prisma.book.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting book:', error);
    return Response.json({ error: 'Failed to delete book' }, { status: 500 });
  }
}
