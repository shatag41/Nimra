'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import { CompanyInfo } from '../types/cms';

interface LayoutWrapperProps {
  children: React.ReactNode;
  companyInfo: CompanyInfo;
}

export default function LayoutWrapper({ children, companyInfo }: LayoutWrapperProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';

  if (isAdmin || isAuthPage) {
    return (
      <main style={{ flex: '1' }}>
        {children}
      </main>
    );
  }

  return (
    <>
      <Header companyInfo={companyInfo} />
      <main style={{ flex: '1', paddingTop: '80px' }}>
        {children}
      </main>
      <Footer companyInfo={companyInfo} />
    </>
  );
}
