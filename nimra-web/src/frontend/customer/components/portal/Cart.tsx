'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/frontend/customer/hooks/useCart';
import { formatCurrency, FREE_DELIVERY_MINIMUM } from '../../utils/commerce';
import ProductImage from '../ProductImage';

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" /></svg>
);

export function CartItemsList() {
  const { items, updateQuantity, removeItem } = useCart();

  const confirmRemove = (productId: string, name: string) => {
    if (window.confirm(`Remove ${name} from your cart?`)) removeItem(productId);
  };

  return (
    <div className="cart-list" aria-label="Products in your cart">
      <div className="cart-list-heading">
        <div>
          <span className="cart-kicker">Selected products</span>
          <h2>Your items</h2>
        </div>
        <span className="cart-item-count">{items.length} {items.length === 1 ? 'product' : 'products'}</span>
      </div>

      {items.map((item, index) => (
        <article key={item.productId} className="cart-row" style={{ '--cart-index': index } as React.CSSProperties}>
          <div className="cart-thumb">
            <ProductImage src={item.imageUrl} alt={item.name} />
          </div>

          <div className="row-main">
            <span className="product-category">{item.category || 'Premium drinking water'}</span>
            <h3>{item.name}</h3>
            <p>Pure, refreshing NIMRA water for everyday hydration and effortless serving.</p>
            <div className="product-pills">
              {item.volume && <span>{item.volume}</span>}
              {item.category && <span>{item.category}</span>}
              <span className="premium-pill">Premium</span>
            </div>
          </div>

          <div className="cart-quantity-block">
            <span className="cart-column-label">Quantity</span>
            <div className="qty" aria-label={`Quantity for ${item.name}`}>
              <button type="button" onClick={() => updateQuantity(item.productId, item.quantity - 1)} aria-label={`Decrease ${item.name} quantity`}>−</button>
              <span key={item.quantity} className="qty-value" aria-live="polite">{item.quantity}</span>
              <button type="button" onClick={() => updateQuantity(item.productId, item.quantity + 1)} aria-label={`Increase ${item.name} quantity`}>+</button>
            </div>
          </div>

          <div className="cart-price-block">
            <span className="cart-column-label">Unit price</span>
            <strong>{formatCurrency(item.price)}</strong>
            <span className="line-subtotal-label">Subtotal</span>
            <b>{formatCurrency(item.price * item.quantity)}</b>
          </div>

          <div className="cart-row-actions">
            <button type="button" className="remove" onClick={() => confirmRemove(item.productId, item.name)} aria-label={`Remove ${item.name}`}>
              <TrashIcon />
              <span>Remove</span>
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

export function CartSummary() {
  const { subtotal, deliveryCharge, grandTotal } = useCart();
  const [isCheckingOut, setIsCheckingOut] = React.useState(false);
  const amountRemaining = Math.max(0, FREE_DELIVERY_MINIMUM - subtotal);
  const progress = Math.min(100, (subtotal / FREE_DELIVERY_MINIMUM) * 100);

  return (
    <aside className="summary">
      <div className="summary-heading">
        <div>
          <span className="cart-kicker">Your total</span>
          <h2>Order Summary</h2>
        </div>
        <span className="secure-chip">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
          Secure
        </span>
      </div>

      <div className={`delivery-progress ${amountRemaining === 0 ? 'unlocked' : ''}`}>
        <div className="delivery-copy">
          <span className="truck-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M3 5h11v12H3zM14 9h4l3 3v5h-7z"/><circle cx="7" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></svg>
          </span>
          <div>
            <strong>{amountRemaining === 0 ? 'Free delivery unlocked!' : `${formatCurrency(amountRemaining)} away from free delivery`}</strong>
            <span>{amountRemaining === 0 ? 'Your delivery charge is on us.' : 'Add a little more to save on delivery.'}</span>
          </div>
        </div>
        <div className="progress-meta"><span>Delivery reward</span><strong>{Math.round(progress)}%</strong></div>
        <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="summary-lines">
        <div><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
        <div><span>Delivery</span><strong className={!deliveryCharge ? 'free-value' : ''}>{deliveryCharge ? formatCurrency(deliveryCharge) : 'Free'}</strong></div>
        <div><span>Discount</span><strong>{formatCurrency(0)}</strong></div>
        <div><span>Tax</span><strong>Included</strong></div>
      </div>

      <div className="total"><span>Grand Total</span><strong>{formatCurrency(grandTotal)}</strong></div>
      <Link href="/checkout" className={`checkout-button ${isCheckingOut ? 'is-loading' : ''}`} onClick={() => setIsCheckingOut(true)} aria-busy={isCheckingOut}>
        <span>{isCheckingOut ? 'Opening checkout…' : 'Proceed to Checkout'}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
      </Link>
      <p className="summary-note">Secure checkout · Flexible delivery · Quality guaranteed</p>
    </aside>
  );
}
