'use client';

import React from 'react';
import { Product } from '@/types/cms';
import { ProductSection } from './Products';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const ProductDetailModal = dynamic(() => import('./ProductDetailModal'), { ssr: false });

interface RecentlyViewedProductsProps {
  products: Product[];
  onAdd?: (product: Product) => void;
}

export function RecentlyViewedProducts({ products, onAdd }: RecentlyViewedProductsProps) {
  const [viewedProducts, setViewedProducts] = React.useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);

  const loadViewedProducts = React.useCallback(() => {
    try {
      let userId = '';
      const cookies = document.cookie.split(';');
      const userCookie = cookies.find(c => c.trim().startsWith('nimra_user='));
      if (userCookie) {
        try {
          const userJson = decodeURIComponent(userCookie.split('=')[1]);
          const user = JSON.parse(userJson);
          if (user && user.ID) {
            userId = String(user.ID);
          }
        } catch (e) {}
      }
      const key = userId ? `nimra-recently-viewed-${userId}` : 'nimra-recently-viewed';
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as Product[];
        // Map them back to latest products data to get updated price/stock etc.
        const mapped = parsed
          .map((p) => products.find((prod) => String(prod.ID || prod.Name) === String(p.ID || p.Name)))
          .filter((p): p is Product => !!p);
        setViewedProducts(mapped);
      } else {
        setViewedProducts([]);
      }
    } catch (e) {
      console.error('Failed to load recently viewed products:', e);
    }
  }, [products]);

  React.useEffect(() => {
    loadViewedProducts();

    // Listen to updates
    window.addEventListener('nimra-recently-viewed-updated', loadViewedProducts);
    return () => {
      window.removeEventListener('nimra-recently-viewed-updated', loadViewedProducts);
    };
  }, [loadViewedProducts]);

  return (
    <div className="panel recently-viewed-panel" style={{ marginTop: '1rem' }}>
      <ProductSection
        badge="History"
        title="Recently Viewed Products"
        products={viewedProducts}
        onAdd={onAdd}
        onViewMore={setSelectedProduct}
        disableAnimation={true}
        emptyState={
          <div className="empty-state-rv">
            <div className="empty-icon">💧</div>
            <h3>No recently viewed products</h3>
            <p>Products you view in our catalog will appear here for quick access.</p>
            <Link href="/products" className="btn btn-primary btn-sm" style={{ marginTop: '0.5rem' }}>
              Browse Catalog
            </Link>
          </div>
        }
      />
      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
        />
      )}
      <style jsx>{`
        .empty-state-rv {
          min-height: 150px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          color: var(--text-secondary);
          text-align: center;
          border: 1.5px dashed var(--border-color);
          border-radius: var(--radius-xl);
          background: var(--bg-primary);
          padding: 1.5rem 1rem;
          margin-top: 1rem;
        }
        .empty-icon {
          font-size: 1.8rem;
          margin-bottom: 0.25rem;
        }
        .empty-state-rv h3 {
          margin: 0;
          color: var(--text-primary);
          font-size: 1rem;
          font-weight: 700;
        }
        .empty-state-rv p {
          font-size: 0.8rem;
          margin: 0 0 0.5rem 0;
          max-width: 320px;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}
