'use client';

import { FormEvent, useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { OrderRecord } from '@/types/cms';
import { useAuth } from '@/frontend/customer/hooks/useAuth';
import { useCustomerOrders } from '@/frontend/customer/hooks/useCustomerOrders';
import { trackOrder } from '@/utils/api';
import { formatCurrency } from '../utils/commerce';
import ProductImage from './ProductImage';
import CustomerPageHeader from './CustomerPageHeader';

const deliverySteps: Array<{ status: OrderRecord['status']; label: string; desc: string }> = [
  { status: 'Pending', label: 'Order Placed', desc: 'We received your request.' },
  { status: 'Confirmed', label: 'Confirmed', desc: 'Your order is verified.' },
  { status: 'Processing', label: 'Processing', desc: 'Your order is being packed.' },
  { status: 'Dispatched', label: 'Dispatched', desc: 'Your order has left our unit.' },
  { status: 'Out for Delivery', label: 'Out for Delivery', desc: 'A delivery partner is nearby.' },
  { status: 'Delivered', label: 'Delivered', desc: 'Delivered successfully.' },
];

const statusCopy: Record<OrderRecord['status'], { title: string; detail: string; estimate: string }> = {
  Pending: {
    title: 'Order Placed',
    detail: 'Your order has been received and is waiting for confirmation.',
    estimate: 'Confirmation shortly',
  },
  Confirmed: {
    title: 'Confirmed',
    detail: 'Your order is confirmed and ready for preparation.',
    estimate: 'Processing shortly',
  },
  Processing: {
    title: 'Processing',
    detail: 'Your order is currently being packed.',
    estimate: 'Today before 8 PM',
  },
  Dispatched: {
    title: 'Dispatched',
    detail: 'Your order has been dispatched from the NIMRA unit.',
    estimate: 'On the way',
  },
  'Out for Delivery': {
    title: 'Out for Delivery',
    detail: 'Your delivery partner is bringing the order to your address.',
    estimate: 'Arriving soon',
  },
  Delivered: {
    title: 'Delivered',
    detail: 'Your order has been delivered successfully.',
    estimate: 'Completed',
  },
  Cancelled: {
    title: 'Cancelled',
    detail: 'This order has been cancelled.',
    estimate: 'No dispatch scheduled',
  },
};

const formatDate = (value?: string) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const statusSlug = (status?: string) => String(status || 'pending').toLowerCase().replace(/[^a-z0-9]+/g, '-');

const Icon = ({ name }: { name: 'route' | 'package' | 'phone' | 'search' | 'check' | 'clock' | 'truck' | 'alert' | 'receipt' | 'spark' }) => {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (name) {
    case 'route':
      return <svg {...common}><circle cx="6" cy="19" r="3" /><circle cx="18" cy="5" r="3" /><path d="M9 19h3.5a4.5 4.5 0 0 0 0-9H11a4.5 4.5 0 0 1 0-9h4" /></svg>;
    case 'package':
      return <svg {...common}><path d="m21 8-9-5-9 5 9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></svg>;
    case 'phone':
      return <svg {...common}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.91.33 1.8.62 2.65a2 2 0 0 1-.45 2.11L8 9.76a16 16 0 0 0 6.24 6.24l1.28-1.28a2 2 0 0 1 2.11-.45c.85.29 1.74.5 2.65.62A2 2 0 0 1 22 16.92Z" /></svg>;
    case 'search':
      return <svg {...common}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
    case 'check':
      return <svg {...common}><path d="M20 6 9 17l-5-5" /></svg>;
    case 'clock':
      return <svg {...common}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>;
    case 'truck':
      return <svg {...common}><path d="M10 17h4V5H2v12h3" /><path d="M14 8h4l4 4v5h-3" /><circle cx="7.5" cy="17.5" r="2.5" /><circle cx="16.5" cy="17.5" r="2.5" /></svg>;
    case 'alert':
      return <svg {...common}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>;
    case 'receipt':
      return <svg {...common}><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" /><path d="M8 8h8" /><path d="M8 12h8" /><path d="M8 16h5" /></svg>;
    case 'spark':
      return <svg {...common}><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" /></svg>;
  }
};

export default function TrackClient() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { orders: customerOrders } = useCustomerOrders();
  const [orderId, setOrderId] = useState(params.get('orderId') || '');
  const [mobile, setMobile] = useState(params.get('mobile') || user?.Mobile || '');
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const mobileValue = mobile || user?.Mobile || '';

  useEffect(() => {
    const requestedOrderId = params.get('orderId')?.trim() || '';
    const selectedOrder = requestedOrderId
      ? customerOrders.find((item) => item.orderId === requestedOrderId)
      : customerOrders[0];
    const nextOrderId = requestedOrderId || selectedOrder?.orderId || '';
    const nextMobile = selectedOrder?.customer?.mobile || params.get('mobile') || user?.Mobile || '';

    if (nextOrderId && nextOrderId !== orderId) setOrderId(nextOrderId);
    if (nextMobile && nextMobile !== mobile) setMobile(nextMobile);
  }, [customerOrders, params, user?.Mobile, orderId, mobile]);

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

  const hasAutoSubmitted = useRef(false);

  useEffect(() => {
    if (params.get('autoSubmit') === 'true' && user && !hasAutoSubmitted.current) {
      hasAutoSubmitted.current = true;
      submit();

      const url = new URL(window.location.href);
      url.searchParams.delete('autoSubmit');
      window.history.replaceState({}, '', url.toString());
    }
  }, [user, params, submit]);

  const items = order?.items || [];
  const productCount = items.reduce((count, item) => count + Number(item.quantity || 0), 0);
  const currentIndex = order ? deliverySteps.findIndex((step) => step.status === order.status) : -1;
  const isCancelled = order?.status === 'Cancelled';
  const timelineSteps = isCancelled
    ? [...deliverySteps, { status: 'Cancelled' as const, label: 'Cancelled', desc: 'Order cancelled.' }]
    : deliverySteps;
  const timelineIndex = isCancelled ? timelineSteps.length - 1 : currentIndex;
  const progress = timelineIndex <= 0 ? 0 : (timelineIndex / (timelineSteps.length - 1)) * 100;
  const subtotal = Number(order?.subtotal || 0);
  const deliveryCharge = Number(order?.deliveryCharge || 0);
  const total = Number(order?.total || 0);
  const discount = Math.max(0, subtotal + deliveryCharge - total);
  const displayedOrderId = order?.orderId || orderId;
  const displayedMobile = order?.customer?.mobile || mobileValue;

  return (
    <section className="track-page">
      <div className="track-bg" aria-hidden="true">
        <span className="glow glow-one" />
        <span className="glow glow-two" />
        <span className="route-line route-line-one" />
        <span className="route-line route-line-two" />
        {Array.from({ length: 9 }, (_, index) => <i key={index} />)}
      </div>

      <div className="track-shell">
        <CustomerPageHeader
          badge="TRACK ORDER"
          title="Track Your NIMRA Delivery"
          subtitle="Enter your Order ID and registered mobile number to track your order in real time."
        />

        <div className={`tracking-flow ${order ? 'has-result' : ''} ${loading ? 'is-searching' : ''}`}>
          <form className="track-form premium-card search-card" onSubmit={submit}>
            <label className="field-group">
              <span>Order ID</span>
              <div className="input-shell">
                <Icon name="package" />
                <input
                  required
                  value={displayedOrderId}
                  onChange={(event) => {
                    if (!user) setOrderId(event.target.value);
                  }}
                  placeholder="NIMRA-..."
                  readOnly={Boolean(user)}
                  aria-readonly={Boolean(user)}
                  disabled={loading || authLoading}
                />
              </div>
            </label>

            <label className="field-group">
              <span>Mobile Number</span>
              <div className="input-shell">
                <Icon name="phone" />
                <input
                  inputMode="numeric"
                  maxLength={10}
                  value={displayedMobile}
                  onChange={(event) => {
                    if (!user) setMobile(event.target.value.replace(/\D/g, ''));
                  }}
                  placeholder="Registered mobile number"
                  readOnly={Boolean(user)}
                  aria-readonly={Boolean(user)}
                  disabled={loading || authLoading}
                />
              </div>
            </label>

            <button className="track-button" disabled={loading}>
              {loading ? <span className="spinner" /> : <Icon name="search" />}
              <span>{loading ? 'Searching...' : 'Track Order'}</span>
            </button>
          </form>

          {loading && (
            <div className="loading-dashboard premium-card" aria-live="polite">
              <div className="skeleton-card wide" />
              <div className="skeleton-row">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}

          {!loading && message && (
            <div className="notice-card premium-card error-card animate-slide-up" role="alert">
              <div className="notice-icon"><Icon name="alert" /></div>
              <div>
                <h2>We could not find that order</h2>
                <p>{message}</p>
              </div>
              <button type="button" className="retry-button" onClick={() => submit()}>
                Retry
              </button>
            </div>
          )}

          {!loading && !order && !message && (
            <div className="empty-card premium-card animate-slide-up">
              <div className="empty-orbit">
                <span><Icon name="package" /></span>
              </div>
              <h2>Track your order instantly</h2>
              <p>Enter your Order ID and registered mobile number to view live delivery updates.</p>
            </div>
          )}

          {!loading && order && (
            <div className="results-dashboard animate-slide-up">
              <section className="premium-card order-info-card">
                <div className="card-heading">
                  <div>
                    <span className="eyebrow">Order Information</span>
                    <h2>Order Summary</h2>
                  </div>
                  <span className={`status-pill ${statusSlug(order.status)}`}>{order.status}</span>
                </div>

                <div className="info-grid">
                  <div>
                    <span>Order ID</span>
                    <strong>{order.orderId}</strong>
                  </div>
                  <div>
                    <span>Order Date</span>
                    <strong>{formatDate(order.createdAt)}</strong>
                  </div>
                  <div>
                    <span>Products</span>
                    <strong>{productCount || items.length}</strong>
                  </div>
                  <div>
                    <span>Payment Status</span>
                    <strong>{order.paymentMethod || 'Payment Successful'}</strong>
                  </div>
                  <div>
                    <span>Delivery Type</span>
                    <strong>{deliveryCharge > 0 ? 'Standard Delivery' : 'Complimentary Delivery'}</strong>
                  </div>
                  <div>
                    <span>Total</span>
                    <strong className="amount">{formatCurrency(total)}</strong>
                  </div>
                </div>
              </section>

              <section className="premium-card timeline-card">
                <div className="card-heading">
                  <div>
                    <span className="eyebrow">Live Progress</span>
                    <h2>Delivery Timeline</h2>
                  </div>
                  <span className="progress-percent">{Math.round(progress)}%</span>
                </div>

                <div className={`timeline ${isCancelled ? 'timeline-cancelled' : ''}`}>
                  <div className="timeline-track">
                    <span style={{ width: `${progress}%` }} />
                  </div>
                  {timelineSteps.map((step, index) => {
                    const completed = !isCancelled && timelineIndex > index;
                    const current = timelineIndex === index;
                    const cancelledStep = step.status === 'Cancelled';
                    return (
                      <div
                        key={step.status}
                        className={`timeline-step ${completed ? 'completed' : ''} ${current ? 'current' : ''} ${cancelledStep ? 'cancelled' : ''}`}
                      >
                        <span className="step-dot">
                          {completed ? <Icon name="check" /> : current ? <span className="inner-pulse" /> : null}
                        </span>
                        <strong>{step.label}</strong>
                        <p>{step.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </section>

              <div className="detail-grid">
                <section className="premium-card products-card">
                  <div className="card-heading">
                    <div>
                      <span className="eyebrow">Products</span>
                      <h2>Ordered Items</h2>
                    </div>
                    <span className="item-count">{items.length}</span>
                  </div>

                  <div className="product-grid">
                    {items.map((item, index) => {
                      const quantity = Number(item.quantity || 1);
                      const price = Number(item.price || 0);
                      return (
                        <article key={`${item.productId || item.name || 'item'}-${index}`} className="product-track-card">
                          <div className="product-thumb">
                            <ProductImage src={item.imageUrl} alt={item.name || 'Order item'} />
                          </div>
                          <div className="product-copy">
                            <h3>{item.name || 'NIMRA Product'}</h3>
                            <p>{[item.category, item.volume].filter(Boolean).join(' | ') || 'Packaged water'}</p>
                            <div className="product-meta">
                              <span>Qty {quantity}</span>
                              <span>{formatCurrency(price)}</span>
                            </div>
                          </div>
                          <strong>{formatCurrency(price * quantity)}</strong>
                        </article>
                      );
                    })}
                  </div>
                </section>

                <aside className="premium-card pricing-card">
                  <div className="card-heading compact">
                    <div>
                      <span className="eyebrow">Billing</span>
                      <h2>Order Summary</h2>
                    </div>
                    <Icon name="receipt" />
                  </div>

                  <div className="price-list">
                    <div><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
                    <div><span>Delivery</span><strong>{deliveryCharge ? formatCurrency(deliveryCharge) : 'Free'}</strong></div>
                    <div><span>Tax</span><strong>Included</strong></div>
                    <div><span>Discount</span><strong>{discount ? `-${formatCurrency(discount)}` : formatCurrency(0)}</strong></div>
                    <div className="grand-total"><span>Grand Total</span><strong>{formatCurrency(total)}</strong></div>
                  </div>

                  <div className="status-notifications">
                    <span><Icon name="check" /> Payment Successful</span>
                    <span><Icon name="spark" /> {statusCopy[order.status].title}</span>
                  </div>
                </aside>
              </div>

            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .track-page {
          --track-bg: #f8fbff;
          --track-card-bg: rgba(255, 255, 255, 0.72);
          --track-card-bg-strong: rgba(255, 255, 255, 0.84);
          --track-card-border: rgba(59, 130, 246, 0.18);
          --track-card-border-strong: rgba(59, 130, 246, 0.34);
          --track-text: #0f172a;
          --track-heading: #0b2f66;
          --track-muted: #64748b;
          --track-soft: rgba(219, 234, 254, 0.55);
          --track-soft-strong: rgba(219, 234, 254, 0.82);
          --track-input-bg: rgba(255, 255, 255, 0.72);
          --track-input-border: rgba(59, 130, 246, 0.18);
          --track-placeholder: #64748b;
          --track-accent: #2563eb;
          --track-accent-2: #38bdf8;
          --track-danger: #dc2626;
          --track-danger-soft: rgba(254, 226, 226, 0.82);
          --track-success: #047857;
          --track-success-soft: rgba(209, 250, 229, 0.72);
          --track-route: rgba(37, 99, 235, 0.2);
          --track-particle: rgba(37, 99, 235, 0.28);
          --track-shadow: 0 16px 42px rgba(15, 23, 42, 0.08);
          --track-shadow-hover: 0 22px 52px rgba(37, 99, 235, 0.13);
          --track-input-shadow: 0 6px 18px rgba(37, 99, 235, 0.10);
          --track-active-shadow: 0 0 0 6px rgba(37, 99, 235, 0.10), 0 12px 26px rgba(37, 99, 235, 0.20);
          --track-active-shadow-strong: 0 0 0 10px rgba(37, 99, 235, 0.06), 0 16px 34px rgba(37, 99, 235, 0.24);
          --track-radius: 20px;
          --track-duration: 300ms;
          position: relative;
          isolation: isolate;
          min-height: calc(100vh - 5rem);
          padding: clamp(0.45rem, 1.1vw, 0.9rem) 0 clamp(2rem, 4vw, 3.5rem);
          overflow: hidden;
          font-family: var(--font-body);
          background: var(--track-bg);
          color: var(--track-text);
        }

        .track-page,
        .track-page *,
        .track-page *::before,
        .track-page *::after {
          transition:
            background-color var(--track-duration) ease,
            background-image var(--track-duration) ease,
            border-color var(--track-duration) ease,
            box-shadow var(--track-duration) ease,
            color var(--track-duration) ease,
            fill var(--track-duration) ease,
            stroke var(--track-duration) ease;
        }

        .track-bg {
          position: absolute;
          inset: 0;
          z-index: -1;
          overflow: hidden;
          background:
            radial-gradient(circle at 18% 14%, var(--track-glow-one, rgba(37, 99, 235, 0.14)), transparent 30rem),
            radial-gradient(circle at 82% 18%, var(--track-glow-two, rgba(14, 165, 233, 0.09)), transparent 26rem),
            radial-gradient(circle at 50% 100%, var(--track-glow-three, rgba(96, 165, 250, 0.10)), transparent 26rem);
        }

        .track-bg::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(circle, var(--track-dot, rgba(37, 99, 235, 0.12)) 1px, transparent 1px),
            linear-gradient(90deg, var(--track-grid, rgba(96, 165, 250, 0.05)) 1px, transparent 1px);
          background-size: 30px 30px, 54px 54px;
          mask-image: radial-gradient(circle at 50% 36%, black, transparent 72%);
        }

        .glow {
          position: absolute;
          border-radius: 999px;
          filter: blur(26px);
          opacity: 0.62;
        }

        .glow-one {
          top: 5%;
          left: 6%;
          width: 10rem;
          height: 10rem;
          background: var(--track-glow-one, rgba(59, 130, 246, 0.22));
        }

        .glow-two {
          right: 8%;
          bottom: 8%;
          width: 14rem;
          height: 14rem;
          background: var(--track-glow-two, rgba(14, 165, 233, 0.16));
        }

        .route-line {
          position: absolute;
          width: 26rem;
          height: 8rem;
          border: 1px dashed var(--track-route);
          border-left: 0;
          border-bottom: 0;
          border-radius: 999px 999px 0 0;
          opacity: 0.55;
        }

        .route-line-one {
          top: 8rem;
          right: 8%;
          transform: rotate(-9deg);
        }

        .route-line-two {
          bottom: 8rem;
          left: 4%;
          transform: rotate(168deg);
        }

        .track-bg i {
          position: absolute;
          width: 0.32rem;
          height: 0.32rem;
          border-radius: 999px;
          background: var(--track-particle);
          animation: floatParticle 8s ease-in-out infinite;
        }

        .track-bg i:nth-child(5) { top: 17%; left: 18%; animation-delay: -1s; }
        .track-bg i:nth-child(6) { top: 26%; right: 20%; animation-delay: -2s; }
        .track-bg i:nth-child(7) { top: 54%; left: 12%; animation-delay: -3s; }
        .track-bg i:nth-child(8) { top: 72%; right: 14%; animation-delay: -4s; }
        .track-bg i:nth-child(9) { top: 38%; left: 46%; animation-delay: -5s; }
        .track-bg i:nth-child(10) { top: 84%; left: 36%; animation-delay: -6s; }
        .track-bg i:nth-child(11) { top: 14%; right: 38%; animation-delay: -7s; }
        .track-bg i:nth-child(12) { top: 63%; right: 42%; animation-delay: -8s; }
        .track-bg i:nth-child(13) { top: 44%; right: 7%; animation-delay: -9s; }

        .track-shell {
          width: min(94%, 1360px);
          margin: 0 auto;
        }

        .tracking-flow {
          display: grid;
          gap: clamp(1.15rem, 1.8vw, 1.65rem);
        }

        .tracking-flow.has-result .track-form,
        .tracking-flow.is-searching .track-form {
          transform: translateY(-4px);
        }

        .track-form {
          display: grid;
          grid-template-columns: minmax(16rem, 1fr) minmax(16rem, 1fr) auto;
          gap: 0.9rem;
          align-items: end;
          transition: transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .search-card {
          width: min(100%, 900px);
          margin-inline: auto;
          padding: clamp(1.2rem, 1.9vw, 1.8rem);
        }

        .field-group {
          display: grid;
          gap: 0.42rem;
          min-width: 0;
        }

        .field-group > span {
          color: var(--track-muted);
          font-size: 0.76rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .input-shell {
          position: relative;
          display: flex;
          align-items: center;
          min-height: 58px;
          border: 1px solid var(--track-input-border);
          border-radius: 16px;
          background: var(--track-input-bg);
          box-shadow: var(--track-input-shadow);
          color: var(--track-accent);
          transition: border-color 240ms ease, box-shadow 240ms ease, background 240ms ease, transform 240ms ease;
        }

        .input-shell:focus-within {
          border-color: var(--track-accent);
          background: var(--track-input-bg-focus, rgba(255, 255, 255, 0.88));
          box-shadow: var(--track-input-shadow);
        }

        .input-shell :global(svg) {
          position: absolute;
          left: 1.6rem;
          width: 1.05rem;
          height: 1.05rem;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
        }

        .input-shell input {
          width: 100%;
          height: 100%;
          min-height: 58px;
          padding: 0.9rem 1rem 0.9rem 3.65rem;
          border: 0 !important;
          border-radius: inherit !important;
          outline: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
          color: var(--track-text) !important;
          font: inherit;
          font-size: 0.95rem;
          font-weight: 650;
        }

        .input-shell input:focus,
        .input-shell input:focus-visible {
          border: 0 !important;
          outline: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
        }

        .input-shell input::placeholder {
          color: var(--track-placeholder);
          font-weight: 500;
        }

        .input-shell input:disabled {
          cursor: progress;
          opacity: 0.72;
        }

        .input-shell input[readonly] {
          cursor: default;
        }

        .track-button {
          min-height: 58px;
          min-width: 10.8rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.55rem;
          padding: 0 1.45rem;
          border: 1px solid rgba(191, 219, 254, 0.4);
          border-radius: 999px;
          color: white;
          background: linear-gradient(135deg, var(--track-button-start, #1d4ed8), var(--track-accent) 52%, var(--track-accent-2));
          box-shadow: 0 16px 34px rgba(37, 99, 235, 0.3);
          font: inherit;
          font-size: 0.92rem;
          font-weight: 850;
          cursor: pointer;
          transition: transform 250ms ease, box-shadow 250ms ease, filter 250ms ease;
        }

        .track-button:hover:not(:disabled) {
          transform: translateY(-3px);
          filter: brightness(1.06);
          box-shadow: 0 20px 44px rgba(37, 99, 235, 0.38);
        }

        .track-button:disabled {
          cursor: progress;
          opacity: 0.82;
        }

        .spinner {
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-top-color: white;
          border-radius: 999px;
          animation: spin 800ms linear infinite;
        }

        .empty-card,
        .notice-card,
        .loading-dashboard,
        .results-dashboard {
          margin-top: 0;
        }

        .empty-card {
          min-height: 210px;
          display: grid;
          place-items: center;
          gap: 0.5rem;
          padding: clamp(1.25rem, 3vw, 2rem);
          text-align: center;
          border: 1px solid rgba(96, 165, 250, 0.34);
          border-radius: 22px;
          background:
            radial-gradient(circle at 50% 18%, rgba(59, 130, 246, 0.11), transparent 42%),
            rgba(255, 255, 255, 0.4);
        }

        .empty-orbit {
          width: 4.5rem;
          height: 4.5rem;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: conic-gradient(from 180deg, rgba(37, 99, 235, 0.18), rgba(14, 165, 233, 0.02), rgba(37, 99, 235, 0.18));
          animation: softRotate 8s linear infinite;
        }

        .empty-orbit span {
          width: 3.45rem;
          height: 3.45rem;
          display: grid;
          place-items: center;
          border-radius: 999px;
          color: var(--track-accent);
          background: var(--track-card-bg-strong);
          box-shadow: 0 12px 26px rgba(37, 99, 235, 0.14);
          animation: softRotate 8s linear infinite reverse;
        }

        .empty-card h2,
        .notice-card h2 {
          margin-top: 0.2rem;
          font-size: clamp(1.1rem, 1rem + 0.7vw, 1.45rem);
          font-weight: 850;
          letter-spacing: 0;
        }

        .empty-card p,
        .notice-card p {
          max-width: 420px;
          color: var(--track-muted);
          line-height: 1.55;
        }

        .notice-card {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 1rem;
          align-items: center;
          padding: 1rem;
          border: 1px solid rgba(248, 113, 113, 0.26);
          border-radius: var(--track-radius);
          background:
            radial-gradient(circle at 0% 0%, rgba(248, 113, 113, 0.1), transparent 38%),
            var(--track-card-bg);
          box-shadow: var(--track-shadow);
        }

        .notice-icon {
          width: 3rem;
          height: 3rem;
          display: grid;
          place-items: center;
          border-radius: 999px;
          color: var(--track-danger);
          background: var(--track-danger-soft);
          box-shadow: 0 10px 24px rgba(220, 38, 38, 0.12);
        }

        .retry-button {
          min-height: 2.75rem;
          padding: 0 1rem;
          border: 1px solid rgba(248, 113, 113, 0.36);
          border-radius: 999px;
          color: var(--track-danger);
          background: var(--track-card-bg-strong);
          font: inherit;
          font-weight: 800;
          cursor: pointer;
          transition: transform 220ms ease, box-shadow 220ms ease;
        }

        .retry-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(220, 38, 38, 0.12);
        }

        .loading-dashboard {
          display: grid;
          gap: 0.8rem;
          padding: clamp(1.25rem, 2.1vw, 2rem);
        }

        .skeleton-card,
        .skeleton-row span {
          border-radius: 18px;
          background: linear-gradient(90deg, rgba(255,255,255,0.35), rgba(219,234,254,0.72), rgba(255,255,255,0.35));
          background-size: 220% 100%;
          animation: shimmer 1.3s ease-in-out infinite;
        }

        .skeleton-card {
          height: 8rem;
        }

        .skeleton-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.8rem;
        }

        .skeleton-row span {
          height: 5rem;
        }

        .results-dashboard {
          display: grid;
          gap: clamp(1.25rem, 2vw, 1.8rem);
        }

        .premium-card {
          border: 1px solid var(--track-card-border);
          border-radius: var(--track-radius);
          background:
            linear-gradient(145deg, var(--track-card-bg-strong), var(--track-card-bg)),
            radial-gradient(circle at 0% 0%, var(--track-card-sheen, rgba(59,130,246,0.08)), transparent 40%);
          box-shadow: var(--track-shadow);
          backdrop-filter: blur(18px) saturate(145%);
          -webkit-backdrop-filter: blur(18px) saturate(145%);
          transition: transform 280ms ease, background 300ms ease, box-shadow 280ms ease, border-color 280ms ease;
        }

        .premium-card:hover {
          transform: translateY(-3px);
          border-color: var(--track-card-border-strong);
          box-shadow: var(--track-shadow-hover);
        }

        .order-info-card,
        .timeline-card,
        .products-card,
        .pricing-card {
          padding: clamp(1.5rem, 2.4vw, 2rem);
        }

        .card-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .card-heading.compact {
          margin-bottom: 0.75rem;
        }

        .eyebrow {
          display: block;
          color: var(--track-accent);
          font-size: 0.68rem;
          font-weight: 850;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .card-heading h2 {
          margin-top: 0.15rem;
          font-size: clamp(1.05rem, 0.98rem + 0.42vw, 1.35rem);
          font-weight: 850;
          letter-spacing: 0;
        }

        .status-pill,
        .progress-percent,
        .item-count {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 2rem;
          padding: 0.35rem 0.78rem;
          border-radius: 999px;
          border: 1px solid rgba(96, 165, 250, 0.34);
          color: var(--track-accent);
          background: var(--track-soft);
          font-size: 0.78rem;
          font-weight: 850;
        }

        .status-pill.delivered {
          color: var(--track-success);
          border-color: rgba(16, 185, 129, 0.32);
          background: var(--track-success-soft);
        }

        .status-pill.cancelled {
          color: var(--track-danger);
          border-color: rgba(248, 113, 113, 0.34);
          background: rgba(254, 226, 226, 0.72);
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 0.65rem;
        }

        .info-grid div {
          min-width: 0;
          padding: 0.82rem;
          border: 1px solid rgba(147, 197, 253, 0.22);
          border-radius: 16px;
          background: var(--track-inner-bg, rgba(255, 255, 255, 0.5));
        }

        .info-grid span,
        .price-list span {
          display: block;
          color: var(--track-muted);
          font-size: 0.72rem;
          font-weight: 750;
        }

        .info-grid strong {
          display: block;
          margin-top: 0.18rem;
          overflow: hidden;
          color: var(--track-text);
          font-size: 0.92rem;
          font-weight: 850;
          line-height: 1.25;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .info-grid strong.amount {
          color: var(--track-accent);
        }

        .timeline {
          position: relative;
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 0.7rem;
          padding-top: 0.25rem;
        }

        .timeline.timeline-cancelled {
          grid-template-columns: repeat(7, minmax(0, 1fr));
        }

        .timeline-track {
          position: absolute;
          top: 1.25rem;
          left: calc(100% / 12);
          right: calc(100% / 12);
          height: 3px;
          border-radius: 999px;
          background: var(--track-step-line, rgba(147, 197, 253, 0.34));
          overflow: hidden;
        }

        .timeline.timeline-cancelled .timeline-track {
          background: rgba(248, 113, 113, 0.22);
        }

        .timeline-track span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, var(--track-accent), var(--track-accent-2));
          transition: width 600ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .timeline.timeline-cancelled .timeline-track span {
          background: linear-gradient(90deg, #f87171, #dc2626);
        }

        .timeline-step {
          position: relative;
          z-index: 1;
          display: grid;
          justify-items: center;
          gap: 0.32rem;
          text-align: center;
          color: var(--track-muted);
        }

        .step-dot {
          width: 2.35rem;
          height: 2.35rem;
          display: grid;
          place-items: center;
          border: 1px solid var(--track-step-border, rgba(147, 197, 253, 0.42));
          border-radius: 999px;
          background: var(--track-step-bg, rgba(255, 255, 255, 0.78));
          box-shadow: 0 8px 18px rgba(15,23,42,0.07);
          color: var(--track-accent);
          transition: transform 280ms ease, box-shadow 280ms ease, background 280ms ease, border-color 280ms ease;
        }

        .timeline-step.completed .step-dot {
          color: white;
          border-color: var(--track-accent);
          background: linear-gradient(135deg, var(--track-accent), var(--track-accent-2));
          box-shadow: 0 10px 22px rgba(37, 99, 235, 0.26);
        }

        .timeline-step.current .step-dot {
          border-color: var(--track-accent);
          background: var(--track-soft-strong);
          box-shadow: var(--track-active-shadow, 0 0 0 6px rgba(37, 99, 235, 0.1), 0 12px 26px rgba(37, 99, 235, 0.2));
          animation: activePulse 2.4s ease-in-out infinite;
        }

        .timeline-step.cancelled .step-dot {
          color: var(--track-danger);
          border-color: rgba(220, 38, 38, 0.5);
          background: rgba(254, 226, 226, 0.9);
          box-shadow: 0 0 0 6px rgba(220, 38, 38, 0.08);
        }

        .inner-pulse {
          width: 0.72rem;
          height: 0.72rem;
          border-radius: 999px;
          background: var(--track-accent);
          box-shadow: 0 0 16px rgba(37, 99, 235, 0.8);
        }

        .timeline-step strong {
          color: var(--track-text);
          font-size: 0.8rem;
          font-weight: 850;
          line-height: 1.2;
        }

        .timeline-step p {
          max-width: 9rem;
          color: var(--track-muted);
          font-size: 0.68rem;
          line-height: 1.35;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: minmax(0, 7fr) minmax(20rem, 3fr);
          gap: clamp(1.25rem, 2vw, 1.8rem);
          align-items: start;
        }

        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
          gap: 0.75rem;
        }

        .product-track-card {
          display: grid;
          grid-template-columns: 4.25rem minmax(0, 1fr) auto;
          gap: 0.75rem;
          align-items: center;
          padding: 0.72rem;
          border: 1px solid rgba(147, 197, 253, 0.24);
          border-radius: 18px;
          background:
            linear-gradient(145deg, var(--track-card-bg-strong), var(--track-card-bg)),
            radial-gradient(circle at 0% 0%, var(--track-card-sheen, rgba(59,130,246,0.08)), transparent 48%);
          box-shadow: 0 8px 22px rgba(15, 23, 42, 0.05);
          transition: transform 240ms ease, box-shadow 240ms ease, border-color 240ms ease;
        }

        .product-track-card:hover {
          transform: translateY(-3px);
          border-color: rgba(59, 130, 246, 0.45);
          box-shadow: 0 16px 28px rgba(37, 99, 235, 0.12);
        }

        .product-thumb {
          width: 4.25rem;
          height: 5.35rem;
          overflow: hidden;
          border: 1px solid rgba(147, 197, 253, 0.28);
          border-radius: 14px;
          background: var(--product-image-bg);
        }

        .product-thumb :global(.product-image-container) {
          width: 100% !important;
          height: 100% !important;
          aspect-ratio: auto !important;
          background: transparent !important;
        }

        .product-copy {
          min-width: 0;
        }

        .product-copy h3 {
          display: -webkit-box;
          overflow: hidden;
          color: var(--track-text);
          font-size: 0.92rem;
          font-weight: 850;
          line-height: 1.22;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          line-clamp: 2;
        }

        .product-copy p {
          margin-top: 0.16rem;
          overflow: hidden;
          color: var(--track-muted);
          font-size: 0.74rem;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .product-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          margin-top: 0.45rem;
        }

        .product-meta span {
          display: inline-flex;
          align-items: center;
          min-height: 1.5rem;
          padding: 0.16rem 0.5rem;
          border: 1px solid rgba(96, 165, 250, 0.25);
          border-radius: 999px;
          color: var(--track-accent);
          background: var(--track-soft);
          font-size: 0.68rem;
          font-weight: 800;
        }

        .product-track-card > strong {
          color: var(--track-accent);
          font-size: 0.94rem;
          white-space: nowrap;
        }

        .price-list {
          display: grid;
          gap: 0.2rem;
        }

        .price-list div {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.7rem 0;
          border-bottom: 1px solid rgba(147, 197, 253, 0.22);
        }

        .price-list div:last-child {
          border-bottom: 0;
        }

        .price-list strong {
          color: var(--track-text);
          font-size: 0.9rem;
          font-weight: 850;
          text-align: right;
        }

        .price-list .grand-total {
          margin-top: 0.15rem;
          padding: 0.85rem;
          border: 1px solid rgba(96, 165, 250, 0.28);
          border-radius: 16px;
          background: linear-gradient(135deg, var(--track-soft), var(--track-inner-bg, rgba(255,255,255,0.5)));
        }

        .price-list .grand-total strong {
          color: var(--track-accent);
          font-size: 1.1rem;
        }

        .status-notifications {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
          margin-top: 0.95rem;
        }

        .status-notifications span {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          min-height: 1.8rem;
          padding: 0.26rem 0.58rem;
          border: 1px solid rgba(16, 185, 129, 0.24);
          border-radius: 999px;
          color: var(--track-success);
          background: var(--track-success-soft);
          font-size: 0.7rem;
          font-weight: 800;
        }

        .status-notifications span:last-child {
          color: var(--track-accent);
          border-color: rgba(96, 165, 250, 0.28);
          background: var(--track-soft);
        }

        @keyframes floatParticle {
          0%, 100% { transform: translate3d(0, 0, 0); opacity: 0.3; }
          50% { transform: translate3d(0, -14px, 0); opacity: 0.8; }
        }

        @keyframes softRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes activePulse {
          0%, 100% { transform: translateY(0); box-shadow: var(--track-active-shadow); }
          50% { transform: translateY(-2px); box-shadow: var(--track-active-shadow-strong, var(--track-active-shadow)); }
        }

        @media (max-width: 1040px) {
          .track-form,
          .detail-grid {
            grid-template-columns: 1fr;
          }

          .track-button {
            width: 100%;
          }

          .info-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

        }

        @media (max-width: 760px) {
          .track-page {
            padding-top: 0.55rem;
          }

          .search-card,
          .order-info-card,
          .timeline-card,
          .products-card,
          .pricing-card {
            padding: 1.15rem;
          }

          .info-grid {
            grid-template-columns: 1fr 1fr;
          }

          .timeline,
          .timeline.timeline-cancelled {
            grid-template-columns: 1fr;
            gap: 0.8rem;
            padding-left: 0.15rem;
          }

          .timeline-track {
            top: 1.1rem;
            bottom: 1.1rem;
            left: 1.08rem;
            right: auto;
            width: 3px;
            height: auto;
          }

          .timeline-track span {
            width: 100% !important;
            height: ${progress}%;
          }

          .timeline-step {
            min-height: 3.2rem;
            grid-template-columns: auto minmax(0, 1fr);
            justify-items: start;
            column-gap: 0.75rem;
            text-align: left;
          }

          .timeline-step strong {
            align-self: end;
            font-size: 0.86rem;
          }

          .timeline-step p {
            grid-column: 2;
            max-width: none;
          }

          .notice-card {
            grid-template-columns: 1fr;
            justify-items: start;
          }

          .retry-button {
            width: 100%;
          }

          .product-grid {
            grid-template-columns: 1fr;
          }

          .product-track-card {
            grid-template-columns: 3.6rem minmax(0, 1fr);
          }

          .product-thumb {
            width: 3.6rem;
            height: 4.6rem;
          }

          .product-track-card > strong {
            grid-column: 2;
          }
        }

        @media (max-width: 520px) {
          .track-shell {
            width: min(100% - 0.85rem, 1360px);
          }

          .input-shell,
          .input-shell input,
          .track-button {
            min-height: 56px;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .card-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .status-pill,
          .progress-percent,
          .item-count {
            align-self: flex-start;
          }

          .skeleton-row {
            grid-template-columns: 1fr;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .track-page *,
          .track-page *::before,
          .track-page *::after {
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.001ms !important;
          }
        }

        :global([data-theme="dark"]) .track-page {
          --track-bg: #07111f;
          --track-card-bg: rgba(12, 20, 35, 0.65);
          --track-card-bg-strong: rgba(15, 23, 42, 0.78);
          --track-card-border: rgba(255, 255, 255, 0.08);
          --track-card-border-strong: rgba(96, 165, 250, 0.28);
          --track-text: #f8fafc;
          --track-heading: #f8fafc;
          --track-muted: #cbd5e1;
          --track-soft: rgba(37, 99, 235, 0.18);
          --track-soft-strong: rgba(37, 99, 235, 0.30);
          --track-input-bg: rgba(15, 23, 42, 0.72);
          --track-input-bg-focus: rgba(15, 23, 42, 0.86);
          --track-input-border: rgba(255, 255, 255, 0.10);
          --track-placeholder: #94a3b8;
          --track-accent: #60a5fa;
          --track-accent-2: #38bdf8;
          --track-button-start: #2563eb;
          --track-danger: #f87171;
          --track-danger-soft: rgba(127, 29, 29, 0.34);
          --track-success: #34d399;
          --track-success-soft: rgba(6, 78, 59, 0.36);
          --track-route: rgba(96, 165, 250, 0.18);
          --track-particle: rgba(96, 165, 250, 0.28);
          --track-shadow: 0 20px 52px rgba(0, 0, 0, 0.34);
          --track-shadow-hover: 0 24px 60px rgba(37, 99, 235, 0.18), 0 18px 48px rgba(0, 0, 0, 0.34);
          --track-input-shadow: 0 6px 18px rgba(0, 0, 0, 0.24);
          --track-glow-one: rgba(37, 99, 235, 0.22);
          --track-glow-two: rgba(14, 165, 233, 0.16);
          --track-glow-three: rgba(59, 130, 246, 0.12);
          --track-dot: rgba(96, 165, 250, 0.12);
          --track-grid: rgba(96, 165, 250, 0.035);
          --track-card-sheen: rgba(59, 130, 246, 0.12);
          --track-inner-bg: rgba(15, 23, 42, 0.54);
          --track-step-bg: rgba(15, 23, 42, 0.82);
          --track-step-border: rgba(148, 163, 184, 0.26);
          --track-step-line: rgba(148, 163, 184, 0.18);
          --track-active-shadow: 0 0 0 6px rgba(96, 165, 250, 0.12), 0 12px 30px rgba(37, 99, 235, 0.30);
          --track-active-shadow-strong: 0 0 0 10px rgba(96, 165, 250, 0.08), 0 16px 38px rgba(37, 99, 235, 0.34);
        }

        :global([data-theme="dark"]) .empty-orbit span,
        :global([data-theme="dark"]) .step-dot {
          background: var(--track-step-bg);
        }
      `}</style>
    </section>
  );
}
