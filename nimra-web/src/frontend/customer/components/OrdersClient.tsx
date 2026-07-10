'use client';

import React, { useState, useMemo, useDeferredValue } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/frontend/customer/hooks/useAuth';
import { useCustomerOrders, clearCustomerOrdersCache } from '@/frontend/customer/hooks/useCustomerOrders';
import { useCart } from '../contexts/CartProvider';
import { OrderRecord } from '@/types/cms';
import { formatCurrency } from '../utils/commerce';
import { createReorderCheckoutDraft } from '../utils/reorderDraft';
import { requestOrderCancellation } from '@/utils/api';
import { useNotification } from '@/frontend/customer/contexts/NotificationContext';
import dynamic from 'next/dynamic';
import ProductImage from './ProductImage';
import CustomerPageHeader from './CustomerPageHeader';

const OrderDetailsModal = dynamic(() => import('./portal/OrderDetailsModal'), { ssr: false });
const CancelOrderModal = dynamic(() => import('./portal/CancelOrderModal'), { ssr: false });

type OrderTab = 'all' | 'active' | 'completed' | 'cancelled' | 'checkout-required';

const formatDate = (value?: string) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function OrdersClient() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { orders, loadingOrders, refreshOrders } = useCustomerOrders();
  const { items: cartItems, subtotal, totalItems } = useCart();
  const { notify } = useNotification();

  const [activeTab, setActiveTab] = useState<OrderTab>('all');
  const [dateFilter, setDateFilter] = useState<'all' | '30days' | '6months' | 'year'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<OrderRecord | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visibleOrderCount, setVisibleOrderCount] = useState(10);
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;
    setCancelling(true);
    try {
      const res = await requestOrderCancellation(orderToCancel.orderId);
      if (res.success) {
        clearCustomerOrdersCache(user?.ID);
        notify.success('Cancellation Requested', `Cancellation request for ${orderToCancel.orderId} submitted for admin approval.`);
        refreshOrders();
        if (selectedOrder && selectedOrder.orderId === orderToCancel.orderId) {
          setSelectedOrder({ ...selectedOrder, cancellationStatus: 'Pending' });
        }
      } else {
        notify.error('Cancellation Failed', res.message || 'Failed to cancel the order. Please try again.');
      }
    } catch (error) {
      console.error(error);
      notify.error('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setCancelling(false);
      setOrderToCancel(null);
    }
  };

  const handleReorder = (order: OrderRecord) => {
    try {
      const draft = createReorderCheckoutDraft(order);
      if (!draft) {
        notify.error('Cannot Reorder', 'This order has no reorderable items.');
        return;
      }
      notify.success('Reordering Items', `Reordering ${draft.items.length} product${draft.items.length === 1 ? '' : 's'} from ${order.orderId}`);
      setSelectedOrder(null);
      router.push('/checkout?reorder=1');
    } catch (error) {
      console.error(error);
      notify.error('Reorder Failed', 'Failed to start reorder checkout.');
    }
  };

  const filteredOrders = useMemo(() => {
    const normalizedSearch = deferredSearchQuery.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesSearch =
        !normalizedSearch ||
        order.orderId.toLowerCase().includes(normalizedSearch) ||
        order.items.some((item) => item.name.toLowerCase().includes(normalizedSearch));

      if (!matchesSearch) return false;

      // Date filtering
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const orderDate = new Date(order.createdAt || '');
        if (Number.isNaN(orderDate.getTime())) return false;
        const diffTime = new Date().getTime() - orderDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return false;
        if (dateFilter === '30days') matchesDate = diffDays <= 30;
        else if (dateFilter === '6months') matchesDate = diffDays <= 180;
        else if (dateFilter === 'year') matchesDate = diffDays <= 365;
      }

      if (!matchesDate) return false;

      const status = order.status.toLowerCase();
      switch (activeTab) {
        case 'active':
          return !['delivered', 'cancelled'].includes(status);
        case 'completed':
          return status === 'delivered';
        case 'cancelled':
          return status === 'cancelled';
        case 'checkout-required':
          return order.paymentMethod?.toLowerCase().includes('online') && ['pending', 'cancelled'].includes(status);
        case 'all':
        default:
          return true;
      }
    });
  }, [orders, deferredSearchQuery, activeTab, dateFilter]);

  React.useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || visibleOrderCount >= filteredOrders.length) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisibleOrderCount((count) => Math.min(count + 10, filteredOrders.length));
    }, { rootMargin: '300px' });
    observer.observe(target);
    return () => observer.disconnect();
  }, [filteredOrders.length, visibleOrderCount]);

  if (!mounted || authLoading) return null;

  if (!isAuthenticated) {
    return (
      <div className="guest-state-container container animate-fade-in">
        <div className="guest-card glass card">
          <div className="guest-icon">🔒</div>
          <h2>Access Restricted</h2>
          <p>Please log in to your account to view your order history, track deliveries, and manage reorders.</p>
          <div className="guest-actions">
            <Link href="/login" className="btn btn-primary">
              Login / Register
            </Link>
          </div>
        </div>
        <style jsx>{`
          .guest-state-container {
            min-height: 80vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding-top: 100px;
          }
          .guest-card {
            max-width: 480px;
            width: 100%;
            padding: 3.5rem 2.5rem;
            text-align: center;
            border-radius: var(--radius-xl);
            box-shadow: var(--shadow-xl);
          }
          .guest-icon {
            font-size: 3.5rem;
            margin-bottom: 1.5rem;
          }
          .guest-card h2 {
            font-size: 1.8rem;
            margin-bottom: 0.75rem;
          }
          .guest-card p {
            color: var(--text-secondary);
            margin-bottom: 2rem;
            line-height: 1.6;
          }
          .guest-actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
          }
          @media (max-width: 480px) {
            .guest-actions {
              flex-direction: column;
            }
          }
        `}</style>
      </div>
    );
  }

  interface TimelineStep {
    key: string;
    label: string;
    desc: string;
    completed: boolean;
    active: boolean;
    isError?: boolean;
  }

  const getTimelineSteps = (status: string): TimelineStep[] => {
    const activeStatus = status.toLowerCase();
    const steps = [
      { key: 'pending', label: 'Order Placed', desc: 'Awaiting confirmation' },
      { key: 'confirmed', label: 'Confirmed', desc: 'Accepted by team' },
      { key: 'processing', label: 'Processing', desc: 'Preparing & packaging' },
      { key: 'dispatched', label: 'Dispatched', desc: 'In transit' },
      { key: 'delivered', label: 'Delivered', desc: 'Received successfully' },
    ];

    if (activeStatus === 'cancelled') {
      return [
        { key: 'pending', label: 'Placed', desc: 'Order placed', completed: true, active: false, isError: false },
        { key: 'cancelled', label: 'Cancelled', desc: 'This order was cancelled', completed: true, active: false, isError: true },
      ];
    }

    let currentStepIndex = 0;
    if (activeStatus === 'confirmed') currentStepIndex = 1;
    else if (activeStatus === 'processing') currentStepIndex = 2;
    else if (['dispatched', 'out for delivery'].includes(activeStatus)) currentStepIndex = 3;
    else if (activeStatus === 'delivered') currentStepIndex = 4;

    return steps.map((step, idx) => ({
      ...step,
      completed: idx <= currentStepIndex,
      active: idx === currentStepIndex,
      isError: false,
    }));
  };

  return (
    <div className="orders-page container">
      <CustomerPageHeader
        badge="ORDERS"
        title="My Orders"
        subtitle="Track delivery status, view invoices, cancel pending orders, or place rapid reorders."
      />

      {/* Main Layout Grid */}
      <div className="orders-layout-grid animate-fade-in">
        {/* Sidebar Filters */}
        <aside className="orders-sidebar card">
          <div className="sidebar-section">
            <h3><span className="section-icon" aria-hidden="true">&#9776;</span> Filter by Status</h3>
            <div className="filter-options">
              {(
                [
                  { id: 'all', label: 'All Orders' },
                  { id: 'active', label: 'Active / Pending' },
                  { id: 'completed', label: 'Completed' },
                  { id: 'cancelled', label: 'Cancelled' },
                  { id: 'checkout-required', label: 'Checkout Required' },
                ] as const
              ).map((tab) => (
                <label key={tab.id} className="filter-label">
                  <input
                    type="radio"
                    name="status-filter"
                    checked={activeTab === tab.id}
                    onChange={() => setActiveTab(tab.id)}
                    className="filter-radio"
                  />
                  <span>{tab.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h3><span className="section-icon" aria-hidden="true">&#128197;</span> Order Date</h3>
            <div className="filter-options">
              {(
                [
                  { id: 'all', label: 'Anytime' },
                  { id: '30days', label: 'Last 30 Days' },
                  { id: '6months', label: 'Last 6 Months' },
                  { id: 'year', label: 'Past Year' },
                ] as const
              ).map((opt) => (
                <label key={opt.id} className="filter-label">
                  <input
                    type="radio"
                    name="date-filter"
                    checked={dateFilter === opt.id}
                    onChange={() => setDateFilter(opt.id)}
                    className="filter-radio"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button className="btn btn-secondary btn-sm refresh-btn" onClick={refreshOrders} disabled={loadingOrders}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            {loadingOrders ? 'Refreshing...' : 'Refresh List'}
          </button>
        </aside>

        {/* Main Orders Section */}
        <main className="orders-main-content">
          {/* Top Search Bar */}
          <div className="search-bar-wrapper card">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input
              type="text"
              placeholder="Search all orders by ID or item name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button className="search-clear-btn" onClick={() => setSearchQuery('')}>✕</button>
            )}
          </div>



          {/* Orders Cards List */}
          {!loadingOrders && activeTab === 'active' && filteredOrders.length > 0 && (
            <div className="orders-priority-strip">
              <strong>Active and pending orders are shown first.</strong>
              <span>Use the filters to view completed or cancelled history.</span>
            </div>
          )}

          {loadingOrders && activeTab !== 'checkout-required' ? (
            <div className="orders-cards-list" aria-label="Loading orders" aria-busy="true">
              {[0, 1, 2].map((index) => (
                <div className="order-skeleton" key={index}>
                  <div className="skeleton-header"><span /><span /><span /><span /></div>
                  <div className="skeleton-body">
                    <div className="skeleton-image shimmer" />
                    <div className="skeleton-copy"><span className="shimmer" /><span className="shimmer short" /><span className="shimmer tiny" /></div>
                    <div className="skeleton-actions"><span className="shimmer" /><span className="shimmer" /></div>
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === 'checkout-required' ? (
            /* ── Checkout Required: show current cart items ── */
            cartItems.length > 0 ? (
              <div className="orders-cards-list">
                <div className="amazon-order-card card">
                  {/* Card Header */}
                  <div className="amazon-card-header">
                    <div className="header-meta-columns">
                      <div className="meta-col">
                        <span className="meta-label">ITEMS IN CART</span>
                        <span className="meta-value">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="meta-col">
                        <span className="meta-label">SUBTOTAL</span>
                        <span className="meta-value highlight-price">{formatCurrency(subtotal)}</span>
                      </div>
                    </div>
                    <div className="header-id-column">
                      <span className="meta-label">STATUS</span>
                      <span className="meta-value checkout-required-status">Checkout Required</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="amazon-card-body">
                    <div className="card-body-content-split">
                      <div className="items-list-column">
                        {cartItems.map((item) => (
                          <div key={item.productId} className="amazon-item-row">
                            <div className="item-img-wrapper">
                              {item.imageUrl ? (
                                <ProductImage src={item.imageUrl} alt={item.name} />
                              ) : (
                                <span className="fallback-box">📦</span>
                              )}
                            </div>
                            <div className="item-details-column">
                              <h4 className="item-title-txt">{item.name}</h4>
                              <span className="item-meta-txt">{item.category} | {item.volume}</span>
                              <span className="item-price-qty">{item.quantity} × {formatCurrency(item.price)}</span>
                            </div>
                            <div className="item-status-column">
                              <div className="status-label-group">
                                <span className="status-dot-indicator pending"></span>
                                <span className="status-header-text">In Cart</span>
                              </div>
                              <span className="status-desc-text">{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="actions-column" onClick={(e) => e.stopPropagation()}>
                        <Link href="/checkout" className="orders-checkout-link">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                          </svg>
                          Proceed to Checkout
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-orders card animate-scale-in">
                <div className="empty-icon-glow">🛒</div>
                <h3>Cart is Empty</h3>
                <p>Add items to your cart to proceed with checkout.</p>
                <Link href="/products" className="btn btn-primary">
                  Shop Products
                </Link>
              </div>
            )
          ) : filteredOrders.length > 0 ? (
            <div className="orders-cards-list">
              {filteredOrders.slice(0, visibleOrderCount).map((order) => {
                const hasPendingCancellation = order.cancellationStatus === 'Pending';
                const isCancelable = ['pending', 'confirmed'].includes(order.status.toLowerCase()) && !hasPendingCancellation;
                const statusLower = order.status.toLowerCase();
                const cancellationClosed = ['processing', 'dispatched', 'out for delivery', 'delivered'].includes(statusLower);

                return (
                  <div key={order.orderId} className="amazon-order-card card" onClick={() => setSelectedOrder(order)}>
                    {/* Card Top Thin Bar */}
                    <div className="amazon-card-header">
                      <div className="header-meta-columns">
                        <div className="meta-col">
                          <span className="meta-icon" aria-hidden="true">&#128197;</span>
                          <span className="meta-label">Order Date</span>
                          <span className="meta-value">{formatDate(order.createdAt)}</span>
                        </div>
                        <div className="meta-col">
                          <span className="meta-icon" aria-hidden="true">&#8377;</span>
                          <span className="meta-label">Total</span>
                          <span className="meta-value highlight-price">{formatCurrency(Number(order.total || 0))}</span>
                        </div>
                        <div className="meta-col tooltip-trigger" onClick={(e) => e.stopPropagation()}>
                          <span className="meta-icon" aria-hidden="true">&#128100;</span>
                          <span className="meta-label">Ship To</span>
                          <span className="meta-value underline-dotted">{order.customer.name}</span>
                          <div className="address-tooltip-bubble">
                            <div className="tooltip-title">{order.customer.name}</div>
                            <p className="tooltip-addr">
                              {order.customer.flatNo}, {order.customer.buildingName && `${order.customer.buildingName}, `}
                              {order.customer.locality}, {order.customer.city}, {order.customer.state} - {order.customer.pincode}
                            </p>
                            <p className="tooltip-phone">📞 {order.customer.mobile}</p>
                          </div>
                        </div>
                      </div>
                      <div className="header-id-column" onClick={(e) => e.stopPropagation()}>
                        <span className="meta-icon" aria-hidden="true">&#128230;</span>
                        <span className="meta-label">Order ID</span>
                        <span className="order-id-txt" onClick={() => {
                          navigator.clipboard.writeText(order.orderId);
                          notify.success('Copied to Clipboard', `Order ID: #${order.orderId}`);
                        }}>
                          #{order.orderId}
                        </span>
                      </div>
                    </div>
 
                    {/* Card Body */}
                    <div className="amazon-card-body">
                      <div className="card-body-content-split">
                        <div className="items-list-column">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="amazon-item-row">
                              <div className="item-img-wrapper">
                                {item.imageUrl ? (
                                  <ProductImage src={item.imageUrl} alt={item.name} />
                                ) : (
                                  <span className="fallback-box">📦</span>
                                )}
                              </div>
                              <div className="item-details-column">
                                <h4 className="item-title-txt">{item.name}</h4>
                                <span className="item-meta-txt">{item.category} | {item.volume}</span>
                                <span className="item-price-qty">{item.quantity} × {formatCurrency(item.price)}</span>
                              </div>
                              <div className="item-status-column">
                                <div className={`status-label-group status-chip ${statusLower.replace(/\s+/g, '-')}`}>
                                  <span className="status-dot-indicator"></span>
                                  <span className="status-header-text">{order.status}</span>
                                </div>
                                <div className="status-facts">
                                  <span><b>Payment</b>{order.paymentMethod || 'COD'}</span>
                                  {statusLower === 'delivered' && <span><b>Invoice</b>Available</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="actions-column" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => handleReorder(order)} className="amazon-action-btn primary-action">
                            <span aria-hidden="true">&#8635;</span> Reorder
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }} className="amazon-action-btn">
                            <span aria-hidden="true">&#128065;</span> View Details
                          </button>
                          {isCancelable && (
                            <button onClick={(e) => { e.stopPropagation(); setOrderToCancel(order); }} className="amazon-action-btn danger-action">
                              <span aria-hidden="true">&times;</span> Cancel Order
                            </button>
                          )}
                          {cancellationClosed && (
                            <>
                              <button className="amazon-action-btn danger-action" disabled>Cancel Order</button>
                              <span className="status-desc-text">This order is already being prepared and can no longer be cancelled.</span>
                            </>
                          )}
                          {hasPendingCancellation && (
                            <span className="status-desc-text">Cancellation pending admin approval</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="order-card-footer">
                      <span><b>{order.items.length}</b> Items Ordered</span>
                      <span><b>{order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)}</b> Total Quantity</span>
                      <span><b>{formatCurrency(Number(order.total || 0))}</b> Order Value</span>
                      <span><b>{statusLower === 'delivered' ? 'Available' : 'Pending'}</b> Invoice Status</span>
                    </div>
                  </div>
                );
              })}
              {visibleOrderCount < filteredOrders.length && <div ref={loadMoreRef} aria-hidden="true" style={{ height: 1 }} />}
            </div>
          ) : (
            <div className="empty-orders card animate-scale-in">
              <div className="empty-icon-glow">📦</div>
              <h3>{searchQuery || dateFilter !== 'all' || activeTab !== 'all' ? 'No Orders Found' : 'No Orders Yet'}</h3>
              <p>
                {searchQuery || dateFilter !== 'all' || activeTab !== 'all'
                  ? "We couldn't find any orders matching your search or filters. Try adjusting them!"
                  : 'Your orders will appear here once you place your first purchase.'}
              </p>
              {!searchQuery && dateFilter === 'all' && activeTab === 'all' && (
                <Link href="/products" className="btn btn-primary">
                  Browse Products
                </Link>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Detailed Order Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          selectedOrder={selectedOrder}
          setSelectedOrder={setSelectedOrder}
          handleReorder={handleReorder}
          setOrderToCancel={setOrderToCancel}
          getTimelineSteps={getTimelineSteps}
          formatDate={formatDate}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {orderToCancel && (
        <CancelOrderModal
          orderToCancel={orderToCancel}
          setOrderToCancel={setOrderToCancel}
          cancelling={cancelling}
          handleCancelOrder={handleCancelOrder}
        />
      )}

      <style jsx>{`
        .orders-page {
          padding-top: 0.5rem;
          padding-bottom: 1rem;
          min-height: 90vh;
          font-family: var(--font-body);
        }

        /* Cards List */
        .orders-cards-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        /* Amazon-Style Order Card */
        .amazon-order-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
          cursor: pointer;
          transition: border-color var(--transition-fast);
        }

        .amazon-order-card:hover {
          border-color: var(--text-muted);
        }

        /* Top Bar */
        .amazon-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--bg-tertiary);
          border-bottom: 1px solid var(--border-color);
          padding: 0.55rem 0.9rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-meta-columns {
          display: flex;
          gap: 1.1rem;
          flex-wrap: wrap;
        }

        .meta-col {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          position: relative;
        }

        .meta-label {
          font-size: 0.65rem;
          font-weight: 600;
          color: var(--text-muted);
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        .meta-value {
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .meta-value.highlight-price {
          color: var(--text-primary);
          font-weight: 600;
        }

        .underline-dotted {
          border-bottom: 1px dotted var(--text-muted);
          cursor: help;
        }

        /* Tooltip style */
        .tooltip-trigger {
          position: relative;
        }

        .address-tooltip-bubble {
          display: none;
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          width: 250px;
          padding: 0.75rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          box-shadow: var(--shadow-md);
          z-index: 100;
          color: var(--text-primary);
          animation: scaleIn 0.15s ease-out;
        }

        .tooltip-trigger:hover .address-tooltip-bubble {
          display: block;
        }

        .tooltip-title {
          font-weight: 600;
          font-size: 0.8125rem;
          margin-bottom: 0.25rem;
          color: var(--primary-color);
        }

        .tooltip-addr {
          font-size: 0.75rem;
          line-height: 1.4;
          color: var(--text-secondary);
          margin: 0;
        }

        .tooltip-phone {
          font-size: 0.75rem;
          font-weight: 600;
          margin-top: 0.25rem;
          color: var(--text-primary);
        }

        .header-id-column {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.15rem;
        }

        .order-id-txt {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-primary);
          cursor: pointer;
        }
        .order-id-txt:hover {
          color: var(--primary-color);
        }

        /* Card Body */
        .amazon-card-body {
          padding: 0.85rem 0.9rem;
        }

        .card-body-content-split {
          display: grid;
          grid-template-columns: 1fr 160px;
          gap: 1rem;
          align-items: center;
        }

        .items-list-column {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }

        .actions-column {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          justify-content: center;
          align-items: stretch;
          border-left: 1px solid var(--border-color);
          padding-left: 1rem;
        }

        .actions-column .amazon-action-btn {
          width: 100%;
          text-align: center;
        }

        .amazon-item-row {
          display: grid;
          grid-template-columns: 48px minmax(0, 1.5fr) minmax(8rem, 1fr);
          gap: 0.85rem;
          align-items: center;
        }

        .item-img-wrapper {
          width: 48px;
          height: 48px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          background: white;
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .item-img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .fallback-box {
          font-size: 1.5rem;
        }

        .item-details-column {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .item-title-txt {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .item-meta-txt {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .item-price-qty {
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .item-status-column {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          border-left: 1px solid var(--border-light);
          padding-left: 0.85rem;
        }

        .status-label-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-dot-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .status-dot-indicator.delivered {
          background: #16a34a;
        }
        .status-dot-indicator.cancelled {
          background: #ef4444;
        }
        .status-dot-indicator.pending {
          background: #f59e0b;
        }
        .status-dot-indicator.confirmed,
        .status-dot-indicator.processing,
        .status-dot-indicator.dispatched {
          background: var(--primary-color);
        }

        .status-header-text {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          text-transform: capitalize;
        }

        .status-dot-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-desc-text {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        /* Card Bottom Actions */
        .amazon-card-actions-row {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.5rem;
          border-top: 1px solid var(--border-light);
          padding-top: 0.75rem;
          justify-content: flex-start;
        }

        .amazon-action-btn {
          padding: 0.4rem 0.875rem;
          font-size: 0.8125rem;
          font-weight: 600;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .amazon-action-btn:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .amazon-action-btn.primary-action {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }
        .amazon-action-btn.primary-action:hover {
          background: var(--primary-hover);
        }

        .amazon-action-btn.danger-action {
          color: #dc2626;
          border-color: #dc2626;
        }
        .amazon-action-btn.danger-action:hover {
          background: #dc2626;
          color: white;
        }

        @media (max-width: 900px) {
          .card-body-content-split {
            grid-template-columns: 1fr;
            gap: 1.25rem;
          }
          .actions-column {
            border-left: none;
            padding-left: 0;
            flex-direction: row;
            justify-content: flex-start;
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          .actions-column .amazon-action-btn {
            width: auto;
            flex: 1;
            min-width: 120px;
          }
          .amazon-item-row {
            grid-template-columns: 44px 1fr;
            gap: 0.75rem;
          }
          .item-status-column {
            border-left: none;
            padding-left: 0;
            grid-column: span 2;
            margin-top: 0.25rem;
          }
        }

        /* ── Empty State ── */
        .empty-orders {
          padding: 4rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          border-radius: var(--radius-md);
        }

        .empty-icon-glow {
          font-size: 2.5rem;
          width: 60px;
          height: 60px;
          background: var(--bg-tertiary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.25rem;
          border: 1px solid var(--border-color);
        }

        .empty-orders h3 {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .empty-orders p {
          color: var(--text-muted);
          max-width: 440px;
          margin: 0 0 0.5rem 0;
          line-height: 1.5;
        }

        /* ── Loading ── */
        /* ── Details Modal ── */
        /* Premium orders UI */
        .orders-page { padding-bottom: 3rem; }
        .orders-cards-list { gap: 1.1rem; }
        :global(.orders-layout-grid) { gap: 1.25rem; grid-template-columns: minmax(250px, 265px) minmax(0, 1fr); }
        :global(.orders-sidebar) { top: 92px; gap: 1.1rem; padding: 1rem; border: 1px solid var(--border-color); border-radius: 20px; background: color-mix(in srgb, var(--bg-secondary) 86%, transparent); backdrop-filter: blur(18px); box-shadow: 0 16px 42px rgba(15,23,42,.08); }
        :global(.orders-sidebar .sidebar-section + .sidebar-section) { padding-top: .9rem; border-top: 1px solid rgba(148,163,184,.18); }
        :global(.orders-sidebar .sidebar-section h3) { display: flex; align-items: center; gap: .5rem; margin-bottom: .55rem; font-size: .75rem; letter-spacing: .08em; }
        .section-icon { display: grid; place-items: center; width: 27px; height: 27px; border-radius: 9px; color: var(--primary-color); background: color-mix(in srgb, var(--primary-color) 12%, transparent); font-size: .82rem; }
        :global(.orders-sidebar .filter-options) { gap: .15rem; }
        :global(.orders-sidebar .filter-label) { min-height: 42px; padding: .35rem .5rem; border-radius: 11px; transition: background 180ms ease, color 180ms ease, transform 180ms ease; }
        :global(.orders-sidebar .filter-label:has(input:checked)) { color: #1d4ed8; background: rgba(37,99,235,.08); transform: translateX(2px); }
        :global(.orders-sidebar .filter-radio) { appearance: none; width: 17px; height: 17px; border: 1.5px solid var(--text-muted); border-radius: 50%; background: var(--bg-secondary); box-shadow: inset 0 0 0 4px var(--bg-secondary); transition: 180ms ease; }
        :global(.orders-sidebar .filter-radio:checked) { border-color: var(--primary-color); background: var(--primary-color); box-shadow: inset 0 0 0 4px var(--bg-secondary), 0 0 0 3px rgba(37,99,235,.12); }
        :global(.orders-page .search-bar-wrapper) { min-height: 48px; padding: 0 .6rem; margin: 0; border-radius: 999px; border-color: rgba(148,163,184,.25); box-shadow: inset 0 2px 5px rgba(15,23,42,.04), 0 8px 28px rgba(15,23,42,.05); transition: border-color 200ms ease, box-shadow 200ms ease; }
        :global(.orders-page .search-bar-wrapper:focus-within) { border-color: rgba(37,99,235,.55); box-shadow: inset 0 2px 5px rgba(15,23,42,.03), 0 0 0 4px rgba(37,99,235,.1), 0 12px 30px rgba(37,99,235,.08); }
        :global(.orders-page .search-input::placeholder) { color: #94a3b8; }
        .amazon-order-card { border-radius: 20px; border-color: var(--border-color); background: var(--bg-secondary); color: var(--text-primary); box-shadow: 0 4px 12px rgba(15,23,42,.04), 0 18px 40px rgba(15,23,42,.06); transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease; }
        .amazon-order-card:hover { transform: translateY(-3px); border-color: rgba(37,99,235,.22); box-shadow: 0 8px 18px rgba(15,23,42,.06), 0 24px 50px rgba(37,99,235,.1); }
        .amazon-card-header { align-items: stretch; padding: .65rem .85rem; background: color-mix(in srgb, var(--bg-secondary) 94%, var(--primary-color) 3%); border-bottom-color: var(--border-color); }
        .header-meta-columns { flex: 1; display: grid; grid-template-columns: repeat(3,minmax(120px,1fr)); gap: 1rem; }
        .meta-col, .header-id-column { display: grid; grid-template-columns: 26px 1fr; grid-template-rows: auto auto; column-gap: .5rem; align-items: center; }
        .header-id-column { min-width: 170px; align-items: center; text-align: left; }
        .meta-icon { grid-row: 1 / 3; display: grid; place-items: center; width: 26px; height: 26px; border-radius: 8px; color: var(--primary-color); background: color-mix(in srgb, var(--primary-color) 10%, transparent); font-size: .78rem; font-weight: 800; }
        .meta-label { margin: 0; font-size: .62rem; font-weight: 700; letter-spacing: .08em; }
        .meta-value, .order-id-txt { font-size: .86rem; font-weight: 700; color: var(--text-primary); overflow-wrap: anywhere; }
        .amazon-card-body { padding: .7rem .85rem; }
        .card-body-content-split { grid-template-columns: minmax(0,1fr) 170px; gap: .85rem; align-items: stretch; }
        .items-list-column { gap: 0; }
        .amazon-item-row { grid-template-columns: 58px minmax(0,1.3fr) minmax(9rem,.8fr); gap: .7rem; padding: .5rem 0; }
        .amazon-item-row:first-child { padding-top: 0; } .amazon-item-row:last-child { padding-bottom: 0; }
        .amazon-item-row + .amazon-item-row { border-top: 1px solid rgba(148,163,184,.17); }
        .item-img-wrapper { width: 58px; height: 58px; padding: 4px; border: 0; border-radius: 13px; background: var(--bg-tertiary); box-shadow: inset 0 0 0 1px var(--border-color); }
        .item-details-column { gap: .12rem; } .item-title-txt { font-size: .92rem; font-weight: 750; letter-spacing: -.01em; }
        .item-meta-txt, .item-price-qty { font-size: .78rem; }
        .item-status-column { justify-content: center; gap: .4rem; border-left-color: rgba(148,163,184,.18); }
        .status-chip { width: fit-content; padding: .3rem .58rem; border-radius: 999px; animation: fadeIn 200ms ease both; }
        .status-chip .status-dot-indicator { width: 7px; height: 7px; background: currentColor; }
        .status-chip.pending { color: #a16207; background: #fef9c3; } .status-chip.delivered { color: #15803d; background: #dcfce7; }
        .status-chip.cancelled { color: #b91c1c; background: #fee2e2; }
        .status-chip.confirmed, .status-chip.processing, .status-chip.dispatched, .status-chip.out-for-delivery { color: #1d4ed8; background: #dbeafe; }
        .status-chip .status-header-text { color: inherit; font-size: .78rem; font-weight: 750; }
        .status-facts { display: flex; flex-direction: column; gap: .35rem; color: #64748b; font-size: .72rem; }
        .status-facts span { display: flex; gap: .35rem; flex-wrap: wrap; } .status-facts b { color: var(--text-secondary); }
        .actions-column { gap: 7px; padding-left: .7rem; border-left-color: rgba(148,163,184,.18); }
        .amazon-action-btn { position: relative; overflow: hidden; min-height: 36px; display: flex; align-items: center; justify-content: center; gap: .4rem; border-radius: 11px; font-size: .76rem; transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease; }
        .amazon-action-btn:hover { transform: translateY(-2px); box-shadow: 0 7px 16px rgba(15,23,42,.1); } .amazon-action-btn:active { transform: translateY(0); }
        .amazon-action-btn.primary-action { border: 0; background: linear-gradient(135deg,#3b82f6,#1d4ed8); box-shadow: 0 7px 16px rgba(37,99,235,.22); }
        .amazon-action-btn.danger-action { border-color: rgba(220,38,38,.35); background: var(--bg-secondary); }
        .amazon-action-btn:disabled { opacity: .55; cursor: not-allowed; transform: none; box-shadow: none; }
        .order-card-footer { display: flex; flex-wrap: wrap; gap: .32rem; padding: .45rem .85rem .55rem; border-top: 1px solid var(--border-color); background: var(--bg-secondary); }
        .order-card-footer span { display: inline-flex; align-items: center; gap: .24rem; min-height: 21px; padding: .18rem .45rem; border-radius: 999px; background: var(--bg-tertiary); color: var(--text-muted); font-size: .63rem; } .order-card-footer b { color: var(--text-primary); }
        .empty-orders { min-height: 360px; border-radius: 20px; border: 1px solid var(--border-color); background: var(--bg-secondary); box-shadow: 0 18px 40px rgba(15,23,42,.06); }
        .empty-icon-glow { width: 84px; height: 84px; border: 0; background: linear-gradient(145deg,#dbeafe,#fff); box-shadow: 0 12px 30px rgba(37,99,235,.15); }
        .order-skeleton { overflow: hidden; border: 1px solid var(--border-color); border-radius: 20px; background: var(--bg-secondary); box-shadow: 0 14px 36px rgba(15,23,42,.05); }
        .skeleton-header { display: grid; grid-template-columns: repeat(4,1fr); gap: 1rem; padding: 1.25rem; background: var(--bg-tertiary); }
        .skeleton-header span, .shimmer { display: block; height: 13px; border-radius: 999px; background: #e8edf4; }
        .skeleton-body { display: grid; grid-template-columns: 72px 1fr 180px; gap: 1.2rem; align-items: center; padding: 1.4rem; }
        .skeleton-image { width: 72px; height: 72px; border-radius: 16px; }
        .skeleton-copy, .skeleton-actions { display: flex; flex-direction: column; gap: .65rem; }
        .skeleton-copy .short { width: 65%; } .skeleton-copy .tiny { width: 40%; } .skeleton-actions span { height: 42px; border-radius: 14px; }
        .shimmer, .skeleton-header span { background: linear-gradient(100deg,var(--bg-tertiary) 30%,var(--border-color) 50%,var(--bg-tertiary) 70%); background-size: 220% 100%; animation: shimmer 1.25s linear infinite; }
        @keyframes shimmer { to { background-position-x: -220%; } }
        @media (max-width: 900px) { :global(.orders-layout-grid) { grid-template-columns: 1fr; } :global(.orders-sidebar) { position: static; } .card-body-content-split { grid-template-columns: 1fr; } .actions-column { border: 0; padding: 0; display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); } .actions-column .amazon-action-btn { width: 100%; min-width: 0; } }
        @media (max-width: 640px) { .amazon-card-header { flex-direction: column; padding: 1rem; } .header-meta-columns { grid-template-columns: repeat(2,minmax(0,1fr)); } .header-id-column { min-width: 0; align-self: stretch; } .amazon-card-body { padding: 1rem; } .amazon-item-row { grid-template-columns: 60px 1fr; } .item-img-wrapper { width: 60px; height: 60px; } .item-status-column { grid-column: 1 / -1; } .actions-column { grid-template-columns: 1fr; } .skeleton-header { grid-template-columns: 1fr 1fr; } .skeleton-body { grid-template-columns: 60px 1fr; } .skeleton-image { width: 60px; height: 60px; } .skeleton-actions { grid-column: 1 / -1; } }
        @media (prefers-reduced-motion: reduce) { .amazon-order-card, .amazon-action-btn, .status-chip, .shimmer, .skeleton-header span { animation: none; transition: none; } }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.2s ease-out;
        }

        .modal-content-details {
          background: var(--bg-primary);
          width: 92%;
          max-width: 600px;
          max-height: 85vh;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border-color);
          overflow: hidden;
        }

        .modal-header {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--bg-secondary);
        }

        .modal-header h2 {
          font-size: 1.125rem;
          margin: 0;
          font-weight: 700;
          color: var(--text-primary);
        }

        .close-modal-btn {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          font-size: 0.875rem;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          cursor: pointer;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }
        .close-modal-btn:hover {
          background: #ef4444;
          color: white;
          border-color: #ef4444;
        }

        .modal-scroll-area {
          overflow-y: auto;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .details-meta-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          background: var(--bg-secondary);
          padding: 1rem;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
        }

        .meta-label {
          display: block;
          font-size: 0.68rem;
          text-transform: uppercase;
          color: var(--text-muted);
          font-weight: 600;
          letter-spacing: 0.03em;
          margin-bottom: 0.15rem;
        }

        .meta-value {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--text-primary);
        }

        .meta-value-price {
          font-weight: 700;
          font-size: 1.125rem;
          color: var(--text-primary);
        }

        /* Stepper Tracking */
        .timeline-section h3,
        .items-section h3,
        .delivery-section h3 {
          font-size: 0.95rem;
          font-weight: 700;
          margin-bottom: 0.875rem;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.35rem;
          color: var(--text-primary);
        }

        .timeline-stepper {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          position: relative;
          padding-left: 0.25rem;
        }

        .timeline-step {
          display: flex;
          gap: 1rem;
          position: relative;
        }

        .timeline-step::before {
          content: '';
          position: absolute;
          left: 11px;
          top: 24px;
          bottom: -18px;
          width: 2px;
          background: var(--border-color);
          z-index: 1;
        }

        .timeline-step:last-child::before {
          display: none;
        }

        .timeline-step.completed::before {
          background: #16a34a;
        }

        .step-bullet {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--bg-tertiary);
          border: 2px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
          z-index: 2;
          color: var(--text-muted);
        }

        .timeline-step.completed .step-bullet {
          background: #16a34a;
          border-color: #16a34a;
          color: white;
        }

        .timeline-step.active .step-bullet {
          border-color: var(--primary-color);
          background: var(--bg-secondary);
          color: var(--primary-color);
        }

        .cancelled-step .step-bullet {
          background: #ef4444 !important;
          border-color: #ef4444 !important;
          color: white !important;
        }

        .step-info {
          display: flex;
          flex-direction: column;
        }

        .step-label {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--text-primary);
        }

        .step-desc {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 0.05rem;
        }

        .details-items-list {
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          overflow: hidden;
        }

        .details-item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-light);
          gap: 1rem;
        }
        .details-item-row:last-child {
          border-bottom: none;
        }

        .item-row-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .item-row-img-wrapper {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm);
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .item-row-img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .item-row-name {
          display: block;
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--text-primary);
        }

        .item-row-category {
          display: block;
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 400;
          margin-top: 0.05rem;
        }

        .item-row-right {
          text-align: right;
          display: flex;
          flex-direction: column;
          gap: 0.05rem;
        }
        .item-row-math {
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-weight: 400;
        }
        .item-row-total {
          color: var(--text-primary);
          font-size: 0.875rem;
          font-weight: 600;
        }

        .delivery-address-box {
          background: var(--bg-tertiary);
          padding: 1rem;
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
          border: 1px solid var(--border-color);
          line-height: 1.5;
        }

        .delivery-address-head {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.35rem;
          color: var(--text-primary);
        }

        .delivery-phone {
          margin-top: 0.5rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .modal-footer-actions {
          padding: 1rem;
          border-top: 1px solid var(--border-color);
          display: flex;
          gap: 0.5rem;
          background: var(--bg-secondary);
        }

        .btn {
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
          padding: 0.5rem 1rem;
        }

        :global(.toast-reorder-content) {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 100%;
        }

        :global(.toast-btn) {
          align-self: flex-end;
          background: var(--primary-color);
          color: white;
          border: none;
          padding: 0.35rem 0.75rem;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
        }

        /* ── Alert Confirmation Modal ── */
        .alert-modal {
          max-width: 400px;
          padding: 1.5rem;
          border-radius: var(--radius-sm);
        }
        .text-red {
          color: #dc2626;
        }
        .modal-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin-top: 0;
          margin-bottom: 0.5rem;
        }
        .modal-description {
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
          font-size: 0.875rem;
          line-height: 1.5;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
        }

        /* ── Animations & Transitions ── */
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.97);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        /* ── Cart Checkout Panel (Checkout Required Tab) ── */
        .cart-checkout-panel {
          background: var(--bg-secondary);
          border: 1.5px solid var(--primary-color);
          border-radius: var(--radius-md);
          box-shadow: 0 4px 24px rgba(37, 99, 235, 0.1);
          overflow: hidden;
          animation: fadeIn 0.3s ease;
          margin-bottom: 0.5rem;
        }

        .ccp-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          background: rgba(37, 99, 235, 0.05);
          border-bottom: 1px solid var(--border-color);
          flex-wrap: wrap;
          gap: 1rem;
        }

        .ccp-title-group {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .ccp-icon {
          font-size: 1.75rem;
          line-height: 1;
        }

        .ccp-title {
          font-size: 1.2rem;
          font-weight: 800;
          margin: 0;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }

        .ccp-subtitle {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin: 0.1rem 0 0;
          font-weight: 500;
        }

        .ccp-checkout-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1.4rem;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #fff !important;
          font-weight: 700;
          font-size: 0.875rem;
          border-radius: 999px;
          text-decoration: none !important;
          box-shadow: 0 2px 12px rgba(37, 99, 235, 0.35);
          transition: all 0.2s ease;
          letter-spacing: 0.01em;
          white-space: nowrap;
        }

        .ccp-checkout-btn:hover {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
          box-shadow: 0 4px 18px rgba(37, 99, 235, 0.45);
          transform: translateY(-1px);
        }

        .ccp-items-list {
          padding: 0.5rem 0;
        }

        .ccp-item-row {
          display: grid;
          grid-template-columns: 52px 1fr auto;
          align-items: center;
          gap: 1rem;
          padding: 0.85rem 1.5rem;
          border-bottom: 1px solid var(--border-light, rgba(148,163,184,0.1));
          transition: background 0.15s;
        }

        .ccp-item-row:last-child {
          border-bottom: none;
        }

        .ccp-item-row:hover {
          background: rgba(37, 99, 235, 0.03);
        }

        .ccp-item-img-wrap {
          width: 52px;
          height: 52px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }

        .ccp-item-img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .ccp-item-fallback {
          font-size: 1.25rem;
        }

        .ccp-item-info {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          min-width: 0;
        }

        .ccp-item-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ccp-item-meta {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .ccp-item-price-group {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.15rem;
          flex-shrink: 0;
        }

        .ccp-item-qty {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .ccp-item-subtotal {
          font-size: 0.925rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .ccp-summary {
          border-top: 1.5px solid var(--border-color);
          padding: 1.25rem 1.5rem;
          background: rgba(148, 163, 184, 0.03);
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }

        .ccp-summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .ccp-total-row {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
          padding-top: 0.5rem;
          border-top: 1px solid var(--border-color);
          margin-top: 0.25rem;
        }

        .ccp-free {
          color: #16a34a;
          font-weight: 700;
        }

        .ccp-checkout-btn-full {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          margin-top: 0.75rem;
          padding: 0.85rem 1.5rem;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #fff !important;
          font-weight: 800;
          font-size: 1rem;
          border-radius: var(--radius-md);
          text-decoration: none !important;
          box-shadow: 0 4px 18px rgba(37, 99, 235, 0.35);
          transition: all 0.2s ease;
          letter-spacing: 0.01em;
        }

        .ccp-checkout-btn-full:hover {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
          box-shadow: 0 6px 24px rgba(37, 99, 235, 0.45);
          transform: translateY(-2px);
        }

        .ccp-empty {
          padding: 3rem 2rem;
          text-align: center;
          color: var(--text-muted);
        }

        .ccp-empty-icon {
          font-size: 2.5rem;
          margin-bottom: 0.75rem;
        }

        .ccp-empty p {
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.6;
        }

        .ccp-link {
          color: var(--primary-color);
          font-weight: 600;
          text-decoration: underline;
        }

        @media (max-width: 600px) {
          .ccp-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .ccp-checkout-btn {
            width: 100%;
            justify-content: center;
          }
          .ccp-item-row {
            grid-template-columns: 44px 1fr auto;
            padding: 0.75rem 1rem;
            gap: 0.75rem;
          }
          .ccp-summary {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
