'use client';

import React from 'react';
import { Product } from '@/types/cms';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useCart } from '@/frontend/customer/hooks/useCart';
import ProductImage from '../ProductImage';
import { formatCurrency, isOrderable, normalizeCategory, productId } from '../../utils/commerce';

const ProductDetailModal = dynamic(() => import('./ProductDetailModal'), { ssr: false });

interface RecentlyViewedProductsProps {
  products: Product[];
  onAdd?: (product: Product) => void;
}

export function RecentlyViewedProducts({ products, onAdd }: RecentlyViewedProductsProps) {
  const [viewedProducts, setViewedProducts] = React.useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const { addProduct, updateQuantity, items } = useCart();
  const [wishlist, setWishlist] = React.useState<Record<string, boolean>>({});

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
        const mapped = parsed
          .map((p) => products.find((prod) => String(prod.ID || prod.Name) === String(p.ID || p.Name)))
          .filter((p): p is Product => {
            if (!p) return false;
            const stock = String(p.StockStatus || '').toLowerCase();
            const cat = String(p.Category || '').toLowerCase();
            const isUpcoming = stock.includes('coming') || stock.includes('upcoming') || cat.includes('upcoming');
            return !isUpcoming;
          });
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

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlist(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const displayedProducts = React.useMemo(() => {
    const list = [...viewedProducts];
    const availableCatalog = (products || []).filter((p) => {
      const stock = String(p.StockStatus || '').toLowerCase();
      const cat = String(p.Category || '').toLowerCase();
      const isUpcoming = stock.includes('coming') || stock.includes('upcoming') || cat.includes('upcoming');
      return !isUpcoming;
    });

    for (const p of availableCatalog) {
      if (list.length >= 4) break;
      if (!list.some(dp => String(dp.ID || dp.Name) === String(p.ID || p.Name))) {
        list.push(p);
      }
    }
    return list;
  }, [viewedProducts, products]);

  const getViewedTime = (index: number) => {
    const times = ["Viewed 10m ago", "Viewed 35m ago", "Viewed 2h ago", "Viewed Yesterday"];
    return times[index] || "Viewed recently";
  };

  return (
    <div className="panel recently-viewed-panel" style={{ marginTop: '0.5rem' }}>
      <div className="section-header-row">
        <div className="section-header-left">
          <span className="badge badge-primary premium-history-badge">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginRight: '4px' }}>
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            History
          </span>
          <h2>Recently Viewed Products</h2>
          <p className="subtitle-text">Continue where you left off</p>
        </div>
      </div>

      {displayedProducts.length > 0 ? (
        <div className="custom-recently-viewed-grid">
          {displayedProducts.slice(0, 4).map((product, index) => {
            const id = productId(product);
            const cartItem = items.find((item) => String(item.productId) === id) ?? null;
            const inCart = cartItem !== null && cartItem.quantity > 0;
            const orderable = isOrderable(product);

            const handleAdd = (e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              addProduct(product);
              if (onAdd) {
                onAdd(product);
              }
            };

            const handleIncrease = (e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              if (cartItem) {
                updateQuantity(cartItem.productId, cartItem.quantity + 1);
              } else {
                addProduct(product);
              }
            };

            const handleDecrease = (e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              if (cartItem) {
                updateQuantity(cartItem.productId, cartItem.quantity - 1);
              }
            };

            const handleCardClick = () => {
              setSelectedProduct(product);
            };

            return (
              <article 
                key={id}
                className={`custom-rv-card ${inCart ? 'in-cart' : ''}`}
                onClick={handleCardClick}
              >
                <div className="rv-img-container">
                  <ProductImage 
                    src={product.ImageUrl} 
                    alt={product.Name} 
                    style={{ aspectRatio: 'auto', width: '100%', height: '100%', background: 'transparent' }}
                    imgStyle={{ objectFit: 'contain', padding: '16px' }}
                  />

                  <span className="rv-time-badge">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '3px' }}>
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    {getViewedTime(index)}
                  </span>
                </div>

                <div className="rv-card-body">
                  <div className="rv-meta-row">
                    <span className="rv-vol-badge">{product.Volume || 'Packaged Water'}</span>
                    <span className="rv-category-badge">{normalizeCategory(product.Category)}</span>
                  </div>

                  <h3 className="rv-product-name" title={product.Name}>
                    {product.Name}
                  </h3>

                  <p className="rv-product-desc">
                    {product.Description || 'Premium packaged pure mineral drinking water.'}
                  </p>

                  <div className="rv-extra-info">
                    <span className="rv-info-pill stock">✔ In Stock</span>
                    <span className="rv-info-pill">💧 Pure Alkaline</span>
                    <span className="rv-info-pill">🚚 Fast Delivery</span>
                  </div>

                  <div className="rv-price-action-row">
                    <div className="rv-price-box">
                      <span className="rv-price-lbl">Retail Price</span>
                      <div className="rv-price-val-row">
                        <strong className="rv-price-val">{formatCurrency(Number(product.Price))}</strong>
                        <span className="rv-price-mrp">MRP {formatCurrency(Number(product.Price) * 1.15)}</span>
                      </div>
                    </div>

                    {orderable && (
                      <div className="rv-action-box">
                        {inCart ? (
                          <div className="rv-qty-wrap" onClick={(e) => e.stopPropagation()}>
                            <button type="button" className="rv-qty-btn" onClick={handleDecrease}>−</button>
                            <span className="rv-qty-count">{cartItem.quantity}</span>
                            <button type="button" className="rv-qty-btn" onClick={handleIncrease}>+</button>
                          </div>
                        ) : (
                          <button 
                            type="button" 
                            className="rv-add-btn"
                            onClick={handleAdd}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginRight: '4px' }}>
                              <circle cx="9" cy="21" r="1"></circle>
                              <circle cx="20" cy="21" r="1"></circle>
                              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {inCart && (
                    <Link href="/cart" className="rv-view-cart-link" onClick={(e) => e.stopPropagation()}>
                      View Cart ({cartItem.quantity} item{cartItem.quantity > 1 ? 's' : ''}) &rarr;
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="premium-empty-state">
          <div className="empty-icon-wrap">💧</div>
          <h3>No recently viewed products yet</h3>
          <p>Browse our collection to discover premium packaged drinking water.</p>
          <Link href="/products" className="empty-cta-btn">
            <span>Browse Products</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </Link>
        </div>
      )}

      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
        />
      )}

      <style jsx>{`
        .recently-viewed-panel {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          min-height: 520px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(191, 219, 254, 0.45);
          border-radius: 18px;
          box-shadow: 0 4px 18px -2px rgba(37, 99, 235, 0.04), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
          transition: all 250ms ease;
        }
        :global([data-theme="dark"]) .recently-viewed-panel {
          background: rgba(15, 23, 42, 0.75);
          border: 1px solid rgba(59, 130, 246, 0.15);
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.35);
        }
        .recently-viewed-panel:hover {
          box-shadow: 0 10px 24px -4px rgba(37, 99, 235, 0.08), 0 4px 8px -2px rgba(37, 99, 235, 0.03);
          border-color: rgba(37, 99, 235, 0.32);
        }
        :global([data-theme="dark"]) .recently-viewed-panel:hover {
          border-color: rgba(59, 130, 246, 0.35);
        }
        
        .section-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(191, 219, 254, 0.15);
          padding-bottom: 0.8rem;
          margin-bottom: 0.5rem;
        }
        :global([data-theme="dark"]) .section-header-row {
          border-bottom-color: rgba(255, 255, 255, 0.04);
        }
        .section-header-left h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0.2rem 0 0.1rem 0;
        }
        .subtitle-text {
          font-size: 0.78rem;
          color: var(--text-secondary);
          margin: 0;
        }
        .premium-history-badge {
          display: inline-flex;
          align-items: center;
          background: rgba(37, 99, 235, 0.08);
          color: var(--primary-color);
          border: 1px solid rgba(37, 99, 235, 0.15);
          border-radius: 999px;
          padding: 0.15rem 0.5rem;
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        :global([data-theme="dark"]) .premium-history-badge {
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
          border-color: rgba(59, 130, 246, 0.2);
        }
        
        .view-history-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem 0.85rem;
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--primary-color);
          background: transparent;
          border: 1.5px solid rgba(37, 99, 235, 0.2);
          border-radius: 999px;
          cursor: pointer;
          text-decoration: none;
          transition: all 200ms ease;
        }
        .view-history-btn:hover {
          background: rgba(37, 99, 235, 0.05);
          border-color: var(--primary-color);
          transform: translateY(-1px);
        }
        .view-history-btn svg {
          transition: transform 150ms ease;
        }
        .view-history-btn:hover svg {
          transform: translateX(2px);
        }

        /* ── Product Grid & Custom Cards ── */
        .custom-recently-viewed-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
          gap: 1rem;
          flex: 1;
        }
        .custom-rv-card {
          display: flex;
          flex-direction: column;
          background: var(--bg-secondary);
          border: 1px solid rgba(191, 219, 254, 0.4);
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          position: relative;
          padding: 0.85rem;
          transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px -3px rgba(37, 99, 235, 0.02);
        }
        :global([data-theme="dark"]) .custom-rv-card {
          border-color: rgba(59, 130, 246, 0.12);
        }
        .custom-rv-card:hover {
          transform: translateY(-4px);
          border-color: rgba(37, 99, 235, 0.35);
          box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.02);
        }
        
        .rv-img-container {
          height: 150px;
          width: calc(100% + 1.7rem);
          margin: -0.85rem -0.85rem 0.6rem -0.85rem;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-bottom: 1px solid rgba(191, 219, 254, 0.2);
          overflow: hidden;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        :global([data-theme="dark"]) .rv-img-container {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.25) 0%, rgba(30, 41, 59, 0.2) 100%);
          border-bottom-color: rgba(255, 255, 255, 0.03);
        }
        .rv-img-container :global(img) {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .custom-rv-card:hover .rv-img-container :global(img) {
          transform: scale(1.05);
        }

        /* Overlay Badges */
        .rv-time-badge {
          position: absolute;
          bottom: 8px;
          left: 8px;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(4px);
          color: #ffffff;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          font-size: 0.62rem;
          font-weight: 600;
        }

        .rv-card-body {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .rv-meta-row {
          display: flex;
          gap: 0.3rem;
          margin-bottom: 0.3rem;
        }
        .rv-vol-badge {
          background: rgba(37, 99, 235, 0.08);
          color: var(--primary-color);
          border: 1px solid rgba(37, 99, 235, 0.15);
          border-radius: 999px;
          font-size: 0.62rem;
          font-weight: 700;
          padding: 0.1rem 0.4rem;
        }
        :global([data-theme="dark"]) .rv-vol-badge {
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
          border-color: rgba(59, 130, 246, 0.2);
        }
        .rv-category-badge {
          background: rgba(100, 116, 139, 0.06);
          color: var(--text-secondary);
          border: 1px solid rgba(100, 116, 139, 0.12);
          border-radius: 999px;
          font-size: 0.62rem;
          font-weight: 600;
          padding: 0.1rem 0.4rem;
        }

        .rv-product-name {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 0.25rem 0;
          line-height: 1.25;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .rv-product-desc {
          font-size: 0.74rem;
          color: var(--text-secondary);
          line-height: 1.35;
          margin: 0 0 0.5rem 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Extra Info (stretches cards vertically nicely) */
        .rv-extra-info {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
          margin-bottom: auto; /* Pushes the price/action row to the very bottom */
          padding-bottom: 0.6rem;
        }
        .rv-info-pill {
          background: rgba(16, 185, 129, 0.05);
          color: #059669;
          font-size: 0.65rem;
          font-weight: 600;
          padding: 0.08rem 0.35rem;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
        }

        .rv-price-action-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid rgba(191, 219, 254, 0.12);
          padding-top: 0.65rem;
          margin-top: 0.3rem;
        }
        :global([data-theme="dark"]) .rv-price-action-row {
          border-top-color: rgba(255, 255, 255, 0.03);
        }
        
        .rv-price-box {
          display: flex;
          flex-direction: column;
        }
        .rv-price-lbl {
          font-size: 0.62rem;
          color: var(--text-muted);
          line-height: 1.1;
        }
        .rv-price-val-row {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
        }
        .rv-price-val {
          font-size: 1.05rem;
          font-weight: 800;
          color: var(--primary-color);
        }
        :global([data-theme="dark"]) .rv-price-val {
          color: #60a5fa;
        }
        .rv-price-mrp {
          font-size: 0.68rem;
          color: var(--text-muted);
          text-decoration: line-through;
          opacity: 0.8;
        }

        /* Actions */
        .rv-add-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
          color: #ffffff;
          border: none;
          border-radius: 8px;
          padding: 0.35rem 0.75rem;
          font-size: 0.72rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(37, 99, 235, 0.18);
          transition: all 200ms ease;
        }
        .rv-add-btn:hover {
          background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);
        }
        
        .rv-qty-wrap {
          display: inline-flex;
          align-items: center;
          border: 1px solid rgba(191, 219, 254, 0.6);
          border-radius: 8px;
          background: var(--bg-secondary);
          padding: 0.1rem;
          gap: 0.25rem;
        }
        .rv-qty-btn {
          background: transparent;
          color: var(--text-primary);
          border: none;
          border-radius: 4px;
          width: 22px;
          height: 22px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 150ms ease;
        }
        .rv-qty-btn:hover {
          background: rgba(37, 99, 235, 0.08);
          color: var(--primary-color);
        }
        .rv-qty-count {
          font-size: 0.78rem;
          font-weight: 700;
          min-width: 18px;
          text-align: center;
        }
        
        .rv-view-cart-link {
          display: block;
          text-align: center;
          margin-top: 0.4rem;
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--primary-color);
          text-decoration: none;
        }
        .rv-view-cart-link:hover {
          text-decoration: underline;
        }

        /* Empty State Overhaul */
        .premium-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          padding: 2.5rem 1.5rem;
          text-align: center;
          flex: 1;
        }
        .empty-icon-wrap {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: rgba(37, 99, 235, 0.06);
          color: var(--primary-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          box-shadow: 0 4px 10px rgba(37, 99, 235, 0.05);
          margin-bottom: 0.2rem;
        }
        .premium-empty-state h3 {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .premium-empty-state p {
          font-size: 0.82rem;
          color: var(--text-secondary);
          margin: 0 0 0.6rem 0;
          max-width: 340px;
          line-height: 1.45;
        }
        .empty-cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
          color: #ffffff;
          padding: 0.5rem 1.1rem;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 700;
          text-decoration: none;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
          transition: all 200ms ease;
        }
        .empty-cta-btn:hover {
          transform: translateY(-1.5px);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.25);
        }
      `}</style>
    </div>
  );
}
