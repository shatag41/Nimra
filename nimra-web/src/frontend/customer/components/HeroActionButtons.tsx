'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/frontend/customer/hooks/useAuth';
import { useCart } from '@/frontend/customer/hooks/useCart';

export default function HeroActionButtons({ hideBackButton }: { hideBackButton?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { items } = useCart();
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

  // Back Button Visibility Logic
  let showBackButton = true;
  if (hideBackButton) showBackButton = false;
  if (pathname === '/') showBackButton = false; // Home
  if (pathname === '/customer-portal' && (!tab || tab === 'overview')) showBackButton = false; // Portal Dashboard

  // Finish Order Button Visibility Logic
  const cartItemCount = items.length;
  const isCartPage = pathname === '/cart';
  const isCheckoutPage = pathname === '/checkout';
  const showFinishOrderButton = cartItemCount > 0 && !isCartPage && !isCheckoutPage;

  if (!showBackButton && !showFinishOrderButton) return null;

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
    if (isCartPage) return '/products';
    if (isCheckoutPage) return '/cart';
    if (pathname === '/track') return '/customer-portal?tab=orders';
    if (pathname.startsWith('/customer-portal') && tab) return '/customer-portal';
    return '/';
  };

  const backText = isCartPage ? 'Continue Shopping' : (prevPath ? `Back to ${getPathName(prevPath)}` : `Back to ${getPathName(getFallbackPath())}`);

  const handleBack = () => {
    if (isCartPage) {
      router.push('/products');
      return;
    }
    
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

  const handleFinishOrder = () => {
    router.push('/cart');
  };

  return (
    <>
      <div className="hero-actions-wrapper">
        {showBackButton ? (
          <button className="hero-action-btn hero-action-back" onClick={handleBack} aria-label={backText}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span>{backText}</span>
          </button>
        ) : <div className="hero-action-spacer" />}
        
        {showFinishOrderButton && (
          <button className="hero-action-btn hero-action-finish" onClick={handleFinishOrder} aria-label="Finish Your Order">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span>Finish Your Order {cartItemCount > 0 ? `• ${cartItemCount} Item${cartItemCount > 1 ? 's' : ''}` : ''} →</span>
          </button>
        )}
      </div>

      <style jsx>{`
        .hero-actions-wrapper {
          position: absolute;
          top: 1.15rem;
          left: 0;
          right: 0;
          width: 100%;
          max-width: var(--ds-container, 1180px);
          margin: 0 auto;
          padding: 0 clamp(1rem, 3vw, 1.25rem);
          pointer-events: none;
          z-index: 20;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }

        .hero-action-spacer {
          flex: 1;
        }

        .hero-action-btn {
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
          flex-shrink: 0;
        }

        .hero-action-btn svg {
          transition: transform 0.25s ease;
        }

        .hero-action-btn:hover {
          transform: translateY(-2px);
          background: #f8fbff;
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.1);
        }

        .hero-action-btn.hero-action-back:hover svg {
          transform: translateX(-3px);
        }
        
        .hero-action-btn.hero-action-finish:hover svg {
          transform: translateX(3px);
        }

        .hero-action-btn:active {
          transform: translateY(0) scale(0.97);
        }

        /* Dark Mode */
        :global([data-theme="dark"]) .hero-action-btn {
          background: rgba(30, 41, 59, 0.75);
          border: 1px solid rgba(59, 130, 246, 0.2);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          color: #60a5fa;
        }

        :global([data-theme="dark"]) .hero-action-btn:hover {
          background: rgba(30, 41, 59, 0.95);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
        }

        @media (max-width: 768px) {
          .hero-actions-wrapper {
            padding-left: max(1rem, calc(50vw - 280px));
            padding-right: max(1rem, calc(50vw - 280px));
          }
        }

        @media (max-width: 640px) {
          .hero-actions-wrapper {
            position: static;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin-bottom: 0.8rem;
            padding: 0;
            gap: 0.5rem;
          }
          
          .hero-action-spacer {
            display: none;
          }
          
          .hero-action-btn {
            width: max-content;
            margin: 0 auto;
          }
        }
      `}</style>
    </>
  );
}
