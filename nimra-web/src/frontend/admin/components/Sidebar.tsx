import React from 'react';
import { CurrentUser } from '../hooks/useAdminData';
import { hasPermission, isSuperAdmin } from '../utils/accessControl';

interface SidebarProps { currentUser: CurrentUser; activeTab: string; setActiveTab: (tab: string) => void; isProfilePanelOpen: boolean; }

export default function Sidebar({ currentUser, activeTab, setActiveTab, isProfilePanelOpen }: SidebarProps) {
  const superAdmin = isSuperAdmin(currentUser.role);
  const tabs = [
    { id: 'dashboard', name: 'Overview', icon: '◫', module: 'analytics' },
    { id: 'orders', name: 'Orders', icon: '◉', module: 'orders' },
    { id: 'products', name: 'Products', icon: '◇', module: 'products' },
    { id: 'users', name: 'Customers', icon: '♙', module: 'customers' },
    { id: 'admins', name: 'Admin Management', icon: '♛', module: 'admins', superOnly: true },
    { id: 'banners', name: 'Homepage Banners', icon: '▣', module: 'banners' },
    { id: 'faqs', name: 'Store FAQs', icon: '?', module: 'faqs' },
    { id: 'inquiries', name: 'Inquiries', icon: '✉', module: 'inquiries' },
    { id: 'notifications', name: 'Notifications', icon: '●', module: 'notifications' },
    { id: 'settings', name: 'Settings', icon: '⚙', module: 'settings' },
  ].filter((tab) => (!tab.superOnly || superAdmin) && hasPermission(currentUser, tab.module));

  return <aside className={`admin-sidebar glass ${isProfilePanelOpen ? 'blur-background' : ''}`}>
    <div className="sidebar-brand"><div className="sidebar-logo-icon"><svg width="28" height="28" viewBox="0 0 100 100" fill="none"><path d="M50 5S15 45 15 65c0 19.33 15.67 35 35 35s35-15.67 35-35C85 45 50 5 50 5Z" fill="url(#sidebarNGrad)"/><text x="50" y="77" textAnchor="middle" fontSize="34" fill="white">N</text><defs><linearGradient id="sidebarNGrad" x1="50" y1="5" x2="50" y2="100"><stop stopColor="#3b82f6"/><stop offset="1" stopColor="#2563eb"/></linearGradient></defs></svg></div><span className="brand-text">NIMRA Console</span></div>
    <div className="sidebar-user"><div className="user-avatar">{currentUser.name?.[0] || 'A'}</div><div className="user-details"><span className="user-name">{currentUser.name}</span><span className="user-role badge badge-primary">{currentUser.role.replace('_', ' ')}</span></div></div>
    <nav className="sidebar-nav">{tabs.map((tab) => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}><span aria-hidden>{tab.icon}</span> {tab.name}</button>)}</nav>
  </aside>;
}
