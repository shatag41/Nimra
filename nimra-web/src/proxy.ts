import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const userCookie = request.cookies.get('nimra_user')?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
    return NextResponse.next();
  }

  const authPaths = ['/login', '/register', '/forgot-password', '/admin/login'];
  const isAuthPath = authPaths.includes(pathname);
  const protectedCustomerPaths = ['/checkout'];
  const isProtectedCustomerPath = protectedCustomerPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isAdminPath = pathname.startsWith('/admin');

  let user = null;
  if (userCookie) {
    try {
      user = JSON.parse(userCookie);
    } catch {
      try {
        user = JSON.parse(decodeURIComponent(userCookie));
      } catch {
        // Ignore parse error and treat as unauthenticated.
      }
    }
  }

  const isAdminUser = user?.Role === 'Admin';

  if (user && isAuthPath) {
    return NextResponse.redirect(new URL(isAdminUser ? '/admin' : '/customer-portal', request.url));
  }

  if (isAdminPath && pathname !== '/admin/login') {
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    if (!isAdminUser) {
      return NextResponse.redirect(new URL('/customer-portal', request.url));
    }
  }

  if (!user && isProtectedCustomerPath) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
