'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import { CompanyInfo } from '../types/cms';
import { useAuth } from '../context/AuthContext';

import Cookies from 'js-cookie';

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
    setMounted(true);
    if (typeof window !== 'undefined') {
      const isNewTab = !sessionStorage.getItem('nimra_session_initialized');
      if (isNewTab) {
        sessionStorage.setItem('nimra_session_initialized', 'true');
        Cookies.remove('nimra_user', { path: '/' });
        localStorage.removeItem('nimra_admin_user');
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        } else {
          window.location.reload();
        }
      }
    }
  }, []);

  const isAdmin = pathname?.startsWith('/admin');
  const isAdminLogin = pathname === '/admin/login';
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password' || isAdminLogin;
  const isCheckout = pathname === '/checkout' || pathname?.startsWith('/checkout/');
  const isProtected = isAdmin || pathname?.startsWith('/customer-portal') || isCheckout;
  const isAuthOrProtected = isProtected || isAuthPage;

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && isAuthPage) {
      const nextPath = searchParams?.get('next');
      const safeNextPath = nextPath?.startsWith('/') && !nextPath.startsWith('//') ? nextPath : null;
      router.replace(safeNextPath || (user?.Role === 'Admin' ? '/admin' : '/customer-portal'));
    } else if (isAdmin && !isAdminLogin && !isAuthenticated) {
      const fullPath = window.location.pathname + window.location.search;
      router.replace(`/login?next=${encodeURIComponent(fullPath)}`);
    } else if (isAdmin && !isAdminLogin && user?.Role !== 'Admin') {
      router.replace('/customer-portal');
    } else if (!isAuthenticated && isCheckout) {
      const fullPath = window.location.pathname + window.location.search;
      router.replace(`/login?next=${encodeURIComponent(fullPath)}`);
    }
  }, [isAdmin, isAdminLogin, isAuthPage, isAuthenticated, isCheckout, isLoading, pathname, router, user]);

  if ((!mounted || isLoading) && isAuthOrProtected) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyItems: 'center', backgroundColor: '#0a0a0a' }}></div>;
  }

  if (isAdmin && !isAdminLogin && (!isAuthenticated || user?.Role !== 'Admin')) {
    return null;
  }

  if (!isAuthenticated && isCheckout) {
    return null;
  }

  if (isAdmin || isAuthPage) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <main style={{ flex: '1' }}>
          {children}
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header companyInfo={companyInfo} />
      <main style={{ flex: '1', paddingTop: '80px' }}>
        {children}
      </main>
      <Footer companyInfo={companyInfo} />
    </div>
  );
}
