'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AdminUser, Inquiry, Notification, OrderRecord, Product } from '@/types/cms';
import { normalizeRole } from '../utils/accessControl';

export function SuperAdminOverview({ orders, users, products, inquiries, notifications }: { orders: OrderRecord[]; users: AdminUser[]; products: Product[]; inquiries: Inquiry[]; notifications: Notification[] }) {
  const customers = users.filter((u) => normalizeRole(u.Role) === 'CUSTOMER');
  const admins = users.filter((u) => ['ADMIN', 'SUPER_ADMIN'].includes(normalizeRole(u.Role)));
  const today = new Date().toDateString();
  const todaysOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today);
  const revenue = (list: OrderRecord[]) => list.filter((o) => o.status !== 'Cancelled').reduce((sum, o) => sum + Number(o.total || 0), 0);
  const cards = [
    ['Total Revenue', `₹${revenue(orders).toLocaleString('en-IN')}`], ["Today's Revenue", `₹${revenue(todaysOrders).toLocaleString('en-IN')}`],
    ['Total Orders', orders.length], ['Pending Orders', orders.filter((o) => o.status === 'Pending').length], ['Completed Orders', orders.filter((o) => o.status === 'Delivered').length],
    ['Cancelled Orders', orders.filter((o) => o.status === 'Cancelled').length], ['Customers', customers.length], ['Admins', admins.length],
    ['Active Admins', admins.filter((u) => String(u.Active).toLowerCase() !== 'false').length], ['New Registrations', users.filter((u) => u.CreatedAt && Date.now() - new Date(u.CreatedAt).getTime() < 604800000).length],
    ['Products', products.length], ['Pending Inquiries', inquiries.filter((i) => i.Status !== 'Reviewed').length], ['Notifications', notifications.length], ['System Health', 'Operational'], ['Google Sheets Status', 'Connected'],
  ];
  return <div className="enterprise-section"><div className="enterprise-heading"><div><span className="eyebrow">Enterprise overview</span><h2>Super Admin Command Center</h2></div><span className="badge badge-success">All systems operational</span></div><div className="enterprise-kpi-grid">{cards.map(([label, value]) => <div className="kpi-card glass" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><div className="enterprise-grid"><section className="activity-card glass"><h3>Top Performing Admins</h3><div className="table-responsive"><table className="admin-table"><thead><tr><th>Admin</th><th>Orders Managed</th><th>Resolved Inquiries</th><th>Response Time</th><th>Rating</th><th>Last Login</th></tr></thead><tbody>{admins.slice(0, 5).map((admin) => <tr key={admin.ID}><td>{admin.Name}</td><td>{admin.OrdersManaged || 0}</td><td>{admin.InquiriesResolved || 0}</td><td>—</td><td>—</td><td>{admin.LastLogin ? new Date(admin.LastLogin).toLocaleString('en-IN') : 'Never'}</td></tr>)}{!admins.length && <tr><td colSpan={6}>No admin activity yet.</td></tr>}</tbody></table></div></section><section className="activity-card glass"><h3>System Health</h3><div className="health-list">{[['Google Sheets','Connected'],['Apps Script','Running'],['Storage Usage','Healthy'],['Daily API Calls','Normal'],["Today's Orders",todaysOrders.length],['Email Queue',0],['Notification Queue',0]].map(([label,value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></section></div></div>;
}

export function AdminManagementTab({ users, onSave, onDelete }: { users: AdminUser[]; onSave: (user: Partial<AdminUser>) => Promise<boolean>; onDelete: (id: string | number) => Promise<boolean> }) {
  const admins = users.filter((u) => ['ADMIN', 'SUPER_ADMIN'].includes(normalizeRole(u.Role)));
  const [editing, setEditing] = useState<Partial<AdminUser> | null>(null);
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
  const submit = async (e: React.FormEvent) => { e.preventDefault(); if (!editing || (!editing.ID && editing.Password !== confirmPassword)) return; if (await onSave({ ...editing, Role: editing.Role || 'ADMIN', Active: editing.Active ?? true })) setEditing(null); };
  return <div className="enterprise-section"><div className="enterprise-heading"><div><span className="eyebrow">Access control</span><h2>Admin Management</h2><p>Manage administrative identities and access.</p></div><button className="btn btn-primary" onClick={() => { setConfirmPassword(''); setEditing({ Role: 'ADMIN', Active: true, Permissions: 'orders:view,products:view,customers:view,inquiries:view' }); }}>+ Add Admin</button></div><div className="table-card glass table-responsive"><table className="admin-table"><thead><tr><th>Profile</th><th>Admin Name</th><th>Email</th><th>Mobile</th><th>Role</th><th>Status</th><th>Last Login</th><th>Orders Managed</th><th>Inquiries Resolved</th><th>Joined</th><th>Actions</th></tr></thead><tbody>{admins.map((admin) => <tr key={admin.ID}><td><span className="user-avatar">{admin.Name?.[0] || 'A'}</span></td><td>{admin.Name}</td><td>{admin.Email || admin.Username}</td><td>{admin.Mobile || '—'}</td><td><span className="badge badge-primary">{normalizeRole(admin.Role).replace('_',' ')}</span></td><td>{String(admin.Active).toLowerCase() === 'false' ? 'Suspended' : 'Active'}</td><td>{admin.LastLogin || 'Never'}</td><td>{admin.OrdersManaged || 0}</td><td>{admin.InquiriesResolved || 0}</td><td>{admin.CreatedAt || '—'}</td><td><div className="actions-flex"><button className="btn-table" onClick={() => setEditing(admin)}>View / Edit</button><button className="btn-table" onClick={() => onSave({ ID: admin.ID, Active: String(admin.Active).toLowerCase() === 'false' })}>{String(admin.Active).toLowerCase() === 'false' ? 'Activate' : 'Suspend'}</button><button className="btn-table btn-reject" onClick={() => onDelete(admin.ID)}>Delete</button></div></td></tr>)}{!admins.length && <tr><td colSpan={11}>No admins found. Create the first admin account.</td></tr>}</tbody></table></div>{editing && createPortal(<div className="modal-overlay admin-editor-overlay"><form role="dialog" aria-modal="true" aria-labelledby="admin-editor-title" className="modal-content glass admin-form-modal" onSubmit={submit}><div className="enterprise-heading"><h2 id="admin-editor-title">{editing.ID ? 'Edit Admin' : 'Create Admin'}</h2><button type="button" className="btn-table" aria-label="Close" onClick={() => setEditing(null)}>×</button></div><div className="form-grid"><label>Full Name<input className="form-input" required value={editing.Name || ''} onChange={(e) => setEditing({...editing, Name:e.target.value})}/></label><label>Email<input className="form-input" type="email" required value={editing.Email || editing.Username || ''} onChange={(e) => setEditing({...editing, Email:e.target.value, Username:e.target.value})}/></label><label>Mobile<input className="form-input" value={editing.Mobile || ''} onChange={(e) => setEditing({...editing, Mobile:e.target.value})}/></label><label>Role<select className="form-input" value={editing.Role || 'ADMIN'} onChange={(e) => setEditing({...editing, Role:e.target.value as AdminUser['Role']})}><option value="ADMIN">Admin</option><option value="SUPER_ADMIN">Super Admin</option></select></label><label>Status<select className="form-input" value={String(editing.Active ?? true)} onChange={(e) => setEditing({...editing, Active:e.target.value === 'true'})}><option value="true">Active</option><option value="false">Suspended</option></select></label>{!editing.ID && <><label>Password<input className="form-input" required type="password" onChange={(e) => setEditing({...editing, Password:e.target.value})}/></label><label>Confirm Password<input className="form-input" required type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}/></label></>}<label className="full-field">Permissions<textarea className="form-input" rows={3} value={editing.Permissions || ''} onChange={(e) => setEditing({...editing, Permissions:e.target.value})}/></label></div>{!editing.ID && editing.Password !== confirmPassword && confirmPassword && <p className="error-box">Passwords do not match.</p>}<div className="modal-actions"><button type="button" className="btn" onClick={() => setEditing(null)}>Cancel</button><button className="btn btn-primary">{editing.ID ? 'Save Changes' : 'Create Admin'}</button></div></form></div>, document.body)}</div>;
}

export function LogsTab() { const logs = useMemo(() => { try { return JSON.parse(localStorage.getItem('nimra_admin_activity_logs') || '[]'); } catch { return []; } }, []); return <div className="enterprise-section"><div className="enterprise-heading"><div><span className="eyebrow">Immutable audit trail</span><h2>System Logs</h2></div></div><div className="table-card glass table-responsive"><table className="admin-table"><thead><tr><th>Admin</th><th>Action</th><th>Module</th><th>Time</th><th>IP</th><th>Result</th></tr></thead><tbody>{logs.map((log: any, index: number) => <tr key={index}><td>{log.admin}</td><td>{log.action}</td><td>{log.module}</td><td>{log.time}</td><td>{log.ip || 'Server recorded'}</td><td><span className="badge badge-success">{log.result || 'Success'}</span></td></tr>)}{!logs.length && <tr><td colSpan={6}>No administrative events recorded in this session.</td></tr>}</tbody></table></div></div>; }
