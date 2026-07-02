'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Product } from '@/types/cms';
import { useCart } from '@/frontend/customer/hooks/useCart';
import { formatCurrency, isOrderable, normalizeCategory, productId } from '../../utils/commerce';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
}

export default function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const { addProduct, updateQuantity, items } = useCart();
  const modalRef = useRef<HTMLDivElement>(null);
  
  const id = productId(product);
  const cartItem = items.find((item) => String(item.productId) === id) ?? null;
  const inCart = cartItem !== null && cartItem.quantity > 0;
  const orderable = isOrderable(product);

  const handleAdd = () => {
    addProduct(product);
  };

  const handleIncrease = () => {
    if (cartItem) {
      updateQuantity(cartItem.productId, cartItem.quantity + 1);
    } else {
      addProduct(product);
    }
  };

  const handleDecrease = () => {
    if (cartItem) {
      updateQuantity(cartItem.productId, cartItem.quantity - 1);
    }
  };

  // Prevent background scrolling while open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Keyboard accessibility: Escape to close and Focus Trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Initial focus on the close button
    const interactive = modalRef.current?.querySelector<HTMLElement>('.modal-close-btn');
    interactive?.focus();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Parse specifications into key-value pairs
  const parsedSpecs = React.useMemo(() => {
    if (!product.Specifications) return [];
    const lines = product.Specifications.split(/[\n;]/).filter(Boolean);
    return lines.map(line => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        return {
          key: parts[0].trim(),
          value: parts.slice(1).join(':').trim()
        };
      }
      return {
        key: 'Specification',
        value: line.trim()
      };
    });
  }, [product.Specifications]);

  return (
    <div className="product-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="product-modal-container" 
        onClick={(e) => e.stopPropagation()} 
        ref={modalRef}
      >
        {/* Sticky Header */}
        <header className="modal-header">
          <div className="modal-header-title">
            <h2>{product.Name}</h2>
          </div>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </header>

        {/* Modal Content Body */}
        <div className="modal-body-wrapper">
          
          {/* Left Column (60% width) - Scrollable Information */}
          <div className="modal-left-scrollable">
            <div className="info-content-block">
              <span className="info-section-title">Product Name</span>
              <h1 className="info-main-title">{product.Name}</h1>
            </div>

            <div className="info-content-block">
              <span className="info-section-title">About this Product</span>
              <p className="info-description">{product.Description}</p>
            </div>

            {parsedSpecs.length > 0 && (
              <div className="info-content-block">
                <span className="info-section-title">Specifications</span>
                <div className="info-specs-grid">
                  {parsedSpecs.map((spec, idx) => (
                    <div key={idx} className="info-spec-item">
                      <span className="spec-label">{spec.key}</span>
                      <span className="spec-val">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {product.ComboPack && (
              <div className="info-content-block">
                <span className="info-section-title">Combo details</span>
                <div className="info-combo-card">
                  <p>{product.ComboPack}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column (40% width) - Elegant Sticky Card */}
          <div className="modal-right-card-container">
            <div className="elegant-action-card">
              
              {/* Product Media Box */}
              <div className="card-media-box">
                {product.ImageUrl ? (
                  <img src={product.ImageUrl} alt={product.Name} className="card-media-img" />
                ) : (
                  <div className="card-media-placeholder">No Image Available</div>
                )}
              </div>

              {/* Badges Row */}
              <div className="card-badges-row">
                <span className="badge-item badge-vol">{product.Volume}</span>
                <span className="badge-item badge-cat">{normalizeCategory(product.Category)}</span>
                {product.StockStatus && (
                  <span className={`badge-item badge-stock ${String(product.StockStatus).toLowerCase().includes('out') ? 'out' : 'in'}`}>
                    {product.StockStatus}
                  </span>
                )}
              </div>

              {/* Pricing Section */}
              <div className="card-pricing-section">
                <span className="pricing-lbl">{orderable ? 'Retail Price' : 'Expected Price'}</span>
                <span className="pricing-val">{formatCurrency(Number(product.Price))}</span>
              </div>

              {/* Action Area (Sticky Add to Cart / Quantity) */}
              <div className="card-actions-wrapper">
                {orderable ? (
                  inCart ? (
                    <div className="card-qty-box">
                      <span className="qty-lbl">Quantity in Cart:</span>
                      <div className="card-qty-controls">
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={handleDecrease}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="qty-count">{cartItem.quantity}</span>
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={handleIncrease}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary card-add-btn"
                      onClick={handleAdd}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
                        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
                      </svg>
                      Add to Cart
                    </button>
                  )
                ) : (
                  <Link href="/contact?subject=RUSH%20Soda%20Launch" className="btn btn-secondary card-add-btn" onClick={onClose}>
                    Notify Me
                  </Link>
                )}

                {inCart && (
                  <Link href="/cart" className="card-view-cart-link" onClick={onClose}>
                    Go to Cart ({cartItem.quantity} item{cartItem.quantity > 1 ? 's' : ''}) →
                  </Link>
                )}
              </div>

            </div>
          </div>

        </div>
      </div>

      <style jsx global>{`
        .product-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(8, 8, 12, 0.55);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          animation: modal-fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .product-modal-container {
          background: var(--bg-primary, #ffffff);
          border: 1px solid rgba(150, 150, 150, 0.15);
          border-radius: 24px;
          width: 100%;
          max-width: 1180px;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(150, 150, 150, 0.05);
          overflow: hidden;
          position: relative;
          animation: modal-scale-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        /* Sticky Header */
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 2rem;
          border-bottom: 1px solid rgba(150, 150, 150, 0.12);
          background: var(--bg-primary, #ffffff);
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .modal-header-title h2 {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
          font-family: var(--font-heading);
          letter-spacing: -0.01em;
        }
        .modal-close-btn {
          background: rgba(150, 150, 150, 0.08);
          border: none;
          color: var(--text-primary);
          width: 32px;
          height: 32px;
          border-radius: 999px;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .modal-close-btn:hover {
          background: rgba(220, 50, 50, 0.12);
          color: #ef4444;
          transform: rotate(90deg);
        }
        .modal-close-btn:focus-visible {
          outline: 2px solid var(--primary-color);
        }

        /* 60/40 Content Layout */
        .modal-body-wrapper {
          flex: 1;
          display: grid;
          grid-template-columns: 1.5fr 1fr; /* 60/40 Split */
          overflow: hidden;
        }

        /* Left Column - Scrollable Details */
        .modal-left-scrollable {
          padding: 2.25rem 2.5rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          scroll-behavior: smooth;
        }
        
        .info-content-block {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .info-section-title {
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
        }
        .info-main-title {
          font-size: 2.25rem;
          font-weight: 850;
          color: var(--text-primary);
          margin: 0;
          line-height: 1.15;
          letter-spacing: -0.03em;
        }
        .info-description {
          font-size: 1rem;
          line-height: 1.6;
          color: var(--text-secondary);
          margin: 0;
          white-space: pre-line;
        }

        /* Specifications Grid: 2-Column layout */
        .info-specs-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem 1.25rem;
          margin-top: 0.25rem;
        }
        .info-spec-item {
          display: flex;
          flex-direction: column;
          padding: 0.75rem 1rem;
          background: rgba(150, 150, 150, 0.04);
          border: 1px solid rgba(150, 150, 150, 0.05);
          border-radius: 12px;
        }
        .spec-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          margin-bottom: 0.15rem;
        }
        .spec-val {
          font-size: 0.92rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .info-combo-card {
          padding: 1rem 1.25rem;
          background: linear-gradient(135deg, rgba(var(--primary-rgb, 0, 102, 204), 0.03), rgba(var(--primary-rgb, 0, 102, 204), 0.08));
          border: 1px solid rgba(var(--primary-rgb, 0, 102, 204), 0.15);
          border-radius: 14px;
          font-size: 0.95rem;
          color: var(--text-secondary);
        }

        /* Right Column - Elegant Sticky Card Container */
        .modal-right-card-container {
          padding: 2.25rem 2rem;
          background: rgba(150, 150, 150, 0.02);
          border-left: 1px solid rgba(150, 150, 150, 0.1);
          display: flex;
          align-items: flex-start;
          justify-content: center;
        }

        .elegant-action-card {
          background: var(--bg-primary, #ffffff);
          border: 1px solid rgba(150, 150, 150, 0.15);
          border-radius: 18px;
          padding: 1.5rem;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          box-shadow: var(--shadow-sm, 0 4px 20px rgba(0, 0, 0, 0.02));
        }

        .card-media-box {
          width: 100%;
          aspect-ratio: 4 / 3;
          border-radius: 12px;
          overflow: hidden;
          background: rgba(150, 150, 150, 0.03);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(150, 150, 150, 0.08);
        }
        .card-media-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 0.5rem;
        }
        .card-media-placeholder {
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        .card-badges-row {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .badge-item {
          font-size: 0.72rem;
          font-weight: 700;
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
        }
        .badge-vol {
          color: var(--primary-color);
          background: rgba(var(--primary-rgb, 0, 102, 204), 0.08);
        }
        .badge-cat {
          color: var(--text-secondary);
          background: rgba(150, 150, 150, 0.08);
        }
        .badge-stock.in {
          color: #10b981;
          background: rgba(16, 185, 129, 0.08);
        }
        .badge-stock.out {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.08);
        }

        .card-pricing-section {
          display: flex;
          flex-direction: column;
        }
        .pricing-lbl {
          font-size: 0.72rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .pricing-val {
          font-size: 2.25rem;
          font-weight: 900;
          color: var(--primary-color);
          font-family: var(--font-heading);
          letter-spacing: -0.03em;
          margin-top: -0.15rem;
        }

        .card-actions-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .card-add-btn {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-weight: 750;
          padding: 0.85rem 1.5rem;
          font-size: 0.95rem;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          transition: transform 0.2s ease, background 0.2s ease;
        }
        .card-add-btn:active {
          transform: scale(0.98);
        }

        .card-qty-box {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .card-qty-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 2px solid var(--primary-color);
          border-radius: 999px;
          background: var(--bg-primary);
          overflow: hidden;
        }
        .qty-btn {
          background: transparent;
          border: none;
          color: var(--primary-color);
          width: 44px;
          height: 38px;
          font-size: 1.2rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
        }
        .qty-btn:hover {
          background: rgba(var(--primary-rgb, 0, 102, 204), 0.08);
        }
        .qty-count {
          font-weight: 800;
          font-size: 1.05rem;
        }

        .card-view-cart-link {
          font-size: 0.82rem;
          color: var(--primary-color);
          font-weight: 700;
          text-align: center;
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .card-view-cart-link:hover {
          opacity: 0.85;
          text-decoration: underline;
        }

        /* Animations */
        @keyframes modal-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modal-scale-in {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        /* Responsive - Stacks Vertically on Mobile/Tablet */
        @media (max-width: 900px) {
          .product-modal-overlay {
            padding: 0.5rem;
          }
          .product-modal-container {
            max-height: 98vh;
            border-radius: 20px;
          }
          .modal-body-wrapper {
            grid-template-columns: 1fr;
            overflow-y: auto;
          }
          .modal-left-scrollable {
            padding: 1.5rem 1.5rem 0 1.5rem;
            overflow-y: visible;
          }
          .modal-right-card-container {
            padding: 1.5rem;
            background: transparent;
            border-left: none;
          }
          .info-main-title {
            font-size: 1.75rem;
          }
          .info-specs-grid {
            grid-template-columns: 1fr;
          }
          .elegant-action-card {
            border: 1px solid rgba(150, 150, 150, 0.12);
          }
        }
      `}</style>
    </div>
  );
}
