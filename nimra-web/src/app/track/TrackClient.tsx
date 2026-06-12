'use client';

import { FormEvent, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { OrderRecord } from '../../types/cms';
import { trackOrder } from '../../utils/api';
import { formatCurrency } from '../../utils/commerce';

const steps = ['Pending', 'Confirmed', 'Processing', 'Out for Delivery', 'Delivered'];

export default function TrackClient() {
  const params = useSearchParams();
  const [orderId, setOrderId] = useState(params.get('orderId') || '');
  const [mobile, setMobile] = useState('');
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setOrder(null);
    const result = await trackOrder(orderId.trim(), mobile.trim());
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
          <label>Mobile Number<input required inputMode="numeric" maxLength={10} value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} /></label>
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
              {steps.map((step, index) => (
                <div key={step} className={`step ${index <= activeIndex ? 'active' : ''}`}>
                  <span>{index + 1}</span>
                  <p>{step}</p>
                </div>
              ))}
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
        .track-page { background: var(--bg-secondary); min-height: 70vh; }
        .track-head { text-align: center; max-width: 720px; margin: 0 auto 2rem; }
        .track-head h1 { font-size: 2.6rem; margin: 1rem 0; }
        .track-form { display: grid; grid-template-columns: 1fr 1fr auto; gap: 1rem; align-items: end; padding: 1.5rem; border-radius: 8px; max-width: 900px; margin: 0 auto; }
        label { display: grid; gap: 0.45rem; color: var(--text-secondary); font-weight: 700; font-size: 0.9rem; }
        input { border: 1px solid var(--border-color); border-radius: 8px; padding: 0.9rem 1rem; background: var(--bg-primary); color: var(--text-primary); font: inherit; }
        button { border: none; cursor: pointer; height: 48px; }
        .message { text-align: center; margin-top: 1rem; color: #dc2626; font-weight: 700; }
        .result { max-width: 900px; margin: 2rem auto 0; padding: 1.5rem; border-radius: 8px; }
        .result-head { display: flex; justify-content: space-between; gap: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; }
        .result-head span { display: block; color: var(--text-secondary); font-size: 0.85rem; }
        .result-head strong { font-size: 1.2rem; }
        .steps { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.75rem; margin: 2rem 0; }
        .step { text-align: center; color: var(--text-secondary); }
        .step span { width: 34px; height: 34px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: var(--bg-primary); border: 1px solid var(--border-color); font-weight: 800; margin-bottom: 0.5rem; }
        .step.active span { background: var(--primary-color); border-color: var(--primary-color); color: white; }
        .step.active p { color: var(--text-primary); font-weight: 800; }
        .items div { display: flex; justify-content: space-between; border-top: 1px solid var(--border-color); padding: 0.75rem 0; }
        @media (max-width: 760px) { .track-form { grid-template-columns: 1fr; } .steps { grid-template-columns: 1fr; text-align: left; } .step { display: flex; align-items: center; gap: 0.75rem; text-align: left; } .step span { margin-bottom: 0; } }
      `}</style>
    </section>
  );
}
