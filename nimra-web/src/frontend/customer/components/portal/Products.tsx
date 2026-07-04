'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '@/types/cms';
import { useCart } from '@/frontend/customer/hooks/useCart';
import ProductImage from '../ProductImage';
import { formatCurrency, isOrderable, normalizeCategory, productId, trackProductView } from '../../utils/commerce';

interface ProductCardProps {
  product: Product;
  onAdd?: (product: Product) => void;
  onViewMore?: (product: Product) => void;
}

export const CatalogCard = React.memo(function CatalogCard({ product, onAdd, onViewMore }: ProductCardProps) {
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
    timerRef.current = setTimeout(() => {
      trackProductView(product);
    }, 800);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    trackProductView(product);

    // If clicking on the card itself, not on control buttons, open the modal
    const target = e.target as HTMLElement;
    if (!target.closest('.qty-controls') && !target.closest('.add-cart-btn') && !target.closest('.btn-secondary') && !target.closest('.view-cart-link')) {
      if (onViewMore) {
        onViewMore(product);
      }
    }
  };

  const description = product.Description || '';
  const maxLen = 150;
  const isLongDescription = description.length > maxLen;
  const shortDescription = isLongDescription 
    ? description.substring(0, maxLen).trim() + '...' 
    : description;
  
  const hasSpecs = !!product.Specifications;
  const needsViewMore = isLongDescription || hasSpecs;

  return (
    <article 
      className={`catalog-card glass ${inCart ? 'in-cart' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{ cursor: onViewMore ? 'pointer' : 'default' }}
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
          <span className="cat-badge">{normalizeCategory(product.Category)}</span>
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
            <span className="price-lbl">{orderable ? 'Retail Price' : 'Expected Price'}</span>
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

export const RecommendationCard = React.memo(function RecommendationCard({ product, onAdd, onViewMore }: ProductCardProps) {
  const { addProduct } = useCart();

  const handleAdd = () => {
    addProduct(product);
    if (onAdd) {
      onAdd(product);
    }
  };

  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => {
      trackProductView(product);
    }, 800);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    trackProductView(product);

    const target = e.target as HTMLElement;
    if (!target.closest('.add-btn')) {
      if (onViewMore) onViewMore(product);
    }
  };

  const description = product.Description || '';
  const shortDescription = description.length > 80 ? description.substring(0, 80).trim() + '...' : description;

  return (
    <div 
      className="rec-card"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{ cursor: onViewMore ? 'pointer' : 'default' }}
    >
      <div className="product-img-wrap">
        <ProductImage src={product.ImageUrl} alt={product.Name} />
      </div>
      <div className="rec-info">
        <span className="rec-vol">{product.Volume}</span>
        <h3>{product.Name}</h3>
        <p className="rec-desc">
          {shortDescription}
          {onViewMore && description.length > 80 && (
            <button
              type="button"
              className="view-more-text-btn"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onViewMore(product);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-color)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: 0,
                marginLeft: '0.25rem',
                cursor: 'pointer'
              }}
            >
              View More
            </button>
          )}
        </p>
        <div className="rec-footer">
          <span className="rec-price">{formatCurrency(Number(product.Price))}</span>
          <button
            type="button"
            className="btn btn-primary btn-sm add-btn"
            onClick={handleAdd}
            style={{ cursor: 'pointer', border: 'none' }}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
});

export const PreviewCard = React.memo(function PreviewCard({ product, index, onViewMore }: ProductCardProps & { index: number }) {
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => {
      trackProductView(product);
    }, 800);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    trackProductView(product);

    const target = e.target as HTMLElement;
    if (!target.closest('.btn')) {
      if (onViewMore) onViewMore(product);
    }
  };

  const description = product.Description || '';
  const maxLen = 100;
  const isLongDescription = description.length > maxLen;
  const shortDescription = isLongDescription 
    ? description.substring(0, maxLen).trim() + '...' 
    : description;

  return (
    <div 
      className="product-preview-card" 
      style={{ 
        animationDelay: `${index * 0.1}s`,
        cursor: onViewMore ? 'pointer' : 'default'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <div className="product-img-wrap">
        <ProductImage src={product.ImageUrl} alt={product.Name} />
        <div className="prod-img-overlay" />
      </div>
      <div className="prod-info-box">
        <div className="prod-meta">
          <span className="prod-vol">{product.Volume}</span>
          {index === 0 && <span className="prod-badge-best">Best Seller</span>}
        </div>
        <h3>{product.Name}</h3>
        <p>
          {shortDescription}
          {onViewMore && (isLongDescription || product.Specifications) && (
            <button
              type="button"
              className="view-more-text-btn"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onViewMore(product);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-color)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: 0,
                marginLeft: '0.25rem',
                cursor: 'pointer'
              }}
            >
              View More
            </button>
          )}
        </p>
        <div className="prod-footer">
          <div>
            <span className="prod-price-label">From</span>
            <span className="prod-price">₹{product.Price}</span>
          </div>
          <Link href={`/products?add=${product.ID}`} className="btn btn-primary btn-sm" onClick={(e) => e.stopPropagation()}>
            Order Now
          </Link>
        </div>
      </div>
    </div>
  );
});
