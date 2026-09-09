'use client';

import React, { useState } from 'react';
import { AdminUser, CancellationRequest, Inquiry, Notification, OrderRecord, Product } from '@/types/cms';
import { normalizeRole } from '../utils/accessControl';
import LiveEventsBar from './LiveEventsBar';

type Props = {
  orders: OrderRecord[];
  users: AdminUser[];
  products: Product[];
  inquiries: Inquiry[];
  cancellationRequests: CancellationRequest[];
  notifications: Notification[];
  onNavigate: (tab: string) => void;
  onOpenCancellationRequests: () => void;
};

export default function SuperAdminDashboard({ orders, users, products, inquiries, cancellationRequests, notifications, onNavigate, onOpenCancellationRequests }: Props) {
  const [timeFilter, setTimeFilter] = useState<'overall' | 'today' | 'week' | 'month' | 'custom'>('overall');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const formatDateForInput = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const parseLocalDate = (dateStr: string, isEndOfDay = false): Date | null => {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const parts = dateStr.trim().split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    const [year, month, day] = parts;
    if (isEndOfDay) {
      return new Date(year, month - 1, day, 23, 59, 59, 999);
    }
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  };

  // Time-filtering calculation setup
  const now = new Date();
  let filterStartDate = new Date();
  let filterEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const dates = [
    ...orders.map(o => new Date(o.createdAt || o.updatedAt || now).getTime()),
    ...users.filter(u => typeof u.ID === 'number' && u.ID > 1000000000000).map(u => new Date(u.ID).getTime()),
  ].filter(t => !isNaN(t));
  const minDate = dates.length > 0 ? Math.min(...dates) : now.getTime() - 30 * 24 * 60 * 60 * 1000;

  if (timeFilter === 'overall') {
    filterStartDate = new Date(minDate);
    if (now.getTime() - filterStartDate.getTime() < 24 * 60 * 60 * 1000) {
      filterStartDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    filterEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (timeFilter === 'today') {
    filterStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    filterEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (timeFilter === 'week') {
    filterStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    filterEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (timeFilter === 'month') {
    filterStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    filterEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (timeFilter === 'custom') {
    const parsedStart = parseLocalDate(customStartDate, false);
    const parsedEnd = parseLocalDate(customEndDate, true);

    filterStartDate = parsedStart || new Date(minDate);
    filterEndDate = parsedEnd || new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (filterStartDate.getTime() > filterEndDate.getTime()) {
      filterStartDate = new Date(filterEndDate.getTime() - 24 * 60 * 60 * 1000);
    }
  }

  // Filtered dataset within the selected date window
  const filteredOrders = orders.filter((order) => {
    const d = new Date(order.createdAt || order.updatedAt || now);
    return d >= filterStartDate && d <= filterEndDate;
  });

  const filteredInquiries = inquiries.filter((inquiry) => {
    const d = new Date(inquiry.Timestamp || now);
    return d >= filterStartDate && d <= filterEndDate;
  });

  const filteredNotifications = notifications.filter((notif) => {
    const d = new Date(notif.Timestamp || now);
    return d >= filterStartDate && d <= filterEndDate;
  });

  const customers = users.filter((user) =>
    normalizeRole(user.Role) === 'CUSTOMER'
    && String(user.Active).toLowerCase() !== 'false'
  );
  const admins = users.filter((user) => ['ADMIN', 'SUPER_ADMIN'].includes(normalizeRole(user.Role)));
  const activeAdmins = admins.filter((admin) => String(admin.Active).toLowerCase() !== 'false');
  const activeProducts = products.filter((product) => String(product.Active).toLowerCase() !== 'false');

  const todayStr = new Date().toDateString();
  const todaysOrders = orders.filter((order) => new Date(order.createdAt || order.updatedAt || now).toDateString() === todayStr);

  const normalizeStatus = (status: unknown) => String(status || '').trim().toLowerCase();
  const revenue = (list: OrderRecord[]) => list
    .filter((order) => normalizeStatus(order.status) === 'delivered')
    .reduce((sum, order) => sum + Number(order.total || 0), 0);
  const money = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  const pending = filteredOrders.filter((order) =>
    normalizeStatus(order.status) === 'pending'
    && !['approved', 'cancelled'].includes(normalizeStatus(order.cancellationStatus))
  ).length;
  const completed = filteredOrders.filter((order) => normalizeStatus(order.status) === 'delivered').length;
  const cancelled = filteredOrders.filter((order) => normalizeStatus(order.status) === 'cancelled').length;
  const pendingInquiries = filteredInquiries.filter((inquiry) => inquiry.Status !== 'Reviewed').length;

  const cards = [
    ['Total Revenue', money(revenue(filteredOrders)), `${completed} completed revenue orders`, '₹', 'revenue'],
    ["Today's Revenue", money(revenue(todaysOrders)), `${todaysOrders.length} orders today`, '↗', 'revenue'],
    ['Total Orders', filteredOrders.length, `${filteredOrders.length} backend records`, '▣', 'orders'],
    ['Pending Orders', pending, `${pending} awaiting action`, '◷', 'inquiries'],
    ['Completed Orders', completed, `${filteredOrders.length ? Math.round(completed / filteredOrders.length * 100) : 0}% completion rate`, '✓', 'revenue'],
    ['Cancelled Orders', cancelled, `${filteredOrders.length ? Math.round(cancelled / filteredOrders.length * 100) : 0}% cancellation rate`, '×', 'danger'],
    ['Total Customers', customers.length, `${customers.length} active accounts`, '◉', 'customers'],
    ['Total Admins', admins.length, `${activeAdmins.length} active accounts`, '◆', 'customers'],
    ['Products', products.length, `${activeProducts.length} active products`, '◇', 'products'],
    ['Pending Inquiries', pendingInquiries, `${filteredInquiries.length} inquiries in window`, '?', 'inquiries'],
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
  filteredOrders.forEach((order) => order.items?.forEach((item) => {
    productCounts.set(item.name, (productCounts.get(item.name) || 0) + Number(item.quantity || 0));
  }));
  const topProducts = [...productCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);

  const customersInWindow = customers.filter((user) => {
    let userDate: Date | null = null;
    if (user.CreatedAt) {
      userDate = new Date(user.CreatedAt);
    } else if (typeof user.ID === 'number' && user.ID > 1000000000000) {
      userDate = new Date(user.ID);
    }
    if (userDate && !isNaN(userDate.getTime())) {
      return userDate >= filterStartDate && userDate <= filterEndDate;
    }
    return timeFilter === 'overall';
  });

  const recentCustomers = [...(timeFilter === 'overall' || !customersInWindow.length ? customers : customersInWindow)]
    .sort((a, b) => new Date(b.CreatedAt || 0).getTime() - new Date(a.CreatedAt || 0).getTime())
    .slice(0, 4);

  // Dynamic order trend bars (7 intervals)
  const timeSpan = Math.max(filterEndDate.getTime() - filterStartDate.getTime(), 1000 * 60 * 60);
  const intervalsCount = 7;
  const intervalMs = timeSpan / intervalsCount;

  const trendBars = Array.from({ length: intervalsCount }, (_, index) => {
    const pStart = new Date(filterStartDate.getTime() + index * intervalMs);
    const pEnd = new Date(filterStartDate.getTime() + (index + 1) * intervalMs);
    return filteredOrders.filter((order) => {
      const d = new Date(order.createdAt || order.updatedAt || now);
      return d >= pStart && d < pEnd;
    });
  });
  const maxDailyOrders = Math.max(...trendBars.map((day) => day.length), 1);

  return (
    <div className="enterprise-section command-center">
      <LiveEventsBar
        notifications={notifications}
        orders={orders}
        inquiries={inquiries}
        cancellationRequests={cancellationRequests}
        onNavigate={onNavigate}
        onOpenCancellationRequests={onOpenCancellationRequests}
      />
      <section>
        <div className="customer-activity-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.25rem', width: '100%' }}>
          <div className="customer-activity-heading-copy">
            <span className="section-kicker">Live performance</span>
            <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>Business at a glance</h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Synced with your operational data</span>
          </div>

          {/* Date Filter & Range Picker */}
          <div className="customer-activity-filter-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', maxWidth: '100%' }}>
            <div className="customer-activity-filter" style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
              {([
                { id: 'overall', label: 'Overall' },
                { id: 'today', label: 'Today' },
                { id: 'week', label: 'Week' },
                { id: 'month', label: 'Month' },
                { id: 'custom', label: 'Custom Range' },
              ] as const).map(filter => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => {
                    setTimeFilter(filter.id);
                    if (filter.id === 'custom' && (!customStartDate || !customEndDate)) {
                      if (!customStartDate) setCustomStartDate(formatDateForInput(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)));
                      if (!customEndDate) setCustomEndDate(formatDateForInput(now));
                    }
                  }}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    background: timeFilter === filter.id ? 'var(--primary-color)' : 'transparent',
                    color: timeFilter === filter.id ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {timeFilter === 'custom' && (
              <div 
                className="custom-date-range-picker"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  background: 'var(--bg-secondary)',
                  padding: '0.45rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  flexWrap: 'wrap',
                  width: '100%',
                  justifyContent: 'flex-end'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    From:
                  </label>
                  <div className="date-input-wrap" style={{ width: 'auto' }}>
                    <input
                      type="date"
                      value={customStartDate}
                      max={customEndDate || formatDateForInput(now)}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="form-input filter-input"
                      style={{
                        fontSize: '0.78rem',
                        height: '30px',
                        padding: '0 0.45rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    To:
                  </label>
                  <div className="date-input-wrap" style={{ width: 'auto' }}>
                    <input
                      type="date"
                      value={customEndDate}
                      min={customStartDate}
                      max={formatDateForInput(now)}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="form-input filter-input"
                      style={{
                        fontSize: '0.78rem',
                        height: '30px',
                        padding: '0 0.45rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>
                </div>

                {(customStartDate || customEndDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomStartDate(formatDateForInput(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)));
                      setCustomEndDate(formatDateForInput(now));
                    }}
                    title="Reset to past 7 days"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '0.2rem 0.4rem',
                      borderRadius: '4px',
                      transition: 'color 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary-color)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    Reset
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="enterprise-kpi-grid">
          {cards.map(([title, value, note, icon, tone]) => (
            <article className={`kpi-card glass tone-${tone}`} key={title}>
              <div className="kpi-icon">{icon}</div>
              <div className="kpi-copy">
                <span>{title}</span>
                <strong>{value}</strong>
                <small>{note}</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <Heading kicker="Workflows" title="Enterprise Quick Actions" />
        <div className="quick-action-grid">
          {actions.map(([icon, title, subtitle, tab]) => (
            <button className="quick-action glass" key={title} onClick={() => onNavigate(tab)}>
              <span className="quick-icon">{icon}</span>
              <span>
                <strong>{title}</strong>
                <small>{subtitle}</small>
              </span>
              <b>→</b>
            </button>
          ))}
        </div>
      </section>

      <section>
        <Heading kicker="Intelligence" title="Business Insights" />
        <div className="insights-grid">
          <article className="insight-card glass insight-feature">
            <CardTitle title={timeFilter === 'today' ? "Today's Order Trend" : "Order Trend"} label={`${filteredOrders.length} orders`} />
            <strong className="insight-value">{filteredOrders.length}</strong>
            <p>{filteredOrders.length} orders in window · {money(revenue(filteredOrders))} in revenue</p>
            <div className="mini-bars">
              {trendBars.map((intervalOrders, index) => (
                <i key={index} title={`${intervalOrders.length} orders`} style={{ height: `${Math.max(12, (intervalOrders.length / maxDailyOrders) * 100)}%` }} />
              ))}
            </div>
          </article>

          <article className="insight-card glass">
            <CardTitle title="Most Sold Products" label={`${topProducts.reduce((sum, [, count]) => sum + count, 0)} units`} />
            <div className="rank-list">
              {topProducts.length ? (
                topProducts.map(([name, count], index) => (
                  <div className="rank-row" key={name}>
                    <span>
                      <b>{index + 1}</b>
                      {name}
                    </span>
                    <strong>{count}</strong>
                  </div>
                ))
              ) : (
                <p>No product sales in this period.</p>
              )}
            </div>
          </article>

          <article className="insight-card glass">
            <CardTitle title="Latest Registrations" label={`${customers.length} customers`} />
            <div className="people-list">
              {recentCustomers.length ? (
                recentCustomers.map((user) => (
                  <div key={user.ID}>
                    <span className="mini-avatar">{user.Name?.[0] || 'C'}</span>
                    <span>
                      <strong>{user.Name}</strong>
                      <small>{user.CreatedAt ? new Date(user.CreatedAt).toLocaleDateString('en-IN') : 'Date unavailable'}</small>
                    </span>
                  </div>
                ))
              ) : (
                <p>No registrations in this period.</p>
              )}
            </div>
          </article>

          <article className="insight-card glass">
            <CardTitle title="Operations Pulse" label={`${filteredNotifications.length} events`} />
            <div className="pulse-stat">
              <span>Cancelled orders</span>
              <strong>{cancelled}</strong>
            </div>
            <div className="pulse-stat">
              <span>Unresolved inquiries</span>
              <strong>{pendingInquiries}</strong>
            </div>
            <div className="pulse-stat">
              <span>Recent activity</span>
              <strong>{filteredNotifications.length}</strong>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

function Heading({ kicker, title, note }: { kicker: string; title: string; note?: string }) {
  return (
    <div className="section-heading">
      <div>
        <span className="section-kicker">{kicker}</span>
        <h3>{title}</h3>
      </div>
      {note && <span>{note}</span>}
    </div>
  );
}

function CardTitle({ title, label }: { title: string; label: string }) {
  return (
    <div className="card-title">
      <h4>{title}</h4>
      <span>{label}</span>
    </div>
  );
}
