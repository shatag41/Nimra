'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/frontend/customer/hooks/useAuth';
import { useCustomerOrders } from '@/frontend/customer/hooks/useCustomerOrders';
import { useCMSData } from '@/frontend/customer/hooks/useCMSData';
import { useCart } from '@/frontend/customer/contexts/CartProvider';
import { isOrderable } from '../utils/commerce';
import { PortalHero } from './portal/Hero';
import { RecentlyViewedProducts } from './portal/RecentlyViewed';
import { PortalNotifications } from './portal/Notifications';
import { toast } from 'sonner';
import { saveUser, requestEmailChangeOTP } from '@/utils/api';

// Lazy-loaded heavy sections for faster page loads
const RecommendationCard = dynamic(
  () => import('./portal/Products').then((mod) => mod.RecommendationCard),
  { ssr: false, loading: () => <div className="loading-state">Loading recommendation...</div> }
);

const UpcomingProducts = dynamic(
  () => import('./UpcomingProducts').then((mod) => mod.UpcomingProducts),
  { ssr: false, loading: () => <div className="loading-state">Loading products...</div> }
);

const Orders = dynamic(
  () => import('./portal/Orders').then((mod) => mod.Orders),
  { ssr: false, loading: () => <div className="loading-state">Loading orders...</div> }
);

const Profile = dynamic(
  () => import('./portal/Profile').then((mod) => mod.Profile),
  { ssr: false, loading: () => <div className="loading-state">Loading profile...</div> }
);

const Addresses = dynamic(
  () => import('./portal/Addresses').then((mod) => mod.Addresses),
  { ssr: false, loading: () => <div className="loading-state">Loading addresses...</div> }
);

const FAQs = dynamic(
  () => import('./portal/FAQs').then((mod) => mod.FAQs),
  { ssr: false, loading: () => <div className="loading-state">Loading FAQs...</div> }
);

export default function CustomerPortalClient() {
  const { user, isAuthenticated, isLoading, login } = useAuth();
  const { products, faqs } = useCMSData();
  const { orders, loadingOrders, metrics, refreshOrders } = useCustomerOrders();
  const cart = useCart();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const recommendedProducts = React.useMemo(() => {
    const orderable = (products || []).filter(isOrderable);
    return orderable.slice(0, 4);
  }, [products]);

  const upcomingProductsList = React.useMemo(() => {
    return (products || []).filter((p) => {
      const stock = String(p.StockStatus || '').toLowerCase();
      const cat = String(p.Category || '').toLowerCase();
      return stock.includes('coming') || stock.includes('upcoming') || cat.includes('upcoming');
    });
  }, [products]);

  const activeFaqs = React.useMemo(
    () => (faqs || []).filter((faq) => faq.Active !== false && String(faq.Active).toLowerCase() !== 'false'),
    [faqs]
  );

  const validOrders = React.useMemo(() => orders.filter(o => o.status?.toLowerCase() !== 'cancelled'), [orders]);
  const totalSpent = React.useMemo(() => validOrders.reduce((sum, o) => sum + Number(o.total || 0), 0), [validOrders]);
  
  const getReorderFrequency = React.useCallback(() => {
    if (orders.length < 2) return 'Not enough data';
    const sorted = [...orders].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    const firstDate = new Date(sorted[sorted.length - 1].createdAt || 0);
    const lastDate = new Date(sorted[0].createdAt || 0);
    const daysDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 3600 * 24);
    const freq = daysDiff / (orders.length - 1);
    return freq < 1 ? '< 1 day' : `${Math.round(freq)} days`;
  }, [orders]);

  const getFavoriteProduct = React.useCallback(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => {
      (o.items || []).forEach((item: any) => {
        counts[item.name] = (counts[item.name] || 0) + (Number(item.quantity) || 1);
      });
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : 'None';
  }, [orders]);

  const accountAgeDays = user?.CreatedAt ? Math.max(0, Math.floor((Date.now() - new Date(user.CreatedAt).getTime()) / (1000 * 3600 * 24))) : 0;
  
  const parsedAddresses = React.useMemo(() => {
    try { return user?.SavedAddresses ? JSON.parse(user.SavedAddresses) : []; } catch (e) { return []; }
  }, [user?.SavedAddresses]);
  const defaultAddress = parsedAddresses.find((a: any) => a.isDefault);
  const homeAddresses = parsedAddresses.filter((a: any) => a.type === 'Home').length;
  const workAddresses = parsedAddresses.filter((a: any) => a.type === 'Work').length;

  if (!mounted || isLoading) {
    return (
      <div className="portal-page">
        <div className="portal-hero" style={{ minHeight: '96px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ width: '250px', height: '40px', background: 'rgba(255,255,255,0.2)', borderRadius: '8px', animation: 'pulse 2s infinite' }} />
          <div style={{ width: '400px', height: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginTop: '1rem', animation: 'pulse 2s infinite' }} />
        </div>
        <section className="portal-grid" style={{ opacity: 0.5 }}>
          <div className="empty-state">
             <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--primary-color)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
             <p>Loading your portal...</p>
          </div>
        </section>
        <style jsx global>{portalStyles}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="portal-page">
        <PortalHero isAuthenticated={false} />

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

        <style jsx global>{portalStyles}</style>
      </div>
    );
  }

  return (
    <>
      <div className="portal-page">
      <PortalHero isAuthenticated={true} name={user?.Name} />

      {tab === 'addresses' ? (
        <section className="portal-tab-section" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem', width: '100%' }}>
          <Addresses />
        </section>
      ) : tab === 'profile' ? (
        <section className="portal-centered-content portal-tab-section" style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <EditProfileForm user={user} onUpdate={(updatedUser) => login(updatedUser)} />
        </section>
      ) : tab === 'notifications' ? (
        <section className="portal-centered-content portal-tab-section" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <PortalNotifications />
        </section>
      ) : (
        <>
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
              <span>Recent Cancel Order Status</span>
              {metrics.latestCancelOrder ? (
                <>
                  <strong style={{ color: /pending/i.test(metrics.latestCancelOrder.cancellationStatus || '') ? 'red' : 'green' }}>
                    {metrics.latestCancelOrder.cancellationStatus || 'Cancelled'}
                  </strong>
                  <small>Order #{metrics.latestCancelOrder.orderId}</small>
                </>
              ) : (
                <>
                  <strong>N/A</strong>
                  <small>No cancel requests</small>
                </>
              )}
            </div>
          </section>

          <section className="portal-grid">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Orders 
                orders={orders}
                loadingOrders={loadingOrders} 
                onRefresh={refreshOrders} 
              />
              <RecentlyViewedProducts products={products} />
            </div>

            <aside className="side-stack">
              <Profile user={user} />

              <div className="panel next-card">
                <span className="eyebrow" style={{ color: 'var(--primary-color)', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '999px', padding: '0.2rem 0.75rem', fontSize: '0.7rem' }}>Next Step</span>
                <h2>{cart.totalItems > 0 ? 'Continue to Checkout' : 'Start Your First Order'}</h2>
                <p>
                  {cart.totalItems > 0
                    ? `You have ${cart.totalItems} item(s) in your cart ready for checkout.`
                    : 'Choose bottles, cans, or bulk jars and place a delivery request in minutes.'}
                </p>
                <Link
                  href={cart.totalItems > 0 ? '/checkout' : '/products'}
                  className="btn btn-primary"
                >
                  {cart.totalItems > 0 ? 'Checkout' : 'Shop Products'}
                </Link>
              </div>

              {activeFaqs.length > 0 && (
                <div className="panel portal-faq-card">
                  <div className="portal-faq-head">
                    <div>
                      <span className="eyebrow portal-faq-eyebrow">FAQ</span>
                      <h2>Quick Answers</h2>
                    </div>
                    <Link href="/about#faqs" className="portal-faq-link">View All FAQs</Link>
                  </div>
                  <FAQs faqs={activeFaqs} limit={2} variant="compact" />
                </div>
              )}
            </aside>
          </section>


        </>
      )}
      </div>

      <div style={{ marginTop: '0rem', position: 'relative', width: '100vw', left: '50%', transform: 'translateX(-50%)' }}>
        <UpcomingProducts upcomingProducts={upcomingProductsList} />
      </div>

      <style jsx global>{portalStyles}</style>
    </>
  );
}

const portalStyles = `
  .portal-page { min-height: 100vh; background: var(--bg-primary); padding-bottom: 1rem; }

  /* ── Cart Toast Banner ── */
  .cart-toast-banner {
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%) translateY(120px);
    z-index: 2000;
    display: flex;
    align-items: center;
    gap: 1rem;
    background: var(--bg-primary);
    border: 1px solid var(--primary-color);
    border-radius: var(--radius-xl);
    padding: 0.9rem 1.25rem;
    box-shadow: 0 8px 32px rgba(6, 182, 212, 0.25);
    min-width: 340px;
    max-width: 90vw;
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
    opacity: 0;
    pointer-events: none;
  }
  .cart-toast-banner.visible {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
    pointer-events: auto;
  }
  .toast-content {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex: 1;
    color: var(--text-primary);
    font-size: 0.92rem;
  }
  .toast-content svg {
    color: #22c55e;
    flex-shrink: 0;
  }
  .toast-go-btn {
    background: var(--primary-color);
    color: white;
    font-weight: 700;
    font-size: 0.85rem;
    padding: 0.5rem 1rem;
    border-radius: var(--radius-lg);
    white-space: nowrap;
    transition: background var(--transition-fast);
    text-decoration: none;
  }
  .toast-go-btn:hover {
    background: var(--accent-color);
  }
  .toast-close {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 1rem;
    padding: 0 0.25rem;
    line-height: 1;
    transition: color var(--transition-fast);
  }
  .toast-close:hover { color: var(--text-primary); }

  @media (max-width: 640px) {
    .cart-toast-banner { min-width: unset; width: calc(100vw - 2rem); }
  }

  .portal-hero {
    padding: 4rem 2.5rem;
    background: linear-gradient(90deg, #003366 0%, #104489 100%);
    color: white;
    position: relative;
    overflow: hidden;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  .portal-hero::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 60%;
    height: 100%;
    background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 70%);
    pointer-events: none;
    z-index: 1;
  }
  .portal-hero-content {
    position: relative;
    z-index: 2;
    animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  .portal-hero h1 {
    max-width: 820px;
    color: #ffffff;
    font-size: clamp(1.6rem, 3.2vw, 2.6rem);
    font-weight: 800;
    letter-spacing: -0.02em;
    margin: 0.5rem 0;
    line-height: 1.2;
  }
  .portal-hero p {
    max-width: 680px;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.98rem;
    line-height: 1.6;
    margin: 0;
  }

  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 999px;
    padding: 0.35rem 0.95rem;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 0.75rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
  }
  .eyebrow:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.25);
  }

  .hero-actions {
    display: flex;
    gap: 0.8rem;
    flex-wrap: wrap;
    margin-top: 1.75rem;
  }

  @keyframes fadeUp {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; max-width: 100%; margin: -1.5rem auto 0; padding: 0 1rem; position: relative; z-index: 2; }

  .metric-card { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-xl); box-shadow: var(--shadow-lg); padding: 1rem; display: flex; flex-direction: column; gap: 0.35rem; transition: transform var(--transition-normal), box-shadow var(--transition-normal); }
  .metric-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-xl); border-color: rgba(0,150,58,0.3); }
  .metric-card span { text-transform: uppercase; letter-spacing: 0.04em; font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; }
  .metric-card small { color: var(--text-muted); font-size: 0.8rem; }
  .metric-card strong { color: var(--primary-color); font-size: 1.6rem; font-weight: 800; line-height: 1; letter-spacing: -0.02em; font-family: var(--font-heading); }

  .panel, .quick-card { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-xl); box-shadow: var(--shadow-md); }
  .panel { padding: 1.25rem; }

  .portal-grid { max-width: 100%; margin: 1rem auto 0; padding: 0 1rem; display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 1rem; align-items: start; }

  .panel-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1.25rem; }
  .panel-head.compact { margin-bottom: 0.8rem; }
  .panel h2 { margin: 0.4rem 0 0; font-size: 1.3rem; letter-spacing: -0.01em; font-weight: 700; }

  .refresh-btn { border: 1.5px solid var(--border-color); background: var(--bg-primary); color: var(--primary-color); border-radius: var(--radius-md); padding: 0.5rem 1rem; font: inherit; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: all var(--transition-fast); }
  .refresh-btn:hover { border-color: var(--primary-color); background: rgba(0,150,58,0.06); }
  .refresh-btn:disabled { opacity: 0.6; cursor: progress; }

  .table-link { display: inline-flex; align-items: center; padding: 0.4rem 0.85rem; border-radius: var(--radius-md); font-size: 0.82rem; font-weight: 700; color: var(--primary-color); background: rgba(0,150,58,0.07); border: 1px solid rgba(0,150,58,0.15); transition: all var(--transition-fast); }
  .table-link:hover { background: rgba(0,150,58,0.14); border-color: var(--primary-color); }

  .table-wrap { overflow-x: auto; overflow-y: auto; max-height: 300px; border: 1px solid var(--border-color); border-radius: var(--radius-lg); }
  .orders-table thead th { position: sticky; top: 0; z-index: 1; }
  .orders-table { width: 100%; border-collapse: collapse; min-width: 680px; }
  .orders-table th, .orders-table td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); text-align: left; white-space: nowrap; }
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
  .portal-faq-card { padding: 0.7rem; }
  .portal-faq-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 0.6rem; margin-bottom: 0.5rem; }
  .portal-faq-head h2 { margin: 0.1rem 0 0; font-size: 0.9rem; }
  .portal-faq-eyebrow { margin: 0; padding: 0; border: 0; background: transparent; color: var(--primary-color); font-size: 0.56rem; }
  .portal-faq-link { color: var(--primary-color); font-size: 0.66rem; font-weight: 700; white-space: nowrap; text-decoration: none; }
  .portal-faq-link:hover { text-decoration: underline; }

  .empty-state { min-height: 240px; display: grid; place-items: center; align-content: center; gap: 0.85rem; color: var(--text-secondary); text-align: center; border: 1.5px dashed var(--border-color); border-radius: var(--radius-xl); background: var(--bg-primary); padding: 2.5rem 2rem; }
  .empty-state h3 { margin: 0; color: var(--text-primary); font-size: 1.2rem; }

  .quick-section { max-width: 100%; margin: 1.5rem auto 0; padding: 0 2rem; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; }
  .quick-section.guest { margin-top: 2.5rem; }
  .guest-checkout { max-width: 100%; margin: 1.5rem auto 0; padding: 1.5rem 2rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-xl); box-shadow: var(--shadow-sm); }
  .guest-checkout h2 { margin: 0.25rem 0 0.35rem; font-size: 1.35rem; }
  .guest-checkout p { color: var(--text-secondary); font-size: 0.9rem; }
  .quick-card { padding: 1.35rem; color: var(--text-primary); display: block; transition: all var(--transition-normal); }
  .quick-card:hover { transform: translateY(-4px); border-color: var(--primary-color); box-shadow: var(--shadow-lg); }
  .quick-icon { display: inline-flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: var(--radius-md); margin-bottom: 0.85rem; background: rgba(0,150,58,0.08); font-size: 1.2rem; border: 1px solid rgba(0,150,58,0.15); }
  .quick-card h3 { margin: 0 0 0.35rem; font-size: 1rem; font-weight: 700; }
  .quick-card p { color: var(--text-secondary); font-size: 0.875rem; line-height: 1.55; }

  .recommendations-section { max-width: 100%; margin: 2rem auto 0; padding: 0 2rem; }
  .section-head-left { margin-bottom: 1.5rem; }
  .section-head-left h2 { font-size: 1.5rem; margin: 0.35rem 0 0.25rem; font-weight: 700; }
  .section-head-left p { color: var(--text-secondary); font-size: 0.9rem; }
  .recommendations-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1.25rem; }
  .rec-card { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-xl); padding: 1.25rem; display: flex; flex-direction: column; transition: all var(--transition-normal); box-shadow: var(--shadow-sm); }
  .rec-card:hover { transform: translateY(-5px); border-color: var(--primary-color); box-shadow: var(--shadow-xl); }
  .rec-img-box { margin: -1.25rem -1.25rem 1rem -1.25rem; overflow: hidden; border-bottom: 1px solid var(--border-color); border-top-left-radius: var(--radius-xl); border-top-right-radius: var(--radius-xl); position: relative; }
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
    .portal-hero { padding: 1.5rem 2rem 2.5rem; }
  }

  @media (max-width: 700px) {
    .portal-hero { padding: 1.25rem 1.25rem 2rem; }
    .metric-grid, .portal-grid, .quick-section, .recommendations-grid { grid-template-columns: 1fr; padding: 0 1rem; }
    .recommendations-section { padding: 0 1rem; }
    .metric-grid { margin-top: 1.25rem; }
    .panel-head { align-items: flex-start; flex-direction: column; }
    .guest-checkout { align-items: flex-start; flex-direction: column; padding: 1.25rem; }
  }
`;

function EditProfileForm({ user, onUpdate }: { user: any; onUpdate: (user: any) => void }) {
  const [name, setName] = React.useState(String(user?.Name || ''));
  const [mobile, setMobile] = React.useState(String(user?.Mobile || ''));
  const [email, setEmail] = React.useState(String(user?.Username || ''));
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [otp, setOtp] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  
  // Validation errors state
  const [errors, setErrors] = React.useState<{ name?: string; mobile?: string; email?: string; otp?: string }>({});

  const validateFields = (): boolean => {
    const newErrors: typeof errors = {};
    const nameStr = String(name).trim();
    const mobileStr = String(mobile).trim();
    const emailStr = String(email).trim();
    
    // Name validation
    if (nameStr.length < 2) {
      newErrors.name = 'Full Name must be at least 2 characters.';
    } else if (!/^[a-zA-Z\s]+$/.test(nameStr)) {
      newErrors.name = 'Full Name should only contain letters and spaces.';
    }

    // Mobile validation
    if (!/^[0-9]{10}$/.test(mobileStr)) {
      newErrors.mobile = 'Mobile Number must be exactly 10 digits.';
    }

    // Email validation
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(emailStr)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFields()) return;

    if (email !== user?.Username) {
      setLoading(true);
      try {
        const res = await requestEmailChangeOTP(user?.ID, email);
        if (res.success) {
          setIsVerifying(true);
          toast.success(res.message || 'OTP Sent! Please check your new email.');
        } else {
          toast.error(res.message || 'Failed to send OTP.');
        }
      } catch (err) {
        console.error(err);
        toast.error('An unexpected error occurred while requesting OTP.');
      } finally {
        setLoading(false);
      }
    } else {
      performUpdate();
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      const res = await requestEmailChangeOTP(user?.ID, email);
      if (res.success) {
        toast.success(res.message || 'OTP resent successfully.');
        setOtp('');
      } else {
        toast.error(res.message || 'Failed to resend OTP.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An unexpected error occurred while resending OTP.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    performUpdate(otp);
  };

  const performUpdate = async (verificationOtp?: string) => {
    setLoading(true);
    try {
      const updatePayload: any = {
        ID: user?.ID,
        Name: name,
        Mobile: mobile,
        Username: email
      };

      if (verificationOtp) {
        updatePayload.otp = verificationOtp;
      }
      
      const res = await saveUser(updatePayload, 'update');
      if (res.success) {
        onUpdate({ ...user, Name: name, Mobile: mobile, Username: email });
        setIsVerifying(false);
        toast.success('Profile updated successfully!');
      } else {
        if (verificationOtp) {
          setErrors(prev => ({ ...prev, otp: res.message || 'Invalid or expired OTP.' }));
        } else {
          toast.error(res.message || 'Failed to save profile changes.');
        }
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      toast.error('An unexpected error occurred while saving profile changes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel profile-edit-panel glass animate-fade-in-up">
      <div className="profile-edit-header">
        <h2>Edit Profile</h2>
        <p>Update your personal account details below.</p>
      </div>
      
      {!isVerifying ? (
        <form onSubmit={handleSave} className="edit-form-content">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => {
                setName(e.target.value);
                if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
              }} 
              className={`form-input ${errors.name ? 'error-state' : ''}`} 
              placeholder="Enter your full name"
              required 
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Mobile Number</label>
            <input 
              type="tel" 
              value={mobile} 
              onChange={e => {
                setMobile(e.target.value);
                if (errors.mobile) setErrors(prev => ({ ...prev, mobile: undefined }));
              }} 
              className={`form-input ${errors.mobile ? 'error-state' : ''}`} 
              placeholder="e.g. 9876543210"
              required 
            />
            {errors.mobile && <span className="error-message">{errors.mobile}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => {
                setEmail(e.target.value);
                if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
              }} 
              className={`form-input ${errors.email ? 'error-state' : ''}`} 
              placeholder="e.g. name@domain.com"
              required 
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
            {email !== user?.Username && !errors.email && (
              <div className="verification-info-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                  <path d="M12 16v-4M12 8h.01"/>
                </svg>
                <span>Changing email requires OTP verification.</span>
              </div>
            )}
          </div>

          <button type="submit" className="btn-save-profile" disabled={loading}>
            {loading ? (
              <span className="spinner-wrapper">
                <svg className="spin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Saving changes...
              </span>
            ) : 'Save Changes'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="otp-verification-wrapper animate-fade-in-up">
          <div className="otp-header-box">
            <div className="otp-shield-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h3>Verify Email Change</h3>
            <p>We've sent a 6-digit OTP code to <strong>{email}</strong>. Enter it below to authorize this change.</p>
          </div>

          <div className="form-group">
            <input 
              type="text" 
              value={otp} 
              onChange={e => {
                setOtp(e.target.value);
                if (errors.otp) setErrors(prev => ({ ...prev, otp: undefined }));
              }} 
              placeholder="••••••" 
              required 
              maxLength={6} 
              className={`form-input otp-field ${errors.otp ? 'error-state' : ''}`} 
            />
            {errors.otp && <span className="error-message center-align">{errors.otp}</span>}
          </div>

          <div style={{ textAlign: 'center', marginTop: '-0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Didn't receive the code?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-color)',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '0.85rem'
                }}
              >
                Resend OTP
              </button>
            </span>
          </div>

          <div className="otp-button-group">
            <button type="button" className="btn-otp-cancel" onClick={() => setIsVerifying(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-otp-verify" disabled={loading}>
              {loading ? 'Verifying...' : 'Confirm & Save'}
            </button>
          </div>
        </form>
      )}

      <style jsx>{`
        .profile-edit-panel {
          max-width: 600px;
          margin: 0 auto;
          padding: 2.5rem;
          border-radius: var(--radius-2xl);
          box-shadow: var(--shadow-xl);
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .profile-edit-header h2 {
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0 0 0.35rem 0;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, var(--text-primary) 0%, rgba(var(--primary-rgb), 0.8) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .profile-edit-header p {
          color: var(--text-secondary);
          margin: 0;
          font-size: 0.95rem;
        }

        .edit-form-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-label {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: 0.01em;
        }

        .form-input {
          width: 100%;
          padding: 0.85rem 1.1rem;
          border-radius: var(--radius-lg);
          border: 1.5px solid var(--border-color);
          background: rgba(15, 23, 42, 0.25);
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 0.95rem;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .form-input:focus {
          outline: none;
          border-color: var(--primary-color);
          background: rgba(15, 23, 42, 0.4);
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.15);
        }

        .form-input.error-state {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.05);
        }

        .form-input.error-state:focus {
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.15);
        }

        .error-message {
          color: #ef4444;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .error-message.center-align {
          text-align: center;
          display: block;
          margin-top: 0.25rem;
        }

        .verification-info-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(37, 99, 235, 0.08);
          border: 1px solid rgba(37, 99, 235, 0.15);
          color: var(--primary-color);
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.4rem 0.8rem;
          border-radius: var(--radius-md);
          margin-top: 0.5rem;
          align-self: start;
        }

        .btn-save-profile {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 0.85rem;
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 0.95rem;
          color: #ffffff;
          background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
          border: none;
          border-radius: var(--radius-lg);
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
          transition: all 0.25s ease;
          margin-top: 0.5rem;
        }

        .btn-save-profile:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35);
          background: linear-gradient(135deg, var(--primary-hover) 0%, var(--primary-color) 100%);
        }

        .btn-save-profile:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* OTP Verification Styles */
        .otp-verification-wrapper {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .otp-header-box {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .otp-shield-icon {
          color: var(--primary-color);
          background: rgba(37, 99, 235, 0.1);
          padding: 0.85rem;
          border-radius: 50%;
          border: 1px solid rgba(37, 99, 235, 0.2);
          margin-bottom: 0.25rem;
        }

        .otp-header-box h3 {
          font-size: 1.3rem;
          font-weight: 700;
          margin: 0;
        }

        .otp-header-box p {
          color: var(--text-secondary);
          font-size: 0.9rem;
          line-height: 1.5;
          margin: 0;
          max-width: 420px;
        }

        .otp-field {
          text-align: center;
          font-size: 1.5rem;
          letter-spacing: 0.4em;
          font-weight: 700;
          padding: 0.9rem;
          font-family: monospace;
        }

        .otp-button-group {
          display: flex;
          gap: 1rem;
        }

        .btn-otp-cancel {
          flex: 1;
          padding: 0.85rem;
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 0.95rem;
          background: transparent;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-otp-cancel:hover {
          background: rgba(148, 163, 184, 0.08);
          color: var(--text-primary);
        }

        .btn-otp-verify {
          flex: 1;
          padding: 0.85rem;
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 0.95rem;
          color: #ffffff;
          background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
          border: none;
          border-radius: var(--radius-lg);
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
          transition: all 0.2s ease;
        }

        .btn-otp-verify:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35);
        }

        .spinner-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .spin-icon {
          animation: spin 1s linear infinite;
          width: 16px;
          height: 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
