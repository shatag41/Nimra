'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '@/types/cms';
import { useCart } from '@/frontend/customer/hooks/useCart';
import ProductImage from '../ProductImage';
import { formatCurrency, isOrderable, normalizeCategory, productId, trackProductView } from '../../utils/commerce';

export interface ProductCardProps {
  product: Product;
  onAdd?: (product: Product) => void;
  onViewMore?: (product: Product) => void;
  badgeText?: string;
  priceLabel?: string;
  index?: number;
  disableAnimation?: boolean;
  disableViewTracking?: boolean;
  showCategoryWithBadge?: boolean;
  actionLink?: string;
  actionText?: string;
  descriptionOnly?: boolean;
  showCartBadge?: boolean;
  cartQty?: number;
  onUpdateQuantity?: (productId: string, quantity: number) => void;
}

function ShowcaseCard({ 
  product, 
  index = 0, 
  onViewMore, 
  badgeText,
  priceLabel,
  actionLink,
  actionText = 'View More',
}: ProductCardProps) {
  const cardRef = React.useRef<HTMLElement>(null);
  const [inView, setInView] = React.useState(false);
  
  React.useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.1 });
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const isLeft = index % 2 === 0;
  const description = product.Description || '';
  const maxLen = 60;
  const shortDescription = description.length > maxLen ? description.substring(0, maxLen).trim() + '...' : description;
  const displayBadge = badgeText || normalizeCategory(product.Category);
  
  return (
    <article 
      ref={cardRef} 
      className={`showcase-card glass ${inView ? 'in-view' : ''} ${isLeft ? 'image-left' : 'image-right'}`}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.showcase-btn')) {
          onViewMore && onViewMore(product);
        }
      }}
    >
      <div className="showcase-image-container">
        <div className="showcase-img-wrap">
          <ProductImage src={product.ImageUrl} alt={product.Name} />
        </div>
        <div className="shimmer-sweep"></div>
      </div>
      <div className="showcase-content">
        <div className="showcase-badges">
          <span className="cat-volume">{product.Volume}</span>
          {displayBadge && <span className={displayBadge === 'Best Seller' ? 'prod-badge-best' : 'cat-badge'}>{displayBadge}</span>}
        </div>
        <h3>{product.Name}</h3>
        <p className="card-desc">{shortDescription}</p>
        <div className="showcase-price">{priceLabel || 'Retail Price'} <span>{formatCurrency(Number(product.Price))}</span></div>
        
        {actionLink ? (
          <Link href={actionLink} className="btn btn-primary showcase-btn">
            {actionText}
          </Link>
        ) : (
          <button 
            type="button" 
            className="btn btn-primary showcase-btn"
            onClick={(e) => {
              e.stopPropagation();
              onViewMore && onViewMore(product);
            }}
          >
            {actionText}
          </button>
        )}
      </div>
    </article>
  );
}

function MobilePremiumShowcase(props: any) {
  const { products, cartItemsMap, ...rest } = props;
  return (
    <div className="mobile-premium-showcase">
      {products.map((product: Product, index: number) => {
        const id = productId(product);
        return (
          <ShowcaseCard 
            key={id}
            product={product}
            index={index}
            cartQty={cartItemsMap[id] || 0}
            {...rest}
            badgeText={rest.getBadgeText ? rest.getBadgeText(product, index) : undefined}
            priceLabel={rest.getPriceLabel ? rest.getPriceLabel(product, index) : undefined}
          />
        );
      })}
      
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 768px) {
           .mobile-premium-showcase {
             display: flex;
             flex-direction: column;
             gap: 1.5rem;
             padding: 0.5rem 0 1rem;
           }
           .showcase-card {
             display: grid;
             grid-template-columns: 1fr 1.15fr;
             gap: 1.25rem;
             padding: 1.25rem;
             border-radius: 28px;
             background: linear-gradient(145deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6));
             backdrop-filter: blur(24px);
             box-shadow: 0 12px 36px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8);
             opacity: 0;
             transform: translateY(40px);
             transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.25s ease;
             cursor: pointer;
             border: 1px solid rgba(255,255,255,0.5);
           }
           .showcase-card:active {
             transform: scale(0.97) !important;
             box-shadow: 0 4px 15px rgba(0,0,0,0.04);
           }
           .showcase-card.in-view {
             animation: showcaseFadeUp 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
           }
           .showcase-card.image-right {
             grid-template-columns: 1.15fr 1fr;
           }
           .showcase-card.image-right .showcase-image-container {
             order: 2;
           }
           .showcase-card.image-right .showcase-content {
             order: 1;
           }
           .showcase-image-container {
             position: relative;
             display: flex;
             align-items: center;
             justify-content: center;
             border-radius: 20px;
             background: linear-gradient(145deg, rgba(255,255,255,0.8), rgba(240,245,255,0.4));
             padding: 1rem;
             overflow: hidden;
             box-shadow: inset 0 2px 10px rgba(0,0,0,0.02);
           }
           .showcase-img-wrap {
             position: relative;
             width: 100%;
             aspect-ratio: 3/4;
           }
           .showcase-img-wrap :global(img) {
             object-fit: contain;
             filter: drop-shadow(0 12px 24px rgba(0,0,0,0.12));
             width: 100%;
             height: 100%;
           }
           .in-view .showcase-img-wrap {
             animation: floatBottle 5s ease-in-out infinite alternate;
           }
           .shimmer-sweep {
             position: absolute;
             top: 0;
             left: -150%;
             width: 50%;
             height: 100%;
             background: linear-gradient(to right, transparent, rgba(255,255,255,0.9), transparent);
             transform: skewX(-20deg);
           }
           .in-view .shimmer-sweep {
             animation: shimmer 7s ease-in-out infinite;
             animation-delay: 1.5s;
           }
           .showcase-content {
             display: flex;
             flex-direction: column;
             justify-content: center;
             gap: 0.4rem;
           }
           .showcase-content > * {
             opacity: 0;
             transform: translateY(15px);
           }
           .in-view .showcase-content > * {
             animation: staggerFadeUp 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
           }
           .in-view .showcase-num { animation-delay: 0.1s; }
           .in-view .showcase-badges { animation-delay: 0.2s; }
           .in-view h3 { animation-delay: 0.3s; }
           .in-view .card-desc { animation-delay: 0.4s; }
           .in-view .showcase-price { animation-delay: 0.5s; }
           .in-view .showcase-btn { animation-delay: 0.6s; }
           
           .showcase-num {
             font-size: 0.85rem;
             font-weight: 800;
             color: rgba(59, 130, 246, 0.4);
             letter-spacing: 0.1em;
             margin-bottom: 0.2rem;
           }
           .showcase-badges {
             display: flex;
             flex-wrap: wrap;
             gap: 0.35rem;
             margin-bottom: 0.2rem;
           }
           .showcase-badges span {
             font-size: 0.65rem;
             padding: 0.25rem 0.6rem;
             border-radius: 99px;
             font-weight: 700;
             letter-spacing: 0.02em;
           }
           .showcase-badges .cat-volume {
             background: rgba(59, 130, 246, 0.1);
             color: #2563eb;
           }
           .showcase-content h3 {
             font-size: 1.25rem;
             line-height: 1.15;
             margin: 0;
             color: #1e293b;
             font-weight: 800;
             letter-spacing: -0.01em;
           }
           .showcase-content .card-desc {
             font-size: 0.82rem;
             color: #64748b;
             margin: 0 0 0.4rem;
             line-height: 1.45;
           }
           .showcase-price {
             display: flex;
             flex-direction: column;
             gap: 0;
           }
           .showcase-price { font-size: 0.68rem; color: #94a3b8; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; }
           .showcase-price span { font-size: 1.2rem; color: #0f172a; font-weight: 800; letter-spacing: -0.02em; }
           .showcase-btn {
             margin-top: 0.6rem;
             padding: 0.75rem 1rem;
             font-size: 0.85rem;
             font-weight: 700;
             border-radius: 14px;
             width: 100%;
             text-align: center;
             box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
             transition: all 0.2s ease;
           }
           .showcase-btn:active {
             transform: scale(0.95);
           }
           
           .mobile-showcase-heading {
             transform: translateY(14px);
           }
           
           @keyframes showcaseFadeUp {
             to { opacity: 1; transform: translateY(0); }
           }
           @keyframes staggerFadeUp {
             to { opacity: 1; transform: translateY(0); }
           }
           @keyframes floatBottle {
             0% { transform: translateY(0px) rotate(0deg); }
             50% { transform: translateY(-8px) rotate(2deg); }
             100% { transform: translateY(0px) rotate(0deg); }
           }
           @keyframes shimmer {
             0% { left: -150%; }
             20% { left: 150%; }
             100% { left: 150%; }
           }
           
           /* Dark Mode Adjustments */
           [data-theme="dark"] .mobile-premium-showcase .showcase-card {
             background: linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9));
             box-shadow: 0 12px 36px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05);
             border: 1px solid rgba(255,255,255,0.08);
           }
           [data-theme="dark"] .mobile-premium-showcase .showcase-image-container {
             background: linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
             box-shadow: inset 0 2px 10px rgba(0,0,0,0.3);
           }
           [data-theme="dark"] .mobile-premium-showcase .shimmer-sweep {
             background: linear-gradient(to right, transparent, rgba(255,255,255,0.05), transparent);
           }
           [data-theme="dark"] .mobile-premium-showcase .showcase-num {
             color: rgba(96, 165, 250, 0.7);
           }
           [data-theme="dark"] .mobile-premium-showcase .showcase-badges .cat-volume {
             background: rgba(96, 165, 250, 0.15);
             color: #93c5fd;
           }
           [data-theme="dark"] .mobile-premium-showcase .showcase-content h3 {
             color: #ffffff;
           }
           [data-theme="dark"] .mobile-premium-showcase .showcase-content .card-desc {
             color: #cbd5e1;
           }
           [data-theme="dark"] .mobile-premium-showcase .showcase-price {
             color: #94a3b8;
           }
           [data-theme="dark"] .mobile-premium-showcase .showcase-price span {
             color: #f8fafc;
           }
           [data-theme="dark"] .mobile-premium-showcase .showcase-btn {
             box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
           }
         }
      `}} />
    </div>
  );
}

export const ProductCard = React.memo(function ProductCard({ 
  product, 
  onAdd, 
  onViewMore,
  badgeText,
  priceLabel,
  index = 0,
  disableAnimation = false,
  disableViewTracking = false,
  showCategoryWithBadge = false,
  actionLink,
  actionText = 'View More',
  descriptionOnly = false,
  showCartBadge = true,
  cartQty = 0,
  onUpdateQuantity
}: ProductCardProps) {
  const id = productId(product);
  const inCart = cartQty > 0;
  const orderable = isOrderable(product);

  const handleAdd = () => {
    if (onAdd) {
      onAdd(product);
    }
  };

  const handleIncrease = () => {
    if (inCart) {
      if (onUpdateQuantity) onUpdateQuantity(id, cartQty + 1);
    } else {
      if (onAdd) onAdd(product);
    }
  };

  const handleDecrease = () => {
    if (inCart && onUpdateQuantity) {
      onUpdateQuantity(id, cartQty - 1);
    }
  };

  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (disableViewTracking) return;
    timerRef.current = setTimeout(() => {
      trackProductView(product);
    }, 800);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!disableViewTracking) {
      trackProductView(product);
    }

    const target = e.target as HTMLElement;
    if (!target.closest('.qty-controls') && !target.closest('.add-cart-btn') && !target.closest('.btn-secondary') && !target.closest('.view-cart-link')) {
      if (onViewMore) {
        onViewMore(product);
      }
    }
  };

  const description = product.Description || '';
  const maxLen = 65;
  const isLongDescription = description.length > maxLen;
  const shortDescription = isLongDescription 
    ? description.substring(0, maxLen).trim() + '...' 
    : description;
  
  const hasSpecs = !!product.Specifications;
  const needsViewMore = isLongDescription || hasSpecs;

  const displayBadge = badgeText || normalizeCategory(product.Category);
  const categoryBadge = normalizeCategory(product.Category);
  const displayPriceLabel = priceLabel || (orderable ? 'Retail Price' : 'Expected Price');

  if (process.env.NODE_ENV !== 'production') {
    console.log('[ProductCard] product.ImageUrl before render:', product.ImageUrl);
  }

  return (
    <article 
      className={`catalog-card glass ${inCart ? 'in-cart' : ''} ${disableAnimation ? 'no-auto-motion' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{ 
        cursor: onViewMore ? 'pointer' : 'default', 
        ...(disableAnimation ? {} : { animationDelay: `${index * 0.1}s` })
      }}
    >
      <div className="product-img-wrap">
        <ProductImage src={product.ImageUrl} alt={product.Name} />
        {showCartBadge && inCart && (
          <div className="cart-count-badge">{cartQty}</div>
        )}
      </div>
      <div className="cat-info-box">
        <div className="cat-meta">
          <span className="cat-volume">{product.Volume}</span>
          {displayBadge && <span className={displayBadge === 'Best Seller' ? 'prod-badge-best' : 'cat-badge'}>{displayBadge}</span>}
          {showCategoryWithBadge && badgeText && categoryBadge && categoryBadge !== badgeText && (
            <span className="cat-badge">{categoryBadge}</span>
          )}
        </div>
        <h3>{product.Name}</h3>
        <p className="card-desc">
          {shortDescription}
          {needsViewMore && onViewMore && !descriptionOnly && (
            <button
              type="button"
              className="view-more-text-btn"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (onViewMore) onViewMore(product);
              }}
            >
              View More
            </button>
          )}
        </p>
        <div className="cat-price-row">
          <div>
            <span className="price-lbl">{displayPriceLabel}</span>
            <div className="price-val">{formatCurrency(Number(product.Price))}</div>
          </div>

          {actionLink ? (
            <Link
              href={actionLink}
              className="btn btn-primary btn-sm add-cart-btn featured-view-more-btn"
              onClick={(event) => event.stopPropagation()}
            >
              {actionText}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          ) : orderable ? (
            inCart ? (
              <div className="qty-controls" onClick={(event) => event.stopPropagation()}>
                <button
                  type="button"
                  className="qty-btn qty-minus"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleDecrease();
                  }}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="qty-count">{cartQty}</span>
                <button
                  type="button"
                  className="qty-btn qty-plus"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleIncrease();
                  }}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-sm add-cart-btn"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleAdd();
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
                </svg>
                Add to Cart
              </button>
            )
          ) : (
            <Link href="/contact?subject=RUSH%20Soda%20Launch" className="btn btn-secondary btn-sm">
              Notify Me
            </Link>
          )}
        </div>
      </div>
    </article>
  );
});

export interface ProductSectionProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  products: Product[];
  emptyState?: React.ReactNode;
  limit?: number;
  viewAllLink?: string;
  viewAllText?: string;
  onAdd?: (product: Product) => void;
  onViewMore?: (product: Product) => void;
  getBadgeText?: (product: Product, index: number) => string | undefined;
  getPriceLabel?: (product: Product, index: number) => string | undefined;
  disableAnimation?: boolean;
  disableViewTracking?: boolean;
  compact?: boolean;
  showCategoryWithBadge?: boolean;
  actionLink?: string;
  actionText?: string;
  descriptionOnly?: boolean;
  showCartBadge?: boolean;
  mobileShowcase?: boolean;
}

export function ProductSection({
  title,
  subtitle,
  badge,
  products,
  emptyState,
  limit,
  viewAllLink,
  viewAllText = 'View All Products',
  onAdd,
  onViewMore,
  getBadgeText,
  getPriceLabel,
  disableAnimation,
  disableViewTracking,
  compact,
  showCategoryWithBadge,
  actionLink,
  actionText,
  descriptionOnly,
  showCartBadge = true,
  mobileShowcase = false,
}: ProductSectionProps) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const displayProducts = limit ? products.slice(0, limit) : products;
  const { addProduct, updateQuantity, items } = useCart();

  const cartItemsMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((item) => {
      map[String(item.productId)] = item.quantity;
    });
    return map;
  }, [items]);

  const handleAdd = React.useCallback((product: Product) => {
    addProduct(product);
    if (onAdd) {
      onAdd(product);
    }
  }, [addProduct, onAdd]);

  const handleUpdateQuantity = React.useCallback((productId: string, quantity: number) => {
    updateQuantity(productId, quantity);
  }, [updateQuantity]);

  return (
    <div className={`product-section ${compact ? 'product-section-compact' : ''} ${disableAnimation ? 'product-section-static' : ''}`}>
      {(badge || title || subtitle) && (
        <div className="section-header">
          {badge && <span className="badge badge-primary">{badge}</span>}
          {title && (typeof title === 'string' ? <h2 className={mobileShowcase ? 'mobile-showcase-heading' : ''}>{title}</h2> : title)}
          {subtitle && (typeof subtitle === 'string' ? <p>{subtitle}</p> : subtitle)}
        </div>
      )}

      {mobileShowcase && isMobile && (
        <MobilePremiumShowcase 
          products={displayProducts} 
          onAdd={handleAdd} 
          onUpdateQuantity={handleUpdateQuantity} 
          cartItemsMap={cartItemsMap} 
          onViewMore={onViewMore} 
          getBadgeText={getBadgeText} 
          getPriceLabel={getPriceLabel} 
          actionLink={actionLink} 
          actionText={actionText} 
          showCartBadge={showCartBadge}
        />
      )}

      {displayProducts.length > 0 && (!mobileShowcase || !isMobile) && (
        <div className="catalog-grid">
          {displayProducts.map((product, index) => {
            const id = productId(product);
            return (
              <ProductCard 
                key={id} 
                product={product} 
                index={index}
                onAdd={handleAdd}
                onUpdateQuantity={handleUpdateQuantity}
                cartQty={cartItemsMap[id] || 0}
                onViewMore={onViewMore}
                badgeText={getBadgeText ? getBadgeText(product, index) : undefined}
                priceLabel={getPriceLabel ? getPriceLabel(product, index) : undefined}
                disableAnimation={disableAnimation}
                disableViewTracking={disableViewTracking}
                showCategoryWithBadge={showCategoryWithBadge}
                actionLink={actionLink}
                actionText={actionText}
                descriptionOnly={descriptionOnly}
                showCartBadge={showCartBadge}
              />
            );
          })}
          </div>
      )}
      
      {displayProducts.length === 0 && (
        emptyState || (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No products found</h3>
            <p>Try adjusting your filters or check back later.</p>
          </div>
        )
      )}

      {viewAllLink && displayProducts.length > 0 && (
        <div className="view-all-wrap">
          <Link href={viewAllLink} className="btn btn-secondary btn-lg">
            {viewAllText}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      )}
    </div>
  );
}
