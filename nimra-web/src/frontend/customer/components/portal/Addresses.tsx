'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocation } from '@/frontend/customer/contexts/LocationContext';
import { useAuth } from '@/frontend/customer/hooks/useAuth';
import { WORLD_DATA } from './Checkout';
import { getUserSavedAddresses, migrateLegacyLocalAddresses, normalizeSavedAddresses, persistUserSavedAddresses } from '@/frontend/customer/utils/userAddresses';
import { CompactKpiCard } from '../CompactKpiCard';

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

type AddressFormData = Omit<Address, 'id' | 'fullAddress'>;
type Coordinates = { latitude: number | null; longitude: number | null };

export function Addresses() {
  const { user, updateUserSession } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [addresses, setAddresses] = useState<Address[]>(() => getUserSavedAddresses(user) as Address[]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [addressPendingDelete, setAddressPendingDelete] = useState<Address | null>(null);
  const [duplicateAddress, setDuplicateAddress] = useState<Address | null>(null);
  const [duplicateSource, setDuplicateSource] = useState<'save' | 'gps'>('save');
  const [pendingGpsFormData, setPendingGpsFormData] = useState<AddressFormData | null>(null);
  const [rememberDuplicateChoice, setRememberDuplicateChoice] = useState(false);
  const [highlightedAddressId, setHighlightedAddressId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<AddressFormData>({
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

  const hasBlockingModal = Boolean(duplicateAddress || addressPendingDelete);

  useEffect(() => {
    if (!hasBlockingModal || typeof document === 'undefined') return;

    const scrollY = window.scrollY;
    const body = document.body;
    const root = document.documentElement;
    const previousBodyStyles = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      paddingRight: body.style.paddingRight,
    };
    const previousRootOverflow = root.style.overflow;
    const scrollbarWidth = window.innerWidth - root.clientWidth;

    root.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBodyStyles.overflow;
      body.style.position = previousBodyStyles.position;
      body.style.top = previousBodyStyles.top;
      body.style.width = previousBodyStyles.width;
      body.style.paddingRight = previousBodyStyles.paddingRight;
      window.scrollTo(0, scrollY);
    };
  }, [hasBlockingModal]);

  useEffect(() => {
    if (!user) {
      setAddresses([]);
      setAddressesLoading(false);
      return;
    }

    let cancelled = false;
    const loadAddresses = async () => {
      const migrated = await migrateLegacyLocalAddresses(user);
      if (cancelled) return;
      setAddresses(migrated.addresses as Address[]);
      setAddressesLoading(false);
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

    let detectedLocation: Coordinates & { address?: string; city?: string; state?: string; pincode?: string } = {
      latitude: null,
      longitude: null,
      address: locationAddress,
      city: locationCity,
      state: locationState,
      pincode: locationPincode,
    };
    try {
      const storedLocation = window.localStorage.getItem('nimra_location');
      if (storedLocation) detectedLocation = { ...detectedLocation, ...JSON.parse(storedLocation) };
    } catch {
      // Continue with the location context values when the local snapshot is unavailable.
    }

    let matchedState = formData.state || detectedLocation.state || '';
    let matchedCity = formData.city || detectedLocation.city || '';

    const currentCountryData = WORLD_DATA[formData.country] || {};
    const stateKeys = Object.keys(currentCountryData);

    if (detectedLocation.state && !formData.state) {
      const foundState = stateKeys.find(s => s.toLowerCase().trim() === detectedLocation.state?.toLowerCase().trim());
      if (foundState) matchedState = foundState;
    }

    if (matchedState && !formData.city && detectedLocation.city) {
      const cities = currentCountryData[matchedState] || [];
      const searchTarget = `${detectedLocation.city} ${detectedLocation.address || ''}`.toLowerCase();
      const foundCity = cities.find(c => searchTarget.includes(c.toLowerCase()));
      if (foundCity) {
        matchedCity = foundCity;
      }
    }

    const gpsFormData: AddressFormData = {
      ...formData,
      flatNo: formData.flatNo || (detectedLocation.address ? detectedLocation.address.split(',')[0].trim() : ''),
      locality: formData.locality || (detectedLocation.address ? detectedLocation.address.split(',').slice(1, 3).join(', ').trim() : ''),
      city: matchedCity,
      state: matchedState,
      pincode: formData.pincode || detectedLocation.pincode || ''
    };

    const duplicate = findDuplicateAddress(gpsFormData, detectedLocation);
    if (duplicate) {
      if (window.localStorage.getItem('nimra-reuse-duplicate-address') === 'true') {
        reuseExistingAddress(duplicate);
        return;
      }
      setRememberDuplicateChoice(false);
      setPendingGpsFormData(gpsFormData);
      setDuplicateSource('gps');
      setDuplicateAddress(duplicate);
      return;
    }

    setFormData(gpsFormData);
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
    const previousAddresses = addresses;
    const optimisticAddresses = normalizeSavedAddresses(nextAddresses) as Address[];
    setAddresses(optimisticAddresses);
    updateUserSession({ ...user, SavedAddresses: JSON.stringify(optimisticAddresses) });
    setSaving(true);
    try {
      const { result, addresses: normalized } = await persistUserSavedAddresses(user, optimisticAddresses);
      if (!result.success) {
        setAddresses(previousAddresses);
        updateUserSession({ ...user, SavedAddresses: JSON.stringify(previousAddresses) });
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

  const normalizeAddressPart = (value?: string) => String(value || '')
    .toLowerCase()
    .replace(/[,.]/g, ' ')
    .replace(/\b(rd)\b/g, 'road')
    .replace(/\b(st)\b/g, 'street')
    .replace(/\b(apt)\b/g, 'apartment')
    .replace(/\b(ave)\b/g, 'avenue')
    .replace(/\b(blvd)\b/g, 'boulevard')
    .replace(/\b(ln)\b/g, 'lane')
    .replace(/\b(hwy)\b/g, 'highway')
    .replace(/\b(bldg)\b/g, 'building')
    .replace(/\s+/g, ' ')
    .trim();

  const coordinatesAreNearby = (address: Address, coordinates?: Coordinates) => {
    if (coordinates?.latitude == null || coordinates.longitude == null) return false;
    const storedAddress = address as Address & { latitude?: number; longitude?: number };
    if (!Number.isFinite(storedAddress.latitude) || !Number.isFinite(storedAddress.longitude)) return false;

    const earthRadiusMetres = 6371000;
    const toRadians = (degrees: number) => degrees * Math.PI / 180;
    const latitudeDelta = toRadians(coordinates.latitude - Number(storedAddress.latitude));
    const longitudeDelta = toRadians(coordinates.longitude - Number(storedAddress.longitude));
    const latitudeA = toRadians(Number(storedAddress.latitude));
    const latitudeB = toRadians(coordinates.latitude);
    const haversine = Math.sin(latitudeDelta / 2) ** 2
      + Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(longitudeDelta / 2) ** 2;
    const distance = 2 * earthRadiusMetres * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
    return distance <= 15;
  };

  const findDuplicateAddress = (candidate: AddressFormData = formData, coordinates?: Coordinates) => addresses.find(address => (
    coordinatesAreNearby(address, coordinates) || (
      normalizeAddressPart(address.flatNo) === normalizeAddressPart(candidate.flatNo) &&
      normalizeAddressPart(address.buildingName) === normalizeAddressPart(candidate.buildingName) &&
      normalizeAddressPart(address.locality) === normalizeAddressPart(candidate.locality) &&
      normalizeAddressPart(address.landmark) === normalizeAddressPart(candidate.landmark) &&
      normalizeAddressPart(address.city) === normalizeAddressPart(candidate.city) &&
      normalizeAddressPart(address.state) === normalizeAddressPart(candidate.state) &&
      normalizeAddressPart(address.pincode) === normalizeAddressPart(candidate.pincode)
    )
  ));

  const persistCurrentAddress = async () => {
    const compositeAddress = [formData.flatNo, formData.buildingName, formData.locality, formData.landmark]
      .filter(Boolean).join(', ');

    const newSavedAddr: Address = {
      ...formData,
      fullAddress: compositeAddress,
      id: editId || Date.now().toString()
    };

    let updatedList: Address[];
    if (formData.isDefault) {
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
    setDuplicateAddress(null);

    const redirectPath = searchParams ? searchParams.get('redirect') : null;
    if (redirectPath) {
      setIsRedirecting(true);
      router.replace(redirectPath);
      return;
    }
    setIsAdding(false);
    setEditId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (!editId) {
      const duplicate = findDuplicateAddress(formData);
      if (duplicate) {
        if (typeof window !== 'undefined' && window.localStorage.getItem('nimra-reuse-duplicate-address') === 'true') {
          reuseExistingAddress(duplicate);
          return;
        }
        setRememberDuplicateChoice(false);
        setPendingGpsFormData(null);
        setDuplicateSource('save');
        setDuplicateAddress(duplicate);
        return;
      }
    }

    await persistCurrentAddress();
  };

  const reuseExistingAddress = (address: Address) => {
    setDuplicateAddress(null);
    setPendingGpsFormData(null);
    setIsAdding(false);
    setEditId(null);

    const redirectPath = searchParams ? searchParams.get('redirect') : null;
    if (redirectPath) {
      const separator = redirectPath.includes('?') ? '&' : '?';
      setIsRedirecting(true);
      router.replace(`${redirectPath}${separator}addressId=${encodeURIComponent(address.id)}`);
      return;
    }

    setHighlightedAddressId(address.id);
    window.setTimeout(() => setHighlightedAddressId(null), 2600);
    window.requestAnimationFrame(() => document.getElementById(`saved-address-${address.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  };

  const handleUseDuplicate = () => {
    if (!duplicateAddress) return;
    if (rememberDuplicateChoice && typeof window !== 'undefined') {
      window.localStorage.setItem('nimra-reuse-duplicate-address', 'true');
    }
    reuseExistingAddress(duplicateAddress);
  };

  const handleUseGpsAnyway = () => {
    if (!pendingGpsFormData) return;
    setFormData(pendingGpsFormData);
    setPendingGpsFormData(null);
    setDuplicateAddress(null);
  };

  const handleCancelDuplicate = () => {
    if (saving) return;
    setPendingGpsFormData(null);
    setDuplicateAddress(null);
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

  if (isRedirecting) {
    return (
      <div className="address-route-skeleton" aria-live="polite" aria-busy="true">
        <div className="address-route-skeleton-line wide" />
        <div className="address-route-skeleton-line" />
        <div className="address-route-skeleton-card" />
        <span>Preparing checkout…</span>
        <style jsx>{`
          .address-route-skeleton { min-height: 420px; display: grid; align-content: start; gap: .8rem; padding: 1rem; color: var(--text-secondary); }
          .address-route-skeleton-line, .address-route-skeleton-card { border-radius: 14px; background: linear-gradient(90deg, var(--bg-secondary), color-mix(in srgb, var(--primary-color) 10%, var(--bg-secondary)), var(--bg-secondary)); background-size: 200% 100%; animation: address-shimmer 1.2s infinite linear; }
          .address-route-skeleton-line { width: 48%; height: 18px; } .address-route-skeleton-line.wide { width: 72%; height: 28px; }
          .address-route-skeleton-card { height: 230px; margin-top: .4rem; }
          .address-route-skeleton span { font-size: .82rem; }
          @keyframes address-shimmer { to { background-position: -200% 0; } }
        `}</style>
      </div>
    );
  }

  if (addressesLoading) {
    return (
      <div className="addresses-loading-grid" aria-label="Loading saved addresses" aria-busy="true">
        {Array.from({ length: 4 }, (_, index) => <div className="addresses-loading-card" key={index} />)}
        <style jsx>{`
          .addresses-loading-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1rem; padding:1rem; }
          .addresses-loading-card { min-height:150px; border-radius:18px; background:linear-gradient(90deg,var(--bg-secondary),color-mix(in srgb,var(--primary-color) 8%,var(--bg-secondary)),var(--bg-secondary)); background-size:200% 100%; animation:addresses-shimmer 1.2s infinite linear; }
          @keyframes addresses-shimmer { to { background-position:-200% 0; } }
          @media(max-width:700px){.addresses-loading-grid{grid-template-columns:1fr}}
        `}</style>
      </div>
    );
  }

  return (
    <div className="addresses-container">
      <section className="addresses-metrics" aria-label="Addresses summary">
        <CompactKpiCard title="Saved Addresses" value={addresses.length} subtitle="Manage all delivery locations" icon={<svg viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>} />
        <CompactKpiCard title="Default Location" value={addresses.find(a => a.isDefault)?.city || 'None'} subtitle="Primary Delivery Zone" icon={<svg viewBox="0 0 24 24"><path d="m12 2 3.1 6.3 6.9 1-5 4.8 1.2 6.9-6.2-3.3L5.8 21 7 14.1 2 9.3l6.9-1L12 2Z"/></svg>} />
        <CompactKpiCard title="Home" value={addresses.filter(a => String(a.type).toLowerCase() === 'home').length} subtitle="Saved Home Address" icon={<svg viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z"/></svg>} />
        <CompactKpiCard title="Work" value={addresses.filter(a => String(a.type).toLowerCase() === 'work').length} subtitle="Saved Work Address" icon={<svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/></svg>} />
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
              <article id={`saved-address-${address.id}`} key={address.id} className={`address-card ${address.isDefault ? 'is-default' : ''} ${highlightedAddressId === address.id ? 'is-highlighted' : ''}`}>
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

      {duplicateAddress && typeof document !== 'undefined' && createPortal((
        <div className="duplicate-modal-overlay" role="presentation" onClick={handleCancelDuplicate}>
          <div className="duplicate-modal" role="dialog" aria-modal="true" aria-labelledby="duplicate-address-title" onClick={(event) => event.stopPropagation()}>
            <div className="duplicate-modal-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <h3 id="duplicate-address-title">Address Already Exists</h3>
            <p className="duplicate-intro">We found an address that matches the one you&apos;re trying to save.</p>
            <span className="duplicate-section-label">Existing Address</span>
            <div className="duplicate-address-preview">
              <div className="duplicate-badges">
                <span className={`duplicate-type ${duplicateAddress.type.toLowerCase()}`}>{duplicateAddress.type}</span>
                {duplicateAddress.isDefault && <span className="duplicate-default">★ Default</span>}
              </div>
              <strong>{duplicateAddress.name || user?.Name || 'Delivery Recipient'}</strong>
              <p>{[duplicateAddress.flatNo, duplicateAddress.buildingName].filter(Boolean).join(', ')}</p>
              <p>{[duplicateAddress.locality, duplicateAddress.landmark, duplicateAddress.city].filter(Boolean).join(', ')}</p>
              <p>{duplicateAddress.state} – {duplicateAddress.pincode}</p>
              {(duplicateAddress.mobile || user?.Mobile) && <span className="duplicate-phone">☎ {duplicateAddress.mobile || user?.Mobile}</span>}
            </div>
            <p className="duplicate-note">This address is already saved as your <strong>{duplicateAddress.type}</strong> address.</p>
            <label className="duplicate-preference">
              <input type="checkbox" checked={rememberDuplicateChoice} onChange={(event) => setRememberDuplicateChoice(event.target.checked)} />
              <span>Don&apos;t ask me again for duplicate addresses</span>
            </label>
            <div className="duplicate-modal-actions">
              <button type="button" className="duplicate-use-button" onClick={handleUseDuplicate}>Continue Using This Address</button>
              <button type="button" className="duplicate-save-button" disabled={saving} onClick={duplicateSource === 'gps' ? handleUseGpsAnyway : () => void persistCurrentAddress()}>{duplicateSource === 'gps' ? 'Use GPS Anyway' : (saving ? 'Saving...' : 'Save Anyway')}</button>
              <button type="button" className="duplicate-cancel-button" disabled={saving} onClick={handleCancelDuplicate}>Cancel</button>
            </div>
          </div>
        </div>
      ), document.body)}

      {addressPendingDelete && typeof document !== 'undefined' && createPortal((
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
      ), document.body)}

      <style jsx>{`
        .addresses-container {
          max-width: 100%;
          width: 100%;
          margin: -3.75rem auto 0;
          justify-self: center;
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
 
        .add-address-row { display: flex; justify-content: flex-end; margin: -2.25rem 0 .5rem; }
 
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

        .address-card.is-highlighted {
          border-color: rgba(37,99,235,.65);
          box-shadow: 0 0 0 4px rgba(37,99,235,.12), 0 18px 40px rgba(37,99,235,.16);
          animation: address-highlight 2.6s ease;
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

        .duplicate-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 2147483000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          overflow: hidden;
          overscroll-behavior: none;
          background: rgba(15,23,42,.56);
          backdrop-filter: blur(10px);
          animation: modal-fade .2s ease both;
        }

        .duplicate-modal {
          width: min(500px, 100%);
          max-height: calc(100dvh - 2rem);
          box-sizing: border-box;
          padding: 1.5rem;
          overflow-x: hidden;
          overflow-y: auto;
          overscroll-behavior: contain;
          border: 1px solid rgba(148,163,184,.2);
          border-radius: 24px;
          background: var(--bg-secondary);
          box-shadow: 0 28px 80px rgba(15,23,42,.24);
          animation: modal-scale 220ms cubic-bezier(.22,1,.36,1) both;
        }

        .duplicate-modal-icon { width: 48px; height: 48px; display: grid; place-items: center; margin: 0 auto .8rem; border-radius: 50%; color: var(--primary-color); background: #eef5ff; }
        .duplicate-modal-icon svg { width: 23px; height: 23px; }
        .duplicate-modal h3 { margin: 0; text-align: center; font-size: 1.3rem; color: var(--text-primary); }
        .duplicate-intro { margin: .45rem auto 1rem; max-width: 390px; text-align: center; color: var(--text-secondary); font-size: .86rem; line-height: 1.5; }
        .duplicate-section-label { display: block; margin-bottom: .4rem; color: var(--text-secondary); font-size: .7rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
        .duplicate-address-preview { display: flex; flex-direction: column; gap: .25rem; padding: 1rem; border: 1px solid rgba(59,130,246,.24); border-radius: 16px; background: linear-gradient(145deg, rgba(239,246,255,.85), rgba(255,255,255,.45)); }
        .duplicate-address-preview strong { margin-top: .2rem; color: var(--text-primary); font-size: .95rem; }
        .duplicate-address-preview p { margin: 0; color: var(--text-secondary); font-size: .82rem; line-height: 1.35; }
        .duplicate-badges { display: flex; align-items: center; gap: .35rem; }
        .duplicate-type { padding: .2rem .5rem; border-radius: 999px; color: #2563eb; background: rgba(37,99,235,.1); font-size: .65rem; font-weight: 800; }
        .duplicate-type.work { color: #7c3aed; background: rgba(124,58,237,.1); }
        .duplicate-type.other { color: #0891b2; background: rgba(8,145,178,.1); }
        .duplicate-default { padding: .2rem .5rem; border: 1px solid rgba(37,99,235,.16); border-radius: 999px; color: var(--primary-color); background: rgba(37,99,235,.06); font-size: .62rem; font-weight: 800; }
        .duplicate-phone { margin-top: .35rem; color: var(--text-primary); font-size: .78rem; font-weight: 700; }
        .duplicate-note { margin: .75rem 0; color: var(--text-secondary); font-size: .8rem; }
        .duplicate-preference { display: flex; align-items: center; gap: .5rem; color: var(--text-secondary); font-size: .76rem; cursor: pointer; }
        .duplicate-preference input { accent-color: var(--primary-color); }
        .duplicate-modal-actions { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; margin-top: 1rem; }
        .duplicate-modal-actions button { min-height: 40px; border-radius: 12px; font: inherit; font-size: .76rem; font-weight: 750; cursor: pointer; transition: all 250ms ease; }
        .duplicate-use-button { grid-column: 1 / -1; border: 0; color: white; background: linear-gradient(135deg, var(--primary-color), var(--primary-hover)); box-shadow: 0 8px 20px rgba(37,99,235,.2); }
        .duplicate-save-button { border: 1px solid rgba(37,99,235,.25); color: var(--primary-color); background: rgba(37,99,235,.06); }
        .duplicate-cancel-button { border: 0; color: var(--text-secondary); background: transparent; }
        .duplicate-modal-actions button:hover:not(:disabled) { transform: translateY(-1px); }
        .duplicate-modal-actions button:focus-visible { outline: 3px solid rgba(59,130,246,.28); outline-offset: 2px; }
 
        .delete-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 2147483000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          overflow: hidden;
          overscroll-behavior: none;
          background: rgba(2, 6, 23, 0.72);
          backdrop-filter: blur(6px);
          animation: modal-fade 200ms ease-out both;
        }
 
        .delete-modal {
          width: min(380px, 100%);
          max-height: calc(100dvh - 2rem);
          box-sizing: border-box;
          padding: 1.5rem;
          overflow-x: hidden;
          overflow-y: auto;
          overscroll-behavior: contain;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          background: var(--bg-secondary);
          box-shadow: var(--shadow-xl);
          text-align: center;
          animation: modal-scale 220ms cubic-bezier(.22,1,.36,1) both;
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

        @keyframes modal-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modal-scale { from { opacity: 0; transform: translateY(10px) scale(.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes address-highlight { 0%, 65% { border-color: rgba(37,99,235,.65); } 100% { border-color: rgba(148,163,184,.17); } }
 
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
          .address-card { padding: .75rem; }
          .address-card-footer { grid-template-columns: 1fr; }
          .duplicate-modal { padding: 1.15rem; border-radius: 20px; }
          .duplicate-modal-actions { grid-template-columns: 1fr; }
          .duplicate-use-button { grid-column: auto; }
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
