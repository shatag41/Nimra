'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { fetchCustomerOrders, fetchCMSData } from '../../utils/api';
import { OrderRecord, Product } from '../../types/cms';
import { formatCurrency, isOrderable } from '../../utils/commerce';
import { useCart } from '../../components/CartProvider';

const statusClass = (status: string) => status.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const formatDate = (value?: string) => {
  if (!value) return 'Not available';
  var date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function CustomerPortal() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { addProduct } = useCart();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchCMSData();
        const orderable = (data.products || []).filter(isOrderable);
        setRecommendedProducts(orderable.slice(0, 4));
      } catch (err) {
        console.error('Failed to load recommended products', err);
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadOrders();
    } else if (!isLoading) {
      setLoadingOrders(false);
    }
  }, [isAuthenticated, isLoading, user]);

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const data = await fetchCustomerOrders(user?.ID || '', user?.Username || '');
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const metrics = useMemo(() => {
    const totalSpend = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const activeOrders = orders.filter((order) => !/delivered|cancelled/i.test(order.status)).length;
    const deliveredOrders = orders.filter((order) => /delivered/i.test(order.status)).length;
    const latestOrder = orders[0];

    return {
      totalSpend,
      activeOrders,
      deliveredOrders,
      latestOrder,
    };
  }, [orders]);

  const profileFields = [
    { label: 'Email', value: user?.Username },
    { label: 'Mobile', value: user?.Mobile },
    { label: 'Role', value: user?.Role },
  ];
  const completedProfileFields = profileFields.filter((field) => Boolean(field.value)).length;
  const profilePercent = Math.round((completedProfileFields / profileFields.length) * 100);

  if (isLoading) {
    return <div className="loading-state">Loading your portal...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="portal-page">
        <section className="portal-hero">
          <div>
            <span className="eyebrow">Customer Portal</span>
            <h1>Welcome to NIMRA</h1>
            <p>Browse products, read FAQs, learn about our water quality, and track an existing order without signing in.</p>
          </div>
          <div className="hero-actions">
            <Link href="/products" className="btn btn-primary">Browse Products</Link>
            <Link href="/track" className="btn btn-secondary">Track Order</Link>
          </div>
        </section>

        <section className="quick-section guest">
          <Link href="/products" className="quick-card">
            <span className="quick-icon">W</span>
            <h3>Product Range</h3>
            <p>View bottles, cans, jars, pricing, and availability from the live catalog.</p>
          </Link>
          <Link href="/track" className="quick-card">
            <span className="quick-icon">T</span>
            <h3>Track Order</h3>
            <p>Check delivery status using your order details.</p>
          </Link>
          <Link href="/about" className="quick-card">
            <span className="quick-icon">Q</span>
            <h3>Quality</h3>
            <p>Learn about NIMRA purification, infrastructure, and standards.</p>
          </Link>
          <Link href="/contact" className="quick-card">
            <span className="quick-icon">S</span>
            <h3>Support</h3>
            <p>Ask about bulk delivery, invoices, events, or scheduled supply.</p>
          </Link>
        </section>

        <section className="guest-checkout">
          <div>
            <span className="eyebrow">Checkout</span>
            <h2>Sign in when you are ready to place an order.</h2>
            <p>Browsing is public. Login is only required for checkout and account-specific order history.</p>
          </div>
          <Link href="/login" className="btn btn-primary">Login to Checkout</Link>
        </section>

        <style jsx>{portalStyles}</style>
      </div>
    );
  }

  return (
    <div className="portal-page">
      <section className="portal-hero">
        <div>
          <span className="eyebrow">Customer Portal</span>
          <h1>Welcome back, {user?.Name || 'Customer'}</h1>
          <p>Manage orders, track deliveries, and reach NIMRA support from one clean workspace.</p>
        </div>
        <div className="hero-actions">
          <Link href="/products" className="btn btn-primary">Order Water</Link>
          <Link href="/track" className="btn btn-secondary">Track Order</Link>
        </div>
      </section>

      <section className="metric-grid" aria-label="Account summary">
        <div className="metric-card">
          <span>Total Orders</span>
          <strong>{orders.length}</strong>
          <small>{loadingOrders ? 'Refreshing' : 'Synced from your account'}</small>
        </div>
        <div className="metric-card">
          <span>Active Orders</span>
          <strong>{metrics.activeOrders}</strong>
          <small>Pending, confirmed, or in transit</small>
        </div>
        <div className="metric-card">
          <span>Delivered</span>
          <strong>{metrics.deliveredOrders}</strong>
          <small>Completed deliveries</small>
        </div>
        <div className="metric-card">
          <span>Total Spend</span>
          <strong>{formatCurrency(metrics.totalSpend)}</strong>
          <small>Cash on delivery purchases</small>
        </div>
      </section>

      <section className="portal-grid">
        <div className="panel orders-panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">Orders</span>
              <h2>Recent Activity</h2>
            </div>
            <button className="refresh-btn" type="button" onClick={loadOrders} disabled={loadingOrders}>
              {loadingOrders ? 'Refreshing' : 'Refresh'}
            </button>
          </div>

          {loadingOrders ? (
            <div className="empty-state">Loading your orders...</div>
          ) : orders.length > 0 ? (
            <div className="table-wrap">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 6).map((order) => (
                    <tr key={order.orderId}>
                      <td className="order-id">{order.orderId}</td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td><span className={`status-badge ${statusClass(order.status)}`}>{order.status}</span></td>
                      <td>{formatCurrency(Number(order.total || 0))}</td>
                      <td><Link href={`/track?orderId=${order.orderId}`} className="table-link">Track</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <h3>No orders yet</h3>
              <p>Your NIMRA order history will appear here after checkout.</p>
              <Link href="/products" className="btn btn-primary">Browse Products</Link>
            </div>
          )}
        </div>

        <aside className="side-stack">
          <div className="panel profile-card">
            <div className="panel-head compact">
              <div>
                <span className="eyebrow">Profile</span>
                <h2>Account Details</h2>
              </div>
              <span className="completion">{profilePercent}%</span>
            </div>
            <div className="progress-track"><span style={{ width: `${profilePercent}%` }} /></div>
            <dl className="profile-list">
              {profileFields.map((field) => (
                <div key={field.label}>
                  <dt>{field.label}</dt>
                  <dd>{field.value || 'Not provided'}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="panel next-card">
            <span className="eyebrow">Next Step</span>
            <h2>{metrics.latestOrder ? 'Continue Tracking' : 'Start Your First Order'}</h2>
            <p>
              {metrics.latestOrder
                ? `Latest order ${metrics.latestOrder.orderId} is currently ${metrics.latestOrder.status}.`
                : 'Choose bottles, cans, or bulk jars and place a delivery request in minutes.'}
            </p>
            <Link
              href={metrics.latestOrder ? `/track?orderId=${metrics.latestOrder.orderId}` : '/products'}
              className="btn btn-primary"
            >
              {metrics.latestOrder ? 'Open Tracker' : 'Shop Products'}
            </Link>
          </div>
        </aside>
      </section>

      {recommendedProducts.length > 0 && (
        <section className="recommendations-section">
          <div className="section-head-left">
            <span className="eyebrow">Recommendations</span>
            <h2>Recommended Products</h2>
            <p>Pure hydration options curated for your regular supply.</p>
          </div>
          <div className="recommendations-grid">
            {recommendedProducts.map((product) => (
              <div key={product.ID} className="rec-card glass">
                <div className="rec-img-box">
                  <img src={product.ImageUrl} alt={product.Name} />
                </div>
                <div className="rec-info">
                  <span className="rec-vol">{product.Volume}</span>
                  <h3>{product.Name}</h3>
                  <p className="rec-desc">{product.Description.substring(0, 80)}...</p>
                  <div className="rec-footer">
                    <span className="rec-price">{formatCurrency(Number(product.Price))}</span>
                    <button 
                      className="btn btn-primary btn-sm add-btn"
                      onClick={() => addProduct(product)}
                      style={{ cursor: 'pointer', border: 'none' }}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <style jsx>{portalStyles}</style>
    </div>
  );
}

const portalStyles = `
        .portal-page {
          min-height: 100vh;
          background: var(--bg-primary);
          padding-bottom: 3rem;
        }

        .portal-hero {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 2rem;
          padding: 3rem 4rem;
          background: linear-gradient(135deg, #0f5ea8 0%, #0b3f72 58%, #2bb673 100%);
          color: white;
        }

        .portal-hero h1 {
          max-width: 820px;
          color: white;
          font-size: clamp(2rem, 4vw, 3.4rem);
          font-weight: 850;
          letter-spacing: 0;
          margin: 0.5rem 0 0.75rem;
        }

        .portal-hero p {
          max-width: 700px;
          color: rgba(255, 255, 255, 0.88);
          font-size: 1.05rem;
        }

        .eyebrow {
          display: inline-flex;
          color: inherit;
          opacity: 0.72;
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .hero-actions {
          display: flex;
          gap: 0.8rem;
          flex-wrap: wrap;
        }

        .hero-actions .btn-secondary {
          color: white;
          border-color: rgba(255, 255, 255, 0.72);
          background: rgba(255, 255, 255, 0.08);
        }

        .metric-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 1rem;
          max-width: 1280px;
          margin: -2rem auto 0;
          padding: 0 2rem;
          position: relative;
          z-index: 2;
        }

        .metric-card, .panel, .quick-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          box-shadow: var(--shadow-md);
        }

        .metric-card {
          padding: 1.25rem;
          display: grid;
          gap: 0.25rem;
        }

        .metric-card span, .metric-card small {
          color: var(--text-secondary);
          font-size: 0.85rem;
        }

        .metric-card strong {
          color: var(--text-primary);
          font-size: 1.85rem;
          font-weight: 850;
          line-height: 1.1;
        }

        .portal-grid {
          max-width: 1280px;
          margin: 1.5rem auto 0;
          padding: 0 2rem;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          gap: 1.25rem;
          align-items: start;
        }

        .panel {
          padding: 1.35rem;
        }

        .panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1.2rem;
        }

        .panel-head.compact {
          margin-bottom: 0.8rem;
        }

        .panel h2 {
          margin: 0.25rem 0 0;
          font-size: 1.35rem;
          letter-spacing: 0;
        }

        .refresh-btn, .table-link {
          border: 1px solid var(--border-color);
          background: var(--bg-primary);
          color: var(--primary-color);
          border-radius: 8px;
          padding: 0.55rem 0.8rem;
          font: inherit;
          font-weight: 800;
          cursor: pointer;
        }

        .refresh-btn:disabled {
          opacity: 0.65;
          cursor: progress;
        }

        .table-wrap {
          overflow-x: auto;
          border: 1px solid var(--border-color);
          border-radius: 8px;
        }

        .orders-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 720px;
        }

        .orders-table th, .orders-table td {
          padding: 1rem;
          border-bottom: 1px solid var(--border-color);
          text-align: left;
          white-space: nowrap;
        }

        .orders-table th {
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          font-size: 0.78rem;
          font-weight: 850;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .orders-table tr:last-child td {
          border-bottom: 0;
        }

        .order-id {
          font-weight: 850;
          color: var(--text-primary);
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          min-height: 28px;
          padding: 0.25rem 0.65rem;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 850;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          background: rgba(var(--primary-rgb), 0.1);
          color: var(--primary-color);
        }

        .status-badge.pending {
          background: rgba(249, 115, 22, 0.12);
          color: #c2410c;
        }

        .status-badge.delivered {
          background: rgba(43, 182, 115, 0.14);
          color: #047857;
        }

        .status-badge.cancelled {
          background: rgba(220, 38, 38, 0.12);
          color: #b91c1c;
        }

        .side-stack {
          display: grid;
          gap: 1.25rem;
        }

        .completion {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 54px;
          height: 36px;
          border-radius: 999px;
          background: rgba(var(--accent-rgb), 0.13);
          color: var(--accent-color);
          font-weight: 850;
        }

        .progress-track {
          width: 100%;
          height: 8px;
          overflow: hidden;
          border-radius: 999px;
          background: var(--bg-tertiary);
          margin-bottom: 1rem;
        }

        .progress-track span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
        }

        .profile-list {
          display: grid;
          gap: 0.8rem;
        }

        .profile-list div {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--border-color);
        }

        .profile-list div:last-child {
          border-bottom: 0;
          padding-bottom: 0;
        }

        .profile-list dt {
          color: var(--text-secondary);
          font-weight: 800;
        }

        .profile-list dd {
          color: var(--text-primary);
          font-weight: 750;
          text-align: right;
          overflow-wrap: anywhere;
        }

        .next-card p {
          color: var(--text-secondary);
          margin: 0.65rem 0 1rem;
        }

        .empty-state {
          min-height: 230px;
          display: grid;
          place-items: center;
          align-content: center;
          gap: 0.75rem;
          color: var(--text-secondary);
          text-align: center;
          border: 1px dashed var(--border-color);
          border-radius: 8px;
          background: var(--bg-primary);
          padding: 2rem;
        }

        .empty-state h3 {
          margin: 0;
          color: var(--text-primary);
        }

        .quick-section {
          max-width: 1280px;
          margin: 1.5rem auto 0;
          padding: 0 2rem;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 1rem;
        }

        .quick-section.guest {
          margin-top: 2rem;
        }

        .guest-checkout {
          max-width: 1280px;
          margin: 1.5rem auto 0;
          padding: 1.35rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          background: var(--bg-secondary);
          border-top: 1px solid var(--border-color);
          border-bottom: 1px solid var(--border-color);
        }

        .guest-checkout h2 {
          margin: 0.25rem 0 0.35rem;
          font-size: 1.35rem;
        }

        .guest-checkout p {
          color: var(--text-secondary);
        }

        .quick-card {
          padding: 1.2rem;
          color: var(--text-primary);
          transition: transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
        }

        .quick-card:hover {
          transform: translateY(-3px);
          border-color: var(--primary-color);
          box-shadow: var(--shadow-lg);
        }

        .quick-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          margin-bottom: 0.8rem;
          background: var(--bg-tertiary);
          color: var(--primary-color);
          font-weight: 900;
        }

        .quick-card h3 {
          margin: 0 0 0.35rem;
          font-size: 1.05rem;
        }

        .quick-card p {
          color: var(--text-secondary);
          font-size: 0.92rem;
          line-height: 1.55;
        }

        /* ── Recommendations ── */
        .recommendations-section {
          max-width: 1280px;
          margin: 2rem auto 0;
          padding: 0 2rem;
        }

        .section-head-left {
          margin-bottom: 1.5rem;
        }

        .section-head-left h2 {
          font-size: 1.5rem;
          margin: 0.25rem 0;
        }

        .section-head-left p {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }

        .recommendations-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 1.25rem;
        }

        .rec-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          transition: transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
        }

        .rec-card:hover {
          transform: translateY(-4px);
          border-color: var(--primary-color);
          box-shadow: var(--shadow-lg);
        }

        .rec-img-box {
          height: 140px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-primary);
          border-radius: 8px;
          margin-bottom: 1rem;
          overflow: hidden;
        }

        .rec-img-box img {
          max-height: 90%;
          max-width: 90%;
          object-fit: contain;
          transition: transform var(--transition-normal);
        }

        .rec-card:hover .rec-img-box img {
          transform: scale(1.05);
        }

        .rec-info {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .rec-vol {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--primary-color);
          background: rgba(var(--primary-rgb), 0.1);
          padding: 0.2rem 0.6rem;
          border-radius: 50px;
          align-self: flex-start;
          margin-bottom: 0.5rem;
        }

        .rec-info h3 {
          font-size: 1.05rem;
          font-weight: 750;
          margin: 0 0 0.35rem;
          color: var(--text-primary);
        }

        .rec-desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 1rem;
          flex: 1;
        }

        .rec-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid var(--border-color);
          padding-top: 0.8rem;
          margin-top: auto;
        }

        .rec-price {
          font-size: 1.15rem;
          font-weight: 850;
          color: var(--text-primary);
        }

        .add-btn {
          padding: 0.45rem 0.9rem;
          font-size: 0.82rem;
          font-weight: 800;
        }

        .loading-state {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          background: var(--bg-primary);
        }

        @media (max-width: 1100px) {
          .metric-grid, .quick-section {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .recommendations-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .portal-grid {
            grid-template-columns: 1fr;
          }

          .portal-hero {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (max-width: 700px) {
          .portal-hero {
            padding: 2rem 1.25rem;
          }

          .metric-grid, .portal-grid, .quick-section, .recommendations-grid {
            grid-template-columns: 1fr;
            padding: 0 1rem;
          }

          .recommendations-section {
            padding: 0 1rem;
          }

          .metric-grid {
            margin-top: 1rem;
          }

          .hero-actions, .hero-actions .btn {
            width: 100%;
          }

          .panel-head {
            align-items: flex-start;
            flex-direction: column;
          }

          .guest-checkout {
            align-items: flex-start;
            flex-direction: column;
            padding: 1.25rem;
          }
        }
      `;
