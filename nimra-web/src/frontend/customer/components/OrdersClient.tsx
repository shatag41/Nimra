'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/frontend/customer/hooks/useAuth';
import { useCustomerOrders } from '@/frontend/customer/hooks/useCustomerOrders';
import { useCart } from '../contexts/CartProvider';
import { OrderRecord, Product } from '@/types/cms';
import { formatCurrency } from '../utils/commerce';
import { updateOrderStatus } from '@/utils/api';
import { toast } from 'sonner';

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
  const { addProduct } = useCart();

  const [activeTab, setActiveTab] = useState<OrderTab>('all');
  const [dateFilter, setDateFilter] = useState<'all' | '30days' | '6months' | 'year'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<OrderRecord | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      refreshOrders();
    }
  }, [isAuthenticated, refreshOrders]);

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;
    setCancelling(true);
    try {
      const res = await updateOrderStatus(orderToCancel.orderId, 'Cancelled');
      if (res.success) {
        toast.success(`Order ${orderToCancel.orderId} cancelled successfully.`);
        refreshOrders();
        if (selectedOrder && selectedOrder.orderId === orderToCancel.orderId) {
          setSelectedOrder({ ...selectedOrder, status: 'Cancelled' });
        }
      } else {
        toast.error(res.message || 'Failed to cancel the order. Please try again.');
      }
    } catch (error) {
      console.error(error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setCancelling(false);
      setOrderToCancel(null);
    }
  };

  const handleReorder = (order: OrderRecord) => {
    try {
      order.items.forEach((item) => {
        const dummyProduct: Product = {
          ID: item.productId,
          Name: item.name,
          Category: item.category,
          Volume: item.volume,
          Price: item.price,
          Description: '',
          ImageUrl: item.imageUrl,
          Active: true,
        };
        addProduct(dummyProduct, item.quantity);
      });
      toast.success(
        <div className="toast-reorder-content">
          <span>Items from order {order.orderId} added to cart.</span>
          <button onClick={() => router.push('/cart')} className="toast-btn">
            Go to Cart
          </button>
        </div>,
        { duration: 5000 }
      );
    } catch (error) {
      console.error(error);
      toast.error('Failed to add items to cart.');
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // Date filtering
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const orderDate = new Date(order.createdAt || '');
        if (!Number.isNaN(orderDate.getTime())) {
          const diffTime = Math.abs(new Date().getTime() - orderDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (dateFilter === '30days') matchesDate = diffDays <= 30;
          else if (dateFilter === '6months') matchesDate = diffDays <= 180;
          else if (dateFilter === 'year') matchesDate = diffDays <= 365;
        }
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
  }, [orders, searchQuery, activeTab, dateFilter]);

  if (authLoading) {
    return (
      <div className="loading-state">
        <div className="loader"></div>
        <p>Verifying authentication...</p>
      </div>
    );
  }

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
            <Link href="/" className="btn btn-secondary">
              Back to Home
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
      {/* Page Header */}
      <div className="page-header animate-slide-up">
        <span className="badge badge-primary">Orders</span>
        <h1>My Orders</h1>
        <p>Track delivery status, view invoices, cancel pending orders, or place rapid reorders.</p>
      </div>

      {/* Main Layout Grid */}
      <div className="orders-layout-grid animate-fade-in">
        {/* Sidebar Filters */}
        <aside className="orders-sidebar card">
          <div className="sidebar-section">
            <h3>Filter by Status</h3>
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
            <h3>Order Date</h3>
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
          {loadingOrders ? (
            <div className="loading-state">
              <div className="loader"></div>
              <p>Syncing orders...</p>
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="orders-cards-list">
              {filteredOrders.map((order) => {
                const isCancelable = ['pending', 'confirmed'].includes(order.status.toLowerCase());
                const statusLower = order.status.toLowerCase();

                return (
                  <div key={order.orderId} className="amazon-order-card card" onClick={() => setSelectedOrder(order)}>
                    {/* Card Top Thin Bar */}
                    <div className="amazon-card-header">
                      <div className="header-meta-columns">
                        <div className="meta-col">
                          <span className="meta-label">ORDER PLACED</span>
                          <span className="meta-value">{formatDate(order.createdAt)}</span>
                        </div>
                        <div className="meta-col">
                          <span className="meta-label">TOTAL</span>
                          <span className="meta-value highlight-price">{formatCurrency(Number(order.total || 0))}</span>
                        </div>
                        <div className="meta-col tooltip-trigger" onClick={(e) => e.stopPropagation()}>
                          <span className="meta-label">SHIP TO</span>
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
                        <span className="meta-label">ORDER ID</span>
                        <span className="order-id-txt" onClick={() => {
                          navigator.clipboard.writeText(order.orderId);
                          toast.success(`Copied Order ID: #${order.orderId}`);
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
                                  <img src={item.imageUrl} alt={item.name} className="item-img" />
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
                                  <span className={`status-dot-indicator ${statusLower}`}></span>
                                  <span className="status-header-text">{order.status}</span>
                                </div>
                                <span className="status-desc-text">Payment: {order.paymentMethod || 'COD'}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="actions-column" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => handleReorder(order)} className="amazon-action-btn primary-action">
                            Reorder
                          </button>
                          <button onClick={() => setSelectedOrder(order)} className="amazon-action-btn">
                            View details
                          </button>
                          {isCancelable && (
                            <button onClick={() => setOrderToCancel(order)} className="amazon-action-btn danger-action">
                              Cancel Order
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-orders card animate-scale-in">
              <div className="empty-icon-glow">📦</div>
              <h3>No Orders Found</h3>
              <p>
                {searchQuery || dateFilter !== 'all' || activeTab !== 'all'
                  ? "We couldn't find any orders matching your search or filters. Try adjusting them!"
                  : "You don't have any orders listed yet."}
              </p>
              {!searchQuery && dateFilter === 'all' && activeTab === 'all' && (
                <Link href="/products" className="btn btn-primary">
                  Shop Products
                </Link>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Detailed Order Modal */}
      {selectedOrder && (
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
              {['pending', 'confirmed'].includes(selectedOrder.status.toLowerCase()) && (
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
      )}

      {/* Cancel Confirmation Modal */}
      {orderToCancel && (
        <div className="modal-overlay" onClick={() => setOrderToCancel(null)}>
          <div className="modal-content card alert-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title text-red">Cancel Order</h2>
            <p className="modal-description">
              Are you sure you want to cancel Order <strong>#{orderToCancel.orderId}</strong>? This action will set your status to cancelled and cannot be reversed.
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setOrderToCancel(null)} disabled={cancelling}>
                No, Keep Order
              </button>
              <button className="btn btn-error" onClick={handleCancelOrder} disabled={cancelling}>
                {cancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .orders-page {
          padding-top: 0.5rem;
          padding-bottom: 4rem;
          min-height: 90vh;
          font-family: var(--font-body);
        }

        /* ── Page Header ── */
        .page-header {
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--border-color);
          text-align: center;
        }

        .page-header h1 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.15rem;
          letter-spacing: -0.02em;
          color: var(--text-primary);
        }

        .page-header p {
          color: var(--text-muted);
          margin: 0;
          font-size: 0.875rem;
          line-height: 1.4;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 0.3rem 0.85rem;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.75rem;
        }
        .badge-primary {
          background: rgba(37, 99, 235, 0.1);
          color: var(--primary-color);
          border: 1px solid rgba(37, 99, 235, 0.2);
        }

        /* Grid Layout */
        .orders-layout-grid {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 1.5rem;
          align-items: start;
        }

        /* Sidebar Filters */
        .orders-sidebar {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          position: sticky;
          top: 85px;
        }

        .sidebar-section h3 {
          font-size: 0.875rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: var(--text-primary);
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .filter-options {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .filter-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
          cursor: pointer;
          font-weight: 500;
        }

        .filter-radio {
          accent-color: var(--primary-color);
          cursor: pointer;
        }

        .refresh-btn {
          width: 100%;
          justify-content: center;
          gap: 0.35rem;
          font-size: 0.8125rem;
          padding: 0.5rem;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          color: var(--text-secondary);
        }
        .refresh-btn:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        /* Main Section */
        .orders-main-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        /* Search Bar */
        .search-bar-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          padding: 0.5rem;
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          color: var(--text-muted);
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          min-height: 38px;
          padding: 0.5rem 1rem 0.5rem 2.5rem;
          border: none;
          background: transparent;
          color: var(--text-primary);
          font-size: 0.875rem;
        }
        .search-input:focus {
          outline: none;
        }

        .search-clear-btn {
          position: absolute;
          right: 1rem;
          background: rgba(0, 0, 0, 0.05);
          border: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Cards List */
        .orders-cards-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
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
          padding: 0.65rem 1.25rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-meta-columns {
          display: flex;
          gap: 2rem;
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
          padding: 1.25rem;
        }

        .card-body-content-split {
          display: grid;
          grid-template-columns: 1fr 180px;
          gap: 1.5rem;
          align-items: center;
        }

        .items-list-column {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .actions-column {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          justify-content: center;
          align-items: stretch;
          border-left: 1px solid var(--border-color);
          padding-left: 1.5rem;
        }

        .actions-column .amazon-action-btn {
          width: 100%;
          text-align: center;
        }

        .amazon-item-row {
          display: grid;
          grid-template-columns: 60px 1.5fr 1fr;
          gap: 1.5rem;
          align-items: center;
        }

        .item-img-wrapper {
          width: 60px;
          height: 60px;
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
          padding-left: 1.5rem;
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
          .orders-layout-grid {
            grid-template-columns: 1fr;
            gap: 1.25rem;
          }
          .orders-sidebar {
            position: static;
          }
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
            grid-template-columns: 50px 1fr;
            gap: 1rem;
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
        .loading-state {
          min-height: 300px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          gap: 1rem;
        }

        .loader {
          width: 36px;
          height: 36px;
          border: 3px solid var(--border-color);
          border-top: 3px solid var(--primary-color);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        /* ── Details Modal ── */
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

        @media (max-width: 900px) {
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
            margin-bottom: 1.5rem;
          }
          .refresh-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
