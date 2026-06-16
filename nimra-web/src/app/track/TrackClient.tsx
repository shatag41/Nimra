'use client';

import { FormEvent, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { OrderRecord } from '../../types/cms';
import { useAuth } from '../../context/AuthContext';
import { trackOrder } from '../../utils/api';
import { formatCurrency } from '../../utils/commerce';

const steps = ['Pending', 'Confirmed', 'Processing', 'Dispatched', 'Out for Delivery', 'Delivered', 'Cancelled'];

export default function TrackClient() {
  const params = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [orderId, setOrderId] = useState(params.get('orderId') || '');
  const [mobile, setMobile] = useState(user?.Mobile || '');
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const mobileValue = mobile || user?.Mobile || '';

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) {
      const nextPath = orderId.trim() ? `/track?orderId=${encodeURIComponent(orderId.trim())}` : '/track';
      router.push(`/login?next=${encodeURIComponent(nextPath)}`);
      return;
    }
    setLoading(true);
    setMessage('');
    setOrder(null);
    const result = await trackOrder(orderId.trim(), '', {
      userId: user?.ID,
      email: user?.Username,
      mobile: user?.Mobile,
    });
    setLoading(false);
    if (result.success && result.order) setOrder(result.order);
    else setMessage(result.message || 'Order not found.');
  };

  const activeIndex = order ? steps.indexOf(order.status) : -1;

  return (
    <section className="track-page">
      <div className="container">
        <div className="track-head">
          <span className="badge badge-primary">Order Tracking</span>
          <h1>Track Your NIMRA Delivery</h1>
        </div>

        <form className="track-form glass" onSubmit={submit}>
          <label>Order ID<input required value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="NIMRA-..." /></label>
          <label>Mobile Number<input inputMode="numeric" maxLength={10} value={mobileValue} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} /></label>
          <button className="btn btn-primary" disabled={loading}>{loading ? 'Checking...' : 'Track Order'}</button>
        </form>

        {message && <p className="message">{message}</p>}

        {order && (
          <div className="result glass">
            <div className="result-head">
              <div>
                <span>Order ID</span>
                <strong>{order.orderId}</strong>
              </div>
              <div>
                <span>Total</span>
                <strong>{formatCurrency(order.total)}</strong>
              </div>
            </div>
            <div className="steps">
              {steps.map((step, index) => {
                // If order is Cancelled, don't light up other future steps; only light up Pending/Confirmed/Processing etc. if they happened before cancellation, or just show Cancelled.
                const isCancelled = order.status === 'Cancelled';
                const isStepCancelled = step === 'Cancelled';
                let isStepActive = index <= activeIndex;
                if (isCancelled && !isStepCancelled && step !== 'Pending' && step !== 'Confirmed' && step !== 'Processing') {
                  isStepActive = false; // Hide future steps as active if cancelled
                }
                return (
                  <div key={step} className={`step ${isStepActive ? 'active' : ''} ${isStepCancelled && isCancelled ? 'cancelled' : ''}`}>
                    <span>{isStepCancelled && isCancelled ? '✕' : index + 1}</span>
                    <p>{step}</p>
                  </div>
                );
              })}
            </div>
            <div className="items">
              {order.items.map((item) => (
                <div key={item.productId}><span>{item.name} x {item.quantity}</span><strong>{formatCurrency(item.price * item.quantity)}</strong></div>
              ))}
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
        .track-page { background: var(--bg-secondary); min-height: 70vh; padding: 2rem 0; }
        .track-head { text-align: center; max-width: 720px; margin: 0 auto 2rem; }
        .track-head h1 { font-size: 2.6rem; margin: 1rem 0; }
        .track-form { display: grid; grid-template-columns: 1fr 1fr auto; gap: 1rem; align-items: end; padding: 1.75rem; border-radius: var(--radius-xl); max-width: 900px; margin: 0 auto; background: var(--bg-primary); border: 1px solid var(--border-color); box-shadow: var(--shadow-md); }
        label { display: grid; gap: 0.45rem; color: var(--text-secondary); font-weight: 700; font-size: 0.9rem; }
        input { border: 1.5px solid var(--border-color); border-radius: var(--radius-md); padding: 0.9rem 1rem; background: var(--bg-secondary); color: var(--text-primary); font: inherit; transition: all var(--transition-fast); }
        input:focus { outline: none; border-color: var(--primary-color); box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.12); }
        button { border: none; cursor: pointer; height: 48px; }
        .message { text-align: center; margin-top: 1rem; color: #dc2626; font-weight: 700; }
        .result { max-width: 900px; margin: 2rem auto 0; padding: 1.75rem; border-radius: var(--radius-xl); background: var(--bg-primary); border: 1px solid var(--border-color); box-shadow: var(--shadow-md); }
        .result-head { display: flex; justify-content: space-between; gap: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; }
        .result-head span { display: block; color: var(--text-muted); font-size: 0.85rem; }
        .result-head strong { font-size: 1.2rem; }
        .steps { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.5rem; margin: 2rem 0; }
        .step { text-align: center; color: var(--text-secondary); font-size: 0.85rem; transition: all var(--transition-normal); }
        .step span { width: 36px; height: 36px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: var(--bg-secondary); border: 1px solid var(--border-color); font-weight: 800; margin-bottom: 0.5rem; transition: all var(--transition-normal); }
        .step.active span { background: var(--primary-color); border-color: var(--primary-color); color: white; box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.1); }
        .step.active p { color: var(--text-primary); font-weight: 800; }
        .step.cancelled span { background: #ef4444; border-color: #ef4444; color: white; box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1); }
        .step.cancelled p { color: #ef4444; font-weight: 800; }
        .items div { display: flex; justify-content: space-between; border-top: 1px solid var(--border-color); padding: 0.75rem 0; }
        @media (max-width: 760px) { .track-form { grid-template-columns: 1fr; } .steps { grid-template-columns: 1fr; text-align: left; } .step { display: flex; align-items: center; gap: 0.75rem; text-align: left; } .step span { margin-bottom: 0; } }
      `}</style>
    </section>
  );
}
