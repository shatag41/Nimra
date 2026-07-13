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
        />

        {/* Main Products List */}
        <main className="products-main-content">
          {/* Top Search Bar */}
          <ProductsSearchBar value={searchQuery} onChange={handleSearchChange} />

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

        .products-page {
          padding-top: 0;
          padding-bottom: 2rem;
          font-family: var(--font-body);
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
      `}</style>
    </div>
  );
}
