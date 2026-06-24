'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/frontend/customer/hooks/useCart';
import { useLocation } from '@/frontend/customer/contexts/LocationContext';
import { formatCurrency } from '../../utils/commerce';
import type { CartItem } from '@/types/cms';
import type { User } from '@/frontend/customer/contexts/AuthContext';

export interface SavedAddress {
  id: string;
  type: 'Home' | 'Work' | 'Other';
  name: string;
  mobile: string;
  altMobile?: string;
  email?: string;
  flatNo: string;
  buildingName?: string;
  locality: string;
  landmark?: string;
  pincode: string;
  state: string;
  city: string;
  country: string;
  instructions?: string;
  isDefault?: boolean;
  fullAddress?: string;
}

export const WORLD_DATA: Record<string, Record<string, string[]>> = {
  'India': {
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur', 'Jalgaon', 'Akola', 'Daund'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Gandhinagar'],
    'Karnataka': ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi', 'Dharwad', 'Belagavi'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'],
    'Delhi': ['New Delhi', 'Delhi'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad'],
  },
  'United States': {
    'California': ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Sacramento'],
    'New York': ['New York City', 'Buffalo', 'Rochester', 'Albany', 'Syracuse'],
    'Texas': ['Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth'],
    'Florida': ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Tallahassee']
  },
  'United Arab Emirates': {
    'Abu Dhabi': ['Abu Dhabi City', 'Al Ain', 'Madinat Zayed'],
    'Dubai': ['Dubai City', 'Jebel Ali', 'Hatta'],
    'Sharjah': ['Sharjah City', 'Khor Fakkan', 'Kalba', 'Dhaid']
  }
};

interface CheckoutFormProps {
  form: {
    name: string;
    mobile: string;
    altMobile: string;
    email: string;
    flatNo: string;
    buildingName: string;
    locality: string;
    landmark: string;
    pincode: string;
    state: string;
    city: string;
    country: string;
    addressType: 'Home' | 'Work' | 'Other';
    instructions: string;
    saveAddress: boolean;
  };
  setForm: React.Dispatch<React.SetStateAction<any>>;
  errors: Record<string, string>;
  clearError: (key: string) => void;
  user: User | null;
  update: (key: string, value: any) => void;
  savedAddresses: SavedAddress[];
  selectedAddressId: string | null;
  isEditingAddress: boolean;
  onSelectAddress: (id: string) => void;
  onSetDefaultAddress: (id: string) => void;
  onAddNewClick: () => void;
  onEditClick: () => void;
  onCancelEditClick: () => void;
  locationLoading?: boolean;
  onDetectLocation: () => void;
}

export function CheckoutForm({
  form,
  setForm,
  errors,
  clearError,
  user,
  update,
  savedAddresses,
  selectedAddressId,
  isEditingAddress,
  onSelectAddress,
  onSetDefaultAddress,
  onAddNewClick,
  onEditClick,
  onCancelEditClick,
  locationLoading,
  onDetectLocation
}: CheckoutFormProps) {

  const selectedAddress = savedAddresses.find(a => a.id === selectedAddressId);
  const countries = Object.keys(WORLD_DATA);
  const states = form.country ? Object.keys(WORLD_DATA[form.country] || {}) : [];
  const cities = form.country && form.state ? (WORLD_DATA[form.country][form.state] || []) : [];

  return (
    <div className="checkout-form-container glass">
      {/* 1. Saved Address Compact Mode (Read-Only) */}
      {!isEditingAddress && selectedAddress ? (
        <div className="compact-address-card-wrapper animate-fade-in">
          <div className="compact-card-header">
            <div className="header-title-box">
              <h3>Delivery Details</h3>
              <span className={`type-badge type-${selectedAddress.type.toLowerCase()}`}>
                {selectedAddress.type}
              </span>
              {selectedAddress.isDefault && <span className="default-badge">Default</span>}
            </div>
            
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/customer-portal?tab=addresses&redirect=/checkout"
                aria-label="Edit address details"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 1.1rem',
                  borderRadius: '999px',
                  border: '1.5px solid rgba(37,99,235,0.35)',
                  background: 'rgba(37,99,235,0.08)',
                  color: '#2563eb',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  letterSpacing: '0.02em',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit Address
              </Link>
              <Link
                href="/customer-portal?tab=addresses&add=true&redirect=/checkout"
                aria-label="Add a new address"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 1.1rem',
                  borderRadius: '999px',
                  border: '1.5px solid transparent',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  letterSpacing: '0.02em',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 12px rgba(239,68,68,0.35)',
                  transition: 'all 0.2s ease',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add New Address
              </Link>
            </div>
          </div>

          <div className="compact-card-body">
            <div className="info-grid-2x2">
              <div className="info-block">
                <span className="info-label">Full Name</span>
                <strong className="info-val">{selectedAddress.name || user?.Name || 'Not provided'}</strong>
              </div>
              <div className="info-block">
                <span className="info-label">Mobile Number</span>
                <span className="info-sub">{selectedAddress.mobile || user?.Mobile || 'Not provided'}</span>
              </div>
              <div className="info-block">
                <span className="info-label">Email Address</span>
                <span className="info-email">{selectedAddress.email || user?.Username || 'Not provided'}</span>
              </div>
              <div className="checkout-alt-mobile-section" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
                <label className="info-label" style={{ marginBottom: '0.15rem', display: 'block' }}>Alt. Mobile <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(Optional)</span></label>
                <input
                  className="checkout-alt-mobile-input"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit number"
                  value={form.altMobile}
                  onChange={(e) => { update('altMobile', e.target.value.replace(/\D/g, '')); clearError('altMobile'); }}
                />
                {errors.altMobile && <span className="error-hint">{errors.altMobile}</span>}
              </div>
            </div>

            <div className="info-block" style={{ marginTop: '0.15rem' }}>
              <span className="info-label">Address</span>
              <p className="address-text-display">
                {selectedAddress.flatNo ? (
                  <>
                    {selectedAddress.flatNo}{selectedAddress.buildingName && `, ${selectedAddress.buildingName}`}{selectedAddress.locality && `, ${selectedAddress.locality}`}{selectedAddress.landmark && `, ${selectedAddress.landmark}`}, {selectedAddress.city}, {selectedAddress.state ? `${selectedAddress.state} - ` : ''}{selectedAddress.pincode}{selectedAddress.country ? `, ${selectedAddress.country}` : ''}
                  </>
                ) : (
                  <>
                    {selectedAddress.fullAddress || ''}, {selectedAddress.city} - {selectedAddress.pincode}
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Change Address Panel */}
          {savedAddresses.length > 1 && (
            <div className="change-address-panel">
              <label className="change-label">Change Delivery Address</label>
              <div className="address-pill-list">
                {savedAddresses.map(addr => (
                  <button
                    key={addr.id}
                    type="button"
                    className={`address-pill-btn ${addr.id === selectedAddressId ? 'active' : ''}`}
                    onClick={() => onSelectAddress(addr.id)}
                  >
                    <span className="pill-dot" />
                    <span className="pill-text">{addr.type}</span>
                    {addr.isDefault && <span className="pill-default-marker">★</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Delivery Instructions — always visible below Change Address */}
          <div className="delivery-instructions-section">
            <label className="change-label" style={{ marginBottom: '0.25rem' }}>Delivery Instructions <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(Optional)</span></label>
            <textarea
              className="delivery-instructions-textarea"
              rows={1}
              placeholder="e.g. Leave with security, call before delivery..."
              value={form.instructions}
              onChange={(e) => update('instructions', e.target.value)}
            />
          </div>
        </div>
      ) : (
        /* 2. Editable Form Fields Mode */
        <div className="address-edit-form animate-fade-in-up">
          <div className="form-section-header">
            <h3>{selectedAddressId && isEditingAddress ? 'Modify Delivery Details' : 'Add New Delivery Address'}</h3>
            <div className="header-actions">
              {savedAddresses.length > 0 && (
                <button type="button" onClick={onCancelEditClick} className="btn-cancel-form">
                  Cancel
                </button>
              )}
              <button 
                type="button" 
                className="btn-detect-gps" 
                onClick={onDetectLocation}
                disabled={locationLoading}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={locationLoading ? 'spin' : ''}>
                  <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                </svg>
                {locationLoading ? 'Detecting...' : 'Auto-detect GPS'}
              </button>
            </div>
          </div>

          {/* Contact Group */}
          <div className="form-fields-group">
            <h4 className="group-title">Contact Information</h4>
            <div className="form-grid-three">
              <div className="co-field">
                <label>Full Name <span className="req">*</span></label>
                <input
                  type="text"
                  placeholder="Rahul Sharma"
                  value={form.name}
                  onChange={(e) => { update('name', e.target.value); clearError('name'); }}
                  className={errors.name ? 'input-error' : ''}
                  required
                />
                {errors.name && <span className="error-hint">{errors.name}</span>}
              </div>
              
              <div className="co-field">
                <label>Mobile Number <span className="req">*</span></label>
                <input
                  type="tel"
                  placeholder="10-digit mobile"
                  maxLength={10}
                  value={form.mobile}
                  onChange={(e) => { update('mobile', e.target.value.replace(/\D/g, '')); clearError('mobile'); }}
                  className={errors.mobile ? 'input-error' : ''}
                  required
                />
                {errors.mobile && <span className="error-hint">{errors.mobile}</span>}
              </div>

              <div className="co-field">
                <label>Alternate Mobile <span className="opt">(Optional)</span></label>
                <input
                  type="tel"
                  placeholder="Alt mobile number"
                  maxLength={10}
                  value={form.altMobile}
                  onChange={(e) => { update('altMobile', e.target.value.replace(/\D/g, '')); clearError('altMobile'); }}
                />
              </div>
            </div>

            <div className="co-field">
              <label>Email Address <span className="opt">(Read-only)</span></label>
              <input
                type="email"
                placeholder="name@domain.com"
                value={form.email}
                className="form-input"
                disabled
              />
            </div>
          </div>

          {/* Address Location Group */}
          <div className="form-fields-group" style={{ marginTop: '1.5rem' }}>
            <h4 className="group-title">Location & Address Details</h4>
            
            <div className="form-grid-three">
              <div className="co-field">
                <label>Country <span className="req">*</span></label>
                <select
                  value={form.country}
                  onChange={(e) => {
                    setForm((f: any) => ({ ...f, country: e.target.value, state: '', city: '' }));
                    clearError('country');
                  }}
                  className="form-select"
                >
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="co-field">
                <label>State / Region <span className="req">*</span></label>
                <select
                  value={form.state}
                  onChange={(e) => {
                    setForm((f: any) => ({ ...f, state: e.target.value, city: '' }));
                    clearError('state');
                  }}
                  className={`form-select ${errors.state ? 'input-error' : ''}`}
                  disabled={!form.country}
                >
                  <option value="">Select state...</option>
                  {states.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.state && <span className="error-hint">{errors.state}</span>}
              </div>

              <div className="co-field">
                <label>City <span className="req">*</span></label>
                <select
                  value={form.city}
                  onChange={(e) => { update('city', e.target.value); clearError('city'); }}
                  className={`form-select ${errors.city ? 'input-error' : ''}`}
                  disabled={!form.state}
                >
                  <option value="">Select city...</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.city && <span className="error-hint">{errors.city}</span>}
              </div>
            </div>

            <div className="form-grid-two">
              <div className="co-field">
                <label>House/Flat/Apartment No. <span className="req">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Flat 104, Building A"
                  value={form.flatNo}
                  onChange={(e) => { update('flatNo', e.target.value); clearError('flatNo'); }}
                  className={errors.flatNo ? 'input-error' : ''}
                  required
                />
                {errors.flatNo && <span className="error-hint">{errors.flatNo}</span>}
              </div>

              <div className="co-field">
                <label>Building/Society Name <span className="opt">(Optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. Windcrest Apartments"
                  value={form.buildingName}
                  onChange={(e) => update('buildingName', e.target.value)}
                />
              </div>
            </div>

            <div className="form-grid-two">
              <div className="co-field">
                <label>Area / Locality <span className="req">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Koregaon Park"
                  value={form.locality}
                  onChange={(e) => { update('locality', e.target.value); clearError('locality'); }}
                  className={errors.locality ? 'input-error' : ''}
                  required
                />
                {errors.locality && <span className="error-hint">{errors.locality}</span>}
              </div>

              <div className="co-field">
                <label>Landmark <span className="opt">(Optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. Opposite Metro Station"
                  value={form.landmark}
                  onChange={(e) => update('landmark', e.target.value)}
                />
              </div>
            </div>

            <div className="form-grid-two">
              <div className="co-field">
                <label>Pincode / Zip Code <span className="req">*</span></label>
                <input
                  type="text"
                  placeholder="6-digit ZIP"
                  maxLength={6}
                  value={form.pincode}
                  onChange={(e) => { update('pincode', e.target.value.replace(/\D/g, '')); clearError('pincode'); }}
                  className={errors.pincode ? 'input-error' : ''}
                  required
                />
                {errors.pincode && <span className="error-hint">{errors.pincode}</span>}
              </div>

              <div className="co-field">
                <label>Address Label</label>
                <div className="address-type-pill-selectors">
                  {(['Home', 'Work', 'Other'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      className={`type-pill ${form.addressType === type ? 'active' : ''}`}
                      onClick={() => update('addressType', type)}
                    >
                      {type === 'Home' ? '🏠' : type === 'Work' ? '🏢' : '📍'} {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>



            {user && (
              <label className="save-future-checkbox-label">
                <input
                  type="checkbox"
                  checked={form.saveAddress}
                  onChange={(e) => update('saveAddress', e.target.checked)}
                />
                <span>Save this address for future orders & set as default</span>
              </label>
            )}
          </div>

          {/* Form Actions Footer */}
          {savedAddresses.length > 0 && (
            <div className="form-save-actions-bar">
              <button type="button" className="btn-cancel-edit" onClick={onCancelEditClick}>
                Discard Changes
              </button>
              <button 
                type="button" 
                className="btn-use-address-form"
                onClick={() => {
                  // This button just validates the inputs and switches back to read-only summary card
                  // The actual persisting is done when order is placed or when they click save.
                  onCancelEditClick();
                }}
              >
                Use This Address
              </button>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .checkout-form-container {
          padding: 1.15rem;
          border-radius: var(--radius-xl);
          border: 1px solid var(--glass-border);
          box-shadow: var(--shadow-xl);
          background: var(--glass-bg);
          backdrop-filter: blur(16px);
        }

        /* Compact summary card view */
        .compact-address-card-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .compact-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.65rem;
          gap: 0.5rem;
        }

        .header-title-box {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .header-title-box h3 {
          font-size: 1.3rem;
          margin: 0;
          font-weight: 700;
        }

        .type-badge {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.25rem 0.65rem;
          border-radius: 999px;
          border: 1px solid transparent;
        }

        .type-badge.type-home {
          background: rgba(37, 99, 235, 0.08);
          color: var(--primary-color);
          border-color: rgba(37, 99, 235, 0.15);
        }

        .type-badge.type-work {
          background: rgba(16, 185, 129, 0.08);
          color: #10b981;
          border-color: rgba(16, 185, 129, 0.15);
        }

        .type-badge.type-other {
          background: rgba(139, 92, 246, 0.08);
          color: #8b5cf6;
          border-color: rgba(139, 92, 246, 0.15);
        }

        .default-badge {
          background: rgba(249, 115, 22, 0.1);
          color: #ea6a0a;
          border: 1px solid rgba(249, 115, 22, 0.2);
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 0.2rem 0.5rem;
          border-radius: var(--radius-sm);
        }

        .card-actions {
          display: flex;
          gap: 0.6rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .action-link-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.35rem 0.75rem;
          border-radius: 999px;
          border: none;
          font-weight: 700;
          font-size: 0.75rem;
          letter-spacing: 0.02em;
          cursor: pointer;
          text-decoration: none !important;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          white-space: nowrap;
        }

        .action-link-btn.edit-btn {
          background: rgba(37, 99, 235, 0.1);
          color: var(--primary-color) !important;
          border: 1.5px solid rgba(37, 99, 235, 0.25);
        }

        .action-link-btn.edit-btn:hover {
          background: rgba(37, 99, 235, 0.18);
          border-color: var(--primary-color);
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.18);
          transform: translateY(-1px);
          text-decoration: none !important;
        }

        .action-link-btn.add-btn {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: #fff !important;
          border: 1.5px solid transparent;
          box-shadow: 0 2px 10px rgba(239, 68, 68, 0.3);
        }

        .action-link-btn.add-btn:hover {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          box-shadow: 0 4px 18px rgba(239, 68, 68, 0.42);
          transform: translateY(-1px);
          text-decoration: none !important;
          color: #fff !important;
        }

        .compact-card-body {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }

        .info-grid-2x2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem 0.75rem;
          align-items: start;
        }

        .info-block {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .info-label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-muted);
          letter-spacing: 0.03em;
        }

        .info-val {
          font-size: 0.9rem;
          color: var(--text-primary);
          font-weight: 700;
        }

        .info-sub {
          font-size: 0.8rem;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .info-email {
          font-size: 0.78rem;
          color: var(--text-muted);
        }

        .address-text-display {
          font-size: 0.85rem;
          line-height: 1.4;
          margin: 0;
          font-weight: 500;
          color: var(--text-primary);
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .delivery-instruction-box {
          margin-top: 0.75rem;
          background: rgba(148, 163, 184, 0.06);
          padding: 0.65rem 0.85rem;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          border-left: 3.5px solid var(--primary-color);
          color: var(--text-secondary);
        }

        .change-address-panel {
          margin-top: 0.25rem;
          border-top: 1px solid var(--border-color);
          padding-top: 0.5rem;
        }

        .delivery-instructions-section {
          margin-top: 0.25rem;
          border-top: 1px solid var(--border-color);
          padding-top: 0.5rem;
        }

        .checkout-alt-mobile-section {
          margin-top: 0.25rem;
          border-top: 1px solid var(--border-color);
          padding-top: 0.5rem;
        }

        .checkout-alt-mobile-input {
          width: 100%;
          box-sizing: border-box;
          padding: 0.4rem 0.65rem;
          border-radius: var(--radius-md);
          border: 1.5px solid var(--border-color);
          background: rgba(148, 163, 184, 0.04);
          color: var(--text-primary);
          font-size: 0.8rem;
          outline: none;
        }

        .checkout-alt-mobile-input:focus {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .delivery-instructions-textarea {
          width: 100%;
          padding: 0.4rem 0.65rem;
          border-radius: var(--radius-md);
          border: 1.5px solid var(--border-color);
          background: rgba(148, 163, 184, 0.04);
          color: var(--text-primary);
          font-size: 0.8rem;
          font-family: inherit;
          line-height: 1.3;
          resize: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
          box-sizing: border-box;
        }

        .delivery-instructions-textarea:focus {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .delivery-instructions-textarea::placeholder {
          color: var(--text-muted);
          font-style: italic;
        }

        .change-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 0.35rem;
          letter-spacing: 0.03em;
        }

        .address-pill-list {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
        }

        .address-pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.3rem 0.7rem;
          border-radius: 999px;
          border: 1.5px solid var(--border-color);
          background: rgba(148, 163, 184, 0.04);
          color: var(--text-secondary);
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .address-pill-btn:hover {
          border-color: var(--primary-color);
          color: var(--primary-color);
          background: rgba(37, 99, 235, 0.05);
        }

        .address-pill-btn.active {
          border-color: var(--primary-color);
          color: var(--primary-color);
          background: rgba(37, 99, 235, 0.08);
          box-shadow: 0 4px 10px rgba(37, 99, 235, 0.08);
        }

        .pill-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--text-muted);
          transition: background 0.2s;
        }

        .address-pill-btn.active .pill-dot {
          background: var(--primary-color);
        }

        .pill-default-marker {
          color: #ea6a0a;
          font-size: 0.75rem;
        }

        /* Form Layout Editing Mode */
        .form-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.75rem;
          margin-bottom: 1rem;
        }

        .form-section-header h3 {
          font-size: 1.15rem;
          font-weight: 700;
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
        }

        .btn-cancel-form {
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 0.4rem 0.8rem;
          border-radius: var(--radius-md);
          font-weight: 600;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-cancel-form:hover {
          background: rgba(148, 163, 184, 0.08);
          color: var(--text-primary);
        }

        .btn-detect-gps {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: rgba(37, 99, 235, 0.08);
          border: 1px solid rgba(37, 99, 235, 0.2);
          color: var(--primary-color);
          padding: 0.4rem 0.8rem;
          border-radius: var(--radius-md);
          font-weight: 700;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-detect-gps:hover:not(:disabled) {
          background: rgba(37, 99, 235, 0.15);
        }

        .btn-detect-gps:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .form-fields-group {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .group-title {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--primary-color);
          letter-spacing: 0.05em;
          border-bottom: 1.5px solid rgba(37, 99, 235, 0.15);
          padding-bottom: 0.25rem;
          margin: 0.25rem 0 0;
        }

        .co-field {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .co-field label {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-secondary);
        }

        .co-field input, .co-field textarea, .form-select {
          width: 100%;
          padding: 0.55rem 0.85rem;
          border: 1.5px solid var(--border-color);
          border-radius: var(--radius-md);
          background: rgba(15, 23, 42, 0.2);
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 0.85rem;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .co-field input:focus, .co-field textarea:focus, .form-select:focus {
          outline: none;
          border-color: var(--primary-color);
          background: rgba(15, 23, 42, 0.35);
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.15);
        }

        .co-field input.input-error, .form-select.input-error {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.05);
        }

        .error-hint {
          color: #ef4444;
          font-size: 0.78rem;
          font-weight: 600;
        }

        .co-field .req {
          color: #ef4444;
        }

        .co-field .opt {
          color: var(--text-muted);
          font-size: 0.75rem;
        }

        .form-grid-three {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.85rem;
        }

        .form-grid-two {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.85rem;
        }

        .form-select {
          appearance: none;
          padding-right: 2.25rem;
          background: rgba(15, 23, 42, 0.2) url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>') no-repeat right 0.85rem center;
          background-size: 16px;
        }

        .address-type-pill-selectors {
          display: flex;
          gap: 0.5rem;
        }

        .type-pill {
          flex: 1;
          padding: 0.4rem;
          border: 1.5px solid var(--border-color);
          border-radius: var(--radius-md);
          background: rgba(148, 163, 184, 0.05);
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
        }

        .type-pill:hover {
          border-color: var(--primary-color);
          color: var(--primary-color);
        }

        .type-pill.active {
          background: rgba(37, 99, 235, 0.08);
          border-color: var(--primary-color);
          color: var(--primary-color);
        }

        .save-future-checkbox-label {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          cursor: pointer;
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-top: 0.5rem;
          user-select: none;
        }

        .save-future-checkbox-label input {
          width: 17px;
          height: 17px;
          border-radius: var(--radius-sm);
          border: 1.5px solid var(--border-color);
          cursor: pointer;
        }

        .form-save-actions-bar {
          display: flex;
          justify-content: flex-end;
          gap: 0.85rem;
          margin-top: 1.25rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }

        .btn-cancel-edit {
          padding: 0.55rem 1rem;
          background: transparent;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-cancel-edit:hover {
          background: rgba(148, 163, 184, 0.08);
          color: var(--text-primary);
        }

        .btn-use-address-form {
          padding: 0.55rem 1.25rem;
          background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
          border: none;
          border-radius: var(--radius-md);
          color: #ffffff;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2);
        }

        .btn-use-address-form:hover {
          background: linear-gradient(135deg, var(--primary-hover) 0%, var(--primary-color) 100%);
          transform: translateY(-1px);
        }

        .spin {
          animation: spin-kf 1s linear infinite;
        }

        @keyframes spin-kf {
          to { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Mobile Adjustments */
        @media (max-width: 640px) {
          .info-grid-2x2, .form-grid-three, .form-grid-two {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
          
          .compact-card-header {
            flex-direction: column;
            gap: 0.75rem;
          }
          
          .card-actions {
            width: 100%;
            justify-content: flex-start;
          }

          .form-save-actions-bar {
            flex-direction: column-reverse;
            gap: 0.75rem;
          }

          .btn-cancel-edit, .btn-use-address-form {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}

interface CheckoutSummaryProps {
  status: { kind: 'idle' | 'loading' | 'success' | 'error'; message: string };
  items?: CartItem[];
  subtotal?: number;
  deliveryCharge?: number;
  grandTotal?: number;
  isReorder?: boolean;
}

export function CheckoutSummary({ status, items, subtotal, deliveryCharge, grandTotal, isReorder }: CheckoutSummaryProps) {
  const cart = useCart();
  const checkoutItems = items || cart.items;
  const checkoutSubtotal = subtotal ?? cart.subtotal;
  const checkoutDeliveryCharge = deliveryCharge ?? cart.deliveryCharge;
  const checkoutGrandTotal = grandTotal ?? cart.grandTotal;

  return (
    <aside className="co-summary glass">
      <h2>{isReorder ? 'Reorder Summary' : 'Order Summary'}</h2>
      <div className="co-items">
        {checkoutItems.map((item) => (
          <div className="co-item-row" key={item.productId}>
            <div className="co-item-info">
              <span className="co-item-name">{item.name}</span>
              <span className="co-item-qty">× {item.quantity}</span>
            </div>
            <strong>{formatCurrency(item.price * item.quantity)}</strong>
          </div>
        ))}
      </div>
      <div className="co-totals">
        <div className="sum-row">
          <span>Subtotal</span>
          <strong>{formatCurrency(checkoutSubtotal)}</strong>
        </div>
        <div className="sum-row">
          <span>Delivery</span>
          <strong className={!checkoutDeliveryCharge ? 'co-free' : ''}>
            {checkoutDeliveryCharge ? formatCurrency(checkoutDeliveryCharge) : 'Free'}
          </strong>
        </div>
        <div className="sum-row total">
          <span>Total</span>
          <strong>{formatCurrency(checkoutGrandTotal)}</strong>
        </div>
      </div>
      <div className="co-payment-badge">
        <span>💵</span> Cash on Delivery
      </div>
      {status.message && <p className={`status-${status.kind}`}>{status.message}</p>}
      
      <button
        type="submit"
        id="place-order-btn"
        className="btn-place-order"
        disabled={status.kind === 'loading'}
      >
        {status.kind === 'loading' ? (
          <span className="btn-spinner-wrapper">
            <svg className="spin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            Placing Order...
          </span>
        ) : (
          <span>Place Order →</span>
        )}
      </button>
      
      <p className="co-secure-note">🔒 Secure checkout. Your data is safe.</p>
      
      <style jsx>{`
        .co-summary {
          border-radius: var(--radius-xl);
          padding: 1.15rem;
          border: 1px solid var(--glass-border);
          box-shadow: var(--shadow-xl);
          background: var(--glass-bg);
          backdrop-filter: blur(16px);
          position: sticky;
          top: 100px;
        }

        .co-summary h2 {
          margin-top: 0;
          margin-bottom: 1.25rem;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .co-items {
          max-height: 220px;
          overflow-y: auto;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.75rem;
          margin-bottom: 0.75rem;
          display: grid;
          gap: 0.5rem;
        }

        .co-item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
        }

        .co-item-info {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .co-item-name {
          font-weight: 700;
          color: var(--text-primary);
        }

        .co-item-qty {
          font-size: 0.78rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .co-totals {
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.75rem;
          margin-bottom: 0.75rem;
          display: grid;
          gap: 0.4rem;
        }

        .sum-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .sum-row.total {
          font-size: 1.2rem;
          color: var(--text-primary);
          font-weight: 800;
          margin-top: 0.25rem;
        }

        .co-free {
          color: #22c55e;
          font-weight: 700;
        }

        .co-payment-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          padding: 0.5rem;
          border-radius: var(--radius-md);
          background: rgba(37, 99, 235, 0.08);
          border: 1px solid rgba(37, 99, 235, 0.15);
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--primary-color);
          margin-bottom: 0.85rem;
        }

        .btn-place-order {
          width: 100%;
          padding: 0.7rem;
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 0.9rem;
          color: #ffffff;
          background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
          transition: all 0.2s ease;
        }

        .btn-place-order:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35);
        }

        .btn-place-order:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-spinner-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .spin-icon {
          animation: spin 1s linear infinite;
          width: 16px;
          height: 16px;
        }

        .co-secure-note {
          text-align: center;
          color: var(--text-muted);
          font-size: 0.72rem;
          margin-top: 0.75rem;
          font-weight: 600;
        }

        .status-loading {
          color: var(--primary-color);
          font-weight: 700;
          font-size: 0.85rem;
          margin-bottom: 1rem;
          text-align: center;
        }

        .status-error {
          color: #ef4444;
          font-weight: 700;
          font-size: 0.85rem;
          margin-bottom: 1rem;
          text-align: center;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 900px) {
          .co-summary {
            position: static;
          }
        }
      `}</style>
    </aside>
  );
}

interface CheckoutSuccessProps {
  message: string;
  orderId?: string;
}

export function CheckoutSuccess({ message, orderId }: CheckoutSuccessProps) {
  return (
    <div className="co-success glass">
      <div className="co-success-icon">🎉</div>
      <h2>Order Placed!</h2>
      <p>{message}</p>
      {orderId && <strong>Order ID: {orderId}</strong>}
      <div className="success-actions">
        <Link className="btn btn-primary" href={`/track?orderId=${orderId || ''}`}>Track Order</Link>
        <Link className="btn btn-secondary" href="/products">Continue Shopping</Link>
      </div>
      <style jsx>{`
        .co-success {
          text-align: center;
          max-width: 440px;
          margin: 1.5rem auto;
          padding: 2.25rem 1.5rem;
          border-radius: var(--radius-2xl);
          border: 1px solid var(--glass-border);
          box-shadow: var(--shadow-2xl);
          background: var(--glass-bg);
          backdrop-filter: blur(16px);
        }

        .co-success-icon {
          font-size: 2.75rem;
          margin-bottom: 0.75rem;
        }

        .co-success h2 {
          font-size: 1.50rem;
          margin-bottom: 0.5rem;
          font-weight: 800;
        }

        .co-success p {
          color: var(--text-secondary);
          margin-bottom: 1rem;
          font-size: 0.92rem;
        }

        .co-success strong {
          display: block;
          background: rgba(148, 163, 184, 0.06);
          border: 1.5px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 0.5rem 0.85rem;
          font-family: var(--font-heading);
          color: var(--text-primary);
          font-size: 0.95rem;
          margin-bottom: 1.5rem;
        }

        .success-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
        }

        @media (max-width: 640px) {
          .success-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
