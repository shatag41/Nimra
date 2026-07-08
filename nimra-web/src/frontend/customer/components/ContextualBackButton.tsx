'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/frontend/customer/hooks/useAuth';

export default function ContextualBackButton({ hideBackButton }: { hideBackButton?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [prevPath, setPrevPath] = useState<string | null>(null);
  
  const tab = searchParams.get('tab');

  useEffect(() => {
    // Track history for back button context
    const storedPrev = sessionStorage.getItem('nimra_prev_path');
    const storedCurr = sessionStorage.getItem('nimra_curr_path');
    const fullPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');

    if (storedCurr !== fullPath) {
      if (storedCurr) {
        sessionStorage.setItem('nimra_prev_path', storedCurr);
        setPrevPath(storedCurr);
      }
      sessionStorage.setItem('nimra_curr_path', fullPath);
    } else {
      setPrevPath(storedPrev);
    }
  }, [pathname, searchParams]);

  // Hide logic
  if (hideBackButton) return null;
  if (pathname === '/') return null; // Home
  if (pathname === '/customer-portal' && (!tab || tab === 'overview')) return null; // Portal Dashboard

  const getPathName = (path: string | null) => {
    if (!path) return 'Back';
    if (path === '/') return 'Home';
    if (path.startsWith('/customer-portal')) {
      if (path.includes('tab=orders')) return 'Orders';
      if (path.includes('tab=addresses')) return 'Addresses';
      if (path.includes('tab=profile')) return 'Profile';
      if (path.includes('tab=wishlist')) return 'Wishlist';
      if (path.includes('tab=payment')) return 'Payment Methods';
      if (path.includes('tab=notifications')) return 'Notifications';
      if (path.includes('tab=faqs')) return 'FAQs';
      if (path.includes('tab=settings')) return 'Settings';
      return 'Portal';
    }
    if (path.match(/^\/products\/[^\/]+$/)) return 'Product Details';
    if (path.startsWith('/products')) return 'Products';
    if (path.startsWith('/cart')) return 'Cart';
    if (path.startsWith('/checkout')) return 'Checkout';
    if (path.startsWith('/orders')) return 'Orders';
    if (path.startsWith('/track')) return 'Track Order';
    if (path.startsWith('/contact')) return 'Contact';
    if (path.startsWith('/about')) return 'About';
    if (path.startsWith('/settings')) return 'Settings';
    
    return 'Back';
  };

  const getFallbackPath = () => {
    if (pathname.startsWith('/products/')) return '/products';
    if (pathname === '/cart') return '/products';
    if (pathname === '/checkout') return '/cart';
    if (pathname === '/track') return '/customer-portal?tab=orders';
    if (pathname.startsWith('/customer-portal') && tab) return '/customer-portal';
    return '/';
  };

  const backText = prevPath ? `Back to ${getPathName(prevPath)}` : `Back to ${getPathName(getFallbackPath())}`;

  const handleBack = () => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }
    
    if (prevPath && window.history.length > 1) {
      router.back();
    } else {
      router.push(getFallbackPath());
    }
  };

  return (
    <>
      <div className="contextual-back-wrapper">
        <button className="contextual-back-btn" onClick={handleBack} aria-label={backText}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span>{backText}</span>
        </button>
      </div>

      <style jsx>{`
        .contextual-back-wrapper {
          position: absolute;
          top: 1.15rem;
          left: 0;
          right: 0;
          width: 100%;
          max-width: var(--ds-container, 1180px);
          margin: 0 auto;
          padding-left: clamp(1rem, 3vw, 1.25rem);
          pointer-events: none;
          z-index: 20;
          display: flex;
          justify-content: flex-start;
        }

        .contextual-back-btn {
          position: relative;
          pointer-events: auto;
          height: 42px;
          padding: 0 16px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.75);
          border: 1px solid rgba(37, 99, 235, 0.12);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.05);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          color: #2563eb;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.25s ease;
        }

        .contextual-back-btn svg {
          transition: transform 0.25s ease;
        }

        .contextual-back-btn:hover {
          transform: translateY(-2px);
          background: #f8fbff;
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.1);
        }

        .contextual-back-btn:hover svg {
          transform: translateX(-3px);
        }

        .contextual-back-btn:active {
          transform: translateY(0) scale(0.97);
        }

        /* Dark Mode */
        :global([data-theme="dark"]) .contextual-back-btn {
          background: rgba(30, 41, 59, 0.75);
          border: 1px solid rgba(59, 130, 246, 0.2);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          color: #60a5fa;
        }

        :global([data-theme="dark"]) .contextual-back-btn:hover {
          background: rgba(30, 41, 59, 0.95);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
        }

        @media (max-width: 768px) {
          .contextual-back-wrapper {
            padding-left: max(1rem, calc(50vw - 280px));
          }
        }
      `}</style>
    </>
  );
}
