'use client';

import React, { FormEvent, useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/frontend/customer/hooks/useCart';
import { useAuth } from '@/frontend/customer/hooks/useAuth';
import { submitOrder } from '@/utils/api';
import { toast } from 'sonner';
import { CheckoutForm, CheckoutSummary, CheckoutSuccess } from './portal/Checkout';

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
  addressType: 'Home' as 'Home' | 'Work' | 'Other',
  instructions: '',
  saveAddress: false,
};

type FormState = typeof initialForm;

export default function CheckoutClient() {
  const cart = useCart();
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<{ kind: 'idle' | 'loading' | 'success' | 'error'; message: string; orderId?: string }>({ kind: 'idle', message: '' });

  // Pre-fill from profile on mount
  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        name: f.name || (user.Name ? String(user.Name) : ''),
        mobile: f.mobile || (user.Mobile ? String(user.Mobile) : ''),
        email: f.email || (user.Username ? String(user.Username) : ''),
      }));
    }
  }, [user]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((cur) => ({ ...cur, [key]: value }));

  const clearError = (key: keyof FormState) =>
    setErrors((e) => { const n = { ...e }; delete n[key]; return n; });

  // Validate all required fields
  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!form.name.trim() && !user?.Name) newErrors.name = 'Full name is required.';
    const mobile = form.mobile || (user?.Mobile ? String(user.Mobile) : '');
    if (!/^\d{10}$/.test(mobile)) newErrors.mobile = 'Enter a valid 10-digit mobile number.';
    if (form.altMobile && !/^\d{10}$/.test(form.altMobile)) newErrors.altMobile = 'Enter a valid 10-digit number.';
    const email = form.email || (user?.Username ? String(user.Username) : '');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Enter a valid email address.';
    if (!form.flatNo.trim()) newErrors.flatNo = 'House/Flat number is required.';
    if (!form.locality.trim()) newErrors.locality = 'Area/Locality is required.';
    if (!/^\d{6}$/.test(form.pincode)) newErrors.pincode = 'Enter a valid 6-digit pincode.';
    if (!form.state) newErrors.state = 'Please select a state.';
    if (!form.city) newErrors.city = 'Please select a city.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const placeOrder = async (event: FormEvent) => {
    event.preventDefault();
    if (cart.items.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }
    if (!validate()) {
      toast.error('Please fix the errors in the form.');
      return;
    }

    const resolvedName = form.name.trim() || (user?.Name ? String(user.Name) : '');
    const resolvedMobile = form.mobile.trim() || (user?.Mobile ? String(user.Mobile) : '');
    const resolvedEmail = form.email.trim() || (user?.Username ? String(user.Username) : '');
    const compositeAddress = [form.flatNo, form.buildingName, form.locality, form.landmark]
      .filter(Boolean).join(', ');

    setStatus({ kind: 'loading', message: 'Placing your order…' });

    const orderData = {
      type: 'order' as const,
      userId: user?.ID,
      customer: {
        userId: user?.ID,
        name: resolvedName,
        mobile: resolvedMobile,
        altMobile: form.altMobile || undefined,
        email: resolvedEmail,
        flatNo: form.flatNo,
        buildingName: form.buildingName || undefined,
        locality: form.locality,
        landmark: form.landmark || undefined,
        pincode: form.pincode,
        state: form.state,
        city: form.city,
        addressType: form.addressType,
        instructions: form.instructions || undefined,
        saveAddress: form.saveAddress,
        address: compositeAddress,
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

  if (cart.items.length === 0 && status.kind !== 'success') {
    return (
      <div className="checkout-page">
        <div className="container empty">
          <h1>Checkout</h1>
          <p>Your cart is empty.</p>
          <Link className="btn btn-primary" href="/products">Shop Products</Link>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <div className="checkout-head">
          <span className="badge badge-primary">Secure Checkout</span>
          <h1>Delivery Details</h1>
        </div>

        {status.kind === 'success' ? (
          <CheckoutSuccess message={status.message} orderId={status.orderId} />
        ) : (
          <form className="checkout-grid" onSubmit={placeOrder} noValidate>
            <CheckoutForm
              form={form}
              setForm={setForm}
              errors={errors}
              clearError={clearError}
              user={user}
              update={update}
            />
            <CheckoutSummary status={status} />
          </form>
        )}
      </div>
      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .checkout-page { background: var(--bg-secondary); min-height: 80vh; padding: 3rem 0; }
  .container { width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }
  .empty { text-align: center; max-width: 620px; margin: 0 auto; padding: 3rem 0; }
  .empty h1, .checkout-head h1 { font-size: 2.6rem; margin: 1rem 0; }
  .empty p { color: var(--text-secondary); margin-bottom: 2rem; }
  .checkout-head { margin-bottom: 2.5rem; }
  .checkout-grid { display: grid; grid-template-columns: 1fr 380px; gap: 2rem; align-items: start; }
  .badge { display: inline-flex; align-items: center; border-radius: 999px; padding: 0.3rem 0.85rem; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
  :global(.badge-primary) { background: rgba(37,99,235, 0.1); color: var(--primary-color); border: 1px solid rgba(37,99,235, 0.2); }

  @media (max-width: 900px) { .checkout-grid { grid-template-columns: 1fr; } }
  @media (max-width: 640px) { .checkout-head h1 { font-size: 2rem; } .container { padding: 0 1rem; } }
`;
