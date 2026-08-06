'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { OrderRecord } from '@/types/cms';
import { formatCurrency } from '../../utils/commerce';
import ProductImage from '../ProductImage';

interface TimelineStep {
  key: string;
  label: string;
  desc: string;
  completed: boolean;
  active: boolean;
  isError?: boolean;
}

interface OrderDetailsModalProps {
  selectedOrder: OrderRecord;
  setSelectedOrder: (order: OrderRecord | null) => void;
  handleReorder: (order: OrderRecord) => void;
  setOrderToCancel: (order: OrderRecord) => void;
  getTimelineSteps: (status: string) => TimelineStep[];
  formatDate: (date?: string) => string;
}

const ModalIcon = ({ name }: { name: 'package' | 'status' | 'calendar' | 'payment' | 'user' | 'total' | 'location' | 'phone' | 'track' }) => {
  const common = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  const paths = {
    package: <><path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/></>,
    status: <><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    payment: <><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h2"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    total: <><path d="M7 5h10M7 9h10M8 5c5 0 5 7 0 7l8 7M7 12h4"/></>,
    location: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></>,
    phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.4 2.1L8 9.8A16 16 0 0 0 14.2 16l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.7.6A2 2 0 0 1 22 16.9Z"/>,
    track: <><path d="M5 12h14M13 6l6 6-6 6"/><circle cx="5" cy="12" r="2"/></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
};

export default function OrderDetailsModal({
  selectedOrder,
  setSelectedOrder,
  handleReorder,
  setOrderToCancel,
  getTimelineSteps,
  formatDate,
}: OrderDetailsModalProps) {
  const router = useRouter();
  const [itemsExpanded, setItemsExpanded] = React.useState(() => typeof window !== 'undefined' && !window.matchMedia('(max-width: 768px)').matches);
  const [addressExpanded, setAddressExpanded] = React.useState(() => typeof window !== 'undefined' && !window.matchMedia('(max-width: 768px)').matches);
  const [orderIdCopied, setOrderIdCopied] = React.useState(false);

  const copyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(selectedOrder.orderId);
      setOrderIdCopied(true);
      window.setTimeout(() => setOrderIdCopied(false), 1600);
    } catch {
      // The complete ID remains available through the button title if clipboard access is unavailable.
    }
  };
  React.useEffect(() => {
    const body = document.body;
    const root = document.documentElement;
    const scrollY = window.scrollY;
    const isMobileViewport = window.matchMedia('(max-width: 768px)').matches;
    const previousBodyStyles = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };
    const previousRootOverflow = root.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedOrder(null);
    };

    root.classList.add('order-details-modal-open');
    body.classList.add('order-details-modal-open');
    root.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    if (isMobileViewport) {
      body.style.position = 'fixed';
      body.style.top = `-${scrollY}px`;
      body.style.width = '100%';
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      root.classList.remove('order-details-modal-open');
      body.classList.remove('order-details-modal-open');
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBodyStyles.overflow;
      body.style.position = previousBodyStyles.position;
      body.style.top = previousBodyStyles.top;
      body.style.width = previousBodyStyles.width;
      window.removeEventListener('keydown', handleKeyDown);
      if (isMobileViewport) window.scrollTo(0, scrollY);
    };
  }, [setSelectedOrder]);

  if (!selectedOrder) return null;
  if (typeof document === 'undefined') return null;

  const rawOrder = selectedOrder as unknown as Record<string, unknown>;
  const customer = selectedOrder.customer || {};
  const firstText = (...values: unknown[]) =>
    values.map((value) => String(value ?? '').trim()).find(Boolean) || '';
  const customerName = firstText(
    customer.name,
    rawOrder.customerName,
    rawOrder.CustomerName,
    rawOrder.name,
    rawOrder.Name,
  );
  const customerMobile = firstText(
    customer.mobile,
    rawOrder.customerMobile,
    rawOrder.CustomerMobile,
    rawOrder.mobile,
    rawOrder.Mobile,
    rawOrder.phone,
    rawOrder.Phone,
  );
  const items = Array.isArray(selectedOrder.items) ? selectedOrder.items : [];
  const status = String(selectedOrder.status || 'Pending');
  const addressParts = [
    firstText(customer.flatNo, rawOrder.flatNo, rawOrder.FlatNo),
    firstText(customer.buildingName, rawOrder.buildingName, rawOrder.BuildingName),
    firstText(customer.locality, rawOrder.locality, rawOrder.Locality),
    firstText(customer.city, rawOrder.city, rawOrder.City),
    firstText(customer.state, rawOrder.state, rawOrder.State),
  ].filter(Boolean);
  const completeAddress = addressParts.length
    ? addressParts.join(', ')
    : firstText(customer.address, rawOrder.deliveryAddress, rawOrder.DeliveryAddress, rawOrder.address, rawOrder.Address);
  const customerPincode = firstText(customer.pincode, rawOrder.pincode, rawOrder.Pincode, rawOrder.PinCode);

  return createPortal(
    <div className="order-details-overlay" onClick={() => setSelectedOrder(null)}>
      <div
        className="order-details-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Order details for ${selectedOrder.orderId}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-title-header">
          <button type="button" className="close-modal-btn top-right" onClick={() => setSelectedOrder(null)} aria-label="Close order details">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>

          <span className="order-modal-label">Order Details</span>
          <div className="order-modal-title-row">
            <h2>
              <button type="button" className="order-id-copy" onClick={copyOrderId} title={`Copy full Order ID: ${selectedOrder.orderId || 'N/A'}`} aria-label={`Copy full Order ID ${selectedOrder.orderId || 'N/A'}`}>
                #{selectedOrder.orderId || 'N/A'}
              </button>
            </h2>
            <span className={`order-header-status status-${status.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>{status}</span>
            {orderIdCopied && <span className="order-id-copied" role="status">Copied</span>}
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-details">
            {([
              ['calendar', 'Date & Time', formatDate(selectedOrder.createdAt), ''],
              ['payment', 'Payment Method', selectedOrder.paymentMethod || 'COD', ''],
              ['user', 'Customer', customerName || 'N/A', ''],
              ['total', 'Order Total', formatCurrency(Number(selectedOrder.total || 0)), 'meta-value-price'],
            ] as const).map(([icon, label, value, valueClass]) => (
              <div className="summary-item" key={label}>
                <span className="summary-icon"><ModalIcon name={icon} /></span>
                <div><span className="meta-label">{label}</span><span className={valueClass || 'meta-value'}>{value}</span></div>
              </div>
            ))}
            <div className="summary-item mobile-quantity-summary">
              <span className="summary-icon"><ModalIcon name="package" /></span>
              <div><span className="meta-label">Total Quantity</span><span className="meta-value">{items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)}</span></div>
            </div>
          </div>
        </div>

        <div className="modal-scroll-area">

          <div className="items-section">
            <button type="button" className="section-header-compact collapsible-section-trigger" onClick={() => setItemsExpanded((expanded) => !expanded)} aria-expanded={itemsExpanded} aria-controls="order-details-items">
              <span className="collapsible-title"><span>Items</span><span className="item-count-badge">{items.length}</span></span>
              <svg className="section-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
            </button>
            <div id="order-details-items" className={`collapsible-section-content ${itemsExpanded ? 'is-expanded' : ''}`}>
            <div className="collapsible-section-inner">
            <div className={`details-items-list ${items.length > 2 ? 'is-scrollable' : ''}`}>
              {items.length ? (
                items.map((item, index) => (
                  <div key={`${item.productId || item.name || 'item'}-${index}`} className="details-item-row">
                    <div className="item-row-left">
                      {item.imageUrl ? (
                        <div className="item-row-img-wrapper">
                          <ProductImage src={item.imageUrl} alt={item.name || 'Order item'} />
                        </div>
                      ) : null}
                      <div className="item-row-info">
                        <span className="item-row-name">{item.name || 'Order item'}</span>
                        <span className="item-row-category">{[item.category, item.volume].filter(Boolean).join(' | ') || 'Details unavailable'}</span>
                      </div>
                    </div>
                    <div className="item-row-right">
                      <span className="item-row-math"><b>Qty ×{Number(item.quantity || 1)}</b><span>{formatCurrency(Number(item.price || 0))} each</span></span>
                      <strong className="item-row-total"><small>Total</small> {formatCurrency(Number(item.quantity || 1) * Number(item.price || 0))}</strong>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-details-row">No item details are available.</div>
              )}
            </div>
            </div>
            </div>
          </div>

          <div className="delivery-section">
            <button type="button" className="collapsible-section-trigger delivery-section-trigger" onClick={() => setAddressExpanded((expanded) => !expanded)} aria-expanded={addressExpanded} aria-controls="order-delivery-address">
              <span className="collapsible-title"><ModalIcon name="location" /><span>Delivery Address</span></span>
              <svg className="section-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
            </button>
            <div id="order-delivery-address" className={`collapsible-section-content ${addressExpanded ? 'is-expanded' : ''}`}>
            <div className="collapsible-section-inner">
            <div className="delivery-address-box">
              <div className="address-icon-wrap">
                <ModalIcon name="location" />
              </div>
              <div className="address-text-wrap">
                <strong>{customerName || 'Customer'}</strong>
                <p>
                  {completeAddress || 'Address not available'}
                  {customerPincode ? ` - ${customerPincode}` : ''}
                </p>
                <p className="delivery-phone"><ModalIcon name="phone" /> {customerMobile || 'Not available'}</p>
              </div>
            </div>
            </div>
            </div>
          </div>
        </div>

        <div className="modal-footer-actions">
          {selectedOrder.cancellationStatus === 'Pending' ? (
            <div className="pending-cancel-notice">Cancellation pending approval</div>
          ) : ['pending', 'confirmed'].includes(status.toLowerCase()) ? (
            <button type="button" onClick={() => { setOrderToCancel(selectedOrder); }} className="btn btn-outline-danger">
              Cancel Order
            </button>
          ) : ['processing', 'dispatched', 'out for delivery', 'delivered'].includes(status.toLowerCase()) ? (
            <div>
              <button type="button" className="btn btn-outline-danger" disabled>Cancel Order</button>
              <div className="pending-cancel-notice">This order is already being prepared and can no longer be cancelled.</div>
            </div>
          ) : null}
          <div className="footer-right-actions">
            <button type="button" onClick={() => handleReorder(selectedOrder)} className="btn btn-primary">
              Reorder
            </button>
            <button type="button" onClick={() => { setSelectedOrder(null); router.push(`/track?orderId=${encodeURIComponent(selectedOrder.orderId)}`); }} className="btn btn-track">
              Track Order <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .order-details-overlay {
          position: fixed;
          inset: 0;
          z-index: 3000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: rgba(2, 6, 23, 0.65);
          backdrop-filter: blur(4px);
        }

        .order-details-modal {
          position: relative;
          z-index: 1;
          width: min(720px, 100%);
          max-height: min(85vh, 680px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-xl);
          animation: orderDetailsIn 220ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes orderDetailsIn {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .summary-card {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-secondary);
        }

        .modal-title-header { position:relative;width:100%;box-sizing:border-box;padding:1rem 3rem .85rem 1.25rem;border-bottom:1px solid var(--border-color);background:color-mix(in srgb,var(--bg-secondary) 84%,var(--primary-color) 6%); }
        .order-modal-label { display:block;margin-bottom:.3rem;color:var(--text-muted);font-size:.62rem;font-weight:800;line-height:1;text-transform:uppercase;letter-spacing:.08em; }

        .order-modal-title-row { display:flex;align-items:center;gap:.65rem;min-width:0;margin:0; }
        .order-modal-title-row h2 { min-width:0;margin:0;color:var(--text-primary);font-size:clamp(.9rem,2.2vw,1.15rem);font-weight:800;line-height:1.2;white-space:nowrap; }
        .order-id-copy { display:block;max-width:100%;margin:0;padding:0;overflow:hidden;border:0;background:transparent;color:inherit;font:inherit;font-weight:inherit;line-height:inherit;text-align:left;text-overflow:ellipsis;white-space:nowrap;cursor:pointer; }
        .order-id-copy:focus-visible { outline:2px solid var(--primary-color);outline-offset:3px;border-radius:4px; }
        .order-id-copied { flex:0 0 auto;color:#15803d;font-size:.62rem;font-weight:800; }
        .order-header-status { flex:0 0 auto;display:inline-flex;align-items:center;min-height:24px;padding:.22rem .55rem;border:1px solid currentColor;border-radius:999px;font-size:.65rem;font-weight:800;line-height:1;text-transform:uppercase;letter-spacing:.04em; }
        .order-header-status.status-pending,
        .order-header-status.status-confirmed { color:#c2410c;background:#fff7ed;border-color:#fdba74; }
        .order-header-status.status-processing { color:#1d4ed8;background:#eff6ff;border-color:#93c5fd; }
        .order-header-status.status-dispatched { color:#7e22ce;background:#faf5ff;border-color:#d8b4fe; }
        .order-header-status.status-out-for-delivery { color:#0e7490;background:#ecfeff;border-color:#67e8f9; }
        .order-header-status.status-delivered { color:#047857;background:#ecfdf5;border-color:#6ee7b7; }
        .order-header-status.status-cancelled { color:#b91c1c;background:#fef2f2;border-color:#fca5a5; }

        .close-modal-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 999px;
          border: 1px solid var(--border-color);
          background: var(--bg-tertiary);
          color: var(--text-primary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .close-modal-btn.top-right {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
        }
        .close-modal-btn:hover {
          background: rgba(220, 38, 38, 0.1);
          color: #dc2626;
          border-color: rgba(220, 38, 38, 0.2);
        }

        .summary-card-details.single-row {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          white-space: nowrap;
        }

        .summary-item {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .mobile-quantity-summary { display: none; }

        .modal-scroll-area {
          overflow-y: auto;
          padding: 1rem 1.15rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .meta-label {
          font-size: 0.6rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .meta-value,
        .meta-value-price {
          color: var(--text-primary);
          font-weight: 700;
          font-size: 0.8rem;
          overflow-wrap: normal;
        }
        
        .compact-badge {
          font-size: 0.7rem;
          padding: 0.15rem 0.4rem;
        }
        
        .meta-value-price {
          color: var(--primary-color);
        }

        .items-section h3,
        .delivery-section h3 {
          margin: 0 0 0.5rem;
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-secondary);
        }

        .section-header-compact {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .collapsible-section-trigger { width:100%;min-width:0;margin:0 0 .5rem;padding:0;display:flex;align-items:center;justify-content:space-between;gap:.5rem;border:0;background:transparent;color:var(--text-primary);font:inherit;font-size:.85rem;font-weight:700;text-align:left;pointer-events:none; }
        .collapsible-title { min-width:0;display:flex;align-items:center;gap:.45rem; }
        .section-chevron { display:none;width:18px;height:18px;flex:0 0 18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;transition:transform 220ms ease; }
        .collapsible-section-content { display:grid;grid-template-rows:1fr;transition:grid-template-rows 240ms ease,opacity 180ms ease; }
        .collapsible-section-inner { min-height:0;overflow:hidden; }
        
        .section-header-compact h3 { margin: 0; }
        
        .item-count-badge {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          font-size: 0.65rem;
          padding: 0.1rem 0.4rem;
          border-radius: 999px;
          font-weight: 700;
          color: var(--text-muted);
        }

        .details-items-list {
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--bg-primary);
        }

        .details-item-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 0.65rem 0.85rem;
          border-bottom: 1px solid var(--border-light);
        }

        .details-item-row:last-child {
          border-bottom: 0;
        }

        .item-row-left {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          min-width: 0;
        }

        .item-row-img-wrapper {
          width: 36px;
          height: 36px;
          flex: 0 0 36px;
          display: grid;
          place-items: center;
          overflow: hidden;
          border-radius: 6px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
        }

        .item-row-img {
          max-width: 85%;
          max-height: 85%;
          object-fit: contain;
        }

        .item-row-info {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }

        .item-row-name {
          font-weight: 700;
          color: var(--text-primary);
          font-size: 0.85rem;
          line-height: 1.2;
        }

        .item-row-category {
          color: var(--text-muted);
          font-size: 0.7rem;
        }

        .item-row-right {
          text-align: right;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          white-space: nowrap;
        }

        .item-row-math {
          color: var(--text-muted);
          font-size: 0.7rem;
        }
        
        .item-row-total {
          font-size: 0.85rem;
          color: var(--text-primary);
        }

        .delivery-address-box {
          display: flex;
          gap: 0.75rem;
          padding: 0.85rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
        }

        .address-icon-wrap {
          color: var(--primary-color);
          background: rgba(0, 150, 58, 0.1);
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .address-text-wrap {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          line-height: 1.4;
        }

        .address-text-wrap strong {
          font-size: 0.85rem;
          color: var(--text-primary);
        }

        .address-text-wrap p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 0.8rem;
        }

        .delivery-phone {
          margin-top: 0.2rem !important;
          color: var(--text-primary) !important;
          font-weight: 600;
          font-size: 0.75rem !important;
        }

        .modal-footer-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.85rem 1.15rem;
          border-top: 1px solid var(--border-color);
          background: var(--bg-secondary);
        }

        .pending-cancel-notice {
          font-size: 0.75rem;
          font-weight: 600;
          color: #d97706;
          background: rgba(245, 158, 11, 0.1);
          padding: 0.4rem 0.6rem;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(245, 158, 11, 0.2);
        }

        .footer-right-actions {
          display: flex;
          gap: 0.5rem;
          margin-left: auto;
        }

        .btn {
          padding: 0.5rem 0.85rem;
          font-size: 0.85rem;
          font-weight: 600;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .btn-primary {
          background: var(--primary-color);
          color: white;
          border: 1px solid var(--primary-color);
        }
        
        .btn-primary:hover {
          background: var(--primary-hover);
        }

        .btn-secondary {
          background: var(--bg-tertiary);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
        }
        
        .btn-secondary:hover {
          background: var(--bg-secondary);
          border-color: var(--text-muted);
        }

        .btn-outline-danger {
          background: transparent;
          color: #dc2626;
          border: 1px solid rgba(220, 38, 38, 0.3);
        }
        
        .btn-outline-danger:hover {
          background: rgba(220, 38, 38, 0.05);
          border-color: #dc2626;
        }

        .empty-details-row {
          padding: 1rem;
          color: var(--text-muted);
          font-size: 0.85rem;
          text-align: center;
        }

        /* Premium modal refinement */
        .order-details-overlay { background: rgba(15, 23, 42, .62); backdrop-filter: blur(12px); }
        .order-details-modal { width: min(820px, 100%); max-height: min(90vh, 640px); border: 1px solid var(--border-color); border-radius: 24px; background: var(--bg-secondary); color: var(--text-primary); box-shadow: 0 32px 90px rgba(15,23,42,.24), 0 4px 18px rgba(15,23,42,.1); }
        .summary-card { padding:.75rem 1rem;border-bottom:1px solid var(--border-color);background:var(--bg-secondary);backdrop-filter:blur(18px); }
        .summary-card-details { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: .5rem; }
        .summary-item { min-width: 0; display: flex; flex-direction: row; align-items: center; gap: .5rem; padding: .5rem .6rem; border: 1px solid var(--border-color); border-radius: 10px; background: color-mix(in srgb, var(--bg-secondary) 94%, transparent); box-shadow: 0 3px 12px rgba(15,23,42,.035); }
        .summary-item > div { min-width: 0; display: flex; flex-direction: column; gap: .12rem; }
        .summary-icon { width: 26px; height: 26px; flex: 0 0 26px; display: grid; place-items: center; border-radius: 6px; color: var(--primary-color); background: color-mix(in srgb, var(--primary-color) 12%, transparent); }
        .meta-label { letter-spacing: .06em; color: var(--text-muted); font-size: .6rem; }
        .meta-value, .meta-value-price { display:block;overflow:visible;text-overflow:clip;white-space:normal;overflow-wrap:anywhere;color:var(--text-primary);font-size:.78rem;line-height:1.25; }
        .meta-value-price { color: #1d4ed8; }
        .close-modal-btn.top-right { top: .75rem; right: .75rem; width: 28px; height: 28px; background: var(--bg-tertiary); }
        .modal-scroll-area { overflow-y: auto; overflow-x: hidden; padding: .85rem 1rem 1rem; gap: 1rem; background: var(--bg-secondary); }
        .items-section { min-height: 0; flex: 0 0 auto; isolation: isolate; }
        .items-section h3, .delivery-section h3 { color: var(--text-primary); font-size: .85rem; }
        .delivery-section { position: relative; z-index: 1; flex: 0 0 auto; clear: both; background: var(--bg-secondary); }
        .delivery-section h3 { display: flex; align-items: center; gap: .45rem; }
        .details-items-list { display: flex; flex-direction: column; gap: .5rem; border: 0; border-radius: 0; overflow: visible; background: transparent; }
        .details-items-list.is-scrollable { max-height: 180px; height: auto; overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; padding-right: .35rem; scrollbar-gutter: stable; border-radius: 12px; }
        .details-item-row { min-height: 64px; padding: .5rem .65rem; border: 1px solid var(--border-color); border-radius: 12px; background: var(--bg-secondary); box-shadow: 0 6px 18px rgba(15,23,42,.05); }
        .details-item-row:last-child { border-bottom: 1px solid rgba(148,163,184,.17); }
        .item-row-left { gap: .65rem; }
        .item-row-img-wrapper { width: 52px; height: 52px; flex: 0 0 52px; padding: 4px; border: 0; border-radius: 10px; background: var(--bg-tertiary); box-shadow: inset 0 0 0 1px var(--border-color); }
        .item-row-info { gap: .15rem; } .item-row-name { font-size: .85rem; } .item-row-category { font-size: .7rem; }
        .item-row-right { min-width: 125px; gap: .25rem; }
        .item-row-math { display: flex; flex-direction: column; gap: .1rem; } .item-row-math b { color: var(--text-secondary); font-size: .7rem; }
        .item-row-total { color: var(--text-primary); font-size: .85rem; } .item-row-total small { color: var(--text-muted); font-size: .65rem; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; }
        .delivery-address-box { gap: .65rem; padding: .75rem .85rem; border-color: var(--border-color); border-radius: 12px; background: color-mix(in srgb, var(--bg-secondary) 94%, var(--primary-color) 3%); box-shadow: 0 7px 20px rgba(15,23,42,.05); }
        .address-icon-wrap { width: 28px; height: 28px; color: var(--primary-color); background: color-mix(in srgb, var(--primary-color) 15%, transparent); }
        .address-text-wrap { gap: .15rem; } .address-text-wrap strong { font-size: .85rem; } .address-text-wrap p { line-height: 1.4; font-size: .75rem; }
        .delivery-phone { display: flex; align-items: center; gap: .4rem; margin-top: .25rem !important; color: #1e3a8a !important; font-size: .75rem !important; }
        .modal-footer-actions { padding: .75rem 1rem; border-top-color: var(--border-color); background: var(--bg-secondary); }
        .footer-right-actions { gap: .5rem; }
        .btn { min-height: 38px; padding: .45rem .85rem; border-radius: 10px; gap: .35rem; font-size: .8rem; transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease; }
        .btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 7px 16px rgba(15,23,42,.1); }
        .btn-outline-danger { border-color: #ef4444; color: #ef4444; background: var(--bg-secondary); }
        .btn-track { color: #fff; border: 1px solid #2563eb; background: linear-gradient(135deg,#3b82f6,#1d4ed8); box-shadow: 0 6px 16px rgba(37,99,235,.22); }

        @media (max-width: 768px) {
          :global(html.order-details-modal-open),
          :global(body.order-details-modal-open) { overflow: hidden !important; overscroll-behavior: none; }
          :global(body.order-details-modal-open .whatsapp-fab) { display: none !important; }

          .order-details-overlay {
            top: max(.4rem, env(safe-area-inset-top));
            right: 0;
            bottom: calc(var(--mobile-nav-height, 64px) + env(safe-area-inset-bottom));
            left: 0;
            height: calc(100vh - var(--mobile-nav-height, 64px) - env(safe-area-inset-top) - env(safe-area-inset-bottom) - .4rem);
            height: calc(100dvh - var(--mobile-nav-height, 64px) - env(safe-area-inset-top) - env(safe-area-inset-bottom) - .4rem);
            padding: .4rem;
            overflow: hidden;
            overscroll-behavior: none;
          }

          .order-details-modal {
            width: min(calc(100% - .35rem), 34rem);
            height: min(calc(100% - .35rem), 40rem);
            max-height: calc(100% - .35rem);
            min-width: 0;
            border-radius: 1.15rem;
          }

          .modal-title-header,
          .summary-card,
          .modal-footer-actions { flex: 0 0 auto; }

          .modal-title-header { min-height:0;padding:.42rem .58rem .46rem; }
          .order-modal-label { margin:0 0 .12rem;font-size:.52rem;line-height:1; }
          .order-modal-title-row { display:grid;grid-template-columns:minmax(0,1fr) 32px;align-items:center;min-width:0;gap:.22rem .4rem;padding:0; }
          .order-modal-title-row h2 { grid-column:1 / -1;grid-row:1;min-width:0;max-width:100%;margin:0;overflow:hidden;font-size:18px !important;font-weight:700 !important;line-height:1.08 !important;white-space:nowrap !important; }
          .order-id-copy { width:100%;max-width:100%;overflow:hidden;font-size:inherit !important;font-weight:inherit !important;line-height:inherit !important;text-overflow:ellipsis;white-space:nowrap !important; }
          .order-header-status { grid-column:1;grid-row:2;justify-self:start;max-width:calc(100% - .25rem);min-width:0;min-height:21px;padding:.16rem .42rem;overflow:hidden;font-size:.58rem;text-overflow:ellipsis;white-space:nowrap; }
          .order-id-copied { grid-column:1;grid-row:2;justify-self:end;margin-right:.25rem; }
          .close-modal-btn.top-right { position:absolute;top:auto;right:.58rem;bottom:.46rem;width:30px;height:30px; }

          .summary-card-details { grid-template-columns: repeat(2,minmax(0,1fr)); }
          .summary-card { padding: .42rem .55rem; }
          .summary-item { min-height: 2.8rem; padding: .34rem .42rem; align-items: center; }
          .mobile-quantity-summary { display: flex; }
          .summary-item > div, .meta-value, .meta-value-price { min-width: 0; max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
          .summary-icon { width: 24px; height: 24px; flex-basis: 24px; }

          .modal-scroll-area {
            flex: 1 1 auto;
            min-height: 0;
            min-width: 0;
            padding: .55rem;
            gap: .62rem;
            overflow-x: hidden;
            overflow-y: auto;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
            scroll-padding-bottom: 1rem;
          }

          .details-items-list.is-scrollable { max-height: none; overflow: visible; padding-right: 0; scrollbar-gutter: auto; }
          .details-item-row { min-width: 0; }
          .item-row-left, .item-row-info, .item-row-right { min-width: 0; }
          .item-row-name, .item-row-category { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
          .delivery-address-box, .address-text-wrap { min-width: 0; }
          .address-text-wrap strong, .address-text-wrap p { overflow-wrap: anywhere; word-break: break-word; }
          .collapsible-section-trigger { min-height:40px;margin:0;padding:.42rem .55rem;pointer-events:auto;border:1px solid var(--border-color);border-radius:.7rem;background:color-mix(in srgb,var(--bg-secondary) 94%,var(--primary-color) 3%);font-size:.76rem;cursor:pointer;touch-action:manipulation; }
          .collapsible-section-trigger:focus-visible { outline:2px solid var(--primary-color);outline-offset:2px; }
          .section-chevron { display:block; }
          .collapsible-section-trigger[aria-expanded="true"] .section-chevron { transform:rotate(180deg); }
          .collapsible-section-content { grid-template-rows:0fr;opacity:0; }
          .collapsible-section-content.is-expanded { grid-template-rows:1fr;opacity:1; }
          .collapsible-section-content.is-expanded .collapsible-section-inner { padding-top:.45rem; }

          .modal-footer-actions {
            position: relative;
            z-index: 2;
            padding: .5rem .58rem max(.5rem, env(safe-area-inset-bottom));
            background: color-mix(in srgb, var(--bg-secondary) 96%, transparent);
            box-shadow: 0 -8px 22px rgba(15,23,42,.08);
          }

          .modal-footer-actions .btn { min-height: 44px; min-width: 0; }
          .summary-card-details.single-row {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.5rem;
          }
        }
        
        @media (max-width: 540px) {
          .order-details-overlay { padding: .3rem; }
          .order-details-modal { border-radius: 1rem; max-height: 100%; }
          .modal-title-header { padding:.68rem 2.8rem .58rem .68rem; }
          .summary-card { padding:.48rem .58rem; }
          .order-modal-title-row { gap:.4rem; }
          .order-modal-title-row h2 { font-size:18px !important; }
          .summary-card-details { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .36rem; }
          .summary-item { padding: .4rem .5rem; }
          .summary-card-details.single-row {
            grid-template-columns: repeat(2, 1fr);
          }

          .modal-footer-actions {
            display: grid;
            grid-template-columns: minmax(0, 1fr);
            align-items: stretch;
            gap: .45rem;
          }

          .modal-footer-actions > .btn,
          .modal-footer-actions > div:not(.footer-right-actions) .btn { width: 100%; }

          .modal-footer-actions > div:not(.footer-right-actions) { min-width: 0; }
          .pending-cancel-notice { max-width: 100%; overflow-wrap: anywhere; }
          
          .footer-right-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            width: 100%;
            min-width: 0;
            margin-left: 0;
            gap: .45rem;
          }

          .details-item-row {
            flex-direction: column;
            align-items: stretch;
            gap: 0.5rem;
          }

          .item-row-img-wrapper { width: 48px; height: 48px; flex-basis: 48px; }

          .item-row-right {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            border-top: 1px dashed var(--border-light);
            padding-top: 0.5rem;
            margin-top: 0.2rem;
          }
        }

        @media (max-width: 360px) {
          .summary-card-details { grid-template-columns: 1fr 1fr; }
          .summary-item { min-height: 2.9rem; padding: .35rem .4rem; gap: .35rem; }
          .summary-icon { display: none; }
          .meta-label { font-size: .52rem; }
          .meta-value, .meta-value-price { font-size: .68rem; }
          .item-row-img-wrapper { width: 44px; height: 44px; flex-basis: 44px; }
          .modal-footer-actions .btn { padding-inline: .4rem; font-size: .7rem; }
        }
      `}</style>
    </div>,
    document.body
  );
}
