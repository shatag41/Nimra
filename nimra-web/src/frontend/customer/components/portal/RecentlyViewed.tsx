'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '@/types/cms';
import { useCart } from '@/frontend/customer/hooks/useCart';
import { formatCurrency, isOrderable, productId } from '../../utils/commerce';

interface RecentlyViewedProductsProps {
  products: Product[];
  onAdd?: (product: Product) => void;
}

export function RecentlyViewedProducts({ products, onAdd }: RecentlyViewedProductsProps) {
  const [viewedProducts, setViewedProducts] = React.useState<Product[]>([]);
  const { addProduct, updateQuantity, items } = useCart();

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

  const handleAddToCart = (product: Product, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    addProduct(product);
  };

  const handleQuantityChange = (cartProductId: string, quantity: number, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    updateQuantity(cartProductId, quantity);
  };

  return (
    <div className="panel recently-viewed-panel animate-fade-in-up">
      <div className="panel-head compact">
        <div>
          <span className="eyebrow" style={{ color: 'var(--primary-color)', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '999px', padding: '0.2rem 0.75rem', fontSize: '0.7rem' }}>History</span>
          <h2>Recently Viewed Products</h2>
        </div>
      </div>

      {viewedProducts.length > 0 ? (
        <div className="recently-viewed-grid">
          {viewedProducts.map((product) => {
            const cartItem = items.find((item) => String(item.productId) === productId(product));

            return (
              <div key={productId(product)} className="rv-card glass">
                <div className="rv-img-box">
                  {product.ImageUrl ? <img src={product.ImageUrl} alt={product.Name} loading="lazy" decoding="async" /> : null}
                </div>
                <div className="rv-info">
                  <span className="rv-vol">{product.Volume}</span>
                  <h3 className="rv-title">{product.Name}</h3>
                  <div className="rv-footer">
                    <span className="rv-price">{formatCurrency(Number(product.Price))}</span>
                    {isOrderable(product) ? (
                      cartItem && cartItem.quantity > 0 ? (
                        <div className="rv-qty-controls" onClick={(event) => event.stopPropagation()}>
                          <button
                            type="button"
                            className="rv-qty-btn"
                            onClick={(event) => handleQuantityChange(cartItem.productId, cartItem.quantity - 1, event)}
                            aria-label={`Decrease ${product.Name} quantity`}
                          >
                            -
                          </button>
                          <span className="rv-qty-count">{cartItem.quantity}</span>
                          <button
                            type="button"
                            className="rv-qty-btn"
                            onClick={(event) => handleQuantityChange(cartItem.productId, cartItem.quantity + 1, event)}
                            aria-label={`Increase ${product.Name} quantity`}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleAddToCart(product, e)}
                          className="btn btn-primary btn-sm rv-btn"
                          style={{ cursor: 'pointer', border: 'none' }}
                        >
                          Add to Cart
                        </button>
                      )
                    ) : (
                      <Link
                        href="/contact?subject=RUSH%20Soda%20Launch"
                        className="btn btn-secondary btn-sm rv-btn"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Notify Me
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state-rv">
          <div className="empty-icon">💧</div>
          <h3>No recently viewed products</h3>
          <p>Products you view in our catalog will appear here for quick access.</p>
          <Link href="/products" className="btn btn-primary btn-sm">
            Browse Catalog
          </Link>
        </div>
      )}

      <style jsx>{`
        .recently-viewed-panel {
          margin-top: 1rem;
        }
        .recently-viewed-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
          margin-top: 0.5rem;
        }
        .rv-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          transition: all var(--transition-normal);
          box-shadow: var(--shadow-sm);
        }
        .rv-card:hover {
          transform: translateY(-3px);
          border-color: var(--primary-color);
          box-shadow: var(--shadow-md);
        }
        .rv-img-box {
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-primary);
          border-radius: var(--radius-md);
          margin-bottom: 0.5rem;
          overflow: hidden;
          border: 1px solid rgba(150, 150, 150, 0.08);
        }
        .rv-img-box img {
          max-height: 90%;
          max-width: 90%;
          object-fit: contain;
          transition: transform var(--transition-normal);
        }
        .rv-card:hover .rv-img-box img {
          transform: scale(1.05);
        }
        .rv-info {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .rv-vol {
          display: inline-block;
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--primary-color);
          background: rgba(37, 99, 235, 0.08);
          padding: 0.15rem 0.5rem;
          border-radius: 999px;
          align-self: flex-start;
          margin-bottom: 0.25rem;
          border: 1px solid rgba(37, 99, 235, 0.15);
        }
        .rv-title {
          font-size: 0.88rem;
          font-weight: 700;
          margin: 0.25rem 0 0.5rem 0;
          color: var(--text-primary);
          line-height: 1.3;
          flex: 1;
        }
        .rv-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid var(--border-color);
          padding-top: 0.5rem;
          margin-top: auto;
        }
        .rv-price {
          font-size: 0.95rem;
          font-weight: 800;
          color: var(--primary-color);
          font-family: var(--font-heading);
        }
        .rv-btn {
          font-size: 0.75rem !important;
          padding: 0.3rem 0.7rem !important;
        }
        .rv-qty-controls {
          display: flex;
          align-items: center;
          overflow: hidden;
          border: 1.5px solid var(--primary-color);
          border-radius: 999px;
          background: rgba(var(--primary-rgb), 0.06);
        }
        .rv-qty-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 0;
          background: transparent;
          color: var(--primary-color);
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
        }
        .rv-qty-btn:hover {
          background: rgba(var(--primary-rgb), 0.15);
        }
        .rv-qty-count {
          min-width: 24px;
          text-align: center;
          color: var(--primary-color);
          font-size: 0.8rem;
          font-weight: 800;
        }
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
        @media (max-width: 480px) {
          .recently-viewed-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
