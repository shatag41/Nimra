'use client';

import React from 'react';
import { Product } from '@/types/cms';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ProductCard } from './Products';
import { productId } from '../../utils/commerce';
import { useAuth } from '../../contexts/AuthContext';
import { readRecentlyViewed, RECENTLY_VIEWED_EVENT } from '../../utils/recentlyViewed';
import { useCart } from '@/frontend/customer/hooks/useCart';

const ProductDetailModal = dynamic(() => import('./ProductDetailModal'), { ssr: false });

interface RecentlyViewedProductsProps {
  products: Product[];
  onAdd?: (product: Product) => void;
}

export function RecentlyViewedProducts({ products }: RecentlyViewedProductsProps) {
  const [viewedProducts, setViewedProducts] = React.useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [mobilePage, setMobilePage] = React.useState(0);
  const touchStartX = React.useRef<number | null>(null);
  const autoplayTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user, isLoading } = useAuth();
  const { addProduct } = useCart();

  const loadViewedProducts = React.useCallback(() => {
    try {
      if (!isLoading) {
        const parsed = readRecentlyViewed(user?.ID);
        const mapped = parsed
          .map((p) => products.find((prod) => String(prod.ID || prod.Name) === String(p.ID || p.Name)))
          .filter((p): p is Product => {
            if (!p) return false;
            const stock = String(p.StockStatus || '').toLowerCase();
            const cat = String(p.Category || '').toLowerCase();
            const isUpcoming = stock.includes('coming') || stock.includes('upcoming') || cat.includes('upcoming');
            return !isUpcoming;
          });
        setViewedProducts(mapped);
      } else {
        setViewedProducts([]);
      }
    } catch (e) {
      console.error('Failed to load recently viewed products:', e);
    }
  }, [isLoading, products, user?.ID]);

  React.useEffect(() => {
    loadViewedProducts();

    // Listen to updates
    window.addEventListener(RECENTLY_VIEWED_EVENT, loadViewedProducts);
    return () => {
      window.removeEventListener(RECENTLY_VIEWED_EVENT, loadViewedProducts);
    };
  }, [loadViewedProducts]);

  const displayedProducts = React.useMemo(() => {
    return viewedProducts;
  }, [viewedProducts]);

  const mobilePages = React.useMemo(() => {
    return displayedProducts.map((product) => [product]);
  }, [displayedProducts]);

  const mobilePageCount = mobilePages.length;

  React.useEffect(() => {
    setMobilePage((page) => Math.min(page, Math.max(mobilePageCount - 1, 0)));
  }, [mobilePageCount]);

  const getViewedTime = (index: number) => {
    const times = ["Viewed 10m ago", "Viewed 35m ago", "Viewed 2h ago", "Viewed Yesterday"];
    return times[index] || "Viewed recently";
  };

  const hasViewedProducts = displayedProducts.length > 0;
  const hasMultipleMobilePages = mobilePageCount > 1;

  const isMobileCarousel = React.useCallback(() => (
    typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  ), []);

  const stopMobileAutoplay = React.useCallback(() => {
    if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }
  }, []);

  const startMobileAutoplay = React.useCallback(() => {
    stopMobileAutoplay();
    if (!hasMultipleMobilePages || !isMobileCarousel()) return;

    autoplayTimerRef.current = setInterval(() => {
      setMobilePage((page) => (page + 1) % mobilePageCount);
    }, 3000);
  }, [hasMultipleMobilePages, isMobileCarousel, mobilePageCount, stopMobileAutoplay]);

  const goToMobilePage = React.useCallback((page: number) => {
    if (mobilePageCount < 1) return;
    setMobilePage(((page % mobilePageCount) + mobilePageCount) % mobilePageCount);
  }, [mobilePageCount]);

  const registerMobileCarouselInteraction = React.useCallback(() => {
    stopMobileAutoplay();

    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }

    if (!hasMultipleMobilePages || !isMobileCarousel()) return;

    resumeTimerRef.current = setTimeout(() => {
      resumeTimerRef.current = null;
      startMobileAutoplay();
    }, 3000);
  }, [hasMultipleMobilePages, isMobileCarousel, startMobileAutoplay, stopMobileAutoplay]);

  const pauseMobileCarouselInteraction = React.useCallback(() => {
    stopMobileAutoplay();
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, [stopMobileAutoplay]);

  const resumeMobileCarouselInteraction = React.useCallback(() => {
    pauseMobileCarouselInteraction();
    if (!hasMultipleMobilePages || !isMobileCarousel()) return;
    resumeTimerRef.current = setTimeout(() => {
      resumeTimerRef.current = null;
      startMobileAutoplay();
    }, 3000);
  }, [hasMultipleMobilePages, isMobileCarousel, pauseMobileCarouselInteraction, startMobileAutoplay]);

  React.useEffect(() => {
    startMobileAutoplay();

    const handleResize = () => {
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = null;
      }
      startMobileAutoplay();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      stopMobileAutoplay();
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = null;
      }
    };
  }, [startMobileAutoplay, stopMobileAutoplay]);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    pauseMobileCarouselInteraction();
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;

    const touchEndX = event.changedTouches[0]?.clientX;
    if (touchEndX === undefined) {
      touchStartX.current = null;
      return;
    }

    const deltaX = touchEndX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(deltaX) < 42) {
      resumeMobileCarouselInteraction();
      return;
    }
    if (deltaX < 0) goToMobilePage(mobilePage + 1);
    if (deltaX > 0) goToMobilePage(mobilePage - 1);
    resumeMobileCarouselInteraction();
  };

  const renderProductCard = (product: Product, index: number) => (
    <ProductCard
      key={productId(product)}
      product={product}
      badgeText={getViewedTime(index)}
      onViewMore={setSelectedProduct}
      disableViewTracking={true}
      index={index}
      onAdd={addProduct}
      showCartBadge={false}
      cartQty={0}
    />
  );

  return (
    <div className="panel recently-viewed-panel" style={{ marginTop: '0.5rem' }}>
      <div className="section-header-row">
        <div className="section-header-left">
          <span className="badge badge-primary premium-history-badge">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginRight: '4px' }}>
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            History
          </span>
          <h2>Recently Viewed Products</h2>
          {hasViewedProducts && <p className="subtitle-text">Continue where you left off</p>}
        </div>
      </div>

      <div className={`recently-viewed-content products-page ${hasViewedProducts ? 'has-products' : 'is-empty'}`}>
        <div className="catalog-grid recently-viewed-product-grid" aria-hidden={!hasViewedProducts}>
          {displayedProducts.map((product, index) => renderProductCard(product, index))}
        </div>
        <div
          className="recently-viewed-mobile-carousel"
          aria-hidden={!hasViewedProducts}
          onPointerDown={pauseMobileCarouselInteraction}
          onPointerUp={resumeMobileCarouselInteraction}
          onPointerCancel={resumeMobileCarouselInteraction}
          onFocusCapture={registerMobileCarouselInteraction}
        >
          <div className={`recently-viewed-mobile-shell ${hasMultipleMobilePages ? 'has-nav' : 'single-page'}`}>
            {hasMultipleMobilePages && (
              <button
                type="button"
                className="recently-viewed-nav recently-viewed-nav-prev"
                onClick={() => {
                  registerMobileCarouselInteraction();
                  goToMobilePage(mobilePage - 1);
                }}
                aria-label="Show previous recently viewed products"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            )}
            <div className="recently-viewed-mobile-viewport" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
              <div className="recently-viewed-mobile-track" style={{ transform: `translateX(-${mobilePage * 100}%)` }}>
                {mobilePages.map((pageProducts, pageIndex) => (
                  <div className="recently-viewed-mobile-page" key={`recent-page-${pageIndex}`}>
                    {pageProducts.map((product, index) => renderProductCard(product, pageIndex + index))}
                  </div>
                ))}
              </div>
            </div>
            {hasMultipleMobilePages && (
              <button
                type="button"
                className="recently-viewed-nav recently-viewed-nav-next"
                onClick={() => {
                  registerMobileCarouselInteraction();
                  goToMobilePage(mobilePage + 1);
                }}
                aria-label="Show next recently viewed products"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            )}
          </div>
          {hasMultipleMobilePages && (
            <div 
              aria-label={`Recently viewed page ${mobilePage + 1} of ${mobilePageCount}`}
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                marginTop: '10px',
                width: '100%',
                padding: '0'
              }}
            >
              {mobilePages.map((_, index) => (
                <div
                  key={`recent-dot-${index}`}
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: index === mobilePage ? '#2563EB' : '#D1D5DB',
                    margin: '0',
                    padding: '0',
                    flex: '0 0 7px',
                    cursor: 'pointer',
                    transition: 'background-color 150ms ease'
                  }}
                  onClick={() => {
                    registerMobileCarouselInteraction();
                    goToMobilePage(index);
                  }}
                  aria-label={`Show recently viewed page ${index + 1}`}
                  aria-current={index === mobilePage ? 'page' : undefined}
                />
              ))}
            </div>
          )}
        </div>
        <div className="premium-empty-state" aria-hidden={hasViewedProducts}>
          <div className="empty-icon-wrap" aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.1 12s3.6-6 9.9-6 9.9 6 9.9 6-3.6 6-9.9 6-9.9-6-9.9-6Z" />
              <circle cx="12" cy="12" r="2.75" />
            </svg>
          </div>
          <h3>No recently viewed products yet</h3>
          <p>Start exploring our products and the items you view will appear here for quick access.</p>
          <Link href="/products" className="empty-cta-btn">
            <span>Browse Products</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </Link>
        </div>
      </div>

      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
        />
      )}

      <style jsx>{`
        .recently-viewed-panel {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          min-height: 390px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(191, 219, 254, 0.45);
          border-radius: 18px;
          box-shadow: 0 4px 18px -2px rgba(37, 99, 235, 0.04), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
          transition: all 250ms ease;
        }
        :global([data-theme="dark"]) .recently-viewed-panel {
          background: rgba(15, 23, 42, 0.75);
          border: 1px solid rgba(59, 130, 246, 0.15);
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.35);
        }
        .recently-viewed-panel:hover {
          box-shadow: 0 10px 24px -4px rgba(37, 99, 235, 0.08), 0 4px 8px -2px rgba(37, 99, 235, 0.03);
          border-color: rgba(37, 99, 235, 0.32);
        }
        :global([data-theme="dark"]) .recently-viewed-panel:hover {
          border-color: rgba(59, 130, 246, 0.35);
        }

        .recently-viewed-content {
          position: relative;
          min-height: 290px;
          flex: 1;
          width: 100% !important;
          max-width: none !important;
        }
        .recently-viewed-product-grid {
          display: grid;
          grid-template-columns: repeat(4, 12.25rem) !important;
          gap: clamp(0.5rem, 0.8vw, 0.7rem) !important;
          justify-content: start !important;
          align-items: stretch !important;
          opacity: 0;
          visibility: hidden;
          transform: translateY(6px);
          transition: opacity 240ms ease, transform 240ms ease, visibility 0s linear 240ms;
        }
        .has-products .recently-viewed-product-grid {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
          transition-delay: 100ms, 100ms, 0s;
        }
        .recently-viewed-product-grid :global(.catalog-card) {
          width: 12.25rem !important;
          max-width: none !important;
          min-width: 12.25rem !important;
          min-height: 0 !important;
          padding: 0.34rem !important;
          border-radius: 0.65rem !important;
        }
        .recently-viewed-product-grid :global(.catalog-card .product-img-wrap) {
          width: calc(100% + 0.68rem) !important;
          height: auto !important;
          margin: -0.34rem -0.34rem 0.28rem !important;
          aspect-ratio: 3 / 4 !important;
          border-bottom: 1px solid rgba(150, 150, 150, 0.15) !important;
        }
        .recently-viewed-product-grid :global(.catalog-card .product-image-container) {
          width: 100% !important;
          height: 100% !important;
          aspect-ratio: 3 / 4 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          overflow: hidden !important;
        }
        .recently-viewed-product-grid :global(.catalog-card .product-img) {
          width: 100% !important;
          height: 100% !important;
          object-fit: contain !important;
          object-position: center !important;
          display: block !important;
        }
        .recently-viewed-product-grid :global(.cat-meta) {
          gap: 0.25rem !important;
          margin-bottom: 0.16rem !important;
        }
        .recently-viewed-product-grid :global(.cat-volume),
        .recently-viewed-product-grid :global(.cat-badge),
        .recently-viewed-product-grid :global(.prod-badge-best) {
          max-width: 100% !important;
          padding: 0.14rem 0.42rem !important;
          font-size: 0.62rem !important;
          line-height: 1.05 !important;
        }
        .recently-viewed-product-grid :global(.cat-info-box h3) {
          min-height: 2.24em !important;
          max-height: 2.24em !important;
          margin-bottom: 0.16rem !important;
          overflow: hidden !important;
          font-size: 0.78rem !important;
          line-height: 1.12 !important;
          -webkit-line-clamp: 2 !important;
        }
        .recently-viewed-mobile-carousel {
          display: none;
        }
        @media (max-width: 1199px) {
          .recently-viewed-product-grid { grid-template-columns: repeat(3, 12.25rem) !important; }
        }
        @media (max-width: 860px) {
          .recently-viewed-product-grid { grid-template-columns: repeat(2, 12.25rem) !important; }
        }
        @media (max-width: 520px) {
          .recently-viewed-product-grid {
            grid-template-columns: 12.25rem !important;
            justify-content: center !important;
          }
        }

        @media (max-width: 768px) {
          .recently-viewed-panel {
            min-height: 0;
            overflow: hidden;
            background: var(--bg-secondary);
          }
          .recently-viewed-content {
            min-height: 0;
            overflow: hidden;
            padding: 0 !important;
            background: transparent !important;
          }
          .recently-viewed-content.is-empty {
            min-height: clamp(18.5rem, 82vw, 21rem);
          }
          .recently-viewed-content.is-empty .premium-empty-state {
            box-sizing: border-box;
            width: 100%;
            min-width: 0;
            min-height: 100%;
            padding: clamp(1.35rem, 6vw, 2rem);
            gap: clamp(0.65rem, 2.8vw, 0.9rem);
            overflow: visible;
          }
          .recently-viewed-content.is-empty .empty-icon-wrap {
            flex: 0 0 auto;
            margin-bottom: 0.15rem;
          }
          .recently-viewed-content.is-empty .premium-empty-state h3,
          .recently-viewed-content.is-empty .premium-empty-state p {
            width: 100%;
            max-width: 22rem;
            height: auto;
            overflow: visible;
            white-space: normal;
            overflow-wrap: anywhere;
          }
          .recently-viewed-content.is-empty .premium-empty-state p {
            margin: 0 0 0.25rem;
          }
          .has-products .recently-viewed-product-grid {
            display: none !important;
          }
          .recently-viewed-mobile-carousel {
            display: block;
            width: 100%;
            max-width: 100%;
            opacity: 0;
            visibility: hidden;
            transform: translateY(6px);
            transition: opacity 240ms ease, transform 240ms ease, visibility 0s linear 240ms;
          }
          .has-products .recently-viewed-mobile-carousel {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
            transition-delay: 100ms, 100ms, 0s;
          }
          .recently-viewed-mobile-shell {
            display: grid;
            grid-template-columns: 2rem minmax(0, 1fr) 2rem;
            align-items: center;
            gap: clamp(0.25rem, 1.8vw, 0.55rem);
            width: 100%;
            max-width: 100%;
          }
          .recently-viewed-mobile-shell.single-page {
            grid-template-columns: minmax(0, 1fr);
          }
          .recently-viewed-mobile-viewport {
            width: 100%;
            max-width: 100%;
            min-width: 0;
            overflow: hidden;
            touch-action: pan-y;
          }
          .recently-viewed-mobile-track {
            display: flex;
            width: 100%;
            will-change: transform;
            transition: transform 340ms cubic-bezier(0.22, 1, 0.36, 1);
          }
          .recently-viewed-mobile-page {
            display: grid;
            grid-template-columns: minmax(0, 1fr);
            min-width: 100%;
            width: 100%;
            align-items: stretch;
            justify-items: center;
            padding: 0.15rem;
            box-sizing: border-box;
          }
          .recently-viewed-mobile-page :global(.catalog-card) {
            width: min(100%, 18rem) !important;
            max-width: 18rem !important;
            min-width: 0 !important;
            height: auto !important;
            display: flex !important;
            flex-direction: column !important;
            padding: 0.55rem !important;
            border-radius: 0.85rem !important;
            background: var(--bg-secondary) !important;
            border: 1px solid var(--border-color) !important;
            box-shadow: var(--shadow-sm) !important;
            overflow: hidden !important;
          }
          .recently-viewed-mobile-page :global(.catalog-card:only-child) {
            width: min(100%, 18rem) !important;
            justify-self: center !important;
          }
          .recently-viewed-mobile-page :global(.catalog-card .product-img-wrap) {
            width: calc(100% + 1.1rem) !important;
            max-width: none !important;
            margin: -0.55rem -0.55rem 0.55rem !important;
            aspect-ratio: 4 / 3 !important;
            background: #ffffff !important;
            overflow: hidden !important;
          }
          .recently-viewed-mobile-page :global(.catalog-card .product-image-container) {
            width: 100% !important;
            height: 100% !important;
            aspect-ratio: 4 / 3 !important;
            background: #ffffff !important;
          }
          .recently-viewed-mobile-page :global(.catalog-card .product-img) {
            width: 100% !important;
            height: 100% !important;
            object-fit: contain !important;
            object-position: center !important;
          }
          .recently-viewed-mobile-page :global(.cat-info-box) {
            display: flex !important;
            flex: 1 1 auto !important;
            flex-direction: column !important;
            min-width: 0 !important;
          }
          .recently-viewed-mobile-page :global(.cat-meta) {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 0.3rem !important;
            margin-bottom: 0.35rem !important;
          }
          .recently-viewed-mobile-page :global(.cat-volume),
          .recently-viewed-mobile-page :global(.cat-badge),
          .recently-viewed-mobile-page :global(.prod-badge-best) {
            max-width: 100% !important;
            padding: 0.16rem 0.45rem !important;
            font-size: 0.64rem !important;
            line-height: 1.15 !important;
            white-space: normal !important;
            overflow-wrap: anywhere;
          }
          .recently-viewed-mobile-page :global(.cat-info-box h3) {
            min-height: 0 !important;
            max-height: none !important;
            margin-bottom: 0.3rem !important;
            font-size: 0.92rem !important;
            line-height: 1.25 !important;
            white-space: normal !important;
            overflow-wrap: anywhere;
          }
          .recently-viewed-mobile-page :global(.cat-info-box p),
          .recently-viewed-mobile-page :global(.card-desc) {
            min-height: 0 !important;
            max-height: 3.9em !important;
            margin-bottom: 0.55rem !important;
            font-size: 0.75rem !important;
            line-height: 1.3 !important;
            -webkit-line-clamp: 3 !important;
            overflow: hidden !important;
          }
          .recently-viewed-mobile-page :global(.cat-price-row) {
            min-height: 2.75rem !important;
            margin-top: auto !important;
            gap: 0.55rem !important;
            padding-top: 0.55rem !important;
            align-items: center !important;
          }
          .recently-viewed-mobile-page :global(.price-lbl) {
            font-size: 0.62rem !important;
            line-height: 1 !important;
          }
          .recently-viewed-mobile-page :global(.price-val) {
            font-size: 1.05rem !important;
            line-height: 1.05 !important;
          }
          .recently-viewed-mobile-page :global(.add-cart-btn.btn-sm),
          .recently-viewed-mobile-page :global(.cat-price-row .btn-sm) {
            min-height: 2.5rem !important;
            padding: 0.45rem 0.7rem !important;
            gap: 0.3rem !important;
            font-size: 0.72rem !important;
            border-radius: 0.65rem !important;
          }
          .recently-viewed-mobile-page :global(.add-cart-btn svg) {
            width: 0.68rem !important;
            height: 0.68rem !important;
          }
          .recently-viewed-mobile-page :global(.qty-controls) {
            min-height: 2.5rem !important;
          }
          .recently-viewed-nav {
            width: 1.9rem;
            height: 2.8rem;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: var(--primary-color);
            background: rgba(255, 255, 255, 0.78);
            border: 1px solid rgba(37, 99, 235, 0.18);
            border-radius: 999px;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.08);
            cursor: pointer;
            transition: opacity 160ms ease, transform 160ms ease, background 160ms ease;
          }
          .recently-viewed-nav:active {
            transform: scale(0.94);
          }
          .recently-viewed-nav:disabled {
            opacity: 0.32;
            cursor: default;
            transform: none;
          }
          :global([data-theme="dark"]) .recently-viewed-nav {
            background: rgba(15, 23, 42, 0.86);
            border-color: rgba(96, 165, 250, 0.22);
            color: #93c5fd;
          }
          .recently-viewed-pagination {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: fit-content;
            margin: 10px auto 0;
            padding: 0;
          }
          .recently-viewed-dot {
            width: 7px;
            height: 7px;
            flex: 0 0 7px;
            min-width: 7px;
            max-width: 7px;
            padding: 0;
            border: 0;
            border-radius: 50%;
            background: rgba(150, 150, 150, 0.45);
            cursor: pointer;
            transition: background 180ms ease;
          }
          .recently-viewed-dot.active {
            background: #2563EB;
          }
          :global([data-theme="dark"]) .recently-viewed-dot {
            background: rgba(150, 150, 150, 0.45);
          }
          :global([data-theme="dark"]) .recently-viewed-dot.active {
            background: var(--primary-color, #3B82F6);
          }
        }
        
        .section-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(191, 219, 254, 0.15);
          padding-bottom: 0.8rem;
          margin-bottom: 0.5rem;
        }
        :global([data-theme="dark"]) .section-header-row {
          border-bottom-color: rgba(255, 255, 255, 0.04);
        }
        .section-header-left h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0.2rem 0 0.1rem 0;
        }
        .subtitle-text {
          font-size: 0.78rem;
          color: var(--text-secondary);
          margin: 0;
        }
        .premium-history-badge {
          display: inline-flex;
          align-items: center;
          background: rgba(37, 99, 235, 0.08);
          color: var(--primary-color);
          border: 1px solid rgba(37, 99, 235, 0.15);
          border-radius: 999px;
          padding: 0.15rem 0.5rem;
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        :global([data-theme="dark"]) .premium-history-badge {
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
          border-color: rgba(59, 130, 246, 0.2);
        }
        
        .view-history-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem 0.85rem;
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--primary-color);
          background: transparent;
          border: 1.5px solid rgba(37, 99, 235, 0.2);
          border-radius: 999px;
          cursor: pointer;
          text-decoration: none;
          transition: all 200ms ease;
        }
        .view-history-btn:hover {
          background: rgba(37, 99, 235, 0.05);
          border-color: var(--primary-color);
          transform: translateY(-1px);
        }
        .view-history-btn svg {
          transition: transform 150ms ease;
        }
        .view-history-btn:hover svg {
          transform: translateX(2px);
        }

        /* ── Product Grid & Custom Cards ── */
        .custom-recently-viewed-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
          gap: 1rem;
          flex: 1;
        }
        .custom-rv-card {
          display: flex;
          flex-direction: column;
          background: var(--bg-secondary);
          border: 1px solid rgba(191, 219, 254, 0.4);
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          position: relative;
          padding: 0.85rem;
          transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px -3px rgba(37, 99, 235, 0.02);
        }
        :global([data-theme="dark"]) .custom-rv-card {
          border-color: rgba(59, 130, 246, 0.12);
        }
        .custom-rv-card:hover {
          transform: translateY(-4px);
          border-color: rgba(37, 99, 235, 0.35);
          box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.02);
        }
        
        .rv-img-container {
          height: 150px;
          width: calc(100% + 1.7rem);
          margin: -0.85rem -0.85rem 0.6rem -0.85rem;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-bottom: 1px solid rgba(191, 219, 254, 0.2);
          overflow: hidden;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        :global([data-theme="dark"]) .rv-img-container {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.25) 0%, rgba(30, 41, 59, 0.2) 100%);
          border-bottom-color: rgba(255, 255, 255, 0.03);
        }
        .rv-img-container :global(img) {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .custom-rv-card:hover .rv-img-container :global(img) {
          transform: scale(1.05);
        }

        /* Overlay Badges */
        .rv-time-badge {
          position: absolute;
          bottom: 8px;
          left: 8px;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(4px);
          color: #ffffff;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          font-size: 0.62rem;
          font-weight: 600;
        }

        .rv-card-body {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .rv-meta-row {
          display: flex;
          gap: 0.3rem;
          margin-bottom: 0.3rem;
        }
        .rv-vol-badge {
          background: rgba(37, 99, 235, 0.08);
          color: var(--primary-color);
          border: 1px solid rgba(37, 99, 235, 0.15);
          border-radius: 999px;
          font-size: 0.62rem;
          font-weight: 700;
          padding: 0.1rem 0.4rem;
        }
        :global([data-theme="dark"]) .rv-vol-badge {
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
          border-color: rgba(59, 130, 246, 0.2);
        }
        .rv-category-badge {
          background: rgba(100, 116, 139, 0.06);
          color: var(--text-secondary);
          border: 1px solid rgba(100, 116, 139, 0.12);
          border-radius: 999px;
          font-size: 0.62rem;
          font-weight: 600;
          padding: 0.1rem 0.4rem;
        }

        .rv-product-name {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 0.25rem 0;
          line-height: 1.25;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .rv-product-desc {
          font-size: 0.74rem;
          color: var(--text-secondary);
          line-height: 1.35;
          margin: 0 0 0.5rem 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Extra Info (stretches cards vertically nicely) */
        .rv-extra-info {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
          margin-bottom: auto; /* Pushes the price/action row to the very bottom */
          padding-bottom: 0.6rem;
        }
        .rv-info-pill {
          background: rgba(16, 185, 129, 0.05);
          color: #059669;
          font-size: 0.65rem;
          font-weight: 600;
          padding: 0.08rem 0.35rem;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
        }

        .rv-price-action-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid rgba(191, 219, 254, 0.12);
          padding-top: 0.65rem;
          margin-top: 0.3rem;
        }
        :global([data-theme="dark"]) .rv-price-action-row {
          border-top-color: rgba(255, 255, 255, 0.03);
        }
        
        .rv-price-box {
          display: flex;
          flex-direction: column;
        }
        .rv-price-lbl {
          font-size: 0.62rem;
          color: var(--text-muted);
          line-height: 1.1;
        }
        .rv-price-val-row {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
        }
        .rv-price-val {
          font-size: 1.05rem;
          font-weight: 800;
          color: var(--primary-color);
        }
        :global([data-theme="dark"]) .rv-price-val {
          color: #60a5fa;
        }
        .rv-price-mrp {
          font-size: 0.68rem;
          color: var(--text-muted);
          text-decoration: line-through;
          opacity: 0.8;
        }

        /* Actions */
        .rv-add-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
          color: #ffffff;
          border: none;
          border-radius: 8px;
          padding: 0.35rem 0.75rem;
          font-size: 0.72rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(37, 99, 235, 0.18);
          transition: all 200ms ease;
        }
        .rv-add-btn:hover {
          background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);
        }
        
        .rv-qty-wrap {
          display: inline-flex;
          align-items: center;
          border: 1px solid rgba(191, 219, 254, 0.6);
          border-radius: 8px;
          background: var(--bg-secondary);
          padding: 0.1rem;
          gap: 0.25rem;
        }
        .rv-qty-btn {
          background: transparent;
          color: var(--text-primary);
          border: none;
          border-radius: 4px;
          width: 22px;
          height: 22px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 150ms ease;
        }
        .rv-qty-btn:hover {
          background: rgba(37, 99, 235, 0.08);
          color: var(--primary-color);
        }
        .rv-qty-count {
          font-size: 0.78rem;
          font-weight: 700;
          min-width: 18px;
          text-align: center;
        }
        
        .rv-view-cart-link {
          display: block;
          text-align: center;
          margin-top: 0.4rem;
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--primary-color);
          text-decoration: none;
        }
        .rv-view-cart-link:hover {
          text-decoration: underline;
        }

        /* Empty State Overhaul */
        .premium-empty-state {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          padding: 1.5rem;
          text-align: center;
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
          transition: opacity 200ms ease, transform 200ms ease, visibility 0s linear 0s;
        }
        .has-products .premium-empty-state {
          opacity: 0;
          visibility: hidden;
          transform: translateY(-6px);
          pointer-events: none;
          transition-delay: 0s, 0s, 200ms;
        }
        .empty-icon-wrap {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: rgba(37, 99, 235, 0.06);
          color: var(--primary-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          box-shadow: 0 4px 10px rgba(37, 99, 235, 0.05);
          margin-bottom: 0.2rem;
        }
        .premium-empty-state h3 {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .premium-empty-state p {
          font-size: 0.82rem;
          color: var(--text-secondary);
          margin: 0 0 0.6rem 0;
          max-width: 340px;
          line-height: 1.45;
        }
        .empty-cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
          color: #ffffff;
          padding: 0.5rem 1.1rem;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 700;
          text-decoration: none;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
          transition: all 200ms ease;
        }
        .empty-cta-btn:hover {
          transform: translateY(-1.5px);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.25);
        }
      `}</style>
    </div>
  );
}
