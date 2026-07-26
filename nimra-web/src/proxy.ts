import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const normalizeRole = (role?: string) => String(role || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
const AUTH_RETURN_COOKIE = 'nimra_auth_return_to';
const customerAuthPaths = new Set(['/login', '/register', '/forgot-password']);

const safeInternalReturnPath = (rawValue?: string | null) => {
  if (!rawValue) return null;
  let value = rawValue;
  try {
    value = decodeURIComponent(rawValue);
  } catch {
    return null;
  }
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\') || /[\u0000-\u001f]/.test(value)) return null;
  try {
    const parsed = new URL(value, 'https://nimra.invalid');
    if (parsed.origin !== 'https://nimra.invalid' || customerAuthPaths.has(parsed.pathname)) return null;
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return null;
  }
};

export function proxy(request: NextRequest) {
  const userCookie = request.cookies.get('nimra_user')?.value;
  const sessionCookie = request.cookies.get('nimra_session')?.value;
  const returnTo = safeInternalReturnPath(request.cookies.get(AUTH_RETURN_COOKIE)?.value);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
    return NextResponse.next();
  }

  const authPaths = ['/login', '/register', '/forgot-password', '/admin/login'];
  const isAuthPath = authPaths.includes(pathname);
  const protectedCustomerPaths = ['/checkout', '/settings', '/profile-settings', '/orders', '/customer-portal'];
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

  const role = normalizeRole(user?.Role);
  const isAdminUser = role === 'ADMIN' || role === 'SUPER_ADMIN';

  if (user && isAuthPath) {
    const destination = isAdminUser ? '/admin' : (returnTo || '/customer-portal');
    return NextResponse.redirect(new URL(destination, request.url));
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
    const isCheckoutPath = pathname === '/checkout' || pathname.startsWith('/checkout/');
    if (!isCheckoutPath) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    const loginUrl = new URL('/login', request.url);
    const requestedPath = `${pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set('next', requestedPath);
    const response = NextResponse.redirect(loginUrl);
    if (isCheckoutPath) {
      response.cookies.set(AUTH_RETURN_COOKIE, requestedPath, {
        path: '/',
        sameSite: 'lax',
        secure: request.nextUrl.protocol === 'https:',
        httpOnly: false,
        maxAge: 60 * 60,
      });
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
