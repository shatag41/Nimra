import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const userCookie = request.cookies.get('nimra_user')?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
    return NextResponse.next();
  }

  const publicPaths = ['/login', '/register', '/forgot-password', '/admin/login'];
  const isPublicPath = publicPaths.includes(pathname);

  let user = null;
  if (userCookie) {
    try {
      user = JSON.parse(userCookie);
    } catch {
      // Ignore parse error and treat as unauthenticated.
    }
  }

  const isAdminUser = user?.Role === 'Admin';

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (!user && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user && isPublicPath) {
    return NextResponse.next(); // Don't redirect when already at an auth page if logged in
  }

  if (user && pathname.startsWith('/admin') && !isAdminUser) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
