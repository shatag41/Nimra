'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/frontend/customer/hooks/useAuth';
import { useCustomerOrders } from '@/frontend/customer/hooks/useCustomerOrders';
import { useCMSData } from '@/frontend/customer/hooks/useCMSData';
import { useCart } from '@/frontend/customer/contexts/CartProvider';
import { isOrderable } from '../utils/commerce';
import { RecentlyViewedProducts } from './portal/RecentlyViewed';
import { PortalNotifications } from './portal/Notifications';
import CustomerPageHeader from './CustomerPageHeader';
import { useNotification } from '@/frontend/customer/contexts/NotificationContext';
import { saveUser, requestEmailChangeOTP } from '@/utils/api';
import { CompactKpiCard } from './CompactKpiCard';

// Lazy-loaded heavy sections for faster page loads

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, mounted, router]);

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
  
  const formatDate = React.useCallback((dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return '';
    }
  }, []);

  const parsedAddresses = React.useMemo(() => {
    try { return user?.SavedAddresses ? JSON.parse(user.SavedAddresses) : []; } catch (e) { return []; }
  }, [user?.SavedAddresses]);
  const defaultAddress = parsedAddresses.find((a: any) => a.isDefault);
  const homeAddresses = parsedAddresses.filter((a: any) => a.type === 'Home').length;
  const workAddresses = parsedAddresses.filter((a: any) => a.type === 'Work').length;
  const portalHeader = React.useMemo(() => {
    if (tab === 'profile') {
      return {
        badge: 'PROFILE',
        title: 'Profile Settings',
        subtitle: 'Update your personal details and keep your NIMRA account information current.',
      };
    }
    if (tab === 'addresses') {
      return {
        badge: 'ADDRESSES',
        title: 'Saved Addresses',
        subtitle: 'Manage delivery addresses for faster checkout and smoother order placement.',
      };
    }
    if (tab === 'notifications') {
      return {
        badge: 'NOTIFICATIONS',
        title: 'Notifications',
        subtitle: 'Review your delivery updates, account alerts, and NIMRA messages.',
      };
    }
    return {
      badge: 'CUSTOMER PORTAL',
      title: `Welcome back, ${user?.Name ? (String(user.Name).length > 25 ? `${String(user.Name).slice(0, 25)}...` : user.Name) : 'Customer'}`,
      subtitle: 'Manage orders, track deliveries, and reach NIMRA support from one clean workspace.',
    };
  }, [tab, user?.Name]);

  if (!mounted || isLoading) {
    return (
      <div className="portal-page">
        <CustomerPageHeader badge="CUSTOMER PORTAL" title="Loading your portal" subtitle="Preparing your NIMRA workspace…" />
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
    return null;
  }

  return (
    <>
      <div className="portal-page">
      <CustomerPageHeader {...portalHeader} />

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
            <CompactKpiCard
              title="Total Orders"
              value={orders.length}
              subtitle="Total orders placed"
              accent="blue"
              icon={<svg viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/></svg>}
            />
            <CompactKpiCard
              title="Active Orders"
              value={metrics.activeOrders}
              subtitle="Pending & In Transit"
              accent="orange"
              icon={<svg viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8Z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>}
            />
            <CompactKpiCard
              title="Delivered"
              value={metrics.deliveredOrders}
              subtitle="Successfully delivered"
              accent="green"
              icon={<svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m22 4-10 10.01-3-3"/></svg>}
            />
            <CompactKpiCard
              title="Recent Cancel Status"
              value={metrics.latestCancelOrder ? (() => {
                const cancelStatus = metrics.latestCancelOrder.cancellationStatus || 'Cancelled';
                const isPending = /pending/i.test(cancelStatus);
                const isApproved = /approved|cancelled/i.test(cancelStatus.toLowerCase());
                const isRejected = /rejected/i.test(cancelStatus);
                let pillClass = 'status-pill status-pending';
                if (isApproved) pillClass = 'status-pill status-approved';
                else if (isRejected) pillClass = 'status-pill status-na';
                return <span className={pillClass}><span className={`status-dot ${isPending ? 'pulse' : ''}`} /><span>{cancelStatus}</span></span>;
              })() : <span className="status-pill status-na"><span className="status-dot" /><span>N/A</span></span>}
              subtitle="Latest cancellation"
              accent="red"
              icon={<svg viewBox="0 0 24 24"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4M12 17h.01"/></svg>}
            />
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

              <div className="panel next-card" tabIndex={0}>
                <div className="next-card-header">
                  <span className="eyebrow" style={{ color: 'var(--primary-color)', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: '999px', padding: '0.2rem 0.65rem', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: 0 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>Next Step</span>
                  </span>
                  <div className="next-card-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="9" cy="21" r="1"></circle>
                      <circle cx="20" cy="21" r="1"></circle>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                  </div>
                </div>
                <h2>{cart.totalItems > 0 ? 'Continue to Checkout' : 'Start Your First Order'}</h2>
                <p>
                  {cart.totalItems > 0 ? (
                    <>
                      You have <strong style={{ color: '#2563eb', fontWeight: 800 }}>{cart.totalItems}</strong> item{cart.totalItems === 1 ? '' : 's'} ready for checkout.
                    </>
                  ) : (
                    'Choose bottles, cans, or bulk jars and place a delivery request in minutes.'
                  )}
                </p>
                
                <div className="next-progress-steps">
                  <span className={`step-node ${cart.totalItems > 0 ? 'active' : ''}`}>Cart</span>
                  <span className="step-arrow">→</span>
                  <span className="step-node">Checkout</span>
                  <span className="step-arrow">→</span>
                  <span className="step-node">Delivery</span>
                </div>

                <Link
                  href={cart.totalItems > 0 ? '/checkout' : '/products'}
                  className="btn-next-step"
                >
                  <span>{cart.totalItems > 0 ? 'Checkout' : 'Shop Products'}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </Link>
              </div>

              <div className="panel portal-quick-controls-card" tabIndex={0}>
                <div className="quick-controls-head">
                  <span className="eyebrow quick-controls-eyebrow">QUICK CONTROLS</span>
                  <h2>Quick Access</h2>
                  <p className="quick-controls-sub">Manage your account and support in one place.</p>
                </div>
                
                <div className="quick-controls-list">
                  <Link href="/settings" className="quick-control-row">
                    <div className="quick-control-left">
                      <div className="quick-control-icon-box">⚙️</div>
                      <div className="quick-control-text">
                        <h3>Account Settings</h3>
                        <p>Manage your profile, password and preferences.</p>
                      </div>
                    </div>
                    <div className="quick-control-arrow">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </div>
                  </Link>

                  <Link href="/customer-portal?tab=addresses" className="quick-control-row">
                    <div className="quick-control-left">
                      <div className="quick-control-icon-box">📍</div>
                      <div className="quick-control-text">
                        <h3>Saved Addresses</h3>
                        <p>View and manage your delivery locations.</p>
                      </div>
                    </div>
                    <div className="quick-control-arrow">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </div>
                  </Link>

                  <Link href="/contact" className="quick-control-row">
                    <div className="quick-control-left">
                      <div className="quick-control-icon-box">🎧</div>
                      <div className="quick-control-text">
                        <h3>Help & Support</h3>
                        <p>Get assistance, contact support or raise a request.</p>
                      </div>
                    </div>
                    <div className="quick-control-arrow">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </div>
                  </Link>
                </div>
              </div>
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

  /* ── Metric Grid & Cards ── */
  .metric-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1rem;
    max-width: 100%;
    margin: -1.5rem auto 0;
    padding: 0 1rem;
    position: relative;
    z-index: 2;
  }

  @media (max-width: 1024px) {
    .metric-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 640px) {
    .metric-grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .metric-card {
    --metric-accent: 37, 99, 235;
    position: relative;
    isolation: isolate;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 250, 252, 0.9) 100%),
      radial-gradient(circle at top right, rgba(var(--metric-accent), 0.08), transparent 60%);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(var(--metric-accent), 0.12);
    border-radius: 18px;
    box-shadow:
      0 10px 30px rgba(15, 23, 42, 0.06),
      0 2px 8px rgba(var(--metric-accent), 0.04);
    padding: 0.65rem 0.95rem;
    overflow: hidden;
    transition:
      transform 280ms ease,
      box-shadow 280ms ease,
      border-color 280ms ease,
      background 280ms ease;
  }

  .metric-card.accent-blue {
    --metric-accent: 37, 99, 235;
  }

  .metric-card.accent-orange {
    --metric-accent: 249, 115, 22;
  }

  .metric-card.accent-green {
    --metric-accent: 34, 197, 94;
  }

  .metric-card.accent-red {
    --metric-accent: 239, 68, 68;
  }

  /* Dark mode overrides */
  [data-theme="dark"] .metric-card {
    background:
      linear-gradient(180deg, rgba(15, 23, 42, 0.94) 0%, rgba(15, 23, 42, 0.86) 100%),
      radial-gradient(circle at top right, rgba(var(--metric-accent), 0.16), transparent 60%);
    border-color: rgba(var(--metric-accent), 0.16);
    box-shadow:
      0 10px 30px rgba(2, 6, 23, 0.36),
      0 2px 8px rgba(37, 99, 235, 0.08);
  }

  /* Hover State */
  .metric-card:hover {
    transform: translateY(-4px);
    box-shadow:
      0 16px 36px rgba(var(--metric-accent), 0.12),
      0 8px 18px rgba(15, 23, 42, 0.08);
    border-color: rgba(var(--metric-accent), 0.22);
  }
  
  [data-theme="dark"] .metric-card:hover {
    border-color: rgba(var(--metric-accent), 0.32);
    box-shadow:
      0 16px 36px rgba(var(--metric-accent), 0.18),
      0 10px 24px rgba(2, 6, 23, 0.38);
  }

  /* Keyboard focus state */
  .metric-card:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  /* Left/Right layout wrapper */
  .metric-card-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    height: 100%;
    gap: 0.75rem;
  }

  .metric-card-left {
    display: flex;
    flex-direction: column;
    gap: 0.18rem;
    flex: 1;
    min-width: 0;
  }

  .metric-label {
    text-transform: uppercase;
    font-size: 0.84rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: #64748b;
    margin: 0;
  }

  .metric-value {
    color: #0f172a;
    font-size: 1.68rem;
    font-weight: 850;
    line-height: 1.1;
    letter-spacing: -0.02em;
    font-family: var(--font-heading);
    margin: 0.04rem 0 0;
  }

  .metric-desc {
    color: #64748b;
    font-size: 0.74rem;
    line-height: 1.35;
    margin: 0;
  }

  .metric-cancel-status-wrapper {
    margin: 0.15rem 0;
  }

  .metric-cancel-footer {
    display: flex;
    flex-direction: column;
    gap: 0.05rem;
  }

  /* Icon Container (circular glass background) */
  .metric-icon-wrapper {
    position: relative;
    isolation: isolate;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    border: 1px solid rgba(var(--metric-accent), 0.12);
    box-shadow:
      inset 0 1px rgba(255, 255, 255, 0.72),
      0 8px 18px rgba(var(--metric-accent), 0.08);
    transition:
      transform 280ms ease,
      box-shadow 280ms ease,
      background 280ms ease;
    flex-shrink: 0;
  }

  .metric-icon-wrapper::before {
    content: '';
    position: absolute;
    inset: -10px;
    border-radius: inherit;
    background: radial-gradient(circle, rgba(var(--metric-accent), 0.2) 0%, rgba(var(--metric-accent), 0.08) 34%, transparent 72%);
    filter: blur(10px);
    opacity: 0.55;
    z-index: -1;
    transition: opacity 280ms ease, transform 280ms ease;
  }

  .metric-card:hover .metric-icon-wrapper {
    transform: scale(1.05);
  }

  .metric-card:hover .metric-icon-wrapper::before {
    opacity: 0.8;
    transform: scale(1.06);
  }

  .metric-icon-wrapper.blue {
    background: linear-gradient(145deg, rgba(37, 99, 235, 0.16), rgba(255, 255, 255, 0.84));
    color: #2563eb;
  }

  .metric-icon-wrapper.orange {
    background: linear-gradient(145deg, rgba(249, 115, 22, 0.16), rgba(255, 255, 255, 0.84));
    color: #ea580c;
  }

  .metric-icon-wrapper.green {
    background: linear-gradient(145deg, rgba(34, 197, 94, 0.16), rgba(255, 255, 255, 0.84));
    color: #16a34a;
  }

  .metric-icon-wrapper.red {
    background: linear-gradient(145deg, rgba(239, 68, 68, 0.16), rgba(255, 255, 255, 0.84));
    color: #dc2626;
  }

  /* Dark mode icon colors */
  [data-theme="dark"] .metric-icon-wrapper.blue {
    background: linear-gradient(145deg, rgba(59, 130, 246, 0.18), rgba(15, 23, 42, 0.5));
    color: #60a5fa;
  }
  [data-theme="dark"] .metric-icon-wrapper.orange {
    background: linear-gradient(145deg, rgba(251, 146, 60, 0.18), rgba(15, 23, 42, 0.5));
    color: #fb923c;
  }
  [data-theme="dark"] .metric-icon-wrapper.green {
    background: linear-gradient(145deg, rgba(74, 222, 128, 0.18), rgba(15, 23, 42, 0.5));
    color: #4ade80;
  }
  [data-theme="dark"] .metric-icon-wrapper.red {
    background: linear-gradient(145deg, rgba(248, 113, 113, 0.18), rgba(15, 23, 42, 0.5));
    color: #f87171;
  }

  /* Status Pill Styling */
  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.2rem 0.6rem;
    border-radius: 9999px;
    font-size: 0.72rem;
    font-weight: 700;
    line-height: 1;
    width: fit-content;
  }

  .status-pill.status-pending {
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: #dc2626;
  }
  [data-theme="dark"] .status-pill.status-pending {
    background: rgba(248, 113, 113, 0.12);
    border: 1px solid rgba(248, 113, 113, 0.25);
    color: #f87171;
  }

  .status-pill.status-approved, .status-pill.status-completed {
    background: rgba(34, 197, 94, 0.08);
    border: 1px solid rgba(34, 197, 94, 0.2);
    color: #16a34a;
  }
  [data-theme="dark"] .status-pill.status-approved, [data-theme="dark"] .status-pill.status-completed {
    background: rgba(74, 222, 128, 0.12);
    border: 1px solid rgba(74, 222, 128, 0.25);
    color: #4ade80;
  }

  .status-pill.status-na {
    background: rgba(100, 116, 139, 0.08);
    border: 1px solid rgba(100, 116, 139, 0.2);
    color: var(--text-muted);
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: currentColor;
    display: inline-block;
  }

  .status-dot.pulse {
    animation: cancel-pulse 2s infinite ease-in-out;
  }

  @keyframes cancel-pulse {
    0% { transform: scale(0.85); opacity: 0.6; }
    50% { transform: scale(1.25); opacity: 1; }
    100% { transform: scale(0.85); opacity: 0.6; }
  }

  /* Micro animation: number count/fade in on load */
  @keyframes metric-number-fade {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .animate-metric-number {
    animation: metric-number-fade 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .panel, .quick-card {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(191, 219, 254, 0.4);
    border-radius: 20px;
    box-shadow: 0 4px 14px -3px rgba(37, 99, 235, 0.03), 0 2px 4px -2px rgba(0, 0, 0, 0.01);
    transition: all 200ms ease;
  }
  [data-theme="dark"] .panel, [data-theme="dark"] .quick-card {
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(59, 130, 246, 0.15);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
  }
  .panel:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 24px -4px rgba(37, 99, 235, 0.06), 0 4px 8px -2px rgba(37, 99, 235, 0.02);
    border-color: rgba(37, 99, 235, 0.35);
  }
  [data-theme="dark"] .panel:hover {
    border-color: rgba(59, 130, 246, 0.35);
    box-shadow: 0 10px 24px -4px rgba(0, 0, 0, 0.35);
  }
  .panel { padding: 0.95rem; }

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
  }

  @media (max-width: 700px) {
    .metric-grid, .portal-grid, .quick-section, .recommendations-grid { grid-template-columns: 1fr; padding: 0 1rem; }
    .recommendations-section { padding: 0 1rem; }
    .metric-grid { margin-top: 1.25rem; }
    .panel-head { align-items: flex-start; flex-direction: column; }
    .guest-checkout { align-items: flex-start; flex-direction: column; padding: 1.25rem; }
  }

  /* ── Panel visual enhancements & Next Step Card ── */
  .btn-portal-secondary {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.8rem;
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid rgba(191, 219, 254, 0.5);
    border-radius: 999px;
    background: var(--bg-secondary);
    color: var(--text-primary);
    cursor: pointer;
    transition: all 200ms ease;
  }
  .btn-portal-secondary:hover:not(:disabled) {
    border-color: var(--primary-color);
    color: var(--primary-color);
    background: linear-gradient(135deg, #ffffff 0%, #f4f9ff 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(37, 99, 235, 0.08);
  }
  .btn-portal-secondary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .btn-portal-secondary svg.spin {
    animation: spin-anim 1s linear infinite;
  }
  @keyframes spin-anim {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .next-card {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    padding: 1.1rem;
  }
  .next-card:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
  .next-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .next-card-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(37, 99, 235, 0.08);
    color: var(--primary-color);
  }
  [data-theme="dark"] .next-card-icon {
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
  }
  .next-card h2 {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }
  .next-card p {
    font-size: 0.85rem;
    color: var(--text-secondary);
    line-height: 1.45;
    margin: 0;
  }
  .next-progress-steps {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-top: 0.1rem;
    margin-bottom: 0.15rem;
  }
  .next-progress-steps .step-node.active {
    color: var(--primary-color);
  }
  [data-theme="dark"] .next-progress-steps .step-node.active {
    color: #60a5fa;
  }
  .next-progress-steps .step-arrow {
    opacity: 0.5;
  }
  .btn-next-step {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.6rem;
    font-size: 0.82rem;
    font-weight: 700;
    background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
    color: #ffffff;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    text-decoration: none;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
    transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  .btn-next-step:hover {
    background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
  }
  .btn-next-step svg {
    transition: transform 200ms ease;
  }
  .btn-next-step:hover svg {
    transform: translateX(3px);
  }

  /* ── Quick Controls Card ── */
  .portal-quick-controls-card {
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
    padding: 1.25rem;
  }
  .portal-quick-controls-card:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
  .quick-controls-head {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }
  .quick-controls-eyebrow {
    color: var(--primary-color);
    background: rgba(37,99,235,0.08);
    border: 1px solid rgba(37,99,235,0.15);
    border-radius: 999px;
    padding: 0.15rem 0.65rem;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    width: fit-content;
  }
  :global([data-theme="dark"]) .quick-controls-eyebrow {
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
    border-color: rgba(59, 130, 246, 0.2);
  }
  .quick-controls-head h2 {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0.25rem 0 0.1rem 0;
  }
  .quick-controls-sub {
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin: 0;
  }

  .quick-controls-list {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }
  .quick-control-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 0.85rem;
    background: rgba(150, 150, 150, 0.02);
    border: 1px solid rgba(191, 219, 254, 0.2);
    border-radius: 12px;
    text-decoration: none;
    cursor: pointer;
    transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  :global([data-theme="dark"]) .quick-control-row {
    border-color: rgba(255, 255, 255, 0.03);
  }
  .quick-control-row:hover {
    transform: translateY(-2px);
    background: rgba(37, 99, 235, 0.03);
    border-color: rgba(37, 99, 235, 0.25);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.05);
  }
  :global([data-theme="dark"]) .quick-control-row:hover {
    background: rgba(59, 130, 246, 0.04);
    border-color: rgba(59, 130, 246, 0.2);
  }
  
  .quick-control-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 0;
    flex: 1;
  }
  .quick-control-icon-box {
    font-size: 1.2rem;
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: rgba(37, 99, 235, 0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 250ms ease;
    flex-shrink: 0;
  }
  :global([data-theme="dark"]) .quick-control-icon-box {
    background: rgba(255, 255, 255, 0.03);
  }
  .quick-control-row:hover .quick-control-icon-box {
    background: rgba(37, 99, 235, 0.12);
    transform: scale(1.05);
  }
  :global([data-theme="dark"]) .quick-control-row:hover .quick-control-icon-box {
    background: rgba(59, 130, 246, 0.15);
  }

  .quick-control-text {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 0;
    flex: 1;
  }
  .quick-control-text h3 {
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.2;
    transition: color 200ms ease;
  }
  .quick-control-row:hover .quick-control-text h3 {
    color: var(--primary-color);
  }
  :global([data-theme="dark"]) .quick-control-row:hover .quick-control-text h3 {
    color: #60a5fa;
  }
  .quick-control-text p {
    font-size: 0.74rem;
    color: var(--text-muted);
    margin: 0;
    line-height: 1.25;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .quick-control-arrow {
    color: var(--text-muted);
    transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .quick-control-row:hover .quick-control-arrow {
    color: var(--primary-color);
    transform: translateX(3px);
  }
  :global([data-theme="dark"]) .quick-control-row:hover .quick-control-arrow {
    color: #60a5fa;
  }
`;

function EditProfileForm({ user, onUpdate }: { user: any; onUpdate: (user: any) => void }) {
  const [name, setName] = React.useState(String(user?.Name || ''));
  const [mobile, setMobile] = React.useState(String(user?.Mobile || '').replace(/\D/g, '').slice(-10));
  const [email, setEmail] = React.useState(String(user?.Username || ''));
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [otp, setOtp] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const { notify } = useNotification();
  
  // Validation errors state
  const [errors, setErrors] = React.useState<{ name?: string; mobile?: string; email?: string; otp?: string }>({});

  const handleMobileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = event.target.value.replace(/\D/g, '').slice(0, 10);
    setMobile(digitsOnly);
    if (errors.mobile) setErrors(prev => ({ ...prev, mobile: undefined }));
  };

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
          notify.success('OTP Sent', res.message || 'Please check your new email.');
        } else {
          notify.error('OTP Failed', res.message || 'Failed to send OTP.');
        }
      } catch (err) {
        console.error(err);
        notify.error('Error', 'An unexpected error occurred while requesting OTP.');
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
        notify.success('OTP Resent', res.message || 'OTP resent successfully.');
        setOtp('');
      } else {
        notify.error('OTP Failed', res.message || 'Failed to resend OTP.');
      }
    } catch (err) {
      console.error(err);
      notify.error('Error', 'An unexpected error occurred while resending OTP.');
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
        notify.success('Profile Updated', 'Profile updated successfully!');
      } else {
        if (verificationOtp) {
          setErrors(prev => ({ ...prev, otp: res.message || 'Invalid or expired OTP.' }));
        } else {
          notify.error('Update Failed', res.message || 'Failed to save profile changes.');
        }
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      notify.error('Error', 'An unexpected error occurred while saving profile changes.');
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
              onChange={handleMobileChange}
              className={`form-input ${errors.mobile ? 'error-state' : ''}`} 
              placeholder="e.g. 9876543210"
              inputMode="numeric"
              pattern="[0-9]{10}"
              minLength={10}
              maxLength={10}
              autoComplete="tel"
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
