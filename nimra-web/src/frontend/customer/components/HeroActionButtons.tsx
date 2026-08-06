'use client';

import React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCart } from '@/frontend/customer/hooks/useCart';
import { useAuth } from '@/frontend/customer/contexts/AuthContext';
import { consumeBackDestination, meaningfulPath, useNavigationHistory } from '@/frontend/customer/navigation/navigationHistory';

export default function HeroActionButtons({ hideBackButton, pageTitle, mobileBackDestination }: { hideBackButton?: boolean; pageTitle: string; mobileBackDestination?: { label: string; path: string } }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { items } = useCart();
  const { user } = useAuth();
  const navigation = useNavigationHistory(user?.Role);
  const [hasHydrated, setHasHydrated] = React.useState(false);

  React.useEffect(() => {
    setHasHydrated(true);
  }, []);
  
  const tab = searchParams.get('tab');

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

  const currentPath = meaningfulPath(pathname, searchParams.toString());
  let currentIndex = -1;
  for (let index = navigation.stack.length - 1; index >= 0; index -= 1) {
    if (navigation.stack[index].path === currentPath) {
      currentIndex = index;
      break;
    }
  }
  // Navigation history and authentication are restored from browser storage.
  // Keep the server and first client render identical, then use the restored
  // destination after hydration to avoid changing button text mid-hydration.
  const backDestination = hasHydrated
    ? (currentIndex > 0 ? navigation.stack[currentIndex - 1] : navigation.root)
    : { path: '/', label: 'Home' };
  const backText = `Back to ${backDestination.label}`;

  const handleBack = () => {
    if (mobileBackDestination && window.matchMedia('(max-width: 768px)').matches) {
      router.push(mobileBackDestination.path);
      return;
    }
    const destination = consumeBackDestination(currentPath, user?.Role);
    router.push(destination.path);
  };

  const handleFinishOrder = () => {
    router.push('/cart');
  };

  return (
    <>
      <div className={`hero-actions-wrapper ${hasHydrated && !user ? 'hero-actions-guest' : ''}`}>
        {showBackButton ? (
          <button className="hero-action-btn hero-action-back" onClick={handleBack} aria-label={backText}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="hero-back-label-desktop">{backText}</span>
            <span className="hero-back-label-mobile">{mobileBackDestination?.label || backDestination.label}</span>
          </button>
        ) : <div className="hero-action-spacer" />}

        <strong className="hero-mobile-page-title" title={pageTitle}>{pageTitle}</strong>
        
        {showFinishOrderButton && (
          <button className="hero-action-btn hero-action-finish" onClick={handleFinishOrder} aria-label="Finish Your Order">
            <svg className="hero-cart-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span className="hero-finish-text">
              Finish Your Order {cartItemCount > 0 ? <span className="hero-cart-badge">• {cartItemCount} Item{cartItemCount > 1 ? 's' : ''}</span> : ''} <span className="hero-cart-arrow">→</span>
            </span>
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

        .hero-back-label-mobile,
        .hero-mobile-page-title {
          display: none;
        }

        @media (min-width: 769px) {
          .hero-actions-guest .hero-action-back {
            visibility: hidden;
            pointer-events: none;
          }
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
            position: static;
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1.45fr) minmax(0, 1fr);
            align-items: center;
            width: 100%;
            max-width: none;
            min-height: 2.85rem;
            margin: 0;
            padding: 0.28rem 0;
            gap: 0.4rem;
          }

          .hero-action-btn {
            min-width: 0;
            height: 2.3rem;
            padding: 0 0.35rem;
            border: 0;
            border-radius: 0.55rem;
            background: transparent;
            box-shadow: none;
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
            font-size: 0.78rem;
            font-weight: 750;
          }

          .hero-action-back {
            visibility: hidden;
            pointer-events: none;
            justify-self: start;
            max-width: 100%;
          }

          .hero-action-back svg {
            width: 0.95rem;
            height: 0.95rem;
            flex: 0 0 auto;
          }

          .hero-back-label-desktop {
            display: none;
          }

          .hero-back-label-mobile {
            display: block;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .hero-mobile-page-title {
            display: block;
            min-width: 0;
            overflow: hidden;
            color: #163669;
            font-family: var(--font-heading, inherit);
            font-size: clamp(0.9rem, 3.6vw, 1.05rem);
            font-weight: 850;
            line-height: 1.15;
            text-align: center;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          :global([data-theme="dark"]) .hero-mobile-page-title {
            color: #dbeafe;
          }

          .hero-action-spacer {
            display: block;
            min-width: 0;
          }

          .hero-action-finish {
            justify-self: end;
            width: 2.3rem;
            min-width: 2.3rem;
            padding: 0;
            border: 1px solid rgba(37, 99, 235, 0.12);
            background: rgba(255, 255, 255, 0.55);
            animation: none;
          }

          .hero-action-finish .hero-finish-text {
            display: none;
          }

          .hero-action-finish::before {
            display: none;
          }
        }

        @media (max-width: 640px) {
          .hero-actions-wrapper {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr) minmax(0, 1fr);
          }
        }

        /* --- Finish Order CTA Animations --- */
        .hero-action-finish {
          --btn-glow-rgb: 37, 99, 235;
          --btn-shadow-base: 0 4px 12px rgba(37, 99, 235, 0.05);
          height: 36px;
          padding: 0 12px;
          border-radius: 11px;
          font-size: 12.5px;
          gap: 5px;
          overflow: hidden;
          animation: floatCTA 2.8s ease-in-out infinite, pulseGlow 2.8s ease-in-out infinite;
        }

        :global([data-theme="dark"]) .hero-action-finish {
          --btn-glow-rgb: 96, 165, 250;
          --btn-shadow-base: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .hero-action-finish > * {
          position: relative;
          z-index: 2;
        }

        .hero-action-finish::before {
          content: '';
          position: absolute;
          top: 0; left: 0; width: 40%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent);
          transform: translateX(-300%) skewX(-20deg);
          animation: shimmerSweep 7.5s infinite ease-in-out;
          pointer-events: none;
          z-index: 1;
        }

        :global([data-theme="dark"]) .hero-action-finish::before {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
        }

        .hero-cart-icon {
          width: 14px;
          height: 14px;
          animation: cartWiggle 5.5s infinite ease-in-out;
          transform-origin: center;
          transition: transform 220ms ease;
        }

        .hero-cart-badge {
          display: inline-block;
          font-size: 0.92em;
          animation: badgePulse 3s infinite ease-in-out;
          color: #1d4ed8;
          font-weight: 700;
        }

        :global([data-theme="dark"]) .hero-cart-badge {
          color: #93c5fd;
        }

        .hero-cart-arrow {
          display: inline-block;
          transition: transform 220ms ease;
        }

        /* Hover & Active states */
        .hero-action-finish:hover {
          transform: translateY(-3px) !important;
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 8px 22px rgba(37, 99, 235, 0.15), 0 0 18px rgba(var(--btn-glow-rgb), 0.35) !important;
          animation-play-state: paused;
        }

        :global([data-theme="dark"]) .hero-action-finish:hover {
          background: rgba(30, 41, 59, 0.95);
          box-shadow: 0 8px 22px rgba(0, 0, 0, 0.3), 0 0 18px rgba(var(--btn-glow-rgb), 0.35) !important;
        }

        .hero-action-finish:active {
          transform: scale(0.98) translateY(0) !important;
          box-shadow: var(--btn-shadow-base), 0 0 25px rgba(var(--btn-glow-rgb), 0.45) !important;
          transition: transform 120ms ease, box-shadow 120ms ease;
        }

        .hero-action-finish:hover .hero-cart-icon {
          transform: translateX(3px) !important;
          animation: none;
        }

        .hero-action-finish:hover .hero-cart-arrow {
          transform: translateX(4px);
        }

        /* Keyframes */
        @keyframes floatCTA {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2.5px); }
        }

        @keyframes pulseGlow {
          0%, 100% { 
            box-shadow: var(--btn-shadow-base), 0 0 0 rgba(var(--btn-glow-rgb), 0); 
          }
          50% { 
            box-shadow: var(--btn-shadow-base), 0 0 15px rgba(var(--btn-glow-rgb), 0.25); 
          }
        }

        @keyframes shimmerSweep {
          0%, 86% { transform: translateX(-300%) skewX(-20deg); }
          100% { transform: translateX(400%) skewX(-20deg); }
        }

        @keyframes cartWiggle {
          0%, 85% { transform: rotate(0); }
          88% { transform: rotate(-6deg); }
          91% { transform: rotate(6deg); }
          94% { transform: rotate(-3deg); }
          97%, 100% { transform: rotate(0); }
        }

        @keyframes badgePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-action-finish {
            animation: none !important;
          }
          .hero-action-finish::before {
            display: none !important;
          }
          .hero-cart-icon {
            animation: none !important;
          }
          .hero-cart-badge {
            animation: none !important;
          }
        }
      `}</style>
    </>
  );
}
