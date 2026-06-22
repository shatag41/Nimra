import React from 'react';
import { OrderRecord } from '@/types/cms';
import { formatCurrency } from '@/frontend/customer/utils/commerce';
import CustomSelect from './CustomSelect';

interface OrderModalProps {
  selectedOrder: OrderRecord;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
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
  return (
    <div className="modal-backdrop glass">
      <div className="modal-card animate-fade-in">
        <div className="modal-header">
          <h2>Manage Order #{String(selectedOrder.orderId || '').slice(-6)}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={onSubmit} className="modal-body">
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
            <button type="submit" className="btn btn-primary" disabled={saveLoading}>
              {saveLoading ? 'Updating Status...' : 'Apply Status Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
