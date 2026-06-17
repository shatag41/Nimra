'use client';

import Link from 'next/link';
import { FormEvent, useState, useEffect, useCallback } from 'react';
import { useCart } from '../../components/CartProvider';
import { useAuth } from '../../context/AuthContext';
import { submitOrder } from '../../utils/api';
import { formatCurrency } from '../../utils/commerce';
import { toast } from 'sonner';

// ── India: states + cities ──────────────────────────────────────────────────
const INDIA_DATA: Record<string, string[]> = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Nellore', 'Kurnool', 'Kakinada', 'Rajahmundry', 'Kadapa', 'Anantapur'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Begusarai', 'Katihar'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon', 'Jagdalpur'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Junagadh', 'Anand', 'Navsari', 'Morbi', 'Nadiad'],
  'Haryana': ['Faridabad', 'Gurgaon', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula'],
  'Himachal Pradesh': ['Shimla', 'Mandi', 'Solan', 'Dharamshala', 'Kullu', 'Baddi'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi', 'Dharwad', 'Belagavi', 'Davangere', 'Ballari', 'Vijayapura', 'Tumakuru', 'Shivamogga', 'Udupi'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad', 'Alappuzha', 'Malappuram', 'Kannur', 'Kottayam'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa', 'Singrauli'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Kalyan', 'Navi Mumbai', 'Kolhapur', 'Amravati', 'Nanded', 'Sangli', 'Jalgaon', 'Akola'],
  'Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur'],
  'Meghalaya': ['Shillong', 'Tura', 'Jowai'],
  'Mizoram': ['Aizawl', 'Lunglei', 'Saiha'],
  'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Brahmapur', 'Sambalpur', 'Puri', 'Balasore'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot', 'Hoshiarpur'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar', 'Bharatpur'],
  'Sikkim': ['Gangtok', 'Namchi', 'Gyalshing'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur', 'Vellore', 'Erode', 'Thoothukudi'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Mahbubnagar', 'Nalgonda'],
  'Tripura': ['Agartala', 'Dharmanagar', 'Udaipur'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Prayagraj', 'Bareilly', 'Aligarh', 'Moradabad', 'Noida', 'Saharanpur', 'Gorakhpur', 'Mathura'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh'],
  'West Bengal': ['Kolkata', 'Asansol', 'Siliguri', 'Durgapur', 'Bardhaman', 'Malda', 'Baharampur', 'Kharagpur'],
  // Union Territories
  'Andaman and Nicobar Islands': ['Port Blair', 'Diglipur'],
  'Chandigarh': ['Chandigarh'],
  'Dadra and Nagar Haveli and Daman and Diu': ['Daman', 'Silvassa', 'Diu'],
  'Delhi': ['New Delhi', 'Delhi'],
  'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Sopore', 'Baramulla', 'Kathua'],
  'Ladakh': ['Leh', 'Kargil'],
  'Lakshadweep': ['Kavaratti'],
  'Puducherry': ['Puducherry', 'Karaikal', 'Yanam'],
};

const ALL_STATES = Object.keys(INDIA_DATA).sort();

// Pincode → {state, city} lookup using api.postalpincode.in (free, no API key)
const fetchPincodeData = async (pincode: string): Promise<{ state: string; city: string } | null> => {
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await res.json();
    if (data?.[0]?.Status === 'Success' && data[0].PostOffice?.length) {
      const po = data[0].PostOffice[0];
      return { state: po.State || '', city: po.District || po.Division || '' };
    }
    return null;
  } catch {
    return null;
  }
};

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
  const [pincodeLoading, setPincodeLoading] = useState(false);
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

  // Auto-fetch state + city from pincode
  const handlePincodeChange = useCallback(async (raw: string) => {
    const value = raw.replace(/\D/g, '').slice(0, 6);
    update('pincode', value);
    clearError('pincode');
    if (value.length === 6) {
      setPincodeLoading(true);
      const result = await fetchPincodeData(value);
      setPincodeLoading(false);
      if (result) {
        const matchedState = ALL_STATES.find(
          (s) => s.toLowerCase() === result.state.toLowerCase()
        ) || result.state;
        // Find best matching city
        const cities = INDIA_DATA[matchedState] ?? [];
        const matchedCity =
          cities.find((c) => c.toLowerCase() === result.city.toLowerCase()) ||
          cities.find((c) => c.toLowerCase().includes(result.city.toLowerCase())) ||
          result.city;
        setForm((cur) => ({ ...cur, state: matchedState, city: matchedCity }));
        toast.success(`Detected: ${matchedCity}, ${matchedState}`);
      } else {
        toast.error('Could not auto-detect location. Please select manually.');
      }
    }
  }, []);

  const handleStateChange = (value: string) =>
    setForm((cur) => ({ ...cur, state: value, city: '' }));

  const availableCities = form.state ? (INDIA_DATA[form.state] ?? []) : [];

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
        // legacy address field for backend compatibility
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
          <div className="co-success">
            <div className="co-success-icon">🎉</div>
            <h2>Order Placed!</h2>
            <p>{status.message}</p>
            {status.orderId && <strong>Order ID: {status.orderId}</strong>}
            <div className="success-actions">
              <Link className="btn btn-primary" href={`/track?orderId=${status.orderId || ''}`}>Track Order</Link>
              <Link className="btn btn-secondary" href="/products">Continue Shopping</Link>
            </div>
          </div>
        ) : (
          <form className="checkout-grid" onSubmit={placeOrder} noValidate>
            {/* ── Left: Delivery Form ── */}
            <div className="form-card">

              {/* Section: Contact Info */}
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
                    value={form.name || (user?.Name ? String(user.Name) : '')}
                    onChange={(e) => { update('name', e.target.value); clearError('name'); }}
                  />
                  {errors.name && <span className="co-err">{errors.name}</span>}
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
                    value={form.mobile || (user?.Mobile ? String(user.Mobile) : '')}
                    onChange={(e) => { update('mobile', e.target.value.replace(/\D/g, '')); clearError('mobile'); }}
                  />
                  {errors.mobile && <span className="co-err">{errors.mobile}</span>}
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
                    onChange={(e) => { update('altMobile', e.target.value.replace(/\D/g, '')); clearError('altMobile'); }}
                  />
                  {errors.altMobile && <span className="co-err">{errors.altMobile}</span>}
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
                  value={form.email || (user?.Username ? String(user.Username) : '')}
                  onChange={(e) => { update('email', e.target.value); clearError('email'); }}
                />
                {errors.email && <span className="co-err">{errors.email}</span>}
              </div>

              {/* Section: Address */}
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
                    onChange={(e) => { update('flatNo', e.target.value); clearError('flatNo'); }}
                  />
                  {errors.flatNo && <span className="co-err">{errors.flatNo}</span>}
                </div>
                <div className="co-field">
                  <label htmlFor="co-building">Building/Society <span className="opt">(Optional)</span></label>
                  <input
                    id="co-building"
                    placeholder="e.g. Green Valley Society"
                    value={form.buildingName}
                    onChange={(e) => update('buildingName', e.target.value)}
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
                    onChange={(e) => { update('locality', e.target.value); clearError('locality'); }}
                  />
                  {errors.locality && <span className="co-err">{errors.locality}</span>}
                </div>
                <div className="co-field">
                  <label htmlFor="co-landmark">Landmark <span className="opt">(Optional)</span></label>
                  <input
                    id="co-landmark"
                    placeholder="e.g. Near City Mall"
                    value={form.landmark}
                    onChange={(e) => update('landmark', e.target.value)}
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
                  {errors.pincode && <span className="co-err">{errors.pincode}</span>}
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
                  {errors.state && <span className="co-err">{errors.state}</span>}
                </div>
                <div className="co-field">
                  <label htmlFor="co-city">City <span className="req">*</span></label>
                  <select
                    id="co-city"
                    className={`co-select${errors.city ? ' co-invalid' : ''}`}
                    required
                    value={form.city}
                    disabled={!form.state}
                    onChange={(e) => { update('city', e.target.value); clearError('city'); }}
                  >
                    <option value="">{form.state ? 'Select city…' : 'Select state first'}</option>
                    {availableCities.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.city && <span className="co-err">{errors.city}</span>}
                </div>
              </div>

              {/* Address Type */}
              <div className="co-field" style={{ marginTop: '0.25rem' }}>
                <label>Address Type</label>
                <div className="co-addr-type">
                  {(['Home', 'Work', 'Other'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`co-type-btn${form.addressType === t ? ' active' : ''}`}
                      onClick={() => update('addressType', t)}
                    >
                      {t === 'Home' ? '🏠' : t === 'Work' ? '🏢' : '📍'} {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery Instructions */}
              <div className="co-field" style={{ marginTop: '0.25rem' }}>
                <label htmlFor="co-instructions">Delivery Instructions <span className="opt">(Optional)</span></label>
                <textarea
                  id="co-instructions"
                  rows={2}
                  placeholder="e.g. Leave at door, call before delivery…"
                  value={form.instructions}
                  onChange={(e) => update('instructions', e.target.value)}
                />
              </div>

              {/* Save Address */}
              {user && (
                <label className="co-save-toggle">
                  <input
                    type="checkbox"
                    checked={form.saveAddress}
                    onChange={(e) => update('saveAddress', e.target.checked)}
                  />
                  <span>Save this address for future orders</span>
                </label>
              )}
            </div>

            {/* ── Right: Order Summary ── */}
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
            </aside>
          </form>
        )}
      </div>
    </div>
  );
}
