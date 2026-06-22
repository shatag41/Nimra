import React, { useState } from 'react';
import { CancellationRequest, OrderRecord } from '@/types/cms';
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
  cancellationRequests: CancellationRequest[];
  onReviewCancellation: (requestId: string, decision: 'Approved' | 'Rejected', adminRemarks: string) => Promise<boolean>;
  ordersView: 'active' | 'cancellations';
  setOrdersView: (view: 'active' | 'cancellations') => void;
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
  cancellationRequests,
  onReviewCancellation,
  ordersView,
  setOrdersView,
}: OrdersTabProps) {
  const [remarksByRequest, setRemarksByRequest] = useState<Record<string, string>>({});

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
  const visibleOrders = orderStatusFilter === 'All'
    ? filteredOrders.filter((order) => order.status !== 'Delivered' && order.status !== 'Cancelled')
    : filteredOrders;
  const pendingCancellationCount = cancellationRequests.filter((request) => request.status === 'Pending').length;

  const reviewCancellation = async (request: CancellationRequest, decision: 'Approved' | 'Rejected') => {
    const success = await onReviewCancellation(request.requestId, decision, remarksByRequest[request.requestId] || '');
    if (success) {
      setRemarksByRequest((prev) => {
        const next = { ...prev };
        delete next[request.requestId];
        return next;
      });
    }
  };

  return (
    <div className="orders-tab card glass">
      <div className="orders-mode-tabs">
        <button
          type="button"
          className={`btn ${ordersView === 'active' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setOrdersView('active')}
        >
          Orders ({visibleOrders.length})
        </button>
        <button
          type="button"
          className={`btn ${ordersView === 'cancellations' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setOrdersView('cancellations')}
        >
          Cancellation Requests ({pendingCancellationCount})
        </button>
      </div>

      {ordersView === 'cancellations' ? (
        <div className="table-responsive">
          <table className="admin-table compact-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Order</th>
                <th>Customer</th>
                <th>Requested</th>
                <th>Payment / Refund</th>
                <th>Reason</th>
                <th>Admin Remarks</th>
                <th className="sticky-action-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cancellationRequests.map((request) => {
                const isPending = request.status === 'Pending';
                return (
                  <tr key={request.requestId}>
                    <td>
                      <span className={`badge ${isPending ? 'badge-orange' : request.status === 'Approved' ? 'badge-primary' : 'badge-cancelled'}`}>{request.status}</span>
                    </td>
                    <td>
                      <strong className="order-id-link">{request.orderId}</strong>
                      <br />
                      <small>{formatCurrency(request.orderTotal)}</small>
                    </td>
                    <td>
                      <div>{request.customerName}</div>
                      <small>{request.customerMobile} - {request.customerEmail || 'No email'}</small>
                    </td>
                    <td>
                      {new Date(request.requestDate).toLocaleString('en-IN')}
                      {request.approvalDate ? <><br /><small>Reviewed: {new Date(request.approvalDate).toLocaleString('en-IN')}</small></> : null}
                    </td>
                    <td>
                      <div>{request.paymentMethod || 'Cash on Delivery'}</div>
                      <small>{request.refundStatus || 'Pending approval'}</small>
                    </td>
                    <td className="reason-col">{request.reason || 'Not specified'}</td>
                    <td className="remarks-col">
                      {isPending ? (
                        <textarea
                          className="form-input remarks-textarea"
                          value={remarksByRequest[request.requestId] || ''}
                          onChange={(event) => setRemarksByRequest((prev) => ({ ...prev, [request.requestId]: event.target.value }))}
                          placeholder="Audit remarks"
                          rows={2}
                        />
                      ) : (
                        <small>{request.adminRemarks || 'No remarks recorded'}</small>
                      )}
                    </td>
                    <td className="sticky-action-col">
                      {isPending ? (
                        <div className="actions-flex row-wrap">
                          <button type="button" className="btn-table btn-reject" onClick={() => reviewCancellation(request, 'Rejected')}>
                            ✗ Reject
                          </button>
                          <button type="button" className="btn-table btn-approve" onClick={() => reviewCancellation(request, 'Approved')}>
                            ✓ Approve
                          </button>
                        </div>
                      ) : (
                        <small>
                          {request.statusHistory?.map((item) => `${item.status} ${new Date(item.at).toLocaleDateString('en-IN')}`).join(' -> ') || 'Reviewed'}
                        </small>
                      )}
                    </td>
                  </tr>
                );
              })}
              {cancellationRequests.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-td">No cancellation requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <>
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
            <div className="date-input-wrap">
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
            <div className="date-input-wrap gap-2">
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
              <th className="sticky-action-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleOrders.map((o, idx) => (
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
                <td className="sticky-action-col">
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
            {visibleOrders.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-td">No active orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
        </>
      )}
    </div>
  );
});
