'use client';

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
  const adminActivity = (admin: AdminUser) => Number(admin.OrdersManaged || 0) + Number(admin.InquiriesResolved || 0);
  const rankedAdmins = [...admins].sort((a, b) => adminActivity(b) - adminActivity(a)).slice(0, 5);
  const highestAdminActivity = Math.max(...rankedAdmins.map(adminActivity), 1);

  return <div className="enterprise-section command-center">
    <section><Heading kicker="Live performance" title="Business at a glance" note="Synced with your operational data"/><div className="enterprise-kpi-grid">{cards.map(([title, value, note, icon, tone]) => <article className={`kpi-card glass tone-${tone}`} key={title}><div className="kpi-icon">{icon}</div><div className="kpi-copy"><span>{title}</span><strong>{value}</strong><small>{note}</small></div></article>)}</div></section>
    <section><Heading kicker="Workflows" title="Enterprise Quick Actions"/><div className="quick-action-grid">{actions.map(([icon, title, subtitle, tab]) => <button className="quick-action glass" key={title} onClick={() => onNavigate(tab)}><span className="quick-icon">{icon}</span><span><strong>{title}</strong><small>{subtitle}</small></span><b>→</b></button>)}</div></section>
    <section><Heading kicker="Intelligence" title="Business Insights"/><div className="insights-grid">
      <article className="insight-card glass insight-feature"><CardTitle title="Today's Order Trend" label={`${todaysOrders.length} today`}/><strong className="insight-value">{todaysOrders.length}</strong><p>orders today · {money(revenue(todaysOrders))} in revenue</p><div className="mini-bars">{last7.map((day, index) => <i key={index} style={{ height: `${Math.max(12, day.length / maxDailyOrders * 100)}%` }}/>)}</div></article>
      <article className="insight-card glass"><CardTitle title="Most Sold Products" label={`${topProducts.reduce((sum, [, count]) => sum + count, 0)} units`}/><div className="rank-list">{topProducts.length ? topProducts.map(([name, count], index) => <div className="rank-row" key={name}><span><b>{index + 1}</b>{name}</span><strong>{count}</strong></div>) : <p>No product sales yet.</p>}</div></article>
      <article className="insight-card glass"><CardTitle title="Latest Registrations" label={`${customers.length} customers`}/><div className="people-list">{recentCustomers.length ? recentCustomers.map((user) => <div key={user.ID}><span className="mini-avatar">{user.Name?.[0] || 'C'}</span><span><strong>{user.Name}</strong><small>{user.CreatedAt ? new Date(user.CreatedAt).toLocaleDateString('en-IN') : 'Date unavailable'}</small></span></div>) : <p>No registrations yet.</p>}</div></article>
      <article className="insight-card glass"><CardTitle title="Operations Pulse" label={`${notifications.length} events`}/><div className="pulse-stat"><span>Cancelled orders</span><strong>{cancelled}</strong></div><div className="pulse-stat"><span>Unresolved inquiries</span><strong>{pendingInquiries}</strong></div><div className="pulse-stat"><span>Recent activity</span><strong>{notifications.length}</strong></div></article>
    </div></section>
    <section><Heading kicker="Team" title="Top Performing Admins"/><div className="admin-card-grid">{rankedAdmins.map((admin) => {
      const activity = adminActivity(admin);
      const active = String(admin.Active).toLowerCase() !== 'false';
      return <article className="admin-performance-card glass" key={admin.ID}><div className="admin-card-head"><span className="admin-avatar">{admin.Name?.[0] || 'A'}</span><div><h4>{admin.Name}</h4><span className="role-chip">{normalizeRole(admin.Role).replace('_', ' ')}</span></div><span className={`online-chip ${active ? '' : 'inactive'}`}><i/>{active ? 'Active' : 'Inactive'}</span></div><div className="admin-metrics"><div><span>Orders</span><strong>{Number(admin.OrdersManaged) || 0}</strong></div><div><span>Resolved</span><strong>{Number(admin.InquiriesResolved) || 0}</strong></div><div><span>Activity</span><strong>{activity}</strong></div></div><div className="score-track"><i style={{ width: `${activity / highestAdminActivity * 100}%` }}/></div><small>Last login · {admin.LastLogin ? new Date(admin.LastLogin).toLocaleString('en-IN') : 'Never'}</small></article>;
    })}{!rankedAdmins.length && <div className="empty-state glass">No admin activity yet.</div>}</div></section>
  </div>;
}

function Heading({ kicker, title, note }: { kicker: string; title: string; note?: string }) {
  return <div className="section-heading"><div><span className="section-kicker">{kicker}</span><h3>{title}</h3></div>{note && <span>{note}</span>}</div>;
}

function CardTitle({ title, label }: { title: string; label: string }) {
  return <div className="card-title"><h4>{title}</h4><span>{label}</span></div>;
}
