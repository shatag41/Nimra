'use client';

import React from 'react';
import Link from 'next/link';

interface CartToastProps {
  visible: boolean;
  name: string;
  onClose: () => void;
}

export function CartToast({ visible, name, onClose }: CartToastProps) {
  return (
    <div className={`cart-toast-banner ${visible ? 'visible' : ''}`}>
      <div className="toast-content">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <span><strong>{name}</strong> added to cart!</span>
      </div>
      <Link href="/cart" className="toast-go-btn" onClick={onClose}>
        Go to Cart →
      </Link>
      <button className="toast-close" onClick={onClose}>✕</button>
    </div>
  );
}
export default CartToast;
