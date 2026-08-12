import { NextRequest } from 'next/server';
import { validateAdminCredentials, createToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
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
      return Response.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create JWT token and set HTTP-Only cookie
    const token = createToken(username);
    await setAuthCookie(token);

    return Response.json({ success: true, message: 'Login successful' });
  } catch (error) {
    console.error('Login error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
