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
    return { totalSpend, activeOrders, deliveredOrders, latestOrder };
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
            <p>Browse products, learn about our water quality, and track an existing order without signing in.</p>
          </div>
          <div className="hero-actions">
            <Link href="/products" className="btn btn-primary">Browse Products</Link>
            <Link href="/track" className="btn btn-ghost">Track Order</Link>
          </div>
        </section>

        <section className="quick-section guest">
          <Link href="/products" className="quick-card">
            <span className="quick-icon">💧</span>
            <h3>Product Range</h3>
            <p>View bottles, cans, jars, pricing, and availability from the live catalog.</p>
          </Link>
          <Link href="/track" className="quick-card">
            <span className="quick-icon">📦</span>
            <h3>Track Order</h3>
            <p>Check delivery status using your order details.</p>
          </Link>
          <Link href="/about" className="quick-card">
            <span className="quick-icon">🛡️</span>
            <h3>Quality</h3>
            <p>Learn about NIMRA purification, infrastructure, and standards.</p>
          </Link>
          <Link href="/contact" className="quick-card">
            <span className="quick-icon">💬</span>
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
      </section>

      <section className="metric-grid" aria-label="Account summary">
        <div className="metric-card">
          <span>Total Orders</span>
          <strong>{orders.length}</strong>
          <small>{loadingOrders ? 'Refreshing...' : 'Synced from your account'}</small>
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
              <span className="eyebrow" style={{ color: 'var(--primary-color)', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '999px', padding: '0.2rem 0.75rem', fontSize: '0.7rem' }}>Orders</span>
              <h2>Recent Activity</h2>
            </div>
            <button className="refresh-btn" type="button" onClick={loadOrders} disabled={loadingOrders}>
              {loadingOrders ? 'Refreshing...' : '↻ Refresh'}
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
                      <td><Link href={`/track?orderId=${order.orderId}`} className="table-link">Track →</Link></td>
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
                <span className="eyebrow" style={{ color: 'var(--primary-color)', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '999px', padding: '0.2rem 0.75rem', fontSize: '0.7rem' }}>Profile</span>
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
            <span className="eyebrow" style={{ color: 'var(--primary-color)', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '999px', padding: '0.2rem 0.75rem', fontSize: '0.7rem' }}>Next Step</span>
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
            <span className="eyebrow" style={{ color: 'var(--primary-color)', background: 'rgba(0,150,58,0.1)', border: '1px solid rgba(0,150,58,0.2)', borderRadius: '999px', padding: '0.2rem 0.75rem', fontSize: '0.7rem' }}>Recommendations</span>
            <h2>Recommended Products</h2>
            <p>Pure hydration options curated for your regular supply.</p>
          </div>
          <div className="recommendations-grid">
            {recommendedProducts.map((product) => (
              <div key={product.ID} className="rec-card">
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

      <section className="recommendations-section" style={{ marginTop: '3rem' }}>
        <div className="panel rush-portal-banner" style={{ background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)', color: 'white', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '3rem 2rem' }}>
          <span className="eyebrow" style={{ color: '#fbbf24', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '999px', padding: '0.2rem 0.75rem', fontSize: '0.7rem', marginBottom: '1rem' }}>Coming Soon</span>
          <h2 style={{ marginBottom: '1rem', fontSize: '2rem', color: 'white', fontWeight: '800', letterSpacing: '-0.02em' }}>RUSH Club Soda</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', marginBottom: '2rem', maxWidth: '500px', lineHeight: '1.6' }}>
            Prepare for the ultimate bubbly experience. Pure, crisp, and extra sparkling. Crafted to elevate your mocktails, parties, or enjoyed chilled.
          </p>
          <Link href="/contact" className="btn btn-primary" style={{ padding: '0.85rem 2.5rem', fontSize: '1rem', fontWeight: '700', borderRadius: 'var(--radius-lg)' }}>
            Get Notified
          </Link>
        </div>
      </section>

      <style jsx>{portalStyles}</style>
    </div>
  );
}

const portalStyles = `
  .portal-page { min-height: 100vh; background: var(--bg-primary); padding-bottom: 4rem; }

  .portal-hero {
    padding: 3.5rem 4rem 5.5rem;
    background: linear-gradient(130deg, #172554 0%, #2563eb 55%, #3b82f6 100%);
    color: white;
    position: relative;
    overflow: hidden;
  }
  .portal-hero::before {
    content: '';
    position: absolute;
    top: -80px; right: -80px;
    width: 320px; height: 320px;
    border-radius: 50%;
    background: rgba(255,255,255,0.06);
    pointer-events: none;
  }
  .portal-hero h1 { max-width: 820px; color: white; font-size: clamp(2rem, 4vw, 3.2rem); font-weight: 800; letter-spacing: -0.02em; margin: 0.75rem 0 0.75rem; }
  .portal-hero p { max-width: 680px; color: rgba(255, 255, 255, 0.82); font-size: 1rem; }

  .eyebrow { display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); border-radius: 999px; padding: 0.3rem 0.9rem; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.9); margin-bottom: 0.5rem; }

  .hero-actions { display: flex; gap: 0.8rem; flex-wrap: wrap; margin-top: 1.5rem; }

  .metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; max-width: 1280px; margin: -2.5rem auto 0; padding: 0 2rem; position: relative; z-index: 2; }

  .metric-card { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-xl); box-shadow: var(--shadow-lg); padding: 1.5rem; display: flex; flex-direction: column; gap: 0.35rem; transition: transform var(--transition-normal), box-shadow var(--transition-normal); }
  .metric-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-xl); border-color: rgba(0,150,58,0.3); }
  .metric-card span { text-transform: uppercase; letter-spacing: 0.04em; font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; }
  .metric-card small { color: var(--text-muted); font-size: 0.8rem; }
  .metric-card strong { color: var(--primary-color); font-size: 2rem; font-weight: 800; line-height: 1; letter-spacing: -0.02em; font-family: var(--font-heading); }

  .panel, .quick-card { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-xl); box-shadow: var(--shadow-md); }
  .panel { padding: 1.5rem; }

  .portal-grid { max-width: 1280px; margin: 1.5rem auto 0; padding: 0 2rem; display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 1.25rem; align-items: start; }

  .panel-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1.25rem; }
  .panel-head.compact { margin-bottom: 0.8rem; }
  .panel h2 { margin: 0.4rem 0 0; font-size: 1.3rem; letter-spacing: -0.01em; font-weight: 700; }

  .refresh-btn { border: 1.5px solid var(--border-color); background: var(--bg-primary); color: var(--primary-color); border-radius: var(--radius-md); padding: 0.5rem 1rem; font: inherit; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: all var(--transition-fast); }
  .refresh-btn:hover { border-color: var(--primary-color); background: rgba(0,150,58,0.06); }
  .refresh-btn:disabled { opacity: 0.6; cursor: progress; }

  .table-link { display: inline-flex; align-items: center; padding: 0.4rem 0.85rem; border-radius: var(--radius-md); font-size: 0.82rem; font-weight: 700; color: var(--primary-color); background: rgba(0,150,58,0.07); border: 1px solid rgba(0,150,58,0.15); transition: all var(--transition-fast); }
  .table-link:hover { background: rgba(0,150,58,0.14); border-color: var(--primary-color); }

  .table-wrap { overflow-x: auto; overflow-y: auto; max-height: 380px; border: 1px solid var(--border-color); border-radius: var(--radius-lg); }
  .orders-table thead th { position: sticky; top: 0; z-index: 1; }
  .orders-table { width: 100%; border-collapse: collapse; min-width: 680px; }
  .orders-table th, .orders-table td { padding: 1rem 1.1rem; border-bottom: 1px solid var(--border-color); text-align: left; white-space: nowrap; }
  .orders-table th { background: var(--bg-tertiary); color: var(--text-secondary); font-size: 0.75rem; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; }
  .orders-table tr:last-child td { border-bottom: 0; }
  .orders-table tbody tr { transition: background var(--transition-fast); }
  .orders-table tbody tr:hover { background: rgba(0,150,58,0.03); }
  .order-id { font-weight: 800; color: var(--text-primary); font-family: var(--font-heading); }

  .status-badge { display: inline-flex; align-items: center; min-height: 26px; padding: 0.2rem 0.7rem; border-radius: 999px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; background: rgba(0,150,58,0.1); color: var(--primary-color); border: 1px solid rgba(0,150,58,0.2); }
  .status-badge.pending { background: rgba(249,115,22,0.1); color: #c2410c; border-color: rgba(249,115,22,0.2); }
  .status-badge.delivered { background: rgba(0,150,58,0.12); color: #00783A; border-color: rgba(0,150,58,0.25); }
  .status-badge.cancelled { background: rgba(220,38,38,0.1); color: #b91c1c; border-color: rgba(220,38,38,0.2); }

  .side-stack { display: grid; gap: 1.25rem; }
  .completion { display: inline-flex; align-items: center; justify-content: center; padding: 0.2rem 0.7rem; border-radius: 999px; background: rgba(0,150,58,0.1); color: var(--primary-color); font-weight: 800; font-size: 0.9rem; border: 1px solid rgba(0,150,58,0.2); }

  .progress-track { width: 100%; height: 6px; overflow: hidden; border-radius: 999px; background: var(--bg-tertiary); margin-bottom: 1rem; }
  .progress-track span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--primary-color), var(--accent-color)); transition: width 0.6s ease; }

  .profile-list { display: grid; gap: 0.75rem; }
  .profile-list div { display: flex; justify-content: space-between; gap: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-color); }
  .profile-list div:last-child { border-bottom: 0; padding-bottom: 0; }
  .profile-list dt { color: var(--text-secondary); font-weight: 700; font-size: 0.875rem; }
  .profile-list dd { color: var(--text-primary); font-weight: 600; text-align: right; overflow-wrap: anywhere; font-size: 0.875rem; }
  .next-card p { color: var(--text-secondary); margin: 0.65rem 0 1.25rem; line-height: 1.6; font-size: 0.9rem; }

  .empty-state { min-height: 240px; display: grid; place-items: center; align-content: center; gap: 0.85rem; color: var(--text-secondary); text-align: center; border: 1.5px dashed var(--border-color); border-radius: var(--radius-xl); background: var(--bg-primary); padding: 2.5rem 2rem; }
  .empty-state h3 { margin: 0; color: var(--text-primary); font-size: 1.2rem; }

  .quick-section { max-width: 1280px; margin: 1.5rem auto 0; padding: 0 2rem; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; }
  .quick-section.guest { margin-top: 2.5rem; }
  .guest-checkout { max-width: 1280px; margin: 1.5rem auto 0; padding: 1.5rem 2rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-xl); box-shadow: var(--shadow-sm); }
  .guest-checkout h2 { margin: 0.25rem 0 0.35rem; font-size: 1.35rem; }
  .guest-checkout p { color: var(--text-secondary); font-size: 0.9rem; }
  .quick-card { padding: 1.35rem; color: var(--text-primary); display: block; transition: all var(--transition-normal); }
  .quick-card:hover { transform: translateY(-4px); border-color: var(--primary-color); box-shadow: var(--shadow-lg); }
  .quick-icon { display: inline-flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: var(--radius-md); margin-bottom: 0.85rem; background: rgba(0,150,58,0.08); font-size: 1.2rem; border: 1px solid rgba(0,150,58,0.15); }
  .quick-card h3 { margin: 0 0 0.35rem; font-size: 1rem; font-weight: 700; }
  .quick-card p { color: var(--text-secondary); font-size: 0.875rem; line-height: 1.55; }

  .recommendations-section { max-width: 1280px; margin: 2rem auto 0; padding: 0 2rem; }
  .section-head-left { margin-bottom: 1.5rem; }
  .section-head-left h2 { font-size: 1.5rem; margin: 0.35rem 0 0.25rem; font-weight: 700; }
  .section-head-left p { color: var(--text-secondary); font-size: 0.9rem; }
  .recommendations-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1.25rem; }
  .rec-card { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-xl); padding: 1.25rem; display: flex; flex-direction: column; transition: all var(--transition-normal); box-shadow: var(--shadow-sm); }
  .rec-card:hover { transform: translateY(-5px); border-color: var(--primary-color); box-shadow: var(--shadow-xl); }
  .rec-img-box { height: 150px; display: flex; align-items: center; justify-content: center; background: linear-gradient(180deg, #f1f5f9, #f8fafc); border-radius: var(--radius-lg); margin-bottom: 1rem; overflow: hidden; }
  .rec-img-box img { max-height: 90%; max-width: 90%; object-fit: contain; transition: transform var(--transition-normal); }
  .rec-card:hover .rec-img-box img { transform: scale(1.06); }
  .rec-info { display: flex; flex-direction: column; flex: 1; }
  .rec-vol { display: inline-block; font-size: 0.7rem; font-weight: 800; color: var(--primary-color); background: rgba(0,150,58,0.1); padding: 0.2rem 0.65rem; border-radius: 999px; align-self: flex-start; margin-bottom: 0.5rem; border: 1px solid rgba(0,150,58,0.2); }
  .rec-info h3 { font-size: 0.95rem; font-weight: 700; margin: 0 0 0.35rem; }
  .rec-desc { font-size: 0.83rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 1rem; flex: 1; }
  .rec-footer { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 0.85rem; margin-top: auto; }
  .rec-price { font-size: 1.1rem; font-weight: 800; color: var(--primary-color); font-family: var(--font-heading); }
  .add-btn { padding: 0.45rem 0.9rem; font-size: 0.82rem; font-weight: 700; }

  .loading-state { min-height: 100vh; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); background: var(--bg-primary); }

  @media (max-width: 1100px) {
    .metric-grid, .quick-section { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .recommendations-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .portal-grid { grid-template-columns: 1fr; }
    .portal-hero { padding: 3rem 2rem 5rem; }
  }

  @media (max-width: 700px) {
    .portal-hero { padding: 2rem 1.25rem 4rem; }
    .metric-grid, .portal-grid, .quick-section, .recommendations-grid { grid-template-columns: 1fr; padding: 0 1rem; }
    .recommendations-section { padding: 0 1rem; }
    .metric-grid { margin-top: 1.25rem; }
    .panel-head { align-items: flex-start; flex-direction: column; }
    .guest-checkout { align-items: flex-start; flex-direction: column; padding: 1.25rem; }
  }
`;
