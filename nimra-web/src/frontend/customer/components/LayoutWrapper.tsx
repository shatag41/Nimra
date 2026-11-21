'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import { CompanyInfo } from '@/types/cms';
import { consumeLoginRedirect, useAuth } from '../contexts/AuthContext';
import { isAdminRole } from '@/frontend/admin/utils/accessControl';
import { meaningfulPath, recordNavigation } from '../navigation/navigationHistory';
import { persistCheckoutAuthHandoff, readCheckoutAuthReturn } from '../utils/checkoutAuthHandoff';
import LogoutConfirmationModal from './LogoutConfirmationModal';

interface LayoutWrapperProps {
  children: React.ReactNode;
  companyInfo: CompanyInfo;
}

const isAuthenticatedSection = (path: string) => {
  const normalizedPath = path.split('?')[0];
  const publicRoutes = ['/about', '/contact', '/products', '/cart', '/track', '/login', '/register', '/forgot-password', '/admin/login'];
  if (normalizedPath === '/' || publicRoutes.some((route) => normalizedPath === route || normalizedPath.startsWith(`${route}/`))) {
    return false;
  }

  // The explicit list preserves the existing protected customer area. Other
  // non-public application routes are treated as authenticated sections so
  // new role portals inherit the guard without role-specific branches.
  return true;
};

const AUTH_HISTORY_GUARD_KEY = 'nimra_auth_history_guard_v3';
const AUTH_HISTORY_BASE_STATE = '__nimraAuthHistoryBase';
const AUTH_HISTORY_GUARD_STATE = '__nimraAuthHistoryGuard';

export default function LayoutWrapper({ children, companyInfo }: LayoutWrapperProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, isLoggingOut, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showBackLogoutConfirmation, setShowBackLogoutConfirmation] = useState(false);
  const returningToGuardRef = useRef(false);

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        setMounted(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isLoading || isLoggingOut) return;
    recordNavigation(meaningfulPath(pathname, searchParams.toString()), user?.Role);
  }, [isLoading, isLoggingOut, pathname, searchParams, user?.Role]);

  const isAdmin = pathname?.startsWith('/admin');
  const isAdminLogin = pathname === '/admin/login';
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password' || isAdminLogin;
  const isCheckout = pathname === '/checkout' || pathname?.startsWith('/checkout/');
  useEffect(() => {
    if (isLoading || isLoggingOut || !isAuthenticated || !pathname || !isAuthenticatedSection(pathname)) return;

    let guardId = window.sessionStorage.getItem(AUTH_HISTORY_GUARD_KEY);
    if (!guardId) {
      guardId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      // Mark the authenticated entry already in the stack, then add one
      // forward entry as its guard. Internal Next.js navigations continue to
      // add and remove their own entries normally above this boundary.
      const baseState = window.history.state && typeof window.history.state === 'object'
        ? { ...window.history.state }
        : {};
      baseState[AUTH_HISTORY_BASE_STATE] = guardId;
      window.history.replaceState(baseState, '', window.location.href);
      const guardState = { ...baseState, [AUTH_HISTORY_GUARD_STATE]: guardId };
      delete guardState[AUTH_HISTORY_BASE_STATE];
      window.history.pushState(guardState, '', window.location.href);
      window.sessionStorage.setItem(AUTH_HISTORY_GUARD_KEY, guardId);
    }

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state && typeof event.state === 'object' ? event.state : {};
      const reachedGuard = state[AUTH_HISTORY_GUARD_STATE] === guardId;
      const reachedBoundary = state[AUTH_HISTORY_BASE_STATE] === guardId;

      if (returningToGuardRef.current && reachedGuard) {
        returningToGuardRef.current = false;
        setShowBackLogoutConfirmation(true);
        return;
      }

      if (reachedBoundary) {
        // Move back to the tagged guard entry without adding history. Cancel
        // leaves this entry active, so the next Back repeats this exact path.
        returningToGuardRef.current = true;
        window.history.forward();
        return;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthenticated, isLoading, isLoggingOut, pathname]);

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && isAuthPage) {
      const pendingLoginRedirect = consumeLoginRedirect();
      const nextPath = searchParams?.get('next');
      const safeNextPath = nextPath?.startsWith('/') && !nextPath.startsWith('//') ? nextPath : null;
      let hasCartItems = false;
      try {
        const cartItems = JSON.parse(localStorage.getItem(`nimra-cart-${user?.ID}`) || '[]');
        hasCartItems = Array.isArray(cartItems) && cartItems.length > 0;
      } catch {
        hasCartItems = false;
      }
      const hasCheckoutNext = safeNextPath?.startsWith('/checkout') === true;
      const customerReturnPath = hasCheckoutNext || hasCartItems ? readCheckoutAuthReturn() : null;
      router.replace(isAdminRole(user?.Role)
        ? '/admin'
        : pendingLoginRedirect || (safeNextPath && (!safeNextPath.startsWith('/checkout') || hasCartItems) ? safeNextPath : null) || customerReturnPath || '/customer-portal');
    } else if (isAdmin && !isAdminLogin && !isAdminRole(user?.Role)) {
      router.replace('/customer-portal');
    } else if (!isAuthenticated && isCheckout) {
      const fullPath = window.location.pathname + window.location.search;
      persistCheckoutAuthHandoff(fullPath);
      router.replace(`/login?next=${encodeURIComponent(fullPath)}`);
    } else if (!isAuthenticated && isAuthenticatedSection(pathname || '')) {
      router.replace('/');
    }
  }, [isAdmin, isAdminLogin, isAuthPage, isAuthenticated, isCheckout, isLoading, isLoggingOut, pathname, router, searchParams, user]);

  const backLogoutConfirmation = (
    <LogoutConfirmationModal
      isOpen={showBackLogoutConfirmation}
      onClose={() => setShowBackLogoutConfirmation(false)}
      onConfirm={() => {
        setShowBackLogoutConfirmation(false);
        void logout();
      }}
      title="Are you sure you want to logout?"
      description="You are currently logged in to your NIMRA account. Do you want to logout and return to the homepage?"
      cancelText="Cancel / Stay Logged In"
      confirmText="Yes, Logout"
      isProcessing={isLoggingOut}
      processingText="Logging out..."
    />
  );

  const renderBareShell = (content: React.ReactNode, includeMobileHeader = false) => (
    <div className="ds-app-shell">
      {backLogoutConfirmation}
      {includeMobileHeader && (
        <div className="mobile-only-site-header">
          <Header companyInfo={companyInfo} />
        </div>
      )}
      <main className={`ds-main ${includeMobileHeader ? 'with-mobile-site-header' : ''}`}>
        {content}
      </main>
    </div>
  );

  const isProtectedRoute = isAuthenticatedSection(pathname || '');

  if (isLoggingOut) {
    return renderBareShell(
      <div className="logout-page-state" role="status" aria-live="polite">
        <span className="loading-spinner" aria-hidden="true" />
        <strong>Logging out...</strong>
        <style jsx>{`
          .logout-page-state { min-height:100svh; display:grid; place-content:center; justify-items:center; gap:.75rem; color:var(--text-primary); background:var(--bg-primary); }
          .logout-page-state .loading-spinner { width:1.6rem; height:1.6rem; border:3px solid var(--border-color); border-top-color:var(--primary-color); border-radius:50%; animation:logout-spin .8s linear infinite; }
          @keyframes logout-spin { to { transform:rotate(360deg); } }
          @media (prefers-reduced-motion: reduce) { .logout-page-state .loading-spinner { animation:none; } }
        `}</style>
      </div>,
      !isAdmin,
    );
  }

  if (!mounted && isProtectedRoute) return renderBareShell(null, !isAdmin);
  if (isLoading && isProtectedRoute) return renderBareShell(null, !isAdmin);

  // Also block access if not authenticated
  if (isProtectedRoute && !isAuthenticated) {
    return renderBareShell(null);
  }

  if (isAdmin && !isAdminLogin && !isAdminRole(user?.Role)) {
    return renderBareShell(null);
  }

  if (isAdmin) {
    return renderBareShell(children);
  }

  if (isAuthPage) {
    return (
      <div className="ds-app-shell auth-route-shell">
        <main className="ds-main auth-route-main">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="ds-app-shell">
      {backLogoutConfirmation}
      <Header companyInfo={companyInfo} />
      <main className={`ds-main with-site-header ${pathname === '/' ? 'home-main' : ''} ${pathname === '/settings' || pathname?.startsWith('/settings/') ? 'settings-route-main' : ''}`}>
        <div className={`route-transition ${pathname === '/settings' || pathname?.startsWith('/settings/') ? 'settings-route-transition' : ''}`}>
          {children}
        </div>
      </main>
      <Footer companyInfo={companyInfo} />
    </div>
  );
}
