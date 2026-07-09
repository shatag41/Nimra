'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Banner, Product, FAQ, CompanyInfo } from '@/types/cms';
import { useCMSData } from '@/frontend/customer/hooks/useCMSData';
import FAQSection from './FAQSection';
import { UpcomingProducts } from './UpcomingProducts';
import { ProductSection } from './portal/Products';

interface HomeClientProps {
  banners: Banner[];
  products: Product[];
  faqs: FAQ[];
  companyInfo: CompanyInfo;
}

export default function HomeClient({ banners: initialBanners, products: initialProducts, faqs: initialFaqs, companyInfo: initialCompanyInfo }: HomeClientProps) {
  const { banners: dynamicBanners, products: dynamicProducts, faqs: dynamicFaqs, companyInfo: dynamicCompanyInfo } = useCMSData();
  
  const banners = dynamicBanners && dynamicBanners.length > 0 ? dynamicBanners : initialBanners;
  const products = dynamicProducts && dynamicProducts.length > 0 ? dynamicProducts : initialProducts;
  const faqs = dynamicFaqs && dynamicFaqs.length > 0 ? dynamicFaqs : initialFaqs;
  const companyInfo = dynamicCompanyInfo && Object.keys(dynamicCompanyInfo).length > 2 ? dynamicCompanyInfo : initialCompanyInfo;

  const [{ activeBanner, loadedBannerIndexes }, setCarouselState] = useState(() => ({
    activeBanner: 0,
    loadedBannerIndexes: new Set([0, 1]),
  }));
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (banners.length < 2) return;
    const interval = window.setInterval(() => {
      setCarouselState((current) => {
        const next = (current.activeBanner + 1) % banners.length;
        const loaded = new Set(current.loadedBannerIndexes);
        loaded.add(next);
        loaded.add((next + 1) % banners.length);
        loaded.add((next - 1 + banners.length) % banners.length);
        return { activeBanner: next, loadedBannerIndexes: loaded };
      });
    }, 5500);
    return () => window.clearInterval(interval);
  }, [banners.length]);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const heroObserver = new IntersectionObserver(([entry]) => {
      hero.classList.toggle('is-visible', entry.isIntersecting);
    }, { threshold: 0.05 });

    const deferredSections = Array.from(document.querySelectorAll<HTMLElement>('.home-deferred-section'));
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle('is-visible', entry.isIntersecting));
    }, { rootMargin: '100px 0px', threshold: 0.01 });

    heroObserver.observe(hero);
    deferredSections.forEach((section) => sectionObserver.observe(section));
    return () => {
      heroObserver.disconnect();
      sectionObserver.disconnect();
    };
  }, []);

  const handleHeroPointer = useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--pointer-x', ((((event.clientX - rect.left) / rect.width) - 0.5) * 2).toFixed(3));
    event.currentTarget.style.setProperty('--pointer-y', ((((event.clientY - rect.top) / rect.height) - 0.5) * 2).toFixed(3));
  }, []);

  const resetHeroPointer = useCallback((event: React.PointerEvent<HTMLElement>) => {
    event.currentTarget.style.setProperty('--pointer-x', '0');
    event.currentTarget.style.setProperty('--pointer-y', '0');
  }, []);

  const handleCardPointer = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--card-x', ((((event.clientX - rect.left) / rect.width) - 0.5) * 2).toFixed(3));
    event.currentTarget.style.setProperty('--card-y', ((((event.clientY - rect.top) / rect.height) - 0.5) * 2).toFixed(3));
  }, []);

  const resetCardPointer = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.setProperty('--card-x', '0');
    event.currentTarget.style.setProperty('--card-y', '0');
  }, []);

  const handleMagneticPointer = useCallback((event: React.PointerEvent<HTMLAnchorElement>) => {
    if (event.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--mag-x', `${((event.clientX - rect.left) / rect.width - 0.5) * 7}px`);
    event.currentTarget.style.setProperty('--mag-y', `${((event.clientY - rect.top) / rect.height - 0.5) * 7}px`);
  }, []);

  const resetMagneticPointer = useCallback((event: React.PointerEvent<HTMLAnchorElement>) => {
    event.currentTarget.style.setProperty('--mag-x', '0px');
    event.currentTarget.style.setProperty('--mag-y', '0px');
  }, []);

  const spotlightProducts = useMemo(() => products.slice(0, 3), [products]);

  const upcomingProducts = useMemo(() => {
    return products.filter((p) => {
      const stock = String(p.StockStatus || '').toLowerCase();
      const cat = String(p.Category || '').toLowerCase();
      return stock.includes('coming') || stock.includes('upcoming') || cat.includes('upcoming');
    });
  }, [products]);
  return (
    <div className="home-page">
      {/* ─── 1. HERO CAROUSEL ───────────────────────────────────────────────── */}
      <section className="hero-section" ref={heroRef} onPointerMove={handleHeroPointer} onPointerLeave={resetHeroPointer}>
        {banners.map((banner, index) => (
          <div
            key={banner.ID}
            className={`hero-slide ${index === activeBanner ? 'active' : ''}`}
            aria-hidden={index !== activeBanner}
          >
            {loadedBannerIndexes.has(index) && banner.ImageUrl && (
              <Image
                src={banner.ImageUrl}
                alt=""
                fill
                priority={index === 0}
                unoptimized
                quality={75}
                sizes="100vw"
                className="hero-slide-image"
              />
            )}
            <div className="hero-depth hero-crystals" aria-hidden="true" />
            <div className="hero-fog hero-fog-one" aria-hidden="true" />
            <div className="hero-fog hero-fog-two" aria-hidden="true" />
            <div className="hero-particles" aria-hidden="true">
              {Array.from({ length: 14 }, (_, index) => <i key={index} />)}
            </div>
            <div className="hero-ripples" aria-hidden="true"><i /><i /><i /></div>
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

              <div className="hero-visual-column">
              <div className="hero-card-shell">
              <div className="hero-card glass" onPointerMove={handleCardPointer} onPointerLeave={resetCardPointer}>
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
                <Link href="/products" className="btn btn-primary ds-btn-full hero-card-cta" onPointerMove={handleMagneticPointer} onPointerLeave={resetMagneticPointer}>
                  Explore Products
                </Link>
              </div>
              </div>
              </div>
            </div>
          </div>
        ))}

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
            </div>

            <div className="story-image-container">
              <div className="story-img-wrapper">
                  <Image
                    src="/nimra_about_image.png"
                    alt="Nimra Premium Water"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    quality={72}
                    style={{ objectFit: 'cover' }}
                    className="story-img animate-float-slow"
                  />
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
                <span>Since 2026</span>
              </div>
            </div>
          </div>
          <div className="story-cta-wrap">
            <Link href="/about" className="btn btn-primary story-cta">
              Discover Our Standards
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 4. PRODUCT PREVIEW ─────────────────────────────────────────────── */}
      <section className="product-preview-section home-deferred-section">
        <div className="section-bg-dots" />
        <div className="container">
          <ProductSection 
            badge="Our Offerings"
            title="NIMRA Packaged Water Range"
            subtitle="From mini desk bottles to massive 20-litre office jars, we cover all your hydration requirements."
            products={spotlightProducts}
            viewAllLink="/products"
            viewAllText="View More Products"
            getBadgeText={(_, i) => ['Best Seller', 'Premium Choice', 'Most Popular'][i]}
            actionLink="/products"
            actionText="View More"
            descriptionOnly={true}
            compact={true}
          />
        </div>
      </section>

      {/* ─── 5. DYNAMIC UPCOMING TEASER ──────────────────────────────────────── */}
      <UpcomingProducts upcomingProducts={upcomingProducts} />

      {/* ─── 6. FAQ ─────────────────────────────────────────────────────────── */}
      <section className="faq-section">
        <div className="container">
          <FAQSection faqs={faqs} />
        </div>
      </section>

      <style jsx>{`
        /* ── Hero ───────────────────────────────────────────────────────────── */
        .hero-section {
          height: 100vh;
          height: 100svh;
          min-height: 640px;
          max-height: none;
          position: relative;
          overflow: hidden;
          background: #020b1b;
          --pointer-x: 0;
          --pointer-y: 0;
          isolation: isolate;
          padding-block: 0;
          margin-top: 0;
        }

        .hero-slide {
          position: absolute;
          inset: 0;
          opacity: 0;
          z-index: 1;
          display: flex;
          align-items: center;
          transition: opacity 1100ms cubic-bezier(.4,0,.2,1);
          will-change: opacity;
          transform: translateZ(0);
        }
        .hero-slide.active { opacity: 1; z-index: 2; }

        .hero-slide-image {
          object-fit: cover;
          object-position: center top;
          z-index: 0;
          transform: translate3d(calc(var(--pointer-x) * -8px), calc(var(--pointer-y) * -6px), 0) scale(1.07);
          animation: cinematicZoom 20s ease-in-out infinite alternate;
          will-change: transform;
          filter: saturate(1.12) contrast(1.07) brightness(1.06);
        }

        .hero-depth { position: absolute; inset: -5%; pointer-events: none; will-change: transform; }
        .hero-crystals { z-index: 2; opacity: .4; background: conic-gradient(from 190deg at 88% 82%, transparent 0 8%, rgba(96,165,250,.35) 9% 10%, transparent 11% 100%), conic-gradient(from 170deg at 75% 92%, transparent 0 10%, rgba(147,197,253,.28) 11% 12%, transparent 13% 100%); transform: translate3d(calc(var(--pointer-x) * 18px), calc(var(--pointer-y) * 12px),0); }
        .hero-fog { position:absolute; z-index:3; width:65%; height:28%; border-radius:50%; background:rgba(174,220,255,.12); filter:blur(55px); will-change:transform; pointer-events:none; }
        .hero-fog-one { left:-20%; bottom:4%; animation:fogDrift 18s ease-in-out infinite alternate; }
        .hero-fog-two { right:-18%; top:15%; opacity:.55; animation:fogDrift 22s ease-in-out -7s infinite alternate-reverse; }
        .hero-particles { position:absolute; inset:0; z-index:4; pointer-events:none; }
        .hero-particles i { position:absolute; bottom:-5%; width:5px; height:5px; border-radius:50%; background:rgba(210,238,255,.7); box-shadow:0 0 12px rgba(96,165,250,.55); animation:bubbleRise 11s linear infinite; will-change:transform,opacity; }
        .hero-particles i:nth-child(1){left:8%;animation-delay:-2s}.hero-particles i:nth-child(2){left:17%;animation-delay:-7s;width:3px;height:3px}.hero-particles i:nth-child(3){left:29%;animation-delay:-4s}.hero-particles i:nth-child(4){left:38%;animation-delay:-9s;width:2px;height:2px}.hero-particles i:nth-child(5){left:48%;animation-delay:-1s}.hero-particles i:nth-child(6){left:56%;animation-delay:-6s;width:3px;height:3px}.hero-particles i:nth-child(7){left:63%;animation-delay:-3s}.hero-particles i:nth-child(8){left:71%;animation-delay:-8s;width:2px;height:2px}.hero-particles i:nth-child(9){left:79%;animation-delay:-5s}.hero-particles i:nth-child(10){left:88%;animation-delay:-10s;width:3px;height:3px}.hero-particles i:nth-child(11){left:93%;animation-delay:-4s}.hero-particles i:nth-child(12){left:34%;animation-delay:-11s;width:2px;height:2px}.hero-particles i:nth-child(13){left:68%;animation-delay:-1s}.hero-particles i:nth-child(14){left:22%;animation-delay:-6s;width:3px;height:3px}
        .hero-ripples { position:absolute; z-index:3; left:52%; bottom:-7%; width:48%; aspect-ratio:2/1; pointer-events:none; }
        .hero-ripples i { position:absolute; inset:30%; border:1px solid rgba(147,197,253,.28); border-radius:50%; animation:ripple 6s ease-out infinite; }
        .hero-ripples i:nth-child(2){animation-delay:2s}.hero-ripples i:nth-child(3){animation-delay:4s}
        @keyframes cinematicZoom { to { transform:translate3d(calc(var(--pointer-x) * -8px),calc(var(--pointer-y) * -6px),0) scale(1.13); } }
        @keyframes fogDrift { to { transform:translate3d(28%, -12%,0) scale(1.18); } }
        @keyframes bubbleRise { 0%{transform:translate3d(0,0,0) scale(.5);opacity:0} 15%{opacity:.75} 100%{transform:translate3d(18px,-105vh,0) scale(1.2);opacity:0} }
        @keyframes ripple { 0%{transform:scale(.35);opacity:0} 20%{opacity:.6} 100%{transform:scale(3.2);opacity:0} }

        .hero-slide-shade {
          position: absolute;
          inset: 0;
          z-index: 1;
          background: linear-gradient(105deg, rgba(15,23,42,0.42) 0%, rgba(15,23,42,0.27) 42%, rgba(30,64,175,0.1) 72%, rgba(37,99,235,0.02) 100%);
          pointer-events: none;
        }

        .home-deferred-section {
          content-visibility: auto;
          contain-intrinsic-size: auto 700px;
          will-change: opacity, transform;
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
          gap: clamp(2rem, 5vw, 4rem);
          align-items: center;
          padding-top: clamp(4rem, 7vh, 5rem);
          min-height: 100%;
        }

        .hero-copy { max-width: 680px; }
        .hero-copy > * { opacity:0; animation:heroReveal .9s cubic-bezier(.16,1,.3,1) forwards; }
        .hero-copy > :nth-child(2){animation-delay:.12s}.hero-copy > :nth-child(3){animation-delay:.22s}.hero-copy > :nth-child(4){animation-delay:.34s}.hero-copy > :nth-child(5){animation-delay:.48s}
        @keyframes heroReveal { from{opacity:0;transform:translate3d(0,24px,0) scale(.985)} to{opacity:1;transform:translate3d(0,0,0) scale(1)} }

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
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
          color: #fff !important;
          border-color: rgba(147,197,253,.55) !important;
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 10px 28px rgba(37,99,235,.42), 0 0 22px rgba(59,130,246,.2) !important;
        }
        .btn-hero-primary::after, .btn-ghost::after { content:''; position:absolute; inset:0; background:radial-gradient(circle,rgba(255,255,255,.5) 0,transparent 55%); transform:scale(0); opacity:0; transition:transform .55s ease,opacity .55s ease; }
        .btn-hero-primary:hover::after, .btn-ghost:hover::after { transform:scale(2); opacity:.22; }
        .btn-ghost { position:relative; overflow:hidden; transition:transform .25s ease,box-shadow .25s ease; }
        .btn-ghost:hover { background:linear-gradient(135deg,rgba(255,255,255,.24),rgba(96,165,250,.2)) !important; color:#fff !important; border-color:rgba(191,219,254,.72) !important; transform:translateY(-3px); box-shadow:0 10px 28px rgba(37,99,235,.24),inset 0 1px 0 rgba(255,255,255,.2) !important; }

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
          padding: 2rem;
          box-shadow: 0 18px 55px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.13);
          max-width: 360px;
          border: 0;
          background: rgba(8,18,39,.58) !important;
          backdrop-filter: blur(24px) saturate(145%) !important;
          transform: perspective(900px) rotateX(calc(var(--card-y, 0) * -3deg)) rotateY(calc(var(--card-x, 0) * 3deg)) translateZ(0);
          transition: transform .18s ease-out, box-shadow .35s ease;
          will-change: transform;
          overflow:hidden;
          position:relative;
          isolation:isolate;
        }

        .hero-card::after { content:''; position:absolute; z-index:-1; inset:-45%; background:linear-gradient(105deg,transparent 38%,rgba(255,255,255,.12) 48%,rgba(147,197,253,.2) 52%,transparent 62%); transform:translate3d(-55%,0,0) rotate(8deg); animation:cardSweep 7s ease-in-out infinite; pointer-events:none; }
        .hero-card:hover { transform:perspective(900px) rotateX(calc(var(--card-y, 0) * -3deg)) rotateY(calc(var(--card-x, 0) * 3deg)) translate3d(0,-5px,16px); box-shadow:0 28px 75px rgba(0,0,0,.3),0 0 38px rgba(59,130,246,.15),inset 0 1px 0 rgba(255,255,255,.2); }
        .hero-card-shell { max-width:362px; margin-left:auto; padding:1px; border-radius:calc(var(--radius-xl) + 1px); background:conic-gradient(from var(--border-angle, 0deg),rgba(255,255,255,.1),rgba(96,165,250,.7),rgba(255,255,255,.12),rgba(37,99,235,.5),rgba(255,255,255,.1)); animation:cardFloat 6s ease-in-out infinite, borderSpin 9s linear infinite, cardShellReveal 1s .46s ease both; filter:drop-shadow(0 15px 34px rgba(37,99,235,.14)); will-change:transform; }
        .hero-visual-column { position:relative; display:flex; align-items:center; justify-content:flex-end; min-height:470px; transform:translate3d(calc(var(--pointer-x) * 7px),calc(var(--pointer-y) * 5px),0); transition:transform .15s linear; will-change:transform; }
        @property --border-angle { syntax:'<angle>'; initial-value:0deg; inherits:false; }
        @keyframes borderSpin { to{--border-angle:360deg} }
        @keyframes cardFloat { 0%,100%{transform:translate3d(0,-2px,0)} 50%{transform:translate3d(0,4px,0)} }
        @keyframes cardShellReveal { from{opacity:0} to{opacity:1} }
        @keyframes cardSweep { 0%,15%{transform:translate3d(-55%,0,0) rotate(8deg);opacity:0} 35%{opacity:1} 60%,100%{transform:translate3d(55%,0,0) rotate(8deg);opacity:0} }

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
        .hero-card-list li { opacity:0; animation:cardItemIn .55s cubic-bezier(.16,1,.3,1) forwards; }
        .hero-card-list li:nth-child(1){animation-delay:.8s}.hero-card-list li:nth-child(2){animation-delay:.95s}.hero-card-list li:nth-child(3){animation-delay:1.1s}
        .hero-card-list li .list-check { animation:checkPulse 2.8s ease-in-out infinite; }
        .hero-card-list li:nth-child(2) .list-check{animation-delay:.2s}.hero-card-list li:nth-child(3) .list-check{animation-delay:.4s}
        @keyframes cardItemIn { from{opacity:0;transform:translate3d(10px,0,0)} to{opacity:1;transform:translate3d(0,0,0)} }
        @keyframes checkPulse { 50%{transform:scale(1.12);box-shadow:0 0 14px rgba(59,130,246,.32)} }
        .hero-card-cta { --mag-x:0px; --mag-y:0px; position:relative; overflow:hidden; transform:translate3d(var(--mag-x),var(--mag-y),0); transition:transform .18s ease-out,box-shadow .25s ease,filter .25s ease; }
        .hero-card-cta::after { content:''; position:absolute; inset:0; background:radial-gradient(circle at 50%,rgba(255,255,255,.55),transparent 55%); transform:scale(0);opacity:0;transition:transform .55s ease,opacity .55s ease; }
        .hero-card-cta:hover { box-shadow:0 10px 28px rgba(37,99,235,.42);filter:brightness(1.08); }
        .hero-card-cta:hover::after { transform:scale(2.2);opacity:.2; }

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
          position: relative;
          overflow: hidden;
          padding: 0.5rem 0;
          background:
            radial-gradient(circle at 14% 35%, rgba(37, 99, 235, 0.105), transparent 28%),
            radial-gradient(circle at 86% 62%, rgba(14, 165, 233, 0.085), transparent 26%),
            linear-gradient(180deg, var(--bg-secondary), color-mix(in srgb, var(--bg-secondary) 92%, #eff6ff 8%));
        }

        .stats-section::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image:
            radial-gradient(circle, rgba(59,130,246,0.14) 1px, transparent 1.5px),
            radial-gradient(circle, rgba(14,165,233,0.1) 1px, transparent 1.5px);
          background-size: 46px 46px, 72px 72px;
          background-position: 0 0, 22px 16px;
          opacity: 0.26;
        }

        .stats-section::after {
          content: '';
          position: absolute;
          inset: 18% 12%;
          border-radius: 999px;
          background: radial-gradient(ellipse, rgba(147, 197, 253, 0.14), transparent 62%);
          filter: blur(22px);
          pointer-events: none;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: clamp(0.55rem, 1vw, 0.8rem);
          position: relative;
          z-index: 1;
          align-items: stretch;
          justify-content: center;
        }

        .stat-card {
          --stat-accent: #2563eb;
          --stat-accent-soft: rgba(37, 99, 235, 0.14);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.24rem;
          min-height: 6.45rem;
          padding: 0.82rem 0.95rem;
          text-align: center;
          position: relative;
          overflow: hidden;
          border-radius: 20px;
          border: 1px solid rgba(147, 197, 253, 0.24);
          background:
            linear-gradient(145deg, rgba(255,255,255,0.78), rgba(255,255,255,0.42)),
            radial-gradient(circle at 50% 0%, var(--stat-accent-soft), transparent 58%);
          box-shadow: 0 9px 24px rgba(15, 23, 42, 0.07), inset 0 1px 0 rgba(255,255,255,0.58);
          backdrop-filter: blur(14px) saturate(140%);
          -webkit-backdrop-filter: blur(14px) saturate(140%);
          transition: transform 300ms ease, border-color 300ms ease, box-shadow 300ms ease, background 300ms ease, filter 300ms ease;
        }

        .stat-card:nth-child(2) { --stat-accent: #0891b2; --stat-accent-soft: rgba(8, 145, 178, 0.14); }
        .stat-card:nth-child(3) { --stat-accent: #1d4ed8; --stat-accent-soft: rgba(29, 78, 216, 0.145); }
        .stat-card:nth-child(4) { --stat-accent: #0284c7; --stat-accent-soft: rgba(2, 132, 199, 0.14); }

        .stat-card::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(120deg, rgba(255,255,255,0.32), transparent 38%, rgba(59,130,246,0.08)),
            radial-gradient(circle at 50% 115%, color-mix(in srgb, var(--stat-accent) 24%, transparent), transparent 48%);
          opacity: 0;
          transition: opacity 300ms ease;
        }

        .stat-card:hover {
          transform: translateY(-8px);
          filter: brightness(1.02);
          border-color: color-mix(in srgb, var(--stat-accent) 48%, rgba(147,197,253,0.34));
          box-shadow: 0 18px 38px rgba(37, 99, 235, 0.16), 0 0 26px color-mix(in srgb, var(--stat-accent) 18%, transparent), inset 0 1px 0 rgba(255,255,255,0.68);
        }

        .stat-card:hover::before { opacity: 1; }

        .stat-emoji {
          width: 2.35rem;
          height: 2.35rem;
          display: grid;
          place-items: center;
          border-radius: 999px;
          margin-bottom: 0.18rem;
          font-size: 1.08rem;
          line-height: 1;
          background:
            linear-gradient(145deg, rgba(255,255,255,0.84), rgba(219,234,254,0.42)),
            radial-gradient(circle at 35% 18%, color-mix(in srgb, var(--stat-accent) 26%, transparent), transparent 54%);
          border: 1px solid rgba(147,197,253,0.28);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.68), 0 0 18px color-mix(in srgb, var(--stat-accent) 18%, transparent);
          transition: transform 300ms ease, box-shadow 300ms ease, background 300ms ease;
        }

        .stat-card:hover .stat-emoji {
          transform: scale(1.08) rotate(4deg);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.78), 0 0 26px color-mix(in srgb, var(--stat-accent) 30%, transparent);
        }

        .stat-value {
          font-family: var(--font-heading);
          font-size: clamp(1.1rem, 1.6vw, 1.42rem);
          font-weight: 900;
          color: var(--stat-accent);
          background: linear-gradient(135deg, #1e3a8a, var(--stat-accent) 58%, #38bdf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.045em;
          line-height: 0.96;
          transition: transform 300ms ease, filter 300ms ease;
        }

        .stat-card:hover .stat-value {
          transform: translateY(-3px);
          filter: drop-shadow(0 0 9px color-mix(in srgb, var(--stat-accent) 28%, transparent));
        }

        .stat-label {
          margin-top: 0.1rem;
          font-size: 0.62rem;
          font-weight: 750;
          color: color-mix(in srgb, var(--text-secondary) 86%, #334155 14%);
          text-transform: uppercase;
          letter-spacing: 0.085em;
          line-height: 1.15;
        }

        /* ── Story ──────────────────────────────────────────────────────────── */
        .story-section {
          background:
            radial-gradient(circle at 14% 16%, rgba(37, 99, 235, 0.095), transparent 28%),
            radial-gradient(circle at 84% 48%, rgba(14, 165, 233, 0.085), transparent 30%),
            linear-gradient(180deg, color-mix(in srgb, var(--bg-secondary) 94%, #eff6ff 6%), var(--bg-secondary));
          position: relative;
          overflow: hidden;
          padding: 2rem 0;
        }

        .story-section::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.32;
          background-image:
            linear-gradient(rgba(37, 99, 235, 0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(37, 99, 235, 0.055) 1px, transparent 1px);
          background-size: 34px 34px;
          mask-image: radial-gradient(circle at 72% 42%, black, transparent 68%);
        }

        .story-section::after {
          content: '';
          position: absolute;
          inset: auto 8% 10% auto;
          width: 9rem;
          height: 9rem;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(96, 165, 250, 0.16), transparent 68%);
          filter: blur(18px);
          pointer-events: none;
        }

        .story-bg-shape {
          position: absolute;
          top: -80px;
          right: -80px;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(37,99,235,0.13) 0%, transparent 70%);
          pointer-events: none;
        }

        .story-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: clamp(1.7rem, 3.2vw, 2.55rem);
          align-items: center;
          position: relative;
          z-index: 1;
        }

        .story-content {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .story-content .badge {
          align-self: flex-start;
          padding: 0.38rem 0.82rem;
          border-radius: 999px;
          color: #2563eb;
          background:
            linear-gradient(var(--bg-primary), var(--bg-primary)) padding-box,
            linear-gradient(135deg, rgba(96, 165, 250, 0.68), rgba(14, 165, 233, 0.18), rgba(37, 99, 235, 0.48)) border-box;
          border: 1px solid transparent;
          box-shadow: 0 0 0 1px rgba(147, 197, 253, 0.12), 0 10px 28px rgba(37, 99, 235, 0.12);
          backdrop-filter: blur(12px) saturate(145%);
          -webkit-backdrop-filter: blur(12px) saturate(145%);
          font-size: 0.68rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .story-image-container {
          position: relative;
          isolation: isolate;
        }

        .story-image-container::before {
          content: '';
          position: absolute;
          inset: -12% -8% -10% -8%;
          z-index: -1;
          border-radius: 32px;
          background:
            radial-gradient(circle at 50% 42%, rgba(59, 130, 246, 0.22), transparent 42%),
            radial-gradient(ellipse at 50% 92%, rgba(14, 165, 233, 0.16), transparent 46%);
          filter: blur(12px);
          opacity: 0.88;
          transition: opacity 300ms ease, transform 300ms ease;
        }

        .story-image-container:hover::before {
          opacity: 1;
          transform: scale(1.02);
        }

        .story-img-wrapper {
          border-radius: var(--radius-2xl);
          overflow: hidden;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28), 0 22px 52px rgba(15, 23, 42, 0.18), 0 0 34px rgba(37, 99, 235, 0.12);
          position: relative;
          aspect-ratio: 16/9;
          width: 100%;
          border: 1px solid rgba(147, 197, 253, 0.34);
          background:
            linear-gradient(145deg, rgba(255,255,255,0.72), rgba(255,255,255,0.28)),
            radial-gradient(circle at 50% 35%, rgba(59, 130, 246, 0.12), transparent 56%);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .story-img-wrapper::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background:
            radial-gradient(circle at 50% 38%, rgba(255,255,255,0.12), transparent 32%),
            linear-gradient(90deg, rgba(255,255,255,0.2), transparent 22%, transparent 78%, rgba(15,23,42,0.18));
          mix-blend-mode: screen;
          opacity: 0.72;
        }

        .story-img-wrapper::after {
          content: '';
          position: absolute;
          left: 12%;
          right: 12%;
          bottom: 8%;
          height: 18%;
          z-index: 1;
          border-radius: 999px;
          background: radial-gradient(ellipse, rgba(219, 234, 254, 0.2), rgba(37, 99, 235, 0.08) 42%, transparent 72%);
          filter: blur(9px);
          opacity: 0.7;
          pointer-events: none;
        }

        .story-img {
          width: 100%;
          display: block;
          border-radius: var(--radius-2xl);
          transition: transform 420ms cubic-bezier(0.22, 1, 0.36, 1), filter 420ms ease;
        }

        .story-image-container:hover .story-img {
          transform: scale(1.02);
          filter: saturate(1.05) contrast(1.03);
        }

        .story-img-overlay {
          position: absolute;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          background:
            radial-gradient(circle at 50% 42%, transparent 38%, rgba(15,23,42,0.08) 100%),
            linear-gradient(180deg, transparent 58%, rgba(15,23,42,0.32) 100%);
        }

        .purity-card {
          position: absolute;
          bottom: 0.8rem;
          right: 0.8rem;
          z-index: 4;
          padding: 0.72rem 0.88rem;
          border-radius: 18px;
          display: flex;
          align-items: center;
          gap: 0.65rem;
          max-width: min(240px, calc(100% - 1.6rem));
          border: 1px solid rgba(147, 197, 253, 0.34);
          background:
            linear-gradient(145deg, rgba(255,255,255,0.76), rgba(255,255,255,0.42)),
            radial-gradient(circle at 20% 0%, rgba(59,130,246,0.16), transparent 56%);
          box-shadow: 0 16px 38px rgba(15,23,42,0.16), 0 0 24px rgba(37,99,235,0.12);
          backdrop-filter: blur(16px) saturate(145%);
          -webkit-backdrop-filter: blur(16px) saturate(145%);
          animation: storyFloat 5.4s ease-in-out infinite;
          transition: transform 300ms ease, box-shadow 300ms ease, border-color 300ms ease;
        }
        .purity-card:hover {
          transform: translateY(-4px);
          border-color: rgba(96, 165, 250, 0.56);
          box-shadow: 0 18px 46px rgba(15,23,42,0.2), 0 0 30px rgba(37,99,235,0.18);
        }
        .purity-icon {
          width: 2.15rem;
          height: 2.15rem;
          border-radius: 999px;
          display: grid;
          place-items: center;
          font-size: 1.08rem;
          background: linear-gradient(135deg, rgba(219,234,254,0.92), rgba(147,197,253,0.34));
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.55), 0 0 18px rgba(37,99,235,0.18);
          flex: 0 0 auto;
        }
        .purity-card strong { display: block; font-size: 0.95rem; color: var(--text-primary); }
        .purity-card p { font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.15rem; }

        .story-badge-pill {
          position: absolute;
          top: 0.9rem;
          left: 0.9rem;
          z-index: 4;
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.42rem 0.82rem;
          background:
            linear-gradient(135deg, rgba(37,99,235,0.88), rgba(59,130,246,0.72)),
            rgba(255,255,255,0.16);
          color: white;
          border-radius: 999px;
          border: 1px solid rgba(191, 219, 254, 0.42);
          font-size: 0.74rem;
          font-weight: 800;
          letter-spacing: 0.03em;
          box-shadow: 0 14px 28px rgba(37,99,235,0.28), inset 0 1px 0 rgba(255,255,255,0.26);
          backdrop-filter: blur(12px) saturate(140%);
          -webkit-backdrop-filter: blur(12px) saturate(140%);
          animation: storyFloat 5.8s ease-in-out infinite reverse;
        }

        .story-badge-pill::before {
          content: '';
          width: 0.48rem;
          height: 0.48rem;
          border-radius: 999px;
          background: #bfdbfe;
          box-shadow: 0 0 12px rgba(191, 219, 254, 0.9);
        }

        :global(.home-page .section-header h2),
        :global(.home-page .faq-content h2),
        .story-title {
          max-width: none;
          font-size: clamp(1.85rem, 3.2vw, 2.45rem) !important;
          font-weight: 900 !important;
          margin: 0.58rem 0 0.6rem !important; /* Adjusted margin to account for padding */
          padding-bottom: 0.2em !important; /* Fixes clipped descenders like 'g' */
          letter-spacing: -0.045em !important;
          line-height: 1.08 !important;
          color: var(--text-primary) !important;
          background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #2563eb 100%) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
        }

        :global([data-theme="dark"] .home-page .section-header h2),
        :global([data-theme="dark"] .home-page .faq-content h2),
        :global([data-theme="dark"]) .story-title {
          background: linear-gradient(135deg, #e0f2fe 0%, #7dd3fc 45%, #3b82f6 100%) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
        }

        :global(.home-page .section-header h2) {
          line-height: 1.25 !important;
        }

        :global(.home-page .faq-content h2) {
          font-size: clamp(1.5rem, 2.5vw, 2rem) !important;
        }

        .story-description {
          max-width: 540px;
          line-height: 1.62;
          color: color-mix(in srgb, var(--text-secondary) 86%, #64748b 14%);
          margin-bottom: 1rem;
          font-size: clamp(0.88rem, 0.82rem + 0.22vw, 0.98rem);
        }

        .values-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.72rem;
        }

        .value-item {
          display: flex;
          gap: 0.6rem;
          padding: 0.6rem 0.8rem;
          border-radius: 18px;
          background:
            linear-gradient(145deg, rgba(255,255,255,0.78), rgba(255,255,255,0.44)),
            radial-gradient(circle at 0% 0%, rgba(59,130,246,0.1), transparent 54%);
          border: 1px solid rgba(147, 197, 253, 0.24);
          box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255,255,255,0.56);
          backdrop-filter: blur(12px) saturate(132%);
          -webkit-backdrop-filter: blur(12px) saturate(132%);
          transition: transform 300ms ease, border-color 300ms ease, box-shadow 300ms ease, background 300ms ease;
        }
        .value-item:hover {
          border-color: rgba(59,130,246,0.5);
          background:
            linear-gradient(145deg, rgba(255,255,255,0.88), rgba(255,255,255,0.54)),
            radial-gradient(circle at 10% 0%, rgba(59,130,246,0.18), transparent 58%);
          box-shadow: 0 16px 34px rgba(37,99,235,0.14), 0 0 20px rgba(59,130,246,0.12), inset 0 1px 0 rgba(255,255,255,0.62);
          transform: translateY(-6px);
        }

        .value-icon {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          background: linear-gradient(135deg, rgba(219,234,254,0.88), rgba(147,197,253,0.26));
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.6), 0 0 18px rgba(37,99,235,0.12);
          transition: transform 300ms ease, box-shadow 300ms ease, background 300ms ease;
        }

        .value-item:hover .value-icon {
          transform: scale(1.08);
          background: linear-gradient(135deg, rgba(191,219,254,0.96), rgba(59,130,246,0.22));
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.72), 0 0 24px rgba(37,99,235,0.25);
        }

        .value-item h4 { font-size: 0.9rem; font-weight: 800; margin-bottom: 0.18rem; letter-spacing: -0.015em; color: var(--text-primary); }
        .value-item p  { font-size: 0.78rem; color: var(--text-muted); line-height: 1.38; }
        
        .story-cta-wrap {
          display: flex;
          justify-content: center;
          width: 100%;
          margin-top: 1rem;
        }

        .story-cta {
          margin: 0;
        }

        @keyframes storyFloat {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -6px, 0); }
        }

        /* ── Products ───────────────────────────────────────────────────────── */
        .product-preview-section {
          background: var(--bg-primary);
          position: relative;
          padding: 0.9rem 0 0.35rem;
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
          margin: 0 auto 1.25rem;
        }
        .section-header h2 {
          font-size: clamp(1.4rem, 2.5vw, 1.8rem);
          margin: 0.25rem 0;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .section-header p {
          color: var(--text-secondary);
          line-height: 1.4;
          font-size: 0.85rem;
        }

        .preview-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem;
        }

        .product-preview-card {
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: all var(--transition-normal);
          box-shadow: var(--shadow-sm);
          position: relative;
        }
        .product-preview-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
          border-color: var(--primary-color);
        }

        /* .prod-img-box replaced by global .product-img-wrap in globals.css */
        .product-preview-card .product-img-wrap {
          border-bottom: 1px solid var(--border-color);
        }

        .prod-img-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(37,99,235,0.06) 0%, transparent 70%);
        }

        .prod-info-box { padding: 0.6rem; flex: 1; display: flex; flex-direction: column; }

        .prod-meta {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          margin-bottom: 0.2rem;
        }

        .prod-vol {
          display: inline-block;
          font-size: 0.55rem;
          font-weight: 700;
          color: var(--primary-color);
          background: rgba(37,99,235,0.1);
          padding: 0.1rem 0.4rem;
          border-radius: 999px;
          border: 1px solid rgba(37,99,235,0.2);
        }

        .prod-badge-best {
          display: inline-block;
          font-size: 0.55rem;
          font-weight: 700;
          color: #ea6a0a;
          background: rgba(249,115,22,0.1);
          padding: 0.1rem 0.4rem;
          border-radius: 999px;
          border: 1px solid rgba(249,115,22,0.2);
        }

        .prod-info-box h3 { font-size: 0.85rem; font-weight: 700; margin-bottom: 0.2rem; }
        .prod-info-box p  { font-size: 0.7rem; color: var(--text-secondary); line-height: 1.3; margin-bottom: 0.4rem; flex: 1; }

        .prod-footer {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: auto;
          border-top: 1px solid var(--border-color);
          padding-top: 0.4rem;
        }

        .prod-price-label {
          display: block;
          font-size: 0.55rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .prod-price {
          font-size: 0.95rem;
          font-weight: 800;
          color: var(--primary-color);
          font-family: var(--font-heading);
          letter-spacing: -0.02em;
        }

        .prod-footer .btn-sm {
          padding: 0.25rem 0.6rem;
          font-size: 0.65rem;
          min-height: 24px;
          line-height: 1;
          border-radius: var(--radius-md);
        }

        .view-all-wrap {
          text-align: center;
          margin-top: 0.75rem;
        }
        
        .view-all-wrap .btn-lg {
          padding: 0.4rem 1rem;
          font-size: 0.75rem;
          min-height: 30px;
          border-radius: var(--radius-md);
          line-height: 1;
        }
        
        .view-all-wrap .btn-lg svg {
          width: 14px;
          height: 14px;
        }

        /* ── FAQ ────────────────────────────────────────────────────────────── */
        .faq-section {
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at 12% 22%, rgba(37, 99, 235, 0.08), transparent 28%),
            radial-gradient(circle at 88% 78%, rgba(14, 165, 233, 0.055), transparent 25%),
            var(--bg-secondary);
          padding-top: 1.25rem;
          padding-bottom: 1.25rem;
        }


        /* ── Responsive ─────────────────────────────────────────────────────── */
        @media (max-width: 1024px) {
          .hero-content, .story-grid, .rush-grid {
            grid-template-columns: 1fr;
            gap: 2.5rem;
          }
          .hero-content { display:flex; flex-direction:column; justify-content:center; align-items:stretch; padding-top:5rem; }
          .hero-visual-column { min-height:0; }
          .hero-card-shell { margin:0; max-width:100%; }
          .hero-card { max-width:100%; }
          .story-image-container { max-width: 500px; margin: 0 auto; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 768px) {
          .hero-section { min-height: 700px; height: 100svh; }
          .hero-content { gap:1.25rem; padding-top:5.25rem; padding-bottom:2.5rem; }
          .hero-title { font-size:clamp(2.15rem,10vw,3.2rem); }
          .hero-subtitle { font-size:.96rem; line-height:1.6; margin-bottom:1.25rem; }
          .hero-actions { margin-bottom:1.25rem; }
          .hero-card { padding:1.15rem; }
          .hero-card-list { display:none; }
          .hero-card h3 { margin-bottom:.75rem; }
          .preview-grid { grid-template-columns: 1fr; max-width: 420px; margin: 0 auto; }
          .values-grid { grid-template-columns: 1fr; }
          .scroll-indicator { display: none; }
        }

        @keyframes customFadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: 1fr 1fr; }
          .hero-trust-bar { gap: 0.75rem; }
          .trust-divider { display: none; }
          .faq-section { padding-top: 1.25rem; padding-bottom: 1.25rem; }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-section *, .hero-section *::before, .hero-section *::after { animation-duration:.001ms !important; animation-iteration-count:1 !important; transition-duration:.001ms !important; }
          .hero-slide-image, .hero-depth, .hero-visual-column, .hero-card, .hero-card-shell, .hero-card-cta { transform:none !important; }
          .hero-particles, .hero-ripples, .hero-fog { display:none; }
        }
      `}</style>
    </div>
  );
}
