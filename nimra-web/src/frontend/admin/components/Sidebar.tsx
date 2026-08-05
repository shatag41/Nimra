import React from 'react';
import { CurrentUser } from '../hooks/useAdminData';
import { hasPermission, isSuperAdmin } from '../utils/accessControl';
import ThemeToggle from '@/frontend/customer/components/ThemeToggle';
import { MobileFooterSeparator } from '@/frontend/customer/components/Footer';

interface SidebarProps {
  currentUser: CurrentUser;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isProfilePanelOpen: boolean;
  isMobileOpen: boolean;
  onToggleMobile: () => void;
  onEditProfile: () => void;
  onLogout: () => void;
}

type NavIconName =
  | 'overview'
  | 'orders'
  | 'products'
  | 'customers'
  | 'admins'
  | 'banners'
  | 'faqs'
  | 'inquiries'
  | 'notifications'
  | 'settings';

const NavIcon = ({ name }: { name: NavIconName }) => {
  const common = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  const icons: Record<NavIconName, React.ReactElement> = {
    overview: <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>,
    orders: <svg {...common}><path d="M6 2h12l1 4H5l1-4Z" /><path d="M5 6h14v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6Z" /><path d="M9 10h6" /><path d="M9 14h6" /></svg>,
    products: <svg {...common}><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>,
    customers: <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    admins: <svg {...common}><path d="M12 3 4 6v5c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V6l-8-3Z" /><path d="M9 12l2 2 4-4" /></svg>,
    banners: <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m7 15 3-3 2 2 3-4 2 3" /><circle cx="8" cy="9" r="1" /></svg>,
    faqs: <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M9.7 9a2.6 2.6 0 1 1 4.4 1.9c-.9.7-1.6 1.2-1.6 2.6" /><path d="M12 17h.01" /></svg>,
    inquiries: <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>,
    notifications: <svg {...common}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21a2 2 0 0 0 4 0" /></svg>,
    settings: <svg {...common}><path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" /><path d="M19.4 15a1.8 1.8 0 0 0 .36 2l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.8 1.8 0 0 0-2-.36 1.8 1.8 0 0 0-1 1.64V21a2 2 0 1 1-4 0v-.09a1.8 1.8 0 0 0-1-1.64 1.8 1.8 0 0 0-2 .36l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.8 1.8 0 0 0 .36-2 1.8 1.8 0 0 0-1.64-1H3a2 2 0 1 1 0-4h.09a1.8 1.8 0 0 0 1.64-1 1.8 1.8 0 0 0-.36-2l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.8 1.8 0 0 0 2 .36H9.3a1.8 1.8 0 0 0 1-1.64V3a2 2 0 1 1 4 0v.09a1.8 1.8 0 0 0 1 1.64 1.8 1.8 0 0 0 2-.36l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.8 1.8 0 0 0-.36 2v.1a1.8 1.8 0 0 0 1.64 1H21a2 2 0 1 1 0 4h-.09a1.8 1.8 0 0 0-1.51.7Z" /></svg>,
  };

  return icons[name];
};

export default function Sidebar({ currentUser, activeTab, setActiveTab, isProfilePanelOpen, isMobileOpen, onToggleMobile, onEditProfile, onLogout }: SidebarProps) {
  const superAdmin = isSuperAdmin(currentUser.role);
  const tabs = [
    { id: 'dashboard', name: 'Overview', icon: <NavIcon name="overview" />, module: 'analytics' },
    { id: 'orders', name: 'Orders', icon: <NavIcon name="orders" />, module: 'orders' },
    { id: 'products', name: 'Products', icon: <NavIcon name="products" />, module: 'products' },
    { id: 'users', name: 'Customers', icon: <NavIcon name="customers" />, module: 'customers' },
    { id: 'admins', name: 'Admin Management', icon: <NavIcon name="admins" />, module: 'admins', superOnly: true },
    { id: 'banners', name: 'Homepage Banners', icon: <NavIcon name="banners" />, module: 'banners' },
    { id: 'faqs', name: 'Store FAQs', icon: <NavIcon name="faqs" />, module: 'faqs' },
    { id: 'inquiries', name: 'Inquiries', icon: <NavIcon name="inquiries" />, module: 'inquiries' },
    { id: 'notifications', name: 'Notifications', icon: <NavIcon name="notifications" />, module: 'notifications' },
    { id: 'settings', name: 'Settings', icon: <NavIcon name="settings" />, module: 'settings' },
  ].filter((tab) => (!tab.superOnly || superAdmin) && hasPermission(currentUser, tab.module));

  return <aside id="admin-mobile-sidebar" className={`admin-sidebar glass ${isMobileOpen ? 'mobile-open' : ''} ${isProfilePanelOpen ? 'blur-background' : ''}`}>
    <div className="sidebar-brand desktop-sidebar-brand"><div className="sidebar-logo-icon"><svg width="28" height="28" viewBox="0 0 100 100" fill="none"><path d="M50 5S15 45 15 65c0 19.33 15.67 35 35 35s35-15.67 35-35C85 45 50 5 50 5Z" fill="url(#sidebarNGrad)"/><text x="50" y="77" textAnchor="middle" fontSize="34" fill="white">N</text><defs><linearGradient id="sidebarNGrad" x1="50" y1="5" x2="50" y2="100"><stop stopColor="#3b82f6"/><stop offset="1" stopColor="#2563eb"/></linearGradient></defs></svg></div><span className="brand-text">NIMRA Console</span></div>
    <div className="sidebar-user" onClick={onToggleMobile} role="button" tabIndex={0} aria-label={`${isMobileOpen ? 'Collapse' : 'Expand'} admin navigation`} aria-expanded={isMobileOpen} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onToggleMobile(); } }}><div className="user-avatar">{currentUser.name?.[0] || 'A'}</div><div className="user-details"><span className="sidebar-user-name-row"><span className="user-name">{currentUser.name}</span><button type="button" className="mobile-profile-edit" onClick={(event) => { event.stopPropagation(); onEditProfile(); }} aria-label="Edit admin profile" title="Edit profile"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button></span><span className="user-role badge badge-primary">{currentUser.role.replace('_', ' ')}</span></div></div>
    <div className="admin-sidebar-home-marquee"><MobileFooterSeparator /></div>
    <nav className="sidebar-nav">{tabs.map((tab) => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}><span aria-hidden>{tab.icon}</span><span className="nav-label">{tab.name}</span></button>)}</nav>
    <div className="mobile-sidebar-account">
      <div className="mobile-sidebar-theme"><div><strong>Appearance</strong><span>Theme</span></div><ThemeToggle showLabel /></div>
      <button type="button" className="mobile-sidebar-logout" onClick={onLogout}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg><span>Logout</span></button>
    </div>
  </aside>;
}
