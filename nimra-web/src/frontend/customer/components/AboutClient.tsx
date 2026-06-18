'use client';

import React, { useState } from 'react';
import { CompanyInfo } from '@/types/cms';

interface AboutClientProps {
  companyInfo: CompanyInfo;
}

function getMapEmbedUrl(embedUrl?: string, fallbackAddress?: string) {
  if (embedUrl && /^https?:\/\//i.test(embedUrl)) {
    return embedUrl;
  }

  if (!fallbackAddress) {
    return '';
  }

  return `https://www.google.com/maps?q=${encodeURIComponent(fallbackAddress)}&output=embed`;
}

export default function AboutClient({ companyInfo }: AboutClientProps) {
  const [activeSection, setActiveSection] = useState<'story' | 'quality' | 'plant'>('story');
  const plantMapUrl = getMapEmbedUrl(companyInfo.PlantMapEmbed, companyInfo.PlantAddress);

  const steps = [
    { title: '1. Source Intake', desc: 'Water is sourced responsibly from clean, underground aquifers.' },
    { title: '2. Dual Sand Filter', desc: 'Removes visible suspended particles, dust, and silt.' },
    { title: '3. Activated Carbon', desc: 'Adsorbs chlorine, organic materials, and cancels odor/color.' },
    { title: '4. Micron Cartridge', desc: 'Pre-RO filtration that blocks particles down to 5 microns.' },
    { title: '5. Reverse Osmosis', desc: 'High pressure RO membranes eliminate 98%+ dissolved solids & heavy metals.' },
    { title: '6. Mineralization', desc: 'Balances water by injecting precise health-boosting Potassium & Magnesium.' },
    { title: '7. Ultra Polish', desc: 'Superfine polishing gives the water a sparkling, crystal-clear appearance.' },
    { title: '8. UV Treatment', desc: 'Passes through high-intensity ultraviolet chambers to destroy biological microbes.' },
    { title: '9. Ozonation', desc: 'Enriches water with active oxygen ozone to maintain shelf-life sterile security.' },
    { title: '10. Hourly Labs Auditing', desc: 'Chemical & microbiological testing performed on batches every single hour.' }
  ];

  return (
    <div className="about-page container">
      {/* Page Header */}
      <div className="page-header animate-slide-up">
        <span className="badge badge-primary">About Us</span>
        <h1>Quality Sourced. Safely Sealed.</h1>
        <p>Driven by the principles of safety, purity, and customer health under T.S. Enterprises.</p>
      </div>

      {/* Navigation Sub-menu */}
      <div className="submenu-bar glass">
        <div className="container submenu-container">
          <button className={`submenu-btn ${activeSection === 'story' ? 'active' : ''}`} onClick={() => setActiveSection('story')}>Our Story</button>
          <button className={`submenu-btn ${activeSection === 'quality' ? 'active' : ''}`} onClick={() => setActiveSection('quality')}>10-Step Purification</button>
          <button className={`submenu-btn ${activeSection === 'plant' ? 'active' : ''}`} onClick={() => setActiveSection('plant')}>Infrastructure & Plant</button>
        </div>
      </div>

      {/* Section Content: Story */}
      {activeSection === 'story' && (
        <section className="story-detail-section animate-fade-in">
          <div className="container">
            <div className="about-grid">
              <div className="about-content">
                <h2>The NIMRA Philosophy</h2>
                <p>{companyInfo.AboutStory}</p>
                <p style={{ marginTop: '1rem' }}>
                  Every case of NIMRA is produced in state-of-the-art packaging lines. We strive to provide premium-grade beverage options to communities across Pune. Our commitment is backed by absolute compliance with BIS (ISI IS 14543) and FSSAI standards.
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
              <div className="about-img-box">
                <img src="https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&q=80&w=800" alt="Pure drop" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Section Content: Quality */}
      {activeSection === 'quality' && (
        <section className="quality-section-detail animate-fade-in">
          <div className="container">
            <div className="quality-intro">
              <h2>Purified Through 10 Rigorous Steps</h2>
              <p>{companyInfo.QualityText}</p>
            </div>
            
            <div className="timeline">
              {steps.map((step, idx) => (
                <div key={idx} className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-card glass">
                    <h4>{step.title}</h4>
                    <p>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Section Content: Plant */}
      {activeSection === 'plant' && (
        <section className="plant-section-detail animate-fade-in">
          <div className="container">
            <div className="about-grid">
              <div className="about-content">
                <h2>Our Manufacturing Facility</h2>
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
                    width="100%"
                    height="350"
                    style={{ border: 0, borderRadius: '16px' }}
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
        </section>
      )}

      <style jsx>{`
        .about-page {
          padding-top: 0.5rem;
          padding-bottom: 4rem;
          min-height: 90vh;
          font-family: var(--font-body);
        }

        /* ── Page Header ── */
        .page-header {
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--border-color);
          text-align: center;
        }

        .page-header h1 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.15rem;
          letter-spacing: -0.02em;
          color: var(--text-primary);
        }

        .page-header p {
          color: var(--text-muted);
          margin: 0;
          font-size: 0.875rem;
          line-height: 1.4;
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
          margin-bottom: 0.75rem;
        }
        .badge-primary {
          background: rgba(37, 99, 235, 0.1);
          color: var(--primary-color);
          border: 1px solid rgba(37, 99, 235, 0.2);
        }

        .submenu-bar {
          position: sticky;
          top: 80px;
          z-index: 100;
          border-top: 1px solid var(--border-color);
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-secondary);
        }
        .submenu-container {
          display: flex;
          justify-content: center;
          gap: 2rem;
          padding-top: 0.75rem;
          padding-bottom: 0.75rem;
        }
        .submenu-btn {
          background: transparent;
          border: none;
          padding: 0.5rem 1.25rem;
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--text-secondary);
          cursor: pointer;
          position: relative;
          transition: all var(--transition-fast);
        }
        .submenu-btn:hover, .submenu-btn.active {
          color: var(--primary-color);
        }
        .submenu-btn::after {
          content: '';
          position: absolute;
          bottom: -0.75rem;
          left: 0;
          width: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
          transition: width var(--transition-fast);
          border-radius: var(--radius-sm);
        }
        .submenu-btn.active::after {
          width: 100%;
        }

        /* Detail grids */
        .story-detail-section, .quality-section-detail, .plant-section-detail {
          background-color: var(--bg-secondary);
          padding: 5rem 0;
        }
        .about-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 4rem;
          align-items: center;
        }
        .about-content h2 {
          font-size: 2.2rem;
          margin-bottom: 1.5rem;
        }
        .about-content p {
          color: var(--text-secondary);
          line-height: 1.7;
        }
        .stat-row {
          display: flex;
          gap: 2rem;
          margin-top: 2.5rem;
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
        }
        .stat-lbl {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-top: 0.25rem;
        }
        .about-img-box img {
          width: 100%;
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
        }

        /* Quality Timeline */
        .quality-intro {
          text-align: center;
          max-width: 700px;
          margin: 0 auto 4rem;
        }
        .quality-intro h2 {
          font-size: 2.2rem;
          margin-bottom: 1rem;
        }
        .quality-intro p {
          color: var(--text-secondary);
          line-height: 1.6;
        }
        .timeline {
          position: relative;
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem 0;
        }
        .timeline::before {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          left: 20px;
          width: 3px;
          background: var(--border-color);
        }
        .timeline-item {
          position: relative;
          padding-left: 50px;
          margin-bottom: 2rem;
        }
        .timeline-dot {
          position: absolute;
          left: 11px;
          top: 22px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--bg-secondary);
          border: 4px solid var(--primary-color);
          box-shadow: 0 0 10px rgba(var(--primary-rgb), 0.3);
          z-index: 10;
        }
        .timeline-card {
          padding: 1.5rem;
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-md);
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          transition: all var(--transition-normal);
        }
        .timeline-card:hover {
          transform: translateX(5px);
          border-color: var(--primary-color);
          box-shadow: var(--shadow-lg);
        }
        .timeline-card h4 {
          color: var(--primary-color);
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
        }
        .timeline-card p {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        /* Plant Map */
        .plant-info-card {
          margin-top: 2rem;
          padding: 1.5rem;
          border-radius: var(--radius-xl);
          border-left: 4px solid var(--primary-color);
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-md);
        }
        .plant-info-card h4 {
          margin-bottom: 0.5rem;
        }
        .plant-map-box {
          box-shadow: var(--shadow-xl);
          border-radius: var(--radius-xl);
          overflow: hidden;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
        }
        .map-placeholder {
          height: 350px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
        }

        @media (max-width: 1024px) {
          .about-grid {
            grid-template-columns: 1fr;
            gap: 3rem;
          }
          .about-img-box {
            max-width: 400px;
            margin: 0 auto;
          }
        }
      `}</style>
    </div>
  );
}
