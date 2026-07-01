'use client';

import React from 'react';
import { OrderRecord } from '@/types/cms';
import { formatCurrency } from '../../utils/commerce';

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

export default function OrderDetailsModal({
  selectedOrder,
  setSelectedOrder,
  handleReorder,
  setOrderToCancel,
  getTimelineSteps,
  formatDate,
}: OrderDetailsModalProps) {
  if (!selectedOrder) return null;

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

  return (
    <div className="order-details-overlay" onClick={() => setSelectedOrder(null)}>
      <div className="order-details-modal card animate-scale-in" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header summary-card">
          <button type="button" className="close-modal-btn top-right" onClick={() => setSelectedOrder(null)} aria-label="Close order details">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          
          <div className="summary-card-details single-row">
            <div className="summary-item">
              <span className="meta-label">Order ID</span>
              <span className="meta-value">#{selectedOrder.orderId || 'N/A'}</span>
            </div>
            <div className="summary-item">
              <span className="meta-label">Status</span>
              <span className={`status-badge compact-badge ${status.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>{status}</span>
            </div>
            <div className="summary-item">
              <span className="meta-label">Date</span>
              <span className="meta-value">{formatDate(selectedOrder.createdAt)}</span>
            </div>
            <div className="summary-item">
              <span className="meta-label">Total</span>
              <span className="meta-value-price">{formatCurrency(Number(selectedOrder.total || 0))}</span>
            </div>
            <div className="summary-item">
              <span className="meta-label">Customer</span>
              <span className="meta-value">{customer.name || 'N/A'}</span>
            </div>
            <div className="summary-item">
              <span className="meta-label">Payment</span>
              <span className="meta-value">{selectedOrder.paymentMethod || 'COD'}</span>
            </div>
          </div>
        </div>

        <div className="modal-scroll-area">

          <div className="items-section">
            <div className="section-header-compact">
              <h3>Items</h3>
              <span className="item-count-badge">{items.length}</span>
            </div>
            <div className="details-items-list">
              {items.length ? (
                items.map((item, index) => (
                  <div key={`${item.productId || item.name || 'item'}-${index}`} className="details-item-row">
                    <div className="item-row-left">
                      {item.imageUrl ? (
                        <div className="item-row-img-wrapper">
                          <img src={item.imageUrl} alt={item.name || 'Order item'} className="item-row-img" />
                        </div>
                      ) : null}
                      <div className="item-row-info">
                        <span className="item-row-name">{item.name || 'Order item'}</span>
                        <span className="item-row-category">{[item.category, item.volume].filter(Boolean).join(' | ') || 'Details unavailable'}</span>
                      </div>
                    </div>
                    <div className="item-row-right">
                      <span className="item-row-math">
                        {Number(item.quantity || 1)} x {formatCurrency(Number(item.price || 0))}
                      </span>
                      <strong className="item-row-total">{formatCurrency(Number(item.quantity || 1) * Number(item.price || 0))}</strong>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-details-row">No item details are available.</div>
              )}
            </div>
          </div>

          <div className="delivery-section">
            <h3>Delivery Address</h3>
            <div className="delivery-address-box">
              <div className="address-icon-wrap">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="address-text-wrap">
                <strong>{customer.name || 'Customer'}</strong>
                <p>
                  {addressParts.length ? addressParts.join(', ') : 'Address not available'}
                  {customer.pincode ? ` - ${customer.pincode}` : ''}
                </p>
                <p className="delivery-phone">📞 {customer.mobile || 'Not available'}</p>
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
            <button type="button" onClick={() => setSelectedOrder(null)} className="btn btn-secondary">
              Close
            </button>
            <button type="button" onClick={() => handleReorder(selectedOrder)} className="btn btn-primary">
              Reorder
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
          width: min(720px, 100%);
          max-height: min(85vh, 680px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-xl);
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

        @media (max-width: 768px) {
          .summary-card-details.single-row {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.75rem;
          }
        }
        
        @media (max-width: 540px) {
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
    </div>
  );
}
