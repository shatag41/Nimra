'use client';

import React, { useState, useEffect } from 'react';
import { useLocation } from '@/frontend/customer/contexts/LocationContext';
import { useAuth } from '@/frontend/customer/hooks/useAuth';
import { WORLD_DATA } from './Checkout';

interface Address {
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
  fullAddress: string;
  isDefault?: boolean;
}

export function Addresses() {
  const { user } = useAuth();
  const storageKey = `nimra_saved_addresses_${user?.ID || 'guest'}`;

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Omit<Address, 'id' | 'fullAddress'>>({
    type: 'Home',
    name: '',
    mobile: '',
    altMobile: '',
    email: '',
    flatNo: '',
    buildingName: '',
    locality: '',
    landmark: '',
    pincode: '',
    state: '',
    city: '',
    country: 'India',
    instructions: '',
    isDefault: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setAddresses(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved addresses', e);
      }
    } else {
      // Default placeholder address
      setAddresses([{ 
        id: '1', 
        type: 'Home', 
        name: user?.Name || 'Shata G',
        mobile: user?.Mobile || '1234567890',
        flatNo: '123 Main St',
        buildingName: 'Apartment 4B',
        locality: 'Colaba',
        pincode: '400001',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        fullAddress: '123 Main St, Apartment 4B, Colaba',
        isDefault: true
      }]);
    }
  }, [storageKey, user]);

  useEffect(() => {
    if (addresses.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(addresses));
    }
  }, [addresses, storageKey]);
  
  const { city: locationCity, address: locationAddress, state: locationState, pincode: locationPincode, requestLocation, loading: locationLoading } = useLocation();

  const handleUseLocation = async () => {
    await requestLocation(true);
    
    let matchedState = formData.state || locationState || '';
    let matchedCity = formData.city || locationCity || '';

    const currentCountryData = WORLD_DATA[formData.country] || {};
    const stateKeys = Object.keys(currentCountryData);

    if (locationState && !formData.state) {
      const foundState = stateKeys.find(s => s.toLowerCase().trim() === locationState.toLowerCase().trim());
      if (foundState) matchedState = foundState;
    }

    if (matchedState && !formData.city && locationCity) {
      const cities = currentCountryData[matchedState] || [];
      const searchTarget = `${locationCity} ${locationAddress || ''}`.toLowerCase();
      const foundCity = cities.find(c => searchTarget.includes(c.toLowerCase()));
      if (foundCity) {
        matchedCity = foundCity;
      }
    }

    setFormData(prev => ({
      ...prev,
      flatNo: prev.flatNo || (locationAddress ? locationAddress.split(',')[0].trim() : ''),
      locality: prev.locality || (locationAddress ? locationAddress.split(',').slice(1, 3).join(', ').trim() : ''),
      city: matchedCity,
      state: matchedState,
      pincode: prev.pincode || locationPincode || ''
    }));
  };

  const updateField = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.flatNo.trim()) newErrors.flatNo = 'Flat or house number is required.';
    if (!formData.locality.trim()) newErrors.locality = 'Area or locality is required.';
    if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required.';
    if (!formData.state) newErrors.state = 'Please select a state.';
    if (!formData.city) newErrors.city = 'Please select a city.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const compositeAddress = [formData.flatNo, formData.buildingName, formData.locality, formData.landmark]
      .filter(Boolean).join(', ');

    const newSavedAddr: Address = {
      ...formData,
      fullAddress: compositeAddress,
      id: editId || Date.now().toString()
    };

    let updatedList: Address[];
    if (formData.isDefault) {
      // Set all other addresses to not default
      const listWithoutDefault = addresses.map(a => ({ ...a, isDefault: false }));
      updatedList = editId
        ? listWithoutDefault.map(a => a.id === editId ? newSavedAddr : a)
        : [...listWithoutDefault, newSavedAddr];
    } else {
      updatedList = editId
        ? addresses.map(a => a.id === editId ? newSavedAddr : a)
        : [...addresses, newSavedAddr];
    }

    setAddresses(updatedList);
    setIsAdding(false);
    setEditId(null);
  };

  const handleEdit = (address: Address) => {
    setFormData({
      type: address.type,
      name: address.name || user?.Name || '',
      mobile: address.mobile || user?.Mobile || '',
      altMobile: address.altMobile || '',
      email: address.email || user?.Username || '',
      flatNo: address.flatNo || address.fullAddress || '',
      buildingName: address.buildingName || '',
      locality: address.locality || '',
      landmark: address.landmark || '',
      pincode: address.pincode,
      state: address.state || '',
      city: address.city,
      country: address.country || 'India',
      instructions: address.instructions || '',
      isDefault: address.isDefault || false
    });
    setEditId(address.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    const updated = addresses.filter(a => a.id !== id);
    setAddresses(updated);
    if (updated.length === 0) {
      localStorage.removeItem(storageKey);
    }
  };

  const handleAddNew = () => {
    setFormData({
      type: 'Home',
      name: user?.Name || '',
      mobile: user?.Mobile || '',
      altMobile: '',
      email: user?.Username || '',
      flatNo: '',
      buildingName: '',
      locality: '',
      landmark: '',
      pincode: '',
      state: '',
      city: '',
      country: 'India',
      instructions: '',
      isDefault: addresses.length === 0 // Auto default if first address
    });
    setEditId(null);
    setIsAdding(true);
  };
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('add') === 'true') {
        handleAddNew();
        const newUrl = window.location.pathname + window.location.search.replace(/[&?]add=true/, '');
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [user]);

  const countries = Object.keys(WORLD_DATA);
  const states = formData.country ? Object.keys(WORLD_DATA[formData.country] || {}) : [];
  const cities = formData.country && formData.state ? (WORLD_DATA[formData.country][formData.state] || []) : [];

  return (
    <div className="addresses-container">
      <div className="section-header">
        <div className="header-text-container">
          <div className="title-row">
            <h2>Saved Addresses</h2>
            <span className="address-counter">{addresses.length}</span>
          </div>
          <p>Manage your delivery locations for faster, hassle-free checkout.</p>
        </div>
        {!isAdding && (
          <button onClick={handleAddNew} className="btn-add-address" aria-label="Add a new delivery address">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5v14"/>
            </svg>
            Add New Address
          </button>
        )}
      </div>

      {isAdding ? (
        <div className="address-form-panel glass animate-fade-in-up">
          <div className="form-header">
            <h3>{editId ? 'Modify Saved Address' : 'Add New Address'}</h3>
            <p>Ensure details match your shipping location accurately.</p>
          </div>
          <form onSubmit={handleSave}>
            {/* Address Group */}
            <div className="form-fields-group">
              <div className="label-row-header">
                <h4 className="group-title">Location Details</h4>
                <button 
                  type="button" 
                  onClick={handleUseLocation} 
                  className={`btn-use-location ${locationLoading ? 'detecting' : ''}`} 
                  disabled={locationLoading}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={locationLoading ? 'spin' : ''}>
                    <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                  </svg>
                  {locationLoading ? 'Detecting...' : 'Use GPS Location'}
                </button>
              </div>

              <div className="form-grid-three">
                <div className="form-group">
                  <label className="form-label">Country <span className="req">*</span></label>
                  <select
                    value={formData.country}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, country: e.target.value, state: '', city: '' }));
                    }}
                    className="form-select"
                  >
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">State / Region <span className="req">*</span></label>
                  <select
                    value={formData.state}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, state: e.target.value, city: '' }));
                    }}
                    className={`form-select ${errors.state ? 'error-state' : ''}`}
                    disabled={!formData.country}
                  >
                    <option value="">Select state...</option>
                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.state && <span className="error-message">{errors.state}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">City <span className="req">*</span></label>
                  <select
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    className={`form-select ${errors.city ? 'error-state' : ''}`}
                    disabled={!formData.state}
                  >
                    <option value="">Select city...</option>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.city && <span className="error-message">{errors.city}</span>}
                </div>
              </div>

              <div className="form-grid-row">
                <div className="form-group">
                  <label className="form-label">House/Flat/Apt No. <span className="req">*</span></label>
                  <input 
                    type="text" 
                    value={formData.flatNo} 
                    onChange={e => updateField('flatNo', e.target.value)} 
                    className={`form-input ${errors.flatNo ? 'error-state' : ''}`} 
                    placeholder="e.g. Flat 104, Block A"
                    required
                  />
                  {errors.flatNo && <span className="error-message">{errors.flatNo}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Building / Society <span className="opt">(Optional)</span></label>
                  <input 
                    type="text" 
                    value={formData.buildingName} 
                    onChange={e => updateField('buildingName', e.target.value)} 
                    className="form-input" 
                    placeholder="e.g. Green Valley Society"
                  />
                </div>
              </div>

              <div className="form-grid-row">
                <div className="form-group">
                  <label className="form-label">Area / Locality <span className="req">*</span></label>
                  <input 
                    type="text" 
                    value={formData.locality} 
                    onChange={e => updateField('locality', e.target.value)} 
                    className={`form-input ${errors.locality ? 'error-state' : ''}`} 
                    placeholder="e.g. Koregaon Park"
                    required
                  />
                  {errors.locality && <span className="error-message">{errors.locality}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Landmark <span className="opt">(Optional)</span></label>
                  <input 
                    type="text" 
                    value={formData.landmark} 
                    onChange={e => updateField('landmark', e.target.value)} 
                    className="form-input" 
                    placeholder="e.g. Near City Mall"
                  />
                </div>
              </div>

              <div className="form-grid-row">
                <div className="form-group">
                  <label className="form-label">Pincode / Zip Code <span className="req">*</span></label>
                  <input 
                    type="text" 
                    value={formData.pincode} 
                    onChange={e => updateField('pincode', e.target.value.replace(/\D/g, ''))} 
                    className={`form-input ${errors.pincode ? 'error-state' : ''}`} 
                    placeholder="6-digit ZIP code"
                    maxLength={6}
                    required
                  />
                  {errors.pincode && <span className="error-message">{errors.pincode}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Address Type</label>
                  <div className="type-selectors-wrapper">
                    {(['Home', 'Work', 'Other'] as const).map(type => (
                      <button 
                        key={type}
                        type="button" 
                        className={`type-selector-btn ${formData.type === type ? 'active' : ''}`}
                        onClick={() => updateField('type', type)}
                      >
                        <span>{type === 'Home' ? '🏠' : type === 'Work' ? '🏢' : '📍'} {type}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>



              <label className="save-future-checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => updateField('isDefault', e.target.checked)}
                />
                <span>Set as default shipping address</span>
              </label>
            </div>

            <div className="form-actions-footer">
              <button type="button" onClick={() => setIsAdding(false)} className="btn-cancel">
                Cancel
              </button>
              <button type="submit" className="btn-submit">
                <span>Save Address</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="addresses-grid">
          {addresses.length === 0 ? (
            <div className="empty-state-card glass">
              <div className="empty-icon-wrapper">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <h4>No Addresses Found</h4>
              <p>You haven't saved any delivery locations yet. Add one now to speed up checkout.</p>
              <button onClick={handleAddNew} className="btn-add-address-empty">
                Add Address
              </button>
            </div>
          ) : (
            addresses.map(address => (
              <div key={address.id} className="address-card glass animate-scale-in">
                <div className="address-card-header">
                  <div className="badge-row">
                    <span className={`address-badge type-${address.type.toLowerCase()}`}>
                      {address.type}
                    </span>
                    {address.isDefault && <span className="default-pill">Default</span>}
                  </div>
                  <div className="address-actions">
                    <button onClick={() => handleEdit(address)} className="action-btn edit" title="Edit Address" aria-label="Edit Address">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(address.id)} className="action-btn delete" title="Delete Address" aria-label="Delete Address">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="address-card-body">
                  <p className="full-address">
                    {address.flatNo ? (
                      <>
                        {address.flatNo}{address.buildingName ? `, ${address.buildingName}` : ''}, {address.locality}{address.landmark ? `, ${address.landmark}` : ''}
                      </>
                    ) : (
                      address.fullAddress
                    )}
                  </p>
                  <div className="city-pin-row">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pin-marker">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span className="city-pin-text">{address.city}, {address.state ? `${address.state} - ` : ''}{address.pincode} {address.country && `(${address.country})`}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <style jsx>{`
        .addresses-container {
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          gap: 1.5rem;
        }

        .header-text-container {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .title-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .section-header h2 {
          font-size: 1.75rem;
          margin: 0;
          font-family: var(--font-heading);
          font-weight: 700;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, var(--text-primary) 0%, rgba(var(--primary-rgb), 0.8) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .address-counter {
          background: rgba(37, 99, 235, 0.15);
          color: var(--primary-color);
          font-size: 0.85rem;
          font-weight: 700;
          padding: 0.2rem 0.65rem;
          border-radius: 999px;
          border: 1px solid rgba(37, 99, 235, 0.25);
        }

        .section-header p {
          color: var(--text-secondary);
          margin: 0;
          font-size: 0.95rem;
          font-family: var(--font-body);
        }

        .btn-add-address {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 0.9rem;
          color: #ffffff;
          background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .btn-add-address:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35);
        }

        .addresses-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        /* Glassmorphic Cards */
        .glass {
          background: var(--glass-bg);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-sm);
        }

        .address-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }

        .address-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 3px;
          background: transparent;
          transition: background 0.3s ease;
        }

        .address-card:hover {
          transform: translateY(-4px);
          border-color: rgba(37, 99, 235, 0.35);
          box-shadow: var(--shadow-lg), 0 10px 30px rgba(37, 99, 235, 0.05);
        }

        .address-card:hover::before {
          background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
        }

        .address-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .badge-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .address-badge {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.25rem 0.65rem;
          border-radius: 999px;
        }

        .address-badge.type-home {
          background: rgba(37, 99, 235, 0.1);
          color: var(--primary-color);
        }

        .address-badge.type-work {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .address-badge.type-other {
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
        }

        .default-pill {
          background: rgba(249, 115, 22, 0.1);
          color: #ea6a0a;
          border: 1px solid rgba(249, 115, 22, 0.2);
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 0.15rem 0.4rem;
          border-radius: var(--radius-sm);
        }

        .address-actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          background: rgba(148, 163, 184, 0.08);
          border: 1px solid rgba(148, 163, 184, 0.15);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .action-btn:hover {
          color: var(--primary-color);
          border-color: var(--primary-color);
          background: rgba(37, 99, 235, 0.1);
        }

        .action-btn.delete:hover {
          color: #ef4444;
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }

        .address-card-body {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .recipient-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px dashed var(--border-color);
          padding-bottom: 0.5rem;
        }

        .recipient-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .recipient-mobile {
          font-size: 0.85rem;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .full-address {
          margin: 0;
          font-size: 0.95rem;
          line-height: 1.6;
          font-weight: 500;
          color: var(--text-primary);
        }

        .city-pin-row {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          color: var(--text-secondary);
          margin-top: 0.25rem;
        }

        .pin-marker {
          color: var(--primary-color);
          opacity: 0.85;
        }

        .city-pin-text {
          font-size: 0.85rem;
          font-weight: 600;
        }

        /* Empty State */
        .empty-state-card {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 4rem 2rem;
          gap: 1rem;
        }

        .empty-icon-wrapper {
          color: var(--text-muted);
          background: rgba(148, 163, 184, 0.08);
          padding: 1.25rem;
          border-radius: 50%;
          border: 1px solid rgba(148, 163, 184, 0.15);
          margin-bottom: 0.5rem;
        }

        .empty-state-card h4 {
          font-size: 1.25rem;
          margin: 0;
          font-weight: 700;
        }

        .empty-state-card p {
          color: var(--text-secondary);
          max-width: 380px;
          margin: 0;
          font-size: 0.92rem;
          line-height: 1.5;
        }

        .btn-add-address-empty {
          margin-top: 0.75rem;
          padding: 0.65rem 1.5rem;
          font-weight: 600;
          font-size: 0.88rem;
          background: var(--bg-secondary);
          color: var(--primary-color);
          border: 1.5px solid var(--primary-color);
          border-radius: var(--radius-md);
          cursor: pointer;
        }

        /* Form Design */
        .address-form-panel {
          max-width: 680px;
          margin: 0 auto;
          padding: 2.25rem;
          border-radius: var(--radius-2xl);
          box-shadow: var(--shadow-xl);
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }

        .form-header h3 {
          font-size: 1.4rem;
          font-weight: 700;
          margin: 0 0 0.35rem 0;
        }

        .form-header p {
          color: var(--text-secondary);
          margin: 0;
          font-size: 0.9rem;
        }

        .form-fields-group {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }

        .group-title {
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--primary-color);
          letter-spacing: 0.05em;
          border-bottom: 1.5px solid rgba(37, 99, 235, 0.15);
          padding-bottom: 0.3rem;
          margin: 0;
        }

        .label-row-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }

        .form-label {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-secondary);
        }

        .form-input, .form-select {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-lg);
          border: 1.5px solid var(--border-color);
          background: rgba(15, 23, 42, 0.2);
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 0.9rem;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .form-input:focus, .form-select:focus {
          outline: none;
          border-color: var(--primary-color);
          background: rgba(15, 23, 42, 0.35);
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.15);
        }

        .form-input.error-state, .form-select.error-state {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.05);
        }

        .error-message {
          color: #ef4444;
          font-size: 0.78rem;
          font-weight: 600;
        }

        .req {
          color: #ef4444;
        }

        .opt {
          color: var(--text-muted);
          font-size: 0.75rem;
        }

        .form-grid-three {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }

        .form-grid-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }

        .form-select {
          appearance: none;
          padding-right: 2.25rem;
          background: rgba(15, 23, 42, 0.2) url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>') no-repeat right 0.85rem center;
          background-size: 16px;
        }

        .type-selectors-wrapper {
          display: flex;
          gap: 0.5rem;
        }

        .type-selector-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.7rem;
          background: rgba(148, 163, 184, 0.05);
          border: 1.5px solid var(--border-color);
          border-radius: var(--radius-lg);
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.82rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .type-selector-btn:hover {
          border-color: var(--primary-color);
          color: var(--primary-color);
        }

        .type-selector-btn.active {
          background: rgba(37, 99, 235, 0.08);
          border-color: var(--primary-color);
          color: var(--primary-color);
        }

        .btn-use-location {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: rgba(37, 99, 235, 0.08);
          border: 1px solid rgba(37, 99, 235, 0.2);
          color: var(--primary-color);
          font-size: 0.78rem;
          font-weight: 700;
          padding: 0.35rem 0.75rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-use-location:hover:not(:disabled) {
          background: rgba(37, 99, 235, 0.15);
        }

        .btn-use-location.detecting {
          opacity: 0.75;
          cursor: wait;
        }

        .spin {
          animation: spin-kf 1s linear infinite;
        }

        .form-textarea {
          resize: none;
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

        .form-actions-footer {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1.25rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border-color);
        }

        .btn-cancel {
          padding: 0.75rem 1.5rem;
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 0.9rem;
          background: transparent;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-cancel:hover {
          background: rgba(148, 163, 184, 0.08);
          color: var(--text-primary);
        }

        .btn-submit {
          padding: 0.75rem 1.75rem;
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 0.9rem;
          color: #ffffff;
          background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
          transition: all 0.2s ease;
        }

        .btn-submit:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35);
        }

        @keyframes spin-kf {
          to { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Mobile adaptation */
        @media (max-width: 640px) {
          .btn-add-address {
            width: 100%;
            justify-content: center;
          }

          .form-grid-three, .form-grid-row {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .type-selectors-wrapper {
            flex-direction: column;
            gap: 0.5rem;
          }

          .form-actions-footer {
            flex-direction: column-reverse;
            gap: 0.75rem;
          }

          .btn-cancel, .btn-submit {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
