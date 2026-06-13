import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const userCookie = request.cookies.get('nimra_user')?.value;
  const { pathname } = request.nextUrl;
  console.log('[PROXY] Request path:', pathname, 'User cookie:', !!userCookie);

  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
    return NextResponse.next();
  }

  const publicPaths = ['/login', '/register', '/forgot-password', '/admin/login'];
  const isPublicPath = publicPaths.includes(pathname);
  console.log('[PROXY] isPublicPath:', isPublicPath);

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
    if (user) {
      return NextResponse.redirect(new URL(isAdminUser ? '/admin' : '/products', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (!user && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user && isPublicPath) {
    return NextResponse.redirect(new URL(isAdminUser ? '/admin' : '/products', request.url));
  }

  if (user && pathname.startsWith('/admin') && !isAdminUser) {
    return NextResponse.redirect(new URL('/products', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
