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
}

export const ProductCard = React.memo(function ProductCard({ 
  product, 
  onAdd, 
  onViewMore,
  badgeText,
  priceLabel,
  index = 0,
  disableAnimation = false,
  disableViewTracking = false
}: ProductCardProps) {
  const { addProduct, updateQuantity, items } = useCart();
  const id = productId(product);
  const cartItem = items.find((item) => String(item.productId) === id) ?? null;
  const inCart = cartItem !== null && cartItem.quantity > 0;
  const orderable = isOrderable(product);

  const handleAdd = () => {
    addProduct(product);
    if (onAdd) {
      onAdd(product);
    }
  };

  const handleIncrease = () => {
    if (cartItem) {
      updateQuantity(cartItem.productId, cartItem.quantity + 1);
    } else {
      addProduct(product);
      if (onAdd) {
        onAdd(product);
      }
    }
  };

  const handleDecrease = () => {
    if (cartItem) {
      updateQuantity(cartItem.productId, cartItem.quantity - 1);
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

    // If clicking on the card itself, not on control buttons, open the modal
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
  const displayPriceLabel = priceLabel || (orderable ? 'Retail Price' : 'Expected Price');

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
        {inCart && (
          <div className="cart-count-badge">{cartItem.quantity}</div>
        )}
      </div>
      <div className="cat-info-box">
        <div className="cat-meta">
          <span className="cat-volume">{product.Volume}</span>
          {displayBadge && <span className={displayBadge === 'Best Seller' ? 'prod-badge-best' : 'cat-badge'}>{displayBadge}</span>}
        </div>
        <h3>{product.Name}</h3>
        <p className="card-desc">
          {shortDescription}
          {needsViewMore && (
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

          {orderable ? (
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
                <span className="qty-count">{cartItem.quantity}</span>
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

        {inCart && (
          <Link href="/cart" className="view-cart-link" onClick={(event) => event.stopPropagation()}>
            View Cart ({cartItem.quantity} item{cartItem.quantity > 1 ? 's' : ''}) →
          </Link>
        )}
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
}: ProductSectionProps) {
  const displayProducts = limit ? products.slice(0, limit) : products;

  return (
    <div className={`product-section ${compact ? 'product-section-compact' : ''} ${disableAnimation ? 'product-section-static' : ''}`}>
      {(badge || title || subtitle) && (
        <div className="section-header">
          {badge && <span className="badge badge-primary">{badge}</span>}
          {title && (typeof title === 'string' ? <h2>{title}</h2> : title)}
          {subtitle && (typeof subtitle === 'string' ? <p>{subtitle}</p> : subtitle)}
        </div>
      )}

      {displayProducts.length > 0 ? (
        <div className="catalog-grid">
          {displayProducts.map((product, index) => (
            <ProductCard 
              key={productId(product)} 
              product={product} 
              index={index}
              onAdd={onAdd}
              onViewMore={onViewMore}
              badgeText={getBadgeText ? getBadgeText(product, index) : undefined}
              priceLabel={getPriceLabel ? getPriceLabel(product, index) : undefined}
              disableAnimation={disableAnimation}
              disableViewTracking={disableViewTracking}
            />
          ))}
        </div>
      ) : (
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
