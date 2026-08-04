import React from 'react';
import { CurrentUser } from '../hooks/useAdminData';
import { hasPermission, isSuperAdmin } from '../utils/accessControl';
import ThemeToggle from '@/frontend/customer/components/ThemeToggle';

interface SidebarProps { currentUser: CurrentUser; activeTab: string; setActiveTab: (tab: string) => void; isProfilePanelOpen: boolean; isMobileOpen: boolean; onEditProfile: () => void; onLogout: () => void; }

export default function Sidebar({ currentUser, activeTab, setActiveTab, isProfilePanelOpen, isMobileOpen, onEditProfile, onLogout }: SidebarProps) {
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

  return <aside id="admin-mobile-sidebar" className={`admin-sidebar glass ${isMobileOpen ? 'mobile-open' : ''} ${isProfilePanelOpen ? 'blur-background' : ''}`}>
    <div className="sidebar-brand"><div className="sidebar-logo-icon"><svg width="28" height="28" viewBox="0 0 100 100" fill="none"><path d="M50 5S15 45 15 65c0 19.33 15.67 35 35 35s35-15.67 35-35C85 45 50 5 50 5Z" fill="url(#sidebarNGrad)"/><text x="50" y="77" textAnchor="middle" fontSize="34" fill="white">N</text><defs><linearGradient id="sidebarNGrad" x1="50" y1="5" x2="50" y2="100"><stop stopColor="#3b82f6"/><stop offset="1" stopColor="#2563eb"/></linearGradient></defs></svg></div><span className="brand-text">NIMRA Console</span></div>
    <div className="sidebar-user"><div className="user-avatar">{currentUser.name?.[0] || 'A'}</div><div className="user-details"><span className="sidebar-user-name-row"><span className="user-name">{currentUser.name}</span><button type="button" className="mobile-profile-edit" onClick={onEditProfile} aria-label="Edit admin profile" title="Edit profile"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button></span><span className="user-role badge badge-primary">{currentUser.role.replace('_', ' ')}</span></div></div>
    <nav className="sidebar-nav">{tabs.map((tab) => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}><span aria-hidden>{tab.icon}</span> {tab.name}</button>)}</nav>
    <div className="mobile-sidebar-account">
      <div className="mobile-sidebar-theme"><div><strong>Appearance</strong><span>Theme</span></div><ThemeToggle showLabel /></div>
      <button type="button" className="mobile-sidebar-logout" onClick={onLogout}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg><span>Logout</span></button>
    </div>
  </aside>;
}
