'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Product } from '../../types/cms';

interface ProductsClientProps {
  products: Product[];
}

export default function ProductsClient({ products }: ProductsClientProps) {
  const [activeTab, setActiveTab] = useState<'All' | 'Water' | 'Soda'>('All');

  const categories = [
    { id: 'All', name: 'All Products' },
    { id: 'Water', name: 'Packaged Water' },
    { id: 'Soda', name: 'RUSH Soda (Coming Soon)' },
  ];

  const filteredProducts = products.filter((p) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Water') return p.Category === 'Packaged Water';
    return false; // Soda is handled separately below
  });

  return (
    <>
      <section className="products-hero">
        <div className="container">
          <span className="badge badge-primary">Products</span>
          <h1>Hydration for Every Need</h1>
          <p>Explore our premium range of ISI certified mineral-enriched packaged drinking water, packed in various convenient capacities.</p>
        </div>
      </section>

      <section className="products-catalog-section">
        <div className="container">
          {/* Category Tabs */}
          <div className="catalog-tabs">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`tab-btn ${activeTab === cat.id ? 'active' : ''}`}
                onClick={() => setActiveTab(cat.id as any)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {activeTab === 'Soda' ? (
            /* Soda Teaser Screen */
            <div className="soda-teaser-card glass animate-fade-in">
              <span className="badge badge-orange">Teaser</span>
              <h2>RUSH Soda Sparkling Range</h2>
              <p>
                We are currently establishing our carbonated filling lines at our Daund plant. Our upcoming **RUSH Soda** range will offer extra-fizzy double-filtered club sodas, ideal for dining, social mixers, and absolute refreshment.
              </p>
              <div className="soda-teaser-grid">
                <div className="teaser-item">
                  <div className="circle-num">1</div>
                  <h4>Extra Fizz</h4>
                  <p>Specially carbonated under high pressure for lasting bubbles.</p>
                </div>
                <div className="teaser-item">
                  <div className="circle-num">2</div>
                  <h4>Pure Water base</h4>
                  <p>Uses our 10-step dual filtration NIMRA base water.</p>
                </div>
                <div className="teaser-item">
                  <div className="circle-num">3</div>
                  <h4>Eco-Friendly Pack</h4>
                  <p>100% recyclable, premium double-walled cans and glass bottles.</p>
                </div>
              </div>
              <Link href="/contact?subject=Rush%20Soda%20Inquiry" className="btn btn-primary" style={{ background: '#f97316', border: 'none', boxShadow: '0 4px 14px rgba(249, 115, 22, 0.3)' }}>
                Register for Launch News
              </Link>
            </div>
          ) : (
            /* Water Range Grid */
            <div className="catalog-grid animate-fade-in">
              {filteredProducts.map((product) => (
                <div key={product.ID} className="catalog-card glass">
                  <div className="cat-img-box">
                    <img src={product.ImageUrl} alt={product.Name} />
                  </div>
                  <div className="cat-info-box">
                    <div className="cat-meta">
                      <span className="cat-volume">{product.Volume}</span>
                      <span className="cat-badge">Water</span>
                    </div>
                    <h3>{product.Name}</h3>
                    <p>{product.Description}</p>
                    <div className="cat-price-row">
                      <div>
                        <span className="price-lbl">Retail Price</span>
                        <div className="price-val">₹{product.Price}</div>
                      </div>
                      <Link 
                        href={`/contact?product=${encodeURIComponent(product.Name)}&subject=${encodeURIComponent(`Inquiry for ${product.Name}`)}`} 
                        className="btn btn-primary btn-sm"
                      >
                        Inquire Now
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <style jsx>{`
        .products-hero {
          background: linear-gradient(135deg, rgba(0, 162, 153, 0.05) 0%, rgba(15, 23, 42, 0.02) 100%);
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
          max-width: 600px;
          margin: 0 auto;
          color: var(--text-secondary);
          font-size: 1.1rem;
        }
        .products-catalog-section {
          background-color: var(--bg-secondary);
        }
        .catalog-tabs {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          margin-bottom: 4rem;
          flex-wrap: wrap;
        }
        .tab-btn {
          padding: 0.75rem 2rem;
          border-radius: 50px;
          border: 1px solid var(--border-color);
          background: var(--bg-primary);
          color: var(--text-secondary);
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .tab-btn:hover {
          border-color: var(--primary-color);
          color: var(--primary-color);
        }
        .tab-btn.active {
          background: var(--primary-color);
          border-color: var(--primary-color);
          color: white;
          box-shadow: 0 4px 12px rgba(0, 162, 153, 0.2);
        }

        /* Catalog Grid */
        .catalog-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }
        .catalog-card {
          border-radius: 24px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          box-shadow: var(--card-shadow);
          transition: all var(--transition-normal);
        }
        .catalog-card:hover {
          transform: translateY(-6px);
          box-shadow: var(--card-hover-shadow);
        }
        .cat-img-box {
          height: 250px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
          border-radius: 16px;
          background: var(--bg-primary);
          overflow: hidden;
        }
        .cat-img-box img {
          max-height: 85%;
          max-width: 85%;
          object-fit: contain;
          border-radius: 8px;
          transition: transform var(--transition-normal);
        }
        .catalog-card:hover .cat-img-box img {
          transform: scale(1.05);
        }
        .cat-info-box h3 {
          font-size: 1.35rem;
          margin-bottom: 0.75rem;
        }
        .cat-info-box p {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 2rem;
        }
        .cat-meta {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
          align-items: center;
        }
        .cat-volume {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--primary-color);
          background: rgba(0, 162, 153, 0.1);
          padding: 0.25rem 0.75rem;
          border-radius: 50px;
        }
        .cat-badge {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-secondary);
          background: var(--bg-primary);
          padding: 0.25rem 0.75rem;
          border-radius: 50px;
        }
        .cat-price-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: auto;
          border-top: 1px solid var(--border-color);
          padding-top: 1.25rem;
        }
        .price-lbl {
          font-size: 0.75rem;
          color: var(--text-secondary);
          display: block;
        }
        .price-val {
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        /* Soda Teaser styling */
        .soda-teaser-card {
          border-radius: 24px;
          padding: 4rem;
          text-align: center;
          max-width: 800px;
          margin: 0 auto;
          box-shadow: var(--card-shadow);
          border: 1px solid rgba(249, 115, 22, 0.2);
        }
        .soda-teaser-card h2 {
          font-size: 2.2rem;
          margin-top: 1rem;
          margin-bottom: 1.5rem;
        }
        .soda-teaser-card p {
          color: var(--text-secondary);
          line-height: 1.7;
          margin-bottom: 3rem;
        }
        .soda-teaser-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          margin-bottom: 3.5rem;
        }
        .teaser-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .circle-num {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: rgba(249, 115, 22, 0.1);
          color: #f97316;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          font-weight: 800;
          margin-bottom: 1rem;
        }
        .teaser-item h4 {
          margin-bottom: 0.5rem;
          font-size: 1.1rem;
        }
        .teaser-item p {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.4;
          margin-bottom: 0;
        }

        @media (max-width: 1024px) {
          .catalog-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .soda-teaser-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          .soda-teaser-card {
            padding: 2.5rem;
          }
        }
        @media (max-width: 600px) {
          .catalog-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
