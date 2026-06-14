'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useCart } from '../../components/CartProvider';
import { useAuth } from '../../context/AuthContext';
import { submitOrder } from '../../utils/api';
import { formatCurrency } from '../../utils/commerce';
import { toast } from 'sonner';

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
    name: form.name || user?.Name || '',
    mobile: form.mobile || user?.Mobile || '',
    email: form.email || user?.Username || '',
  };

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

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
      toast.success('Order placed successfully! 🎉');
    } else {
      setStatus({ kind: 'error', message: result.message });
      toast.error(result.message || 'Failed to place order.');
    }
  };

  if (cart.items.length === 0 && status.kind !== 'success') {
    return (
      <section className="checkout-page"><div className="container empty"><h1>Checkout</h1><p>Your cart is empty.</p><Link className="btn btn-primary" href="/products">Shop Products</Link></div><style jsx>{styles}</style></section>
    );
  }

  return (
    <section className="checkout-page">
      <div className="container">
        <div className="checkout-head">
          <span className="badge badge-primary">Checkout</span>
          <h1>Delivery Details</h1>
        </div>

        {status.kind === 'success' ? (
          <div className="success glass">
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
            <div className="form-card glass">
              <label>Customer Name<input required value={formValues.name} onChange={(e) => update('name', e.target.value)} /></label>
              <label>Mobile Number<input required inputMode="numeric" maxLength={10} value={formValues.mobile} onChange={(e) => update('mobile', e.target.value.replace(/\D/g, ''))} /></label>
              <label>Email<input type="email" value={formValues.email} onChange={(e) => update('email', e.target.value)} /></label>
              <label>Delivery Address<textarea required rows={4} value={formValues.address} onChange={(e) => update('address', e.target.value)} /></label>
              <div className="split">
                <label>City<input required value={formValues.city} onChange={(e) => update('city', e.target.value)} /></label>
                <label>State<input required value={formValues.state} onChange={(e) => update('state', e.target.value)} /></label>
              </div>
              <label>Pincode<input required inputMode="numeric" maxLength={6} value={formValues.pincode} onChange={(e) => update('pincode', e.target.value.replace(/\D/g, ''))} /></label>
              <label>Special Instructions<textarea rows={3} value={formValues.instructions} onChange={(e) => update('instructions', e.target.value)} /></label>
            </div>

            <aside className="summary glass">
              <h2>Order Summary</h2>
              {cart.items.map((item) => (
                <div className="summary-item" key={item.productId}>
                  <span>{item.name} x {item.quantity}</span>
                  <strong>{formatCurrency(item.price * item.quantity)}</strong>
                </div>
              ))}
              <div><span>Subtotal</span><strong>{formatCurrency(cart.subtotal)}</strong></div>
              <div><span>Delivery</span><strong>{cart.deliveryCharge ? formatCurrency(cart.deliveryCharge) : 'Free'}</strong></div>
              <div className="total"><span>Total</span><strong>{formatCurrency(cart.grandTotal)}</strong></div>
              {status.message && <p className={status.kind}>{status.message}</p>}
              <button className="btn btn-primary" disabled={status.kind === 'loading'}>{status.kind === 'loading' ? 'Placing...' : 'Place Order'}</button>
            </aside>
          </form>
        )}
      </div>
      <style jsx>{styles}</style>
    </section>
  );
}

const styles = `
  .checkout-page { background: var(--bg-secondary); min-height: 70vh; padding: 2rem 0; }
  .checkout-head h1, .empty h1 { font-size: 2.6rem; margin: 1rem 0 2rem; }
  .empty, .success { text-align: center; max-width: 680px; margin: 0 auto; }
  .checkout-grid { display: grid; grid-template-columns: 1fr 380px; gap: 2rem; align-items: start; }
  .form-card, .summary, .success { border-radius: var(--radius-xl); padding: 1.75rem; background: var(--bg-primary); border: 1px solid var(--border-color); box-shadow: var(--shadow-md); }
  label { display: grid; gap: 0.45rem; color: var(--text-secondary); font-weight: 700; font-size: 0.9rem; margin-bottom: 1rem; }
  input, textarea { width: 100%; border: 1.5px solid var(--border-color); border-radius: var(--radius-md); padding: 0.9rem 1rem; background: var(--bg-secondary); color: var(--text-primary); font: inherit; transition: all var(--transition-fast); }
  input:focus, textarea:focus { outline: none; border-color: var(--primary-color); box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.12); }
  .split { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .summary { position: sticky; top: 100px; }
  .summary h2 { margin-bottom: 1.5rem; font-size: 1.35rem; }
  .summary div { display: flex; justify-content: space-between; gap: 1rem; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color); }
  .summary-item span { color: var(--text-secondary); }
  .total { font-size: 1.2rem; border-bottom: none !important; margin-bottom: 1.5rem; }
  .summary button { width: 100%; border: none; cursor: pointer; justify-content: center; }
  .summary button:disabled { opacity: 0.7; cursor: progress; }
  .error { color: #dc2626; font-weight: 700; }
  .success { animation: scaleIn 0.3s ease-out; }
  .success p { color: var(--text-secondary); }
  .success strong { display: block; font-size: 1.3rem; margin: 1rem 0; color: var(--primary-color); }
  .success-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-top: 1rem; }
  @media (max-width: 900px) { .checkout-grid { grid-template-columns: 1fr; } .summary { position: static; } }
  @media (max-width: 640px) { .split { grid-template-columns: 1fr; } }
`;
