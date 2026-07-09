'use client';

import React, { useEffect, useState } from 'react';
import { CompanyInfo, FAQ } from '@/types/cms';
import FAQSection from './FAQSection';
import CustomerPageHeader from './CustomerPageHeader';

interface AboutClientProps {
  companyInfo: CompanyInfo;
  faqs: FAQ[];
}

type AboutSection = 'story' | 'quality' | 'plant' | 'faqs';

function getMapEmbedUrl(embedUrl?: string, fallbackAddress?: string) {
  if (embedUrl && /^https?:\/\//i.test(embedUrl)) {
    return embedUrl;
  }
  if (!fallbackAddress) {
    return '';
  }
  return `https://www.google.com/maps?q=${encodeURIComponent(fallbackAddress)}&output=embed`;
}

export default function AboutClient({ companyInfo, faqs }: AboutClientProps) {
  const [activeSection, setActiveSection] = useState<AboutSection>('story');
  const [activeStep, setActiveStep] = useState<number | null>(null);
  
  const plantMapUrl = getMapEmbedUrl(companyInfo.PlantMapEmbed, companyInfo.PlantAddress);
  useEffect(() => {
    const syncSectionFromHash = () => {
      if (window.location.hash.toLowerCase() === '#faqs') setActiveSection('faqs');
    };
    syncSectionFromHash();
    window.addEventListener('hashchange', syncSectionFromHash);
    return () => window.removeEventListener('hashchange', syncSectionFromHash);
  }, []);

  const selectSection = (section: AboutSection) => {
    setActiveSection(section);
    const nextUrl = section === 'faqs' ? '#faqs' : window.location.pathname;
    window.history.replaceState(null, '', nextUrl);
  };

  const steps = [
    { id: 1, title: 'Deep Sourcing', desc: 'Pristine extraction from deep aquifers.', icon: '💧' },
    { id: 2, title: 'Sand Filtration', desc: 'Removes macroscopic particles instantly.', icon: '⏳' },
    { id: 3, title: 'Carbon Filtering', desc: 'Eliminates chlorine & odors entirely.', icon: '🌑' },
    { id: 4, title: 'Micron Filtration', desc: 'Blocks particles down to 5 microns.', icon: '🔬' },
    { id: 5, title: 'Reverse Osmosis', desc: 'Eradicates 98% of dissolved solids.', icon: '🔄' },
    { id: 6, title: 'Mineralization', desc: 'Infused with Potassium & Magnesium.', icon: '✨' },
    { id: 7, title: 'Fine Polishing', desc: 'Creates a crystal-clear finish.', icon: '💎' },
    { id: 8, title: 'UV Protection', desc: 'Ultraviolet sterilization.', icon: '☀️' },
    { id: 9, title: 'Ozone Enrichment', desc: 'Active oxygen keeps water sterile.', icon: '🫧' },
    { id: 10, title: 'Hourly Checks', desc: 'Rigorous purity testing hourly.', icon: '✅' }
  ];

  const features = [
    { title: 'BIS Certified', desc: 'IS 14543 Standard', icon: '🏆' },
    { title: '10-Step Purity', desc: 'Advanced Filtration', icon: '🛡️' },
    { title: 'Touch-Free', desc: 'Automated Bottling', icon: '🤖' },
    { title: 'Mineral+', desc: 'Essential Nutrients', icon: '⚡' }
  ];

  return (
    <div className="premium-about">
      <CustomerPageHeader
        badge="ABOUT"
        title="Pure. Premium. Protected."
        subtitle="Committed to absolute purity and your health with every single drop, crafted by T.S. Enterprises."
      >
        <div className="submenu-bar">
          <div className="submenu-container">
            <button className={`submenu-btn ${activeSection === 'story' ? 'active' : ''}`} onClick={() => selectSection('story')}>Our Story</button>
            <button className={`submenu-btn ${activeSection === 'quality' ? 'active' : ''}`} onClick={() => selectSection('quality')}>10-Step Purity</button>
            <button className={`submenu-btn ${activeSection === 'plant' ? 'active' : ''}`} onClick={() => selectSection('plant')}>Infrastructure</button>
            <button className={`submenu-btn ${activeSection === 'faqs' ? 'active' : ''}`} onClick={() => selectSection('faqs')}>FAQs</button>
          </div>
        </div>
      </CustomerPageHeader>

      <div className="container main-content">
        <div className="content-card">
          
          {/* Section: Story */}
          {activeSection === 'story' && (
            <div className="fade-enter about-grid">
              <div className="story-text-col">
                <h2 className="story-title">The NIMRA Philosophy</h2>
                <div className="story-paragraph">
                  <p>{companyInfo.AboutStory}</p>
                  <p>
                    Crafted with state-of-the-art technology, NIMRA delivers premium, 
                    revitalizing hydration that rigorously exceeds BIS and FSSAI standards.
                  </p>
                </div>
                
                <div className="feature-row">
                  {features.map((feat, i) => (
                    <div key={i} className="feature-card">
                      <span className="feat-icon">{feat.icon}</span>
                      <div className="feat-text">
                        <strong>{feat.title}</strong>
                        <span>{feat.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="story-img-col">
                <img src="/images/nimra_premium_water.png" alt="NIMRA Premium Water" fetchPriority="high" />
              </div>
            </div>
          )}

          {/* Section: Quality */}
          {activeSection === 'quality' && (
            <div className="fade-enter">
              <div className="section-header text-center">
                <h2 className="section-title">10-Step Purification</h2>
                <p className="section-subtitle">{companyInfo.QualityText || 'Our advanced multi-stage process ensuring uncompromising quality.'}</p>
              </div>
              
              <div className="purification-grid">
                {steps.map((step) => (
                  <div 
                    key={step.id} 
                    className={`step-card ${activeStep === step.id ? 'active' : ''}`}
                    onClick={() => setActiveStep(activeStep === step.id ? null : step.id)}
                  >
                    <div className="step-header">
                      <div className="step-badge">
                        <span className="step-num">{step.id}</span>
                        <span className="step-icon">{step.icon}</span>
                      </div>
                      <span className="step-title">{step.title}</span>
                    </div>
                    <div className="step-desc-wrapper">
                      <p className="step-desc">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Plant */}
          {activeSection === 'plant' && (
            <div className="fade-enter infra-grid">
              <div className="infra-highlights">
                <h2 className="section-title">World-Class Infrastructure</h2>
                <p className="story-paragraph">{companyInfo.InfrastructureText}</p>
                
                <div className="highlight-list">
                  <div className="highlight-item">
                    <span className="hl-icon">📍</span>
                    <div>
                      <strong>State-of-the-Art Facility</strong>
                      <p>{companyInfo.PlantAddress}</p>
                    </div>
                  </div>
                  <div className="highlight-item">
                    <span className="hl-icon">⚡</span>
                    <div>
                      <strong>Fully Automated</strong>
                      <p>Zero human touch from filtration to final sealing.</p>
                    </div>
                  </div>
                  <div className="highlight-item">
                    <span className="hl-icon">🔬</span>
                    <div>
                      <strong>In-House Laboratory</strong>
                      <p>Rigorous micro-biological and chemical testing on-site.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="infra-map">
                {plantMapUrl ? (
                  <iframe
                    title="NIMRA Facility Location"
                    src={plantMapUrl}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                ) : (
                  <div className="map-fallback">Map Loading...</div>
                )}
              </div>
            </div>
          )}

          {/* Section: FAQs */}
          {activeSection === 'faqs' && (
            <div id="faqs" className="fade-enter">
              <FAQSection faqs={faqs} />
            </div>
          )}

        </div>
      </div>

      <style jsx>{`
        .premium-about {
          --bg-main: #ffffff;
          --bg-alt: #f8fafc;
          --text-strong: #0f172a;
          --text-base: #334155;
          --text-muted: #64748b;
          --border: #e2e8f0;
          --brand-blue: #0284c7;
          --brand-light: #e0f2fe;
          
          --space-1: 8px;
          --space-2: 16px;
          --space-3: 24px;
          --space-4: 32px;
          --radius: 16px;
          
          --shadow-sm: 0 1px 3px rgba(0,0,0,0.05);
          --shadow-md: 0 8px 30px rgba(0,0,0,0.04);
          --shadow-hover: 0 12px 25px rgba(2, 132, 199, 0.1);
          
          font-family: system-ui, -apple-system, sans-serif;
          background: var(--bg-alt);
          color: var(--text-base);
          line-height: 1.5;
          min-height: calc(100vh - 80px);
          padding-bottom: var(--space-4);
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 var(--space-3);
        }

        /* ── Typography ── */
        .section-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-strong);
          margin: 0 0 12px;
          letter-spacing: -0.02em;
        }
        .section-subtitle {
          color: var(--text-muted);
          font-size: 0.9rem;
          margin: 0 auto 16px;
          max-width: 600px;
        }
        .text-center { text-align: center; }

        /* ── Submenu Tabs ── */
        .submenu-bar {
          display: flex;
          justify-content: center;
        }
        .submenu-container {
          display: inline-flex;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          padding: 3px;
          border-radius: 99px;
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          gap: 3px;
        }
        .submenu-btn {
          background: transparent;
          border: none;
          padding: 6px 14px;
          border-radius: 99px;
          font-weight: 600;
          font-size: 0.8rem;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }
        .submenu-btn:hover {
          color: var(--text-strong);
          background: rgba(255,255,255,0.5);
        }
        .submenu-btn.active {
          background: var(--text-strong);
          color: var(--bg-main);
          box-shadow: var(--shadow-md);
        }

        /* ── Content Card (Fixed Container) ── */
        .main-content {
          margin-top: -0.75rem;
          position: relative;
          z-index: 10;
        }
        .content-card {
          background: var(--bg-main);
          border-radius: var(--radius);
          padding: 1.5rem;
          box-shadow: var(--shadow-md);
          border: 1px solid var(--border);
          min-height: 250px;
        }

        /* ── Animations ── */
        .fade-enter {
          animation: fadeSlideUp 0.4s ease-out forwards;
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── Story Section ── */
        .about-grid {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 1.5rem;
          align-items: center;
        }
        .story-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--text-strong);
          margin: 0 0 6px;
          letter-spacing: -0.02em;
        }
        .story-paragraph {
          font-size: 0.85rem;
          color: var(--text-base);
          line-height: 1.4;
          margin-bottom: 1rem;
        }
        .story-paragraph p {
          margin-bottom: 0.4rem;
        }
        .story-img-col {
          border-radius: var(--radius);
          overflow: hidden;
          box-shadow: var(--shadow-md);
          width: 400px;
          aspect-ratio: 3/2;
          background: var(--bg-alt);
          flex-shrink: 0;
        }
        .story-img-col img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .story-img-col:hover img {
          transform: scale(1.02);
        }

        /* ── Feature Row ── */
        .feature-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px;
        }
        .feature-card {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-alt);
          padding: 6px 10px;
          border-radius: 8px;
          border: 1px solid var(--border);
          transition: all 0.2s;
        }
        .feature-card:hover {
          background: var(--brand-light);
          border-color: #bae6fd;
          transform: translateY(-1px);
          box-shadow: var(--shadow-sm);
        }
        .feat-icon {
          font-size: 1rem;
          background: var(--bg-main);
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          box-shadow: var(--shadow-sm);
          flex-shrink: 0;
        }
        .feat-text {
          display: flex;
          flex-direction: column;
        }
        .feat-text strong {
          font-size: 0.8rem;
          color: var(--text-strong);
        }
        .feat-text span {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        /* ── Purification (5x2 Grid) ── */
        .purification-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
        }
        .step-card {
          background: var(--bg-alt);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 10px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }
        .step-card:hover {
          background: var(--bg-main);
          border-color: var(--brand-blue);
          box-shadow: var(--shadow-hover);
        }
        .step-card.active {
          background: var(--bg-main);
          border-color: var(--brand-blue);
          box-shadow: var(--shadow-hover);
        }
        .step-header {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
        }
        .step-badge {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .step-num {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--brand-blue);
          background: var(--brand-light);
          padding: 2px 6px;
          border-radius: 99px;
        }
        .step-icon {
          font-size: 1rem;
        }
        .step-title {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-strong);
          line-height: 1.2;
        }
        .step-card.active .step-title {
          color: var(--brand-blue);
        }
        .step-desc-wrapper {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.25s ease-out;
        }
        .step-card.active .step-desc-wrapper {
          grid-template-rows: 1fr;
        }
        .step-desc {
          overflow: hidden;
          font-size: 0.75rem;
          color: var(--text-base);
          margin: 0;
          padding-top: 0;
          line-height: 1.3;
        }
        .step-card.active .step-desc {
          padding-top: 8px;
        }

        /* ── Infrastructure ── */
        .infra-grid {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 1.5rem;
          align-items: center;
        }
        .highlight-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 1rem;
        }
        .highlight-item {
          display: flex;
          gap: 12px;
          align-items: center;
          background: var(--bg-alt);
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid var(--border);
        }
        .hl-icon {
          font-size: 1.1rem;
          background: var(--bg-main);
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          flex-shrink: 0;
          box-shadow: var(--shadow-sm);
        }
        .highlight-item strong {
          display: block;
          font-size: 0.85rem;
          color: var(--text-strong);
          margin-bottom: 2px;
        }
        .highlight-item p {
          margin: 0;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .infra-map {
          width: 275px;
          height: 240px;
          border-radius: var(--radius);
          overflow: hidden;
          border: 1px solid var(--border);
          box-shadow: var(--shadow-md);
        }
        .infra-map iframe {
          width: 100%;
          height: 100%;
          border: none;
        }
        .map-fallback {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-alt);
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .content-card { padding: 1.5rem; }
          .purification-grid { grid-template-columns: repeat(3, 1fr); }
          .infra-map { aspect-ratio: 4/3; }
        }
        
        @media (max-width: 768px) {
          .about-grid, .infra-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          .story-img-col, .infra-map {
            width: 100%;
            max-width: 400px;
            margin: 0 auto;
          }
          .purification-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .submenu-container {
            width: 100%;
            overflow-x: auto;
            justify-content: flex-start;
          }
        }
        
        @media (max-width: 480px) {
          .feature-row { grid-template-columns: 1fr; }
          .purification-grid { grid-template-columns: 1fr; }
          .content-card { padding: 1.5rem; }
        }
      `}</style>
    </div>
  );
}

