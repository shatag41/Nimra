'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import { CompanyInfo } from '../types/cms';
import { useAuth } from '../context/AuthContext';

interface LayoutWrapperProps {
  children: React.ReactNode;
  companyInfo: CompanyInfo;
}

export default function LayoutWrapper({ children, companyInfo }: LayoutWrapperProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const isAdmin = pathname?.startsWith('/admin');
  const isAdminLogin = pathname === '/admin/login';
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password' || isAdminLogin;
  const isCheckout = pathname === '/checkout' || pathname?.startsWith('/checkout/');
  const isLanding = pathname === '/landing';

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && isAuthPage) {
      router.replace(user?.Role === 'Admin' ? '/admin' : '/customer-portal');
    } else if (isAdmin && !isAdminLogin && !isAuthenticated) {
      router.replace('/admin/login');
    } else if (isAdmin && !isAdminLogin && user?.Role !== 'Admin') {
      router.replace('/customer-portal');
    } else if (!isAuthenticated && isCheckout) {
      router.replace('/login');
    }
  }, [isAdmin, isAdminLogin, isAuthPage, isAuthenticated, isCheckout, isLoading, pathname, router, user]);

  if (isLoading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyItems: 'center', backgroundColor: '#0a0a0a' }}></div>;
  }

  if (isAdmin && !isAdminLogin && (!isAuthenticated || user?.Role !== 'Admin')) {
    return null;
  }

  if (!isAuthenticated && isCheckout) {
    return null;
  }

  if (isAdmin || isAuthPage || isLanding) {
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
