'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/frontend/customer/hooks/useCart';
import { formatCurrency, FREE_DELIVERY_MINIMUM } from '../../utils/commerce';

export function CartItemsList() {
  const { items, updateQuantity, removeItem } = useCart();

  return (
    <div className="cart-list">
      {items.map((item) => (
        <article key={item.productId} className="cart-row glass">
          <img src={item.imageUrl} alt={item.name} />
          <div className="row-main">
            <span>{item.category} / {item.volume}</span>
            <h3>{item.name}</h3>
            <strong>{formatCurrency(item.price)}</strong>
          </div>
          <div className="qty">
            <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}>-</button>
            <span>{item.quantity}</span>
            <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}>+</button>
          </div>
          <button className="remove" onClick={() => removeItem(item.productId)}>Remove</button>
        </article>
      ))}
    </div>
  );
}

export function CartSummary() {
  const { subtotal, deliveryCharge, grandTotal } = useCart();

  return (
    <aside className="summary glass">
      <h2>Order Summary</h2>
      <div><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
      <div><span>Delivery</span><strong>{deliveryCharge ? formatCurrency(deliveryCharge) : 'Free'}</strong></div>
      {subtotal < FREE_DELIVERY_MINIMUM && (
        <p>Add {formatCurrency(FREE_DELIVERY_MINIMUM - subtotal)} more for free delivery.</p>
      )}
      <div className="total"><span>Grand Total</span><strong>{formatCurrency(grandTotal)}</strong></div>
      <Link href="/checkout" className="btn btn-primary">Checkout</Link>
    </aside>
  );
}
