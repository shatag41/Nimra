'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CompanyInfo } from '@/types/cms';
import { submitInquiry } from '@/utils/api';
import { useAuth } from '@/frontend/customer/contexts/AuthContext';

interface ContactClientProps {
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

export default function ContactClient({ companyInfo }: ContactClientProps) {
  const { user } = useAuth();
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

  const customerName = String(user?.Name || '').trim();
  const customerEmail = String(user?.Username || '').trim();
  const customerPhone = String(user?.Mobile || '').replace(/\D/g, '').slice(-10);

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      name: prev.name || customerName,
      email: prev.email || customerEmail,
      phone: prev.phone || customerPhone,
    }));
  }, [user, customerName, customerEmail, customerPhone]);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });

  const officeMapUrl = getMapEmbedUrl(companyInfo.OfficeMapEmbed, companyInfo.OfficeAddress);
  const plantMapUrl = getMapEmbedUrl(companyInfo.PlantMapEmbed, companyInfo.PlantAddress);
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
      const response = await submitInquiry({ ...form, customerId: user?.ID ? String(user.ID) : undefined });
      if (response.success) {
        setStatus({
          type: 'success',
          message: 'Inquiry submitted successfully! Our representative will contact you shortly.',
        });
        setForm({
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          subject: '',
          message: '',
        });
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
    <div className="contact-page container">
      {/* Page Header */}
      <div className="page-header animate-slide-up">
        <span className="badge badge-primary">Contact Us</span>
        <h1>Get In Touch With NIMRA</h1>
        <p>We&apos;d love to hear from you. Reach out for bulk water supplies, dealership opportunities, or quality inquiries.</p>
      </div>

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
                officeMapUrl ? (
                  <iframe
                    title="Corporate Office Map"
                    src={officeMapUrl}
                    width="100%"
                    height="200"
                    style={{ border: 0 }}
                    allowFullScreen={false}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                ) : (
                  <div className="map-loader">Loading map...</div>
                )
              ) : (
                plantMapUrl ? (
                  <iframe
                    title="Manufacturing Plant Map"
                    src={plantMapUrl}
                    width="100%"
                    height="200"
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
                {form.phone.length > 0 && !isPhoneValid && (
                  <p className="field-validation-message">Phone number must be exactly 10 digits.</p>
                )}
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
                rows={4}
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

      <style jsx>{`
        .contact-page {
          padding-top: 0;
          padding-bottom: 2rem;
          font-family: var(--font-body);
        }

        /* ── Page Header ── */
        .page-header {
          margin-bottom: 1rem;
          padding-bottom: 0;
          text-align: center;
        }

        .page-header h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
          letter-spacing: -0.02em;
          color: var(--text-primary);
        }

        .page-header p {
          color: var(--text-muted);
          margin: 0 auto;
          font-size: 0.875rem;
          line-height: 1.4;
          max-width: 700px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 0.25rem 0.75rem;
          font-size: 0.7rem;
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

        .contact-grid {
          display: grid;
          grid-template-columns: 1fr 1.1fr;
          gap: 1.5rem;
        }
        .details-col {
          position: relative;
          z-index: 1;
          pointer-events: auto;
        }
        .details-col h2, .form-col h2 {
          font-size: 1.5rem;
          margin-bottom: 0.25rem;
        }
        .subtitle {
          color: var(--text-muted);
          font-size: 0.9rem;
          margin-bottom: 1rem;
        }

        .contact-info-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .info-card {
          padding: 0.85rem;
          border-radius: var(--radius-lg);
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
          background: var(--bg-primary);
          border: 1px solid rgba(150, 150, 150, 0.15);
          transition: all var(--transition-normal);
          height: 100%;
        }
        .info-card:hover {
          border-color: var(--primary-color);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
          transform: translateY(-2px);
        }
        .info-icon {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          background: rgba(var(--primary-rgb), 0.1);
          color: var(--primary-color);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .info-card h4 {
          font-size: 0.9rem;
          margin-bottom: 0.15rem;
        }
        .info-card p {
          font-size: 0.8rem;
          color: var(--text-secondary);
          line-height: 1.4;
          word-break: break-all;
        }
        .hover-link:hover {
          color: var(--primary-color);
        }

        /* Maps wrapper */
        .map-wrapper {
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
          background: var(--bg-primary);
          border: 1px solid rgba(150, 150, 150, 0.15);
          position: relative;
          z-index: 1;
          pointer-events: auto;
        }
        .map-tabs {
          display: flex;
          border-bottom: 1px solid rgba(150, 150, 150, 0.15);
          position: relative;
          z-index: 10;
        }
        .map-tab-btn {
          flex: 1;
          background: transparent;
          border: none;
          padding: 0.75rem;
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 0.85rem;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
          pointer-events: auto;
          position: relative;
          z-index: 20;
        }
        .map-tab-btn:hover {
          color: var(--primary-color);
        }
        .map-tab-btn.active {
          color: var(--primary-color);
          background: var(--bg-secondary);
          border-bottom: 2px solid var(--primary-color);
        }
        .map-iframe-container {
          background: var(--bg-primary);
        }
        .map-loader {
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
        }

        /* Form styling */
        .form-col {
          border-radius: var(--radius-lg);
          padding: 1.25rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          height: fit-content;
          background: var(--bg-primary);
          border: 1px solid rgba(150, 150, 150, 0.15);
          position: relative;
          z-index: 1;
          pointer-events: auto;
        }
        .status-banner {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.85rem 1rem;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          margin-bottom: 1rem;
          line-height: 1.4;
        }
        .status-banner.success {
          background: rgba(16, 185, 129, 0.15);
          color: var(--accent-color);
          border: 1px solid rgba(16, 185, 129, 0.25);
        }
        .status-banner.error {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.25);
        }
        .inquiry-form {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          position: relative;
          z-index: 5;
          pointer-events: auto;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          position: relative;
          z-index: 10;
          pointer-events: auto;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.85rem;
        }
        label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .req {
          color: #ef4444;
        }
        input, textarea {
          padding: 0.65rem 0.85rem;
          border-radius: var(--radius-md);
          border: 1px solid rgba(150, 150, 150, 0.25);
          background-color: var(--bg-secondary);
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 0.9rem;
          transition: all var(--transition-fast);
          pointer-events: auto;
          position: relative;
          z-index: 20;
        }
        input:focus, textarea:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.1);
        }
        .inquiry-submit {
          pointer-events: auto;
          z-index: 10;
          position: relative;
        }
        .inquiry-submit:disabled {
          background: var(--text-muted);
          border-color: var(--text-muted);
          color: var(--text-secondary);
          box-shadow: none;
          cursor: not-allowed;
          opacity: 0.7;
          pointer-events: none;
        }
        .inquiry-submit:disabled:hover {
          background: var(--text-muted);
          color: var(--text-secondary);
          transform: none;
          box-shadow: none;
        }
        .validation-message {
          color: #ef4444;
          font-size: 0.85rem;
          line-height: 1.4;
          margin: -0.5rem 0 0;
        }
        .field-validation-message {
          color: #ef4444;
          font-size: 0.8rem;
          line-height: 1.4;
          margin: 0;
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
            gap: 2rem;
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
    </div>
  );
}
