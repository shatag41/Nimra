'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Banner, Product, FAQ, CompanyInfo } from '../types/cms';

interface HomeClientProps {
  banners: Banner[];
  products: Product[];
  faqs: FAQ[];
  companyInfo: CompanyInfo;
}

export default function HomeClient({ banners, products, faqs, companyInfo }: HomeClientProps) {
  const [activeBanner, setActiveBanner] = useState(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Auto-play banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  // Select top 3 products for homepage spotlight
  const spotlightProducts = products.slice(0, 3);

  return (
    <>
      {/* 1. HERO BANNER CAROUSEL */}
      <section className="hero-section">
        {banners.map((banner, idx) => (
          <div
            key={banner.ID}
            className={`hero-slide ${idx === activeBanner ? 'active' : ''}`}
            style={{ backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.8) 30%, rgba(15, 23, 42, 0.4) 100%), url(${banner.ImageUrl})` }}
          >
            <div className="container hero-content">
              <span className="badge badge-primary animate-fade-in">Premium Hydration</span>
              <h1 className="hero-title">{banner.Title}</h1>
              <p className="hero-subtitle">{banner.Subtitle}</p>
              <div className="hero-actions">
                <Link href={banner.ButtonLink.startsWith('#') ? `/products` : banner.ButtonLink} className="btn btn-primary">
                  {banner.ButtonText}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
                <Link href="/about" className="btn btn-secondary" style={{ color: 'white', borderColor: 'white' }}>
                  Our Story
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
                onClick={() => setActiveBanner(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* 2. BRAND STORY SECTION */}
      <section className="story-section">
        <div className="container">
          <div className="story-grid">
            <div className="story-image-container">
              <img 
                src="https://images.unsplash.com/photo-1555116505-38ab61800975?auto=format&fit=crop&q=80&w=800" 
                alt="Pristine spring water" 
                className="story-img animate-float"
              />
              <div className="water-drop-card glass">
                <h3>10-Step Pure</h3>
                <p>Reverse Osmosis, Mineral Addition, Ozonation</p>
              </div>
            </div>
            <div className="story-content">
              <span className="badge badge-primary">About NIMRA</span>
              <h2>Sourced to Refresh. Purified to Protect.</h2>
              <p className="story-description">
                {companyInfo.AboutStory || "At NIMRA, we believe pure drinking water is the cornerstone of robust health. Under T.S. Enterprises, we combine high-end standard purification technologies with mineral configuration balancing to ensure every drop of NIMRA is safe, clean, and refreshing."}
              </p>
              <div className="values-grid">
                <div className="value-item">
                  <div className="value-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <div>
                    <h4>ISI Certified</h4>
                    <p>Processed under strict Bureau of Indian Standards norms.</p>
                  </div>
                </div>
                <div className="value-item">
                  <div className="value-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                  </div>
                  <div>
                    <h4>Mineral Rich</h4>
                    <p>Enriched with balanced quantities of Potassium and Magnesium.</p>
                  </div>
                </div>
              </div>
              <Link href="/about" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
                Learn More About Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PRODUCT PREVIEW SECTION */}
      <section className="product-preview-section">
        <div className="container">
          <div className="section-header">
            <span className="badge badge-primary">Our Offerings</span>
            <h2>NIMRA Packaged Water Range</h2>
            <p>From mini desk bottles to massive 20-litre office jars, we cover all your hydration requirements.</p>
          </div>

          <div className="preview-grid">
            {spotlightProducts.map((product) => (
              <div key={product.ID} className="product-preview-card glass">
                <div className="prod-img-box">
                  <img src={product.ImageUrl} alt={product.Name} />
                </div>
                <div className="prod-info-box">
                  <span className="prod-vol">{product.Volume}</span>
                  <h3>{product.Name}</h3>
                  <p>{product.Description.substring(0, 80)}...</p>
                  <div className="prod-footer">
                    <span className="prod-price">₹{product.Price}</span>
                    <Link href="/products" className="btn btn-secondary btn-sm">
                      Order Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link href="/products" className="btn btn-primary">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* 4. RUSH SODA "COMING SOON" SECTION */}
      <section className="rush-section">
        {/* Animated Bubbles background */}
        <div className="bubble-bg">
          <div className="bubble" style={{ left: '10%', width: '15px', height: '15px', animationDelay: '0s', animationDuration: '8s' }}></div>
          <div className="bubble" style={{ left: '20%', width: '25px', height: '25px', animationDelay: '1s', animationDuration: '12s' }}></div>
          <div className="bubble" style={{ left: '45%', width: '10px', height: '10px', animationDelay: '0.5s', animationDuration: '6s' }}></div>
          <div className="bubble" style={{ left: '70%', width: '30px', height: '30px', animationDelay: '2s', animationDuration: '10s' }}></div>
          <div className="bubble" style={{ left: '85%', width: '20px', height: '20px', animationDelay: '1.5s', animationDuration: '9s' }}></div>
        </div>

        <div className="container">
          <div className="rush-grid">
            <div className="rush-content">
              <span className="badge badge-orange">Coming Soon</span>
              <h2 className="rush-title">Feel the Fizz of <span>RUSH Soda</span></h2>
              <p className="rush-text">
                Prepare your taste buds for the ultimate bubbly experience. Sourced under NIMRA, **RUSH Soda** is our upcoming range of premium sparkling club sodas and refreshing carbonated drinks. Crafted to complement your mocktails, parties, or to enjoy chilled directly!
              </p>
              <div className="rush-features">
                <div className="rush-feature-pill">Extra Sparkling</div>
                <div className="rush-feature-pill">Zero Impurities</div>
                <div className="rush-feature-pill">Pure Crisp Taste</div>
              </div>
              <Link href="/contact" className="btn btn-primary" style={{ background: '#f97316', boxShadow: '0 4px 14px rgba(249, 115, 22, 0.4)' }}>
                Notify Me on Release
              </Link>
            </div>
            <div className="rush-visual">
              <div className="can-mockup">
                <div className="can-reflection"></div>
                <div className="can-label">
                  <span className="label-brand">NIMRA</span>
                  <span className="label-title">RUSH</span>
                  <span className="label-sub">CLUB SODA</span>
                </div>
              </div>
              <div className="fizz-glow"></div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQs SECTION */}
      <section className="faq-section">
        <div className="container">
          <div className="section-header">
            <span className="badge badge-primary">FAQ</span>
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know about our quality standards, plant location, and delivery orders.</p>
          </div>

          <div className="faq-accordion-box">
            {faqs.map((faq, idx) => (
              <div 
                key={faq.ID} 
                className={`faq-item ${idx === activeFaq ? 'active' : ''}`}
                onClick={() => toggleFaq(idx)}
              >
                <div className="faq-question">
                  <h3>{faq.Question}</h3>
                  <span className="faq-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
                  </span>
                </div>
                <div className="faq-answer">
                  <p>{faq.Answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style jsx>{`
        /* Hero Carousel styling */
        .hero-section {
          height: calc(85vh - 80px);
          min-height: 500px;
          position: relative;
          overflow: hidden;
          background: #000;
        }
        .hero-slide {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center;
          opacity: 0;
          z-index: 1;
          display: flex;
          align-items: center;
          transition: opacity var(--transition-slow) ease-in-out;
        }
        .hero-slide.active {
          opacity: 1;
          z-index: 2;
        }
        .hero-content {
          color: white;
          z-index: 10;
          max-width: 650px;
        }
        .hero-title {
          font-size: 3.5rem;
          color: white;
          font-weight: 800;
          margin-top: 1.5rem;
          margin-bottom: 1.5rem;
          letter-spacing: -0.02em;
        }
        .hero-subtitle {
          font-size: 1.15rem;
          line-height: 1.6;
          color: #cbd5e1;
          margin-bottom: 2.5rem;
        }
        .hero-actions {
          display: flex;
          gap: 1.25rem;
        }
        .carousel-dots {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 0.75rem;
          z-index: 100;
        }
        .dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.4);
          border: none;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .dot.active {
          background: var(--primary-color);
          width: 28px;
          border-radius: 6px;
        }

        /* Brand Story styling */
        .story-section {
          background-color: var(--bg-secondary);
        }
        .story-grid {
          display: grid;
          grid-template-columns: 1fr 1.1fr;
          gap: 4rem;
          align-items: center;
        }
        .story-image-container {
          position: relative;
        }
        .story-img {
          width: 100%;
          border-radius: 24px;
          box-shadow: var(--card-hover-shadow);
        }
        .water-drop-card {
          position: absolute;
          bottom: -1rem;
          right: -1rem;
          padding: 1.5rem;
          border-radius: 16px;
          max-width: 250px;
        }
        .water-drop-card h3 {
          color: var(--primary-color);
          font-size: 1.2rem;
          margin-bottom: 0.5rem;
        }
        .water-drop-card p {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        .story-content h2 {
          font-size: 2.5rem;
          margin-top: 1rem;
          margin-bottom: 1.5rem;
          letter-spacing: -0.02em;
        }
        .story-description {
          line-height: 1.7;
          color: var(--text-secondary);
          margin-bottom: 2rem;
        }
        .values-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1rem;
        }
        .value-item {
          display: flex;
          gap: 1rem;
        }
        .value-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: rgba(0, 162, 153, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .value-item h4 {
          margin-bottom: 0.25rem;
          font-size: 1.05rem;
        }
        .value-item p {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        /* Product Preview */
        .section-header {
          text-align: center;
          max-width: 600px;
          margin: 0 auto 4rem;
        }
        .section-header h2 {
          font-size: 2.5rem;
          margin-top: 1rem;
          margin-bottom: 1rem;
        }
        .section-header p {
          color: var(--text-secondary);
        }
        .preview-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }
        .product-preview-card {
          border-radius: 20px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: transform var(--transition-normal), box-shadow var(--transition-normal);
          box-shadow: var(--card-shadow);
        }
        :global(html.theme-transition) .product-preview-card {
          transition: transform var(--transition-normal), box-shadow var(--transition-normal), background-color var(--transition-normal), border-color var(--transition-normal);
        }
        .product-preview-card:hover {
          transform: translateY(-8px);
          box-shadow: var(--card-hover-shadow);
        }
        .prod-img-box {
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }
        .prod-img-box img {
          max-height: 100%;
          max-width: 100%;
          object-fit: contain;
          border-radius: 12px;
          transition: transform var(--transition-normal);
        }
        .product-preview-card:hover .prod-img-box img {
          transform: scale(1.06);
        }
        .prod-vol {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--primary-color);
          background: rgba(0, 162, 153, 0.1);
          padding: 0.25rem 0.75rem;
          border-radius: 50px;
          margin-bottom: 0.5rem;
        }
        .prod-info-box h3 {
          font-size: 1.25rem;
          margin-bottom: 0.5rem;
        }
        .prod-info-box p {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 1.5rem;
        }
        .prod-footer {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: auto;
          border-top: 1px solid var(--border-color);
          padding-top: 1rem;
        }
        .prod-price {
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--text-primary);
        }
        .btn-sm {
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
        }

        /* RUSH Soda "Coming Soon" section */
        .rush-section {
          background: linear-gradient(135deg, #090d16 0%, #171d2b 100%);
          color: white;
          padding: 6rem 0;
          z-index: 1;
        }
        .bubble-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          z-index: -1;
          pointer-events: none;
        }
        .bubble {
          position: absolute;
          bottom: -50px;
          background: rgba(249, 115, 22, 0.15);
          border: 1px solid rgba(249, 115, 22, 0.3);
          border-radius: 50%;
          animation: bubbleUp 8s ease-in infinite;
        }
        .rush-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 4rem;
          align-items: center;
        }
        .rush-content h2 {
          color: white;
          font-size: 3rem;
          font-weight: 800;
          margin-top: 1rem;
          margin-bottom: 1.5rem;
          letter-spacing: -0.02em;
        }
        .rush-content h2 span {
          background: linear-gradient(135deg, #f97316 0%, #ffedd5 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .rush-text {
          color: #94a3b8;
          line-height: 1.8;
          margin-bottom: 2rem;
        }
        .rush-features {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 2.5rem;
        }
        .rush-feature-pill {
          padding: 0.5rem 1.25rem;
          border-radius: 50px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 0.85rem;
          font-weight: 600;
          color: #e2e8f0;
        }
        /* Glassy Can Mockup */
        .rush-visual {
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
        }
        .can-mockup {
          width: 140px;
          height: 280px;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border: 2px solid rgba(249, 115, 22, 0.3);
          border-radius: 30px;
          position: relative;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(249, 115, 22, 0.15);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          animation: float 5s ease-in-out infinite;
        }
        .can-reflection {
          position: absolute;
          top: 0;
          left: 0;
          width: 50%;
          height: 100%;
          background: linear-gradient(to right, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 100%);
          pointer-events: none;
        }
        .can-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transform: rotate(-5deg);
        }
        .label-brand {
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.2em;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 0.25rem;
        }
        .label-title {
          font-size: 2.2rem;
          font-weight: 900;
          font-family: var(--font-heading);
          color: #f97316;
          text-shadow: 0 2px 10px rgba(249, 115, 22, 0.3);
          letter-spacing: 0.05em;
        }
        .label-sub {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.3em;
          color: white;
          margin-top: 0.25rem;
        }
        .fizz-glow {
          position: absolute;
          width: 250px;
          height: 250px;
          background: radial-gradient(circle, rgba(249, 115, 22, 0.1) 0%, rgba(0, 0, 0, 0) 70%);
          pointer-events: none;
          z-index: -1;
        }

        /* FAQ styling */
        .faq-section {
          background-color: var(--bg-secondary);
        }
        .faq-accordion-box {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .faq-item {
          border-radius: 12px;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          overflow: hidden;
          cursor: pointer;
          transition: border-color var(--transition-normal);
        }
        :global(html.theme-transition) .faq-item {
          transition: border-color var(--transition-normal), background-color var(--transition-normal), color var(--transition-normal);
        }
        .faq-item:hover {
          border-color: var(--primary-color);
        }
        .faq-question {
          padding: 1.25rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          user-select: none;
        }
        .faq-question h3 {
          font-size: 1.05rem;
          font-weight: 600;
        }
        .faq-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--bg-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform var(--transition-normal), background-color var(--transition-fast);
          flex-shrink: 0;
        }
        .faq-item.active .faq-icon {
          transform: rotate(180deg);
          background-color: var(--primary-color);
          color: white;
        }
        .faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height var(--transition-normal) ease-out, padding var(--transition-normal);
        }
        .faq-item.active .faq-answer {
          max-height: 200px;
          border-top: 1px solid var(--border-color);
          padding: 1.25rem 1.5rem;
        }
        .faq-answer p {
          font-size: 0.95rem;
          line-height: 1.6;
          color: var(--text-secondary);
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .story-grid, .rush-grid {
            grid-template-columns: 1fr;
            gap: 3rem;
          }
          .story-image-container {
            max-width: 500px;
            margin: 0 auto;
          }
          .preview-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.5rem;
          }
          .rush-content h2 {
            font-size: 2.2rem;
          }
          .preview-grid {
            grid-template-columns: 1fr;
            max-width: 400px;
            margin: 0 auto;
          }
        }
      `}</style>
    </>
  );
}
