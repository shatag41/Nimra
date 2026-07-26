import React, { useMemo, useState } from 'react';
import { OrderRecord } from '@/types/cms';
import { formatCurrency } from '@/frontend/customer/utils/commerce';
import CustomSelect from './CustomSelect';
import LoadingButton from '@/frontend/shared/LoadingButton';

interface OrderModalProps {
  selectedOrder: OrderRecord;
  onClose: () => void;
  onSubmit: (e: React.FormEvent, customerMessage?: string) => void;
  orderStatusVal: string;
  setOrderStatusVal: (val: string) => void;
  saveLoading: boolean;
}

export default function OrderModal({
  selectedOrder,
  onClose,
  onSubmit,
  orderStatusVal,
  setOrderStatusVal,
  saveLoading,
}: OrderModalProps) {
  const [showSequenceWarning, setShowSequenceWarning] = useState(false);
  const [customerMessage, setCustomerMessage] = useState('');
  const [messageError, setMessageError] = useState('');
  const normalizeStatus = (value: unknown) => String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
  const statusSequence = ['pending', 'confirmed', 'processing', 'dispatched', 'out for delivery', 'delivered'];
  const savedCurrentStatus = normalizeStatus(selectedOrder.status);
  const selectedNewStatus = normalizeStatus(orderStatusVal);
  const previousIndex = savedCurrentStatus ? statusSequence.indexOf(savedCurrentStatus) : -1;
  const nextIndex = selectedNewStatus ? statusSequence.indexOf(selectedNewStatus) : -1;
  const isOutOfSequence = previousIndex >= 0 && nextIndex >= 0
    && nextIndex < previousIndex;
  const defaultApology = useMemo(
    () => `We’re sorry for the change in your order status. Your order has been moved from ${selectedOrder.status} to ${orderStatusVal} due to an operational update. We appreciate your patience and will keep you informed.`,
    [orderStatusVal, selectedOrder.status],
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isOutOfSequence) {
      onSubmit(event);
      return;
    }
    setCustomerMessage(defaultApology);
    setMessageError('');
    setShowSequenceWarning(true);
  };

  const confirmExceptionalUpdate = (event: React.FormEvent) => {
    event.preventDefault();
    const message = customerMessage.trim();
    if (message.length < 20) {
      setMessageError('Please enter a clear customer message of at least 20 characters.');
      return;
    }
    setMessageError('');
    onSubmit(event, message);
  };

  return (
    <div className="modal-backdrop glass">
      <div className="modal-card animate-fade-in">
        <div className="modal-header">
          <h2>Manage Order #{String(selectedOrder.orderId || '').slice(-6)}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="modal-info-block">
            <div><strong>Client Name:</strong> {selectedOrder.customer.name}</div>
            <div><strong>Mobile:</strong> {selectedOrder.customer.mobile}</div>
            <div><strong>Address:</strong> {selectedOrder.customer.address}, {selectedOrder.customer.city}, {selectedOrder.customer.state} - {selectedOrder.customer.pincode}</div>
            {selectedOrder.customer.instructions && (
              <div className="instructions-callout"><strong>Instructions:</strong> {selectedOrder.customer.instructions}</div>
            )}
          </div>

          <div className="order-items-summary">
            <h4>Items Ordered</h4>
            {selectedOrder.items.map((item, idx) => (
              <div key={idx} className="order-item-row">
                <span>{item.name} x {item.quantity}</span>
              </div>
            ))}
            <div className="order-grand-total">
              Grand Total: {formatCurrency(selectedOrder.total)}
            </div>
          </div>

          <div className="form-group mt-3">
            <label>Update Delivery Status</label>
            <CustomSelect
              value={orderStatusVal}
              onChange={setOrderStatusVal}
              portalMenu
              options={[
                { value: 'Pending', label: 'Pending' },
                { value: 'Confirmed', label: 'Confirmed' },
                { value: 'Processing', label: 'Processing' },
                { value: 'Dispatched', label: 'Dispatched' },
                { value: 'Out for Delivery', label: 'Out for Delivery' },
                { value: 'Delivered', label: 'Delivered' },
              ]}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <LoadingButton type="submit" className="btn btn-primary" isLoading={saveLoading} loadingText="Saving...">Apply Status Update</LoadingButton>
          </div>
        </form>
      </div>

      {showSequenceWarning && (
        <div className="status-warning-backdrop" role="presentation">
          <form className="status-warning-dialog" onSubmit={confirmExceptionalUpdate} role="dialog" aria-modal="true" aria-labelledby="status-warning-title">
            <h3 id="status-warning-title">Confirm Out-of-Sequence Update</h3>
            <p className="status-warning-copy">This status change requires a customer notification before it can be saved.</p>
            <div className="status-transition">
              <span><small>Previous status</small><strong>{selectedOrder.status}</strong></span>
              <b aria-hidden="true">→</b>
              <span><small>New status</small><strong>{orderStatusVal}</strong></span>
            </div>
            <label htmlFor="status-customer-message">Apology message to customer <span aria-hidden="true">*</span></label>
            <textarea
              id="status-customer-message"
              value={customerMessage}
              onChange={(event) => {
                setCustomerMessage(event.target.value);
                if (messageError) setMessageError('');
              }}
              rows={5}
              required
              minLength={20}
              disabled={saveLoading}
            />
            {messageError && <p className="status-message-error" role="alert">{messageError}</p>}
            <div className="status-warning-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowSequenceWarning(false)} disabled={saveLoading}>Cancel</button>
              <LoadingButton type="submit" className="btn btn-primary" isLoading={saveLoading} loadingText="Updating & Sending...">Update &amp; Notify Customer</LoadingButton>
            </div>
          </form>
        </div>
      )}

      <style jsx>{`
        .status-warning-backdrop { position: fixed; inset: 0; z-index: 10020; display: grid; place-items: center; padding: 1rem; background: rgba(2, 6, 23, .58); backdrop-filter: blur(5px); }
        .status-warning-dialog { width: min(100%, 560px); padding: 1.35rem; border: 1px solid var(--border-color); border-radius: var(--radius-lg); background: var(--bg-secondary); color: var(--text-primary); box-shadow: var(--shadow-xl); }
        .status-warning-dialog h3 { margin: 0; font-size: 1.15rem; }
        .status-warning-copy { margin: .45rem 0 1rem; color: var(--text-secondary); font-size: .85rem; line-height: 1.45; }
        .status-transition { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: .75rem; margin-bottom: 1rem; }
        .status-transition span { display: flex; flex-direction: column; gap: .2rem; padding: .7rem .8rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-primary); }
        .status-transition small { color: var(--text-muted); font-size: .68rem; text-transform: uppercase; letter-spacing: .05em; }
        .status-transition strong { font-size: .88rem; }
        .status-transition b { color: var(--primary-color); }
        .status-warning-dialog label { display: block; margin-bottom: .4rem; color: var(--text-primary); font-size: .8rem; font-weight: 700; }
        .status-warning-dialog label span { color: #ef4444; }
        .status-warning-dialog textarea { box-sizing: border-box; width: 100%; resize: vertical; padding: .75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-primary); color: var(--text-primary); font: inherit; font-size: .85rem; line-height: 1.5; }
        .status-warning-dialog textarea:focus { outline: 3px solid rgba(37, 99, 235, .16); border-color: var(--primary-color); }
        .status-message-error { margin: .4rem 0 0; color: #ef4444; font-size: .75rem; }
        .status-warning-actions { display: flex; justify-content: flex-end; gap: .75rem; margin-top: 1rem; }
        @media (max-width: 520px) { .status-transition { grid-template-columns: 1fr; } .status-transition > b { display: none; } .status-warning-actions { flex-direction: column-reverse; } }
      `}</style>
    </div>
  );
}
