'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Banner, Product, FAQ, CompanyInfo } from '@/types/cms';
import { FAQs } from './portal/FAQs';
import ProductDetailModal from './portal/ProductDetailModal';

interface HomeClientProps {
  banners: Banner[];
  products: Product[];
  faqs: FAQ[];
  companyInfo: CompanyInfo;
}

export default function HomeClient({ banners, products, faqs, companyInfo }: HomeClientProps) {
  const [carouselEnabled, setCarouselEnabled] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [{ activeBanner, loadedBannerIndexes }, setCarouselState] = useState(() => ({
    activeBanner: 0,
    loadedBannerIndexes: new Set([0, 1]),
  }));
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (banners.length <= 1 || !carouselEnabled) return;
    const interval = setInterval(() => {
      setCarouselState((current) => {
        const next = (current.activeBanner + 1) % banners.length;
        const nextLoaded = new Set(current.loadedBannerIndexes);
        nextLoaded.add(next);
        nextLoaded.add((next + 1) % banners.length);
        return { activeBanner: next, loadedBannerIndexes: nextLoaded };
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length, carouselEnabled]);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    let heroVisible = true;

    const updateCarousel = () => setCarouselEnabled(heroVisible && document.visibilityState === 'visible');
    const heroObserver = new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      hero.classList.toggle('is-visible', heroVisible);
      updateCarousel();
    }, { threshold: 0.05 });

    const deferredSections = Array.from(document.querySelectorAll<HTMLElement>('.home-deferred-section'));
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle('is-visible', entry.isIntersecting));
    }, { rootMargin: '240px 0px', threshold: 0.01 });

    heroObserver.observe(hero);
    deferredSections.forEach((section) => sectionObserver.observe(section));
    document.addEventListener('visibilitychange', updateCarousel);
    return () => {
      heroObserver.disconnect();
      sectionObserver.disconnect();
      document.removeEventListener('visibilitychange', updateCarousel);
    };
  }, []);

  const selectBanner = useCallback((index: number) => {
    setCarouselState((current) => {
      const nextLoaded = new Set(current.loadedBannerIndexes);
      nextLoaded.add(index);
      if (banners.length > 1) nextLoaded.add((index + 1) % banners.length);
      return { activeBanner: index, loadedBannerIndexes: nextLoaded };
    });
  }, [banners.length]);

  const spotlightProducts = useMemo(() => products.slice(0, 3), [products]);

  return (
    <div className="home-page">
      {/* ─── 1. HERO CAROUSEL ───────────────────────────────────────────────── */}
      <section className="hero-section" ref={heroRef}>
        {banners.map((banner, idx) => (
          <div
            key={banner.ID}
            className={`hero-slide ${idx === activeBanner ? 'active' : ''}`}
          >
            {loadedBannerIndexes.has(idx) && banner.ImageUrl && (
              <Image
                src={banner.ImageUrl}
                alt=""
                fill
                priority={idx === 0}
                unoptimized
                quality={75}
                sizes="100vw"
                className="hero-slide-image"
              />
            )}
            <div className="hero-slide-shade" />
            <div className="container hero-content">
              <div className="hero-copy">
                <div className="hero-eyebrow animate-fade-in">
                  <span className="eyebrow-dot" />
                  Premium Hydration
                </div>
                <h1 className="hero-title">{banner.Title}</h1>
                <p className="hero-subtitle">{banner.Subtitle}</p>
                <div className="hero-actions">
                  <Link
                    href={banner.ButtonLink.startsWith('#') ? '/products' : banner.ButtonLink}
                    className="btn btn-hero-primary"
                  >
                    {banner.ButtonText}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </Link>
                  <Link href="/about" className="btn btn-ghost">
                    Our Story
                  </Link>
                </div>
                <div className="hero-trust-bar">
                  <div className="trust-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    BIS Certified
                  </div>
                  <div className="trust-divider" />
                  <div className="trust-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                    10-Step Purification
                  </div>
                  <div className="trust-divider" />
                  <div className="trust-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    50,000+ Customers
                  </div>
                </div>
              </div>

              <div className="hero-card glass">
                <div className="hero-card-tag">NIMRA Promise</div>
                <h3>Pure water crafted for everyday wellness.</h3>
                <ul className="hero-card-list">
                  <li>
                    <span className="list-check">✓</span>
                    Mineral-balanced taste with consistent quality
                  </li>
                  <li>
                    <span className="list-check">✓</span>
                    Range suited for homes, offices & events
                  </li>
                  <li>
                    <span className="list-check">✓</span>
                    Fast, dependable service across the city
                  </li>
                </ul>
                <Link href="/products" className="btn btn-primary ds-btn-full hero-card-cta">
                  Explore Products
                </Link>
              </div>
            </div>
          </div>
        ))}

        {/* Carousel Dots */}
        {banners.length > 1 && (
          <div className="carousel-dots">
            {banners.map((_, idx) => (
              <button
                key={idx}
                className={`dot ${idx === activeBanner ? 'active' : ''}`}
                onClick={() => selectBanner(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Scroll indicator */}
        <div className="scroll-indicator">
          <div className="scroll-mouse">
            <div className="scroll-wheel" />
          </div>
        </div>
      </section>

      {/* ─── 2. STATS BAR ───────────────────────────────────────────────────── */}
      <section className="stats-section home-deferred-section">
        <div className="container">
          <div className="stats-grid">
            {[
              { value: '50,000+', label: 'Happy Customers', icon: '👥' },
              { value: '10-Step', label: 'Purification Process', icon: '💧' },
              { value: '99.9%', label: 'Purity Guaranteed', icon: '🛡️' },
              { value: '24hr', label: 'Delivery Available', icon: '🚚' },
            ].map((stat) => (
              <div key={stat.label} className="stat-card">
                <span className="stat-emoji">{stat.icon}</span>
                <strong className="stat-value">{stat.value}</strong>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 3. BRAND STORY ─────────────────────────────────────────────────── */}
      <section className="story-section home-deferred-section">
        <div className="story-bg-shape" />
        <div className="container">
          <div className="story-grid">
            <div className="story-image-container">
              <div className="story-img-wrapper">
                {products[0]?.ImageUrl && (
                  <Image
                    src={products[0].ImageUrl}
                    alt={products[0].Name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    quality={72}
                    style={{ objectFit: 'cover' }}
                    className="story-img animate-float-slow"
                  />
                )}
                <div className="story-img-overlay" />
              </div>
              <div className="purity-card glass">
                <div className="purity-icon">💎</div>
                <div>
                  <strong>10-Step Pure</strong>
                  <p>RO + mineral balancing at every stage</p>
                </div>
              </div>
              <div className="story-badge-pill">
                <span>Since 2018</span>
              </div>
            </div>

            <div className="story-content">
              <span className="badge badge-primary">About {companyInfo.BrandName}</span>
              <h2 className="story-title">Sourced to refresh.<br />Purified to protect.</h2>
              <p className="story-description">
                {companyInfo.AboutStory || `At NIMRA, we believe pure drinking water is the cornerstone of robust health. Under T.S. Enterprises, we combine advanced purification with careful mineral balancing to ensure every drop is safe, clean, and consistently refreshing.`}
              </p>
              <div className="values-grid">
                {[
                  {
                    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
                    title: 'Certified Quality',
                    desc: 'Stringent quality controls for dependable purity at every step.'
                  },
                  {
                    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>,
                    title: 'Balanced Minerals',
                    desc: 'Carefully enriched for a smooth, refreshing taste every time.'
                  },
                  {
                    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
                    title: 'Reliable Supply',
                    desc: 'Consistent stock and fast delivery across Pune and Daund.'
                  },
                  {
                    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>,
                    title: 'Full Range',
                    desc: 'From 200ml bottles to 20L jars — every hydration need covered.'
                  }
                ].map((v) => (
                  <div key={v.title} className="value-item">
                    <div className="value-icon">{v.icon}</div>
                    <div>
                      <h4>{v.title}</h4>
                      <p>{v.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/about" className="btn btn-primary story-cta">
                Discover Our Standards
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. PRODUCT PREVIEW ─────────────────────────────────────────────── */}
      <section className="product-preview-section home-deferred-section">
        <div className="section-bg-dots" />
        <div className="container">
          <div className="section-header">
            <span className="badge badge-primary">Our Offerings</span>
            <h2>NIMRA Packaged Water Range</h2>
            <p>From mini desk bottles to massive 20-litre office jars, we cover all your hydration requirements.</p>
          </div>

          <div className="preview-grid">
            {spotlightProducts.map((product, i) => (
              <div 
                key={product.ID} 
                className="product-preview-card" 
                style={{ animationDelay: `${i * 0.1}s`, cursor: 'pointer' }}
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (!target.closest('.btn') && !target.closest('.prod-footer')) {
                    setSelectedProduct(product);
                  }
                }}
              >
                <div className="prod-img-box">
                  {product.ImageUrl ? (
                    <Image
                      src={product.ImageUrl}
                      alt={product.Name}
                      fill
                      style={{ objectFit: 'contain' }}
                      sizes="(max-width: 640px) calc(100vw - 2rem), (max-width: 1024px) 45vw, 360px"
                      quality={75}
                    />
                  ) : null}
                  <div className="prod-img-overlay" />
                </div>
                <div className="prod-info-box">
                  <div className="prod-meta">
                    <span className="prod-vol">{product.Volume}</span>
                    {i === 0 && <span className="prod-badge-best">Best Seller</span>}
                  </div>
                  <h3>{product.Name}</h3>
                  <p>
                    {(() => {
                      const desc = product.Description || '';
                      return desc.length > 90 ? desc.substring(0, 90).trim() + '...' : desc;
                    })()}
                    {(product.Description || '').length > 90 && (
                      <button
                        type="button"
                        className="view-more-text-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedProduct(product);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary-color)',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          padding: 0,
                          marginLeft: '0.25rem'
                        }}
                      >
                        View More
                      </button>
                    )}
                  </p>
                  <div className="prod-footer">
                    <div>
                      <span className="prod-price-label">From</span>
                      <span className="prod-price">₹{product.Price}</span>
                    </div>
                    <Link
                      href={`/products?add=${encodeURIComponent(String(product.ID))}`}
                      className="btn btn-primary btn-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Order Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="view-all-wrap">
            <Link href="/products" className="btn btn-secondary btn-lg">
              View All Products
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 5. RUSH SODA TEASER ────────────────────────────────────────────── */}
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

        <div className="container">
          <div className="rush-grid">
            <div className="rush-content">
              <span className="badge badge-orange">Coming Soon</span>
              <h2 className="rush-title">
                Feel the Fizz of{' '}
                <span className="rush-brand">RUSH Soda</span>
              </h2>
              <p className="rush-text">
                Prepare your taste buds for the ultimate bubbly experience. RUSH Soda — NIMRA&apos;s upcoming range of premium sparkling club sodas and carbonated refreshments. Crafted to elevate your mocktails, parties, or enjoyed chilled.
              </p>
              <div className="rush-features">
                {['Extra Sparkling', 'Zero Impurities', 'Pure Crisp Taste', 'Event Ready'].map((f) => (
                  <span key={f} className="rush-pill">{f}</span>
                ))}
              </div>
              <Link href="/contact" className="btn btn-rush">
                Get Notified on Launch
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              </Link>
            </div>

            <div className="rush-visual">
              <div className="can-outer-glow" />
              <div className="can-mockup animate-float">
                <div className="can-reflection" />
                <div className="can-label">
                  <span className="label-brand">NIMRA</span>
                  <span className="label-title">RUSH</span>
                  <span className="label-sub">CLUB SODA</span>
                </div>
                <div className="can-bubbles">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="can-bubble" style={{ left: `${15 + i * 12}%`, animationDelay: `${i * 0.3}s` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. FAQ ─────────────────────────────────────────────────────────── */}
      <section className="faq-section">
        <div className="container">
          <div className="section-header">
            <span className="badge badge-primary">FAQ</span>
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know about our quality standards, plant location, and delivery orders.</p>
          </div>

          <FAQs faqs={faqs} />
        </div>
      </section>

      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
        />
      )}

      <style jsx>{`
        /* ── Hero ───────────────────────────────────────────────────────────── */
        .hero-section {
          height: calc(100vh - 75px);
          min-height: 640px;
          max-height: 900px;
          position: relative;
          overflow: hidden;
          background: #001a0c;
        }

        .hero-slide {
          position: absolute;
          inset: 0;
          opacity: 0;
          z-index: 1;
          display: flex;
          align-items: center;
          transition: opacity 700ms ease-in-out;
        }
        .hero-slide.active { opacity: 1; z-index: 2; }

        .hero-slide-image {
          object-fit: cover;
          object-position: center;
          z-index: 0;
        }

        .hero-slide-shade {
          position: absolute;
          inset: 0;
          z-index: 1;
          background: linear-gradient(105deg, rgba(15,23,42,0.68) 0%, rgba(15,23,42,0.44) 40%, rgba(30,64,175,0.16) 70%, rgba(37,99,235,0.03) 100%);
          pointer-events: none;
        }

        .home-deferred-section {
          content-visibility: auto;
          contain-intrinsic-size: auto 700px;
        }

        .home-deferred-section:not(.is-visible) * {
          animation-play-state: paused !important;
        }

        .hero-section:not(.is-visible) * {
          animation-play-state: paused !important;
        }

        .hero-content {
          color: white;
          z-index: 10;
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 3rem;
          align-items: center;
          padding-top: 2rem;
        }

        .hero-copy { max-width: 680px; }

        .hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 1rem;
          border-radius: 999px;
          background: rgba(59, 130, 246, 0.18);
          border: 1px solid rgba(59, 130, 246, 0.35);
          font-size: 0.8rem;
          font-weight: 700;
          color: #93C5FD;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 1.25rem;
        }

        .eyebrow-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #3b82f6;
          animation: greenPulse 2s ease-in-out infinite;
        }

        .hero-title {
          font-size: clamp(2.4rem, 5vw, 4rem);
          font-weight: 900;
          line-height: 1.05;
          letter-spacing: -0.03em;
          color: white !important;
          margin-bottom: 1.25rem;
        }

        .hero-subtitle {
          font-size: 1.08rem;
          line-height: 1.75;
          color: rgba(255,255,255,0.8) !important;
          margin-bottom: 2rem;
          max-width: 580px;
        }

        .hero-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 2rem;
        }

        .btn-hero-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.95rem 2rem;
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 0.97rem;
          border-radius: var(--radius-xl);
          border: none;
          cursor: pointer;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
          transition: all 200ms ease;
          position: relative;
          overflow: hidden;
          z-index: 10;
        }
        .btn-hero-primary:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.3);
        }

        .hero-trust-bar {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .trust-item {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.82rem;
          font-weight: 600;
          color: rgba(255,255,255,0.72);
        }
        .trust-item svg { color: #3b82f6; flex-shrink: 0; }
        .trust-divider { width: 1px; height: 16px; background: rgba(255,255,255,0.2); }

        .hero-card {
          border-radius: var(--radius-xl);
          padding: 1.75rem;
          box-shadow: 0 6px 18px rgba(0,0,0,0.14);
          max-width: 360px;
          margin-left: auto;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(15,23,42,0.4) !important;
          backdrop-filter: none !important;
        }

        .hero-card-tag {
          display: inline-flex;
          padding: 0.3rem 0.75rem;
          border-radius: 999px;
          background: rgba(59, 130, 246, 0.2);
          color: #93C5FD;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 0.85rem;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .hero-card h3 {
          font-size: 1.15rem;
          margin-bottom: 1rem;
          color: white !important;
          font-weight: 700;
          line-height: 1.4;
        }

        .hero-card-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
        }

        .hero-card-list li {
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
          font-size: 0.9rem;
          color: rgba(255,255,255,0.82);
          line-height: 1.4;
        }

        .list-check {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.72rem;
          font-weight: 800;
          flex-shrink: 0;
        }

        .carousel-dots {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 0.6rem;
          z-index: 100;
        }
        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255,255,255,0.35);
          border: none;
          cursor: pointer;
          transition: all 300ms ease;
        }
        .dot.active {
          background: #3b82f6;
          width: 28px;
          border-radius: 5px;
        }

        .scroll-indicator {
          position: absolute;
          bottom: 2rem;
          right: 2rem;
          z-index: 100;
          opacity: 0.6;
          animation: float 3s ease-in-out infinite;
        }
        .scroll-mouse {
          width: 24px;
          height: 38px;
          border: 2px solid rgba(255,255,255,0.5);
          border-radius: 12px;
          display: flex;
          justify-content: center;
          padding-top: 5px;
        }
        .scroll-wheel {
          width: 3px;
          height: 8px;
          background: rgba(255,255,255,0.7);
          border-radius: 2px;
          animation: scrollWheel 1.5s ease-in-out infinite;
        }
        @keyframes scrollWheel {
          0%   { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(8px); opacity: 0; }
        }

        /* ── Stats Bar ──────────────────────────────────────────────────────── */
        .stats-section {
          padding: 0;
          background: var(--bg-secondary);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-top: 1px solid var(--border-color);
          border-bottom: 1px solid var(--border-color);
        }

        .stat-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.15rem;
          padding: 1.25rem 1rem;
          text-align: center;
          border-right: 1px solid var(--border-color);
          transition: background var(--transition-fast);
        }
        .stat-card:last-child { border-right: none; }
        .stat-card:hover { background: rgba(37, 99, 235, 0.04); }

        .stat-emoji { font-size: 1.3rem; line-height: 1; margin-bottom: 0.15rem; }

        .stat-value {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--primary-color);
          letter-spacing: -0.02em;
          line-height: 1;
        }

        .stat-label {
          font-size: 0.65rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* ── Story ──────────────────────────────────────────────────────────── */
        .story-section {
          background: var(--bg-secondary);
          position: relative;
          overflow: hidden;
          padding: 2rem 0;
        }

        .story-bg-shape {
          position: absolute;
          top: -80px;
          right: -80px;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%);
          pointer-events: none;
        }

        .story-grid {
          display: grid;
          grid-template-columns: 1fr 1.1fr;
          gap: 3rem;
          align-items: center;
        }

        .story-image-container { position: relative; }

        .story-img-wrapper {
          border-radius: var(--radius-2xl);
          overflow: hidden;
          box-shadow: var(--shadow-xl);
          position: relative;
          aspect-ratio: 16/9;
          width: 100%;
        }

        .story-img {
          width: 100%;
          display: block;
          border-radius: var(--radius-2xl);
        }

        .story-img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 60%, rgba(15,23,42,0.3) 100%);
        }

        .purity-card {
          position: absolute;
          bottom: -1.5rem;
          right: -1.5rem;
          padding: 1rem 1.25rem;
          border-radius: var(--radius-xl);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          max-width: 240px;
          box-shadow: var(--shadow-xl);
        }
        .purity-icon { font-size: 1.5rem; }
        .purity-card strong { display: block; font-size: 0.95rem; color: var(--text-primary); }
        .purity-card p { font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.15rem; }

        .story-badge-pill {
          position: absolute;
          top: 1.25rem;
          left: -0.75rem;
          padding: 0.35rem 0.9rem;
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          color: white;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 700;
          box-shadow: var(--shadow-md);
        }

        .story-title {
          font-size: clamp(1.75rem, 3vw, 2.25rem);
          font-weight: 800;
          margin: 0.5rem 0 0.75rem;
          letter-spacing: -0.025em;
          line-height: 1.15;
        }

        .story-description {
          line-height: 1.5;
          color: var(--text-secondary);
          margin-bottom: 1.25rem;
          font-size: 1rem;
        }

        .values-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .value-item {
          display: flex;
          gap: 0.6rem;
          padding: 0.6rem 0.8rem;
          border-radius: var(--radius-lg);
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          transition: all var(--transition-normal);
        }
        .value-item:hover {
          border-color: var(--primary-color);
          background: rgba(37,99,235,0.04);
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }

        .value-icon {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          background: rgba(37,99,235,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .value-item h4 { font-size: 0.9rem; font-weight: 700; margin-bottom: 0.2rem; }
        .value-item p  { font-size: 0.8rem; color: var(--text-muted); line-height: 1.4; }
        
        .story-cta { margin-top: 1rem; }

        /* ── Products ───────────────────────────────────────────────────────── */
        .product-preview-section {
          background: var(--bg-primary);
          position: relative;
          padding: 2rem 0 1rem;
        }

        .section-bg-dots {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(37,99,235,0.06) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }

        .section-header {
          text-align: center;
          max-width: 640px;
          margin: 0 auto 2rem;
        }
        .section-header h2 {
          font-size: clamp(1.8rem, 3vw, 2.5rem);
          margin: 0.5rem 0;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .section-header p {
          color: var(--text-secondary);
          line-height: 1.7;
          font-size: 1rem;
        }

        .preview-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }

        .product-preview-card {
          background: var(--bg-secondary);
          border-radius: var(--radius-xl);
          border: 1px solid var(--border-color);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: all var(--transition-normal);
          box-shadow: var(--shadow-sm);
          position: relative;
        }
        .product-preview-card:hover {
          transform: translateY(-8px);
          box-shadow: var(--shadow-xl);
          border-color: var(--primary-color);
        }

        .prod-img-box {
          width: 100%;
          height: auto;
          aspect-ratio: 16 / 10;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--product-image-bg);
          position: relative;
          overflow: hidden;
          padding: 0;
        }

        .prod-img-box img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform var(--transition-normal);
          position: relative;
          z-index: 1;
        }
        .product-preview-card:hover .prod-img-box img { transform: scale(1.06); }

        .prod-img-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(37,99,235,0.06) 0%, transparent 70%);
        }

        .prod-info-box { padding: 0.75rem; flex: 1; display: flex; flex-direction: column; }

        .prod-meta {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          margin-bottom: 0.2rem;
        }

        .prod-vol {
          display: inline-block;
          font-size: 0.6rem;
          font-weight: 700;
          color: var(--primary-color);
          background: rgba(37,99,235,0.1);
          padding: 0.15rem 0.5rem;
          border-radius: 999px;
          border: 1px solid rgba(37,99,235,0.2);
        }

        .prod-badge-best {
          display: inline-block;
          font-size: 0.58rem;
          font-weight: 700;
          color: #ea6a0a;
          background: rgba(249,115,22,0.1);
          padding: 0.15rem 0.45rem;
          border-radius: 999px;
          border: 1px solid rgba(249,115,22,0.2);
        }

        .prod-info-box h3 { font-size: 0.95rem; font-weight: 700; margin-bottom: 0.3rem; }
        .prod-info-box p  { font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: 0.5rem; flex: 1; }

        .prod-footer {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: auto;
          border-top: 1px solid var(--border-color);
          padding-top: 0.5rem;
        }

        .prod-price-label {
          display: block;
          font-size: 0.6rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .prod-price {
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--primary-color);
          font-family: var(--font-heading);
          letter-spacing: -0.02em;
        }

        .prod-footer .btn-sm {
          padding: 0.35rem 0.75rem;
          font-size: 0.7rem;
          min-height: 28px;
          line-height: 1;
          border-radius: var(--radius-md);
        }

        .view-all-wrap {
          text-align: center;
          margin-top: 1rem;
        }
        
        .view-all-wrap .btn-lg {
          padding: 0.55rem 1.3rem;
          font-size: 0.82rem;
          min-height: 36px;
          border-radius: var(--radius-md);
          line-height: 1;
        }
        
        .view-all-wrap .btn-lg svg {
          width: 15px;
          height: 15px;
        }

        .rush-section {
          background: linear-gradient(135deg, #020617 0%, #0f172a 100%);
          color: white;
          position: relative;
          overflow: hidden;
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
          gap: 4rem;
          align-items: center;
        }

        .rush-title {
          font-size: clamp(2rem, 4vw, 3.2rem);
          font-weight: 900;
          color: white;
          margin: 1rem 0 1.5rem;
          letter-spacing: -0.025em;
          line-height: 1.1;
        }

        .rush-brand {
          background: linear-gradient(135deg, #f97316, #fbbf24);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .rush-text {
          color: rgba(255,255,255,0.65);
          line-height: 1.8;
          margin-bottom: 2rem;
          font-size: 1rem;
        }

        .rush-features {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: 2.5rem;
        }

        .rush-pill {
          padding: 0.45rem 1.1rem;
          border-radius: 999px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          font-size: 0.83rem;
          font-weight: 600;
          color: rgba(255,255,255,0.75);
        }

        .btn-rush {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.95rem 2rem;
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 0.95rem;
          border-radius: var(--radius-xl);
          border: none;
          cursor: pointer;
          background: linear-gradient(135deg, #f97316, #ea580c);
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
          width: 148px;
          height: 290px;
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

        /* ── FAQ ────────────────────────────────────────────────────────────── */
        .faq-section {
          background: var(--bg-secondary);
          padding-top: 2.25rem;
          padding-bottom: 2.25rem;
        }

        .faq-section .section-header {
          margin-bottom: 1.75rem;
        }

        .faq-section .section-header h2 {
          margin-top: 0.55rem;
          margin-bottom: 0.45rem;
        }

        .faq-section .section-header p {
          line-height: 1.5;
        }


        /* ── Responsive ─────────────────────────────────────────────────────── */
        @media (max-width: 1024px) {
          .hero-content, .story-grid, .rush-grid {
            grid-template-columns: 1fr;
            gap: 2.5rem;
          }
          .hero-card { margin: 0 auto; max-width: 100%; }
          .story-image-container { max-width: 500px; margin: 0 auto; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .stat-card { border-right: none; border-bottom: 1px solid var(--border-color); }
          .stat-card:nth-child(odd) { border-right: 1px solid var(--border-color); }
          .stat-card:nth-last-child(-n+2) { border-bottom: none; }
        }

        @media (max-width: 768px) {
          .hero-section { min-height: 700px; height: 100svh; }
          .preview-grid { grid-template-columns: 1fr; max-width: 420px; margin: 0 auto; }
          .values-grid { grid-template-columns: 1fr; }
          .scroll-indicator { display: none; }
        }

        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: 1fr 1fr; }
          .hero-trust-bar { gap: 0.75rem; }
          .trust-divider { display: none; }
          .faq-section { padding-top: 1.75rem; padding-bottom: 1.75rem; }
          .faq-section .section-header { margin-bottom: 1.25rem; }
        }
      `}</style>
    </div>
  );
}
