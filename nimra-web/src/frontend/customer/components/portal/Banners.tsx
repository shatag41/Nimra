'use client';

import React from 'react';
import Link from 'next/link';

export function RushPortalBanner() {
  return (
    <section className="recommendations-section" style={{ marginTop: '1rem' }}>
      <div className="panel rush-portal-banner" style={{ background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)', color: 'white', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '3rem 2rem' }}>
        <span className="eyebrow" style={{ color: '#fbbf24', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '999px', padding: '0.2rem 0.75rem', fontSize: '0.7rem', marginBottom: '1rem' }}>Coming Soon</span>
        <h2 style={{ marginBottom: '1rem', fontSize: '2rem', color: 'white', fontWeight: '800', letterSpacing: '-0.02em' }}>RUSH Club Soda</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', marginBottom: '2rem', maxWidth: '500px', lineHeight: '1.6' }}>
          Prepare for the ultimate bubbly experience. Pure, crisp, and extra sparkling. Crafted to elevate your mocktails, parties, or enjoyed chilled.
        </p>
        <Link href="/contact" className="btn btn-primary" style={{ padding: '0.85rem 2.5rem', fontSize: '1rem', fontWeight: '700', borderRadius: 'var(--radius-lg)', textDecoration: 'none' }}>
          Get Notified
        </Link>
      </div>
    </section>
  );
}

export function RushSodaPromoTeaser() {
  return (
    <section className="rush-section">
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
              Prepare your taste buds for the ultimate bubbly experience. RUSH Soda — NIMRA's upcoming range of premium sparkling club sodas and carbonated refreshments. Crafted to elevate your mocktails, parties, or enjoyed chilled.
            </p>
            <div className="rush-features">
              {['Extra Sparkling', 'Zero Impurities', 'Pure Crisp Taste', 'Event Ready'].map((f) => (
                <span key={f} className="rush-pill">{f}</span>
              ))}
            </div>
            <Link href="/contact" className="btn btn-rush" style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white', border: 'none', textDecoration: 'none' }}>
              Get Notified on Launch
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '0.5rem' }}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
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
      <style jsx>{`
        .rush-section {
          background: linear-gradient(135deg, #020617 0%, #0f172a 100%);
          color: white;
          position: relative;
          overflow: hidden;
          padding: 5rem 0;
        }
        .container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
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
          padding: 0.95rem 2rem;
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 0.95rem;
          border-radius: var(--radius-xl);
          cursor: pointer;
          transition: all 200ms ease;
          box-shadow: 0 8px 28px rgba(249,115,22,0.35);
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
          bottom: 0; left: 0; right: 0;
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
        .badge {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 0.3rem 0.85rem;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .badge-orange {
          background: rgba(249,115,22,0.15);
          color: #f97316;
          border: 1px solid rgba(249,115,22,0.25);
        }

        @keyframes bubbleUp {
          0% { transform: translateY(100%) scale(0.5); opacity: 0; }
          50% { opacity: 0.8; }
          100% { transform: translateY(-120px) scale(1.2); opacity: 0; }
        }

        @media (max-width: 1024px) {
          .rush-grid { grid-template-columns: 1fr; gap: 2.5rem; }
        }
        @media (max-width: 768px) {
          .rush-visual { margin-top: 2rem; }
        }
      `}</style>
    </section>
  );
}
