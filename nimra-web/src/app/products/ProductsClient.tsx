'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product } from '../../types/cms';
import { useCart } from '../../components/CartProvider';
import { formatCurrency, isOrderable, normalizeCategory } from '../../utils/commerce';

interface ProductsClientProps {
  products: Product[];
}

const categories = [
  { id: 'All', name: 'All Products' },
  { id: 'Packaged Drinking Water', name: 'Packaged Drinking Water' },
  { id: 'Mineral Water', name: 'Mineral Water' },
  { id: 'Bulk Water', name: 'Bulk Water' },
  { id: 'Upcoming RUSH Soda', name: 'RUSH Soda' },
];

export default function ProductsClient({ products }: ProductsClientProps) {
  const [activeTab, setActiveTab] = useState('All');
  const [cartToast, setCartToast] = useState<{ name: string; visible: boolean }>({ name: '', visible: false });
  const { addProduct, updateQuantity, items } = useCart();
  const router = useRouter();

  const filteredProducts = products.filter((product) =>
    activeTab === 'All' ? true : normalizeCategory(product.Category) === activeTab
  );

  const getCartItem = (product: Product) => {
    const id = String(product.ID || product.Name);
    return items.find((item) => item.productId === id) ?? null;
  };

  const handleAdd = (product: Product) => {
    addProduct(product);
    setCartToast({ name: product.Name, visible: true });
    clearTimeout((window as any).__cartToastTimer);
    (window as any).__cartToastTimer = window.setTimeout(() => {
      setCartToast((t) => ({ ...t, visible: false }));
    }, 3000);
  };

  const handleIncrease = (product: Product) => {
    const item = getCartItem(product);
    if (item) {
      updateQuantity(item.productId, item.quantity + 1);
    } else {
      handleAdd(product);
    }
  };

  const handleDecrease = (product: Product) => {
    const item = getCartItem(product);
    if (item) {
      updateQuantity(item.productId, item.quantity - 1);
    }
  };

  return (
    <>
      {/* Cart Added Toast Banner */}
      <div className={`cart-toast-banner ${cartToast.visible ? 'visible' : ''}`}>
        <div className="toast-content">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span><strong>{cartToast.name}</strong> added to cart!</span>
        </div>
        <Link href="/cart" className="toast-go-btn" onClick={() => setCartToast((t) => ({ ...t, visible: false }))}>
          Go to Cart →
        </Link>
        <button className="toast-close" onClick={() => setCartToast((t) => ({ ...t, visible: false }))}>✕</button>
      </div>

      <section className="products-hero">
        <div className="container">
          <span className="badge badge-primary">Products</span>
          <h1>Order NIMRA Water</h1>
          <p>Choose packaged drinking water, mineral water, bulk jars, and future RUSH Soda products managed directly from Google Sheets.</p>
        </div>
      </section>

      <section className="products-catalog-section">
        <div className="container">
          <div className="catalog-tabs">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`tab-btn ${activeTab === category.id ? 'active' : ''}`}
                onClick={() => setActiveTab(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>

          <div className="catalog-grid animate-fade-in">
            {filteredProducts.map((product) => {
              const orderable = isOrderable(product);
              const id = String(product.ID || product.Name);
              const cartItem = getCartItem(product);
              const inCart = cartItem !== null && cartItem.quantity > 0;

              return (
                <article key={id} className={`catalog-card glass ${inCart ? 'in-cart' : ''}`}>
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
                          <div className="qty-controls">
                            <button
                              className="qty-btn qty-minus"
                              onClick={() => handleDecrease(product)}
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="qty-count">{cartItem.quantity}</span>
                            <button
                              className="qty-btn qty-plus"
                              onClick={() => handleIncrease(product)}
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm add-cart-btn"
                            onClick={() => handleAdd(product)}
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
                      <Link href="/cart" className="view-cart-link">
                        View Cart ({cartItem.quantity} item{cartItem.quantity > 1 ? 's' : ''}) →
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <style jsx>{`
        /* ── Cart Toast Banner ── */
        .cart-toast-banner {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%) translateY(120px);
          z-index: 2000;
          display: flex;
          align-items: center;
          gap: 1rem;
          background: var(--bg-primary);
          border: 1px solid var(--primary-color);
          border-radius: var(--radius-xl);
          padding: 0.9rem 1.25rem;
          box-shadow: 0 8px 32px rgba(6, 182, 212, 0.25);
          min-width: 340px;
          max-width: 90vw;
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
          opacity: 0;
          pointer-events: none;
        }
        .cart-toast-banner.visible {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
          pointer-events: auto;
        }
        .toast-content {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          flex: 1;
          color: var(--text-primary);
          font-size: 0.92rem;
        }
        .toast-content svg {
          color: #22c55e;
          flex-shrink: 0;
        }
        .toast-go-btn {
          background: var(--primary-color);
          color: white;
          font-weight: 700;
          font-size: 0.85rem;
          padding: 0.5rem 1rem;
          border-radius: var(--radius-lg);
          white-space: nowrap;
          transition: background var(--transition-fast);
        }
        .toast-go-btn:hover {
          background: var(--accent-color);
        }
        .toast-close {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 1rem;
          padding: 0 0.25rem;
          line-height: 1;
          transition: color var(--transition-fast);
        }
        .toast-close:hover { color: var(--text-primary); }

        /* ── Hero ── */
        .products-hero {
          background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.06) 0%, rgba(var(--secondary-rgb), 0.02) 100%);
          text-align: center;
          padding: 4rem 0 2rem;
          border-bottom: 1px solid var(--border-color);
        }
        .products-hero h1 {
          font-size: 3rem;
          margin-top: 1rem;
          margin-bottom: 1rem;
        }
        .products-hero p {
          max-width: 680px;
          margin: 0 auto;
          color: var(--text-secondary);
          font-size: 1.1rem;
        }

        /* ── Catalog ── */
        .products-catalog-section {
          background-color: var(--bg-secondary);
          padding: 2rem 0;
        }
        .catalog-tabs {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 3rem;
          flex-wrap: wrap;
        }
        .tab-btn {
          padding: 0.75rem 1.4rem;
          border-radius: 999px;
          border: 1px solid var(--border-color);
          background: var(--bg-primary);
          color: var(--text-secondary);
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .tab-btn:hover, .tab-btn.active {
          background: var(--primary-color);
          border-color: var(--primary-color);
          color: white;
          box-shadow: var(--shadow-md);
        }
        .catalog-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }

        /* ── Card ── */
        .catalog-card {
          border-radius: var(--radius-xl);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-md);
          transition: all var(--transition-normal);
          border: 2px solid transparent;
          position: relative;
          z-index: 1;
          isolation: isolate;
        }
        .catalog-card:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-xl);
          z-index: 2;
        }
        .catalog-card.in-cart {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.12), var(--shadow-lg);
        }
        .cat-img-box {
          height: 250px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
          border-radius: var(--radius-lg);
          background: var(--bg-primary);
          overflow: hidden;
        }
        .cat-img-box img {
          max-height: 86%;
          max-width: 86%;
          object-fit: contain;
          border-radius: var(--radius-md);
          transition: transform var(--transition-normal);
        }
        .catalog-card:hover .cat-img-box img {
          transform: scale(1.05);
        }
        .cart-count-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 32px;
          height: 32px;
          border-radius: 999px;
          background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
          color: white;
          font-size: 0.8rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-sm);
          animation: pop-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          pointer-events: none;
        }
        @keyframes pop-in {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .cat-info-box {
          display: flex;
          flex: 1;
          flex-direction: column;
        }
        .cat-info-box h3 {
          font-size: 1.35rem;
          margin-bottom: 0.75rem;
        }
        .cat-info-box p {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 1rem;
        }
        .specs {
          padding: 0.75rem;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          font-size: 0.8rem !important;
        }
        .cat-meta {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
          align-items: center;
          flex-wrap: wrap;
        }
        .cat-volume, .cat-badge {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
        }
        .cat-volume {
          color: var(--primary-color);
          background: rgba(var(--primary-rgb), 0.1);
        }
        .cat-badge {
          color: var(--text-secondary);
          background: var(--bg-primary);
          border: 1px solid var(--border-light);
        }
        .cat-price-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-top: auto;
          border-top: 1px solid var(--border-color);
          padding-top: 1.25rem;
        }
        .price-lbl {
          font-size: 0.75rem;
          color: var(--text-muted);
          display: block;
        }
        .price-val {
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        /* ── Add to Cart Button ── */
        .add-cart-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          white-space: nowrap;
        }
        button.btn {
          border: none;
          cursor: pointer;
        }

        /* ── Quantity Controls ── */
        .qty-controls {
          display: flex;
          align-items: center;
          border: 1.5px solid var(--primary-color);
          border-radius: 999px;
          overflow: hidden;
          background: rgba(var(--primary-rgb), 0.06);
          gap: 0;
        }
        .qty-btn {
          width: 36px;
          height: 36px;
          border: none;
          background: transparent;
          color: var(--primary-color);
          font-size: 1.2rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background var(--transition-fast);
          flex-shrink: 0;
        }
        .qty-btn:hover {
          background: rgba(var(--primary-rgb), 0.15);
        }
        .qty-count {
          min-width: 32px;
          text-align: center;
          font-weight: 800;
          font-size: 1rem;
          color: var(--primary-color);
        }

        /* ── View Cart Link ── */
        .view-cart-link {
          display: block;
          text-align: center;
          margin-top: 0.75rem;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--primary-color);
          padding: 0.5rem;
          border-radius: var(--radius-md);
          background: rgba(var(--primary-rgb), 0.06);
          border: 1px solid rgba(var(--primary-rgb), 0.2);
          transition: all var(--transition-fast);
        }
        .view-cart-link:hover {
          background: rgba(var(--primary-rgb), 0.12);
          border-color: var(--primary-color);
        }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .catalog-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .products-hero h1 { font-size: 2.2rem; }
          .catalog-grid { grid-template-columns: 1fr; }
          .cat-price-row { align-items: flex-start; flex-direction: column; }
          .cart-toast-banner { min-width: unset; width: calc(100vw - 2rem); }
        }
      `}</style>
    </>
  );
}
