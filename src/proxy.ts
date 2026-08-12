import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes (except /admin/login)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get('admin_session')?.value;

    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // We can't verify the JWT in the proxy (edge runtime limitation with jsonwebtoken),
    // so we just check the cookie exists. Full verification happens in the API routes.
    // For an extra layer, we could use jose instead, but the cookie check + server-side
    // verification is sufficient for this use case.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
