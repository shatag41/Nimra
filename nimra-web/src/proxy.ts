import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const userCookie = request.cookies.get('nimra_user')?.value;
  const sessionCookie = request.cookies.get('nimra_session')?.value;
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
  let session = null;
  if (userCookie && sessionCookie) {
    try {
      user = JSON.parse(userCookie);
      session = JSON.parse(sessionCookie);
    } catch {
      try {
        user = JSON.parse(decodeURIComponent(userCookie));
        session = JSON.parse(decodeURIComponent(sessionCookie));
      } catch {
        // Ignore parse error and treat as unauthenticated.
      }
    }
  }

  const sessionExpired = Boolean(session?.expiresAt && Date.now() >= Number(session.expiresAt));
  const sessionMismatch = Boolean(
    user &&
    session &&
    ((session.role && session.role !== user.Role) ||
      (session.userId && user.ID && String(session.userId) !== String(user.ID)))
  );

  if ((userCookie || sessionCookie) && (!user || !session || !session.token || sessionExpired || sessionMismatch)) {
    const isProtectedPath = (isAdminPath && pathname !== '/admin/login') || isProtectedCustomerPath;
    const redirectUrl = isProtectedPath ? new URL('/', request.url) : new URL(request.nextUrl.pathname, request.url);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete('nimra_user');
    response.cookies.delete('nimra_session');
    response.cookies.delete('nimra_admin_user');
    return response;
  }

  const isAdminUser = user?.Role === 'Admin';

  if (user && isAuthPath) {
    return NextResponse.redirect(new URL(isAdminUser ? '/admin' : '/customer-portal', request.url));
  }

  if (isAdminPath && pathname !== '/admin/login') {
    if (!user) {
      return NextResponse.redirect(new URL('/', request.url));
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
