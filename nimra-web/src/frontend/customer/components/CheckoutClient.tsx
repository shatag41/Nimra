'use client';

import React, { FormEvent, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/frontend/customer/hooks/useCart';
import { useAuth } from '@/frontend/customer/hooks/useAuth';
import { useLocation } from '@/frontend/customer/contexts/LocationContext';
import { fetchCustomerOrders, submitOrder, saveUser } from '@/utils/api';
import { primeCustomerOrderCache, replaceCustomerOrdersCache } from '@/frontend/customer/hooks/useCustomerOrders';
import { toast } from 'sonner';
import { CheckoutForm, CheckoutSummary, CheckoutSuccess, SavedAddress, WORLD_DATA } from './portal/Checkout';
import { migrateLegacyLocalAddresses, normalizeSavedAddresses, persistUserSavedAddresses } from '@/frontend/customer/utils/userAddresses';
import { clearReorderCheckoutDraft, readReorderCheckoutDraft, ReorderCheckoutDraft, totalsForCheckoutItems } from '@/frontend/customer/utils/reorderDraft';
import { formatCurrency } from '@/frontend/customer/utils/commerce';
import type { CartItem, OrderRecord } from '@/types/cms';
import CustomerPageHeader from './CustomerPageHeader';

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
  const searchParams = useSearchParams();
  const { user, updateUserSession } = useAuth();
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<{ kind: 'idle' | 'loading' | 'success' | 'error'; message: string; orderId?: string }>({ kind: 'idle', message: '' });
  const [reorderDraft, setReorderDraft] = useState<ReorderCheckoutDraft | null>(null);
  
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isEditingAddress, setIsEditingAddress] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const location = useLocation();
  const isReorderCheckout = Boolean(reorderDraft);
  const checkoutItems: CartItem[] = reorderDraft?.items || cart.items;
  const checkoutTotals = totalsForCheckoutItems(checkoutItems);

  useEffect(() => {
    if (searchParams.get('reorder') === '1') {
      setReorderDraft(readReorderCheckoutDraft());
    } else {
      setReorderDraft(null);
    }
  }, [searchParams]);

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

  const handlePlaceOrderClick = (event: FormEvent) => {
    event.preventDefault();
    if (checkoutItems.length === 0) {
      toast.error(isReorderCheckout ? 'This reorder has no products to checkout.' : 'Your cart is empty.');
      return;
    }

    // If they are in edit mode, validate the fields.
    if (isEditingAddress && !validate()) {
      toast.error('Please fix the errors in the form.');
      return;
    }

    setShowConfirmModal(true);
  };

  const executeOrderPlacement = async () => {
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
      items: checkoutItems,
      subtotal: checkoutTotals.subtotal,
      deliveryCharge: checkoutTotals.deliveryCharge,
      total: checkoutTotals.grandTotal,
      paymentMethod: 'Cash on Delivery' as const,
      source: isReorderCheckout ? 'Website Reorder' : 'Website' as const,
    };

    const result = await submitOrder(orderData);
    if (result.success) {
      const now = new Date().toISOString();
      const savedOrder: OrderRecord = {
        ...orderData,
        orderId: result.orderId || `NIMRA-${Date.now()}`,
        status: 'Pending',
        createdAt: now,
        updatedAt: now,
        customer: {
          ...orderData.customer,
          userId: user?.ID,
          name: form.name,
          mobile: form.mobile,
          altMobile: form.altMobile,
          email: form.email || user?.Username,
          flatNo: form.flatNo,
          buildingName: form.buildingName,
          locality: form.locality,
          landmark: form.landmark,
          pincode: form.pincode,
          state: form.state,
          city: form.city,
          addressType: form.addressType,
          savedAddressId: selectedSavedAddressId,
          instructions: form.instructions,
        },
      };
      const orderCacheKey = user?.ID || user?.Username;
      try {
        const backendOrders = result.orders || await fetchCustomerOrders(
          user?.ID || '',
          user?.Username || form.email,
          user?.Mobile || form.mobile
        );
        const includesPlacedOrder = backendOrders.some((order) => order.orderId === savedOrder.orderId);
        replaceCustomerOrdersCache(
          includesPlacedOrder ? backendOrders : [savedOrder, ...backendOrders],
          [orderCacheKey]
        );
      } catch (error) {
        console.error('Order was placed, but refreshing order history failed', error);
        primeCustomerOrderCache(savedOrder, [orderCacheKey]);
      }
      if (isReorderCheckout) {
        clearReorderCheckoutDraft();
        setReorderDraft(null);
      } else {
        cart.clearCart();
      }
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

  if (checkoutItems.length === 0 && status.kind !== 'success') {
    return (
      <div className="checkout-page">
        <div className="container">
          <CustomerPageHeader
            className="checkout-hero-flush"
            badge="CHECKOUT"
            title={searchParams.get('reorder') === '1' ? 'Reorder Not Available' : 'Your Cart is Empty'}
            subtitle={
              searchParams.get('reorder') === '1'
                ? 'The reorder draft expired or has no valid products. Please choose Reorder again from your order history.'
                : 'You have no items to checkout. Add NIMRA products to continue.'
            }
          />
          <div className="empty-cart-action">
             <Link href={searchParams.get('reorder') === '1' ? '/orders' : '/products'} className="btn btn-primary">
              {searchParams.get('reorder') === '1' ? 'Back to Orders' : 'Continue Shopping'}
             </Link>
          </div>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <CustomerPageHeader
          className="checkout-hero-flush"
          badge="CHECKOUT"
          title={isReorderCheckout ? 'Reorder Checkout' : 'Secure Checkout'}
          subtitle="Confirm your delivery details and place your NIMRA order with confidence."
        />

        <div className="checkout-actions-top">
          <Link href={isReorderCheckout ? '/orders' : '/cart'} className="btn btn-secondary btn-sm">
            {isReorderCheckout ? 'Back to Orders' : 'Back to Cart'}
          </Link>
        </div>

        {status.kind === 'success' ? (
          <CheckoutSuccess message={status.message} orderId={status.orderId} />
        ) : (
          <div className="checkout-content-wrap">
            <form className="checkout-grid animate-fade-in" onSubmit={handlePlaceOrderClick} noValidate>
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
              <CheckoutSummary
                status={status}
                items={checkoutItems}
                subtotal={checkoutTotals.subtotal}
                deliveryCharge={checkoutTotals.deliveryCharge}
                grandTotal={checkoutTotals.grandTotal}
                isReorder={isReorderCheckout}
                hasSavedAddress={savedAddresses.length > 0}
              />
            </form>
          </div>
        )}
      </div>
      {showConfirmModal && (
        <div className="co-confirm-modal-overlay">
          <div className="co-confirm-modal card animate-scale-in">
            <h3>Confirm Your Order</h3>
            <p className="modal-desc">Please review your order details before placing it.</p>
            
            <div className="modal-summary-section">
              <h4>Delivery Address</h4>
              <p>
                {form.flatNo && `${form.flatNo}, `}
                {form.buildingName && `${form.buildingName}, `}
                {form.locality && `${form.locality}, `}
                {form.city && `${form.city}, `}
                {form.state && `${form.state}`}
              </p>
              <p className="modal-phone">📞 {form.mobile} {form.altMobile ? `/ ${form.altMobile}` : ''}</p>
            </div>

            <div className="modal-summary-section">
              <h4>Items</h4>
              <div className="modal-items-list">
                {checkoutItems.map((item) => (
                  <div key={item.productId} className="modal-item-row">
                    <span className="modal-item-name">{item.name}</span>
                    <span className="modal-item-qty">x{item.quantity}</span>
                    <span className="modal-item-price">{formatCurrency((item.price || 0) * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-total-section">
              <div className="modal-total-row">
                <span>Subtotal</span>
                <span>{formatCurrency(checkoutTotals.subtotal)}</span>
              </div>
              <div className="modal-total-row">
                <span>Delivery Charge</span>
                <span>{formatCurrency(checkoutTotals.deliveryCharge)}</span>
              </div>
              <div className="modal-total-row grand-total">
                <span>Total Amount</span>
                <strong>{formatCurrency(checkoutTotals.grandTotal)}</strong>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => {
                  setShowConfirmModal(false);
                  void executeOrderPlacement();
                }}
              >
                Place Order
              </button>
            </div>
          </div>
        </div>
      )}
      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .checkout-page { padding-top: 0 !important; padding-bottom: 1rem; min-height: calc(100vh - 200px); font-family: var(--font-body); }
  
  :global(.checkout-hero-flush) {
    margin-top: calc(55px - var(--ds-header-offset)) !important;
    border-top: none !important;
    --customer-page-header-height: clamp(1.6rem, 2.4vw, 2rem) !important;
    padding-block: clamp(0.8rem, 1.8vw, 1.1rem) !important;
  }

  .checkout-actions-top { margin-top: 1rem; margin-bottom: 1rem; display: flex; justify-content: flex-start; }

  .checkout-grid { display: grid; grid-template-columns: 1fr 340px; gap: 1.25rem; align-items: start; }

  @media (max-width: 900px) { .checkout-grid { grid-template-columns: 1fr; } }

  /* ── Confirmation Modal ── */
  .co-confirm-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(15, 23, 42, 0.7);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }
  .co-confirm-modal {
    width: 100%;
    max-width: 480px;
    background: var(--glass-bg, rgba(30, 41, 59, 0.85));
    border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
    border-radius: var(--radius-xl, 20px);
    padding: 1.5rem;
    box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5);
    color: var(--text-primary);
  }
  .co-confirm-modal h3 {
    margin-top: 0;
    margin-bottom: 0.25rem;
    font-size: 1.25rem;
    font-weight: 700;
  }
  .modal-desc {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-bottom: 1.25rem;
  }
  .modal-summary-section {
    border-top: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
    padding: 0.75rem 0;
  }
  .modal-summary-section h4 {
    margin: 0 0 0.4rem 0;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--primary-color, #2563eb);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .modal-summary-section p {
    margin: 0;
    font-size: 0.88rem;
    line-height: 1.4;
  }
  .modal-phone {
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin-top: 0.25rem !important;
  }
  .modal-items-list {
    max-height: 140px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .modal-item-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
  }
  .modal-item-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding-right: 0.5rem;
  }
  .modal-item-qty {
    color: var(--text-secondary);
    margin-right: 1rem;
  }
  .modal-total-section {
    border-top: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
    padding-top: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .modal-total-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    color: var(--text-secondary);
  }
  .modal-total-row.grand-total {
    border-top: 1px dashed var(--border-color, rgba(255, 255, 255, 0.08));
    padding-top: 0.5rem;
    margin-top: 0.25rem;
    font-size: 1rem;
    color: var(--text-primary);
  }
  .modal-total-row.grand-total strong {
    color: var(--primary-color, #2563eb);
  }
  .modal-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    margin-top: 1.25rem;
  }
  .modal-actions .btn {
    width: 100%;
    justify-content: center;
    padding: 0.6rem;
    font-size: 0.9rem;
    font-weight: 600;
  }
`;
