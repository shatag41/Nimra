import React from 'react';
import { CurrentUser } from '../hooks/useAdminData';

interface SidebarProps {
  currentUser: CurrentUser;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  isProfilePanelOpen: boolean;
}

export default function Sidebar({ currentUser, activeTab, setActiveTab, isProfilePanelOpen }: SidebarProps) {
  const tabs = [
    { id: 'dashboard', name: 'Overview', icon: '📊' },
    { id: 'orders', name: 'Orders', icon: '🛒' },
    { id: 'products', name: 'Products', icon: '💧' },
    { id: 'banners', name: 'Homepage Banners', icon: '🖼️' },
    { id: 'faqs', name: 'Store FAQs', icon: '❓' },
    { id: 'inquiries', name: 'Inquiries', icon: '✉️' },
    { id: 'users', name: 'Users', icon: '👥' },
    { id: 'notifications', name: 'Announcements', icon: '🔔' },
    { id: 'settings', name: 'Settings', icon: '⚙️' },
  ];

  return (
    <aside className={`admin-sidebar glass ${isProfilePanelOpen ? 'blur-background' : ''}`}>
      <div className="sidebar-brand">
        <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 5C50 5 15 45 15 65C15 84.33 30.67 100 50 100C69.33 100 85 84.33 85 65C85 45 50 5 50 5Z" fill="url(#sidebarWaterGrad)"/>
          <defs>
            <linearGradient id="sidebarWaterGrad" x1="50" y1="5" x2="50" y2="100" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00E5FF"/>
              <stop offset="1" stopColor="#00a299"/>
            </linearGradient>
          </defs>
        </svg>
        <span className="brand-text">NIMRA Console</span>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">{currentUser.name ? currentUser.name[0] : 'A'}</div>
        <div className="user-details">
          <span className="user-name">{currentUser.name}</span>
          <span className="user-role badge badge-primary">{currentUser.role}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.icon} {tab.name}
          </button>
        ))}
      </nav>
    </aside>
  );
}
