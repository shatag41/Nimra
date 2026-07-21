'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AdminUser, Inquiry, Notification, OrderRecord, Product } from '@/types/cms';
import LogoutConfirmationModal from '@/frontend/customer/components/LogoutConfirmationModal';
import { normalizeRole } from '../utils/accessControl';

const formatAdminDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

export function SuperAdminOverview({ orders, users, products, inquiries, notifications }: { orders: OrderRecord[]; users: AdminUser[]; products: Product[]; inquiries: Inquiry[]; notifications: Notification[] }) {
  const customers = users.filter((user) => normalizeRole(user.Role) === 'CUSTOMER');
  const admins = users.filter((user) => ['ADMIN', 'SUPER_ADMIN'].includes(normalizeRole(user.Role)));
  const today = new Date().toDateString();
  const todaysOrders = orders.filter((order) => new Date(order.createdAt).toDateString() === today);
  const revenue = (list: OrderRecord[]) => list.filter((order) => order.status !== 'Cancelled').reduce((sum, order) => sum + Number(order.total || 0), 0);
  const cards = [
    ['Total Revenue', `₹${revenue(orders).toLocaleString('en-IN')}`], ["Today's Revenue", `₹${revenue(todaysOrders).toLocaleString('en-IN')}`],
    ['Total Orders', orders.length], ['Pending Orders', orders.filter((order) => order.status === 'Pending').length], ['Completed Orders', orders.filter((order) => order.status === 'Delivered').length],
    ['Cancelled Orders', orders.filter((order) => order.status === 'Cancelled').length], ['Customers', customers.length], ['Admins', admins.length],
    ['Active Admins', admins.filter((user) => String(user.Active).toLowerCase() !== 'false').length], ['New Registrations', users.filter((user) => user.CreatedAt && Date.now() - new Date(user.CreatedAt).getTime() < 604800000).length],
    ['Products', products.length], ['Pending Inquiries', inquiries.filter((inquiry) => inquiry.Status !== 'Reviewed').length], ['Notifications', notifications.length], ['System Health', 'Operational'], ['Google Sheets Status', 'Connected'],
  ];
  return <div className="enterprise-section"><div className="enterprise-heading"><div><span className="eyebrow">Enterprise overview</span><h2>Super Admin Command Center</h2></div><span className="badge badge-success">All systems operational</span></div><div className="enterprise-kpi-grid">{cards.map(([label, value]) => <div className="kpi-card glass" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></div>;
}

export function AdminManagementTab({ users, onSave, onDelete }: { users: AdminUser[]; onSave: (user: Partial<AdminUser>) => Promise<boolean>; onDelete: (id: string | number) => Promise<boolean> }) {
  const admins = users.filter((user) => ['ADMIN', 'SUPER_ADMIN'].includes(normalizeRole(user.Role)));
  const [editing, setEditing] = useState<Partial<AdminUser> | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

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
    if (!editing || (!editing.ID && editing.Password !== confirmPassword)) return;
    if (await onSave({ ...editing, Role: editing.Role || 'ADMIN', Active: editing.Active ?? true })) setEditing(null);
  };
  const confirmDelete = async () => {
    if (!deleting) return;
    setDeletePending(true);
    const deleted = await onDelete(deleting.ID);
    setDeletePending(false);
    if (deleted) setDeleting(null);
  };

  return <div className="enterprise-section">
    <div className="enterprise-heading"><div><span className="eyebrow">Access control</span><h2>Admin Management</h2><p>Manage administrative identities and access.</p></div><button className="btn btn-primary" onClick={() => { setConfirmPassword(''); setEditing({ Role: 'ADMIN', Active: true, Permissions: 'orders:view,products:view,customers:view,inquiries:view' }); }}>+ Add Admin</button></div>
    <div className="table-card glass table-responsive"><table className="admin-table"><thead><tr><th>Profile</th><th>Admin</th><th>Email</th><th>Mobile</th><th>Role</th><th>Status</th><th>Last Login</th><th>Orders Managed</th><th>Inquiries Resolved</th><th>Joined</th><th>Actions</th></tr></thead><tbody>
      {admins.map((admin) => <tr key={admin.ID}><td><span className="user-avatar">{admin.Name?.[0] || 'A'}</span></td><td className="admin-name-cell">{admin.Name}</td><td>{admin.Email || admin.Username}</td><td>{admin.Mobile || '—'}</td><td><span className="badge badge-primary">{normalizeRole(admin.Role).replace('_', ' ')}</span></td><td>{String(admin.Active).toLowerCase() === 'false' ? 'Suspended' : 'Active'}</td><td>{admin.LastLogin ? formatAdminDate(admin.LastLogin) : 'Never'}</td><td>{Number(admin.OrdersManaged) || 0}</td><td>{Number(admin.InquiriesResolved) || 0}</td><td>{formatAdminDate(admin.CreatedAt)}</td><td><div className="actions-flex admin-actions"><button className="btn-table admin-action-edit" onClick={() => setEditing(admin)}>View / Edit</button><button className="btn-table admin-action-delete" onClick={() => setDeleting(admin)}>Delete</button></div></td></tr>)}
      {!admins.length && <tr><td colSpan={11}>No admins found. Create the first admin account.</td></tr>}
    </tbody></table></div>
    {editing && createPortal(
      <div className="modal-overlay admin-editor-overlay">
        <form role="dialog" aria-modal="true" aria-labelledby="admin-editor-title" className="modal-content glass admin-form-modal" onSubmit={submit}>
          <div className="enterprise-heading admin-form-heading">
            <h2 id="admin-editor-title">{editing.ID ? 'Edit Admin' : 'Create Admin'}</h2>
            <button type="button" className="admin-modal-close" aria-label="Close" onClick={() => setEditing(null)}>×</button>
          </div>
          <div className="form-grid admin-form-grid">
            <label><span>Full Name <i className="required-mark" aria-hidden="true">*</i></span><input className="form-input" required minLength={2} maxLength={80} pattern=".*\S.*" title="Enter a valid full name" value={editing.Name || ''} onChange={(event) => setEditing({ ...editing, Name: event.target.value })}/></label>
            <label><span>Email <i className="required-mark" aria-hidden="true">*</i></span><input className="form-input" type="email" required value={editing.Email || editing.Username || ''} onChange={(event) => setEditing({ ...editing, Email: event.target.value, Username: event.target.value })}/></label>
            <label>Mobile<input className="form-input" type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} title="Enter a valid 10-digit mobile number" value={editing.Mobile || ''} onChange={(event) => setEditing({ ...editing, Mobile: event.target.value.replace(/\D/g, '').slice(0, 10) })}/></label>
            <label><span>Role <i className="required-mark" aria-hidden="true">*</i></span><select className="form-input" value={editing.Role || 'ADMIN'} onChange={(event) => setEditing({ ...editing, Role: event.target.value as AdminUser['Role'] })}><option value="ADMIN">Admin</option><option value="SUPER_ADMIN">Super Admin</option></select></label>
            <label><span>Status <i className="required-mark" aria-hidden="true">*</i></span><select className="form-input" value={String(editing.Active ?? true)} onChange={(event) => setEditing({ ...editing, Active: event.target.value === 'true' })}><option value="true">Active</option><option value="false">Suspended</option></select></label>
            {!editing.ID && <><label><span>Password <i className="required-mark" aria-hidden="true">*</i></span><input className="form-input" required minLength={6} type="password" title="Password must contain at least 6 characters" onChange={(event) => setEditing({ ...editing, Password: event.target.value })}/></label><label><span>Confirm Password <i className="required-mark" aria-hidden="true">*</i></span><input className="form-input" required minLength={6} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)}/></label></>}
          </div>
          {!editing.ID && editing.Password !== confirmPassword && confirmPassword && <p className="error-box">Passwords do not match.</p>}
          <div className="modal-actions"><button className="btn btn-primary">{editing.ID ? 'Save Changes' : 'Create Admin'}</button></div>
        </form>
      </div>,
      document.body
    )}
    <LogoutConfirmationModal isOpen={Boolean(deleting)} onClose={() => !deletePending && setDeleting(null)} onConfirm={confirmDelete} title="Delete admin account?" description={`This will permanently delete ${deleting?.Name || 'this admin'} and cannot be undone.`} confirmText="Delete Admin" confirmButtonClass="btn admin-confirm-delete" isProcessing={deletePending} stableFlowLayout />
  </div>;
}

export function LogsTab() {
  const logs = useMemo(() => { try { return JSON.parse(localStorage.getItem('nimra_admin_activity_logs') || '[]'); } catch { return []; } }, []);
  return <div className="enterprise-section"><div className="enterprise-heading"><div><span className="eyebrow">Immutable audit trail</span><h2>System Logs</h2></div></div><div className="table-card glass table-responsive"><table className="admin-table"><thead><tr><th>Admin</th><th>Action</th><th>Module</th><th>Time</th><th>IP</th><th>Result</th></tr></thead><tbody>{logs.map((log: any, index: number) => <tr key={index}><td>{log.admin}</td><td>{log.action}</td><td>{log.module}</td><td>{log.time}</td><td>{log.ip || 'Server recorded'}</td><td><span className="badge badge-success">{log.result || 'Success'}</span></td></tr>)}{!logs.length && <tr><td colSpan={6}>No administrative events recorded in this session.</td></tr>}</tbody></table></div></div>;
}
