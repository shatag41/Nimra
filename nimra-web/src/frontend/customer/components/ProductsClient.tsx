'use client';

import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Product } from '@/types/cms';
import { useCMSData } from '@/frontend/customer/hooks/useCMSData';
import { useCart } from '@/frontend/customer/hooks/useCart';
import { ProductCard } from './portal/Products';
import { normalizeCategory } from '../utils/commerce';
import { UpcomingProducts } from './UpcomingProducts';
import CustomerPageHeader from './CustomerPageHeader';
import ProductsFilters, { ProductSizeFilter, ProductStatusFilter } from './ProductsFilters';
import ProductsSearchBar from './ProductsSearchBar';

const ProductDetailModal = dynamic(() => import('./portal/ProductDetailModal'), { ssr: false });

interface ProductsClientProps {
  products: Product[];
}

const isUpcomingProduct = (product: Product) => {
  const stockStatus = String(product.StockStatus || '');
  return normalizeCategory(product.Category) === 'Upcoming RUSH Soda' || /coming|soon|upcoming|pre.?launch/i.test(stockStatus);
};

const isActiveProduct = (product: Product) => {
  if (product.Active === false || String(product.Active).toLowerCase() === 'false' || String(product.Active) === '0') {
    return false;
  }
  return true;
};

export default function ProductsClient({ products: initialProducts }: ProductsClientProps) {
  const { products: dynamicProducts, error: fetchError } = useCMSData({ products: initialProducts });
  const products = dynamicProducts && dynamicProducts.length > 0 ? dynamicProducts : initialProducts;

  useEffect(() => {
    if (fetchError) {
      console.error('[ProductsClient] Error fetching live products from backend:', fetchError);
    }
    if (dynamicProducts && dynamicProducts.length > 0) {
      console.log('[ProductsClient] Loaded live products from backend:', dynamicProducts.length, 'items');
    }
  }, [dynamicProducts, fetchError]);

  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const upcomingProductsList = useMemo(() => {
    return products.filter((p) => {
      const stock = String(p.StockStatus || '').toLowerCase();
      const cat = String(p.Category || '').toLowerCase();
      return stock.includes('coming') || stock.includes('upcoming') || cat.includes('upcoming');
    });
  }, [products]);
  const [statusFilter, setStatusFilter] = useState<ProductStatusFilter>('all');
  const [sizeFilter, setSizeFilter] = useState<ProductSizeFilter>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { addProduct } = useCart();
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const processedAddIdRef = useRef<string | null>(null);
  const handleCategoryChange = useCallback((value: string) => setActiveTab(value), []);
  const handleStatusChange = useCallback((value: ProductStatusFilter) => setStatusFilter(value), []);
  const handleSizeChange = useCallback((value: ProductSizeFilter) => setSizeFilter(value), []);
  const handleSearchChange = useCallback((value: string) => setSearchQuery(value), []);
  const handleClearFilters = useCallback(() => {
    setActiveTab('All');
    setStatusFilter('all');
    setSizeFilter('all');
  }, []);

  const filteredProducts = useMemo(() => products.filter((product) => {
    // Hide inactive products from customer view
    if (!isActiveProduct(product)) return false;

    const matchesCategory = activeTab === 'All' ? true : normalizeCategory(product.Category) === activeTab;
    if (!matchesCategory) return false;

    const normalizedSearch = deferredSearchQuery.trim().toLowerCase();
    const matchesSearch = normalizedSearch
      ? product.Name.toLowerCase().includes(normalizedSearch) ||
        (product.Description || '').toLowerCase().includes(normalizedSearch) ||
        product.Category.toLowerCase().includes(normalizedSearch)
      : true;
    if (!matchesSearch) return false;

    const isUpcoming = isUpcomingProduct(product);
    if (statusFilter === 'available' && isUpcoming) return false;
    if (statusFilter === 'upcoming' && !isUpcoming) return false;

    const volumeLower = (product.Volume || '').toLowerCase();
    const isJar = volumeLower.includes('20l') || volumeLower.includes('jar');
    if (sizeFilter === 'jar' && !isJar) return false;
    if (sizeFilter === 'bottle' && isJar) return false;

    return true;
  }), [activeTab, deferredSearchQuery, products, sizeFilter, statusFilter]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const addId = params.get('add');
      if (addId && processedAddIdRef.current !== addId) {
        processedAddIdRef.current = addId;
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
        const targetProduct = products.find((p) => String(p.ID) === addId);
        if (targetProduct) {
          addProduct(targetProduct);
        }
      }
    }
  }, [addProduct, products]);

  return (
    <div className="products-page container">
      <CustomerPageHeader
        className="products-page-header"
        badge="PRODUCTS"
        title="Explore Our Products"
        subtitle="Premium packaged drinking water for every need."
      />

      <div className="products-layout-grid">
        <ProductsFilters
          category={activeTab}
          status={statusFilter}
          size={sizeFilter}
          onCategoryChange={handleCategoryChange}
          onStatusChange={handleStatusChange}
          onSizeChange={handleSizeChange}
          isMobileOpen={mobileFiltersOpen}
          onMobileToggle={() => setMobileFiltersOpen((open) => !open)}
          onClearAll={handleClearFilters}
        />

        {/* Main Products List */}
        <main className="products-main-content">
          {/* Top Search Bar */}
          <ProductsSearchBar value={searchQuery} onChange={handleSearchChange} products={products} />

          {activeTab === 'Upcoming RUSH Soda' ? (
            <UpcomingProducts upcomingProducts={upcomingProductsList} />
          ) : filteredProducts.length > 0 ? (
            <div className="catalog-grid products-catalog-grid">
              {filteredProducts.map((product, index) => (
                <ProductCard 
                  key={String(product.ID || product.Name)} 
                  product={product} 
                  index={index}
                  disableAnimation
                  onAdd={addProduct}
                  onViewMore={setSelectedProduct}
                />
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

      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
        />
      )}

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

        .products-page .search-suggestions button:focus-visible,
        .products-page .search-suggestions button:active,
        .products-page .search-suggestions button.active {
          background: rgba(var(--primary-rgb), 0.14) !important;
          box-shadow: inset 3px 0 0 var(--primary-color), 0 3px 10px rgba(var(--primary-rgb), 0.1) !important;
          transform: translateX(2px) !important;
          outline: none !important;
        }

        .products-page .search-suggestions button:focus-visible span,
        .products-page .search-suggestions button:active span,
        .products-page .search-suggestions button.active span {
          color: var(--primary-color) !important;
        }

        @media (hover: hover) and (pointer: fine) {
          .products-page .search-suggestions button:hover {
            background: rgba(var(--primary-rgb), 0.14) !important;
            box-shadow: inset 3px 0 0 var(--primary-color), 0 3px 10px rgba(var(--primary-rgb), 0.1) !important;
            transform: translateX(2px) !important;
          }

          .products-page .search-suggestions button:hover span {
            color: var(--primary-color) !important;
          }
        }

        .products-page {
          padding-top: 0;
          padding-bottom: 2rem;
          font-family: var(--font-body);
        }

        .mobile-filter-bar,
        .mobile-selected-filters {
          display: none;
        }

        .products-filter-area {
          min-width: 0;
        }

        /* ── Products Grid Layout ── */
        .products-layout-grid {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 1.5rem;
          align-items: start;
        }

        /* Sidebar Filters */
        .products-sidebar {
          background: var(--bg-primary);
          border: 1px solid rgba(150, 150, 150, 0.15);
          border-radius: var(--radius-lg);
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          position: sticky;
          top: 80px;
          z-index: 10;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
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
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.65rem;
          min-height: 38px;
          padding: 0.5rem 0.6rem;
          border: 1px solid transparent;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          color: var(--text-secondary);
          cursor: pointer;
          font-weight: 600;
          transition: color var(--transition-fast), background var(--transition-fast), border-color var(--transition-fast);
        }

        .filter-label:hover {
          color: var(--text-primary);
          background: var(--bg-secondary);
          border-color: var(--border-color);
        }

        .filter-label:has(.filter-radio:checked) {
          color: var(--primary-color);
          background: rgba(var(--primary-rgb), 0.08);
          border-color: rgba(var(--primary-rgb), 0.25);
        }

        .filter-radio {
          position: absolute;
          width: 1px;
          height: 1px;
          opacity: 0;
          pointer-events: none;
        }

        .filter-radio-control {
          width: 17px;
          height: 17px;
          border: 1.5px solid var(--text-muted);
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 17px;
          background: var(--bg-primary);
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast), background var(--transition-fast);
        }

        .filter-radio-control::after {
          content: '';
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: white;
          transform: scale(0);
          transition: transform var(--transition-fast);
        }

        .filter-radio:checked + .filter-radio-control {
          border-color: var(--primary-color);
          background: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.12);
        }

        .filter-radio:checked + .filter-radio-control::after {
          transform: scale(1);
        }

        .filter-radio:focus-visible + .filter-radio-control {
          outline: 2px solid var(--primary-color);
          outline-offset: 3px;
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
          padding: 0.4rem;
          border: 1px solid rgba(150, 150, 150, 0.15);
          background: var(--bg-primary);
          border-radius: var(--radius-lg);
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
          margin: 0 auto 0.5rem auto;
          width: 100%;
          max-width: 70%;
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
        .catalog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(190px, 220px));
          gap: 0.7rem;
          justify-content: start;
          position: relative;
          z-index: 20;
          align-items: stretch;
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
          .search-bar-wrapper {
            max-width: 100%;
          }
        }
        @media (max-width: 1024px) {
          .catalog-grid {
            grid-template-columns: repeat(auto-fill, minmax(160px, 190px));
          }
        }
        @media (max-width: 640px) {
          .catalog-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.65rem;
          }
          .cat-price-row { align-items: flex-start; flex-direction: column; }
          .cart-toast-banner { min-width: unset; width: calc(100vw - 2rem); }
        }

        @media (max-width: 768px) {
          .products-page.container {
            width: calc(100% - 0.75rem) !important;
            max-width: none !important;
            padding: 0 0 1.25rem !important;
          }

          .products-main-content > .search-bar-wrapper {
            display: flex !important;
            grid-area: search;
            width: 100% !important;
            height: 2.75rem !important;
            min-height: 2.75rem !important;
            margin: 0 !important;
          }

          .products-main-content > .search-bar-wrapper .search-input {
            min-height: 2.3rem !important;
            padding-right: 0.55rem !important;
            font-size: 0.82rem !important;
          }

          .products-main-content > .search-bar-wrapper .search-input::-webkit-search-cancel-button {
            margin-right: 0;
          }

          .products-main-content > .search-bar-wrapper .search-clear-btn {
            display: none !important;
          }

          .products-main-content > .search-bar-wrapper .search-icon {
            display: block !important;
            left: 0.85rem !important;
            width: 1rem !important;
            height: 1rem !important;
            color: var(--primary-color) !important;
            stroke: currentColor;
            stroke-width: 2.25;
            z-index: 1;
          }

          .products-page .products-layout-grid {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) 2.75rem !important;
            grid-template-areas:
              "search filter"
              "panel panel"
              "catalog catalog";
            gap: 0.35rem 0.4rem !important;
            width: 100%;
          }

          .products-filter-area {
            display: contents;
          }

          .mobile-filter-bar {
            display: contents;
          }

          .mobile-filter-toggle {
            position: relative;
            grid-area: filter;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 2.75rem;
            min-width: 2.75rem;
            height: 2.75rem;
            min-height: 2.75rem;
            padding: 0;
            border: 1px solid var(--border-color);
            border-radius: 0.72rem;
            background: var(--bg-primary);
            color: var(--text-primary);
            box-shadow: 0 3px 10px rgba(0,0,0,0.035);
            font: inherit;
          }

          .mobile-filter-toggle[aria-expanded="true"] {
            border-color: rgba(var(--primary-rgb), 0.48);
            background: rgba(var(--primary-rgb), 0.12);
            color: var(--primary-color);
            box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.16), inset 0 0 0 1px rgba(var(--primary-rgb), 0.08);
          }

          [data-theme="dark"] .mobile-filter-toggle[aria-expanded="true"] {
            border-color: rgba(96, 165, 250, 0.5);
            background: rgba(37, 99, 235, 0.24);
            color: #93c5fd;
          }

          .mobile-filter-label,
          .mobile-filter-chevron {
            display: none;
          }

          .mobile-filter-count {
            position: absolute;
            top: -0.22rem;
            right: -0.22rem;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 1.25rem;
            height: 1.25rem;
            border-radius: 999px;
            background: var(--primary-color);
            color: white;
            font-size: 0.68rem;
          }

          .mobile-clear-filters {
            display: none;
          }

          .mobile-selected-filters {
            display: none;
          }

          .mobile-selected-filters::-webkit-scrollbar { display: none; }
          .mobile-selected-filters span {
            flex: 0 0 auto;
            max-width: 13rem;
            padding: 0.24rem 0.5rem;
            overflow: hidden;
            border: 1px solid rgba(var(--primary-rgb), 0.22);
            border-radius: 999px;
            background: rgba(var(--primary-rgb), 0.07);
            color: var(--primary-color);
            font-size: 0.66rem;
            font-weight: 700;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .products-page .products-sidebar {
            grid-area: panel;
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            min-height: 0 !important;
            max-height: 0;
            width: 100% !important;
            margin: 0;
            padding: 0 0.5rem !important;
            gap: 0.5rem !important;
            overflow: hidden;
            visibility: hidden;
            opacity: 0;
            border-width: 0;
            border-bottom: 0 solid rgba(var(--primary-rgb), 0.18);
            box-shadow: none;
            transform: translateY(-0.25rem);
            pointer-events: none;
            transition:
              max-height 240ms ease,
              padding 240ms ease,
              margin 240ms ease,
              opacity 180ms ease,
              transform 240ms ease,
              border-width 180ms ease,
              box-shadow 180ms ease;
          }

          .products-page .products-sidebar.mobile-open {
            max-height: 24rem;
            margin: 0.12rem 0 0.55rem;
            padding: 0.5rem !important;
            visibility: visible;
            opacity: 1;
            border-width: 1px;
            border-bottom-width: 2px;
            box-shadow: 0 5px 14px rgba(30, 64, 175, 0.08);
            transform: translateY(0);
            pointer-events: auto;
          }

          .products-page .products-sidebar .filter-options {
            display: flex !important;
            flex-direction: column !important;
            gap: 0.22rem !important;
          }

          .products-page .products-sidebar .sidebar-section {
            min-width: 0;
          }

          .products-page .products-sidebar .sidebar-section h3 {
            margin: 0 0 0.32rem;
            font-size: 0.68rem;
            font-weight: 500;
            letter-spacing: 0.035em;
          }

          .products-page .filter-label {
            gap: 0.38rem;
            min-height: 2rem !important;
            padding: 0.24rem 0.3rem !important;
            font-size: 0.72rem;
            font-weight: 400;
            line-height: 1.2;
          }

          .products-page .filter-label:has(.filter-radio:checked) {
            font-weight: 500;
          }

          .products-page .filter-radio-control {
            width: 14px;
            height: 14px;
            flex-basis: 14px;
          }

          .products-page .filter-radio-control::after {
            width: 5px;
            height: 5px;
          }

          .products-page .products-main-content {
            display: contents !important;
          }

          .products-page .products-catalog-grid,
          .products-page .catalog-grid {
            grid-area: catalog;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: clamp(0.42rem, 1.8vw, 0.62rem) !important;
            width: 100% !important;
          }

          .products-main-content > .empty-products,
          .products-main-content > :not(.search-bar-wrapper):not(.products-catalog-grid) {
            grid-area: catalog;
            min-width: 0;
          }

          .products-page .products-page-header {
            margin-top: 0 !important;
            margin-bottom: 0.3rem !important;
            padding: 0.78rem 0 0.5rem !important;
          }

          .products-page .products-page-header .customer-page-header__content {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
            grid-template-rows: auto auto auto;
            justify-items: center;
            align-content: center;
            align-items: center;
            gap: 0.14rem clamp(0.3rem, 1.5vw, 0.7rem);
          }

          .products-page .products-page-header .customer-page-header__badge {
            display: inline-flex !important;
            position: relative;
            top: 0.625rem;
            grid-column: 1 / 4;
            grid-row: 1;
            min-height: 1.05rem;
            margin: 0 0 0.08rem;
            padding: 0.08rem 0.48rem;
            font-size: clamp(0.44rem, 1.65vw, 0.52rem);
            letter-spacing: 0.09em;
          }

          .products-page .products-page-header p {
            display: block !important;
            grid-column: 1 / 4;
            grid-row: 3;
            max-width: min(100%, 28rem) !important;
            margin: 0.02rem 0 0 !important;
            overflow: visible !important;
            color: #64748b;
            font-size: clamp(0.61rem, 2.35vw, 0.72rem) !important;
            line-height: 1.25 !important;
            text-align: center;
            text-overflow: clip !important;
            white-space: normal !important;
          }

          [data-theme="dark"] .products-page .products-page-header p {
            color: #cbd5e1;
          }

          .products-page .products-page-header .hero-actions-wrapper {
            display: contents;
          }

          .products-page .products-page-header .hero-action-back {
            grid-column: 1;
            grid-row: 2;
            align-self: center;
            justify-self: start;
            width: max-content;
            max-width: 100%;
            height: 2.25rem;
            padding: 0 0.48rem;
            border: 1px solid rgba(37, 99, 235, 0.12);
            border-radius: 0.68rem;
            background: rgba(255, 255, 255, 0.75);
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.05);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
          }

          .products-page .products-page-header .hero-action-back .hero-back-label-desktop {
            display: none;
          }

          .products-page .products-page-header .hero-action-back .hero-back-label-mobile {
            display: block;
          }

          .products-page .products-page-header .hero-mobile-page-title {
            grid-column: 2;
            grid-row: 2;
            width: 100%;
            display: -webkit-box;
            overflow: hidden;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            line-clamp: 2;
            font-size: clamp(0.86rem, 3.65vw, 1.02rem);
            line-height: 1.12;
            text-overflow: clip;
            white-space: normal;
          }

          .products-page .products-page-header .hero-action-spacer {
            grid-column: 1;
            grid-row: 2;
          }

          .products-page .products-page-header .hero-action-finish {
            top: 0.625rem;
            grid-column: 3;
            grid-row: 1;
            align-self: center;
            justify-self: end;
            width: max-content;
            min-width: 0;
            max-width: none;
            height: 2.25rem;
            padding: 0 0.4rem;
            font-size: clamp(0.58rem, 1.8vw, 0.76rem);
            white-space: nowrap;
          }

          .products-page .products-page-header .hero-action-finish .hero-finish-text {
            display: inline !important;
          }

          .products-page .products-page-header .hero-action-finish::before {
            display: block;
          }

          [data-theme="dark"] .products-page .products-page-header .hero-action-back {
            border-color: rgba(59, 130, 246, 0.2);
            background: rgba(30, 41, 59, 0.75);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          }

          .products-page .catalog-card {
            width: 100% !important;
            height: 100% !important;
            min-width: 0 !important;
          }

          .products-page .catalog-card .product-img-wrap {
            aspect-ratio: 4 / 3 !important;
          }

          .products-page .cat-meta {
            flex-wrap: nowrap !important;
            overflow: hidden;
          }

          .products-page .cat-volume,
          .products-page .cat-badge,
          .products-page .prod-badge-best {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .products-page .cat-price-row {
            align-items: flex-end !important;
            flex-direction: row !important;
          }

          .products-page .add-cart-btn.btn-sm,
          .products-page .cat-price-row .btn-sm {
            min-height: 2.25rem !important;
            padding-inline: clamp(0.4rem, 2vw, 0.65rem) !important;
            white-space: nowrap;
          }

          body:has(.products-page) .header-container {
            min-height: 3.35rem !important;
            width: calc(100% - 0.75rem) !important;
            gap: 0.35rem !important;
          }

          body:has(.products-page) .header .logo {
            gap: 0.4rem !important;
            min-width: 0;
          }

          body:has(.products-page) .header .logo-icon {
            width: 1.8rem !important;
            height: 1.8rem !important;
          }

          body:has(.products-page) .header .logo-text {
            font-size: 0.92rem !important;
          }

          body:has(.products-page) .header .logo-tagline {
            font-size: 0.5rem !important;
          }

          body:has(.products-page) .header .cart-link,
          body:has(.products-page) .header .profile-btn,
          body:has(.products-page) .header .header-profile-placeholder,
          body:has(.products-page) .header .mobile-menu-btn {
            border-color: rgba(37, 99, 235, 0.22) !important;
            background: rgba(239, 246, 255, 0.72) !important;
            color: #2563eb !important;
            box-shadow:
              0 3px 10px rgba(37, 99, 235, 0.1),
              inset 0 1px rgba(255, 255, 255, 0.78) !important;
            backdrop-filter: blur(12px) saturate(150%);
            -webkit-backdrop-filter: blur(12px) saturate(150%);
          }

          body:has(.products-page) .header .cart-link:hover,
          body:has(.products-page) .header .profile-btn:hover,
          body:has(.products-page) .header .mobile-menu-btn:hover {
            border-color: rgba(37, 99, 235, 0.35) !important;
            background: rgba(219, 234, 254, 0.9) !important;
            color: #1d4ed8 !important;
            box-shadow:
              0 5px 14px rgba(37, 99, 235, 0.16),
              inset 0 1px rgba(255, 255, 255, 0.86) !important;
          }

          body:has(.products-page) .header .cart-link:active,
          body:has(.products-page) .header .profile-btn:active,
          body:has(.products-page) .header .mobile-menu-btn:active {
            background: rgba(191, 219, 254, 0.88) !important;
            box-shadow:
              0 2px 7px rgba(37, 99, 235, 0.13),
              inset 0 1px 2px rgba(37, 99, 235, 0.08) !important;
          }

          body:has(.products-page) .header .profile-btn .avatar-guest {
            border-color: rgba(37, 99, 235, 0.22) !important;
            background: rgba(219, 234, 254, 0.82) !important;
            color: #2563eb !important;
            box-shadow: 0 3px 10px rgba(37, 99, 235, 0.12) !important;
          }

          body:has(.products-page) .header .header-profile-placeholder svg {
            color: #2563eb !important;
            stroke: currentColor;
          }

          [data-theme="dark"] body:has(.products-page) .header .cart-link,
          [data-theme="dark"] body:has(.products-page) .header .profile-btn,
          [data-theme="dark"] body:has(.products-page) .header .header-profile-placeholder,
          [data-theme="dark"] body:has(.products-page) .header .mobile-menu-btn {
            border-color: rgba(96, 165, 250, 0.28) !important;
            background: rgba(30, 64, 175, 0.2) !important;
            color: #60a5fa !important;
            box-shadow:
              0 3px 11px rgba(2, 6, 23, 0.24),
              inset 0 1px rgba(147, 197, 253, 0.1) !important;
          }

          [data-theme="dark"] body:has(.products-page) .header .profile-btn .avatar-guest {
            border-color: rgba(96, 165, 250, 0.3) !important;
            background: rgba(30, 64, 175, 0.28) !important;
            color: #60a5fa !important;
          }

          body:has(.products-page) .ds-main.with-site-header {
            padding-top: 3.35rem !important;
          }

          body:has(.products-page) .whatsapp-fab {
            right: 0.55rem !important;
            bottom: calc(0.55rem + env(safe-area-inset-bottom)) !important;
            width: 38px !important;
            height: 38px !important;
          }
        }

        @media (max-width: 390px) {
          .products-page .products-page-header .hero-action-finish {
            padding-inline: 0.25rem;
          }

          .products-page .products-page-header .hero-action-finish .hero-cart-icon {
            display: none;
          }
        }

        @media (max-width: 360px) {
          .products-page .products-page-header .hero-action-finish {
            padding-inline: 0.15rem;
            font-size: 0.54rem;
            gap: 0.15rem;
          }
        }

        @media (max-width: 430px) {
          .products-page .products-sidebar.mobile-open {
            grid-template-columns: 1fr;
          }

          .products-page .products-sidebar.mobile-open .filter-options {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 350px) {
          body:has(.products-page) .header .logo-tagline { display: none !important; }
          body:has(.products-page) .header .header-icon-group { gap: 0.15rem !important; }
          body:has(.products-page) .header .icon-btn,
          body:has(.products-page) .header .cart-link,
          body:has(.products-page) .header .profile-btn,
          body:has(.products-page) .header .header-profile-placeholder,
          body:has(.products-page) .header .mobile-menu-btn {
            width: 30px !important;
            height: 30px !important;
            min-width: 30px !important;
            flex-basis: 30px !important;
          }

          .products-page .add-cart-btn svg { display: none; }
          .products-page .add-cart-btn.btn-sm { font-size: 0.64rem !important; }
        }
      `}</style>
    </div>
  );
}
