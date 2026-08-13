import { NextRequest } from 'next/server';
import { put, list, del } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { getAuthFromCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const books = await prisma.book.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return Response.json({ books });
  } catch (error) {
    console.error('Error fetching books:', error);
    return Response.json({ error: 'Failed to fetch books' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['application/pdf', 'application/epub+zip'];
    if (!validTypes.includes(file.type)) {
      return Response.json(
        { error: 'Invalid file type. Only PDF and EPUB files are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (< 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return Response.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: 'public',
    });

    // Extract title from filename (remove extension)
    const title = file.name.replace(/\.(pdf|epub)$/i, '');

    // Save to database
    const book = await prisma.book.create({
      data: {
        title,
        blobUrl: blob.url,
        filename: file.name,
        sizeBytes: file.size,
      },
    });

    return Response.json({ book }, { status: 201 });
  } catch (error) {
    console.error('Error uploading book:', error);
    return Response.json({ error: 'Failed to upload book' }, { status: 500 });
  }
}
