'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '@/types/cms';
import { useCart } from '@/frontend/customer/hooks/useCart';
import { formatCurrency, isOrderable, normalizeCategory } from '../../utils/commerce';

interface ProductCardProps {
  product: Product;
  onAdd?: (product: Product) => void;
}

export const CatalogCard = React.memo(function CatalogCard({ product, onAdd }: ProductCardProps) {
  const { addProduct, updateQuantity, items } = useCart();
  const id = String(product.ID || product.Name);
  const cartItem = items.find((item) => item.productId === id) ?? null;
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

  return (
    <article className={`catalog-card glass ${inCart ? 'in-cart' : ''}`}>
      <div className="cat-img-box">
        <img src={product.ImageUrl} alt={product.Name} />
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
        <p>{product.Description}</p>
        {product.Specifications && <p className="specs">{product.Specifications}</p>}
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

export const RecommendationCard = React.memo(function RecommendationCard({ product, onAdd }: ProductCardProps) {
  const { addProduct } = useCart();

  const handleAdd = () => {
    addProduct(product);
    if (onAdd) {
      onAdd(product);
    }
  };

  return (
    <div className="rec-card">
      <div className="rec-img-box">
        <img src={product.ImageUrl} alt={product.Name} />
      </div>
      <div className="rec-info">
        <span className="rec-vol">{product.Volume}</span>
        <h3>{product.Name}</h3>
        <p className="rec-desc">{product.Description.substring(0, 80)}...</p>
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

export const PreviewCard = React.memo(function PreviewCard({ product, index }: ProductCardProps & { index: number }) {
  return (
    <div className="product-preview-card" style={{ animationDelay: `${index * 0.1}s` }}>
      <div className="prod-img-box">
        <img src={product.ImageUrl} alt={product.Name} loading="lazy" />
        <div className="prod-img-overlay" />
      </div>
      <div className="prod-info-box">
        <div className="prod-meta">
          <span className="prod-vol">{product.Volume}</span>
          {index === 0 && <span className="prod-badge-best">Best Seller</span>}
        </div>
        <h3>{product.Name}</h3>
        <p>{product.Description.substring(0, 90)}...</p>
        <div className="prod-footer">
          <div>
            <span className="prod-price-label">From</span>
            <span className="prod-price">₹{product.Price}</span>
          </div>
          <Link href={`/products?add=${product.ID}`} className="btn btn-primary btn-sm">
            Order Now
          </Link>
        </div>
      </div>
    </div>
  );
});
