'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Product } from '@/types/cms';
import ProductImage from './ProductImage';

interface UpcomingProductsProps {
  upcomingProducts: Product[];
}

const AUTOPLAY_DELAY = 5500;

function getFeatures(product: Product) {
  const fallback = ['Premium Quality', 'Pure Taste', 'Event Ready'];
  if (!product.Specifications) return fallback;
  return String(product.Specifications)
    .split(/[\n;,|]/)
    .map((feature) => feature.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function getTagline(product: Product) {
  if (!product.Description) return 'A new premium refreshment is almost here.';
  const firstSentence = product.Description.split(/(?<=[.!?])\s/)[0];
  return firstSentence.length > 92 ? `${firstSentence.slice(0, 89).trim()}…` : firstSentence;
}

export function UpcomingProducts({ upcomingProducts }: UpcomingProductsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState<'next' | 'previous'>('next');

  useEffect(() => {
    if (currentIndex < upcomingProducts.length) return;
    setCurrentIndex(0);
  }, [currentIndex, upcomingProducts.length]);

  useEffect(() => {
    if (upcomingProducts.length < 2 || isPaused) return;
    const interval = window.setInterval(() => {
      setDirection('next');
      setCurrentIndex((current) => (current + 1) % upcomingProducts.length);
    }, AUTOPLAY_DELAY);
    return () => window.clearInterval(interval);
  }, [isPaused, upcomingProducts.length]);

  if (upcomingProducts.length === 0) return null;

  const product = upcomingProducts[currentIndex] || upcomingProducts[0];
  const words = product.Name.split(' ');
  const brandWord = words.pop() || '';
  const titlePrefix = words.join(' ');
  const features = getFeatures(product);
  const hasMultipleProducts = upcomingProducts.length > 1;

  const moveSlide = (step: number) => {
    setDirection(step > 0 ? 'next' : 'previous');
    setCurrentIndex((current) => (current + step + upcomingProducts.length) % upcomingProducts.length);
  };

  const selectSlide = (index: number) => {
    setDirection(index >= currentIndex ? 'next' : 'previous');
    setCurrentIndex(index);
  };

  return (
    <section
      className="rush-section home-deferred-section"
      aria-label="Upcoming product launches"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsPaused(false);
      }}
    >
      <div className="launch-aurora" aria-hidden="true" />
      <div className="bubble-bg" aria-hidden="true">
        {[
          { left: '8%', size: '8px', delay: '0s', duration: '9s' },
          { left: '22%', size: '14px', delay: '1.2s', duration: '12s' },
          { left: '46%', size: '6px', delay: '0.4s', duration: '8s' },
          { left: '68%', size: '18px', delay: '2s', duration: '11s' },
          { left: '85%', size: '10px', delay: '1.6s', duration: '10s' },
        ].map((bubble, index) => (
          <span
            key={index}
            className="bubble"
            style={{
              left: bubble.left,
              width: bubble.size,
              height: bubble.size,
              animationDelay: bubble.delay,
              animationDuration: bubble.duration,
            }}
          />
        ))}
      </div>

      <div className="rush-inner">
        <div key={String(product.ID)} className={`rush-grid slide-${direction}`} aria-live="polite">
          <div className="rush-content">
            <span className="badge badge-orange">{product.StockStatus || 'Coming Soon'}</span>
            <h2 className="rush-title">
              {titlePrefix && `${titlePrefix} `}
              <span className="rush-brand">{brandWord}</span>
            </h2>
            <p className="rush-tagline">{getTagline(product)}</p>
            <p className="rush-text">
              {product.Description || `Prepare your taste buds for ${product.Name}, crafted for celebrations and best enjoyed chilled.`}
            </p>
            <div className="rush-features" aria-label="Product highlights">
              {features.map((feature, index) => (
                <span key={`${feature}-${index}`} className="rush-pill">{feature}</span>
              ))}
            </div>
            <Link href={`/contact?subject=Notify%20me%20about%20${encodeURIComponent(product.Name)}`} className="btn btn-rush">
              <svg className="bell-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              Get Notified on Launch
            </Link>
          </div>

          <div className="showcase-column">
            <div className="rush-visual">
              <div className="product-spotlight" aria-hidden="true" />
              <div className="product-floor" aria-hidden="true" />
              <div className="product-img-wrap">
                <ProductImage
                  src={product.ImageUrl}
                  alt={product.Name}
                  style={{ aspectRatio: '1 / 1', background: 'transparent', overflow: 'visible' }}
                  imgStyle={{ width: '84%', height: '84%', objectFit: 'contain', objectPosition: 'center' }}
                />
              </div>

              {hasMultipleProducts && (
                <>
                  <button type="button" className="showcase-arrow arrow-previous" onClick={() => moveSlide(-1)} aria-label="Show previous upcoming product">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
                  </button>
                  <button type="button" className="showcase-arrow arrow-next" onClick={() => moveSlide(1)} aria-label="Show next upcoming product">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
                  </button>
                </>
              )}
            </div>

            {hasMultipleProducts && (
              <div className="showcase-dots" role="tablist" aria-label="Choose upcoming product">
                {upcomingProducts.map((item, index) => (
                  <button
                    key={item.ID}
                    type="button"
                    role="tab"
                    aria-selected={index === currentIndex}
                    aria-label={`Show ${item.Name}`}
                    className={index === currentIndex ? 'active' : ''}
                    onClick={() => selectSlide(index)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .rush-section {
          background: linear-gradient(135deg, #020617 0%, #0d1728 52%, #111827 100%);
          color: white;
          position: relative;
          overflow: hidden;
          width: min(100% - clamp(1rem, 3vw, 3rem), 82rem);
          max-width: 82rem;
          margin: clamp(0.65rem, 1.1vw, 0.9rem) auto;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-md);
        }

        .rush-inner {
          width: 100%;
          padding: clamp(0.6rem, 1.1vw, 0.9rem) clamp(1rem, 2.6vw, 2.1rem);
          box-sizing: border-box;
          position: relative;
          z-index: 2;
        }

        .launch-aurora {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(circle at 84% 48%, rgba(249, 115, 22, 0.16), transparent 29%),
            radial-gradient(circle at 8% 0%, rgba(251, 146, 60, 0.07), transparent 28%);
        }

        .bubble-bg { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
        .bubble {
          position: absolute;
          bottom: -24px;
          background: rgba(251, 146, 60, 0.08);
          border: 1px solid rgba(251, 146, 60, 0.18);
          border-radius: 50%;
          animation: launchBubble 9s ease-in infinite;
        }

        .rush-grid {
          display: grid;
          grid-template-columns: minmax(0, 3fr) minmax(240px, 2fr);
          gap: clamp(1.5rem, 4vw, 4rem);
          align-items: center;
          min-height: 0;
          animation: slideReveal 380ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .rush-grid.slide-previous { --slide-x: -8px; }
        .rush-grid.slide-next { --slide-x: 8px; }
        .rush-content { display: flex; flex-direction: column; align-items: flex-start; justify-content: center; min-width: 0; }

        .rush-content .badge {
          padding: 0.27rem 0.72rem;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          font-size: 0.62rem;
          box-shadow: 0 0 18px rgba(249, 115, 22, 0.12);
        }

        .rush-title {
          font-size: clamp(1.35rem, 2.15vw, 1.9rem);
          font-weight: 900;
          color: white;
          margin: 0.42rem 0 0.22rem;
          letter-spacing: -0.035em;
          line-height: 1.04;
        }

        .rush-brand {
          background: linear-gradient(135deg, #fb923c, #fbbf24);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .rush-tagline { margin: 0 0 0.24rem; color: #fed7aa; font-size: clamp(0.72rem, 0.68rem + 0.18vw, 0.82rem); font-weight: 700; }
        .rush-text {
          color: rgba(255, 255, 255, 0.68);
          line-height: 1.38;
          margin: 0 0 0.55rem;
          font-size: clamp(0.72rem, 0.68rem + 0.16vw, 0.82rem);
          max-width: 41rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .rush-features { display: flex; gap: 0.36rem; flex-wrap: wrap; margin-bottom: 0.65rem; }
        .rush-pill {
          padding: 0.23rem 0.62rem;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.065);
          border: 1px solid rgba(255, 255, 255, 0.11);
          font-size: 0.64rem;
          font-weight: 650;
          color: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(8px);
        }

        .btn-rush {
          display: inline-flex;
          align-items: center;
          gap: 0.46rem;
          padding: 0.56rem 1rem;
          font-family: var(--font-heading);
          font-weight: 750;
          font-size: 0.74rem;
          border-radius: 0.85rem;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          background: linear-gradient(135deg, #fb923c 0%, #f97316 52%, #ea580c 100%) !important;
          color: white !important;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.22), 0 8px 26px rgba(249, 115, 22, 0.3);
          transition: transform 220ms ease, box-shadow 220ms ease, filter 220ms ease;
        }

        .btn-rush:hover {
          transform: translateY(-2px);
          filter: saturate(1.08) brightness(1.04);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.28), 0 13px 32px rgba(249, 115, 22, 0.42);
        }

        .btn-rush:hover .bell-icon { animation: bellRing 620ms ease-in-out; transform-origin: 50% 12%; }
        .showcase-column { display: grid; justify-items: center; align-content: center; min-width: 0; }
        .rush-visual {
          --showcase-size: clamp(180px, 21.5vw, 280px);
          width: var(--showcase-size);
          height: var(--showcase-size);
          display: grid;
          place-items: center;
          position: relative;
          isolation: isolate;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 24px;
          background: linear-gradient(145deg, rgba(255,255,255,0.09), rgba(255,255,255,0.025));
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -22px 42px rgba(249,115,22,0.035), 0 20px 52px rgba(0,0,0,0.22);
          backdrop-filter: blur(14px);
        }

        .product-spotlight {
          position: absolute;
          inset: 9%;
          z-index: -1;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(251, 146, 60, 0.25) 0%, rgba(249,115,22,0.07) 42%, transparent 70%);
          filter: blur(4px);
          animation: glowBreathe 4.5s ease-in-out infinite;
        }

        .product-floor {
          position: absolute;
          z-index: -1;
          width: 57%;
          height: 9%;
          left: 21.5%;
          bottom: 8%;
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(255,255,255,0.17), rgba(249,115,22,0.08) 42%, transparent 72%);
          filter: blur(5px);
          opacity: 0.72;
        }

        .product-img-wrap {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          filter: drop-shadow(0 15px 16px rgba(0,0,0,0.28)) drop-shadow(0 0 13px rgba(249,115,22,0.14));
          animation: productReveal 380ms cubic-bezier(0.22, 1, 0.36, 1) both;
          transition: transform 350ms cubic-bezier(0.22, 1, 0.36, 1), filter 350ms ease;
        }

        .rush-visual:hover .product-img-wrap { transform: scale(1.03); filter: drop-shadow(0 17px 18px rgba(0,0,0,0.3)) drop-shadow(0 0 18px rgba(249,115,22,0.25)); }
        .showcase-arrow {
          position: absolute;
          z-index: 4;
          top: 50%;
          width: 2rem;
          height: 2rem;
          display: grid;
          place-items: center;
          padding: 0;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.16);
          background: rgba(2, 6, 23, 0.58);
          color: white;
          opacity: 0;
          transform: translateY(-50%) scale(0.9);
          transition: opacity 180ms ease, transform 180ms ease, background 180ms ease;
          cursor: pointer;
          backdrop-filter: blur(9px);
        }

        .rush-visual:hover .showcase-arrow, .showcase-arrow:focus-visible { opacity: 1; transform: translateY(-50%) scale(1); }
        .showcase-arrow:hover { background: #f97316; }
        .showcase-arrow svg { width: 1rem; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
        .arrow-previous { left: 0.7rem; }
        .arrow-next { right: 0.7rem; }
        .showcase-dots { display: flex; justify-content: center; gap: 0.42rem; margin-top: 0.48rem; }
        .showcase-dots button {
          width: 0.42rem;
          height: 0.42rem;
          padding: 0;
          border: 0;
          border-radius: 999px;
          background: rgba(255,255,255,0.3);
          cursor: pointer;
          transition: width 220ms ease, background 220ms ease, box-shadow 220ms ease;
        }

        .showcase-dots button.active { width: 1.35rem; background: #fb923c; box-shadow: 0 0 10px rgba(249,115,22,0.45); }

        @keyframes slideReveal { from { opacity: 0; transform: translateX(var(--slide-x)) translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes productReveal { from { opacity: 0; transform: translateY(10px) scale(0.96); } to { opacity: 1; transform: none; } }
        @keyframes glowBreathe { 50% { opacity: 0.78; transform: scale(1.04); } }
        @keyframes launchBubble { from { transform: translateY(0); opacity: 0; } 15% { opacity: 1; } to { transform: translateY(-340px); opacity: 0; } }
        @keyframes bellRing { 20%, 60% { transform: rotate(12deg); } 40%, 80% { transform: rotate(-12deg); } }

        @media (max-width: 1024px) {
          .rush-grid { grid-template-columns: minmax(0, 1.25fr) minmax(210px, 0.75fr); gap: clamp(1rem, 3vw, 2rem); }
          .rush-visual { --showcase-size: clamp(190px, 25vw, 240px); }
        }

        @media (max-width: 720px) {
          .rush-section { width: min(100% - 0.75rem, 100%); border-radius: var(--radius-lg); }
          .rush-inner { padding: 0.8rem 0.75rem 0.95rem; }
          .rush-grid { grid-template-columns: 1fr; gap: 0.7rem; text-align: center; }
          .showcase-column { grid-row: 1; }
          .rush-content { grid-row: 2; align-items: center; }
          .rush-visual { --showcase-size: min(220px, 54vw); }
          .rush-title { font-size: clamp(1.2rem, 6vw, 1.55rem); }
          .rush-text { font-size: 0.72rem; max-width: 34rem; }
          .rush-features { justify-content: center; }
          .showcase-arrow { opacity: 0.85; transform: translateY(-50%) scale(0.9); }
        }

        @media (prefers-reduced-motion: reduce) {
          .rush-grid, .product-img-wrap, .product-spotlight, .bubble { animation: none; }
          .btn-rush, .showcase-arrow, .showcase-dots button, .product-img-wrap { transition: none; }
        }
      `}</style>
    </section>
  );
}
