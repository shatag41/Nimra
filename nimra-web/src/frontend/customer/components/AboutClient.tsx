'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CompanyInfo, FAQ } from '@/types/cms';
import { FAQs } from './portal/FAQs';

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
  const [openStep, setOpenStep] = useState<number | null>(null);
  const plantMapUrl = getMapEmbedUrl(companyInfo.PlantMapEmbed, companyInfo.PlantAddress);
  const activeFaqs = useMemo(
    () => (faqs || []).filter((faq) => faq.Active !== false && String(faq.Active).toLowerCase() !== 'false'),
    [faqs]
  );

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
    { title: '1. Sourcing Water', desc: 'We responsibly source our water from deep, clean underground aquifers.' },
    { title: '2. Sand Filtration', desc: 'Removes dust, silt, and visible particles to clear the water.' },
    { title: '3. Carbon Filtering', desc: 'Removes chlorine and organic materials, ensuring no odors or color.' },
    { title: '4. Micron Filtration', desc: 'Blocks tiny particles down to 5 microns before reverse osmosis.' },
    { title: '5. Reverse Osmosis', desc: 'High-pressure RO removes over 98% of dissolved solids and impurities.' },
    { title: '6. Adding Minerals', desc: 'We add essential minerals like Potassium and Magnesium for health.' },
    { title: '7. Fine Polishing', desc: 'Gives the water a crystal-clear, sparkling finish.' },
    { title: '8. UV Protection', desc: 'Intense ultraviolet light destroys any remaining microbes.' },
    { title: '9. Ozone Enrichment', desc: 'Active oxygen keeps the water sterile and safe for a long shelf-life.' },
    { title: '10. Hourly Quality Checks', desc: 'We test water chemistry and purity every hour for absolute safety.' }
  ];

  return (
    <div className="about-page container">
      {/* Page Header */}
      <div className="page-header">
        <span className="badge badge-primary">About Us</span>
        <h1>Pure Water, Safely Sealed.</h1>
        <p className="hero-subtitle">Committed to your health and safety with every drop, brought to you by T.S. Enterprises.</p>
      </div>

      {/* Navigation Sub-menu (Sticky Pills) */}
      <div className="submenu-bar">
        <div className="submenu-container glass">
          <button className={`submenu-btn ${activeSection === 'story' ? 'active' : ''}`} onClick={() => selectSection('story')}>Our Story</button>
          <button className={`submenu-btn ${activeSection === 'quality' ? 'active' : ''}`} onClick={() => selectSection('quality')}>10-Step Purification</button>
          <button className={`submenu-btn ${activeSection === 'plant' ? 'active' : ''}`} onClick={() => selectSection('plant')}>Infrastructure</button>
          <button className={`submenu-btn ${activeSection === 'faqs' ? 'active' : ''}`} onClick={() => selectSection('faqs')}>FAQs</button>
        </div>
      </div>

      {/* Fixed-Height Scrolling Card */}
      <div className="content-card-wrapper">
        <div className="content-card">
          
          {/* Section Content: Story */}
          {activeSection === 'story' && (
            <div className="fade-enter">
              <div className="about-grid">
                <div className="about-content">
                  <h2>Our Story</h2>
                  <p>{companyInfo.AboutStory}</p>
                  <p style={{ marginTop: '0.75rem' }}>
                    Every bottle of NIMRA is crafted using advanced technology. We proudly serve communities in Pune with premium water that meets strict BIS and FSSAI quality standards.
                  </p>
                  <div className="stat-row">
                    <div className="stat-item">
                      <span className="stat-num">100%</span>
                      <span className="stat-lbl">Touch-Free Filling</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-num">IS 14543</span>
                      <span className="stat-lbl">BIS Certified</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-num">Mineral+</span>
                      <span className="stat-lbl">Enriched Taste</span>
                    </div>
                  </div>
                </div>
                <div className="about-img-box" aria-hidden="true">
                  <img src="/images/nimra_premium_water.png" alt="NIMRA Premium Water Splash" />
                </div>
              </div>
            </div>
          )}

          {/* Section Content: Quality */}
          {activeSection === 'quality' && (
            <div className="fade-enter">
              <div className="quality-intro">
                <h2>Our 10-Step Purification Process</h2>
                <p>{companyInfo.QualityText}</p>
              </div>
              
              <div className="steps-grid">
                {steps.map((step, idx) => (
                  <div key={idx} className={`accordion-item ${openStep === idx ? 'open' : ''}`}>
                    <button 
                      className="accordion-header" 
                      onClick={() => setOpenStep(openStep === idx ? null : idx)}
                    >
                      <h4>{step.title}</h4>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="chevron">
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    </button>
                    <div className="accordion-content-wrapper">
                      <div className="accordion-content">
                        <p>{step.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section Content: Plant */}
          {activeSection === 'plant' && (
            <div className="fade-enter">
              <div className="about-grid plant-grid">
                <div className="about-content">
                  <h2>Where Purity Begins</h2>
                  <p>{companyInfo.InfrastructureText}</p>
                  <div className="plant-info-card glass">
                    <h4>Factory Address</h4>
                    <p>{companyInfo.PlantAddress}</p>
                  </div>
                </div>
                <div className="plant-map-box">
                  {plantMapUrl ? (
                    <iframe
                      title="NIMRA Plant Location Map"
                      src={plantMapUrl}
                      style={{ border: 0, width: '100%', height: '100%' }}
                      allowFullScreen={false}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                  ) : (
                    <div className="map-placeholder">
                      <p>Map location loading...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'faqs' && (
            <div id="faqs" className="fade-enter faq-content">
              <div className="quality-intro">
                <h2>Common Questions</h2>
                <p>Everything you need to know about our water, quality, and delivery.</p>
              </div>
              {activeFaqs.length > 0 ? <FAQs faqs={activeFaqs} /> : <p className="faq-empty">No FAQs are available right now.</p>}
            </div>
          )}

        </div>
      </div>

      <style jsx>{`
        .about-page {
          padding-top: 0;
          padding-bottom: 0.5rem;
          font-family: var(--font-body);
        }

        /* ── Page Header ── */
        .page-header {
          margin-bottom: 0.25rem;
          padding-bottom: 0;
          text-align: center;
        }

        .page-header h1 {
          font-size: 1.8rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          letter-spacing: -0.02em;
          color: var(--text-primary);
        }

        .hero-subtitle {
          color: var(--text-muted);
          font-size: 0.9rem;
          margin: 0 auto;
          max-width: 600px;
          line-height: 1.4;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 0.35rem 0.85rem;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }
        .badge-primary {
          background: rgba(37, 99, 235, 0.1);
          color: var(--primary-color);
          border: 1px solid rgba(37, 99, 235, 0.2);
        }

        /* ── Tabs (Pills) ── */
        .submenu-bar {
          display: flex;
          justify-content: center;
          margin-bottom: 0.75rem;
          padding: 0 1rem;
        }
        .submenu-container {
          display: inline-flex;
          padding: 0.35rem;
          border-radius: 999px;
          border: 1px solid var(--border-color);
          background: var(--bg-primary);
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          gap: 0.25rem;
          max-width: 100%;
          overflow-x: auto;
        }
        .submenu-btn {
          background: transparent;
          border: none;
          padding: 0.6rem 1.25rem;
          border-radius: 999px;
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 0.85rem;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }
        .submenu-btn:hover {
          color: var(--text-primary);
          background: rgba(150, 150, 150, 0.08);
        }
        .submenu-btn.active {
          background: var(--text-primary);
          color: var(--bg-primary);
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        /* ── Fixed-Height Content Card ── */
        .content-card-wrapper {
          padding: 0;
          width: 100%;
        }
        .content-card {
          background-color: var(--bg-secondary);
          border-radius: var(--radius-2xl);
          padding: 1rem;
          box-shadow: 0 8px 30px rgba(0,0,0,0.04);
          border: 1px solid var(--border-color);
          position: relative;
        }

        /* ── Animations ── */
        .fade-enter {
          animation: fadeEnter 0.4s ease-out forwards;
        }
        @keyframes fadeEnter {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── Layout Grids ── */
        .about-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 1rem;
          align-items: center; /* Changed from stretch to center to match content height */
        }
        .about-content {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .about-content h2 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }
        .about-content p {
          color: var(--text-secondary);
          line-height: 1.7;
          font-size: 0.95rem;
        }

        /* Stats */
        .stat-row {
          display: flex;
          gap: 1rem;
          margin-top: 0.5rem;
        }
        .stat-item {
          display: flex;
          flex-direction: column;
        }
        .stat-num {
          font-size: 2rem;
          font-weight: 800;
          color: var(--primary-color);
          font-family: var(--font-heading);
          line-height: 1.1;
        }
        .stat-lbl {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-top: 0.35rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Responsive Images & Maps */
        .about-img-box, .plant-map-box {
          width: 85%;
          margin: 0 auto;
          border-radius: var(--radius-2xl); /* Match large rounded corners */
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid var(--border-color);
          display: flex;
          aspect-ratio: 4/3; /* Enforce height proportionally to keep it matched to text */
        }
        .about-img-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .about-water-mark {
          width: 100%;
          display: grid;
          place-items: center;
          color: rgba(255, 255, 255, 0.92);
          background: radial-gradient(circle at 35% 25%, #7dd3fc, #0284c7 55%, #075985);
          font-size: clamp(2.5rem, 8vw, 6rem);
          font-weight: 900;
          letter-spacing: 0.12em;
        }
        .map-placeholder {
          height: 100%;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-primary);
          color: var(--text-muted);
        }

        /* ── Accordion (Quality Section) ── */
        .quality-intro {
          text-align: center;
          max-width: 600px;
          margin: 0 auto 0.5rem;
        }
        .quality-intro h2 {
          font-size: 1.8rem;
          margin-bottom: 0.5rem;
        }
        .quality-intro p {
          color: var(--text-secondary);
          line-height: 1.6;
          font-size: 0.95rem;
        }
        .faq-content { max-width: 860px; margin: 0 auto; }
        .faq-empty { color: var(--text-secondary); text-align: center; }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.25rem;
          align-items: start;
        }

        .accordion-item {
          background: var(--bg-primary);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          overflow: hidden;
          transition: all var(--transition-fast);
          height: fit-content;
        }
        .accordion-item:hover {
          border-color: var(--primary-color);
        }
        .accordion-header {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.65rem 0.85rem;
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--text-primary);
        }
        .accordion-header h4 {
          font-size: 0.85rem;
          font-weight: 700;
          margin: 0;
          text-align: left;
        }
        .chevron {
          color: var(--text-muted);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
          margin-left: 0.5rem;
        }
        .accordion-item.open .chevron {
          transform: rotate(180deg);
          color: var(--primary-color);
        }
        .accordion-item.open .accordion-header h4 {
          color: var(--primary-color);
        }
        .accordion-item.open {
          box-shadow: 0 4px 15px rgba(0,0,0,0.03);
          border-color: var(--border-color);
        }
        .accordion-content-wrapper {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .accordion-item.open .accordion-content-wrapper {
          grid-template-rows: 1fr;
        }
        .accordion-content {
          overflow: hidden;
        }
        .accordion-content p {
          padding: 0 0.85rem 0.85rem;
          margin: 0;
          color: var(--text-secondary);
          font-size: 0.85rem;
          line-height: 1.5;
        }

        .plant-info-card {
          margin-top: 0.5rem;
          padding: 1rem;
          border-radius: var(--radius-lg);
          border-left: 4px solid var(--primary-color);
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-left-width: 4px;
        }
        .plant-info-card h4 {
          margin-bottom: 0.5rem;
          font-size: 0.95rem;
          color: var(--text-primary);
        }
        .plant-info-card p {
          margin: 0;
          font-size: 0.9rem;
        }

        @media (max-width: 1024px) {
          .content-card {
            padding: 1.25rem;
          }
          .about-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          .about-img-box, .plant-map-box {
            aspect-ratio: 16/9;
          }
          .stat-row {
            flex-wrap: wrap;
            gap: 1.5rem;
          }
        }
        
        @media (max-width: 640px) {
          .content-card {
            border-radius: var(--radius-xl);
            padding: 1.25rem;
          }
          .submenu-btn {
            padding: 0.5rem 1rem;
            font-size: 0.8rem;
          }
          .about-content h2 {
            font-size: 1.6rem;
          }
          .about-img-box, .plant-map-box {
            aspect-ratio: 4/3;
          }
          .steps-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
