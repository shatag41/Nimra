'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CompanyInfo } from '../../types/cms';
import { submitInquiry } from '../../utils/api';

interface ContactClientProps {
  companyInfo: CompanyInfo;
}

export default function ContactClient({ companyInfo }: ContactClientProps) {
  const searchParams = useSearchParams();
  const [mapTab, setMapTab] = useState<'office' | 'plant'>('office');
  const product = searchParams.get('product');
  const subjectParam = searchParams.get('subject');
  
  // Form state
  const [form, setForm] = useState(() => ({
    name: '',
    email: '',
    phone: '',
    subject: product ? subjectParam || `Inquiry for ${product}` : subjectParam || '',
    message: product
      ? `Hello, I'd like to check pricing and delivery availability for the ${product}. Please contact me.`
      : '',
  }));

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });

  const isPhoneValid = /^\d{10}$/.test(form.phone.trim());
  const isFormValid = Boolean(
    form.name.trim() &&
    isPhoneValid &&
    form.subject.trim() &&
    form.message.trim()
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    const value = name === 'phone' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic Validation
    if (!isFormValid) {
      setStatus({
        type: 'error',
        message: 'Please fill in all required fields correctly before submitting.',
      });
      return;
    }

    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const response = await submitInquiry(form);
      if (response.success) {
        setStatus({
          type: 'success',
          message: 'Inquiry submitted successfully! Our representative will contact you shortly.',
        });
        setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        setStatus({
          type: 'error',
          message: response.message || 'Something went wrong. Please try again.',
        });
      }
    } catch {
      setStatus({
        type: 'error',
        message: 'Could not connect to the server. Please check your network.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="contact-hero">
        <div className="container">
          <span className="badge badge-primary">Contact Us</span>
          <h1>Get In Touch With NIMRA</h1>
          <p>We&apos;d love to hear from you. Reach out for bulk water supplies, dealership opportunities, or quality inquiries.</p>
        </div>
      </section>

      <section className="contact-layout-section">
        <div className="container">
          <div className="contact-grid">
            
            {/* 1. Left Column: Details & Maps */}
            <div className="details-col">
              <h2>Contact Details</h2>
              <p className="subtitle">Feel free to contact our customer relations team directly.</p>

              <div className="contact-info-list">
                <div className="info-card glass">
                  <div className="info-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  </div>
                  <div>
                    <h4>Phone Number</h4>
                    <p><a href={`tel:${companyInfo.Phone}`} className="hover-link">{companyInfo.Phone}</a></p>
                  </div>
                </div>

                <div className="info-card glass">
                  <div className="info-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  </div>
                  <div>
                    <h4>Email Address</h4>
                    <p><a href={`mailto:${companyInfo.Email}`} className="hover-link">{companyInfo.Email}</a></p>
                  </div>
                </div>

                <div className="info-card glass">
                  <div className="info-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div>
                    <h4>Office Address</h4>
                    <p>{companyInfo.OfficeAddress}</p>
                  </div>
                </div>

                <div className="info-card glass">
                  <div className="info-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 20h20M5 17h14M8 14h8M10 11h4M12 2v6"/></svg>
                  </div>
                  <div>
                    <h4>Manufacturing Site</h4>
                    <p>{companyInfo.PlantAddress}</p>
                  </div>
                </div>
              </div>

              {/* Map switcher & iframe */}
              <div className="map-wrapper glass">
                <div className="map-tabs">
                  <button 
                    className={`map-tab-btn ${mapTab === 'office' ? 'active' : ''}`}
                    onClick={() => setMapTab('office')}
                  >
                    Office Location
                  </button>
                  <button 
                    className={`map-tab-btn ${mapTab === 'plant' ? 'active' : ''}`}
                    onClick={() => setMapTab('plant')}
                  >
                    Plant Location
                  </button>
                </div>
                
                <div className="map-iframe-container">
                  {mapTab === 'office' ? (
                    companyInfo.OfficeMapEmbed ? (
                      <iframe
                        title="Corporate Office Map"
                        src={companyInfo.OfficeMapEmbed}
                        width="100%"
                        height="300"
                        style={{ border: 0 }}
                        allowFullScreen={false}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      ></iframe>
                    ) : (
                      <div className="map-loader">Loading map...</div>
                    )
                  ) : (
                    companyInfo.PlantMapEmbed ? (
                      <iframe
                        title="Manufacturing Plant Map"
                        src={companyInfo.PlantMapEmbed}
                        width="100%"
                        height="300"
                        style={{ border: 0 }}
                        allowFullScreen={false}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      ></iframe>
                    ) : (
                      <div className="map-loader">Loading map...</div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* 2. Right Column: Inquiry Form */}
            <div className="form-col glass">
              <h2>Send an Inquiry</h2>
              <p className="subtitle">Submit this form to send your messages or bulk order inquiries directly to our dashboard.</p>

              {status.type && (
                <div className={`status-banner ${status.type}`}>
                  {status.type === 'success' ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>
                  )}
                  <span>{status.message}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="inquiry-form">
                <div className="form-group">
                  <label htmlFor="name">Full Name <span className="req">*</span></label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number <span className="req">*</span></label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="e.g. 8888378411"
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="e.g. name@domain.com"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Subject / Product Interested <span className="req">*</span></label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    placeholder="e.g. Bulk order of 20L jars"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message / Inquiry Details <span className="req">*</span></label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Describe your requirements, delivery address, frequency of orders, etc..."
                    required
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary inquiry-submit" disabled={loading || !isFormValid} style={{ width: '100%', marginTop: '1rem' }}>
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Send Inquiry
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                    </>
                  )}
                </button>
                {!isFormValid && !loading && (
                  <p className="validation-message">
                    Please fill in all required fields correctly before submitting.
                  </p>
                )}
              </form>
            </div>
            
          </div>
        </div>
      </section>

      <style jsx>{`
        .contact-hero {
          background: linear-gradient(135deg, rgba(0, 162, 153, 0.05) 0%, rgba(15, 23, 42, 0.02) 100%);
          text-align: center;
          padding: 4rem 0 2rem;
          border-bottom: 1px solid var(--border-color);
        }
        .contact-hero h1 {
          font-size: 3rem;
          margin-top: 1rem;
          margin-bottom: 1rem;
        }
        .contact-hero p {
          max-width: 600px;
          margin: 0 auto;
          color: var(--text-secondary);
          font-size: 1.1rem;
        }

        .contact-layout-section {
          background-color: var(--bg-secondary);
        }
        .contact-grid {
          display: grid;
          grid-template-columns: 1fr 1.1fr;
          gap: 4rem;
        }
        .details-col h2, .form-col h2 {
          font-size: 1.75rem;
          margin-bottom: 0.5rem;
        }
        .subtitle {
          color: var(--text-secondary);
          font-size: 0.95rem;
          margin-bottom: 2rem;
        }

        .contact-info-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .info-card {
          padding: 1.25rem;
          border-radius: 16px;
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          box-shadow: var(--card-shadow);
        }
        .info-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: rgba(0, 162, 153, 0.1);
          color: var(--primary-color);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .info-card h4 {
          font-size: 0.95rem;
          margin-bottom: 0.25rem;
        }
        .info-card p {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.4;
          word-break: break-all;
        }
        .hover-link:hover {
          color: var(--primary-color);
        }

        /* Maps wrapper */
        .map-wrapper {
          border-radius: 20px;
          overflow: hidden;
          box-shadow: var(--card-shadow);
        }
        .map-tabs {
          display: flex;
          border-bottom: 1px solid var(--border-color);
        }
        .map-tab-btn {
          flex: 1;
          background: transparent;
          border: none;
          padding: 0.85rem;
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .map-tab-btn:hover {
          color: var(--primary-color);
        }
        .map-tab-btn.active {
          color: var(--primary-color);
          background: var(--bg-primary);
          border-bottom: 2px solid var(--primary-color);
        }
        .map-iframe-container {
          background: var(--bg-primary);
        }
        .map-loader {
          height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
        }

        /* Form styling */
        .form-col {
          border-radius: 24px;
          padding: 2.5rem;
          box-shadow: var(--card-shadow);
          height: fit-content;
        }
        .status-banner {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          border-radius: 12px;
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
          line-height: 1.4;
        }
        .status-banner.success {
          background: rgba(16, 185, 129, 0.15);
          color: #065f46;
          border: 1px solid rgba(16, 185, 129, 0.25);
        }
        .status-banner.error {
          background: rgba(239, 68, 68, 0.15);
          color: #991b1b;
          border: 1px solid rgba(239, 68, 68, 0.25);
        }
        .inquiry-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }
        label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .req {
          color: #ef4444;
        }
        input, textarea {
          padding: 0.85rem 1.1rem;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          background-color: var(--bg-primary);
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 0.95rem;
          transition: all var(--transition-fast);
        }
        input:focus, textarea:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(0, 162, 153, 0.1);
        }
        .inquiry-submit:disabled {
          background: #d1d5db;
          border-color: #d1d5db;
          color: #6b7280;
          box-shadow: none;
          cursor: not-allowed;
          opacity: 1;
        }
        .inquiry-submit:disabled:hover {
          background: #d1d5db;
          color: #6b7280;
          transform: none;
          box-shadow: none;
        }
        .validation-message {
          color: #991b1b;
          font-size: 0.85rem;
          line-height: 1.4;
          margin: -0.5rem 0 0;
        }
        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid white;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1024px) {
          .contact-grid {
            grid-template-columns: 1fr;
            gap: 4rem;
          }
        }
        @media (max-width: 600px) {
          .contact-info-list {
            grid-template-columns: 1fr;
          }
          .form-row {
            grid-template-columns: 1fr;
          }
          .form-col {
            padding: 1.5rem;
          }
        }
      `}</style>
    </>
  );
}
