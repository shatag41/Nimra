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

  return (
    <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
      <div className="modal-content-details card animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Order Details</h2>
          <button className="close-modal-btn" onClick={() => setSelectedOrder(null)}>✕</button>
        </div>

        <div className="modal-scroll-area">
          {/* Order Meta */}
          <div className="details-meta-grid">
            <div>
              <span className="meta-label">Order ID</span>
              <span className="meta-value">#{selectedOrder.orderId}</span>
            </div>
            <div>
              <span className="meta-label">Order Date</span>
              <span className="meta-value">{formatDate(selectedOrder.createdAt)}</span>
            </div>
            <div>
              <span className="meta-label">Payment Method</span>
              <span className="meta-value">{selectedOrder.paymentMethod || 'Cash on Delivery'}</span>
            </div>
            <div>
              <span className="meta-label">Total Amount</span>
              <span className="meta-value-price">{formatCurrency(Number(selectedOrder.total || 0))}</span>
            </div>
          </div>

          {/* Status Tracking Timeline */}
          <div className="timeline-section">
            <h3>Delivery Status Tracking</h3>
            <div className="timeline-stepper">
              {getTimelineSteps(selectedOrder.status).map((step, idx) => (
                <div
                  key={idx}
                  className={`timeline-step ${step.completed ? 'completed' : ''} ${step.active ? 'active' : ''} ${
                    step.isError ? 'cancelled-step' : ''
                  }`}
                >
                  <div className="step-bullet">
                    {step.isError ? '✕' : step.completed ? '✓' : idx + 1}
                  </div>
                  <div className="step-info">
                    <span className="step-label">{step.label}</span>
                    <span className="step-desc">{step.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Items */}
          <div className="items-section">
            <h3>Ordered Items</h3>
            <div className="details-items-list">
              {selectedOrder.items.map((item, idx) => (
                <div key={idx} className="details-item-row">
                  <div className="item-row-left">
                    {item.imageUrl && (
                      <div className="item-row-img-wrapper">
                        <img src={item.imageUrl} alt={item.name} className="item-row-img" />
                      </div>
                    )}
                    <div>
                      <span className="item-row-name">{item.name}</span>
                      <span className="item-row-category">{item.category} | {item.volume}</span>
                    </div>
                  </div>
                  <div className="item-row-right">
                    <span className="item-row-math">
                      {item.quantity} × {formatCurrency(item.price)}
                    </span>
                    <strong className="item-row-total">{formatCurrency(item.quantity * item.price)}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Details */}
          <div className="delivery-section">
            <h3>Delivery Address</h3>
            <div className="delivery-address-box">
              <div className="delivery-address-head">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <strong>{selectedOrder.customer.name}</strong>
              </div>
              <p>
                {selectedOrder.customer.flatNo}, {selectedOrder.customer.buildingName && `${selectedOrder.customer.buildingName}, `}
                {selectedOrder.customer.locality}, {selectedOrder.customer.city}, {selectedOrder.customer.state} - {selectedOrder.customer.pincode}
              </p>
              <p className="delivery-phone">📞 Phone: {selectedOrder.customer.mobile}</p>
            </div>
          </div>
        </div>

        <div className="modal-footer-actions">
          <button onClick={() => handleReorder(selectedOrder)} className="btn btn-primary flex-1">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M16 3h5v5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 21H3v-5"/></svg>
            Reorder Order
          </button>
          {selectedOrder.cancellationStatus === 'Pending' ? (
            <span className="status-desc-text">Cancellation pending admin approval</span>
          ) : ['pending', 'confirmed'].includes(selectedOrder.status.toLowerCase()) && (
            <button
              onClick={() => {
                setOrderToCancel(selectedOrder);
              }}
              className="btn btn-danger"
            >
              Cancel Order
            </button>
          )}
          <button onClick={() => setSelectedOrder(null)} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
