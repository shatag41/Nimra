'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Banner } from '@/types/cms';
import CustomerPageHeader from '../CustomerPageHeader';

interface PortalHeroProps {
  isAuthenticated: boolean;
  name?: string;
}

export function PortalHero({ isAuthenticated, name }: PortalHeroProps) {
  if (!isAuthenticated) {
    return null;
  }

  return (
    <CustomerPageHeader
      badge="CUSTOMER PORTAL"
      title={`Welcome back, ${name ? (name.length > 25 ? `${name.slice(0, 25)}...` : name) : 'Customer'}`}
      subtitle="Manage orders, track deliveries, and reach NIMRA support from one clean workspace."
    />
  );
}

interface HomeHeroProps {
  banners: Banner[];
}

export function HomeHero({ banners }: HomeHeroProps) {
  const [activeBanner, setActiveBanner] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length]);

  return (
    <section className="home-hero-section">
      {banners.map((banner, idx) => (
        <div
          key={banner.ID}
          className={`hero-slide ${idx === activeBanner ? 'active' : ''}`}
          style={{
            backgroundImage: [
              `linear-gradient(105deg,
                rgba(15,23,42,0.93) 0%,
                rgba(30,58,138,0.82) 40%,
                rgba(37,99,235,0.45) 70%,
                rgba(59,130,246,0.15) 100%
              )`,
              banner.ImageUrl ? `url("${banner.ImageUrl}")` : null,
            ].filter(Boolean).join(', '),
          }}
        >
          <div className="container hero-content">
            <div className="hero-copy">
              <div className="hero-eyebrow animate-fade-in">
                <span className="eyebrow-dot" />
                Premium Hydration
              </div>
              <h1 className="hero-title">{banner.Title}</h1>
              <p className="hero-subtitle">{banner.Subtitle}</p>
              <div className="hero-actions-container">
                <Link
                  href={banner.ButtonLink.startsWith('#') ? '/products' : banner.ButtonLink}
                  className="btn-hero-primary"
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
              <Link href="/products" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
                Explore Products
              </Link>
            </div>
          </div>
        </div>
      ))}

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

      <div className="scroll-indicator">
        <div className="scroll-mouse">
          <div className="scroll-wheel" />
        </div>
      </div>
      <style jsx>{styles}</style>
    </section>
  );
}

const styles = `
  .portal-hero {
    padding: 4rem 2.5rem;
    background: linear-gradient(90deg, #003366 0%, #104489 100%);
    color: white;
    position: relative;
    overflow: hidden;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  .portal-hero::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 60%;
    height: 100%;
    background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 70%);
    pointer-events: none;
    z-index: 1;
  }
  .portal-hero-content {
    position: relative;
    z-index: 2;
    animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  .portal-hero h1 {
    max-width: 820px;
    color: #ffffff;
    font-size: clamp(1.6rem, 3.2vw, 2.6rem);
    font-weight: 800;
    letter-spacing: -0.02em;
    margin: 0.5rem 0;
    line-height: 1.2;
  }
  .portal-hero p {
    max-width: 680px;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.98rem;
    line-height: 1.6;
    margin: 0;
  }
  
  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 999px;
    padding: 0.35rem 0.95rem;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 0.75rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
  }
  .eyebrow:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.25);
  }
  .hero-actions {
    display: flex;
    gap: 0.8rem;
    flex-wrap: wrap;
    margin-top: 1.75rem;
  }
  @keyframes fadeUp {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Home Hero Carousel */
  .home-hero-section {
    height: 75vh;
    position: relative;
    overflow: hidden;
    background: #001a0c;
  }
  .hero-slide {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    opacity: 0;
    z-index: 1;
    display: flex;
    align-items: flex-start;
    padding-top: 1rem;
    transition: opacity 700ms ease-in-out;
  }
  .hero-slide.active { opacity: 1; z-index: 2; }
  .hero-content {
    color: white;
    z-index: 10;
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    gap: 3rem;
    align-items: flex-start;
    padding-top: 0;
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
    animation: pulse 2s ease-in-out infinite;
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
  .hero-actions-container {
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
    box-shadow: 0 8px 28px rgba(59, 130, 246, 0.4);
    transition: all 200ms ease;
    position: relative;
    overflow: hidden;
    z-index: 10;
    text-decoration: none;
  }
  .btn-hero-primary:hover {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 16px 40px rgba(59, 130, 246, 0.5);
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
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    max-width: 360px;
    margin-left: auto;
    border: 1px solid rgba(255,255,255,0.25);
    background: rgba(15, 23, 42, 0.75) !important;
    backdrop-filter: blur(24px) !important;
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
    font-size: 1.2rem;
    margin-bottom: 1rem;
    color: #ffffff !important;
    font-weight: 800;
    line-height: 1.4;
    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
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
    font-size: 0.95rem;
    color: #ffffff;
    font-weight: 500;
    line-height: 1.5;
    text-shadow: 0 1px 3px rgba(0,0,0,0.4);
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
  @keyframes pulse {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59,130,246,0.5); }
    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(59,130,246,0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59,130,246,0); }
  }

  @media (max-width: 1100px) {
    .portal-hero { padding: 1.5rem 2rem 2.5rem; }
  }
  @media (max-width: 1024px) {
    .hero-content { grid-template-columns: 1fr; gap: 2.5rem; }
    .hero-card { margin: 0 auto; max-width: 100%; }
  }
  @media (max-width: 768px) {
    .home-hero-section { height: 80svh; }
    .scroll-indicator { display: none; }
  }
  @media (max-width: 700px) {
    .portal-hero { padding: 1.25rem 1.25rem 2rem; }
    .hero-actions { flex-direction: column; }
  }
`;
