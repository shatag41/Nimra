'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product } from '@/types/cms';
import ProductImage from './ProductImage';

interface UpcomingProductsProps {
  upcomingProducts: Product[];
}

export function UpcomingProducts({ upcomingProducts }: UpcomingProductsProps) {
  const [currentUpcomingIndex, setCurrentUpcomingIndex] = useState(0);

  useEffect(() => {
    if (upcomingProducts.length < 2) return;
    const interval = window.setInterval(() => {
      setCurrentUpcomingIndex((current) => (current + 1) % upcomingProducts.length);
    }, 5500);
    return () => window.clearInterval(interval);
  }, [upcomingProducts.length]);

  if (upcomingProducts.length === 0) return null;

  return (
    <section className="rush-section home-deferred-section">
      <div className="bubble-bg">
        {[
          { left: '8%', w: '14px', delay: '0s', dur: '8s' },
          { left: '22%', w: '22px', delay: '1.2s', dur: '11s' },
          { left: '46%', w: '9px', delay: '0.4s', dur: '7s' },
          { left: '68%', w: '28px', delay: '2s', dur: '10s' },
          { left: '85%', w: '18px', delay: '1.6s', dur: '9s' },
        ].map((b, i) => (
          <div key={i} className="bubble" style={{ left: b.left, width: b.w, height: b.w, animationDelay: b.delay, animationDuration: b.dur }} />
        ))}
      </div>

      <div style={{ padding: '1.5rem 5%', width: '100%', maxWidth: '100%', margin: 0, boxSizing: 'border-box' }}>
        <div style={{ position: 'relative' }}>
          {upcomingProducts.map((product, idx) => {
            const words = product.Name.split(' ');
            const brandWord = words.pop() || '';
            const titlePrefix = words.join(' ');
            
            let features = ['Premium Quality', 'Pure Taste', 'Event Ready'];
            if (product.Specifications && typeof product.Specifications === 'string') {
              features = product.Specifications.split(/[\n;,|]/).map((s: string) => s.trim()).filter(Boolean).slice(0, 4);
            } else if (product.Specifications && typeof product.Specifications !== 'string') {
              features = String(product.Specifications).split(/[\n;,|]/).map(s => s.trim()).filter(Boolean).slice(0, 4);
            }

            return (
              <div 
                key={product.ID}
                style={{
                  display: upcomingProducts.length > 1 ? (idx === currentUpcomingIndex ? 'block' : 'none') : 'block',
                  animation: 'customFadeIn 0.5s ease-out forwards'
                }}
              >
                <div className="rush-grid">
                  <div className="rush-content">
                    <span className="badge badge-orange">{product.StockStatus || 'Coming Soon'}</span>
                    <h2 className="rush-title">
                      {titlePrefix ? titlePrefix + ' ' : ''}
                      <span className="rush-brand">{brandWord}</span>
                    </h2>
                    <p className="rush-text">
                      {product.Description || `Prepare your taste buds for the ultimate experience with ${product.Name}. Crafted to elevate your mocktails, parties, or enjoyed chilled.`}
                    </p>
                    <div className="rush-features">
                      {features.map((f, fIdx) => (
                        <span key={`${f}-${fIdx}`} className="rush-pill">{f}</span>
                      ))}
                    </div>
                    <Link href={`/contact?subject=Notify%20me%20about%20${encodeURIComponent(product.Name)}`} className="btn btn-rush" style={{ background: '#f97316' }}>
                      Get Notified on Launch
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    </Link>
                  </div>

                  <div className="rush-visual">
                    <div className="can-outer-glow" />
                    {product.ImageUrl ? (
                      <div className="product-img-wrap animate-float" style={{ zIndex: 10 }}>
                        <ProductImage src={product.ImageUrl} alt={product.Name} />
                      </div>
                    ) : (
                      <div className="can-mockup animate-float">
                        <div className="can-reflection" />
                        <div className="can-label">
                          <span className="label-brand">NIMRA</span>
                          <span className="label-title">NEW</span>
                          <span className="label-sub">COMING SOON</span>
                        </div>
                        <div className="can-bubbles">
                          {[...Array(6)].map((_, i) => (
                            <div key={i} className="can-bubble" style={{ left: `${15 + i * 12}%`, animationDelay: `${i * 0.3}s` }} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {upcomingProducts.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', position: 'relative', zIndex: 10 }}>
            {upcomingProducts.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentUpcomingIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                style={{
                  width: idx === currentUpcomingIndex ? '30px' : '10px',
                  height: '10px',
                  borderRadius: '5px',
                  background: idx === currentUpcomingIndex ? '#f97316' : 'rgba(255,255,255,0.3)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .rush-section {
          background: linear-gradient(135deg, #020617 0%, #0f172a 100%);
          color: white;
          position: relative;
          overflow: hidden;
          margin: 0 calc(50% - 50vw);
          width: 100vw;
          max-width: 100vw;
          border-radius: 0;
        }

        .bubble-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .bubble {
          position: absolute;
          bottom: -50px;
          background: rgba(249, 115, 22, 0.12);
          border: 1px solid rgba(249, 115, 22, 0.25);
          border-radius: 50%;
          animation: bubbleUp 8s ease-in infinite;
        }

        .rush-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 1.5rem;
          align-items: center;
        }

        .rush-title {
          font-size: clamp(1.2rem, 2.5vw, 1.8rem);
          font-weight: 900;
          color: white;
          margin: 0.3rem 0 0.5rem;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }

        .rush-brand {
          background: linear-gradient(135deg, #f97316, #fbbf24);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .rush-text {
          color: rgba(255,255,255,0.7);
          line-height: 1.5;
          margin-bottom: 0.8rem;
          font-size: 0.85rem;
        }

        .rush-features {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }

        .rush-pill {
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          font-size: 0.7rem;
          font-weight: 600;
          color: rgba(255,255,255,0.8);
        }

        .btn-rush {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.6rem 1.2rem;
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 0.8rem;
          border-radius: var(--radius-xl);
          border: none;
          cursor: pointer;
          background: #f97316;
          color: white;
          box-shadow: 0 8px 28px rgba(249,115,22,0.35);
          transition: all 200ms ease;
          position: relative;
          overflow: hidden;
          z-index: 10;
        }
        .btn-rush:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 16px 40px rgba(249,115,22,0.5);
        }

        .rush-visual {
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
        }

        .can-outer-glow {
          position: absolute;
          width: 280px;
          height: 280px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%);
          pointer-events: none;
        }

        .can-mockup {
          width: 100px;
          height: 200px;
          background: linear-gradient(160deg, #1A2A20 0%, #0D1810 100%);
          border: 1.5px solid rgba(249,115,22,0.25);
          border-radius: 32px;
          position: relative;
          box-shadow: var(--shadow-xl), 0 0 40px rgba(249,115,22,0.12);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .can-reflection {
          position: absolute;
          top: 0; left: 0;
          width: 40%;
          height: 100%;
          background: linear-gradient(to right, rgba(255,255,255,0.12) 0%, transparent 100%);
          pointer-events: none;
          border-radius: 32px 0 0 32px;
        }

        .can-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          z-index: 1;
        }

        .label-brand {
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.22em;
          color: rgba(255,255,255,0.45);
          margin-bottom: 0.2rem;
        }

        .label-title {
          font-size: 2.4rem;
          font-weight: 900;
          font-family: var(--font-heading);
          background: linear-gradient(135deg, #f97316, #fbbf24);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: 0.05em;
          line-height: 1;
          text-shadow: none;
        }

        .label-sub {
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.35em;
          color: rgba(255,255,255,0.55);
          margin-top: 0.25rem;
        }

        .can-bubbles {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 60px;
          pointer-events: none;
        }

        .can-bubble {
          position: absolute;
          bottom: 0;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: rgba(249,115,22,0.3);
          animation: bubbleUp 2s ease-in infinite;
        }

        @keyframes customFadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 1024px) {
          .rush-grid {
            grid-template-columns: 1fr;
            gap: 1.2rem;
          }
        }
      `}</style>
    </section>
  );
}
