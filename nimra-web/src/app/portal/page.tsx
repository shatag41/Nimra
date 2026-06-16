'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

export default function PortalRedirectPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/customer-portal');
      return;
    }

    router.replace(user?.Role === 'Admin' ? '/admin' : '/customer-portal');
  }, [isAuthenticated, isLoading, router, user]);

  return null;
}
