'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/frontend/customer/hooks/useCart';
import { usePincode } from '@/frontend/customer/hooks/usePincode';
import { formatCurrency } from '../../utils/commerce';
import type { User } from '@/frontend/customer/contexts/AuthContext';

// Pincode type constraint
interface FormStateLike {
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
  addressType: 'Home' | 'Work' | 'Other';
  instructions: string;
  saveAddress: boolean;
}

interface CheckoutFormProps<T extends FormStateLike> {
  form: T;
  setForm: React.Dispatch<React.SetStateAction<T>>;
  errors: Partial<Record<keyof T, string>>;
  clearError: (key: keyof T) => void;
  user: User | null;
  update: <K extends keyof T>(key: K, value: T[K]) => void;
}

export function CheckoutForm<T extends FormStateLike>({
  form,
  setForm,
  errors,
  clearError,
  user,
  update,
}: CheckoutFormProps<T>) {
  const {
    pincodeLoading,
    handlePincodeChange,
    handleStateChange,
    availableCities,
    ALL_STATES,
  } = usePincode(form, setForm, clearError);

  return (
    <div className="form-card">
      <div className="co-section-label">Contact Information</div>
      <div className="co-row-3">
        <div className="co-field">
          <label htmlFor="co-name">Full Name <span className="req">*</span></label>
          <input
            id="co-name"
            placeholder="e.g. Rahul Sharma"
            required
            autoComplete="name"
            className={errors.name ? 'co-invalid' : ''}
            value={form.name}
            onChange={(e) => { update('name', e.target.value as any); clearError('name'); }}
          />
          {errors.name && <span className="co-err">{String(errors.name)}</span>}
        </div>
        <div className="co-field">
          <label htmlFor="co-mobile">Mobile Number <span className="req">*</span></label>
          <input
            id="co-mobile"
            placeholder="10-digit number"
            required
            inputMode="numeric"
            autoComplete="tel"
            maxLength={10}
            className={errors.mobile ? 'co-invalid' : ''}
            value={form.mobile}
            onChange={(e) => { update('mobile', e.target.value.replace(/\D/g, '') as any); clearError('mobile'); }}
          />
          {errors.mobile && <span className="co-err">{String(errors.mobile)}</span>}
        </div>
        <div className="co-field">
          <label htmlFor="co-altmobile">Alternate Mobile <span className="opt">(Optional)</span></label>
          <input
            id="co-altmobile"
            placeholder="Alternate number"
            inputMode="numeric"
            maxLength={10}
            className={errors.altMobile ? 'co-invalid' : ''}
            value={form.altMobile}
            onChange={(e) => { update('altMobile', e.target.value.replace(/\D/g, '') as any); clearError('altMobile'); }}
          />
          {errors.altMobile && <span className="co-err">{String(errors.altMobile)}</span>}
        </div>
      </div>

      <div className="co-field">
        <label htmlFor="co-email">Email Address <span className="opt">(Optional)</span></label>
        <input
          id="co-email"
          type="email"
          placeholder="For order confirmation"
          autoComplete="email"
          className={errors.email ? 'co-invalid' : ''}
          value={form.email}
          onChange={(e) => { update('email', e.target.value as any); clearError('email'); }}
        />
        {errors.email && <span className="co-err">{String(errors.email)}</span>}
      </div>

      <div className="co-section-label" style={{ marginTop: '0.75rem' }}>Delivery Address</div>

      <div className="co-row-2">
        <div className="co-field">
          <label htmlFor="co-flat">House/Flat/Apt No. <span className="req">*</span></label>
          <input
            id="co-flat"
            placeholder="e.g. Flat 4B, Door 12"
            required
            className={errors.flatNo ? 'co-invalid' : ''}
            value={form.flatNo}
            onChange={(e) => { update('flatNo', e.target.value as any); clearError('flatNo'); }}
          />
          {errors.flatNo && <span className="co-err">{String(errors.flatNo)}</span>}
        </div>
        <div className="co-field">
          <label htmlFor="co-building">Building/Society <span className="opt">(Optional)</span></label>
          <input
            id="co-building"
            placeholder="e.g. Green Valley Society"
            value={form.buildingName}
            onChange={(e) => update('buildingName', e.target.value as any)}
          />
        </div>
      </div>

      <div className="co-row-2">
        <div className="co-field">
          <label htmlFor="co-locality">Area/Locality <span className="req">*</span></label>
          <input
            id="co-locality"
            placeholder="e.g. Koregaon Park"
            required
            className={errors.locality ? 'co-invalid' : ''}
            value={form.locality}
            onChange={(e) => { update('locality', e.target.value as any); clearError('locality'); }}
          />
          {errors.locality && <span className="co-err">{String(errors.locality)}</span>}
        </div>
        <div className="co-field">
          <label htmlFor="co-landmark">Landmark <span className="opt">(Optional)</span></label>
          <input
            id="co-landmark"
            placeholder="e.g. Near City Mall"
            value={form.landmark}
            onChange={(e) => update('landmark', e.target.value as any)}
          />
        </div>
      </div>

      <div className="co-row-3">
        <div className="co-field">
          <label htmlFor="co-pincode">
            Pincode <span className="req">*</span>
            {pincodeLoading && <span className="co-pinloader"> Detecting…</span>}
          </label>
          <input
            id="co-pincode"
            placeholder="6-digit pincode"
            required
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={6}
            className={errors.pincode ? 'co-invalid' : ''}
            value={form.pincode}
            onChange={(e) => handlePincodeChange(e.target.value)}
          />
          {errors.pincode && <span className="co-err">{String(errors.pincode)}</span>}
        </div>
        <div className="co-field">
          <label htmlFor="co-state">State <span className="req">*</span></label>
          <select
            id="co-state"
            className={`co-select${errors.state ? ' co-invalid' : ''}`}
            required
            value={form.state}
            onChange={(e) => { handleStateChange(e.target.value); clearError('state'); }}
          >
            <option value="">Select state…</option>
            {ALL_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {errors.state && <span className="co-err">{String(errors.state)}</span>}
        </div>
        <div className="co-field">
          <label htmlFor="co-city">City <span className="req">*</span></label>
          <select
            id="co-city"
            className={`co-select${errors.city ? ' co-invalid' : ''}`}
            required
            value={form.city}
            disabled={!form.state}
            onChange={(e) => { update('city', e.target.value as any); clearError('city'); }}
          >
            <option value="">{form.state ? 'Select city…' : 'Select state first'}</option>
            {availableCities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.city && <span className="co-err">{String(errors.city)}</span>}
        </div>
      </div>

      <div className="co-field" style={{ marginTop: '0.25rem' }}>
        <label>Address Type</label>
        <div className="co-addr-type">
          {(['Home', 'Work', 'Other'] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={`co-type-btn${form.addressType === t ? ' active' : ''}`}
              onClick={() => update('addressType', t as any)}
            >
              {t === 'Home' ? '🏠' : t === 'Work' ? '🏢' : '📍'} {t}
            </button>
          ))}
        </div>
      </div>

      <div className="co-field" style={{ marginTop: '0.25rem' }}>
        <label htmlFor="co-instructions">Delivery Instructions <span className="opt">(Optional)</span></label>
        <textarea
          id="co-instructions"
          rows={2}
          placeholder="e.g. Leave at door, call before delivery…"
          value={form.instructions}
          onChange={(e) => update('instructions', e.target.value as any)}
        />
      </div>

      {user && (
        <label className="co-save-toggle">
          <input
            type="checkbox"
            checked={form.saveAddress}
            onChange={(e) => update('saveAddress', e.target.checked as any)}
          />
          <span>Save this address for future orders</span>
        </label>
      )}
      <style jsx>{styles}</style>
    </div>
  );
}

interface CheckoutSummaryProps {
  status: { kind: 'idle' | 'loading' | 'success' | 'error'; message: string };
}

export function CheckoutSummary({ status }: CheckoutSummaryProps) {
  const cart = useCart();

  return (
    <aside className="co-summary">
      <h2>Order Summary</h2>
      <div className="co-items">
        {cart.items.map((item) => (
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
          <strong>{formatCurrency(cart.subtotal)}</strong>
        </div>
        <div className="sum-row">
          <span>Delivery</span>
          <strong className={!cart.deliveryCharge ? 'co-free' : ''}>
            {cart.deliveryCharge ? formatCurrency(cart.deliveryCharge) : 'Free'}
          </strong>
        </div>
        <div className="sum-row total">
          <span>Total</span>
          <strong>{formatCurrency(cart.grandTotal)}</strong>
        </div>
      </div>
      <div className="co-payment-badge">
        <span>💳</span> Cash on Delivery
      </div>
      {status.message && <p className={`status-${status.kind}`}>{status.message}</p>}
      <button
        type="submit"
        id="place-order-btn"
        className="btn btn-primary place-order-btn"
        disabled={status.kind === 'loading'}
      >
        {status.kind === 'loading' ? (
          <><span className="co-spinner" /> Placing Order…</>
        ) : (
          'Place Order →'
        )}
      </button>
      <p className="co-secure-note">🔒 Secure checkout. Your data is safe.</p>
      <style jsx>{styles}</style>
    </aside>
  );
}

interface CheckoutSuccessProps {
  message: string;
  orderId?: string;
}

export function CheckoutSuccess({ message, orderId }: CheckoutSuccessProps) {
  return (
    <div className="co-success">
      <div className="co-success-icon">🎉</div>
      <h2>Order Placed!</h2>
      <p>{message}</p>
      {orderId && <strong>Order ID: {orderId}</strong>}
      <div className="success-actions">
        <Link className="btn btn-primary" href={`/track?orderId=${orderId || ''}`}>Track Order</Link>
        <Link className="btn btn-secondary" href="/products">Continue Shopping</Link>
      </div>
      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .form-card { background: var(--bg-primary); padding: 1.75rem; border-radius: var(--radius-xl); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); }
  .co-section-label { font-family: var(--font-heading); font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-light); padding-bottom: 0.5rem; }
  .co-row-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1rem; }
  .co-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
  .co-field { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
  .co-field label { font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); }
  .co-field input, .co-select, .co-field textarea { padding: 0.75rem 0.9rem; border: 1.5px solid var(--border-color); border-radius: var(--radius-lg); background: var(--bg-secondary); color: var(--text-primary); font: inherit; font-size: 0.92rem; transition: all var(--transition-fast); }
  .co-field input:focus, .co-select:focus, .co-field textarea:focus { outline: none; border-color: var(--primary-color); background: var(--bg-primary); box-shadow: 0 0 0 3px rgba(0, 150, 58, 0.08); }
  .co-field .req { color: #dc2626; }
  .co-field .opt { color: var(--text-muted); font-size: 0.75rem; }
  .co-invalid { border-color: #dc2626 !important; background: rgba(220,38,38,0.02) !important; }
  .co-err { color: #dc2626; font-size: 0.78rem; font-weight: 600; margin-top: 0.15rem; }
  .co-pinloader { color: var(--primary-color); font-size: 0.75rem; font-weight: 600; }
  .co-addr-type { display: flex; gap: 0.75rem; }
  .co-type-btn { flex: 1; padding: 0.7rem; border: 1.5px solid var(--border-color); border-radius: var(--radius-lg); background: var(--bg-secondary); color: var(--text-secondary); font: inherit; font-size: 0.88rem; font-weight: 700; cursor: pointer; transition: all var(--transition-fast); display: flex; align-items: center; justify-content: center; gap: 0.4rem; }
  .co-type-btn:hover { border-color: var(--primary-color); color: var(--primary-color); background: rgba(0, 150, 58, 0.04); }
  .co-type-btn.active { border-color: var(--primary-color); color: white; background: var(--primary-color); box-shadow: var(--shadow-sm); }
  .co-save-toggle { display: inline-flex; align-items: center; gap: 0.6rem; cursor: pointer; font-size: 0.88rem; font-weight: 600; color: var(--text-secondary); margin-top: 0.5rem; user-select: none; }
  .co-save-toggle input { width: 16px; height: 16px; border-radius: var(--radius-sm); border: 1.5px solid var(--border-color); cursor: pointer; }
  
  .co-summary { border-radius: var(--radius-xl); padding: 1.75rem; background: var(--bg-primary); border: 1px solid var(--border-color); box-shadow: var(--shadow-md); position: sticky; top: 100px; }
  .co-summary h2 { margin-top: 0; margin-bottom: 1.25rem; font-size: 1.3rem; }
  .co-items { max-height: 200px; overflow-y: auto; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 1rem; display: grid; gap: 0.75rem; }
  .co-item-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.92rem; }
  .co-item-info { display: flex; flex-direction: column; }
  .co-item-name { font-weight: 700; }
  .co-item-qty { font-size: 0.78rem; color: var(--text-muted); font-weight: 600; }
  .co-totals { border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 1rem; display: grid; gap: 0.6rem; }
  .sum-row { display: flex; justify-content: space-between; font-size: 0.92rem; color: var(--text-secondary); }
  .sum-row.total { font-size: 1.15rem; color: var(--text-primary); font-weight: 800; }
  .co-free { color: #22c55e; font-weight: 700; }
  .co-payment-badge { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem; border-radius: var(--radius-lg); background: rgba(0, 150, 58, 0.06); border: 1px solid rgba(0, 150, 58, 0.15); font-size: 0.88rem; font-weight: 700; color: var(--primary-color); margin-bottom: 1.25rem; }
  .place-order-btn { width: 100%; justify-content: center; display: inline-flex; align-items: center; gap: 0.5rem; }
  .co-secure-note { text-align: center; color: var(--text-muted); font-size: 0.75rem; margin-top: 0.85rem; font-weight: 600; }
  
  .status-loading { color: var(--primary-color); font-weight: 600; font-size: 0.85rem; margin-bottom: 1rem; }
  .status-error { color: #dc2626; font-weight: 600; font-size: 0.85rem; margin-bottom: 1rem; }
  
  .co-success { text-align: center; max-width: 520px; margin: 3rem auto; padding: 3rem 2rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-2xl); box-shadow: var(--shadow-xl); }
  .co-success-icon { font-size: 3.5rem; margin-bottom: 1rem; }
  .co-success h2 { font-size: 1.8rem; margin-bottom: 0.75rem; }
  .co-success p { color: var(--text-secondary); margin-bottom: 1.5rem; font-size: 0.95rem; }
  .co-success strong { display: block; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.5rem 1rem; font-family: var(--font-heading); color: var(--text-primary); font-size: 1rem; margin-bottom: 2rem; }
  .success-actions { display: flex; gap: 1rem; justify-content: center; }

  @media (max-width: 900px) { .co-summary { position: static; } }
  @media (max-width: 640px) { .co-row-3, .co-row-2 { grid-template-columns: 1fr; gap: 0; } .success-actions { flex-direction: column; } }
`;
