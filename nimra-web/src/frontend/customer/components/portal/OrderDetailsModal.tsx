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
  React.useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedOrder(null);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setSelectedOrder]);

  if (!selectedOrder) return null;
  if (typeof document === 'undefined') return null;

  const customer = selectedOrder.customer || {};
  const items = Array.isArray(selectedOrder.items) ? selectedOrder.items : [];
  const status = String(selectedOrder.status || 'Pending');
  const addressParts = [
    customer.flatNo,
    customer.buildingName,
    customer.locality,
    customer.city,
    customer.state,
  ].filter(Boolean);

  return createPortal(
    <div className="order-details-overlay" onClick={() => setSelectedOrder(null)}>
      <div
        className="order-details-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Order details for ${selectedOrder.orderId}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header summary-card">
          <button type="button" className="close-modal-btn top-right" onClick={() => setSelectedOrder(null)} aria-label="Close order details">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          
          <div className="summary-card-details">
            {([
              ['package', 'Order ID', `#${selectedOrder.orderId || 'N/A'}`, ''],
              ['status', 'Status', status, `status-badge compact-badge ${status.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`],
              ['calendar', 'Date & Time', formatDate(selectedOrder.createdAt), ''],
              ['payment', 'Payment Method', selectedOrder.paymentMethod || 'COD', ''],
              ['user', 'Customer', customer.name || 'N/A', ''],
              ['total', 'Order Total', formatCurrency(Number(selectedOrder.total || 0)), 'meta-value-price'],
            ] as const).map(([icon, label, value, valueClass]) => (
              <div className="summary-item" key={label}>
                <span className="summary-icon"><ModalIcon name={icon} /></span>
                <div><span className="meta-label">{label}</span><span className={`${valueClass || 'meta-value'} ${label === 'Order ID' ? 'order-id-value' : ''}`}>{value}</span></div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-scroll-area">

          <div className="items-section">
            <div className="section-header-compact">
              <h3>Items</h3>
              <span className="item-count-badge">{items.length}</span>
            </div>
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

          <div className="delivery-section">
            <h3><ModalIcon name="location" /> Delivery Address</h3>
            <div className="delivery-address-box">
              <div className="address-icon-wrap">
                <ModalIcon name="location" />
              </div>
              <div className="address-text-wrap">
                <strong>{customer.name || 'Customer'}</strong>
                <p>
                  {addressParts.length ? addressParts.join(', ') : 'Address not available'}
                  {customer.pincode ? ` - ${customer.pincode}` : ''}
                </p>
                <p className="delivery-phone"><ModalIcon name="phone" /> {customer.mobile || 'Not available'}</p>
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
              <ModalIcon name="track" /> Track Order <span aria-hidden="true">→</span>
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
          padding: 1rem 2.5rem 1rem 1.25rem;
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-secondary);
          position: relative;
        }

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
        .order-details-modal { width: min(820px, 100%); max-height: min(88vh, 720px); border: 1px solid var(--border-color); border-radius: 28px; background: var(--bg-secondary); color: var(--text-primary); box-shadow: 0 32px 90px rgba(15,23,42,.24), 0 4px 18px rgba(15,23,42,.1); }
        .summary-card { padding: 1.4rem 3rem 1.25rem 1.35rem; border-bottom: 1px solid var(--border-color); background: color-mix(in srgb, var(--bg-secondary) 84%, var(--primary-color) 6%); backdrop-filter: blur(18px); }
        .summary-card-details { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: .75rem; }
        .summary-item { min-width: 0; display: flex; flex-direction: row; align-items: center; gap: .65rem; padding: .7rem; border: 1px solid var(--border-color); border-radius: 14px; background: color-mix(in srgb, var(--bg-secondary) 94%, transparent); box-shadow: 0 3px 12px rgba(15,23,42,.035); }
        .summary-item > div { min-width: 0; display: flex; flex-direction: column; gap: .16rem; }
        .summary-icon { width: 30px; height: 30px; flex: 0 0 30px; display: grid; place-items: center; border-radius: 9px; color: var(--primary-color); background: color-mix(in srgb, var(--primary-color) 12%, transparent); }
        .meta-label { letter-spacing: .08em; color: var(--text-muted); }
        .meta-value, .meta-value-price { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-primary); font-size: .82rem; }
        .order-id-value { overflow: visible; text-overflow: clip; white-space: normal; overflow-wrap: anywhere; font-size: .78rem; }
        .meta-value-price { color: #1d4ed8; }
        .close-modal-btn.top-right { top: .9rem; right: .9rem; width: 30px; height: 30px; background: var(--bg-tertiary); }
        .modal-scroll-area { overflow: hidden; padding: 1.15rem 1.35rem 1.3rem; gap: 1.35rem; background: var(--bg-secondary); }
        .items-section { min-height: 0; flex: 0 0 auto; isolation: isolate; }
        .items-section h3, .delivery-section h3 { color: var(--text-primary); }
        .delivery-section { position: relative; z-index: 1; flex: 0 0 auto; clear: both; background: var(--bg-secondary); }
        .delivery-section h3 { display: flex; align-items: center; gap: .45rem; }
        .details-items-list { display: flex; flex-direction: column; gap: .65rem; border: 0; border-radius: 0; overflow: visible; background: transparent; }
        .details-items-list.is-scrollable { height: 220px; max-height: 220px; overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; padding-right: .35rem; scrollbar-gutter: stable; border-radius: 16px; }
        .details-item-row { min-height: 96px; padding: .7rem; border: 1px solid var(--border-color); border-radius: 16px; background: var(--bg-secondary); box-shadow: 0 6px 18px rgba(15,23,42,.05); }
        .details-item-row:last-child { border-bottom: 1px solid rgba(148,163,184,.17); }
        .item-row-left { gap: .85rem; }
        .item-row-img-wrapper { width: 72px; height: 72px; flex: 0 0 72px; padding: 5px; border: 0; border-radius: 14px; background: var(--bg-tertiary); box-shadow: inset 0 0 0 1px var(--border-color); }
        .item-row-info { gap: .25rem; } .item-row-name { font-size: .92rem; } .item-row-category { font-size: .72rem; }
        .item-row-right { min-width: 125px; gap: .4rem; }
        .item-row-math { display: flex; flex-direction: column; gap: .1rem; } .item-row-math b { color: var(--text-secondary); font-size: .73rem; }
        .item-row-total { color: var(--text-primary); font-size: .9rem; } .item-row-total small { color: var(--text-muted); font-size: .65rem; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; }
        .delivery-address-box { gap: .9rem; padding: 1.05rem; border-color: var(--border-color); border-radius: 16px; background: color-mix(in srgb, var(--bg-secondary) 94%, var(--primary-color) 3%); box-shadow: 0 7px 20px rgba(15,23,42,.05); }
        .address-icon-wrap { width: 36px; height: 36px; color: var(--primary-color); background: color-mix(in srgb, var(--primary-color) 15%, transparent); }
        .address-text-wrap { gap: .3rem; } .address-text-wrap strong { font-size: .92rem; } .address-text-wrap p { line-height: 1.55; }
        .delivery-phone { display: flex; align-items: center; gap: .4rem; margin-top: .35rem !important; color: #1e3a8a !important; }
        .modal-footer-actions { padding: .9rem 1.35rem; border-top-color: var(--border-color); background: var(--bg-secondary); }
        .footer-right-actions { gap: .6rem; }
        .btn { min-height: 42px; padding: .55rem 1rem; border-radius: 12px; gap: .42rem; transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease; }
        .btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 7px 16px rgba(15,23,42,.1); }
        .btn-outline-danger { border-color: #ef4444; color: #ef4444; background: var(--bg-secondary); }
        .btn-track { color: #fff; border: 1px solid #2563eb; background: linear-gradient(135deg,#3b82f6,#1d4ed8); box-shadow: 0 6px 16px rgba(37,99,235,.22); }

        @media (max-width: 768px) {
          .summary-card-details { grid-template-columns: repeat(2,minmax(0,1fr)); }
          .summary-card-details.single-row {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.75rem;
          }
        }
        
        @media (max-width: 540px) {
          .order-details-overlay { padding: .55rem; }
          .order-details-modal { border-radius: 22px; max-height: 94vh; }
          .summary-card { padding: 1.25rem 2.8rem 1rem 1rem; }
          .summary-card-details { grid-template-columns: 1fr; gap: .5rem; }
          .summary-item { padding: .58rem .65rem; }
          .summary-card-details.single-row {
            grid-template-columns: repeat(2, 1fr);
          }

          .modal-footer-actions {
            flex-direction: column;
            align-items: stretch;
          }
          
          .footer-right-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            width: 100%;
          }

          .details-item-row {
            flex-direction: column;
            align-items: stretch;
            gap: 0.5rem;
          }

          .item-row-img-wrapper { width: 64px; height: 64px; flex-basis: 64px; }

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
      `}</style>
    </div>,
    document.body
  );
}
