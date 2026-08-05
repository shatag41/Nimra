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
  let visibleCancellationRequests = orderStatusFilter === 'Pending'
    ? cancellationRequests.filter((r) => r.status === 'Pending')
    : orderStatusFilter === 'Confirmed' || orderStatusFilter === 'Approved'
      ? cancellationRequests.filter((r) => r.status === 'Approved')
      : orderStatusFilter === 'Cancelled' || orderStatusFilter === 'Rejected'
        ? cancellationRequests.filter((r) => r.status === 'Rejected')
        : cancellationRequests;

  if (orderStartDate) {
    const start = new Date(orderStartDate).getTime();
    visibleCancellationRequests = visibleCancellationRequests.filter((r) => {
      const created = new Date(r.requestDate).getTime();
      return created >= start;
    });
  }
  if (orderEndDate) {
    const end = new Date(orderEndDate);
    end.setHours(23, 59, 59, 999);
    visibleCancellationRequests = visibleCancellationRequests.filter((r) => {
      const created = new Date(r.requestDate).getTime();
      return created <= end.getTime();
    });
  }
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

  const formatCancellationDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return { date: 'Date unavailable', time: '' };
    return {
      date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const renderWithSafeBreaks = (value: string) => value
    .split(/([@._/-])/)
    .map((part, index) => (
      <React.Fragment key={`${part}-${index}`}>
        {part}
        {/^[.@_/-]$/.test(part) ? <wbr /> : null}
      </React.Fragment>
    ));

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
        <>
        <div className="table-responsive cancellation-requests-table-wrap">
          <table className="admin-table compact-table cancellation-requests-table">
            <colgroup>
              <col style={{ width: '8%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '12%' }} />
            </colgroup>
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
              {visibleCancellationRequests.map((request) => {
                const isPending = request.status === 'Pending';
                return (
                  <tr key={request.requestId}>
                    <td className="cancellation-status-cell">
                      <span className={`badge ${isPending ? 'badge-orange' : request.status === 'Approved' ? 'badge-success' : 'badge-cancelled'}`}>{request.status}</span>
                    </td>
                    <td className="cancellation-order-cell">
                      <strong className="order-id-link cancellation-safe-value">{renderWithSafeBreaks(request.orderId)}</strong>
                      <small>{formatCurrency(request.orderTotal)}</small>
                    </td>
                    <td className="cancellation-customer-cell">
                      <div>{request.customerName}</div>
                      <small className="cancellation-mobile">{request.customerMobile}</small>
                      <small className="cancellation-email cancellation-safe-value">
                        {request.customerEmail ? renderWithSafeBreaks(request.customerEmail) : 'No email'}
                      </small>
                    </td>
                    <td className="cancellation-date-cell">
                      <span>{formatCancellationDate(request.requestDate).date}</span>
                      <small>{formatCancellationDate(request.requestDate).time}</small>
                      {request.approvalDate ? (
                        <span className="cancellation-reviewed-date">
                          Reviewed: {formatCancellationDate(request.approvalDate).date}, {formatCancellationDate(request.approvalDate).time}
                        </span>
                      ) : null}
                    </td>
                    <td className="cancellation-payment-cell">
                      <span><b>Pay:</b> {request.paymentMethod || 'Cash on Delivery'}</span>
                      <small><b>Refund:</b> {request.refundStatus || 'Pending approval'}</small>
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
                    <td className="sticky-action-col cancellation-actions-cell">
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
                        request.statusHistory?.length ? (() => {
                          const latestAction = request.statusHistory[request.statusHistory.length - 1];
                          return (
                            <span className="cancellation-action-history">
                              <strong className={`history-status-${latestAction.status.toLowerCase()}`}>{latestAction.status}</strong>
                              <small>
                                {formatCancellationDate(latestAction.at).date}
                                {latestAction.by ? ` · ${latestAction.by}` : ''}
                              </small>
                            </span>
                          );
                        })() : <small>Reviewed</small>
                      )}
                    </td>
                  </tr>
                );
              })}
              {visibleCancellationRequests.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-td">No cancellation requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mobile-cancellation-list">
          {visibleCancellationRequests.map((request) => {
            const isPending = request.status === 'Pending';
            const requestDate = formatCancellationDate(request.requestDate);
            return (
              <article className="mobile-cancellation-card" key={request.requestId}>
                <div className="mobile-cancellation-card-head">
                  <span className={`badge ${isPending ? 'badge-orange' : request.status === 'Approved' ? 'badge-success' : 'badge-cancelled'}`}>{request.status}</span>
                  <strong className="mobile-cancellation-order-id">{renderWithSafeBreaks(request.orderId)}</strong>
                </div>
                <dl className="mobile-cancellation-details">
                  <div><dt>Customer</dt><dd>{request.customerName}<small>{request.customerMobile}</small></dd></div>
                  <div><dt>Request Date</dt><dd className="mobile-cancellation-date">{requestDate.date}<small>{requestDate.time}</small></dd></div>
                  <div><dt>Payment / Refund</dt><dd>{request.paymentMethod || 'Cash on Delivery'}<small>{request.refundStatus || 'Pending approval'}</small></dd></div>
                  <div><dt>Reason</dt><dd>{request.reason || 'Not specified'}</dd></div>
                  <div className="mobile-cancellation-remarks"><dt>Admin Remarks</dt><dd>
                    {isPending ? (
                      <textarea
                        className="form-input remarks-textarea"
                        value={remarksByRequest[request.requestId] || ''}
                        onChange={(event) => setRemarksByRequest((prev) => ({ ...prev, [request.requestId]: event.target.value }))}
                        placeholder="Audit remarks"
                        rows={2}
                      />
                    ) : request.adminRemarks || 'No remarks recorded'}
                  </dd></div>
                </dl>
                <div className="mobile-cancellation-actions">
                  {isPending ? (
                    <>
                      <button type="button" className="btn-table btn-reject" onClick={() => reviewCancellation(request, 'Rejected')}>✕ Reject</button>
                      <button type="button" className="btn-table btn-approve" onClick={() => reviewCancellation(request, 'Approved')}>✓ Approve</button>
                    </>
                  ) : request.statusHistory?.length ? (() => {
                    const latestAction = request.statusHistory[request.statusHistory.length - 1];
                    return <span className="mobile-cancellation-reviewed"><strong>{latestAction.status}</strong><small>{formatCancellationDate(latestAction.at).date}{latestAction.by ? ` · ${latestAction.by}` : ''}</small></span>;
                  })() : <span className="mobile-cancellation-reviewed">Reviewed</span>}
                </div>
              </article>
            );
          })}
          {visibleCancellationRequests.length === 0 && (
            <div className="mobile-cancellation-empty">
              <span className="mobile-cancellation-empty-icon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/></svg>
              </span>
              <strong>No cancellation requests found</strong>
              <p>New customer requests will appear here.</p>
            </div>
          )}
        </div>
        </>
      ) : (
        <>
        <div className={`filter-bar orders-filter-panel ${showFilters ? 'filters-open animate-fade-in' : 'filters-closed'}`} aria-hidden={!showFilters}>
          <div className="filter-group">
            <label>Status:</label>
            <CustomSelect
              value={orderStatusFilter}
              onChange={setOrderStatusFilter}
              clearable={true}
              onClear={() => setOrderStatusFilter('All')}
              portalMenu
              options={[
                { value: 'All', label: 'All Status' },
                { value: 'Pending', label: 'Pending' },
                { value: 'InTransit', label: 'In Transit Orders' },
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
              portalMenu
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
              portalMenu
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
      <div className="table-responsive active-orders-table-wrap">
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
      <div className="mobile-orders-list">
        {visibleOrders.map((order, index) => (
          <article className="mobile-order-card" key={order.orderId || index}>
            <div className="mobile-order-primary">
              <strong className="mobile-order-id">{renderWithSafeBreaks(order.orderId || `Order ${index + 1}`)}</strong>
              <time className="mobile-order-date" dateTime={order.createdAt || undefined}>
                {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Date unavailable'}
              </time>
            </div>
            <div className="mobile-order-summary">
              <span className={`badge ${getStatusBadge(order.status)}`}>{order.status}</span>
              <strong>{formatCurrency(order.total)}</strong>
            </div>
            <button
              type="button"
              className="btn-table btn-edit mobile-manage-status"
              onClick={() => {
                setSelectedOrder(order);
                setOrderStatusVal(order.status);
              }}
            >
              Manage Status
            </button>
          </article>
        ))}
        {visibleOrders.length === 0 && <div className="mobile-orders-empty">No active orders found.</div>}
      </div>
        </>
      )}
      <style jsx>{`
        .cancellation-requests-table-wrap {
          width: 100%;
          min-height: 0 !important;
          height: auto !important;
          max-height: none !important;
          overflow: visible !important;
        }
        .cancellation-requests-table {
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
          table-layout: fixed !important;
          font-size: clamp(.61rem, .72vw, .72rem) !important;
        }
        .cancellation-requests-table :is(th, td) {
          vertical-align: middle !important;
          word-break: normal !important;
          overflow-wrap: normal;
          white-space: normal;
          padding: clamp(.36rem, .55vw, .55rem) clamp(.28rem, .45vw, .48rem) !important;
          line-height: 1.28 !important;
        }
        .cancellation-requests-table th {
          font-size: clamp(.56rem, .63vw, .65rem) !important;
          line-height: 1.15 !important;
          letter-spacing: .025em !important;
        }
        .cancellation-requests-table .sticky-action-col {
          position: static !important;
          right: auto !important;
          box-shadow: none !important;
        }
        .cancellation-status-cell .badge,
        .cancellation-actions-cell .btn-table {
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
          word-break: keep-all !important;
          overflow-wrap: normal;
        }
        .cancellation-status-cell .badge {
          padding: .2rem .38rem !important;
          border-radius: .35rem !important;
          font-size: clamp(.54rem, .6vw, .62rem) !important;
          line-height: 1 !important;
        }
        .cancellation-order-cell,
        .cancellation-customer-cell,
        .cancellation-date-cell,
        .cancellation-payment-cell {
          line-height: 1.35;
        }
        .cancellation-order-cell,
        .cancellation-customer-cell,
        .cancellation-date-cell,
        .cancellation-payment-cell {
          display: table-cell;
        }
        .cancellation-order-cell small,
        .cancellation-customer-cell small,
        .cancellation-date-cell small,
        .cancellation-payment-cell small {
          display: block;
          margin-top: .22rem;
        }
        .cancellation-safe-value {
          overflow-wrap: normal !important;
          word-break: normal !important;
        }
        .cancellation-mobile {
          white-space: nowrap;
        }
        .cancellation-date-cell > span:first-child,
        .cancellation-date-cell > small {
          white-space: nowrap;
        }
        .cancellation-reviewed-date {
          display: block;
          margin-top: .25rem;
          color: var(--text-muted);
          font-size: .62rem;
        }
        .cancellation-payment-cell > span {
          display: block;
        }
        .cancellation-payment-cell b {
          color: var(--text-secondary);
          font-size: .95em;
        }
        .cancellation-actions-cell .actions-flex {
          display: grid;
          grid-template-columns: 1fr;
          gap: .28rem !important;
          min-width: 0;
        }
        .cancellation-actions-cell .btn-table {
          justify-content: center;
          width: 100%;
          min-height: 1.7rem !important;
          padding: .24rem .34rem !important;
          font-size: clamp(.55rem, .62vw, .64rem) !important;
        }
        .cancellation-action-history {
          display: flex;
          flex-direction: column;
          gap: .15rem;
        }
        .cancellation-action-history strong {
          color: var(--text-primary);
          font-size: .66rem;
          white-space: nowrap;
        }
        .cancellation-action-history .history-status-approved {
          color: #16a34a;
        }
        .cancellation-action-history .history-status-pending {
          color: #ea580c;
        }
        .cancellation-action-history .history-status-rejected {
          color: #dc2626;
        }
        .cancellation-action-history small {
          color: var(--text-muted);
          font-size: .59rem;
          line-height: 1.2;
        }
        .remarks-textarea {
          min-height: 2.8rem !important;
          padding: .38rem .42rem !important;
          font-size: .66rem !important;
          line-height: 1.25 !important;
        }
      `}</style>
    </div>
  );
});
