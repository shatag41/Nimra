'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AdminUser, Inquiry, Notification, OrderRecord, Product } from '@/types/cms';
import LogoutConfirmationModal from '@/frontend/customer/components/LogoutConfirmationModal';
import { normalizeRole } from '../utils/accessControl';
import CustomSelect from './CustomSelect';

const formatAdminDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

export function SuperAdminOverview({ orders, users, products, inquiries, notifications }: { orders: OrderRecord[]; users: AdminUser[]; products: Product[]; inquiries: Inquiry[]; notifications: Notification[] }) {
  const customers = users.filter((user) => normalizeRole(user.Role) === 'CUSTOMER' && String(user.Active).toLowerCase() !== 'false');
  const admins = users.filter((user) => ['ADMIN', 'SUPER_ADMIN'].includes(normalizeRole(user.Role)));
  const today = new Date().toDateString();
  const todaysOrders = orders.filter((order) => new Date(order.createdAt).toDateString() === today);
  const status = (value: unknown) => String(value || '').trim().toLowerCase();
  const revenue = (list: OrderRecord[]) => list.filter((order) => status(order.status) === 'delivered').reduce((sum, order) => sum + Number(order.total || 0), 0);
  const cards = [
    ['Total Revenue', `₹${revenue(orders).toLocaleString('en-IN')}`], ["Today's Revenue", `₹${revenue(todaysOrders).toLocaleString('en-IN')}`],
    ['Total Orders', orders.length], ['Pending Orders', orders.filter((order) => status(order.status) === 'pending' && !['approved', 'cancelled'].includes(status(order.cancellationStatus))).length], ['Completed Orders', orders.filter((order) => status(order.status) === 'delivered').length],
    ['Cancelled Orders', orders.filter((order) => status(order.status) === 'cancelled').length], ['Customers', customers.length], ['Admins', admins.length],
    ['Active Admins', admins.filter((user) => String(user.Active).toLowerCase() !== 'false').length], ['New Registrations', users.filter((user) => user.CreatedAt && Date.now() - new Date(user.CreatedAt).getTime() < 604800000).length],
    ['Products', products.length], ['Pending Inquiries', inquiries.filter((inquiry) => inquiry.Status !== 'Reviewed').length], ['Notifications', notifications.length], ['System Health', 'Operational'], ['Google Sheets Status', 'Connected'],
  ];
  return <div className="enterprise-section"><div className="enterprise-heading"><div><span className="eyebrow">Enterprise overview</span><h2>Super Admin Command Center</h2></div><span className="badge badge-success">All systems operational</span></div><div className="enterprise-kpi-grid">{cards.map(([label, value]) => <div className="kpi-card glass" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></div>;
}

export function AdminManagementTab({ users, currentUserId, showFilters, adminStatusFilter, setAdminStatusFilter, onSave, onDelete }: { users: AdminUser[]; currentUserId?: string | number; showFilters: boolean; adminStatusFilter: string; setAdminStatusFilter: (value: string) => void; onSave: (user: Partial<AdminUser>) => Promise<boolean>; onDelete: (id: string | number) => Promise<boolean> }) {
  const admins = users.filter((user) =>
    ['ADMIN', 'SUPER_ADMIN'].includes(normalizeRole(user.Role)) &&
    String(user.ID) !== String(currentUserId)
  );
  const [editing, setEditing] = useState<Partial<AdminUser> | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false);

  useEffect(() => {
    if (!editing) return;
    const body = document.body;
    const root = document.documentElement;
    const previousBodyOverflow = body.style.overflow;
    const previousRootOverflow = root.style.overflow;
    const previousBodyPaddingRight = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - root.clientWidth;
    body.style.overflow = 'hidden';
    root.style.overflow = 'hidden';
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      body.style.overflow = previousBodyOverflow;
      root.style.overflow = previousRootOverflow;
      body.style.paddingRight = previousBodyPaddingRight;
    };
  }, [editing]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitLockRef.current || !editing || (!editing.ID && editing.Password !== confirmPassword)) return;
    submitLockRef.current = true;
    setIsSubmitting(true);
    try {
      if (await onSave({ ...editing, Role: editing.Role || 'ADMIN', Active: editing.Active ?? true })) {
        setEditing(null);
        setConfirmPassword('');
      }
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };
  const confirmDelete = async () => {
    if (!deleting) return;
    setDeletePending(true);
    const deleted = await onDelete(deleting.ID);
    setDeletePending(false);
    if (deleted) setDeleting(null);
  };

  return <div className="enterprise-section admin-management-tab">
    <div className="enterprise-heading admin-management-heading"><div><span className="eyebrow">Access control</span><h2>Admin Management</h2><p>Manage administrative identities and access.</p></div><button className="btn btn-primary admin-add-btn" onClick={() => { setConfirmPassword(''); setEditing({ Role: 'ADMIN', Active: true, Permissions: 'orders:view,products:view,customers:view,inquiries:view' }); }}>+ Add Admin</button></div>
    <div className={`filter-bar admins-filter-panel ${showFilters ? 'filters-open animate-fade-in' : 'filters-closed'}`} aria-hidden={!showFilters}>
      <div className="filter-group">
        <label>Status:</label>
        <CustomSelect
          value={adminStatusFilter}
          onChange={setAdminStatusFilter}
          clearable={true}
          onClear={() => setAdminStatusFilter('All')}
          options={[
            { value: 'All', label: 'All Status' },
            { value: 'Active', label: 'Active' },
            { value: 'Inactive', label: 'Suspended' },
          ]}
        />
      </div>
    </div>
    <div className="table-card glass table-responsive admin-management-table-wrap"><table className="admin-table"><thead><tr><th>Profile</th><th>Admin</th><th>Email</th><th>Mobile</th><th>Role</th><th>Status</th><th>Last Login</th><th>Joined</th><th>Actions</th></tr></thead><tbody>
      {admins.map((admin) => <tr key={admin.ID}><td><span className="user-avatar">{admin.Name?.[0] || 'A'}</span></td><td className="admin-name-cell">{admin.Name}</td><td>{admin.Email || admin.Username}</td><td>{admin.Mobile || '—'}</td><td><span className="badge badge-primary">{normalizeRole(admin.Role).replace('_', ' ')}</span></td><td>{String(admin.Active).toLowerCase() === 'false' ? 'Suspended' : 'Active'}</td><td>{admin.LastLogin ? formatAdminDate(admin.LastLogin) : 'Never'}</td><td>{formatAdminDate(admin.CreatedAt)}</td><td><div className="actions-flex admin-actions"><button className="btn-table admin-action-edit" onClick={() => setEditing(admin)}>View / Edit</button><button className="btn-table admin-action-delete" onClick={() => setDeleting(admin)}>Delete</button></div></td></tr>)}
      {!admins.length && <tr><td colSpan={9}>No admins found. Create the first admin account.</td></tr>}
    </tbody></table></div>
    <div className="mobile-admin-management-list">
      {admins.map((admin) => {
        const role = normalizeRole(admin.Role).replace('_', ' ');
        const isSuspended = String(admin.Active).toLowerCase() === 'false';
        return (
          <article className="mobile-admin-card" key={`mobile-admin-${admin.ID}`}>
            <div className="mobile-admin-card-head">
              <span className="user-avatar mobile-admin-avatar">{admin.Name?.[0] || 'A'}</span>
              <div className="mobile-admin-title">
                <h4>{admin.Name || 'Admin account'}</h4>
                <span className="badge badge-primary">{role}</span>
              </div>
              <span className={`badge ${isSuspended ? 'badge-cancelled' : 'badge-success'}`}>{isSuspended ? 'Suspended' : 'Active'}</span>
            </div>
            <dl className="mobile-admin-details">
              <div><dt>Email</dt><dd>{admin.Email || admin.Username || '—'}</dd></div>
              <div><dt>Mobile</dt><dd>{admin.Mobile || '—'}</dd></div>
              <div><dt>Last Login</dt><dd>{admin.LastLogin ? formatAdminDate(admin.LastLogin) : 'Never'}</dd></div>
              <div><dt>Joined</dt><dd>{formatAdminDate(admin.CreatedAt)}</dd></div>
            </dl>
            <div className="mobile-admin-actions">
              <button type="button" className="btn-table admin-action-edit" onClick={() => setEditing(admin)}>View / Edit</button>
              <button type="button" className="btn-table admin-action-delete" onClick={() => setDeleting(admin)}>Delete</button>
            </div>
          </article>
        );
      })}
      {!admins.length && <div className="mobile-admin-empty">No admins found. Create the first admin account.</div>}
    </div>
    {editing && createPortal(
      <div className="modal-overlay admin-editor-overlay">
        <form role="dialog" aria-modal="true" aria-labelledby="admin-editor-title" className="modal-content glass admin-form-modal" onSubmit={submit}>
          <div className="enterprise-heading admin-form-heading">
            <h2 id="admin-editor-title">{editing.ID ? 'Edit Admin' : 'Create Admin'}</h2>
            <button type="button" className="admin-modal-close" aria-label="Close" onClick={() => setEditing(null)}>×</button>
          </div>
          <div className="form-grid admin-form-grid admin-form-scroll">
            <label><span>Full Name <i className="required-mark" aria-hidden="true">*</i></span><input className="form-input" required minLength={2} maxLength={80} pattern=".*\S.*" title="Enter a valid full name" value={editing.Name || ''} onChange={(event) => setEditing({ ...editing, Name: event.target.value })}/></label>
            <label><span>Email <i className="required-mark" aria-hidden="true">*</i></span><input className="form-input" type="email" required value={editing.Email || editing.Username || ''} onChange={(event) => setEditing({ ...editing, Email: event.target.value, Username: event.target.value })}/></label>
            <label>Mobile<input className="form-input" type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} title="Enter a valid 10-digit mobile number" value={editing.Mobile || ''} onChange={(event) => setEditing({ ...editing, Mobile: event.target.value.replace(/\D/g, '').slice(0, 10) })}/></label>
            <label><span>Role <i className="required-mark" aria-hidden="true">*</i></span><select className="form-input" value={editing.Role || 'ADMIN'} onChange={(event) => setEditing({ ...editing, Role: event.target.value as AdminUser['Role'] })}><option value="ADMIN">Admin</option><option value="SUPER_ADMIN">Super Admin</option></select></label>
            <label><span>Status <i className="required-mark" aria-hidden="true">*</i></span><select className="form-input" value={String(editing.Active ?? true)} onChange={(event) => setEditing({ ...editing, Active: event.target.value === 'true' })}><option value="true">Active</option><option value="false">Suspended</option></select></label>
            {!editing.ID && <><label><span>Password <i className="required-mark" aria-hidden="true">*</i></span><input className="form-input" required minLength={6} type="password" title="Password must contain at least 6 characters" onChange={(event) => setEditing({ ...editing, Password: event.target.value })}/></label><label><span>Confirm Password <i className="required-mark" aria-hidden="true">*</i></span><input className="form-input" required minLength={6} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)}/></label></>}
          </div>
          {!editing.ID && editing.Password !== confirmPassword && confirmPassword && <p className="error-box">Passwords do not match.</p>}
          <div className="modal-actions"><button className="btn btn-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : editing.ID ? 'Save Changes' : 'Create Admin'}</button></div>
        </form>
      </div>,
      document.body
    )}
    <LogoutConfirmationModal isOpen={Boolean(deleting)} onClose={() => !deletePending && setDeleting(null)} onConfirm={confirmDelete} title="Delete admin account?" description={`This will permanently delete ${deleting?.Name || 'this admin'} and cannot be undone.`} confirmText="Delete Admin" confirmButtonClass="btn admin-confirm-delete" isProcessing={deletePending} stableFlowLayout />
  </div>;
}
