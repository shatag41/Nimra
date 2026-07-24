'use client';

import { useEffect, useState } from 'react';
import { AdminUser, Inquiry, Notification, OrderRecord, Product } from '@/types/cms';
import { normalizeRole } from '../utils/accessControl';

type Props = {
  orders: OrderRecord[];
  users: AdminUser[];
  products: Product[];
  inquiries: Inquiry[];
  notifications: Notification[];
  onNavigate: (tab: string) => void;
};

export default function SuperAdminDashboard({ orders, users, products, inquiries, notifications, onNavigate }: Props) {
  const adminUpdates = notifications.filter((event) => event.TargetAudience === 'ADMIN_UPDATE');
  const [liveUpdateIndex, setLiveUpdateIndex] = useState(0);
  const [pauseLiveUpdates, setPauseLiveUpdates] = useState(false);
  const currentLiveUpdate = adminUpdates.length ? adminUpdates[liveUpdateIndex % adminUpdates.length] : null;

  useEffect(() => {
    if (adminUpdates.length <= 1 || pauseLiveUpdates) return;
    const interval = window.setInterval(() => setLiveUpdateIndex((index) => (index + 1) % adminUpdates.length), 3000);
    return () => window.clearInterval(interval);
  }, [adminUpdates.length, pauseLiveUpdates]);

  const openLiveUpdate = () => {
    const actionLink = currentLiveUpdate?.ActionLink;
    if (!actionLink) return;
    const tab = actionLink.split(':')[0];
    if (['dashboard', 'orders', 'products', 'banners', 'faqs', 'inquiries', 'users', 'settings'].includes(tab)) onNavigate(tab);
  };

  const customers = users.filter((user) => normalizeRole(user.Role) === 'CUSTOMER');
  const admins = users.filter((user) => ['ADMIN', 'SUPER_ADMIN'].includes(normalizeRole(user.Role)));
  const activeAdmins = admins.filter((admin) => String(admin.Active).toLowerCase() !== 'false');
  const activeProducts = products.filter((product) => String(product.Active).toLowerCase() !== 'false');
  const today = new Date().toDateString();
  const todaysOrders = orders.filter((order) => new Date(order.createdAt).toDateString() === today);
  const revenue = (list: OrderRecord[]) => list
    .filter((order) => order.status !== 'Cancelled')
    .reduce((sum, order) => sum + Number(order.total || 0), 0);
  const money = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;
  const pending = orders.filter((order) => order.status === 'Pending').length;
  const completed = orders.filter((order) => order.status === 'Delivered').length;
  const cancelled = orders.filter((order) => order.status === 'Cancelled').length;
  const pendingInquiries = inquiries.filter((inquiry) => inquiry.Status !== 'Reviewed').length;
  const cards = [
    ['Total Revenue', money(revenue(orders)), `${orders.filter((order) => order.status !== 'Cancelled').length} revenue orders`, '₹', 'revenue'],
    ["Today's Revenue", money(revenue(todaysOrders)), `${todaysOrders.length} orders today`, '↗', 'revenue'],
    ['Total Orders', orders.length, `${orders.length} backend records`, '▣', 'orders'],
    ['Pending Orders', pending, `${pending} awaiting action`, '◷', 'inquiries'],
    ['Completed Orders', completed, `${orders.length ? Math.round(completed / orders.length * 100) : 0}% completion rate`, '✓', 'revenue'],
    ['Cancelled Orders', cancelled, `${orders.length ? Math.round(cancelled / orders.length * 100) : 0}% cancellation rate`, '×', 'danger'],
    ['Total Customers', customers.length, `${customers.filter((user) => String(user.Active).toLowerCase() !== 'false').length} active accounts`, '◉', 'customers'],
    ['Total Admins', admins.length, `${activeAdmins.length} active accounts`, '◆', 'customers'],
    ['Products', products.length, `${activeProducts.length} active products`, '◇', 'products'],
    ['Pending Inquiries', pendingInquiries, `${inquiries.length} total inquiries`, '?', 'inquiries'],
  ];
  const actions = [
    ['＋', 'Add Product', 'Create a catalogue item', 'products'],
    ['▣', 'Manage Orders', 'Review fulfilment', 'orders'],
    ['◉', 'Manage Users', 'Customer accounts', 'users'],
    ['◆', 'Manage Admins', 'Team and access', 'admins'],
    ['?', 'View Inquiries', 'Resolve requests', 'inquiries'],
    ['⚙', 'System Settings', 'Platform controls', 'settings'],
    ['♢', 'Notifications', 'Message centre', 'notifications'],
  ];
  const productCounts = new Map<string, number>();
  orders.forEach((order) => order.items?.forEach((item) => {
    productCounts.set(item.name, (productCounts.get(item.name) || 0) + Number(item.quantity || 0));
  }));
  const topProducts = [...productCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const recentCustomers = [...customers]
    .sort((a, b) => new Date(b.CreatedAt || 0).getTime() - new Date(a.CreatedAt || 0).getTime())
    .slice(0, 4);
  const last7 = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return orders.filter((order) => new Date(order.createdAt).toDateString() === date.toDateString());
  });
  const maxDailyOrders = Math.max(...last7.map((day) => day.length), 1);
  return <div className="enterprise-section command-center">
    <SuperAdminLiveEvent event={currentLiveUpdate} onOpen={openLiveUpdate} onPause={setPauseLiveUpdates}/>
    <section><Heading kicker="Live performance" title="Business at a glance" note="Synced with your operational data"/><div className="enterprise-kpi-grid">{cards.map(([title, value, note, icon, tone]) => <article className={`kpi-card glass tone-${tone}`} key={title}><div className="kpi-icon">{icon}</div><div className="kpi-copy"><span>{title}</span><strong>{value}</strong><small>{note}</small></div></article>)}</div></section>
    <section><Heading kicker="Workflows" title="Enterprise Quick Actions"/><div className="quick-action-grid">{actions.map(([icon, title, subtitle, tab]) => <button className="quick-action glass" key={title} onClick={() => onNavigate(tab)}><span className="quick-icon">{icon}</span><span><strong>{title}</strong><small>{subtitle}</small></span><b>→</b></button>)}</div></section>
    <section><Heading kicker="Intelligence" title="Business Insights"/><div className="insights-grid">
      <article className="insight-card glass insight-feature"><CardTitle title="Today's Order Trend" label={`${todaysOrders.length} today`}/><strong className="insight-value">{todaysOrders.length}</strong><p>orders today · {money(revenue(todaysOrders))} in revenue</p><div className="mini-bars">{last7.map((day, index) => <i key={index} style={{ height: `${Math.max(12, day.length / maxDailyOrders * 100)}%` }}/>)}</div></article>
      <article className="insight-card glass"><CardTitle title="Most Sold Products" label={`${topProducts.reduce((sum, [, count]) => sum + count, 0)} units`}/><div className="rank-list">{topProducts.length ? topProducts.map(([name, count], index) => <div className="rank-row" key={name}><span><b>{index + 1}</b>{name}</span><strong>{count}</strong></div>) : <p>No product sales yet.</p>}</div></article>
      <article className="insight-card glass"><CardTitle title="Latest Registrations" label={`${customers.length} customers`}/><div className="people-list">{recentCustomers.length ? recentCustomers.map((user) => <div key={user.ID}><span className="mini-avatar">{user.Name?.[0] || 'C'}</span><span><strong>{user.Name}</strong><small>{user.CreatedAt ? new Date(user.CreatedAt).toLocaleDateString('en-IN') : 'Date unavailable'}</small></span></div>) : <p>No registrations yet.</p>}</div></article>
      <article className="insight-card glass"><CardTitle title="Operations Pulse" label={`${notifications.length} events`}/><div className="pulse-stat"><span>Cancelled orders</span><strong>{cancelled}</strong></div><div className="pulse-stat"><span>Unresolved inquiries</span><strong>{pendingInquiries}</strong></div><div className="pulse-stat"><span>Recent activity</span><strong>{notifications.length}</strong></div></article>
    </div></section>
  </div>;
}

function SuperAdminLiveEvent({ event, onOpen, onPause }: { event: Notification | null; onOpen: () => void; onPause: (paused: boolean) => void }) {
  const type = event?.EventType || 'Update';
  const typeLower = type.toLowerCase();
  const tone = typeLower.includes('order') ? ['rgba(37,99,235,.15)', '#2563eb'] : typeLower.includes('cancel') ? ['rgba(239,68,68,.15)', '#ef4444'] : typeLower.includes('user') ? ['rgba(16,185,129,.15)', '#10b981'] : ['rgba(100,116,139,.15)', '#64748b'];
  const timeAgo = (timestamp?: string) => {
    if (!timestamp) return '';
    const minutes = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  };

  return <div className="super-live-event" onClick={onOpen} onMouseEnter={() => onPause(true)} onMouseLeave={() => onPause(false)} role={event?.ActionLink ? 'button' : undefined} tabIndex={event?.ActionLink ? 0 : undefined} onKeyDown={(e) => { if (event?.ActionLink && (e.key === 'Enter' || e.key === ' ')) onOpen(); }}>
    <i className="super-live-pulse" aria-hidden="true"/>
    {event ? <><span className="super-live-type" style={{ background: tone[0], color: tone[1] }}>{type}</span><span className="super-live-message"><b>{event.Title}:</b> {event.Message}</span><span className="super-live-time">{timeAgo(event.Timestamp)}</span><span className="super-live-open">Open <b>›</b></span></> : <span className="super-live-message">No recent live updates at this time.</span>}
    <style jsx>{`
      .super-live-event{display:flex;align-items:center;gap:.55rem;width:100%;min-height:44px;padding:.5rem .75rem;border:1px solid rgba(59,130,246,.35);border-radius:11px;background:var(--bg-primary);box-shadow:var(--shadow-sm);cursor:${event?.ActionLink ? 'pointer' : 'default'};box-sizing:border-box}
      .super-live-pulse{width:8px;height:8px;flex:0 0 auto;border-radius:50%;background:#3b82f6;box-shadow:0 0 0 2px rgba(59,130,246,.14)}
      .super-live-type{flex:0 0 auto;padding:.28rem .5rem;border-radius:5px;font-size:.65rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase}
      .super-live-message{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-primary);font-size:.8rem}
      .super-live-message b{margin-right:.3rem}.super-live-time{flex:0 0 auto;color:var(--text-muted);font-size:.68rem;font-weight:600}.super-live-open{display:flex;align-items:center;gap:.2rem;flex:0 0 auto;color:var(--primary-color);font-size:.72rem;font-weight:700}.super-live-open b{font-size:1.05rem;line-height:1}
      @media(max-width:700px){.super-live-event{gap:.4rem;padding:.45rem .6rem}.super-live-message{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}.super-live-time{display:none}}
    `}</style>
  </div>;
}

function Heading({ kicker, title, note }: { kicker: string; title: string; note?: string }) {
  return <div className="section-heading"><div><span className="section-kicker">{kicker}</span><h3>{title}</h3></div>{note && <span>{note}</span>}</div>;
}

function CardTitle({ title, label }: { title: string; label: string }) {
  return <div className="card-title"><h4>{title}</h4><span>{label}</span></div>;
}
