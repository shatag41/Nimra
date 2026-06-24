import React, { useState, useEffect, useRef } from 'react';
import ThemeToggle from '@/frontend/customer/components/ThemeToggle';
import { CurrentUser } from '../hooks/useAdminData';

interface HeaderProps {
  activeTab: string;
  globalSearch: string;
  setGlobalSearch: (val: string) => void;
  showFilters: boolean;
  setShowFilters: (val: boolean) => void;
  refreshData: () => Promise<void>;
  loading: boolean;
  currentUser: CurrentUser;
  setIsProfilePanelOpen: (open: boolean) => void;
  handleLogout: () => void;
}

export default function Header({
  activeTab,
  globalSearch,
  setGlobalSearch,
  showFilters,
  setShowFilters,
  refreshData,
  loading,
  currentUser,
  setIsProfilePanelOpen,
  handleLogout,
}: HeaderProps) {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  
  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const showSearchAndFilter = activeTab !== 'dashboard' && activeTab !== 'notifications' && activeTab !== 'settings';

  return (
    <header className="main-header glass">
      <h1>
        {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Panel
      </h1>
      <div className="header-actions">
        {showSearchAndFilter && (
          <div className="header-search-wrap">
            <div className="search-container header-search-inner">
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="search-bar-glass"
              />
              <svg 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="search-icon-svg"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              {globalSearch && (
                <button
                  onClick={() => setGlobalSearch('')}
                  className="search-clear-btn"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
              Filters
            </button>
          </div>
        )}
        <button onClick={() => void refreshData()} disabled={loading} className="btn-refresh">
          {loading ? 'Syncing...' : '🔄 Sync Live Sheets'}
        </button>
        <span className="db-indicator">
          <span className="dot active"></span>
          {process.env.NEXT_PUBLIC_APPS_SCRIPT_URL ? 'Connected to Google Sheets' : 'Local Fallback Mode'}
        </span>
        
        {/* Profile Dropdown */}
        <div className="profile-dropdown" ref={profileDropdownRef}>
          <button 
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="profile-btn"
          >
            <div className="profile-avatar">{currentUser.name ? currentUser.name[0] : 'A'}</div>
          </button>
          
          {isProfileDropdownOpen && (
            <div className="profile-menu">
              <div className="profile-header">
                <div className="menu-avatar">{currentUser.name ? currentUser.name[0] : 'A'}</div>
                <div>
                  <div className="menu-name">{currentUser.name}</div>
                  <div className="menu-role">{currentUser.role}</div>
                </div>
              </div>
              <div className="menu-divider"></div>
              <button 
                onClick={() => {
                  setIsProfileDropdownOpen(false);
                  setIsProfilePanelOpen(true);
                }}
                className="menu-item"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                <span className="menu-label">Edit Profile</span>
              </button>
              <div
                className="menu-item theme-menu-item"
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  const themeToggle = document.querySelector<HTMLElement>('.theme-menu-item .theme-toggle-btn');
                  themeToggle?.click();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    const themeToggle = document.querySelector<HTMLElement>('.theme-menu-item .theme-toggle-btn');
                    themeToggle?.click();
                  }
                }}
              >
                <ThemeToggle />
                <span className="menu-label">Theme</span>
              </div>
              <button 
                onClick={() => {
                  setIsProfileDropdownOpen(false);
                  handleLogout();
                }}
                className="menu-item menu-logout"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span className="menu-label">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
