import React, { useState } from 'react';
import { OrderRecord, Inquiry, CancellationRequest, Product, AdminUser } from '@/types/cms';
import { formatCurrency } from '@/frontend/customer/utils/commerce';
import { calculateDonutStats, calculateLineChartData, formatDateLabel, ChartPoint } from '../utils/chartUtils';
import LogoutConfirmationModal from '@/frontend/customer/components/LogoutConfirmationModal';

interface DashboardTabProps {
  orders: OrderRecord[];
  products: Product[];
  users: AdminUser[];
  filteredInquiries: Inquiry[];
  filteredOrders: OrderRecord[];
  cancellationRequests: CancellationRequest[];
  onReviewCancellation: (requestId: string, decision: 'Approved' | 'Rejected', adminRemarks: string) => Promise<boolean>;
  onOpenCancellationRequests: () => void;
}

export default function DashboardTab({ orders, products, users, filteredInquiries, filteredOrders, cancellationRequests, onReviewCancellation, onOpenCancellationRequests }: DashboardTabProps) {
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);
  const [remarksByRequest, setRemarksByRequest] = useState<Record<string, string>>({});
  
  // Confirmation Modal State
  const [confirmAction, setConfirmAction] = useState<{request: CancellationRequest, decision: 'Approved' | 'Rejected'} | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [toastMsg, setToastMsg] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  // Stats calculations
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Financials
  const deliveredOrders = orders.filter(o => o.status === 'Delivered');
  const totalRevenue = deliveredOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const avgOrderValue = deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;

  // Customers
  const customerOrdersMap = new Map<string, number>();
  orders.forEach(o => {
    if (o.customer?.mobile) {
      customerOrdersMap.set(o.customer.mobile, (customerOrdersMap.get(o.customer.mobile) || 0) + 1);
    }
  });

  const totalCustomers = customerOrdersMap.size;

  // Chart calculations
  const { statusStats, totalOrdersCount } = calculateDonutStats(orders);
  const { linePoints, linePathD, areaPathD, chartMax } = calculateLineChartData(orders);
  const pendingCancellationRequests = cancellationRequests.filter((request) => request.status === 'Pending');

  const initiateReview = (request: CancellationRequest, decision: 'Approved' | 'Rejected') => {
    setConfirmAction({ request, decision });
  };

  const executeReview = async () => {
    if (!confirmAction) return;
    setIsProcessingAction(true);
    try {
      const { request, decision } = confirmAction;
      const success = await onReviewCancellation(request.requestId, decision, remarksByRequest[request.requestId] || '');
      if (success) {
        setRemarksByRequest((prev) => {
          const next = { ...prev };
          delete next[request.requestId];
          return next;
        });
        setToastMsg({ text: `Successfully ${decision.toLowerCase()} request.`, type: 'success' });
      } else {
        setToastMsg({ text: `Failed to process request.`, type: 'error' });
      }
    } catch (e) {
      setToastMsg({ text: `Error processing request.`, type: 'error' });
    } finally {
      setIsProcessingAction(false);
      setConfirmAction(null);
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!linePoints || linePoints.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgX = (clientX / rect.width) * 500;
    
    let closest = linePoints[0];
    let minDiff = Math.abs(linePoints[0].x - svgX);
    
    for (let i = 1; i < linePoints.length; i++) {
      const diff = Math.abs(linePoints[i].x - svgX);
      if (diff < minDiff) {
        minDiff = diff;
        closest = linePoints[i];
      }
    }
    
    setHoveredPoint(closest);
  };

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

  return (
    <div className="overview-tab">
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`toast animate-fade-in ${toastMsg.type === 'success' ? 'toast-success' : 'toast-error'}`} style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, padding: '1rem', borderRadius: '8px', background: toastMsg.type === 'success' ? '#10b981' : '#ef4444', color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {toastMsg.text}
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card glass card-revenue">
          <div className="stat-header">
            <span className="stat-label">Total Revenue</span>
            <div className="stat-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
          </div>
          <strong className="stat-val">{formatCurrency(totalRevenue)}</strong>
          <span className="stat-desc">From completed orders</span>
        </div>
        
        <div className="stat-card glass card-orders">
          <div className="stat-header">
            <span className="stat-label">Total Orders</span>
            <div className="stat-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"/></svg></div>
          </div>
          <strong className="stat-val">{orders.length}</strong>
          <span className="stat-desc">All tracking statuses</span>
        </div>
        
        <div className="stat-card glass card-aov">
          <div className="stat-header">
            <span className="stat-label">Avg. Order Value</span>
            <div className="stat-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 18V6"/></svg></div>
          </div>
          <strong className="stat-val">{formatCurrency(avgOrderValue)}</strong>
          <span className="stat-desc">Per completed delivery</span>
        </div>
        
        <div className="stat-card glass card-customers">
          <div className="stat-header">
            <span className="stat-label">Total Customers</span>
            <div className="stat-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
          </div>
          <strong className="stat-val">{totalCustomers}</strong>
          <span className="stat-desc">Unique mobile registers</span>
        </div>
      </div>

      {/* SVG Charts section */}
      <div className="charts-grid">
        {/* Revenue Line Chart */}
        <div className="chart-card glass">
          <h3>Revenue Trend (Delivered Orders)</h3>
          <div className="chart-wrapper">
            <svg 
              viewBox="0 0 500 200" 
              className="svg-chart"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoveredPoint(null)}
              style={{ overflow: 'visible' }}
            >
              {/* Grid lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="var(--border-color)" strokeDasharray="4 4" />
              <line x1="40" y1="70" x2="480" y2="70" stroke="var(--border-color)" strokeDasharray="4 4" />
              <line x1="40" y1="120" x2="480" y2="120" stroke="var(--border-color)" strokeDasharray="4 4" />
              <line x1="40" y1="170" x2="480" y2="170" stroke="var(--border-color)" />
              
              {/* Area Gradient */}
              {areaPathD && (
                <path
                  d={areaPathD}
                  fill="url(#chartAreaGrad)"
                />
              )}
              
              {/* Line */}
              {linePathD && (
                <path
                  d={linePathD}
                  fill="none"
                  stroke="var(--primary-color)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              )}
              
              {/* Points */}
              {linePoints.map((p, idx) => (
                <circle 
                  key={idx} 
                  cx={p.x} 
                  cy={p.y} 
                  r={hoveredPoint?.date === p.date ? 6 : 4} 
                  fill="var(--primary-color)"
                  style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                />
              ))}

              {/* Labels */}
              {linePoints.map((p, idx) => {
                if (idx === 0 || idx === 2 || idx === 4 || idx === 6) {
                  return (
                    <text key={idx} x={p.x} y="190" textAnchor="middle" fontSize="9" fill="var(--text-secondary)">
                      {formatDateLabel(p.date)}
                    </text>
                  );
                }
                return null;
              })}

              {/* Hover Tooltip Overlay */}
              {hoveredPoint && (
                <g style={{ pointerEvents: 'none' }}>
                  {/* Vertical indicator line */}
                  <line 
                    x1={hoveredPoint.x} 
                    y1={hoveredPoint.y} 
                    x2={hoveredPoint.x} 
                    y2={170} 
                    stroke="var(--primary-color)" 
                    strokeWidth="1.5" 
                    strokeDasharray="2 2" 
                  />
                  
                  {/* Pulsing highlight ring */}
                  <circle 
                    cx={hoveredPoint.x} 
                    cy={hoveredPoint.y} 
                    r="8" 
                    fill="transparent" 
                    stroke="var(--primary-color)" 
                    strokeWidth="1.5" 
                    style={{ opacity: 0.5 }}
                  />
                  
                  {/* Tooltip block */}
                  <g transform={`translate(${hoveredPoint.x > 380 ? hoveredPoint.x - 110 : hoveredPoint.x < 120 ? hoveredPoint.x : hoveredPoint.x - 55}, ${hoveredPoint.y - 45})`}>
                    <rect 
                      width="110" 
                      height="36" 
                      rx="6" 
                      fill="var(--glass-bg)" 
                      stroke="var(--primary-color)" 
                      strokeWidth="1" 
                      style={{ 
                        filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.15))', 
                        backdropFilter: 'blur(4px)' 
                      }} 
                    />
                    <text x="55" y="14" textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--text-primary)">
                      {formatDateLabel(hoveredPoint.date)}
                    </text>
                    <text x="55" y="27" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="var(--primary-color)">
                      {formatCurrency(hoveredPoint.revenue)}
                    </text>
                  </g>
                </g>
              )}

              <defs>
                <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary-color)" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="var(--primary-color)" stopOpacity="0.0"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Order Status Donut Chart */}
        <div className="chart-card glass">
          <h3>Orders Status Distribution</h3>
          <div className="donut-chart-flex">
            <div className="donut-chart-container">
              <svg viewBox="0 0 160 160" width="140" height="140" className="donut-svg">
                <circle cx="80" cy="80" r="60" fill="transparent" stroke="var(--border-color)" strokeWidth="15" />
                {statusStats.map((stat, idx) => stat.count > 0 && (
                  <circle key={idx} cx="80" cy="80" r="60" fill="transparent" stroke={stat.color} strokeWidth="15" 
                          strokeDasharray={stat.dashArray} strokeDashoffset={stat.dashOffset} />
                ))}
              </svg>
              <div className="donut-chart-text">
                <strong className="donut-total-count">{totalOrdersCount}</strong>
                <span className="donut-total-label">Total</span>
              </div>
            </div>
            <div className="legend-list-grid">
              {statusStats.map((stat, idx) => (
                <div key={idx} className="legend-item" style={{ opacity: stat.count > 0 ? 1 : 0.4 }}>
                  <div className="legend-item-left">
                    <span className="legend-color-dot" style={{ backgroundColor: stat.color }}></span>
                    {stat.name}
                  </div>
                  <strong>{stat.count}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation approvals and Orders lists */}
      <div className="recent-activity-grid">
        <div className="activity-card glass cancellation-card">
          <div className="activity-card-header">
            <div>
              <h3>Cancellation Approvals</h3>
              <p>
                Review customer requests before an order is cancelled.
              </p>
            </div>
            <button
              type="button"
              className="badge badge-orange cancellation-count-btn"
              onClick={onOpenCancellationRequests}
              title="Open cancellation requests"
            >
              {pendingCancellationRequests.length} Pending
            </button>
          </div>
          <div className="table-responsive dashboard-cancellation-table" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table className="admin-table compact-table">
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                <tr>
                  <th style={{ background: 'var(--bg-secondary)' }}>Status</th>
                  <th style={{ background: 'var(--bg-secondary)' }}>Order</th>
                  <th style={{ background: 'var(--bg-secondary)' }}>Customer</th>
                  <th style={{ background: 'var(--bg-secondary)' }}>Requested</th>
                  <th style={{ background: 'var(--bg-secondary)' }}>Payment / Refund</th>
                  <th style={{ background: 'var(--bg-secondary)' }}>Admin Remarks</th>
                  <th className="sticky-action-col" style={{ background: 'var(--bg-secondary)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingCancellationRequests.slice(0, 3).map((request) => (
                  <tr key={request.requestId}>
                    <td><span className="badge badge-orange">{request.status}</span></td>
                    <td>
                      <strong className="order-id-link">{request.orderId}</strong>
                      <br />
                      <small>{formatCurrency(request.orderTotal)}</small>
                    </td>
                    <td>
                      <div>{request.customerName}</div>
                      <small>{request.customerMobile} - {request.customerEmail || 'No email'}</small>
                    </td>
                    <td>{new Date(request.requestDate).toLocaleString('en-IN')}</td>
                    <td>
                      <div>{request.paymentMethod || 'Cash on Delivery'}</div>
                      <small>{request.refundStatus || 'Pending approval'}</small>
                    </td>
                    <td className="remarks-col">
                      <textarea
                        className="form-input remarks-textarea"
                        value={remarksByRequest[request.requestId] || ''}
                        onChange={(event) => setRemarksByRequest((prev) => ({ ...prev, [request.requestId]: event.target.value }))}
                        placeholder="Audit remarks"
                        rows={2}
                      />
                    </td>
                    <td className="sticky-action-col">
                      <div className="actions-flex row-wrap">
                        <button type="button" className="btn-table btn-reject" onClick={() => initiateReview(request, 'Rejected')}>✗ Reject</button>
                        <button type="button" className="btn-table btn-approve" onClick={() => initiateReview(request, 'Approved')}>✓ Approve</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pendingCancellationRequests.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty-td">No pending cancellation requests.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="cancellation-mobile-list">
            {pendingCancellationRequests.slice(0, 3).map((request) => (
              <div key={request.requestId} className="cancellation-mobile-item">
                <div className="cancellation-mobile-top">
                  <span className="badge badge-orange">{request.status}</span>
                  <strong>{request.orderId}</strong>
                </div>
                <div className="cancellation-mobile-grid">
                  <span>Customer</span>
                  <strong>{request.customerName}</strong>
                  <span>Mobile</span>
                  <strong>{request.customerMobile}</strong>
                  <span>Total</span>
                  <strong>{formatCurrency(request.orderTotal)}</strong>
                  <span>Requested</span>
                  <strong>{new Date(request.requestDate).toLocaleDateString('en-IN')}</strong>
                </div>
                <textarea
                  className="form-input"
                  value={remarksByRequest[request.requestId] || ''}
                  onChange={(event) => setRemarksByRequest((prev) => ({ ...prev, [request.requestId]: event.target.value }))}
                  placeholder="Audit remarks"
                  rows={2}
                />
                <div className="cancellation-mobile-actions">
                  <button type="button" className="btn-table btn-reject" onClick={() => initiateReview(request, 'Rejected')}>✗ Reject</button>
                  <button type="button" className="btn-table btn-approve" onClick={() => initiateReview(request, 'Approved')}>✓ Approve</button>
                </div>
              </div>
            ))}
            {pendingCancellationRequests.length === 0 && (
              <div className="empty-td">No pending cancellation requests.</div>
            )}
          </div>
        </div>

      </div>

      {/* Confirmation Modal using Reusable Component */}
      <LogoutConfirmationModal
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={executeReview}
        title="Confirm Action"
        description={confirmAction ? `Are you sure you want to ${confirmAction.decision === 'Approved' ? 'approve' : 'reject'} this cancellation request?` : ''}
        confirmText="Confirm"
        cancelText="Cancel"
        confirmButtonClass={confirmAction?.decision === 'Approved' ? 'btn btn-primary' : 'btn btn-error'}
        isProcessing={isProcessingAction}
      />
    </div>
  );
}
