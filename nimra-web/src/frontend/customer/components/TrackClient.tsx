'use client';

import { FormEvent, useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { OrderRecord } from '@/types/cms';
import { useAuth } from '@/frontend/customer/hooks/useAuth';
import { trackOrder } from '@/utils/api';
import { formatCurrency } from '../utils/commerce';

const steps = ['Pending', 'Confirmed', 'Processing', 'Dispatched', 'Out for Delivery', 'Delivered', 'Cancelled'];

export default function TrackClient() {
  const params = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [orderId, setOrderId] = useState(params.get('orderId') || '');
  const [mobile, setMobile] = useState(params.get('mobile') || user?.Mobile || '');
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const mobileValue = mobile || user?.Mobile || '';

  const submit = useCallback(async (event?: FormEvent) => {
    if (event) event.preventDefault();
    if (!user) {
      let queryParams = new URLSearchParams();
      if (orderId.trim()) queryParams.set('orderId', orderId.trim());
      if (mobileValue.trim()) queryParams.set('mobile', mobileValue.trim());
      queryParams.set('autoSubmit', 'true');
      const nextPath = queryParams.toString() ? `/track?${queryParams.toString()}` : '/track';
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
  }, [user, orderId, mobileValue, router]);

  const activeIndex = order ? steps.indexOf(order.status) : -1;

  const hasAutoSubmitted = useRef(false);

  useEffect(() => {
    if (params.get('autoSubmit') === 'true' && user && !hasAutoSubmitted.current) {
      hasAutoSubmitted.current = true;
      submit();
      
      // Clean up the URL to remove autoSubmit
      const url = new URL(window.location.href);
      url.searchParams.delete('autoSubmit');
      window.history.replaceState({}, '', url.toString());
    }
  }, [user, params, submit]);

  return (
    <div className="track-page container">
      {/* Page Header */}
      <div className="page-header animate-slide-up">
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
      <style jsx>{`
        .track-page {
          padding-top: 0;
          padding-bottom: 2rem;
          font-family: var(--font-body);
        }

        /* ── Page Header ── */
        .page-header {
          margin-bottom: 0.75rem;
          padding-bottom: 0;
          text-align: center;
        }

        .page-header h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
          letter-spacing: -0.02em;
          color: var(--text-primary);
        }

        .badge {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 0.25rem 0.75rem;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }
        .badge-primary {
          background: rgba(37, 99, 235, 0.1);
          color: var(--primary-color);
          border: 1px solid rgba(37, 99, 235, 0.2);
        }
        .track-form { display: grid; grid-template-columns: 1fr 1fr auto; gap: 1rem; align-items: end; padding: 1.25rem; border-radius: var(--radius-lg); max-width: 900px; margin: 0 auto; background: var(--bg-primary); border: 1px solid rgba(150, 150, 150, 0.15); box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); }
        label { display: grid; gap: 0.35rem; color: var(--text-primary); font-weight: 600; font-size: 0.8rem; }
        input { border: 1px solid rgba(150, 150, 150, 0.25); border-radius: var(--radius-md); padding: 0.65rem 0.85rem; height: 42px; background: var(--bg-secondary); color: var(--text-primary); font-family: var(--font-body); font-size: 0.9rem; transition: all var(--transition-fast); }
        input:focus { outline: none; border-color: var(--primary-color); box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.12); }
        button { border: none; cursor: pointer; height: 42px; display: inline-flex; align-items: center; justify-content: center; }
        .message { text-align: center; margin-top: 1rem; color: #dc2626; font-weight: 700; font-size: 0.9rem; }
        .result { max-width: 900px; margin: 1.5rem auto 0; padding: 1.25rem; border-radius: var(--radius-lg); background: var(--bg-primary); border: 1px solid rgba(150, 150, 150, 0.15); box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); }
        .result-head { display: flex; justify-content: space-between; gap: 1rem; border-bottom: 1px solid rgba(150, 150, 150, 0.15); padding-bottom: 0.75rem; }
        .result-head span { display: block; color: var(--text-muted); font-size: 0.8rem; font-weight: 600; margin-bottom: 0.2rem; }
        .result-head strong { font-size: 1.1rem; }
        .steps { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.5rem; margin: 1.5rem 0; }
        .step { text-align: center; color: var(--text-secondary); font-size: 0.8rem; transition: all var(--transition-normal); }
        .step span { width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: var(--bg-secondary); border: 1px solid rgba(150, 150, 150, 0.25); font-weight: 700; margin-bottom: 0.4rem; transition: all var(--transition-normal); }
        .step.active span { background: var(--primary-color); border-color: var(--primary-color); color: white; box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.1); }
        .step.active p { color: var(--text-primary); font-weight: 700; }
        .step.cancelled span { background: #ef4444; border-color: #ef4444; color: white; box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1); }
        .step.cancelled p { color: #ef4444; font-weight: 700; }
        .items div { display: flex; justify-content: space-between; border-top: 1px solid rgba(150, 150, 150, 0.15); padding: 0.65rem 0; font-size: 0.9rem; }
        @media (max-width: 760px) { .track-form { grid-template-columns: 1fr; gap: 1.25rem; } .steps { grid-template-columns: 1fr; text-align: left; } .step { display: flex; align-items: center; gap: 0.75rem; text-align: left; } .step span { margin-bottom: 0; } button { width: 100%; } }
      `}</style>
    </div>
  );
}
