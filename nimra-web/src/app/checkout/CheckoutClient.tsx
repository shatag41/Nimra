'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useCart } from '../../components/CartProvider';
import { useAuth } from '../../context/AuthContext';
import { submitOrder } from '../../utils/api';
import { formatCurrency } from '../../utils/commerce';
import { toast } from 'sonner';

// ── India: states + cities ──────────────────────────────────────────────────
const INDIA_DATA: Record<string, string[]> = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Nellore', 'Kurnool', 'Kakinada', 'Rajahmundry', 'Kadapa', 'Anantapur'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tezpur'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Bongaigaon'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Bihar Sharif', 'Arrah', 'Begusarai', 'Katihar'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon', 'Jagdalpur', 'Raigarh'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Bicholim'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Junagadh', 'Anand', 'Navsari', 'Morbi', 'Nadiad'],
  'Haryana': ['Faridabad', 'Gurgaon', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula'],
  'Himachal Pradesh': ['Shimla', 'Mandi', 'Solan', 'Dharamshala', 'Kullu', 'Hamirpur', 'Baddi'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Phusro', 'Hazaribagh', 'Giridih'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi', 'Dharwad', 'Belagavi', 'Davangere', 'Ballari', 'Vijayapura', 'Tumakuru', 'Shivamogga', 'Udupi'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad', 'Alappuzha', 'Malappuram', 'Kannur', 'Kottayam'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa', 'Murwara', 'Singrauli'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Kalyan', 'Navi Mumbai', 'Kolhapur', 'Amravati', 'Nanded', 'Sangli', 'Jalgaon', 'Akola'],
  'Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur'],
  'Meghalaya': ['Shillong', 'Tura', 'Jowai', 'Nongpoh'],
  'Mizoram': ['Aizawl', 'Lunglei', 'Saiha', 'Champhai'],
  'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Brahmapur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak', 'Baripada'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot', 'Hoshiarpur', 'Batala', 'Moga'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar', 'Bharatpur', 'Sikar', 'Sri Ganganagar'],
  'Sikkim': ['Gangtok', 'Namchi', 'Gyalshing', 'Mangan'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur', 'Ranipet', 'Vellore', 'Erode', 'Thoothukudi', 'Dindigul'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet'],
  'Tripura': ['Agartala', 'Dharmanagar', 'Udaipur', 'Kailashahar'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Prayagraj', 'Bareilly', 'Aligarh', 'Moradabad', 'Noida', 'Saharanpur', 'Gorakhpur', 'Firozabad', 'Mathura', 'Rampur', 'Muzaffarnagar'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh'],
  'West Bengal': ['Kolkata', 'Asansol', 'Siliguri', 'Durgapur', 'Bardhaman', 'Malda', 'Baharampur', 'Habra', 'Kharagpur', 'Shantipur', 'Dankuni', 'Dhulian'],
  // Union Territories
  'Andaman and Nicobar Islands': ['Port Blair', 'Diglipur', 'Rangat'],
  'Chandigarh': ['Chandigarh'],
  'Dadra and Nagar Haveli and Daman and Diu': ['Daman', 'Silvassa', 'Diu'],
  'Delhi': ['New Delhi', 'Delhi'],
  'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Sopore', 'Baramulla', 'Kathua'],
  'Ladakh': ['Leh', 'Kargil'],
  'Lakshadweep': ['Kavaratti', 'Agatti'],
  'Puducherry': ['Puducherry', 'Karaikal', 'Yanam', 'Mahé'],
};

const ALL_STATES = Object.keys(INDIA_DATA).sort();

const initialForm = {
  name: '',
  mobile: '',
  email: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  instructions: '',
};

export default function CheckoutClient() {
  const cart = useCart();
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState<{ kind: 'idle' | 'loading' | 'success' | 'error'; message: string; orderId?: string }>({ kind: 'idle', message: '' });

  const formValues = {
    ...form,
    name: form.name || (user?.Name ? String(user.Name) : ''),
    mobile: form.mobile || (user?.Mobile ? String(user.Mobile) : ''),
    email: form.email || (user?.Username ? String(user.Username) : ''),
  };

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  // When state changes, reset city
  const handleStateChange = (value: string) => {
    setForm((current) => ({ ...current, state: value, city: '' }));
  };

  const availableCities = form.state ? (INDIA_DATA[form.state] ?? []) : [];

  const placeOrder = async (event: FormEvent) => {
    event.preventDefault();
    if (!/^\d{10}$/.test(formValues.mobile)) {
      setStatus({ kind: 'error', message: 'Enter a valid 10-digit mobile number.' });
      toast.error('Enter a valid 10-digit mobile number.');
      return;
    }
    if (!/^\d{6}$/.test(formValues.pincode)) {
      setStatus({ kind: 'error', message: 'Enter a valid 6-digit pincode.' });
      toast.error('Enter a valid 6-digit pincode.');
      return;
    }
    if (cart.items.length === 0) {
      setStatus({ kind: 'error', message: 'Your cart is empty.' });
      toast.error('Your cart is empty.');
      return;
    }

    setStatus({ kind: 'loading', message: 'Placing your order...' });
    const orderData = {
      type: 'order' as const,
      userId: user?.ID,
      customer: {
        ...form,
        userId: user?.ID,
        name: formValues.name.trim(),
        mobile: formValues.mobile.trim(),
        email: formValues.email.trim(),
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
        toast.success('Order placed successfully!');
      }
    } else {
      setStatus({ kind: 'error', message: result.message });
      toast.error(result.message || 'Failed to place order.');
    }
  };

  if (cart.items.length === 0 && status.kind !== 'success') {
    return (
      <div className="checkout-page"><div className="container empty"><h1>Checkout</h1><p>Your cart is empty.</p><Link className="btn btn-primary" href="/products">Shop Products</Link></div></div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <div className="checkout-head">
          <span className="badge badge-primary">Checkout</span>
          <h1>Delivery Details</h1>
        </div>

        {status.kind === 'success' ? (
          <div className="co-success">
            <h2>Order placed</h2>
            <p>{status.message}</p>
            {status.orderId && <strong>Order ID: {status.orderId}</strong>}
            <div className="success-actions">
              <Link className="btn btn-primary" href={`/track?orderId=${status.orderId || ''}`}>Track Order</Link>
              <Link className="btn btn-secondary" href="/products">Continue Shopping</Link>
            </div>
          </div>
        ) : (
          <form className="checkout-grid" onSubmit={placeOrder}>
            <div className="form-card">
              <div className="field">
                <label htmlFor="checkout-name">Customer Name</label>
                <input id="checkout-name" required autoComplete="name" value={formValues.name} onChange={(e) => update('name', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="checkout-mobile">Mobile Number</label>
                <input id="checkout-mobile" required inputMode="numeric" autoComplete="tel" maxLength={10} value={formValues.mobile} onChange={(e) => update('mobile', e.target.value.replace(/\D/g, ''))} />
              </div>
              <div className="field">
                <label htmlFor="checkout-email">Email</label>
                <input id="checkout-email" type="email" autoComplete="email" value={formValues.email} onChange={(e) => update('email', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="checkout-address">Delivery Address</label>
                <textarea id="checkout-address" required rows={4} autoComplete="street-address" value={formValues.address} onChange={(e) => update('address', e.target.value)} />
              </div>
              <div className="split">
                <div className="field">
                  <label htmlFor="checkout-state">State</label>
                  <select
                    id="checkout-state"
                    className="co-select"
                    required
                    value={form.state}
                    onChange={(e) => handleStateChange(e.target.value)}
                  >
                    <option value="">Select state…</option>
                    {ALL_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="checkout-city">City</label>
                  <select
                    id="checkout-city"
                    className="co-select"
                    required
                    value={form.city}
                    disabled={!form.state}
                    onChange={(e) => update('city', e.target.value)}
                  >
                    <option value="">{form.state ? 'Select city…' : 'Select state first'}</option>
                    {availableCities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field">
                <label htmlFor="checkout-pincode">Pincode</label>
                <input id="checkout-pincode" required inputMode="numeric" autoComplete="postal-code" maxLength={6} value={formValues.pincode} onChange={(e) => update('pincode', e.target.value.replace(/\D/g, ''))} />
              </div>
              <div className="field">
                <label htmlFor="checkout-instructions">Special Instructions</label>
                <textarea id="checkout-instructions" rows={3} value={formValues.instructions} onChange={(e) => update('instructions', e.target.value)} />
              </div>
            </div>

            <aside className="co-summary">
              <h2>Order Summary</h2>
              {cart.items.map((item) => (
                <div className="sum-row" key={item.productId}>
                  <span>{item.name} × {item.quantity}</span>
                  <strong>{formatCurrency(item.price * item.quantity)}</strong>
                </div>
              ))}
              <div className="sum-row"><span>Subtotal</span><strong>{formatCurrency(cart.subtotal)}</strong></div>
              <div className="sum-row"><span>Delivery</span><strong>{cart.deliveryCharge ? formatCurrency(cart.deliveryCharge) : 'Free'}</strong></div>
              <div className="sum-row total"><span>Total</span><strong>{formatCurrency(cart.grandTotal)}</strong></div>
              {status.message && <p className={`status-${status.kind}`}>{status.message}</p>}
              <button type="submit" className="btn btn-primary place-order-btn" disabled={status.kind === 'loading'}>{status.kind === 'loading' ? 'Placing...' : 'Place Order'}</button>
            </aside>
          </form>
        )}
      </div>
    </div>
  );
}

