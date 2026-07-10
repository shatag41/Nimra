'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocation } from '@/frontend/customer/contexts/LocationContext';
import { useAuth } from '@/frontend/customer/hooks/useAuth';
import { WORLD_DATA } from './Checkout';
import { migrateLegacyLocalAddresses, normalizeSavedAddresses, persistUserSavedAddresses } from '@/frontend/customer/utils/userAddresses';

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
  const { user, updateUserSession } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [addressPendingDelete, setAddressPendingDelete] = useState<Address | null>(null);
  
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
    if (!user) {
      setAddresses([]);
      return;
    }

    let cancelled = false;
    const loadAddresses = async () => {
      const migrated = await migrateLegacyLocalAddresses(user);
      if (cancelled) return;
      setAddresses(migrated.addresses as Address[]);
      if (migrated.migrated) {
        updateUserSession({ ...user, SavedAddresses: JSON.stringify(migrated.addresses) });
      }
    };
    void loadAddresses();

    return () => {
      cancelled = true;
    };
  }, [updateUserSession, user]);
  
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

  const saveAddressList = async (nextAddresses: Address[]) => {
    if (!user) return false;
    setSaving(true);
    try {
      const { result, addresses: normalized } = await persistUserSavedAddresses(user, nextAddresses);
      if (!result.success) {
        setErrors({ form: result.message || 'Failed to save address.' });
        return false;
      }
      setAddresses(normalized as Address[]);
      updateUserSession({ ...user, SavedAddresses: JSON.stringify(normalized) });
      return true;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
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

    updatedList = normalizeSavedAddresses(updatedList) as Address[];
    const saved = await saveAddressList(updatedList);
    if (!saved) return;
    setIsAdding(false);
    setEditId(null);

    const redirectPath = searchParams ? searchParams.get('redirect') : null;
    if (redirectPath) {
      router.push(redirectPath);
    }
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

  const handleDelete = (address: Address) => {
    setAddressPendingDelete(address);
  };

  const confirmDelete = async () => {
    if (!addressPendingDelete) return;
    const deleted = await saveAddressList(addresses.filter(a => a.id !== addressPendingDelete.id) as Address[]);
    if (deleted) setAddressPendingDelete(null);
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

  const handleSetDefault = async (address: Address) => {
    if (address.isDefault || saving) return;
    await saveAddressList(addresses.map(item => ({ ...item, isDefault: item.id === address.id })));
  };

  const handleDeliverHere = async (address: Address) => {
    if (!address.isDefault) {
      const saved = await saveAddressList(addresses.map(item => ({ ...item, isDefault: item.id === address.id })));
      if (!saved) return;
    }
    router.push('/checkout');
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
      <section className="addresses-metrics" aria-label="Addresses summary">
        <div className="address-metric-card">
          <span className="metric-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></span>
          <div className="metric-copy"><strong>{addresses.length}</strong><span>Saved Addresses</span><small>Manage all delivery locations</small></div>
        </div>
        <div className="address-metric-card">
          <span className="metric-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m12 2 3.1 6.3 6.9 1-5 4.8 1.2 6.9-6.2-3.3L5.8 21 7 14.1 2 9.3l6.9-1L12 2Z"/></svg></span>
          <div className="metric-copy"><strong>{addresses.find(a => a.isDefault)?.city || 'None'}</strong><span>Default Location</span><small>Primary Delivery Zone</small></div>
        </div>
        <div className="address-metric-card">
          <span className="metric-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z"/></svg></span>
          <div className="metric-copy"><strong>{addresses.filter(a => String(a.type).toLowerCase() === 'home').length}</strong><span>Home</span><small>Saved Home Address</small></div>
        </div>
        <div className="address-metric-card">
          <span className="metric-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/></svg></span>
          <div className="metric-copy"><strong>{addresses.filter(a => String(a.type).toLowerCase() === 'work').length}</strong><span>Work</span><small>Saved Work Address</small></div>
        </div>
      </section>

      {!isAdding && (
        <div className="add-address-row">
          <button onClick={handleAddNew} className="btn-add-address" aria-label="Add a new delivery address">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5v14"/>
            </svg>
            Add New Address
            <span className="add-address-arrow" aria-hidden="true">&rarr;</span>
          </button>
        </div>
      )}

      {isAdding ? (
        <div className="address-form-wrapper">
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
              <button type="submit" className="btn-submit" disabled={saving}>
                <span>{saving ? 'Saving...' : 'Save Address'}</span>
              </button>
            </div>
          </form>
        </div>
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
              <h4>You don&apos;t have any addresses saved</h4>
              <p>Please add an address.</p>
              <button onClick={handleAddNew} className="btn-add-address-empty">
                Add Address
              </button>
            </div>
          ) : (
            addresses.map(address => (
              <article key={address.id} className={`address-card ${address.isDefault ? 'is-default' : ''}`}>
              <div className="address-card-header">
                <div className="address-meta">
                  <span className={`address-type-icon ${address.type.toLowerCase()}`} aria-hidden="true">
                    {address.type === 'Home' && <svg viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
                    {address.type === 'Work' && <svg viewBox="0 0 24 24"><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/></svg>}
                    {address.type === 'Other' && <svg viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>}
                  </span>
                  <div><span className="address-type-label">{address.type}</span>{address.isDefault && <span className="default-badge">★ Default Address</span>}</div>
                </div>
                  <div className="address-actions">
                    <button onClick={() => handleEdit(address)} className="action-btn edit" title="Edit Address" aria-label="Edit Address">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(address)} className="action-btn delete" title="Delete Address" aria-label="Delete Address">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="address-card-body">
                  <h3 className="recipient-name">{address.name || user?.Name || 'Delivery Recipient'}</h3>
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
                    <span className="mini-pin"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg></span>
                    <span className="city-pin-text">{address.city}, {address.state || address.country} <b>•</b> {address.pincode}</span>
                  </div>
                </div>
                <div className="delivery-status">{address.isDefault ? 'Default Delivery Address' : 'Saved Delivery Address'}</div>
                <footer className="address-card-footer">
                  <button type="button" className="deliver-button" disabled={saving} onClick={() => void handleDeliverHere(address)}><span className="radio-mark" aria-hidden="true"/>Deliver Here</button>
                  <button type="button" className={`default-button ${address.isDefault ? 'active' : ''}`} disabled={address.isDefault || saving} onClick={() => void handleSetDefault(address)}>{address.isDefault ? '✓ Default Address' : 'Set as Default'}</button>
                </footer>
              </article>
            ))
          )}
        </div>
      )}

      {addressPendingDelete && (
        <div className="delete-modal-overlay" role="presentation" onClick={() => !saving && setAddressPendingDelete(null)}>
          <div className="delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-address-title" onClick={(event) => event.stopPropagation()}>
            <div className="delete-modal-icon" aria-hidden="true">!</div>
            <h3 id="delete-address-title">Delete {addressPendingDelete.type} address?</h3>
            <p>This saved address will be permanently removed from your account.</p>
            <div className="delete-modal-actions">
              <button type="button" className="btn-cancel-delete" disabled={saving} onClick={() => setAddressPendingDelete(null)}>No, keep it</button>
              <button type="button" className="btn-confirm-delete" disabled={saving} onClick={() => void confirmDelete()}>{saving ? 'Deleting...' : 'Yes, delete'}</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .addresses-container {
          max-width: 100%;
          width: 100%;
          margin: -3.75rem auto 0;
          justify-self: center;
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
 
        .add-address-row { display: flex; justify-content: flex-end; margin: .45rem 0 .7rem; }
 
        .btn-add-address {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          padding: .52rem .85rem;
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 0.85rem;
          color: #ffffff;
          background: linear-gradient(135deg, rgba(37,99,235,.96), rgba(29,78,216,.9));
          border: 1px solid rgba(255,255,255,.28);
          border-radius: 14px;
          cursor: pointer;
          box-shadow: 0 10px 24px rgba(37,99,235,.2), inset 0 1px 0 rgba(255,255,255,.22);
          backdrop-filter: blur(12px);
          transition: all 250ms ease;
        }
 
        .btn-add-address:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 30px rgba(37,99,235,.3), 0 0 18px rgba(96,165,250,.16);
        }

        .add-address-arrow { transition: transform 250ms ease; }
        .btn-add-address:hover .add-address-arrow { transform: translateX(4px); }

        .addresses-metrics {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: .875rem;
          margin: 0;
        }

        .address-metric-card {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: .7rem;
          padding: .72rem .85rem;
          border: 1px solid rgba(148,163,184,.16);
          border-radius: 22px;
          background: linear-gradient(145deg, rgba(255,255,255,.08), rgba(37,99,235,.035)), var(--bg-secondary);
          box-shadow: 0 10px 30px rgba(15,23,42,.055);
          transition: transform 250ms ease, box-shadow 250ms ease, border-color 250ms ease;
        }

        .address-metric-card:hover { transform: translateY(-3px); border-color: rgba(37,99,235,.25); box-shadow: 0 16px 38px rgba(15,23,42,.08); }
        .metric-icon { flex: 0 0 40px; width: 40px; height: 40px; display: grid; place-items: center; border-radius: 12px; color: var(--primary-color); background: #eef5ff; transition: transform 250ms ease; }
        .metric-icon svg { width: 19px; height: 19px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
        .address-metric-card:hover .metric-icon { transform: rotate(-4deg) scale(1.04); }
        .metric-copy { min-width: 0; display: grid; grid-template-columns: auto 1fr; align-items: baseline; column-gap: .5rem; }
        .metric-copy strong { min-width: 0; overflow: hidden; text-overflow: ellipsis; color: var(--primary-color); font-size: 1.3rem; line-height: 1; letter-spacing: -.03em; }
        .metric-copy span { color: var(--text-primary); font-size: .82rem; font-weight: 750; white-space: nowrap; }
        .metric-copy small { grid-column: 1 / -1; margin-top: .2rem; color: var(--text-secondary); font-size: .7rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
 
        .addresses-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 1.25rem;
        }
 
        /* Glassmorphic Cards */
        .glass {
          background: var(--glass-bg);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
        }
 
        .address-card {
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          min-width: 0;
          padding: .75rem;
          border-radius: 22px;
          border: 1px solid rgba(148,163,184,.17);
          box-shadow: 0 12px 32px rgba(15,23,42,.06);
          background: linear-gradient(155deg, rgba(255,255,255,.07), transparent 42%), var(--bg-secondary);
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
          border-color: rgba(37, 99, 235, 0.25);
          box-shadow: 0 20px 44px rgba(15,23,42,.1);
        }
 
        .address-card:hover::before {
          background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
        }
 
        .address-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: .5rem;
          border-bottom: 1px solid rgba(148,163,184,.14);
        }

        .address-meta { display: flex; align-items: center; gap: .55rem; min-width: 0; }
        .address-meta > div { display: flex; flex-wrap: wrap; align-items: center; gap: .4rem; }
        .address-type-icon { width: 34px; height: 34px; flex: 0 0 34px; display: grid; place-items: center; border-radius: 10px; color: var(--primary-color); background: #eef5ff; transition: transform 250ms ease; }
        .address-type-icon.work { color: #7c3aed; background: #f3efff; }
        .address-type-icon.other { color: #0891b2; background: #ecfeff; }
        .address-type-icon svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .address-card:hover .address-type-icon { transform: rotate(-4deg); }
        .address-type-label { font-size: .88rem; font-weight: 750; color: var(--text-primary); }
        .default-badge { padding: .18rem .45rem; border: 1px solid rgba(37,99,235,.14); border-radius: 999px; color: var(--primary-color); background: rgba(37,99,235,.09); font-size: .6rem; font-weight: 750; transition: transform 250ms ease; }
        .address-card:hover .default-badge { transform: scale(1.025); }
 
        .badge-row {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
 
        .address-actions {
          display: flex;
          gap: .3rem;
        }
 
        .action-btn {
          background: rgba(239,246,255,.72);
          border: 1px solid rgba(96,165,250,.18);
          border-radius: 10px;
          color: #2563eb;
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 5px 14px rgba(15,23,42,.05);
          backdrop-filter: blur(10px);
          transition: all 250ms ease;
        }

        .action-btn svg { width: 15px; height: 15px; transition: transform 250ms ease; }
 
        .action-btn:hover {
          color: var(--primary-color);
          border-color: var(--primary-color);
          background: rgba(37, 99, 235, 0.08);
          transform: scale(1.06);
        }
        .action-btn:hover svg { transform: rotate(-6deg); }

        .action-btn.delete { color: #dc2626; background: rgba(254,242,242,.78); border-color: rgba(248,113,113,.18); }
 
        .action-btn.delete:hover {
          color: #ef4444;
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.08);
        }
 
        .address-card-body {
          display: flex;
          flex-direction: column;
          gap: .35rem;
          padding: .5rem 0;
          flex: 1;
        }
 
        .recipient-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px dashed var(--border-color);
          padding-bottom: 0.35rem;
        }
 
        .recipient-name {
          margin: 0;
          font-size: .95rem;
          font-weight: 600;
          color: var(--text-primary);
        }
 
        .recipient-mobile {
          font-size: 0.8rem;
          color: var(--text-secondary);
          font-weight: 600;
        }
 
        .full-address {
          margin: 0;
          font-size: .88rem;
          line-height: 1.4;
          font-weight: 500;
          color: var(--text-primary);
        }
 
        .city-pin-row {
          display: flex;
          align-items: center;
          gap: .4rem;
          color: var(--text-secondary);
          margin-top: 0;
        }
 
        .pin-marker {
          color: var(--primary-color);
          opacity: 0.8;
        }
 
        .city-pin-text {
          font-size: .74rem;
          font-weight: 600;
        }

        .city-pin-text b { color: var(--text-muted); margin: 0 .12rem; }
        .mini-pin { width: 24px; height: 24px; flex: 0 0 24px; display: grid; place-items: center; border-radius: 8px; color: var(--primary-color); background: #eef5ff; }
        .mini-pin svg { width: 12px; height: 12px; }
        .delivery-status { padding: .4rem 0; border-top: 1px solid rgba(148,163,184,.14); color: var(--text-secondary); font-size: .7rem; font-weight: 650; }
        .address-card.is-default .delivery-status { color: var(--primary-color); }
        .address-card-footer { display: grid; grid-template-columns: 1fr 1fr; gap: .45rem; padding-top: .5rem; border-top: 1px solid rgba(148,163,184,.14); }
        .address-card-footer button { height: 36px; padding-block: .3rem; border-radius: 10px; font: inherit; font-size: .72rem; font-weight: 750; cursor: pointer; transition: all 250ms ease; }
        .deliver-button { display: inline-flex; align-items: center; justify-content: center; gap: .45rem; border: 0; color: white; background: linear-gradient(135deg, var(--primary-color), var(--primary-hover)); box-shadow: 0 7px 17px rgba(37,99,235,.18); }
        .radio-mark { width: 11px; height: 11px; border: 2px solid currentColor; border-radius: 50%; }
        .default-button { border: 1px solid rgba(37,99,235,.22); color: var(--primary-color); background: rgba(37,99,235,.055); }
        .default-button.active { color: #15803d; border-color: rgba(34,197,94,.2); background: rgba(34,197,94,.07); cursor: default; }
        .address-card-footer button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 9px 20px rgba(37,99,235,.16); }
        .address-card-footer button:disabled { opacity: .8; }
        .btn-add-address:focus-visible, .action-btn:focus-visible, .address-card-footer button:focus-visible { outline: 3px solid rgba(59,130,246,.28); outline-offset: 2px; }
 
        /* Empty State */
        .empty-state-card {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 3rem 1.5rem;
          gap: 0.85rem;
        }
 
        .empty-icon-wrapper {
          color: var(--text-muted);
          background: rgba(148, 163, 184, 0.06);
          padding: 1rem;
          border-radius: 50%;
          border: 1px solid rgba(148, 163, 184, 0.12);
          margin-bottom: 0.25rem;
        }
 
        .empty-state-card h4 {
          font-size: 1.15rem;
          margin: 0;
          font-weight: 700;
        }
 
        .empty-state-card p {
          color: var(--text-secondary);
          max-width: 340px;
          margin: 0;
          font-size: 0.88rem;
          line-height: 1.45;
        }
 
        .btn-add-address-empty {
          margin-top: 0.5rem;
          padding: 0.5rem 1.25rem;
          font-weight: 600;
          font-size: 0.85rem;
          background: var(--bg-secondary);
          color: var(--primary-color);
          border: 1.5px solid var(--primary-color);
          border-radius: var(--radius-md);
          cursor: pointer;
        }
 
        .address-form-wrapper {
          display: flex;
          justify-content: center;
          width: 100%;
          margin: 0 auto;
        }

        /* Form Design */
        .address-form-panel {
          width: min(800px, 100%);
          max-width: 800px;
          box-sizing: border-box;
          margin: 0 auto;
          padding: 1.5rem;
          border-radius: 16px;
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 12px -1px rgba(0, 0, 0, 0.03);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          border: 1.5px solid rgba(150, 150, 150, 0.08);
          background: var(--bg-secondary);
        }
 
        .form-header h3 {
          font-size: 1.2rem;
          font-weight: 700;
          margin: 0 0 0.2rem 0;
        }
 
        .form-header p {
          color: var(--text-secondary);
          margin: 0;
          font-size: 0.85rem;
        }
 
        .form-fields-group {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.85rem 1.1rem;
        }
 
        .group-title {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--primary-color);
          letter-spacing: 0.05em;
          border-bottom: 1.5px solid rgba(37, 99, 235, 0.15);
          padding-bottom: 0.25rem;
          margin: 0;
        }
 
        .label-row-header {
          grid-column: 1 / -1;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
 
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          flex: 1;
        }
 
        .form-label {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-secondary);
        }
 
        .form-input, .form-select {
          width: 100%;
          padding: 0.6rem 0.85rem;
          border-radius: var(--radius-md);
          border: 1.5px solid var(--border-color);
          background-color: rgba(15, 23, 42, 0.2);
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 0.88rem;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
 
        .form-input:focus, .form-select:focus {
          outline: none;
          border-color: var(--primary-color);
          background-color: rgba(15, 23, 42, 0.35);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }
 
        .form-input.error-state, .form-select.error-state {
          border-color: #ef4444;
          background-color: rgba(239, 68, 68, 0.05);
        }
 
        .error-message {
          color: #ef4444;
          font-size: 0.75rem;
          font-weight: 600;
        }
 
        .req {
          color: #ef4444;
        }
 
        .opt {
          color: var(--text-muted);
          font-size: 0.72rem;
        }
 
        .form-grid-three {
          display: contents;
        }
 
        .form-grid-row {
          display: contents;
        }
 
        .form-select {
          -webkit-appearance: none !important;
          -moz-appearance: none !important;
          appearance: none !important;
          padding-right: 2rem;
          background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5NGEzYjgiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cG9seWxpbmUgcG9pbnRzPSI2IDkgMTIgMTUgMTggOSI+PC9wb2x5bGluZT48L3N2Zz4=') !important;
          background-repeat: no-repeat !important;
          background-position: right 0.75rem center !important;
          background-size: 14px !important;
          background-color: rgba(15, 23, 42, 0.2) !important;
        }

        .form-select option {
          background-color: var(--bg-secondary) !important;
          color: var(--text-primary) !important;
        }
 
        .type-selectors-wrapper {
          display: flex;
          gap: 0.4rem;
        }
 
        .type-selector-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.55rem;
          background: rgba(148, 163, 184, 0.04);
          border: 1.5px solid var(--border-color);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.8rem;
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
          gap: 0.3rem;
          background: rgba(37, 99, 235, 0.08);
          border: 1px solid rgba(37, 99, 235, 0.2);
          color: var(--primary-color);
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.3rem 0.65rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.2s ease;
        }
 
        .btn-use-location:hover:not(:disabled) {
          background: rgba(37, 99, 235, 0.12);
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
          gap: 0.5rem;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-top: 0.35rem;
          user-select: none;
          grid-column: 1 / -1;
        }
 
        .delete-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: grid;
          place-items: center;
          padding: 1rem;
          background: rgba(2, 6, 23, 0.72);
          backdrop-filter: blur(6px);
        }
 
        .delete-modal {
          width: min(380px, 100%);
          box-sizing: border-box;
          padding: 1.5rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          background: var(--bg-secondary);
          box-shadow: var(--shadow-xl);
          text-align: center;
        }
 
        .delete-modal-icon {
          display: grid;
          place-items: center;
          width: 40px;
          height: 40px;
          margin: 0 auto 0.85rem;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          font-size: 1.3rem;
          font-weight: 800;
        }
 
        .delete-modal h3 { margin: 0; font-size: 1.15rem; }
        .delete-modal p { margin: 0.5rem 0 1.25rem; color: var(--text-secondary); line-height: 1.45; font-size: 0.88rem; }
        .delete-modal-actions { display: flex; justify-content: center; gap: 0.65rem; }
        .btn-cancel-delete, .btn-confirm-delete { padding: 0.6rem 0.85rem; border-radius: var(--radius-md); font-weight: 700; cursor: pointer; font-size: 0.85rem; }
        .btn-cancel-delete { border: 1px solid var(--border-color); background: transparent; color: var(--text-primary); }
        .btn-confirm-delete { border: 1px solid #ef4444; background: #ef4444; color: white; }
        .btn-cancel-delete:disabled, .btn-confirm-delete:disabled { opacity: 0.65; cursor: wait; }
 
        .save-future-checkbox-label input {
          width: 15px;
          height: 15px;
          border-radius: var(--radius-sm);
          border: 1.5px solid var(--border-color);
          cursor: pointer;
        }
 
        .form-actions-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.85rem;
          margin-top: 0.85rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }
 
        .btn-cancel {
          padding: 0.6rem 1.25rem;
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 0.88rem;
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
          padding: 0.6rem 1.5rem;
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 0.88rem;
          color: #ffffff;
          background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
          transition: all 0.2s ease;
        }
 
        .btn-submit:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
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

        @media (max-width: 1024px) {
          .addresses-metrics, .addresses-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
 
        /* Mobile adaptation */
        @media (max-width: 640px) {
          .addresses-container { margin-top: -2.5rem; }
          .addresses-metrics, .addresses-grid { grid-template-columns: 1fr; }
          .addresses-metrics { gap: .7rem; }
          .address-metric-card { padding: .72rem .85rem; }
          .address-card { padding: .75rem; }
          .address-card-footer { grid-template-columns: 1fr; }
          .address-actions { gap: .3rem; }
          .action-btn { width: 34px; height: 34px; }
          .btn-add-address {
            width: 100%;
            justify-content: center;
          }
 
          .form-fields-group {
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
