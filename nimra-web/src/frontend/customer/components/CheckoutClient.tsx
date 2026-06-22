'use client';

import React, { FormEvent, useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/frontend/customer/hooks/useCart';
import { useAuth } from '@/frontend/customer/hooks/useAuth';
import { useLocation } from '@/frontend/customer/contexts/LocationContext';
import { submitOrder, saveUser } from '@/utils/api';
import { clearCustomerOrdersCache } from '@/frontend/customer/hooks/useCustomerOrders';
import { toast } from 'sonner';
import { CheckoutForm, CheckoutSummary, CheckoutSuccess, SavedAddress, WORLD_DATA } from './portal/Checkout';
import { migrateLegacyLocalAddresses, normalizeSavedAddresses, persistUserSavedAddresses } from '@/frontend/customer/utils/userAddresses';

const initialForm = {
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
  addressType: 'Home' as 'Home' | 'Work' | 'Other',
  instructions: '',
  saveAddress: false,
};

type FormState = typeof initialForm;

export default function CheckoutClient() {
  const cart = useCart();
  const { user, updateUserSession } = useAuth();
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<{ kind: 'idle' | 'loading' | 'success' | 'error'; message: string; orderId?: string }>({ kind: 'idle', message: '' });
  
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isEditingAddress, setIsEditingAddress] = useState(true);

  const location = useLocation();

  // Load saved addresses from the user profile on mount/login.
  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const loadAddresses = async () => {
      const migrated = await migrateLegacyLocalAddresses(user);
      if (cancelled) return;
      const parsed = migrated.addresses as SavedAddress[];
      if (migrated.migrated) {
        updateUserSession({ ...user, SavedAddresses: JSON.stringify(parsed) });
      }
      setSavedAddresses(parsed);
      if (parsed.length > 0) {
        const defaultAddr = parsed.find(a => a.isDefault) || parsed[0];
        setSelectedAddressId(defaultAddr.id);
        setIsEditingAddress(false);
        setForm({
          name: defaultAddr.name || user?.Name || '',
          mobile: defaultAddr.mobile || user?.Mobile || '',
          altMobile: defaultAddr.altMobile || user.AlternateMobile || '',
          email: defaultAddr.email || user?.Username || '',
          flatNo: defaultAddr.flatNo,
          buildingName: defaultAddr.buildingName || '',
          locality: defaultAddr.locality,
          landmark: defaultAddr.landmark || '',
          pincode: defaultAddr.pincode,
          state: defaultAddr.state,
          city: defaultAddr.city,
          country: defaultAddr.country || 'India',
          addressType: defaultAddr.type,
          instructions: defaultAddr.instructions || '',
          saveAddress: false,
        });
      }
    };
    void loadAddresses();

    return () => {
      cancelled = true;
    };
  }, [updateUserSession, user]);

  // Pre-detect country based on location details or timezone fallback
  useEffect(() => {
    if (savedAddresses.length > 0 && selectedAddressId) return; // Don't override if using saved

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    let detectedCountry = 'India';

    if (tz.includes('America') || tz.includes('US/')) {
      detectedCountry = 'United States';
    } else if (tz.includes('Dubai') || tz.includes('Asia/Dubai')) {
      detectedCountry = 'United Arab Emirates';
    }

    if (location.address) {
      const addrLower = location.address.toLowerCase();
      if (addrLower.includes('united states') || addrLower.includes('us')) {
        detectedCountry = 'United States';
      } else if (addrLower.includes('united arab emirates') || addrLower.includes('uae') || addrLower.includes('dubai')) {
        detectedCountry = 'United Arab Emirates';
      } else if (addrLower.includes('india')) {
        detectedCountry = 'India';
      }
    }

    setForm(f => ({ ...f, country: detectedCountry }));
  }, [location.address, savedAddresses, selectedAddressId]);

  // Pre-fill user contact info if empty
  useEffect(() => {
    if (user && isEditingAddress && !selectedAddressId) {
      setForm(f => ({
        ...f,
        name: f.name || String(user.Name || ''),
        mobile: f.mobile || String(user.Mobile || ''),
        email: f.email || String(user.Username || ''),
      }));
    }
  }, [user, isEditingAddress, selectedAddressId]);

  // Auto-detect address details from reverse geolocation
  const handleDetectLocation = () => {
    if (location.city || location.pincode) {
      let matchedState = form.state || location.state;
      let matchedCity = form.city || location.city;

      const currentCountryData = WORLD_DATA[form.country] || {};
      const stateKeys = Object.keys(currentCountryData);

      if (location.state && !form.state) {
        const foundState = stateKeys.find(s => s.toLowerCase().trim() === location.state.toLowerCase().trim());
        if (foundState) matchedState = foundState;
      }

      if (matchedState && !form.city) {
        const cities = currentCountryData[matchedState] || [];
        const searchTarget = `${location.city} ${location.address}`.toLowerCase();
        const foundCity = cities.find(c => searchTarget.includes(c.toLowerCase()));
        if (foundCity) {
          matchedCity = foundCity;
        }
      }

      setForm((f) => ({
        ...f,
        city: matchedCity,
        state: matchedState,
        pincode: f.pincode || location.pincode,
        locality: f.locality || (location.address ? location.address.split(',')[0].trim() : ''),
      }));
      toast.success('Address autofilled from current GPS location.');
    } else {
      toast.error('Could not detect location. Please check your GPS permissions.');
    }
  };

  const update = (key: string, value: any) => {
    setForm((cur) => ({ ...cur, [key]: value }));
  };

  const clearError = (key: string) => {
    setErrors((e) => {
      const n = { ...e };
      delete n[key as keyof FormState];
      return n;
    });
  };

  // Validate all fields
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Full name is required.';
    if (!/^\d{10}$/.test(form.mobile.trim())) newErrors.mobile = 'Enter a valid 10-digit mobile number.';
    if (form.altMobile.trim() && !/^\d{10}$/.test(form.altMobile.trim())) newErrors.altMobile = 'Enter a valid 10-digit alternate number.';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) newErrors.email = 'Enter a valid email address.';
    if (!form.flatNo.trim()) newErrors.flatNo = 'Flat or house number is required.';
    if (!form.locality.trim()) newErrors.locality = 'Area or locality is required.';
    if (!form.pincode.trim()) newErrors.pincode = 'Pincode is required.';
    if (!form.state) newErrors.state = 'Please select a state.';
    if (!form.city) newErrors.city = 'Please select a city.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSelectAddress = (id: string) => {
    const addr = savedAddresses.find(a => a.id === id);
    if (addr) {
      setSelectedAddressId(id);
      setIsEditingAddress(false);
      setForm({
        name: addr.name || user?.Name || '',
        mobile: addr.mobile || user?.Mobile || '',
        altMobile: addr.altMobile || user?.AlternateMobile || '',
        email: addr.email || user?.Username || '',
        flatNo: addr.flatNo,
        buildingName: addr.buildingName || '',
        locality: addr.locality,
        landmark: addr.landmark || '',
        pincode: addr.pincode,
        state: addr.state,
        city: addr.city,
        country: addr.country || 'India',
        addressType: addr.type,
        instructions: addr.instructions || '',
        saveAddress: false,
      });
      toast.info(`Switched delivery address to ${addr.type}`);
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    if (!user) return;
    const updated = savedAddresses.map(a => ({
      ...a,
      isDefault: a.id === id
    }));
    const { result, addresses } = await persistUserSavedAddresses(user, updated);
    if (result.success) {
      setSavedAddresses(addresses as SavedAddress[]);
      updateUserSession({ ...user, SavedAddresses: JSON.stringify(addresses) });
      toast.success('Default delivery location updated.');
    } else {
      toast.error(result.message || 'Failed to update default address.');
    }
  };

  const handleAddNewClick = () => {
    setSelectedAddressId(null);
    setIsEditingAddress(true);
    setForm({
      ...initialForm,
      name: user?.Name || '',
      mobile: user?.Mobile || '',
      email: user?.Username || '',
    });
  };

  const handleEditClick = () => {
    setIsEditingAddress(true);
  };

  const handleCancelEditClick = () => {
    if (selectedAddressId) {
      handleSelectAddress(selectedAddressId);
    } else if (savedAddresses.length > 0) {
      handleSelectAddress(savedAddresses[0].id);
    } else {
      setIsEditingAddress(true);
    }
  };

  const placeOrder = async (event: FormEvent) => {
    event.preventDefault();
    if (cart.items.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }

    // If they are in edit mode, validate the fields.
    if (isEditingAddress && !validate()) {
      toast.error('Please fix the errors in the form.');
      return;
    }

    setStatus({ kind: 'loading', message: 'Placing your order…' });

    let selectedSavedAddressId = selectedAddressId || undefined;

    // 1. Persist/refresh the selected address first so the order can store only
    // the saved-address reference, not customer/contact/address snapshots.
    if (user && (form.saveAddress || isEditingAddress || !selectedSavedAddressId)) {
      const newSavedAddr: SavedAddress = {
        id: selectedAddressId || Date.now().toString(),
        type: form.addressType,
        name: form.name,
        mobile: form.mobile,
        altMobile: form.altMobile || undefined,
        email: form.email || undefined,
        flatNo: form.flatNo,
        buildingName: form.buildingName || undefined,
        locality: form.locality,
        landmark: form.landmark || undefined,
        pincode: form.pincode,
        state: form.state,
        city: form.city,
        country: form.country,
        instructions: form.instructions || undefined,
        isDefault: true, // Auto set as default when saved
      };

      // Set others to not default
      const listWithoutDefault = savedAddresses.map(a => ({ ...a, isDefault: false }));
      const updatedList = selectedAddressId
        ? listWithoutDefault.map(a => a.id === selectedAddressId ? newSavedAddr : a)
        : [...listWithoutDefault, newSavedAddr];

      const normalized = normalizeSavedAddresses(updatedList) as SavedAddress[];
      selectedSavedAddressId = newSavedAddr.id;

      try {
        const updatePayload = {
          ID: user.ID,
          Name: form.name,
          Mobile: form.mobile,
          Username: form.email || user.Username,
          AlternateMobile: form.altMobile,
          SavedAddresses: JSON.stringify(normalized),
        };
        const profileRes = await saveUser(updatePayload, 'update');
        if (profileRes.success) {
          setSavedAddresses(normalized);
          updateUserSession({ ...user, ...updatePayload });
        } else {
          toast.error(profileRes.message || 'Failed to save address to your account.');
          setStatus({ kind: 'error', message: profileRes.message || 'Failed to save address to your account.' });
          return;
        }
      } catch (err) {
        console.error('Failed to auto-persist contact info to backend user profile', err);
        toast.error('Failed to save address to your account.');
        setStatus({ kind: 'error', message: 'Failed to save address to your account.' });
        return;
      }
    }

    // Alternate mobile belongs to the customer profile, even when an existing
    // saved address is used without editing/saving that address.
    if (user && !form.saveAddress && form.altMobile !== (user.AlternateMobile || '')) {
      const profileRes = await saveUser({ ID: user.ID, AlternateMobile: form.altMobile } as any, 'update');
      if (!profileRes.success) {
        toast.error(profileRes.message || 'Failed to save alternate mobile number.');
        setStatus({ kind: 'error', message: profileRes.message || 'Failed to save alternate mobile number.' });
        return;
      }
      updateUserSession({ ...user, AlternateMobile: form.altMobile });
    }

    const orderData = {
      type: 'order' as const,
      userId: user?.ID,
      customer: {
        userId: user?.ID,
        savedAddressId: selectedSavedAddressId,
        addressType: form.addressType,
        instructions: form.instructions || undefined,
        saveAddress: form.saveAddress,
      },
      items: cart.items,
      subtotal: cart.subtotal,
      deliveryCharge: cart.deliveryCharge,
      total: cart.grandTotal,
      paymentMethod: 'Cash on Delivery' as const,
      source: 'Website' as const,
    };

    const result = await submitOrder(orderData);
    if (result.success) {
      clearCustomerOrdersCache(user?.ID);
      cart.clearCart();
      setForm(initialForm);
      setStatus({ kind: 'success', message: result.message, orderId: result.orderId });
      if (result.emailError) {
        toast.warning(`Order placed, but confirmation email failed: ${result.emailError}`);
      } else {
        toast.success('Order placed successfully! 🎉');
      }
    } else {
      setStatus({ kind: 'error', message: result.message });
      toast.error(result.message || 'Failed to place order.');
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="loading-state" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Loading Checkout...</div>;
  }

  if (cart.items.length === 0 && status.kind !== 'success') {
    return (
      <section className="checkout-page">
        <div className="container">
          <div className="page-header animate-slide-up">
            <span className="badge badge-primary">Checkout</span>
            <h1>Your Cart is Empty</h1>
            <p>You have no items to checkout. Add NIMRA products to continue.</p>
          </div>
          <div className="empty-cart-action">
             <Link href="/products" className="btn btn-primary">Continue Shopping</Link>
          </div>
        </div>
        <style jsx>{styles}</style>
      </section>
    );
  }

  return (
    <section className="checkout-page">
      <div className="container">
        <div className="checkout-actions-top">
           <Link href="/cart" className="btn btn-secondary btn-sm">← Back to Cart</Link>
        </div>

        {status.kind === 'success' ? (
          <CheckoutSuccess message={status.message} orderId={status.orderId} />
        ) : (
          <div className="checkout-content-wrap">
            <form className="checkout-grid animate-fade-in" onSubmit={placeOrder} noValidate>
              <CheckoutForm
                form={form}
                setForm={setForm}
                errors={errors as any}
                clearError={clearError}
                user={user}
                update={update}
                savedAddresses={savedAddresses}
                selectedAddressId={selectedAddressId}
                isEditingAddress={isEditingAddress}
                onSelectAddress={handleSelectAddress}
                onSetDefaultAddress={handleSetDefaultAddress}
                onAddNewClick={handleAddNewClick}
                onEditClick={handleEditClick}
                onCancelEditClick={handleCancelEditClick}
                locationLoading={location.loading}
                onDetectLocation={handleDetectLocation}
              />
              <CheckoutSummary status={status} />
            </form>
          </div>
        )}
      </div>
      <style jsx>{styles}</style>
    </section>
  );
}

const styles = `
  .checkout-page { padding-top: 0; padding-bottom: 4rem; min-height: 90vh; font-family: var(--font-body); }
  
  .checkout-actions-top { margin-top: 1rem; margin-bottom: 1rem; display: flex; justify-content: flex-start; }

  .checkout-grid { display: grid; grid-template-columns: 1fr 340px; gap: 2rem; align-items: start; }

  @media (max-width: 900px) { .checkout-grid { grid-template-columns: 1fr; } }
`;
