'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Product } from '@/types/cms';

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
              {titlePrefix && titlePrefix.split(' ').map((word, i) => (
                <span key={`word-${i}`} className="rush-word">{word}&nbsp;</span>
              ))}
              <span className="rush-brand rush-word">{brandWord}</span>
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
              <div className="sparkles" aria-hidden="true"><span/><span/><span/></div>
              <div className="product-spotlight" aria-hidden="true" />
              <div className="product-floor" aria-hidden="true" />
              <div className="launch-product-wrap">
                {product.ImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="launch-product-image" src={product.ImageUrl} alt={product.Name} />
                ) : (
                  <span className="launch-product-fallback">NIMRA</span>
                )}
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
          padding: clamp(0.45rem, 0.8vw, 0.7rem) clamp(1rem, 2.6vw, 2.1rem);
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
          margin: 0.32rem 0 0.18rem;
          letter-spacing: -0.035em;
          line-height: 1.04;
        }

        .rush-brand {
          background: linear-gradient(135deg, #fb923c, #fbbf24);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .rush-tagline { margin: 0 0 0.18rem; color: #fed7aa; font-size: clamp(0.72rem, 0.68rem + 0.18vw, 0.82rem); font-weight: 700; }
        .rush-text {
          color: rgba(255, 255, 255, 0.68);
          line-height: 1.38;
          margin: 0 0 0.42rem;
          font-size: clamp(0.72rem, 0.68rem + 0.16vw, 0.82rem);
          max-width: 41rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .rush-features { display: flex; gap: 0.36rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
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
          --showcase-size: clamp(170px, 19.5vw, 248px);
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
          overflow: hidden;
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

        .launch-product-wrap {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          filter: drop-shadow(0 15px 16px rgba(0,0,0,0.28)) drop-shadow(0 0 13px rgba(249,115,22,0.14));
          animation: productReveal 380ms cubic-bezier(0.22, 1, 0.36, 1) both;
          transition: transform 350ms cubic-bezier(0.22, 1, 0.36, 1), filter 350ms ease;
        }

        .launch-product-image {
          width: 100%;
          height: 100%;
          max-width: 100%;
          max-height: 100%;
          display: block;
          object-fit: cover;
          object-position: center;
          border-radius: 22px;
        }

        .launch-product-fallback {
          display: grid;
          place-items: center;
          width: 84%;
          height: 84%;
          border-radius: 18px;
          color: rgba(255,255,255,0.78);
          background: linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
          font-weight: 850;
          letter-spacing: 0.16em;
        }

        .rush-visual:hover .launch-product-wrap { transform: scale(1.03); filter: drop-shadow(0 17px 18px rgba(0,0,0,0.3)) drop-shadow(0 0 18px rgba(249,115,22,0.25)); }
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
        .showcase-dots { display: flex; justify-content: center; gap: 0.42rem; margin-top: 0.34rem; }
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
          .rush-visual { --showcase-size: clamp(175px, 23vw, 220px); }
        }

        @media (max-width: 768px) {
          /* Animated border glow around the card shifting with brand colors */
          .rush-section { 
            width: min(100% - 0.75rem, 100%); 
            border-radius: var(--radius-lg); 
            margin: 0.5rem auto; 
            border: 1px solid transparent;
            background: linear-gradient(135deg, #020617, #0d1728, #111827) padding-box,
                        linear-gradient(135deg, rgba(249,115,22,0.4), rgba(251,191,36,0.1), rgba(249,115,22,0.4)) border-box;
            background-size: 200% 200%;
            position: relative;
            transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
          }
          
          /* Fade-up + scale (0.96 -> 1) */
          .rush-section.is-visible { animation: mobileSectionFadeUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards, mobileBorderShift 6s linear infinite; }
          .rush-section:not(.is-visible) { opacity: 0; transform: translateY(24px) scale(0.96); }
          
          /* Slightly lift entire card + stronger shadow during touch */
          .rush-section:active { transform: translateY(-4px) scale(0.99) !important; box-shadow: 0 15px 35px rgba(0,0,0,0.4); }
          
          /* Very slow moving radial background gradient for section depth */
          .rush-section::before {
            content: ''; position: absolute; inset: 0; z-index: 0; pointer-events: none;
            background: radial-gradient(circle at 50% 50%, rgba(249,115,22,0.08), transparent 70%);
            animation: depthGlowMove 8s ease-in-out infinite alternate;
          }

          .rush-inner { padding: 0.5rem 0.6rem 0.65rem; position: relative; z-index: 2; }
          .rush-grid { grid-template-columns: 1fr; gap: 0.4rem; text-align: center; }
          .showcase-column { grid-row: 1; margin-bottom: -0.2rem; }
          .rush-content { grid-row: 2; align-items: center; gap: 0.25rem; }
          
          .rush-visual { --showcase-size: min(180px, 45vw); perspective: 800px; position: relative; }
          .rush-title { font-size: clamp(1.15rem, 5.5vw, 1.45rem); margin: 0; }
          
          /* Word-by-word staggered fade-in */
          .is-visible .rush-word { opacity: 0; display: inline-block; animation: wordFadeIn 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
          .is-visible .rush-word:nth-child(1) { animation-delay: 0.1s; }
          .is-visible .rush-word:nth-child(2) { animation-delay: 0.15s; }
          .is-visible .rush-word:nth-child(3) { animation-delay: 0.2s; }
          .is-visible .rush-word:nth-child(4) { animation-delay: 0.25s; }
          .is-visible .rush-word:nth-child(5) { animation-delay: 0.3s; }
          
          .rush-text { font-size: 0.7rem; max-width: 32rem; margin: 0 0 0.2rem; }
          .rush-features { justify-content: center; gap: 0.25rem; margin-top: 0.1rem; }
          .rush-pill { padding: 0.15rem 0.4rem; font-size: 0.58rem; }
          .showcase-arrow { opacity: 0.85; transform: translateY(-50%) scale(0.85); width: 1.7rem; height: 1.7rem; }
          .showcase-dots { margin-top: 0.2rem; }
          
          /* CTA Button: gradient, soft glow pulse, ripple */
          .btn-rush { 
            margin-top: 0.3rem; padding: 0.45rem 0.9rem; font-size: 0.72rem; 
            background-size: 200% 200% !important; 
            transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s ease; 
            position: relative; overflow: hidden;
            box-shadow: 0 4px 15px rgba(249, 115, 22, 0.25);
          }
          .is-visible .btn-rush { animation: btnGradientMove 3s linear infinite, btnGlowPulse 5.5s ease-in-out infinite; }
          
          /* Ripple effect */
          .btn-rush::after {
            content: ''; position: absolute; inset: 50%; width: 0; height: 0;
            background: rgba(255,255,255,0.4); border-radius: 50%; opacity: 0;
            transform: translate(-50%, -50%); transition: width 0.4s, height 0.4s, opacity 0.4s;
          }
          .btn-rush:active::after { width: 120px; height: 120px; opacity: 1; transition: 0s; }
          .btn-rush:active { transform: scale(0.92); }
          
          /* Continuous float (6-8px) + slow 3D tilt */
          .is-visible .launch-product-wrap { animation: mobileFloatTilt 4.5s ease-in-out infinite alternate; transform-style: preserve-3d; }
          
          /* Slow shimmer across can */
          .launch-product-wrap::before {
            content: ''; position: absolute; inset: 0;
            background: linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.3) 50%, transparent 80%);
            transform: skewX(-20deg) translateX(-150%);
            pointer-events: none; z-index: 10;
          }
          .is-visible .launch-product-wrap::before { animation: mobileShimmerSweep 5s ease-in-out infinite; animation-delay: 1.5s; }
          
          /* Soft rotating radial glow */
          .is-visible .product-spotlight { animation: mobileRotatingGlow 6s linear infinite; width: 120%; left: -10%; }
          
          /* Pulse "Coming Soon" badge */
          .is-visible .rush-content .badge { animation: badgeBreathing 2.5s ease-in-out infinite alternate; }
          
          /* Staggered slide-up feature tags */
          .is-visible .rush-pill { opacity: 0; animation: staggerFeatureSlideUp 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
          .is-visible .rush-pill:nth-child(1) { animation-delay: 0.15s; }
          .is-visible .rush-pill:nth-child(2) { animation-delay: 0.25s; }
          .is-visible .rush-pill:nth-child(3) { animation-delay: 0.35s; }
          .is-visible .rush-pill:nth-child(4) { animation-delay: 0.45s; }
          
          /* Sparkling light effects */
          .sparkles { position: absolute; inset: 0; z-index: 5; pointer-events: none; }
          .sparkles span {
            position: absolute; width: 4px; height: 4px; background: white; border-radius: 50%;
            box-shadow: 0 0 8px 2px rgba(255,255,255,0.8); opacity: 0;
          }
          .is-visible .sparkles span:nth-child(1) { top: 15%; left: 20%; animation: sparkleTwinkle 3s ease-in-out infinite; animation-delay: 0.5s; }
          .is-visible .sparkles span:nth-child(2) { top: 75%; right: 15%; animation: sparkleTwinkle 4s ease-in-out infinite; animation-delay: 1.2s; }
          .is-visible .sparkles span:nth-child(3) { top: 40%; right: 25%; animation: sparkleTwinkle 3.5s ease-in-out infinite; animation-delay: 2.1s; }
          
          /* Keyframes */
          @keyframes mobileSectionFadeUp { from { opacity: 0; transform: translateY(24px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
          @keyframes mobileBorderShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
          @keyframes depthGlowMove { from { transform: translate(-10%, -10%) scale(0.9); } to { transform: translate(10%, 10%) scale(1.1); } }
          @keyframes mobileFloatTilt { from { transform: translateY(4px) rotateX(2deg) rotateY(-3deg); } to { transform: translateY(-7px) rotateX(-2deg) rotateY(3deg); } }
          @keyframes mobileRotatingGlow { 0% { opacity: 0.4; transform: scale(0.9) rotate(0deg); } 50% { opacity: 0.75; transform: scale(1.1); } 100% { opacity: 0.4; transform: scale(0.9) rotate(360deg); } }
          @keyframes mobileShimmerSweep { 0% { transform: skewX(-20deg) translateX(-150%); } 20%, 100% { transform: skewX(-20deg) translateX(150%); } }
          @keyframes badgeBreathing { from { box-shadow: 0 0 4px rgba(249,115,22,0.2); transform: scale(0.97); } to { box-shadow: 0 0 16px rgba(249,115,22,0.5); transform: scale(1.03); } }
          @keyframes staggerFeatureSlideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes wordFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes btnGradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
          @keyframes btnGlowPulse { 0%, 100% { box-shadow: 0 4px 15px rgba(249, 115, 22, 0.25); } 50% { box-shadow: 0 4px 25px rgba(249, 115, 22, 0.6); } }
          @keyframes sparkleTwinkle { 0%, 100% { opacity: 0; transform: scale(0.5); } 50% { opacity: 1; transform: scale(1.5); } }
        }

        @media (prefers-reduced-motion: reduce) {
          .rush-grid, .launch-product-wrap, .product-spotlight, .bubble, 
          .rush-section, .launch-product-wrap::before, .rush-content .badge, .rush-pill, .btn-rush,
          .rush-section::before, .sparkles span, .rush-word { 
            animation: none !important; 
          }
          .btn-rush, .showcase-arrow, .showcase-dots button, .launch-product-wrap, .rush-section { transition: none !important; }
          .rush-section, .rush-pill, .rush-word { opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </section>
  );
}
