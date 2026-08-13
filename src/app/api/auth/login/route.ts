import { NextRequest } from 'next/server';
import { validateAdminCredentials, createToken, setAuthCookie } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
    // Check lockouts
    const attemptRecord = await prisma.loginAttempts.findUnique({
      where: { ipAddress }
    });

    if (attemptRecord && attemptRecord.lockedUntil && attemptRecord.lockedUntil > new Date()) {
      return Response.json(
        { error: 'Too many failed attempts. Try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return Response.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Validate against environment variables — NO database queries
    if (!validateAdminCredentials(username, password)) {
      // Handle failed login
      if (ipAddress !== 'unknown') {
        const newCount = (attemptRecord?.attemptCount || 0) + 1;
        const lockedUntil = newCount >= 5 ? new Date(Date.now() + 10 * 60 * 60 * 1000) : null;
        
        await prisma.loginAttempts.upsert({
          where: { ipAddress },
          update: { attemptCount: newCount, lockedUntil },
          create: { ipAddress, attemptCount: 1 }
        });
      }

      return Response.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Success! Reset attempts.
    if (ipAddress !== 'unknown' && attemptRecord) {
      await prisma.loginAttempts.update({
        where: { ipAddress },
        data: { attemptCount: 0, lockedUntil: null }
      });
    }

    // Create JWT token and set HTTP-Only cookie
    const token = await createToken(username);
    await setAuthCookie(token);

    return Response.json({ success: true, message: 'Login successful' });
  } catch (error) {
    // Generic error masking
    console.error('Login error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
