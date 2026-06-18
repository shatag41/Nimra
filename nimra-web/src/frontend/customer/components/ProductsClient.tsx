'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Product } from '@/types/cms';
import { useCart } from '@/frontend/customer/hooks/useCart';
import { CatalogCard } from './portal/Products';
import { CartToast } from './portal/Notifications';
import { normalizeCategory } from '../utils/commerce';
import RushSodaPromo from './RushSodaPromo';

interface ProductsClientProps {
  products: Product[];
}

const categoriesData = [
  { id: 'All', name: 'All Products' },
  { id: 'Packaged Drinking Water', name: 'Packaged Drinking Water' },
  { id: 'Mineral Water', name: 'Mineral Water' },
  { id: 'Bulk Water', name: 'Bulk Water' },
  { id: 'Upcoming RUSH Soda', name: 'RUSH Soda' },
];

export default function ProductsClient({ products }: ProductsClientProps) {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'outofstock'>('all');
  const [sizeFilter, setSizeFilter] = useState<'all' | 'jar' | 'bottle'>('all');
  const [cartToast, setCartToast] = useState<{ name: string; visible: boolean }>({ name: '', visible: false });
  const { addProduct } = useCart();
  const cartToastTimer = useRef<number | null>(null);

  const filteredProducts = products.filter((product) => {
    const matchesCategory = activeTab === 'All' ? true : normalizeCategory(product.Category) === activeTab;
    if (!matchesCategory) return false;

    const matchesSearch = searchQuery
      ? product.Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.Description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.Category.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    if (!matchesSearch) return false;

    if (statusFilter === 'available' && !product.Active) return false;
    if (statusFilter === 'outofstock' && product.Active) return false;

    const volumeLower = (product.Volume || '').toLowerCase();
    const isJar = volumeLower.includes('20l') || volumeLower.includes('jar');
    if (sizeFilter === 'jar' && !isJar) return false;
    if (sizeFilter === 'bottle' && isJar) return false;

    return true;
  });

  const showCartToast = useCallback((product: Product) => {
    setCartToast({ name: product.Name, visible: true });
    if (cartToastTimer.current) {
      window.clearTimeout(cartToastTimer.current);
    }
    cartToastTimer.current = window.setTimeout(() => {
      setCartToast((t) => ({ ...t, visible: false }));
      cartToastTimer.current = null;
    }, 3000);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const addId = params.get('add');
      if (addId) {
        const targetProduct = products.find((p) => String(p.ID) === addId);
        if (targetProduct) {
          window.setTimeout(() => {
            addProduct(targetProduct);
            showCartToast(targetProduct);
          }, 0);
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }
      }
    }
  }, [addProduct, products, showCartToast]);

  useEffect(() => {
    return () => {
      if (cartToastTimer.current) {
        window.clearTimeout(cartToastTimer.current);
      }
    };
  }, []);

  return (
    <div className="products-page container">
      <CartToast
        visible={cartToast.visible}
        name={cartToast.name}
        onClose={() => setCartToast((t) => ({ ...t, visible: false }))}
      />

      {/* Page Header */}
      <div className="page-header animate-slide-up">
        <span className="badge badge-primary">Products</span>
        <h1>Our Products</h1>
        <p>Choose packaged drinking water, mineral water, bulk jars, and future RUSH Soda products managed directly from Google Sheets.</p>
      </div>

      <div className="products-layout-grid animate-fade-in">
        {/* Sidebar Filters */}
        <aside className="products-sidebar card">
          <div className="sidebar-section">
            <h3>Categories</h3>
            <div className="filter-options">
              {categoriesData.map((cat) => (
                <label key={cat.id} className="filter-label">
                  <input
                    type="radio"
                    name="category-filter"
                    checked={activeTab === cat.id}
                    onChange={() => setActiveTab(cat.id)}
                    className="filter-radio"
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Availability</h3>
            <div className="filter-options">
              {(
                [
                  { id: 'all', label: 'All Products' },
                  { id: 'available', label: 'Available Now' },
                  { id: 'outofstock', label: 'Upcoming / Out of Stock' },
                ] as const
              ).map((opt) => (
                <label key={opt.id} className="filter-label">
                  <input
                    type="radio"
                    name="status-filter"
                    checked={statusFilter === opt.id}
                    onChange={() => setStatusFilter(opt.id)}
                    className="filter-radio"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Size / Capacity</h3>
            <div className="filter-options">
              {(
                [
                  { id: 'all', label: 'All Sizes' },
                  { id: 'jar', label: 'Bulk Jars (20L)' },
                  { id: 'bottle', label: 'Bottles (250ml - 2L)' },
                ] as const
              ).map((opt) => (
                <label key={opt.id} className="filter-label">
                  <input
                    type="radio"
                    name="size-filter"
                    checked={sizeFilter === opt.id}
                    onChange={() => setSizeFilter(opt.id)}
                    className="filter-radio"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Products List */}
        <main className="products-main-content">
          {/* Top Search Bar */}
          <div className="search-bar-wrapper card">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input
              type="text"
              placeholder="Search products by name, category or size..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button className="search-clear-btn" onClick={() => setSearchQuery('')}>✕</button>
            )}
          </div>

          {activeTab === 'Upcoming RUSH Soda' ? (
            <RushSodaPromo />
          ) : filteredProducts.length > 0 ? (
            <div className="catalog-grid animate-fade-in">
              {filteredProducts.map((product) => (
                <CatalogCard key={String(product.ID || product.Name)} product={product} onAdd={showCartToast} />
              ))}
            </div>
          ) : (
            <div className="empty-products card animate-scale-in">
              <div className="empty-icon-glow">📦</div>
              <h3>No Products Found</h3>
              <p>We couldn&apos;t find any products matching your search query or filters. Try adjusting them!</p>
            </div>
          )}
        </main>
      </div>

      <style jsx global>{`
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

        .products-page {
          padding-top: 0.5rem;
          padding-bottom: 4rem;
          min-height: 90vh;
          font-family: var(--font-body);
        }

        /* ── Page Header ── */
        .page-header {
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-color);
          text-align: center;
        }

        .page-header h1 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.15rem;
          letter-spacing: -0.02em;
          color: var(--text-primary);
        }

        .page-header p {
          color: var(--text-muted);
          margin: 0;
          font-size: 0.875rem;
          line-height: 1.4;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 0.3rem 0.85rem;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.75rem;
        }
        .badge-primary {
          background: rgba(37, 99, 235, 0.1);
          color: var(--primary-color);
          border: 1px solid rgba(37, 99, 235, 0.2);
        }

        /* ── Products Grid Layout ── */
        .products-layout-grid {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 1rem;
          align-items: start;
        }

        /* Sidebar Filters */
        .products-sidebar {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          position: sticky;
          top: 85px;
          z-index: 10;
        }

        .sidebar-section h3 {
          font-size: 0.875rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: var(--text-primary);
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .filter-options {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .filter-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
          cursor: pointer;
          font-weight: 500;
        }

        .filter-radio {
          accent-color: var(--primary-color);
          cursor: pointer;
        }

        /* Main Area */
        .products-main-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        /* Search Bar */
        .search-bar-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          padding: 0.5rem;
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
          margin-bottom: 0.5rem;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          color: var(--text-muted);
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          min-height: 38px;
          padding: 0.5rem 1rem 0.5rem 2.5rem;
          border: none;
          background: transparent;
          color: var(--text-primary);
          font-size: 0.875rem;
        }
        .search-input:focus {
          outline: none;
        }

        .search-clear-btn {
          position: absolute;
          right: 1rem;
          background: rgba(0, 0, 0, 0.05);
          border: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Empty State */
        .empty-products {
          padding: 4rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          border-radius: var(--radius-md);
        }

        .empty-icon-glow {
          font-size: 2.5rem;
          width: 60px;
          height: 60px;
          background: var(--bg-tertiary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.25rem;
          border: 1px solid var(--border-color);
        }

        .empty-products h3 {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .empty-products p {
          color: var(--text-muted);
          max-width: 440px;
          margin: 0 0 0.5rem 0;
          line-height: 1.5;
        }

        /* ── Catalog ── */
        .products-catalog-section {
          background-color: var(--bg-secondary);
          padding: 2rem 0;
        }
        .catalog-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          position: relative;
          z-index: 20;
        }

        /* ── Card ── */
        .catalog-card {
          border-radius: var(--radius-xl);
          padding: 1rem;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-md);
          transition: all var(--transition-normal);
          border: 2px solid transparent;
          position: relative;
          z-index: 1;
          isolation: isolate;
          pointer-events: none;
        }
        .catalog-card button,
        .catalog-card a,
        .catalog-card [role="button"] {
          pointer-events: auto;
        }
        .catalog-card .cat-price-row,
        .catalog-card .qty-controls,
        .catalog-card .view-cart-link,
        .catalog-card .add-cart-btn {
          pointer-events: auto;
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
          height: 160px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
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
          font-size: 1.15rem;
          margin-bottom: 0.5rem;
        }
        .cat-info-box p {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 0.75rem;
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
          gap: 0.75rem;
          margin-top: auto;
          border-top: 1px solid var(--border-color);
          padding-top: 1rem;
          position: relative;
          z-index: 3;
        }
        .price-lbl {
          font-size: 0.75rem;
          color: var(--text-muted);
          display: block;
        }
        .price-val {
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--primary-color);
          font-family: var(--font-heading);
          letter-spacing: -0.02em;
        }

        /* ── Add to Cart Button ── */
        .add-cart-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          white-space: nowrap;
          position: relative;
          z-index: 3;
          pointer-events: auto;
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
          position: relative;
          z-index: 3;
          pointer-events: auto;
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
          position: relative;
          z-index: 3;
          pointer-events: auto;
        }
        .view-cart-link:hover {
          background: rgba(var(--primary-rgb), 0.12);
          border-color: var(--primary-color);
        }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .products-layout-grid {
            grid-template-columns: 1fr;
            gap: 1.25rem;
          }
          .products-sidebar {
            position: static;
          }
        }
        @media (max-width: 1024px) {
          .catalog-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .catalog-grid { grid-template-columns: 1fr; }
          .cat-price-row { align-items: flex-start; flex-direction: column; }
          .cart-toast-banner { min-width: unset; width: calc(100vw - 2rem); }
        }
      `}</style>
    </div>
  );
}
