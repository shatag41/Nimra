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
  const { isAuthenticated, user, isLoading } = useAuth();

  const isAdmin = pathname?.startsWith('/admin');
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';
  const isLanding = pathname === '/landing';
  const dashboardPath = user?.Role === 'Admin' ? '/admin' : '/customer-portal';

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && (pathname === '/' || isAuthPage)) {
      router.replace(dashboardPath);
    } else if (pathname === '/') {
      router.replace('/login');
    } else if (!isAuthenticated && !isAuthPage) {
      router.replace('/login');
    }
  }, [dashboardPath, isAuthPage, isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyItems: 'center', backgroundColor: '#0a0a0a' }}></div>;
  }

  if (!isAuthenticated && !isAuthPage) {
    return null;
  }

  if (isAuthenticated && (pathname === '/' || isAuthPage)) {
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
