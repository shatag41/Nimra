import React from 'react';
import { OrderRecord } from '@/types/cms';
import { formatCurrency } from '@/frontend/customer/utils/commerce';
import CustomSelect from './CustomSelect';

interface OrdersTabProps {
  filteredOrders: OrderRecord[];
  showFilters: boolean;
  orderStatusFilter: string;
  setOrderStatusFilter: (val: string) => void;
  orderPaymentFilter: string;
  setOrderPaymentFilter: (val: string) => void;
  orderSort: string;
  setOrderSort: (val: string) => void;
  orderStartDate: string;
  setOrderStartDate: (val: string) => void;
  orderEndDate: string;
  setOrderEndDate: (val: string) => void;
  handleClearOrderFilters: () => void;
  setSelectedOrder: (order: OrderRecord | null) => void;
  setOrderStatusVal: (val: string) => void;
}

export default React.memo(function OrdersTab({
  filteredOrders,
  showFilters,
  orderStatusFilter,
  setOrderStatusFilter,
  orderPaymentFilter,
  setOrderPaymentFilter,
  orderSort,
  setOrderSort,
  orderStartDate,
  setOrderStartDate,
  orderEndDate,
  setOrderEndDate,
  handleClearOrderFilters,
  setSelectedOrder,
  setOrderStatusVal,
}: OrdersTabProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending': return 'badge-orange';
      case 'Confirmed': return 'badge-confirmed';
      case 'Processing': return 'badge-processing';
      case 'Dispatched': return 'badge-dispatched';
      case 'Out for Delivery': return 'badge-out';
      case 'Delivered': return 'badge-primary';
      case 'Cancelled': return 'badge-cancelled';
      default: return 'badge-secondary';
    }
  };

  const hasActiveFilters = orderStatusFilter !== 'All' || 
    orderPaymentFilter !== 'All' || 
    orderSort !== 'latest' || 
    orderStartDate !== '' || 
    orderEndDate !== '';

  return (
    <div className="orders-tab card glass">
      {showFilters && (
        <div className="filter-bar animate-fade-in">
          <div className="filter-group">
            <label>Status:</label>
            <CustomSelect
              value={orderStatusFilter}
              onChange={setOrderStatusFilter}
              clearable={true}
              onClear={() => setOrderStatusFilter('All')}
              options={[
                { value: 'All', label: 'All Statuses' },
                { value: 'Pending', label: 'Pending' },
                { value: 'Confirmed', label: 'Confirmed' },
                { value: 'Processing', label: 'Processing' },
                { value: 'Dispatched', label: 'Dispatched' },
                { value: 'Out for Delivery', label: 'Out for Delivery' },
                { value: 'Delivered', label: 'Delivered' },
                { value: 'Cancelled', label: 'Cancelled' },
              ]}
            />
          </div>
          <div className="filter-group">
            <label>Payment:</label>
            <CustomSelect
              value={orderPaymentFilter}
              onChange={setOrderPaymentFilter}
              clearable={true}
              onClear={() => setOrderPaymentFilter('All')}
              options={[
                { value: 'All', label: 'All Payments' },
                { value: 'Cash on Delivery', label: 'Cash on Delivery' },
                { value: 'UPI / Online', label: 'UPI / Online' },
                { value: 'Google Pay', label: 'Google Pay' },
              ]}
            />
          </div>
          <div className="filter-group">
            <label>Date Sort:</label>
            <CustomSelect
              value={orderSort}
              onChange={setOrderSort}
              clearable={true}
              onClear={() => setOrderSort('latest')}
              options={[
                { value: 'latest', label: 'Latest First' },
                { value: 'earliest', label: 'Earliest First' },
              ]}
            />
          </div>
          <div className="filter-group">
            <label>From:</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="date"
                value={orderStartDate}
                onChange={(e) => setOrderStartDate(e.target.value)}
                className="form-input filter-input"
              />
            </div>
          </div>
          <div className="filter-group">
            <label>To:</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="date"
                value={orderEndDate}
                min={orderStartDate}
                onChange={(e) => setOrderEndDate(e.target.value)}
                className="form-input filter-input"
              />
              {hasActiveFilters && (
                <button 
                  className="btn-clear" 
                  onClick={handleClearOrderFilters} 
                  title="Clear Filters" 
                  style={{ display: 'inline-flex', flexShrink: 0, whiteSpace: 'nowrap', alignItems: 'center', justifyContent: 'center', padding: '0.45rem 0.55rem' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 4v6h-6"></path>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Method</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((o, idx) => (
              <tr key={o.orderId || idx}>
                <td><strong>{o.orderId}</strong></td>
                <td>{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'N/A'}</td>
                <td>
                  <div>{o.customer?.name || 'N/A'}</div>
                  <small>{o.customer?.mobile || 'N/A'}</small>
                </td>
                <td>
                  <span className={`badge ${getStatusBadge(o.status)}`}>{o.status}</span>
                </td>
                <td>{o.paymentMethod}</td>
                <td><strong>{formatCurrency(o.total)}</strong></td>
                <td>
                  <button 
                    className="btn-table btn-edit" 
                    onClick={() => {
                      setSelectedOrder(o);
                      setOrderStatusVal(o.status);
                    }}
                  >
                    Manage Status
                  </button>
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-td">No orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});
