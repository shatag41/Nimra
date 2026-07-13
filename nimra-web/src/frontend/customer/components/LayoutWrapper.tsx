'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import BackToTop from './BackToTop';
import { CompanyInfo } from '@/types/cms';
import { useAuth } from '../contexts/AuthContext';
import { isAdminRole } from '@/frontend/admin/utils/accessControl';
import { meaningfulPath, recordNavigation } from '../navigation/navigationHistory';

interface LayoutWrapperProps {
  children: React.ReactNode;
  companyInfo: CompanyInfo;
}

export default function LayoutWrapper({ children, companyInfo }: LayoutWrapperProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
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
    if (isLoading) return;
    recordNavigation(meaningfulPath(pathname, searchParams.toString()), user?.Role);
  }, [isLoading, pathname, searchParams, user?.Role]);

  const isAdmin = pathname?.startsWith('/admin');
  const isAdminLogin = pathname === '/admin/login';
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password' || isAdminLogin;
  const isCheckout = pathname === '/checkout' || pathname?.startsWith('/checkout/');

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && isAuthPage) {
      const nextPath = searchParams?.get('next');
      const safeNextPath = nextPath?.startsWith('/') && !nextPath.startsWith('//') ? nextPath : null;
      router.replace(safeNextPath || (isAdminRole(user?.Role) ? '/admin' : '/customer-portal'));
    } else if (isAdmin && !isAdminLogin && !isAuthenticated) {
      router.replace('/');
    } else if (isAdmin && !isAdminLogin && !isAdminRole(user?.Role)) {
      router.replace('/customer-portal');
    } else if (!isAuthenticated && isCheckout) {
      const fullPath = window.location.pathname + window.location.search;
      router.replace(`/login?next=${encodeURIComponent(fullPath)}`);
    }
  }, [isAdmin, isAdminLogin, isAuthPage, isAuthenticated, isCheckout, isLoading, pathname, router, searchParams, user]);

  const renderBareShell = (content: React.ReactNode) => (
    <div className="ds-app-shell">
      <main className="ds-main">
        {content}
      </main>
    </div>
  );

  const isProtectedRoute = (isAdmin && !isAdminLogin) || isCheckout;

  if (!mounted && isProtectedRoute) return renderBareShell(null);
  if (isLoading && isProtectedRoute) return renderBareShell(null);

  // Also block access if not authenticated
  if (isAdmin && !isAdminLogin && (!isAuthenticated || !isAdminRole(user?.Role))) {
    return renderBareShell(null);
  }

  if (!isAuthenticated && isCheckout) {
    return renderBareShell(null);
  }

  if (isAdmin || isAuthPage) {
    return renderBareShell(children);
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
      <BackToTop />
    </div>
  );
}
