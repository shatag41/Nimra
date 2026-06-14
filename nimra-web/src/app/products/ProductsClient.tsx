'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  const [addedId, setAddedId] = useState<string | null>(null);
  const { addProduct } = useCart();

  const filteredProducts = products.filter((product) =>
    activeTab === 'All' ? true : normalizeCategory(product.Category) === activeTab
  );

  const handleAdd = (product: Product) => {
    addProduct(product);
    setAddedId(String(product.ID || product.Name));
    window.setTimeout(() => setAddedId(null), 1200);
  };

  return (
    <>
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
              return (
                <article key={id} className="catalog-card glass">
                  <div className="cat-img-box">
                    <img src={product.ImageUrl} alt={product.Name} />
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
                        <button className="btn btn-primary btn-sm" onClick={() => handleAdd(product)}>
                          {addedId === id ? 'Added' : 'Add to Cart'}
                        </button>
                      ) : (
                        <Link href="/contact?subject=RUSH%20Soda%20Launch" className="btn btn-secondary btn-sm">
                          Notify Me
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <style jsx>{`
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
        .catalog-card {
          border-radius: var(--radius-xl);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-md);
          transition: all var(--transition-normal);
        }
        .catalog-card:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-xl);
        }
        .cat-img-box {
          height: 250px;
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
        button.btn {
          border: none;
          cursor: pointer;
        }
        @media (max-width: 1024px) {
          .catalog-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .products-hero h1 {
            font-size: 2.2rem;
          }
          .catalog-grid {
            grid-template-columns: 1fr;
          }
          .cat-price-row {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
}
