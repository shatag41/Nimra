'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import { CompanyInfo } from '@/types/cms';
import { useAuth } from '../contexts/AuthContext';
import { isAdminRole } from '@/frontend/admin/utils/accessControl';
import { meaningfulPath, recordNavigation } from '../navigation/navigationHistory';
import { persistCheckoutAuthHandoff, readCheckoutAuthReturn } from '../utils/checkoutAuthHandoff';

interface LayoutWrapperProps {
  children: React.ReactNode;
  companyInfo: CompanyInfo;
}

export default function LayoutWrapper({ children, companyInfo }: LayoutWrapperProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, isLoggingOut } = useAuth();
  const [mounted, setMounted] = useState(false);

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
  const isProtectedCustomerRoute = isCheckout
    || pathname === '/orders'
    || pathname?.startsWith('/orders/')
    || pathname === '/customer-portal'
    || pathname?.startsWith('/customer-portal/')
    || pathname === '/settings'
    || pathname?.startsWith('/settings/')
    || pathname === '/profile-settings'
    || pathname?.startsWith('/profile-settings/');

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && isAuthPage) {
      const nextPath = searchParams?.get('next');
      const safeNextPath = nextPath?.startsWith('/') && !nextPath.startsWith('//') ? nextPath : null;
      const customerReturnPath = readCheckoutAuthReturn();
      router.replace(safeNextPath || (isAdminRole(user?.Role) ? '/admin' : customerReturnPath || '/customer-portal'));
    } else if (isAdmin && !isAdminLogin && !isAuthenticated) {
      router.replace('/');
    } else if (isAdmin && !isAdminLogin && !isAdminRole(user?.Role)) {
      router.replace('/customer-portal');
    } else if (!isAuthenticated && isCheckout) {
      const fullPath = window.location.pathname + window.location.search;
      persistCheckoutAuthHandoff(fullPath);
      router.replace(`/login?next=${encodeURIComponent(fullPath)}`);
    } else if (!isAuthenticated && isProtectedCustomerRoute) {
      router.replace('/');
    }
  }, [isAdmin, isAdminLogin, isAuthPage, isAuthenticated, isCheckout, isLoading, isLoggingOut, isProtectedCustomerRoute, pathname, router, searchParams, user]);

  const renderBareShell = (content: React.ReactNode, includeMobileHeader = false) => (
    <div className="ds-app-shell">
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

  const isProtectedRoute = (isAdmin && !isAdminLogin) || isProtectedCustomerRoute;

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
  if (isAdmin && !isAdminLogin && (!isAuthenticated || !isAdminRole(user?.Role))) {
    return renderBareShell(null);
  }

  if (!isAuthenticated && isProtectedCustomerRoute) {
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
      <Header companyInfo={companyInfo} />
      <main className={`ds-main with-site-header ${pathname === '/' ? 'home-main' : ''}`}>
        <div className="route-transition">
          {children}
        </div>
      </main>
      <Footer companyInfo={companyInfo} />
    </div>
  );
}
