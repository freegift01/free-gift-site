import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Obfuscation: completely block /admin
  if (pathname.startsWith('/admin')) {
    return new NextResponse(null, { status: 404 });
  }

  // 2. Protect /akin routes (excluding the login page itself)
  if (pathname.startsWith('/akin') && !pathname.startsWith('/akin/login')) {
    const token = request.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/akin/login', request.url));
    }
    
    // Using jose for edge-compatible token verification
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.redirect(new URL('/akin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/akin/:path*'],
};
