'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import { CompanyInfo } from '@/types/cms';
import { useAuth } from '../contexts/AuthContext';

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

  const isAdmin = pathname?.startsWith('/admin');
  const isAdminLogin = pathname === '/admin/login';
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password' || isAdminLogin;
  const isCheckout = pathname === '/checkout' || pathname?.startsWith('/checkout/');

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && isAuthPage) {
      const nextPath = searchParams?.get('next');
      const safeNextPath = nextPath?.startsWith('/') && !nextPath.startsWith('//') ? nextPath : null;
      router.replace(safeNextPath || (user?.Role === 'Admin' ? '/admin' : '/customer-portal'));
    } else if (isAdmin && !isAdminLogin && !isAuthenticated) {
      router.replace('/');
    } else if (isAdmin && !isAdminLogin && user?.Role !== 'Admin') {
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
  if (isAdmin && !isAdminLogin && (!isAuthenticated || user?.Role !== 'Admin')) {
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
    </div>
  );
}
