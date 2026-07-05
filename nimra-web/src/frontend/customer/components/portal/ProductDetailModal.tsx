'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Product } from '@/types/cms';
import { useCart } from '@/frontend/customer/hooks/useCart';
import { formatCurrency, isOrderable, normalizeCategory, productId } from '../../utils/commerce';
import ProductImage from '../ProductImage';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
}

interface ParsedSpecification {
  key: string | null;
  value: string;
}

function specificationValueToText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(specificationValueToText).filter(Boolean).join(', ');
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function parseProductSpecifications(value: unknown): ParsedSpecification[] {
  if (value == null || value === '') return [];

  if (Array.isArray(value)) {
    return value.flatMap((item) => parseProductSpecifications(item));
  }

  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, entryValue]) => ({ key: key.trim() || null, value: specificationValueToText(entryValue) }))
      .filter((spec) => spec.value.length > 0);
  }

  const rawText = specificationValueToText(value);
  if (!rawText) return [];

  // Sheets and APIs sometimes return a JSON-encoded array or object.
  if (rawText.startsWith('[') || rawText.startsWith('{')) {
    try {
      const decoded: unknown = JSON.parse(rawText);
      return parseProductSpecifications(decoded);
    } catch {
      // Treat invalid JSON as ordinary specification text.
    }
  }

  const specs: ParsedSpecification[] = [];
  const isMarkdownTable = rawText.includes('|') && rawText.includes('---');

  if (isMarkdownTable) {
    const tokens = rawText.split(/[|\n]/)
      .map((token) => token.trim())
      .filter((token) => token.length > 0 && !/^:?-{3,}:?$/.test(token));

    const dataTokens = tokens.filter((token) => {
      const lower = token.toLowerCase();
      return !['specification', 'details', 'value', 'feature', 'specifications'].includes(lower);
    });

    for (let index = 0; index < dataTokens.length; index += 2) {
      specs.push({
        key: index + 1 < dataTokens.length ? dataTokens[index] : null,
        value: index + 1 < dataTokens.length ? dataTokens[index + 1] : dataTokens[index],
      });
    }

    return specs;
  }

  const lines = rawText.split(/[\n;]/).map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    let matched = false;
    for (const separator of [':', ' - ', '|']) {
      const parts = line.split(separator);
      if (parts.length >= 2) {
        specs.push({ key: parts[0].trim(), value: parts.slice(1).join(separator).trim() });
        matched = true;
        break;
      }
    }

    if (!matched) specs.push({ key: null, value: line });
  }

  return specs;
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
  const parsedSpecs = React.useMemo(
    () => parseProductSpecifications(product.Specifications as unknown),
    [product.Specifications]
  );

  const modal = (
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
          
          {/* Left Column (55% width) - Scrollable Information */}
          <div className="modal-left-scrollable">
            <div className="info-content-block">
              <h1 className="info-main-title">{product.Name}</h1>
            </div>

            <div className="info-content-block">
              <span className="info-section-title">Description</span>
              <p className="info-description">{product.Description}</p>
            </div>

            {parsedSpecs.length > 0 && (
              <div className="info-content-block">
                <span className="info-section-title">Specifications</span>
                <div className="info-specs-grid">
                  {parsedSpecs.map((spec, idx) => (
                    <div key={idx} className="info-spec-item" style={{ gridColumn: spec.key ? 'auto' : '1 / -1' }}>
                      {spec.key && <span className="spec-label">{spec.key}</span>}
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

          {/* Right Column (45% width) - Sticky Card */}
          <div className="modal-right-sticky">
            <div className="elegant-action-card">
              
              {/* Product Media Box — 4:5 portrait, matches all product cards */}
              <div className="card-media-box">
                <ProductImage src={product.ImageUrl || ''} alt={product.Name} />
              </div>

              <div className="card-content-box">
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
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
      </div>

      <style jsx global>{`
        .product-modal-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          animation: modal-fade-in 0.3s ease-out forwards;
        }

        .product-modal-container {
          background: var(--bg-primary, #ffffff);
          border-radius: 16px;
          width: min(850px, 92vw);
          max-width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          position: relative;
          margin: 0;
          animation: modal-scale-in 0.3s ease-out forwards;
        }

        /* Sticky Header */
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 24px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          background: var(--bg-primary, #ffffff);
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .modal-header-title {
          display: flex;
          align-items: center;
        }
        .modal-header-title h2 {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
          font-family: var(--font-heading);
          letter-spacing: -0.01em;
          line-height: 1.2;
        }
        .modal-close-btn {
          background: rgba(0, 0, 0, 0.04);
          border: none;
          color: var(--text-primary);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          font-size: 0.85rem;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          margin: 0;
          align-self: center;
        }
        .modal-close-btn:hover {
          background: rgba(220, 50, 50, 0.1);
          color: #ef4444;
          transform: rotate(90deg);
        }

        /* 55/45 Content Layout */
        .modal-body-wrapper {
          flex: 1;
          display: flex;
          flex-direction: row;
          overflow: hidden;
        }

        /* Left Column - Scrollable Details */
        .modal-left-scrollable {
          flex: 1.2;
          padding: 20px 24px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          scroll-behavior: smooth;
        }
        
        .info-content-block {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .info-section-title {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }
        .info-main-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          line-height: 1.2;
          letter-spacing: -0.01em;
        }
        .info-description {
          font-size: 0.85rem;
          line-height: 1.4;
          color: var(--text-secondary);
          margin: 0;
          white-space: pre-line;
        }

        /* Specifications Grid: 2-Column Key-Value Layout */
        .info-specs-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.25rem;
          margin-top: 0.25rem;
        }
        .info-spec-item {
          display: flex;
          align-items: flex-start;
          gap: 0.4rem;
          padding: 0.35rem 0.6rem;
          background: #fdfdfd;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 6px;
        }
        .spec-label {
          flex: 0 0 38%;
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--text-muted);
          margin-bottom: 0;
        }
        .spec-val {
          flex: 1;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .info-combo-card {
          padding: 0.75rem 1rem;
          background: rgba(var(--primary-rgb, 0, 102, 204), 0.05);
          border: 1px solid rgba(var(--primary-rgb, 0, 102, 204), 0.1);
          border-radius: 8px;
          font-size: 0.85rem;
          color: var(--text-primary);
          font-weight: 500;
        }

        /* Right Column - Sticky Container */
        .modal-right-sticky {
          flex: 1;
          background: #fbfbfc;
          border-left: 1px solid rgba(0, 0, 0, 0.05);
          position: relative;
          overflow-y: auto;
        }

        .elegant-action-card {
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: sticky;
          top: 0;
        }

        /* Product Media Box — strict 4:5 portrait, matching every product card */
        .card-media-box {
          width: 100%;
          aspect-ratio: 3 / 4;
          border-radius: 8px;
          overflow: hidden;
          background: var(--product-img-bg, #f4f6f8);
          border: 1px solid rgba(0, 0, 0, 0.04);
          box-shadow: 0 2px 10px rgba(0,0,0,0.02);
        }
        .card-media-box .product-image-container {
          border-radius: 0 !important;
          background: transparent !important;
        }
        .card-media-box:hover .product-img {
          transform: scale(1.04);
        }

        .card-content-box {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .card-badges-row {
          display: flex;
          gap: 0.35rem;
          flex-wrap: wrap;
        }
        .badge-item {
          font-size: 0.6rem;
          font-weight: 700;
          padding: 0.15rem 0.4rem;
          border-radius: 999px;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }
        .badge-vol {
          color: var(--primary-color);
          background: rgba(var(--primary-rgb, 0, 102, 204), 0.1);
        }
        .badge-cat {
          color: var(--text-secondary);
          background: rgba(0, 0, 0, 0.05);
        }
        .badge-stock.in {
          color: #059669;
          background: #d1fae5;
        }
        .badge-stock.out {
          color: #dc2626;
          background: #fee2e2;
        }

        .card-pricing-section {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }
        .pricing-lbl {
          font-size: 0.7rem;
          color: var(--text-muted);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .pricing-val {
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--text-primary);
          font-family: var(--font-heading);
          letter-spacing: -0.02em;
          line-height: 1;
        }

        .card-actions-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .card-add-btn {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          font-weight: 700;
          padding: 0.5rem 1rem;
          font-size: 0.8rem;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 10px rgba(var(--primary-rgb, 0, 102, 204), 0.15);
        }
        .card-add-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 12px rgba(var(--primary-rgb, 0, 102, 204), 0.2);
        }
        .card-add-btn:active {
          transform: translateY(0);
        }

        .card-qty-box {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .qty-lbl {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .card-qty-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 2px solid var(--primary-color);
          border-radius: 6px;
          background: #ffffff;
          overflow: hidden;
          height: 2rem;
        }
        .qty-btn {
          background: transparent;
          border: none;
          color: var(--primary-color);
          width: 2rem;
          height: 100%;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .qty-btn:hover {
          background: rgba(var(--primary-rgb, 0, 102, 204), 0.08);
        }
        .qty-count {
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--text-primary);
        }

        .card-view-cart-link {
          font-size: 0.8rem;
          color: var(--primary-color);
          font-weight: 600;
          text-align: center;
          text-decoration: none;
          transition: opacity 0.2s;
          padding: 0.25rem;
        }
        .card-view-cart-link:hover {
          opacity: 0.8;
          text-decoration: underline;
        }

        /* Animations */
        @keyframes modal-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modal-scale-in {
          from { transform: scale(0.98) translateY(5px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }

        /* Responsive - Stacks Vertically on Mobile/Tablet */
        @media (max-width: 1024px) {
          .product-modal-overlay {
            padding: 12px;
          }
          .product-modal-container {
            width: 95vw;
            max-height: 90vh;
            border-radius: 12px;
          }
          .modal-header {
            padding: 12px 16px;
          }
          .modal-body-wrapper {
            flex-direction: column;
            overflow-y: auto;
          }
          .modal-left-scrollable {
            flex: none;
            padding: 16px;
            overflow-y: visible;
          }
          .modal-right-sticky {
            flex: none;
            border-left: none;
            border-top: 1px solid rgba(0, 0, 0, 0.05);
            overflow-y: visible;
          }
          .elegant-action-card {
            padding: 16px;
            position: static;
          }
          .info-main-title {
            font-size: 1.25rem;
          }
          .info-specs-grid {
            grid-template-columns: 1fr;
          }
          .pricing-val {
            font-size: 1.6rem;
          }
        }
      `}</style>
    </div>
  );

  if (typeof document === 'undefined') return modal;
  return createPortal(modal, document.body);
}

