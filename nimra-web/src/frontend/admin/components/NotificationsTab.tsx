import React, { useState } from 'react';
import { Notification, NotificationCategory } from '@/types/cms';
import CustomSelect from './CustomSelect';
import LoadingButton from '@/frontend/shared/LoadingButton';
import ProductModalShell from './ProductModalShell';

interface NotificationsTabProps {
  filteredNotifications: Notification[];
  handleSendNotif: (title: string, message: string, extra?: Partial<Notification>) => Promise<boolean>;
  handleNotifDelete: (id: string | number) => Promise<boolean>;
  saveLoading: boolean;
}

const categories: NotificationCategory[] = ['Offers/Promotions', 'News', 'Updates'];

export default function NotificationsTab({
  filteredNotifications,
  handleSendNotif,
  handleNotifDelete,
  saveLoading,
}: NotificationsTabProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<NotificationCategory>('Offers/Promotions');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const broadcasts = filteredNotifications.filter((notification) => {
    if (notification.TargetAudience !== 'CUSTOMER_NOTIFICATION' || notification.EventType !== 'ADMIN_BROADCAST') return false;
    if (!categories.includes(notification.Category as NotificationCategory)) return false;
    const query = search.trim().toLowerCase();
    if (query && !`${notification.Title} ${notification.Message}`.toLowerCase().includes(query)) return false;
    if (categoryFilter !== 'All' && notification.Category !== categoryFilter) return false;
    if (priorityFilter !== 'All' && (notification.Priority || 'Low') !== priorityFilter) return false;
    return true;
  });

  const closeModal = () => {
    if (!isSubmitting && !saveLoading) setIsModalOpen(false);
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    const cleanMessage = message.trim();
    if (!cleanTitle || !cleanMessage || !category || isSubmitting || saveLoading) return;
    setIsSubmitting(true);
    try {
      const success = await handleSendNotif(cleanTitle, cleanMessage, {
        Category: category,
        Priority: priority,
        Role: 'Customer',
        TargetAudience: 'CUSTOMER_NOTIFICATION',
        EventType: 'ADMIN_BROADCAST',
        ActionLink: '',
      });
      if (success) {
        setTitle('');
        setMessage('');
        setCategory('Offers/Promotions');
        setPriority('Medium');
        setIsModalOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldStyle: React.CSSProperties = {
    width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)',
  };

  return (
    <div className="notifications-tab card glass" style={{ padding: '2rem' }}>
      <div className="notif-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
        <form className="notification-compose-card broadcast-desktop-compose" onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '1.5rem', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', height: 'fit-content' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Customer Broadcast</h3>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Title</label>
            <input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Summer Offer, Product News" style={fieldStyle} disabled={isSubmitting || saveLoading} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Message</label>
            <textarea required rows={4} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Message for customers" style={fieldStyle} disabled={isSubmitting || saveLoading} />
          </div>
          <div className="notification-compose-options" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Category</label>
              <CustomSelect value={category} onChange={(value) => setCategory(value as NotificationCategory)} portalMenu options={categories.map((item) => ({ value: item, label: item }))} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Priority</label>
              <CustomSelect value={priority} onChange={(value) => setPriority(value as typeof priority)} portalMenu options={[{ value: 'High', label: 'High' }, { value: 'Medium', label: 'Medium' }, { value: 'Low', label: 'Low' }]} />
            </div>
          </div>
          <LoadingButton type="submit" className="btn btn-primary btn-full" isLoading={isSubmitting || saveLoading} loadingText="Sending..." disabled={!title.trim() || !message.trim() || !category}>
            Send to Customers
          </LoadingButton>
        </form>

        <div className="notification-history-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        <div className="section-head-btn">
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Customer Broadcast History</h3>
          <button type="button" className="btn btn-primary btn-add broadcast-mobile-add" onClick={() => setIsModalOpen(true)}>
            ＋ Add New Broadcast
          </button>
        </div>
        <div className="notification-history-filters" style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.5rem' }}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search broadcasts" style={fieldStyle} />
          <CustomSelect
            value={categoryFilter}
            onChange={setCategoryFilter}
            portalMenu
            options={[
              { value: 'All', label: 'All categories' },
              ...categories.map((item) => ({ value: item, label: item })),
            ]}
          />
          <CustomSelect
            value={priorityFilter}
            onChange={setPriorityFilter}
            portalMenu
            options={[
              { value: 'All', label: 'All priorities' },
              { value: 'High', label: 'High' },
              { value: 'Medium', label: 'Medium' },
              { value: 'Low', label: 'Low' },
            ]}
          />
        </div>
        <div className="notification-history-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '650px', overflowY: 'auto' }}>
          {broadcasts.map((notification) => {
            return (
              <div className="notification-broadcast-card" key={String(notification.ID)} style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div className="notification-broadcast-head" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  <div>
                    <div className="notification-broadcast-tags" style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'var(--border-color)' }}>{notification.Category}</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-primary)' }}>{notification.Priority || 'Low'}</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-primary)' }}>Customers</span>
                    </div>
                    <strong>{notification.Title}</strong>
                  </div>
                  <button type="button" aria-label="Delete broadcast" onClick={() => void handleNotifDelete(notification.ID)} style={{ background: 'none', border: 0, color: 'var(--text-muted)', cursor: 'pointer' }}>X</button>
                </div>
                <span style={{ display: 'block', marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(notification.Timestamp || notification.CreatedAt || '').toLocaleString()}</span>
                <p style={{ margin: '0.6rem 0 0', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{notification.Message}</p>
              </div>
            );
          })}
          {!broadcasts.length && <p className="empty" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>No customer broadcasts found.</p>}
        </div>
      </div>
      </div>

      {isModalOpen && (
        <ProductModalShell title="Add New Broadcast" titleId="broadcast-modal-title" onClose={closeModal}>
            <form onSubmit={onSubmit} className="product-modal-form">
              <div className="modal-body product-modal-scroll">
                <div className="form-group">
                  <label>Title</label>
                  <input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Summer Offer, Product News" disabled={isSubmitting || saveLoading} />
                </div>
                <div className="form-group">
                  <label>Message</label>
                  <textarea required rows={5} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Message for customers" disabled={isSubmitting || saveLoading} />
                </div>
                <div className="form-row form-row-relative">
                  <div className="form-group">
                    <label>Category</label>
                    <CustomSelect
                      value={category}
                      onChange={(value) => setCategory(value as NotificationCategory)}
                      portalMenu
                      options={categories.map((item) => ({ value: item, label: item }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Priority</label>
                    <CustomSelect
                      value={priority}
                      onChange={(value) => setPriority(value as typeof priority)}
                      portalMenu
                      options={[
                        { value: 'High', label: 'High' },
                        { value: 'Medium', label: 'Medium' },
                        { value: 'Low', label: 'Low' },
                      ]}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={isSubmitting || saveLoading}>Cancel</button>
                <LoadingButton type="submit" className="btn btn-primary" isLoading={isSubmitting || saveLoading} loadingText="Sending..." disabled={!title.trim() || !message.trim() || !category}>
                  Send to Customers
                </LoadingButton>
              </div>
            </form>
        </ProductModalShell>
      )}
      <style jsx>{`
        .broadcast-mobile-add { display: none; }
        @media (max-width: 768px) {
          .broadcast-desktop-compose { display: none !important; }
          .broadcast-mobile-add { display: inline-flex; }
        }
      `}</style>
    </div>
  );
}
