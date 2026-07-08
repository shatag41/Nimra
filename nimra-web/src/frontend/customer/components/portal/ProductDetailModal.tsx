'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [localQty, setLocalQty] = useState(1);

  const id = productId(product);
  const cartItem = items.find((item) => String(item.productId) === id) ?? null;
  const inCart = cartItem !== null && cartItem.quantity > 0;
  const orderable = isOrderable(product);

  const handleAdd = () => {
    addProduct(product, localQty);
  };

  const handleBuyNow = () => {
    addProduct(product, localQty);
    onClose();
    router.push('/cart');
  };

  const handleIncrease = () => {
    if (cartItem) {
      updateQuantity(cartItem.productId, cartItem.quantity + 1);
    } else {
      setLocalQty((prev) => prev + 1);
    }
  };

  const handleDecrease = () => {
    if (cartItem) {
      updateQuantity(cartItem.productId, cartItem.quantity - 1);
    } else {
      setLocalQty((prev) => Math.max(1, prev - 1));
    }
  };

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

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
    const interactive = modalRef.current?.querySelector<HTMLElement>('.pdm-close-btn');
    interactive?.focus();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const parsedSpecs = React.useMemo(
    () => parseProductSpecifications(product.Specifications as unknown),
    [product.Specifications]
  );

  const retailPrice = Number(product.Price) || 0;
  const mrpPrice = Math.round(retailPrice * 1.15) || 0;
  const savings = mrpPrice - retailPrice;
  const discountPercent = mrpPrice > 0 ? Math.round((savings / mrpPrice) * 100) : 0;
  const stockIsOut = String(product.StockStatus || '').toLowerCase().includes('out');

  const modal = (
    <div className="pdm-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={`Product details: ${product.Name}`}>
      <div
        className="pdm-container"
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
      >
        <button
          type="button"
          className="pdm-close-btn"
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg width="14" height="14" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.8536 2.85355C13.0488 2.65829 13.0488 2.34171 12.8536 2.14645C12.6583 1.95118 12.3417 1.95118 12.1464 2.14645L7.5 6.79289L2.85355 2.14645C2.65829 1.95118 2.34171 1.95118 2.14645 2.14645C1.95118 2.34171 1.95118 2.65829 2.14645 2.85355L6.79289 7.5L2.14645 12.1464C1.95118 12.3417 1.95118 12.6583 2.14645 12.8536C2.34171 13.0488 2.65829 13.0488 2.85355 12.8536L7.5 8.20711L12.1464 12.8536C12.3417 13.0488 12.6583 13.0488 12.8536 12.8536C13.0488 12.6583 13.0488 12.3417 12.8536 12.1464L8.20711 7.5L12.8536 2.85355Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
          </svg>
        </button>

        <div className="pdm-body">
          {/* Left Column: Details Column (Scrollable) */}
          <div className="pdm-details-column">
            <div className="pdm-details-scroll-content">
              {/* Brand */}
              <span className="pdm-detail-brand">NIMRA PREMIUM</span>

              {/* Product Name */}
              <h2 className="pdm-detail-name">{product.Name}</h2>

              {/* Category */}
              <span className="pdm-detail-category">{normalizeCategory(product.Category)}</span>

              {/* Description */}
              <div className="pdm-detail-section">
                <h4 className="pdm-section-title">Description</h4>
                <p className="pdm-detail-description">
                  {product.Description || 'Premium mineral drinking water, purified and balanced for everyday hydration.'}
                </p>
              </div>

              {/* Specifications */}
              <div className="pdm-detail-section">
                <h4 className="pdm-section-title">Specifications</h4>
                <div className="pdm-spec-tags">
                  {parsedSpecs.length > 0 ? (
                    parsedSpecs.map((spec, idx) => (
                      <span key={idx} className="pdm-spec-tag">
                        <span className="pdm-tag-icon">✓</span>
                        <span className="pdm-tag-text">
                          {spec.key ? `${spec.key}: ` : ''}{spec.value}
                        </span>
                      </span>
                    ))
                  ) : (
                    <>
                      <span className="pdm-spec-tag">
                        <span className="pdm-tag-icon">✓</span>
                        <span className="pdm-tag-text">BPA Free</span>
                      </span>
                      <span className="pdm-spec-tag">
                        <span className="pdm-tag-icon">✓</span>
                        <span className="pdm-tag-text">Food Grade</span>
                      </span>
                      <span className="pdm-spec-tag">
                        <span className="pdm-tag-icon">✓</span>
                        <span className="pdm-tag-text">Recyclable</span>
                      </span>
                      <span className="pdm-spec-tag">
                        <span className="pdm-tag-icon">✓</span>
                        <span className="pdm-tag-text">Tamper Proof</span>
                      </span>
                      <span className="pdm-spec-tag">
                        <span className="pdm-tag-icon">✓</span>
                        <span className="pdm-tag-text">Leak Resistant</span>
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Additional Details */}
              <div className="pdm-detail-section">
                <h4 className="pdm-section-title">Additional Details</h4>
                <p className="pdm-detail-description">
                  Purified through an advanced multi-stage filtration process including reverse osmosis, micron filtration, and ozonation to deliver crisp, fresh taste and optimal hydration.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Image & Purchase Column (Fixed) */}
          <div className="pdm-image-column">
            <div className="pdm-image-wrapper">
              <div className="pdm-image-zoom-container">
                <ProductImage
                  src={product.ImageUrl || ''}
                  alt={product.Name}
                  style={{ aspectRatio: 'auto', width: '100%', height: '100%', background: 'transparent' }}
                  imgStyle={{ objectFit: 'contain', padding: '0px' }}
                />
              </div>
            </div>
            
            <div className="pdm-purchase-block">
              <div className="pdm-image-badges">
                {product.StockStatus && (
                  <span className={`pdm-badge-premium pdm-badge-stock ${stockIsOut ? 'out' : 'in'}`}>
                    <span className="pdm-dot">●</span> {stockIsOut ? 'OUT OF STOCK' : 'IN STOCK'}
                  </span>
                )}
                {product.Volume && (
                  <span className="pdm-badge-premium pdm-badge-volume">
                    {product.Volume} Bottle
                  </span>
                )}
                <span className="pdm-badge-premium pdm-badge-category">
                  {normalizeCategory(product.Category)}
                </span>
              </div>

              <div className="pdm-price-row-left">
                <span className="pdm-price-current">{formatCurrency(retailPrice)}</span>
              </div>

              {orderable && (
                <div className="pdm-qty-row-left">
                  <div className="pdm-qty-control">
                    <button
                      type="button"
                      className="pdm-qty-btn-premium"
                      onClick={handleDecrease}
                      disabled={localQty <= 1 && !inCart}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="pdm-qty-value-premium">{inCart && cartItem ? cartItem.quantity : localQty}</span>
                    <button
                      type="button"
                      className="pdm-qty-btn-premium"
                      onClick={handleIncrease}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              <div className="pdm-actions-row-left">
                {orderable ? (
                  inCart ? (
                    <div className="pdm-action-buttons">
                      <Link href="/cart" className="pdm-btn pdm-btn-primary-gradient" onClick={onClose}>
                        <span>Go to Cart</span>
                        <span className="pdm-btn-arrow">→</span>
                      </Link>
                      <button type="button" className="pdm-btn pdm-btn-secondary-glass" onClick={onClose}>
                        <span>Continue Shopping</span>
                      </button>
                    </div>
                  ) : (
                    <div className="pdm-action-buttons">
                      <button type="button" className="pdm-btn pdm-btn-primary-gradient" onClick={handleAdd}>
                        <span>Add to Cart</span>
                        <span className="pdm-btn-arrow">→</span>
                      </button>
                      <button type="button" className="pdm-btn pdm-btn-secondary-glass" onClick={handleBuyNow}>
                        <span>Buy Now</span>
                      </button>
                    </div>
                  )
                ) : (
                  <div className="pdm-action-buttons">
                    <Link href={`/contact?subject=Notify%20Me%20-%20${encodeURIComponent(product.Name)}`} className="pdm-btn pdm-btn-primary-gradient" onClick={onClose}>
                      <span>Notify Me</span>
                      <span className="pdm-btn-arrow">→</span>
                    </Link>
                    <button type="button" className="pdm-btn pdm-btn-secondary-glass" onClick={onClose}>
                      <span>Continue Shopping</span>
                    </button>
                  </div>
                )}
                {inCart && cartItem && (
                  <span className="pdm-cart-hint-premium">
                    {cartItem.quantity} {cartItem.quantity === 1 ? 'item' : 'items'} currently in your cart
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .pdm-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10, 20, 45, 0.45);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px;
          animation: pdm-fade-in 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .pdm-container {
          position: relative;
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.6);
          border-radius: 24px;
          width: 62vw;
          max-width: 840px;
          height: 72vh;
          max-height: 620px;
          overflow: hidden;
          box-shadow:
            0 4px 24px rgba(0, 0, 0, 0.03),
            0 16px 40px rgba(37, 99, 235, 0.08),
            inset 0 0 0 1px rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          animation: pdm-scale-in 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        :global([data-theme="dark"]) .pdm-container {
          background: rgba(13, 27, 56, 0.85);
          border-color: rgba(59, 130, 246, 0.15);
          box-shadow: 
            0 4px 24px rgba(0, 0, 0, 0.3),
            0 25px 60px rgba(0, 0, 0, 0.45),
            inset 0 0 0 1px rgba(255, 255, 255, 0.05);
        }

        .pdm-body {
          display: grid;
          grid-template-columns: 55% 45%;
          height: 100%;
          overflow: hidden;
        }

        /* Right Column - Fixed Image Column with Purchase Controls */
        .pdm-image-column {
          position: relative;
          height: 100%;
          overflow: hidden;
          background: linear-gradient(150deg, rgba(245, 248, 255, 0.8) 0%, rgba(230, 238, 255, 0.8) 100%);
          border-left: 1px solid rgba(191, 219, 254, 0.4);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 12px 14px;
          gap: 6px;
          box-sizing: border-box;
        }

        :global([data-theme="dark"]) .pdm-image-column {
          background: linear-gradient(150deg, rgba(16, 28, 54, 0.9) 0%, rgba(20, 35, 69, 0.8) 100%);
          border-left-color: rgba(59, 130, 246, 0.15);
        }

        .pdm-image-wrapper {
          width: 100%;
          max-width: 150px; /* Portrait container max-width */
          aspect-ratio: 3 / 4; /* Portrait Frame */
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(191, 219, 254, 0.3);
          box-shadow: inset 0 2px 8px rgba(37, 99, 235, 0.03);
          overflow: hidden;
          position: relative;
          box-sizing: border-box;
        }

        :global([data-theme="dark"]) .pdm-image-wrapper {
          background: rgba(10, 21, 43, 0.4);
          border-color: rgba(59, 130, 246, 0.1);
        }

        .pdm-image-zoom-container {
          width: 95%; /* occupy 90-95% of container */
          height: 95%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .pdm-image-wrapper:hover .pdm-image-zoom-container {
          transform: scale(1.06);
        }

        .pdm-purchase-block {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 6px;
          align-items: center;
        }

        .pdm-image-badges {
          display: flex;
          flex-wrap: wrap; /* allow wrapping if narrow */
          justify-content: center;
          gap: 4px;
          width: 100%;
        }

        .pdm-badge-premium {
          font-size: 10px; /* reduced font-size to fit */
          font-weight: 700;
          height: 24px; /* 24px height */
          display: inline-flex;
          align-items: center;
          padding: 0 8px; /* Reduced horizontal padding */
          border-radius: 99px;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          box-sizing: border-box;
          white-space: nowrap; /* prevent text wrapping to double lines */
        }

        .pdm-badge-stock {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .pdm-badge-stock.in {
          color: #059669;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.18);
        }

        .pdm-badge-stock.out {
          color: #dc2626;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.18);
        }

        .pdm-badge-volume {
          color: var(--primary-color, #2563eb);
          background: rgba(37, 99, 235, 0.06);
          border: 1px solid rgba(37, 99, 235, 0.15);
        }

        :global([data-theme="dark"]) .pdm-badge-volume {
          color: #60a5fa;
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.2);
        }

        .pdm-badge-category {
          color: #475569;
          background: rgba(71, 85, 105, 0.06);
          border: 1px solid rgba(71, 85, 105, 0.15);
        }

        :global([data-theme="dark"]) .pdm-badge-category {
          color: #94a3b8;
          background: rgba(148, 163, 184, 0.08);
          border-color: rgba(148, 163, 184, 0.15);
        }

        .pdm-dot {
          font-size: 7px;
          margin-right: 2px;
        }

        .pdm-price-row-left {
          display: flex;
          justify-content: center;
          width: 100%;
        }

        .pdm-price-current {
          font-size: 1.75rem; /* Reduced to look elegant and compact */
          font-weight: 850;
          color: var(--primary-color, #2563eb);
          letter-spacing: -0.04em;
          text-shadow: 0 2px 10px rgba(37, 99, 235, 0.08);
          margin: 0; /* Minimized top/bottom margin */
        }

        :global([data-theme="dark"]) .pdm-price-current {
          color: #60a5fa;
          text-shadow: 0 2px 10px rgba(96, 165, 250, 0.15);
        }

        .pdm-qty-row-left {
          display: flex;
          justify-content: center;
          width: 100%;
        }

        /* Quantity controls */
        .pdm-qty-control {
          display: inline-flex;
          align-items: center;
          background: rgba(37, 99, 235, 0.04);
          border: 1px solid rgba(191, 219, 254, 0.35);
          border-radius: 12px;
          padding: 2px;
          width: 120px; /* Reduced width */
          height: 36px; /* Reduced height */
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.02);
          justify-content: space-between;
        }

        :global([data-theme="dark"]) .pdm-qty-control {
          background: rgba(59, 130, 246, 0.05);
          border-color: rgba(59, 130, 246, 0.12);
        }

        .pdm-qty-btn-premium {
          background: transparent;
          border: none;
          color: var(--primary-color, #2563eb);
          width: 28px;
          height: 28px;
          border-radius: 50%;
          font-size: 0.95rem; /* Reduced icon size */
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 180ms ease;
        }

        :global([data-theme="dark"]) .pdm-qty-btn-premium {
          color: #60a5fa;
        }

        .pdm-qty-btn-premium:hover:not(:disabled) {
          background: rgba(37, 99, 235, 0.08);
          transform: scale(1.06);
        }

        .pdm-qty-btn-premium:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .pdm-qty-value-premium {
          font-size: 0.85rem;
          font-weight: 800;
          color: var(--text-primary, #0f172a);
          text-align: center;
        }

        :global([data-theme="dark"]) .pdm-qty-value-premium {
          color: #f8fafc;
        }

        .pdm-actions-row-left {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
          max-width: 170px; /* Reduced width to match compact styling */
        }

        .pdm-action-buttons {
          display: flex;
          flex-direction: column;
          gap: 6px; /* Compact spacing */
          width: 100%;
        }

        .pdm-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          height: 36px; /* Reduced button height */
          font-size: 13px; /* Reduced font-size */
          font-weight: 700;
          border-radius: 99px;
          cursor: pointer;
          text-decoration: none;
          transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          width: 100%;
          line-height: 1;
        }

        .pdm-btn-primary-gradient {
          color: #ffffff;
          background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%);
          box-shadow: 0 3px 10px rgba(37, 99, 235, 0.15);
        }

        .pdm-btn-primary-gradient:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 14px rgba(37, 99, 235, 0.25);
          background: linear-gradient(135deg, #1e40af 0%, #1d4ed8 50%, #2563eb 100%);
        }

        .pdm-btn-primary-gradient:active {
          transform: scale(0.97);
        }

        .pdm-btn-secondary-glass {
          color: var(--primary-color, #2563eb);
          background: rgba(37, 99, 235, 0.04);
          border: 1px solid rgba(37, 99, 235, 0.15);
        }

        :global([data-theme="dark"]) .pdm-btn-secondary-glass {
          color: #60a5fa;
          background: rgba(59, 130, 246, 0.06);
          border-color: rgba(59, 130, 246, 0.18);
        }

        .pdm-btn-secondary-glass:hover {
          background: rgba(37, 99, 235, 0.08);
          border-color: rgba(37, 99, 235, 0.25);
          transform: translateY(-1px);
        }

        .pdm-btn-secondary-glass:active {
          transform: scale(0.97);
        }

        .pdm-btn-arrow {
          transition: transform 180ms ease;
        }

        .pdm-btn:hover .pdm-btn-arrow {
          transform: translateX(2px);
        }

        .pdm-cart-hint-premium {
          text-align: center;
          font-size: 0.68rem;
          color: var(--text-muted, #94a3b8);
          font-weight: 600;
          margin-top: 2px;
        }

        /* Right Column - Scrollable Details Column */
        .pdm-details-column {
          height: 100%;
          overflow-y: auto;
          padding: 32px;
          display: flex;
          flex-direction: column;
          scrollbar-width: thin;
          scrollbar-color: rgba(37, 99, 235, 0.2) transparent;
        }

        .pdm-details-column::-webkit-scrollbar {
          width: 4px;
        }
        .pdm-details-column::-webkit-scrollbar-thumb {
          background-color: rgba(37, 99, 235, 0.15);
          border-radius: 2px;
        }

        .pdm-details-scroll-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .pdm-detail-brand {
          font-size: 0.65rem;
          font-weight: 850;
          letter-spacing: 0.15em;
          color: var(--primary-color, #2563eb);
          text-transform: uppercase;
          display: block;
        }

        :global([data-theme="dark"]) .pdm-detail-brand {
          color: #60a5fa;
        }

        .pdm-detail-name {
          font-size: 1.8rem; /* Premium Title size */
          font-weight: 800;
          color: var(--text-primary, #0f172a);
          line-height: 1.2;
          letter-spacing: -0.02em;
          font-family: var(--font-heading, inherit);
        }

        :global([data-theme="dark"]) .pdm-detail-name {
          color: #f8fafc;
        }

        .pdm-detail-category {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-muted, #64748b);
          margin-top: -8px;
        }

        .pdm-detail-section {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .pdm-section-title {
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted, #94a3b8);
        }

        .pdm-detail-description {
          font-size: 0.88rem;
          line-height: 1.5;
          color: var(--text-secondary, #334155);
          margin: 0;
          white-space: pre-line;
        }

        :global([data-theme="dark"]) .pdm-detail-description {
          color: #cbd5e1;
        }

        /* Specifications chips */
        .pdm-spec-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .pdm-spec-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          background: rgba(37, 99, 235, 0.04);
          border: 1px solid rgba(37, 99, 235, 0.1);
          border-radius: 99px;
          font-size: 0.68rem;
          font-weight: 600;
          color: var(--primary-color, #2563eb);
          transition: all 200ms ease;
        }

        :global([data-theme="dark"]) .pdm-spec-tag {
          background: rgba(59, 130, 246, 0.05);
          border-color: rgba(59, 130, 246, 0.12);
          color: #60a5fa;
        }

        .pdm-spec-tag:hover {
          background: rgba(37, 99, 235, 0.07);
          transform: translateY(-1px);
        }

        .pdm-tag-icon {
          color: #10b981;
          font-weight: 800;
          font-size: 0.7rem;
        }

        /* Close Button styling */
        .pdm-close-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(0, 0, 0, 0.08);
          color: var(--text-primary, #1e293b);
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 100;
          transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.05);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        :global([data-theme="dark"]) .pdm-close-btn {
          background: rgba(20, 35, 69, 0.8);
          border-color: rgba(255, 255, 255, 0.08);
          color: #f1f5f9;
        }

        .pdm-close-btn:hover {
          background: #ef4444;
          color: #ffffff;
          border-color: #ef4444;
          transform: rotate(90deg) scale(1.06);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
        }

        /* Keyframes */
        @keyframes pdm-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes pdm-scale-in {
          from { transform: scale(0.97); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }

        /* Responsive Breakpoints */
        @media (max-width: 1024px) {
          .pdm-overlay {
            padding: 24px;
          }
          .pdm-container {
            width: 78vw;
            height: 72vh;
            max-height: 600px;
          }
          .pdm-body {
            grid-template-columns: 55% 45%;
          }
          .pdm-image-column {
            padding: 16px;
          }
          .pdm-details-column {
            padding: 24px;
          }
        }

        @media (max-width: 640px) {
          .pdm-overlay {
            padding: 0;
            align-items: flex-end;
          }

          .pdm-container {
            border-radius: 20px 20px 0 0;
            height: 85vh;
            max-height: 85vh;
            max-width: 100vw;
            width: 100vw;
            animation: pdm-slide-up 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }

          .pdm-body {
            grid-template-columns: 1fr;
            grid-template-rows: auto auto 1fr;
            height: 100%;
            overflow-y: auto;
          }

          .pdm-image-column {
            height: auto;
            padding: 16px;
            border-right: none;
            border-bottom: 1px solid rgba(191, 219, 254, 0.3);
            gap: 12px;
          }

          :global([data-theme="dark"]) .pdm-image-column {
            border-bottom-color: rgba(59, 130, 246, 0.15);
          }

          .pdm-image-wrapper {
            height: 180px;
          }

          .pdm-purchase-block {
            gap: 10px;
          }

          .pdm-details-column {
            height: auto;
            overflow-y: visible;
            padding: 20px;
            border-top: 1px solid rgba(191, 219, 254, 0.2);
          }

          .pdm-close-btn {
            top: 8px;
            right: 8px;
            width: 30px;
            height: 30px;
          }
        }

        @keyframes pdm-slide-up {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </div>
  );

  if (typeof document === 'undefined') return modal;
  return createPortal(modal, document.body);
}

