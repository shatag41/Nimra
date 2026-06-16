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
            style={{ backgroundImage: `linear-gradient(90deg, rgba(var(--secondary-rgb), 0.95) 0%, rgba(var(--secondary-rgb), 0.78) 45%, rgba(var(--secondary-rgb), 0.26) 100%), url(${banner.ImageUrl})` }}
          >
            <div className="container hero-content">
              <div className="hero-copy">
                <span className="badge badge-primary animate-fade-in">Premium Hydration</span>
                <h1 className="hero-title">{banner.Title}</h1>
                <p className="hero-subtitle">{banner.Subtitle}</p>
                <div className="hero-actions">
                  <Link href={banner.ButtonLink.startsWith('#') ? `/products` : banner.ButtonLink} className="btn btn-primary">
                    {banner.ButtonText}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </Link>
                  <Link href="/about" className="btn btn-secondary">
                    Our Story
                  </Link>
                </div>
                <div className="hero-highlights">
                  <span>Advanced purification</span>
                  <span>Reliable doorstep delivery</span>
                  <span>Trusted by families & offices</span>
                </div>
              </div>

              <div className="hero-card glass">
                <div className="hero-card-badge">NIMRA Promise</div>
                <h3>Pure water crafted for everyday wellness.</h3>
                <ul>
                  <li>Mineral-balanced taste with consistent quality</li>
                  <li>Range suited for homes, offices, and events</li>
                  <li>Fast, dependable service across the city</li>
                </ul>
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
                <p>Reverse osmosis, mineral balancing, and protection at every stage.</p>
              </div>
            </div>
            <div className="story-content">
              <span className="badge badge-primary">About NIMRA</span>
              <h2>Sourced to refresh. Purified to protect.</h2>
              <p className="story-description">
                {companyInfo.AboutStory || "At NIMRA, we believe pure drinking water is the cornerstone of robust health. Under T.S. Enterprises, we combine advanced purification with careful mineral balancing to ensure every drop is safe, clean, and consistently refreshing."}
              </p>
              <div className="values-grid">
                <div className="value-item">
                  <div className="value-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <div>
                    <h4>Certified Quality</h4>
                    <p>Produced under stringent quality controls for dependable purity.</p>
                  </div>
                </div>
                <div className="value-item">
                  <div className="value-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                  </div>
                  <div>
                    <h4>Balanced Minerals</h4>
                    <p>Carefully enriched for a smooth, refreshing taste in every bottle.</p>
                  </div>
                </div>
              </div>
              <Link href="/about" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
                Discover Our Standards
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
                    <Link href={`/products?add=${product.ID}`} className="btn btn-secondary btn-sm">
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
          height: calc(90vh - 80px);
          min-height: 620px;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, var(--bg-tertiary) 0%, rgba(var(--primary-rgb), 0.12) 100%);
        }
        .hero-slide {
          position: absolute;
          inset: 0;
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
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 2rem;
          align-items: center;
        }
        .hero-copy {
          max-width: 680px;
          color: white !important;
        }
        .hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          margin-top: 1.25rem;
          margin-bottom: 1.25rem;
          letter-spacing: -0.03em;
          line-height: 1.05;
          color: white !important;
        }
        .hero-subtitle {
          font-size: 1.08rem;
          line-height: 1.75;
          color: rgba(255, 255, 255, 0.85) !important;
          margin-bottom: 2rem;
          max-width: 620px;
        }
        .hero-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 1.25rem;
        }
        .hero-actions .btn-primary {
          background: var(--accent-color);
          color: white;
          box-shadow: 0 12px 35px rgba(43, 182, 115, 0.28);
        }
        .hero-actions .btn-primary:hover {
          background: var(--accent-hover);
        }
        .hero-actions .btn-secondary {
          background: rgba(255, 255, 255, 0.12);
          color: white !important;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .hero-actions .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        .hero-highlights {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .hero-highlights span {
          display: inline-flex;
          align-items: center;
          padding: 0.6rem 0.9rem;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.15) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          font-size: 0.8rem;
          font-weight: 600;
          color: white !important;
        }
        .hero-card {
          border-radius: var(--radius-xl);
          padding: 1.5rem;
          box-shadow: var(--shadow-xl);
          max-width: 360px;
          margin-left: auto;
        }
        .hero-card-badge {
          display: inline-flex;
          padding: 0.38rem 0.7rem;
          border-radius: 999px;
          background: rgba(var(--primary-rgb), 0.12);
          color: var(--primary-color);
          font-size: 0.74rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 0.8rem;
        }
        .hero-card h3 {
          font-size: 1.2rem;
          margin-bottom: 0.9rem;
          color: var(--text-primary);
        }
        .hero-card ul {
          list-style: none;
          display: grid;
          gap: 0.7rem;
          color: var(--text-secondary);
          font-size: 0.95rem;
        }
        .hero-card li {
          position: relative;
          padding-left: 1.1rem;
        }
        .hero-card li::before {
          content: '•';
          position: absolute;
          left: 0;
          color: var(--accent-color);
          font-weight: 700;
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
          background: var(--accent-color);
          width: 32px;
          border-radius: var(--radius-md);
        }

        /* Brand Story styling */
        .story-section {
          background: linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
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
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
        }
        .water-drop-card {
          position: absolute;
          bottom: -1.25rem;
          right: -1.25rem;
          padding: 1.35rem 1.5rem;
          border-radius: var(--radius-xl);
          max-width: 260px;
        }
        .water-drop-card h3 {
          color: var(--primary-color);
          font-size: 1.1rem;
          margin-bottom: 0.35rem;
          font-weight: 700;
        }
        .water-drop-card p {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .story-content h2 {
          font-size: 2.45rem;
          margin-top: 1rem;
          margin-bottom: 1.25rem;
          letter-spacing: -0.02em;
        }
        .story-description {
          line-height: 1.7;
          color: var(--text-secondary);
          margin-bottom: 2rem;
          max-width: 620px;
        }
        .values-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-bottom: 1rem;
        }
        .value-item {
          display: flex;
          gap: 0.9rem;
          padding: 1rem 1rem 1.1rem;
          border-radius: var(--radius-lg);
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          transition: all var(--transition-normal);
        }
        .value-item:hover {
          border-color: var(--primary-color);
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }
        .value-icon {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          background: rgba(var(--primary-rgb), 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .value-item h4 {
          margin-bottom: 0.2rem;
          font-size: 1rem;
        }
        .value-item p {
          font-size: 0.84rem;
          color: var(--text-muted);
          line-height: 1.4;
        }

        /* Product Preview */
        .section-header {
          text-align: center;
          max-width: 640px;
          margin: 0 auto 3.5rem;
        }
        .section-header h2 {
          font-size: 2.35rem;
          margin-top: 0.8rem;
          margin-bottom: 0.8rem;
        }
        .section-header p {
          color: var(--text-secondary);
          line-height: 1.7;
        }
        .preview-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }
        .product-preview-card {
          border-radius: var(--radius-xl);
          padding: 1.4rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: transform var(--transition-normal), box-shadow var(--transition-normal);
          box-shadow: var(--shadow-md);
          background: linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
        }
        .product-preview-card:hover {
          transform: translateY(-8px);
          box-shadow: var(--shadow-xl);
        }
        .prod-img-box {
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
        }
        .prod-img-box img {
          max-height: 100%;
          max-width: 100%;
          object-fit: contain;
          border-radius: var(--radius-lg);
          transition: transform var(--transition-normal);
        }
        .product-preview-card:hover .prod-img-box img {
          transform: scale(1.05);
        }
        .prod-vol {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--primary-color);
          background: rgba(var(--primary-rgb), 0.1);
          padding: 0.25rem 0.75rem;
          border-radius: 50px;
          margin-bottom: 0.55rem;
        }
        .prod-info-box h3 {
          font-size: 1.16rem;
          margin-bottom: 0.45rem;
        }
        .prod-info-box p {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.55;
          margin-bottom: 1.3rem;
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
          font-size: 1.2rem;
          font-weight: 800;
          color: var(--text-primary);
        }
        .btn-sm {
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
        }

        /* RUSH Soda "Coming Soon" section */
        .rush-section {
          background: linear-gradient(135deg, var(--secondary-color) 0%, rgba(var(--primary-rgb), 0.9) 100%);
          color: var(--bg-primary);
          padding: 6rem 0;
          z-index: 1;
          position: relative;
        }
        .bubble-bg {
          position: absolute;
          inset: 0;
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
          box-shadow: var(--shadow-xl), 0 0 30px rgba(249, 115, 22, 0.15);
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
          border-radius: var(--radius-lg);
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          overflow: hidden;
          cursor: pointer;
          transition: border-color var(--transition-normal), box-shadow var(--transition-normal);
        }
        .faq-item:hover {
          border-color: var(--primary-color);
          box-shadow: var(--shadow-md);
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
          width: 36px;
          height: 36px;
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
          .hero-content,
          .story-grid,
          .rush-grid {
            grid-template-columns: 1fr;
            gap: 3rem;
          }
          .hero-card {
            margin-left: 0;
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
          .hero-section {
            min-height: 680px;
          }
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
          .values-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
