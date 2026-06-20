'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

import { CMSData, OrderRecord, Product, Banner, FAQ, AdminUser } from '@/types/cms';
import { useAdminData } from '../hooks/useAdminData';
import { useAdminFilters } from '../hooks/useAdminFilters';
import { useProfile } from '../hooks/useProfile';
import {
  filterOrders,
  filterProducts,
  filterBanners,
  filterFAQs,
  filterInquiries,
  filterUsers,
  filterNotifications,
} from '../utils/filterUtils';

import Sidebar from './Sidebar';
import Header from './Header';
import ProfilePanel from './ProfilePanel';
import LogoutConfirmationModal from '@/frontend/customer/components/LogoutConfirmationModal';

// Modals
import OrderModal from './OrderModal';
import ProductModal from './ProductModal';
import BannerModal from './BannerModal';
import FAQModal from './FAQModal';
import UserModal from './UserModal';

// Lazy-loaded Tab components
const DashboardTab = dynamic(() => import('./DashboardTab'), {
  ssr: false,
  loading: () => <div className="tab-loading-indicator">Loading Dashboard...</div>,
});
const OrdersTab = dynamic(() => import('./OrdersTab'), {
  ssr: false,
  loading: () => <div className="tab-loading-indicator">Loading Orders...</div>,
});
const ProductsTab = dynamic(() => import('./ProductsTab'), {
  ssr: false,
  loading: () => <div className="tab-loading-indicator">Loading Products...</div>,
});
const BannersTab = dynamic(() => import('./BannersTab'), {
  ssr: false,
  loading: () => <div className="tab-loading-indicator">Loading Banners...</div>,
});
const FAQsTab = dynamic(() => import('./FAQsTab'), {
  ssr: false,
  loading: () => <div className="tab-loading-indicator">Loading FAQs...</div>,
});
const InquiriesTab = dynamic(() => import('./InquiriesTab'), {
  ssr: false,
  loading: () => <div className="tab-loading-indicator">Loading Inquiries...</div>,
});
const UsersTab = dynamic(() => import('./UsersTab'), {
  ssr: false,
  loading: () => <div className="tab-loading-indicator">Loading Users...</div>,
});
const NotificationsTab = dynamic(() => import('./NotificationsTab'), {
  ssr: false,
  loading: () => <div className="tab-loading-indicator">Loading Notifications...</div>,
});
const SettingsTab = dynamic(() => import('./SettingsTab'), {
  ssr: false,
  loading: () => <div className="tab-loading-indicator">Loading Settings...</div>,
});

interface AdminPortalClientProps {
  initialCMSData: CMSData;
}

export default function AdminPortalClient({ initialCMSData }: AdminPortalClientProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // 1. Data hook
  const {
    currentUser,
    setCurrentUser,
    authChecked,
    activeTab,
    setActiveTab,
    orders,
    inquiries,
    users,
    notifications,
    cancellationRequests,
    products,
    banners,
    faqs,
    companyInfo,
    loading,
    saveLoading,
    alertMsg,
    showAlert,
    refreshData,
    performLogout,
    handleUpdateStatusSubmit,
    handleCancellationReview,
    handleProductSubmit,
    handleProductDelete,
    handleBannerSubmit,
    handleBannerDelete,
    handleFAQSubmit,
    handleFAQDelete,
    handleUserSubmit,
    handleUserDelete,
    handleSendNotif,
    handleNotifDelete,
    handleSettingsSubmit,
    handleSettingsFieldChange,
  } = useAdminData(initialCMSData);

  // 2. Filters hook
  const filters = useAdminFilters();
  const searchLower = filters.globalSearch.toLowerCase();

  // 3. Profile hook
  const profile = useProfile(currentUser, setCurrentUser, showAlert);

  // Local Modal States
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [orderStatusVal, setOrderStatusVal] = useState('');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [ordersView, setOrdersView] = useState<'active' | 'cancellations'>('active');

  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [productFormOpen, setProductFormOpen] = useState(false);

  const [editingBanner, setEditingBanner] = useState<Partial<Banner> | null>(null);
  const [bannerFormOpen, setBannerFormOpen] = useState(false);

  const [editingFAQ, setEditingFAQ] = useState<Partial<FAQ> | null>(null);
  const [faqFormOpen, setFAQFormOpen] = useState(false);

  const [editingUser, setEditingUser] = useState<Partial<AdminUser> | null>(null);
  const [userFormOpen, setUserFormOpen] = useState(false);

  // Filtered collections
  const filteredOrders = filterOrders(
    orders,
    searchLower,
    filters.orderStatusFilter,
    filters.orderPaymentFilter,
    filters.orderSort,
    filters.orderStartDate,
    filters.orderEndDate
  );

  const filteredProducts = filterProducts(
    products,
    searchLower,
    filters.productCategoryFilter,
    filters.productStatusFilter
  );

  const filteredBanners = filterBanners(banners, searchLower, filters.bannerStatusFilter);

  const filteredFaqs = filterFAQs(faqs, searchLower, filters.faqStatusFilter);

  const filteredInquiries = filterInquiries(
    inquiries,
    searchLower,
    filters.inquirySort,
    filters.inquiryStartDate,
    filters.inquiryEndDate
  );

  const filteredUsers = filterUsers(
    users,
    searchLower,
    filters.userRoleFilter,
    filters.userStatusFilter
  );

  const filteredNotifications = filterNotifications(
    notifications,
    searchLower,
    filters.notificationSort
  );

  // Submits callbacks mapping to states
  const onUpdateOrderStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    const success = await handleUpdateStatusSubmit(selectedOrder.orderId, orderStatusVal);
    if (success) {
      setSelectedOrder(null);
    }
  };

  const onProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const success = await handleProductSubmit(editingProduct);
    if (success) {
      setProductFormOpen(false);
    }
  };

  const onBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;
    const success = await handleBannerSubmit(editingBanner);
    if (success) {
      setBannerFormOpen(false);
    }
  };

  const onFAQSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFAQ) return;
    const success = await handleFAQSubmit(editingFAQ);
    if (success) {
      setFAQFormOpen(false);
    }
  };

  const onUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const success = await handleUserSubmit(editingUser);
    if (success) {
      setUserFormOpen(false);
    }
  };

  if (!currentUser || !mounted) {
    return (
      <div className="main-loading-overlay">
        <div className="spinner"></div>
        <p>Loading Admin Portal...</p>
      </div>
    );
  }

  return (
    <>
      <div className="admin-container">
        {/* SIDEBAR */}
        <Sidebar
          currentUser={currentUser}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isProfilePanelOpen={profile.isProfilePanelOpen}
        />

        {/* MAIN VIEW */}
        <main className={`admin-main animate-fade-in fixed-page ${profile.isProfilePanelOpen ? 'blur-background' : ''}`}>
          {/* HEADER */}
          <Header
            activeTab={activeTab}
            globalSearch={filters.globalSearch}
            setGlobalSearch={filters.setGlobalSearch}
            showFilters={filters.showFilters}
            setShowFilters={filters.setShowFilters}
            refreshData={refreshData}
            loading={loading}
            currentUser={currentUser}
            setIsProfilePanelOpen={profile.setIsProfilePanelOpen}
            handleLogout={() => setIsLogoutModalOpen(true)}
          />

          {/* ALERTS */}
          {alertMsg.text && (
            <div className={`toast animate-fade-in ${alertMsg.type}`}>
              {alertMsg.text}
            </div>
          )}

          {loading && (
            <div className="main-loading-overlay">
              <div className="spinner"></div>
              <p>Loading NIMRA Databases...</p>
            </div>
          )}

          {/* TAB CONTENTS */}
          {!loading && (
            <div className="tab-viewport">
              {activeTab === 'dashboard' && (
                <DashboardTab
                  orders={orders}
                  filteredInquiries={filteredInquiries}
                  filteredOrders={filteredOrders}
                  cancellationRequests={cancellationRequests}
                  onReviewCancellation={handleCancellationReview}
                  onOpenCancellationRequests={() => {
                    setOrdersView('cancellations');
                    setActiveTab('orders');
                  }}
                />
              )}

              {activeTab === 'orders' && (
                <OrdersTab
                  filteredOrders={filteredOrders}
                  showFilters={filters.showFilters}
                  orderStatusFilter={filters.orderStatusFilter}
                  setOrderStatusFilter={filters.setOrderStatusFilter}
                  orderPaymentFilter={filters.orderPaymentFilter}
                  setOrderPaymentFilter={filters.setOrderPaymentFilter}
                  orderSort={filters.orderSort}
                  setOrderSort={filters.setOrderSort}
                  orderStartDate={filters.orderStartDate}
                  setOrderStartDate={filters.setOrderStartDate}
                  orderEndDate={filters.orderEndDate}
                  setOrderEndDate={filters.setOrderEndDate}
                  handleClearOrderFilters={filters.handleClearOrderFilters}
                  setSelectedOrder={setSelectedOrder}
                  setOrderStatusVal={setOrderStatusVal}
                  cancellationRequests={cancellationRequests}
                  onReviewCancellation={handleCancellationReview}
                  ordersView={ordersView}
                  setOrdersView={setOrdersView}
                />
              )}

              {activeTab === 'products' && (
                <ProductsTab
                  products={products}
                  filteredProducts={filteredProducts}
                  showFilters={filters.showFilters}
                  productCategoryFilter={filters.productCategoryFilter}
                  setProductCategoryFilter={filters.setProductCategoryFilter}
                  productStatusFilter={filters.productStatusFilter}
                  setProductStatusFilter={filters.setProductStatusFilter}
                  setEditingProduct={setEditingProduct}
                  setProductFormOpen={setProductFormOpen}
                  handleProductDelete={handleProductDelete}
                />
              )}

              {activeTab === 'banners' && (
                <BannersTab
                  filteredBanners={filteredBanners}
                  showFilters={filters.showFilters}
                  bannerStatusFilter={filters.bannerStatusFilter}
                  setBannerStatusFilter={filters.setBannerStatusFilter}
                  setEditingBanner={setEditingBanner}
                  setBannerFormOpen={setBannerFormOpen}
                  handleBannerDelete={handleBannerDelete}
                />
              )}

              {activeTab === 'faqs' && (
                <FAQsTab
                  filteredFaqs={filteredFaqs}
                  showFilters={filters.showFilters}
                  faqStatusFilter={filters.faqStatusFilter}
                  setFaqStatusFilter={filters.setFaqStatusFilter}
                  setEditingFAQ={setEditingFAQ}
                  setFAQFormOpen={setFAQFormOpen}
                  handleFAQDelete={handleFAQDelete}
                />
              )}

              {activeTab === 'inquiries' && (
                <InquiriesTab
                  filteredInquiries={filteredInquiries}
                  showFilters={filters.showFilters}
                  inquirySort={filters.inquirySort}
                  setInquirySort={filters.setInquirySort}
                  inquiryStartDate={filters.inquiryStartDate}
                  setInquiryStartDate={filters.setInquiryStartDate}
                  inquiryEndDate={filters.inquiryEndDate}
                  setInquiryEndDate={filters.setInquiryEndDate}
                />
              )}

              {activeTab === 'users' && (
                <UsersTab
                  currentUser={currentUser}
                  filteredUsers={filteredUsers}
                  showFilters={filters.showFilters}
                  userRoleFilter={filters.userRoleFilter}
                  setUserRoleFilter={filters.setUserRoleFilter}
                  userStatusFilter={filters.userStatusFilter}
                  setUserStatusFilter={filters.setUserStatusFilter}
                  setEditingUser={setEditingUser}
                  setUserFormOpen={setUserFormOpen}
                  handleUserDelete={handleUserDelete}
                />
              )}

              {activeTab === 'notifications' && (
                <NotificationsTab
                  filteredNotifications={filteredNotifications}
                  handleSendNotif={handleSendNotif}
                  handleNotifDelete={handleNotifDelete}
                  saveLoading={saveLoading}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsTab
                  currentUser={currentUser}
                  companyInfo={companyInfo}
                  handleSettingsSubmit={handleSettingsSubmit}
                  handleSettingsFieldChange={handleSettingsFieldChange}
                  saveLoading={saveLoading}
                />
              )}
            </div>
          )}
        </main>

        {/* ==================================================== */}
        {/* MODAL SYSTEM */}
        {/* ==================================================== */}

        {/* ORDER MANAGE STATUS DIALOG */}
        {selectedOrder && (
          <OrderModal
            selectedOrder={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onSubmit={onUpdateOrderStatus}
            orderStatusVal={orderStatusVal}
            setOrderStatusVal={setOrderStatusVal}
            saveLoading={saveLoading}
          />
        )}

        {/* PRODUCT CRUD DIALOG */}
        {productFormOpen && editingProduct && (
          <ProductModal
            editingProduct={editingProduct}
            setEditingProduct={setEditingProduct}
            onClose={() => setProductFormOpen(false)}
            onSubmit={onProductSubmit}
            saveLoading={saveLoading}
          />
        )}

        {/* BANNER CRUD DIALOG */}
        {bannerFormOpen && editingBanner && (
          <BannerModal
            editingBanner={editingBanner}
            setEditingBanner={setEditingBanner}
            onClose={() => setBannerFormOpen(false)}
            onSubmit={onBannerSubmit}
            saveLoading={saveLoading}
          />
        )}

        {/* FAQ CRUD DIALOG */}
        {faqFormOpen && editingFAQ && (
          <FAQModal
            editingFAQ={editingFAQ}
            setEditingFAQ={setEditingFAQ}
            onClose={() => setFAQFormOpen(false)}
            onSubmit={onFAQSubmit}
            saveLoading={saveLoading}
          />
        )}

        {/* USER CRUD DIALOG */}
        {userFormOpen && editingUser && (
          <UserModal
            editingUser={editingUser}
            setEditingUser={setEditingUser}
            onClose={() => setUserFormOpen(false)}
            onSubmit={onUserSubmit}
            saveLoading={saveLoading}
          />
        )}

        <LogoutConfirmationModal
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
          onConfirm={() => {
            setIsLogoutModalOpen(false);
            performLogout();
          }}
        />

        {/* PROFILE EDIT PANEL */}
        <ProfilePanel
          currentUser={currentUser}
          isProfilePanelOpen={profile.isProfilePanelOpen}
          setIsProfilePanelOpen={profile.setIsProfilePanelOpen}
          profileForm={profile.profileForm}
          setProfileForm={profile.setProfileForm}
          profileFeedback={profile.profileFeedback}
          setProfileFeedback={profile.setProfileFeedback}
          profileValidationErrors={profile.profileValidationErrors}
          setProfileValidationErrors={profile.setProfileValidationErrors}
          isProfileSaving={profile.isProfileSaving}
          handleProfileSave={profile.handleProfileSave}
        />

        {/* ==================================================== */}
        {/* DESIGN SYSTEM CSS */}
        <style jsx global>{`
          .admin-container {
            display: flex;
            min-height: 100vh;
            background-color: var(--bg-primary);
            color: var(--text-primary);
          }

          /* SIDEBAR STYLING */
          .admin-sidebar {
            width: 220px;
            min-width: 220px;
            background: var(--bg-primary);
            border-right: 1px solid var(--border-color);
            padding: 1.25rem 0.875rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            z-index: 200;
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            overflow-y: auto;
            scrollbar-width: none; /* Firefox */
            box-shadow: 4px 0 24px rgba(0, 0, 0, 0.02);
          }
          [data-theme="dark"] .admin-sidebar {
            background: var(--bg-primary);
            border-right: 1px solid var(--border-color);
          }
          
          .admin-sidebar::-webkit-scrollbar {
            display: none; /* Chrome, Safari and Opera */
          }

          .sidebar-brand {
            display: flex;
            align-items: center;
            gap: 0.625rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid var(--border-color);
          }
          .brand-text {
            font-family: var(--font-heading);
            font-weight: 800;
            font-size: 1.2rem;
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .sidebar-user {
            display: flex;
            align-items: center;
            gap: 0.625rem;
            padding: 0.625rem;
            border-radius: var(--radius-md);
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            box-shadow: var(--shadow-sm);
            transition: transform var(--transition-fast), box-shadow var(--transition-fast);
          }
          .sidebar-user:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
          }
          .user-avatar {
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 1rem;
            box-shadow: var(--shadow-sm);
          }
          .user-details {
            display: flex;
            flex-direction: column;
            gap: 0.125rem;
          }
          .user-name {
            font-size: 0.85rem;
            font-weight: 700;
          }
          .user-role {
            font-size: 0.65rem;
            padding: 0.1rem 0.375rem;
            width: fit-content;
          }

          .sidebar-nav {
            display: flex;
            flex-direction: column;
            gap: 0.375rem;
            flex: 1;
          }
          .nav-btn {
            background: transparent;
            border: none;
            text-align: left;
            padding: 0.55rem 0.75rem;
            border-radius: var(--radius-md);
            color: rgba(37, 99, 235, 0.7);
            font-weight: 600;
            font-size: 0.85rem;
            cursor: pointer;
            transition: all var(--transition-normal);
            display: flex;
            align-items: center;
            gap: 0.5rem;
            position: relative;
            overflow: hidden;
          }
          [data-theme="dark"] .nav-btn {
            color: rgba(147, 197, 253, 0.75);
          }
          .nav-btn:hover {
            color: var(--primary-color);
            background: rgba(var(--primary-rgb), 0.08);
            transform: translateX(4px);
          }
          [data-theme="dark"] .nav-btn:hover {
            color: #93c5fd;
            background: rgba(59, 130, 246, 0.12);
          }
          .nav-btn.active {
            color: white;
            background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
            box-shadow: 0 4px 14px rgba(var(--primary-rgb), 0.3);
            transform: translateX(4px);
          }
          [data-theme="dark"] .nav-btn.active {
            color: white;
            background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
          }

          /* MAIN SECTION STYLING */
          .admin-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            padding: 1rem 1.25rem;
            margin-left: 220px;
            position: relative;
            gap: 0.75rem;
          }

          .admin-main.fixed-page {
            height: 100vh;
            overflow: hidden;
          }

          .admin-main.scrollable-page {
            min-height: 100vh;
            height: auto;
            overflow: visible;
          }

          .main-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1rem;
            padding: 0.75rem 1.25rem;
            border-bottom: 1px solid var(--border-color);
            background: var(--nav-bg);
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            box-shadow: var(--shadow-sm);
            position: sticky;
            top: 0;
            z-index: 150;
            margin-left: -1.25rem;
            margin-right: -1.25rem;
            margin-top: -1rem;
            margin-bottom: 1.25rem;
          }
          .main-header h1 {
            font-size: 1.25rem;
            white-space: nowrap;
          }
          .header-actions {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 1rem;
            position: relative;
            z-index: 1000;
            flex-grow: 1;
            justify-content: flex-end;
          }
          .btn-refresh {
            background: var(--bg-primary);
            border: 1px solid var(--border-color);
            padding: 0 1.25rem;
            height: 44px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
            font-weight: 700;
            font-size: 0.95rem;
            cursor: pointer;
            color: var(--text-primary);
            transition: all var(--transition-normal);
            box-shadow: var(--shadow-sm);
          }
          .btn-refresh:hover {
            border-color: var(--primary-color);
            color: var(--primary-color);
            box-shadow: var(--shadow-md);
            transform: translateY(-2px);
          }
          .db-indicator {
            font-size: 0.8rem;
            color: var(--text-secondary);
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            display: inline-block;
          }
          .dot.active {
            background: var(--accent-color);
            box-shadow: 0 0 10px rgba(var(--accent-rgb), 0.4);
            animation: pulse-glow 2s infinite;
          }

          /* PROFILE DROPDOWN */
          .profile-dropdown {
            position: relative;
          }
          .profile-btn {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            border: 2px solid var(--border-color);
            background: var(--bg-secondary);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all var(--transition-normal);
            box-shadow: var(--shadow-sm);
          }
          .profile-btn:hover {
            border-color: var(--primary-color);
            box-shadow: var(--shadow-md);
            transform: scale(1.05);
          }
          .profile-avatar {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 800;
            font-size: 1.1rem;
            font-family: var(--font-heading);
          }
          .profile-menu {
            position: absolute;
            top: 100%;
            right: 0;
            margin-top: 0.75rem;
            width: 260px;
            background: var(--bg-secondary);
            border-radius: var(--radius-xl);
            box-shadow: var(--shadow-2xl);
            border: 1px solid var(--border-color);
            padding: 0.75rem;
            z-index: 99999;
            animation: scaleIn 0.2s ease-out forwards;
          }
          .profile-header {
            display: flex;
            align-items: center;
            gap: 0.875rem;
            padding: 0.75rem;
            margin-bottom: 0.25rem;
          }
          .menu-avatar {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 800;
            font-size: 1.3rem;
            font-family: var(--font-heading);
          }
          .menu-name {
            font-weight: 700;
            color: var(--text-primary);
            font-size: 1rem;
            font-family: var(--font-heading);
          }
          .menu-role {
            font-size: 0.8rem;
            color: var(--text-secondary);
            font-weight: 600;
          }
          .menu-divider {
            height: 1px;
            background: var(--border-color);
            margin: 0.5rem 0;
          }
          .menu-item {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 0.875rem;
            padding: 0.75rem;
            border-radius: var(--radius-lg);
            background: transparent;
            border: none;
            cursor: pointer;
            transition: all var(--transition-fast);
            color: var(--text-primary);
            text-align: left;
          }
          .menu-item:hover {
            background: var(--bg-tertiary);
          }
          .menu-item.menu-logout {
            color: #ef4444;
          }
          .menu-item.menu-logout:hover {
            background: rgba(239, 68, 68, 0.1);
          }
          .menu-label {
            font-weight: 600;
            font-size: 0.9rem;
          }

          .tab-viewport {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
            animation: fadeIn var(--transition-normal) forwards;
          }

          .fixed-page .tab-viewport {
            overflow: hidden;
          }

          .scrollable-page .tab-viewport {
            overflow: visible;
          }

          .tab-loading-indicator {
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 1;
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--text-secondary);
            padding: 4rem;
          }

          /* TOAST NOTIFICATIONS */
          .toast {
            position: fixed;
            top: 6rem;
            right: 2rem;
            padding: 1rem 1.5rem;
            border-radius: var(--radius-md);
            z-index: 1000;
            font-weight: 700;
            box-shadow: var(--shadow-xl);
            animation: slideUp 0.3s ease-out forwards;
          }
          .toast.success {
            background: var(--accent-color);
            color: white;
          }
          .toast.error {
            background: #ef4444;
            color: white;
          }

          .overview-tab {
            flex: 1;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            gap: 0.7rem;
            padding: 0.8rem !important;
          }

          /* OVERVIEW DASHBOARD */
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 0.8rem;
            margin-bottom: 0.65rem;
          }
          .stat-card {
            padding: 0.85rem 0.95rem;
            border-radius: var(--radius-md);
            border: 1px solid var(--glass-border);
            background: var(--glass-bg);
            backdrop-filter: blur(16px);
            display: flex;
            flex-direction: column;
            gap: 0.32rem;
            transition: all var(--transition-normal);
            box-shadow: var(--shadow-md);
            position: relative;
            overflow: hidden;
          }
          .stat-card:hover {
            transform: translateY(-6px);
            box-shadow: var(--shadow-xl);
            border-color: rgba(var(--primary-rgb), 0.3);
          }
          .stat-card::after {
            content: ''; position: absolute; top: 0; right: 0;
            width: 150px; height: 150px;
            background: radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%);
            opacity: 0; transition: opacity var(--transition-normal);
            pointer-events: none;
          }
          .stat-card:hover::after { opacity: 1; }
          .stat-label {
            color: var(--text-secondary);
            font-size: 0.78rem;
            font-weight: 700;        
          }
          /* SETTINGS TAB STYLING */
          .settings-tab {
            width: 100%;
            padding: 0 !important;
          }
          .settings-section {
            background: rgba(37, 99, 235, 0.02);
            border: 1.5px solid var(--border-light);
            border-radius: var(--radius-xl);
            padding: 1.75rem;
            margin-bottom: 1.75rem;
            transition: border-color var(--transition-fast), background-color var(--transition-fast);
          }
          [data-theme="dark"] .settings-section {
            background: rgba(255, 255, 255, 0.01);
            border-color: rgba(255, 255, 255, 0.05);
          }
          .settings-section:hover {
            border-color: rgba(var(--primary-rgb), 0.15);
          }
          .settings-section-title {
            font-family: var(--font-heading);
            font-size: 1.05rem;
            font-weight: 700;
            color: var(--primary-color);
            margin-bottom: 1.25rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            border-bottom: 1px solid var(--border-light);
            padding-bottom: 0.5rem;
          }
          [data-theme="dark"] .settings-section-title {
            border-color: rgba(255, 255, 255, 0.05);
            color: var(--accent-color);
          }
          .settings-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1.25rem;
          }
          @media (max-width: 768px) {
            .settings-grid {
              grid-template-columns: 1fr;
              gap: 1rem;
            }
          }

          /* SCROLLABLE TABLES STYLING */
          .table-responsive {
            flex: 1;
            overflow: auto;
            min-height: 0;
            -webkit-overflow-scrolling: touch;
            border-radius: var(--radius-md);
            border: 1px solid var(--border-color);
            background: var(--bg-secondary);
          }
          .admin-table thead th {
            position: sticky;
            top: 0;
            background: var(--bg-secondary);
            z-index: 10;
            box-shadow: 0 1px 0 var(--border-color);
          }
          [data-theme="dark"] .admin-table thead th {
            background: #1e293b;
          }
          [data-theme="dark"] .table-responsive {
            border-color: rgba(255, 255, 255, 0.1);
            background: rgba(15, 23, 42, 0.4);
          }
          .admin-table {
            width: 100%;
            border-collapse: collapse;
            min-width: 850px; /* Force scrollbar inside table-responsive wrapper */
          }
          .admin-table th, .admin-table td {
            padding: 0.5rem 0.75rem;
            font-size: 0.85rem;
          }
          .sticky-action-col {
            position: sticky;
            right: 0;
            background: var(--bg-secondary);
            z-index: 1;
            box-shadow: -2px 0 5px rgba(0,0,0,0.05);
          }
          [data-theme="dark"] .sticky-action-col {
            background: rgba(15, 23, 42, 0.95);
            box-shadow: -2px 0 5px rgba(0,0,0,0.3);
          }
          .admin-table thead th.sticky-action-col {
            z-index: 11;
          }
          .stat-val {
            font-size: 1.42rem;
            font-family: var(--font-heading);
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .stat-desc {
            color: var(--text-muted);
            font-size: 0.74rem;
          }

          .charts-grid {
            display: grid;
            grid-template-columns: 1.5fr 1fr;
            gap: 0.8rem;
            margin-bottom: 0.65rem;
          }
          .chart-card {
            padding: 0.85rem;
            border-radius: var(--radius-md);
            border: 1px solid var(--glass-border);
            background: var(--glass-bg);
            backdrop-filter: blur(16px);
            box-shadow: var(--shadow-md);
            transition: all var(--transition-normal);
          }
          .chart-card:hover {
            box-shadow: var(--shadow-lg);
            border-color: rgba(var(--primary-rgb), 0.2);
          }
          .chart-card h3 {
            font-size: 0.95rem;
            margin-bottom: 0.5rem;
          }
          .chart-wrapper {
            width: 100%;
            height: 165px;
          }
          .svg-chart {
            width: 100%;
            height: 100%;
          }

          .donut-chart-flex {
            display: flex;
            align-items: center;
            gap: 1.25rem;
            height: 165px;
            justify-content: center;
          }
          .legend-list {
            display: flex;
            flex-direction: column;
            gap: 0.45rem;
            font-size: 0.8rem;
            font-weight: 700;
          }
          .legend-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 0.5rem;
          }
          .legend-dot.green {
            background: var(--primary-color);
          }
          .legend-dot.orange {
            background: #f97316;
          }
          .legend-dot.red {
            background: #ef4444;
          }

          .recent-activity-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
          .activity-card {
            padding: 0.9rem;
            border-radius: var(--radius-md);
            border: 1px solid var(--border-color);
            background: var(--bg-secondary);
            box-shadow: var(--shadow-sm);
            transition: all var(--transition-normal);
          }
          .activity-card:hover {
            box-shadow: var(--shadow-lg);
            border-color: rgba(var(--primary-rgb), 0.2);
          }
          .activity-card h3 {
            font-size: 1rem;
            margin-bottom: 0.45rem;
          }
          .mini-list {
            display: flex;
            flex-direction: column;
            gap: 0.65rem;
          }
          .mini-item {
            padding: 0.8rem;
            border-radius: var(--radius-md);
            background: var(--bg-primary);
            border: 1px solid var(--border-light);
          }
          .mini-item.row-flex {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .mini-item strong {
            font-size: 0.95rem;
          }
          .mini-item p {
            color: var(--text-secondary);
            font-size: 0.875rem;
            margin-top: 0.25rem;
          }
          .mini-item .topic {
            color: var(--primary-color);
          }
          .empty {
            text-align: center;
            color: var(--text-muted);
            padding: 2rem;
          }

          .orders-tab, .products-tab, .banners-tab, .faqs-tab, .inquiries-tab, .users-tab, .notifications-tab {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            min-height: 0;
            padding: 1rem !important;
          }
          .settings-tab {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow-y: auto;
            padding: 1rem !important;
          }

          /* RESPONSIVE MEDIA QUERIES */
          @media (max-width: 1400px) {
            .stats-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          @media (max-width: 1024px) {
            .charts-grid, .recent-activity-grid {
              grid-template-columns: 1fr;
            }
          }
          .section-head-btn {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1rem;
            margin-bottom: 1.5rem;
          }
          .section-head-btn h3 {
            font-size: 1.15rem;
          }
          /* Admin Portal Standardized Buttons Override */
          .admin-container .btn, .modal-backdrop .btn {
            height: 44px;
            padding: 0 1.25rem;
            font-size: 0.95rem;
            border-radius: 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          .admin-container .btn svg, .modal-backdrop .btn svg {
            width: 18px;
            height: 18px;
          }
          .btn-add {
            gap: 0.5rem;
          }
          .actions-flex {
            display: flex;
            gap: 0.5rem;
          }
          .actions-flex.vertical {
            flex-direction: column;
          }
          .btn-table {
            padding: 0.5rem 1rem;
            font-size: 0.825rem;
            border-radius: var(--radius-md);
            font-weight: 600;
          }
          .btn-edit {
            background: rgba(var(--primary-rgb), 0.1);
            color: var(--primary-color);
            border: 1px solid var(--primary-color);
          }
          .btn-edit:hover {
            background: var(--primary-color);
            color: white;
          }
          .btn-delete {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            border: 1px solid #ef4444;
          }
          .btn-delete:hover {
            background: #ef4444;
            color: white;
          }
          .btn-whatsapp {
            background: rgba(37, 211, 102, 0.1);
            color: #25d366;
            border: 1px solid #25d366;
          }
          .btn-whatsapp:hover {
            background: #25d366;
            color: white;
          }
          .max-cell-width {
            max-width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .message-cell {
            margin: 0;
            color: var(--text-secondary);
            font-size: 0.875rem;
          }
          .empty-td {
            text-align: center;
            padding: 2rem;
            color: var(--text-muted);
          }

          /* ACCESS DENIED BLOCK */
          .access-denied-block {
            text-align: center;
            padding: 4rem;
          }
          .access-denied-block h2 {
            font-size: 1.75rem;
            margin-bottom: 0.75rem;
          }
          .access-denied-block p {
            color: var(--text-secondary);
          }

          /* MODALS */
          .modal-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            backdrop-filter: blur(4px);
          }
          .modal-card {
            background: var(--bg-secondary);
            border-radius: var(--radius-xl);
            width: 95%;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: var(--shadow-2xl), 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            animation: scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            border: 1px solid var(--border-color);
            transition: all var(--transition-normal);
          }
          .modal-header {
            padding: 1rem 1.5rem;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .modal-header h2 {
            font-size: 1.25rem;
          }
          .btn-close {
            background: transparent;
            border: none;
            font-size: 1.5rem;
            color: var(--text-secondary);
            cursor: pointer;
            line-height: 1;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all var(--transition-fast);
          }
          .btn-close:hover {
            background: var(--bg-tertiary);
            color: var(--text-primary);
          }
          .modal-body {
            padding: 1.25rem 1.5rem;
          }
          .form-group {
            margin-bottom: 1rem;
          }
          .form-label, .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 700;
            font-size: 0.9rem;
            color: var(--text-primary);
          }
          .form-input, .form-select, .form-textarea, .form-group input, .form-group select, .form-group textarea {
            width: 100%;
            padding: 0.65rem 0.875rem;
            border: 1.5px solid var(--border-color);
            border-radius: var(--radius-md);
            background: var(--bg-primary);
            color: var(--text-primary);
            font-size: 0.95rem;
            font-family: var(--font-body);
            transition: all var(--transition-fast);
          }
          .form-input:focus, .form-select:focus, .form-textarea:focus, .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.12);
            background: var(--bg-secondary);
          }
          .form-textarea, .form-group textarea {
            min-height: 120px;
            resize: vertical;
          }
          .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }
          @media (max-width: 600px) {
            .form-row {
              grid-template-columns: 1fr;
              gap: 0.75rem;
            }
          }
          .modal-footer {
            padding: 1rem 1.5rem;
            border-top: 1px solid var(--border-color);
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
          }

          /* MAIN LOADING OVERLAY */
          .main-loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: transparent;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 1.5rem;
            z-index: 1000;
          }
          .spinner {
            width: 60px;
            height: 60px;
            border: 4px solid var(--border-color);
            border-top-color: var(--primary-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          /* PROFILE EDIT PANEL */
          .blur-background {
            filter: blur(6px);
            transition: filter 0.2s ease-out;
          }
          .profile-panel-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.55);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100000;
            animation: fadeIn 0.2s ease-out forwards;
            padding: 20px;
            box-sizing: border-box;
          }
          .profile-panel {
            width: 100%;
            max-width: 560px;
            min-width: min(560px, calc(100vw - 32px));
            background: var(--bg-secondary);
            border-radius: var(--radius-xl);
            box-shadow: var(--shadow-2xl);
            overflow: hidden;
            max-height: 95vh;
            overflow-y: auto;
            animation: scaleIn 0.3s ease-out forwards;
          }
          .profile-panel-header {
            padding: 1.25rem 1.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border-color);
          }
          .profile-panel-header h2 {
            font-size: 1.25rem;
            font-family: var(--font-heading);
            margin-bottom: 0.2rem;
          }
          .profile-panel-header p {
            color: var(--text-secondary);
            font-size: 0.85rem;
          }
          .close-btn {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border: none;
            background: var(--bg-tertiary);
            color: var(--text-primary);
            cursor: pointer;
            transition: all var(--transition-fast);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .close-btn:hover {
            background: var(--primary-color);
            color: white;
            transform: rotate(90deg);
          }
          .profile-panel-content {
            padding: 1.5rem;
          }
          .profile-avatar-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 1.5rem;
          }
          .profile-panel-avatar {
            width: 90px;
            height: 90px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 2.2rem;
            font-weight: 800;
            font-family: var(--font-heading);
            box-shadow: var(--shadow-lg);
          }
          .profile-form {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
          }
          .profile-form .form-group {
            margin-bottom: 0;
          }
          .profile-actions {
            display: flex;
            gap: 0.875rem;
            margin-top: 0.875rem;
          }
          .profile-actions .btn {
            flex: 1;
            padding: 0.75rem 1rem;
            font-size: 0.9rem;
          }
          .profile-feedback {
            padding: 0.8rem 0.95rem;
            border-radius: var(--radius-lg);
            font-size: 0.9rem;
            font-weight: 600;
            border: 1px solid transparent;
          }
          .profile-feedback.success {
            background: rgba(16, 185, 129, 0.12);
            color: #059669;
            border-color: rgba(16, 185, 129, 0.24);
          }
          .profile-feedback.error {
            background: rgba(239, 68, 68, 0.12);
            color: #dc2626;
            border-color: rgba(239, 68, 68, 0.24);
          }

          /* Validation Error Styles */
          .form-input-error {
            border-color: #ef4444 !important;
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
            background: rgba(239, 68, 68, 0.04);
          }
          .form-input-error:focus {
            border-color: #ef4444 !important;
            box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2);
          }
          .form-input-error-message {
            margin-top: 0.5rem;
            font-size: 0.85rem;
            color: #ef4444;
            font-weight: 500;
          }

          /* ANNOUNCEMENTS (NOTIFICATIONS) TAB STYLING */
          .notif-grid {
            display: grid;
            grid-template-columns: 1fr 1.25fr;
            gap: 2rem;
            align-items: start;
          }
          @media (max-width: 992px) {
            .notif-grid {
              grid-template-columns: 1fr;
              gap: 1.5rem;
            }
          }
          .notif-sender-panel {
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            border-radius: var(--radius-xl);
            padding: 2rem;
            box-shadow: var(--shadow-md);
            backdrop-filter: blur(12px);
            transition: transform var(--transition-fast), box-shadow var(--transition-fast);
          }
          .notif-sender-panel:hover {
            box-shadow: var(--shadow-lg);
            border-color: rgba(var(--primary-rgb), 0.25);
          }
          .notif-sender-panel h3 {
            font-family: var(--font-heading);
            font-size: 1.25rem;
            margin-bottom: 0.5rem;
            color: var(--text-primary);
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .notif-logs-panel {
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            border-radius: var(--radius-xl);
            padding: 2rem;
            box-shadow: var(--shadow-md);
            backdrop-filter: blur(12px);
            max-height: 600px;
            display: flex;
            flex-direction: column;
          }
          .notif-logs-panel h3 {
            font-family: var(--font-heading);
            font-size: 1.25rem;
            margin-bottom: 1.25rem;
          }
          .logs-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            overflow-y: auto;
            padding-right: 0.5rem;
            flex: 1;
          }
          .log-item {
            background: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-lg);
            padding: 1.25rem;
            position: relative;
            transition: all var(--transition-normal);
          }
          .log-item:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
            border-color: var(--primary-color);
            background: var(--bg-secondary);
          }
          .log-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
            margin-bottom: 0.25rem;
          }
          .log-header strong {
            font-size: 1rem;
            color: var(--text-primary);
          }
          .btn-delete-log {
            background: transparent;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            font-size: 1rem;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all var(--transition-fast);
          }
          .btn-delete-log:hover {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            transform: scale(1.1);
          }
          .log-time {
            font-size: 0.75rem;
            color: var(--text-muted);
            display: block;
            margin-bottom: 0.75rem;
            font-weight: 500;
          }
          .log-item p {
            color: var(--text-secondary);
            font-size: 0.9rem;
            line-height: 1.5;
          }

          /* SETTINGS TAB STYLING */
          .settings-tab {
            max-width: 100%;
            margin: 0 auto;
          }
          .settings-form h3 {
            font-family: var(--font-heading);
            font-size: 1.35rem;
            margin-bottom: 0.5rem;
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .settings-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
            margin-bottom: 1rem;
          }
          @media (max-width: 768px) {
            .settings-grid {
              grid-template-columns: 1fr;
              gap: 1rem;
            }
          }

          /* PREMIUM FORM FIELD THEMES */
          .form-input, .form-select, .modal-select, .form-textarea, .form-group input, .form-group select, .form-group textarea {
            background: var(--bg-primary);
            border: 1.5px solid var(--border-color);
            color: var(--text-primary);
            border-radius: var(--radius-md);
            padding: 0.75rem 1rem;
            transition: all var(--transition-fast);
          }
          [data-theme="dark"] .form-input, 
          [data-theme="dark"] .form-select, 
          [data-theme="dark"] .modal-select,
          [data-theme="dark"] .form-textarea,
          [data-theme="dark"] .form-group input,
          [data-theme="dark"] .form-group select,
          [data-theme="dark"] .form-group textarea {
            background: rgba(30, 41, 59, 0.45);
            border-color: rgba(255, 255, 255, 0.1);
          }
          .form-select, .form-group select, .modal-select {
            appearance: none !important;
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232563eb' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e") !important;
            background-repeat: no-repeat !important;
            background-position: right 1rem center !important;
            background-size: 1.1em !important;
            padding-right: 2.75rem !important;
          }
          [data-theme="dark"] .form-select, 
          [data-theme="dark"] .form-group select, 
          [data-theme="dark"] .modal-select {
            background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2360a5fa' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e") !important;
          }
          .form-input:focus, .form-select:focus, .modal-select:focus, .form-textarea:focus, 
          .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
            border-color: var(--primary-color);
            box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.15);
            background: var(--bg-secondary);
          }
          [data-theme="dark"] .form-input:focus, 
          [data-theme="dark"] .form-select:focus, 
          [data-theme="dark"] .modal-select:focus,
          [data-theme="dark"] .form-textarea:focus,
          [data-theme="dark"] .form-group input:focus,
          [data-theme="dark"] .form-group select:focus,
          [data-theme="dark"] .form-group textarea:focus {
            background: rgba(30, 41, 59, 0.85);
            border-color: var(--primary-color);
            box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.25);
          }

          /* RESPONSIVE */
          @media (max-width: 1200px) {
            .stats-grid {
              grid-template-columns: repeat(2, 1fr);
            }
            .charts-grid {
              grid-template-columns: 1fr;
            }
          }
          @media (max-width: 900px) {
            .admin-sidebar {
              width: 180px;
              min-width: 180px;
              padding: 1.25rem 0.75rem;
            }
            .admin-main {
              margin-left: 180px;
            }
            .recent-activity-grid {
              grid-template-columns: 1fr;
            }
          }
          @media (max-width: 768px) {
            .admin-container {
              flex-direction: column;
            }
            .admin-sidebar {
              position: relative;
              width: 100%;
              min-width: 100%;
              height: auto;
              border-right: none;
              border-bottom: 1px solid var(--border-color);
              padding: 1rem;
              z-index: 10;
            }
            .admin-main {
              margin-left: 0;
              padding: 1rem;
            }
            .sidebar-nav {
              flex-direction: row;
              overflow-x: auto;
            }
            .nav-btn {
              white-space: nowrap;
            }
            .stats-grid {
              grid-template-columns: repeat(2, 1fr);
            }
            .admin-main {
              padding: 1rem;
            }
            .main-header {
              flex-direction: column;
              gap: 1rem;
              align-items: flex-start;
            }
            .header-actions {
              width: 100%;
              justify-content: space-between;
            }
            .section-head-btn {
              flex-direction: column;
              gap: 1rem;
              align-items: flex-start;
            }
          }
          @media (max-width: 480px) {
            .stats-grid {
              grid-template-columns: 1fr;
            }
            .form-row {
              grid-template-columns: 1fr;
            }
          }
          /* FILTERS BAR */
          .filter-bar {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 0.75rem;
            margin-bottom: 1.25rem;
            background: var(--bg-secondary);
            padding: 1rem;
            border-radius: var(--radius-xl);
            border: 1px solid var(--border-color);
            align-items: end;
            width: 100%;
            box-shadow: var(--shadow-sm);
            position: relative;
            z-index: 30;
          }
          @media (max-width: 768px) {
            .filter-bar {
              grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
              padding: 0.75rem;
              gap: 0.5rem;
            }
          }
          .filter-clear-cross {
            position: absolute;
            right: 2.25rem;
            background: transparent;
            border: none;
            cursor: pointer;
            color: #ef4444;
            font-size: 0.95rem;
            font-weight: 800;
            padding: 2px;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
            transition: transform var(--transition-fast), color var(--transition-fast);
          }
          .filter-clear-cross:hover {
            color: #dc2626;
            transform: scale(1.15);
          }
          .filter-clear-cross.date-cross {
            right: 0.75rem;
          }
          .filter-toggle-btn {
            box-shadow: var(--shadow-sm);
          }
          .filter-toggle-btn:hover {
            transform: translateY(-1px);
            box-shadow: var(--shadow-md);
          }
          .filter-toggle-btn.active {
            box-shadow: 0 4px 14px rgba(var(--primary-rgb), 0.3);
          }
          .filter-group {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            gap: 0.35rem;
            min-width: 0;
            width: 100%;
          }
          .filter-group label {
            font-weight: 700;
            font-size: 0.8rem;
            color: var(--text-secondary);
            white-space: nowrap;
            margin-bottom: 0;
          }
          .filter-select {
            padding: 0.45rem 2.85rem 0.45rem 0.6rem !important;
            font-size: 0.8rem !important;
            border-radius: 10px !important;
            width: 100%;
            min-width: 0;
            height: auto !important;
            border: 1.5px solid var(--border-color);
            background-color: var(--bg-primary);
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .filter-select:hover {
            border-color: var(--primary-color);
            box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.08);
            transform: translateY(-1px);
          }
          .filter-select:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.15), 0 4px 12px rgba(var(--primary-rgb), 0.08);
          }
          .filter-input {
            padding: 0.55rem 0.75rem !important;
            font-size: 0.8rem !important;
            border-radius: 10px !important;
            width: 100%;
            min-width: 0;
            height: 38px !important;
            border: 1.5px solid var(--border-color);
            background-color: var(--bg-primary);
            color: var(--text-primary);
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            box-sizing: border-box;
          }
          .filter-input:hover {
            border-color: var(--primary-color);
          }
          .filter-input:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.12);
          }
          .btn-clear {
            padding: 0.45rem 0.875rem !important;
            font-size: 0.825rem !important;
            border-radius: var(--radius-md) !important;
            font-weight: 700 !important;
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            cursor: pointer;
            border: 1.5px solid #ef4444 !important;
            background: rgba(239, 68, 68, 0.05) !important;
            color: #ef4444 !important;
            transition: all var(--transition-fast) !important;
            height: 38px !important;
            box-sizing: border-box;
          }
          .btn-clear:hover {
            background: #ef4444 !important;
            color: white !important;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
          }

          /* PREMIUM GLASS SEARCH & DROPDOWNS */
          .search-bar-glass {
            padding: 11px 44px 11px 48px;
            border-radius: 28px;
            border: 1.5px solid var(--border-color);
            background: rgba(255, 255, 255, 0.45);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            color: var(--text-primary);
            outline: none;
            font-size: 0.95rem;
            width: 100%;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
          }
          [data-theme="dark"] .search-bar-glass {
            background: rgba(15, 23, 42, 0.45);
            border-color: rgba(255, 255, 255, 0.1);
          }
          .search-bar-glass:hover {
            border-color: var(--primary-color);
            background: rgba(255, 255, 255, 0.65);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05);
          }
          [data-theme="dark"] .search-bar-glass:hover {
            background: rgba(15, 23, 42, 0.65);
          }
          .search-bar-glass:focus {
            border-color: var(--primary-color);
            background: var(--bg-primary);
            box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.2), 0 8px 20px rgba(var(--primary-rgb), 0.08);
          }
          [data-theme="dark"] .search-bar-glass:focus {
            background: rgba(15, 23, 42, 0.85);
          }

          .search-clear-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all var(--transition-fast);
          }
          .search-clear-btn:hover {
            color: #ef4444 !important;
            background: rgba(239, 68, 68, 0.1) !important;
            transform: scale(1.1);
          }

          .form-select, .modal-select {
            border-radius: 12px !important;
            background-color: var(--bg-primary) !important;
            border: 1.5px solid var(--border-color) !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
          .form-select:hover, .modal-select:hover {
            border-color: var(--primary-color) !important;
            background-color: var(--bg-secondary) !important;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.08) !important;
          }
          .form-select:focus, .modal-select:focus {
            outline: none !important;
            border-color: var(--primary-color) !important;
            box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.15), 0 4px 12px rgba(var(--primary-rgb), 0.08) !important;
            background-color: var(--bg-secondary) !important;
          }
        `}</style>

        {/* GLOBAL PREMIUM STYLES FOR CUSTOM SELECT COMPONENT */}
        <style jsx global>{`
          /* Custom Select Container */
          .custom-select-container {
            position: relative;
            width: 100%;
          }

          /* Trigger Button */
          .custom-select-trigger {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            height: 38px;
            padding: 0.45rem 0.85rem;
            font-size: 0.825rem;
            font-weight: 500;
            color: var(--text-primary);
            background: var(--bg-primary);
            border: 1.5px solid var(--border-color);
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
            user-select: none;
            box-sizing: border-box;
          }

          [data-theme="dark"] .custom-select-trigger {
            background: rgba(30, 41, 59, 0.45);
            border-color: rgba(255, 255, 255, 0.1);
          }

          .custom-select-trigger:hover {
            border-color: var(--primary-color);
            background: var(--bg-secondary);
            box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.08);
          }

          [data-theme="dark"] .custom-select-trigger:hover {
            background: rgba(30, 41, 59, 0.65);
          }

          .custom-select-trigger.open {
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.15), 0 4px 12px rgba(var(--primary-rgb), 0.08);
            background: var(--bg-secondary);
          }

          .custom-select-text {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          /* Actions area inside trigger */
          .custom-select-actions {
            display: flex;
            align-items: center;
            gap: 0.35rem;
            flex-shrink: 0;
            margin-left: 0.5rem;
          }

          .custom-select-clear {
            color: var(--text-muted);
            cursor: pointer;
            font-size: 0.75rem;
            font-weight: bold;
            padding: 2px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color var(--transition-fast), transform var(--transition-fast);
          }

          .custom-select-clear:hover {
            color: #ef4444;
            transform: scale(1.15);
          }

          .custom-select-arrow {
            color: var(--primary-color);
            display: flex;
            align-items: center;
            transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .custom-select-trigger.open .custom-select-arrow {
            transform: rotate(180deg);
          }

          /* Options dropdown list container */
          .custom-select-options-list {
            position: absolute;
            top: calc(100% + 6px);
            left: 0;
            width: 100%;
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            box-shadow: var(--shadow-xl), 0 10px 15px -3px rgba(0, 0, 0, 0.05);
            z-index: 2200; /* Higher than sticky headers & tables */
            max-height: 148px;
            overflow-y: auto;
            padding: 4px;
            animation: dropdownIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            box-sizing: border-box;
          }

          [data-theme="dark"] .custom-select-options-list {
            background: #1e293b;
            border-color: rgba(255, 255, 255, 0.1);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
          }

          @keyframes dropdownIn {
            from {
              opacity: 0;
              transform: translateY(-8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          /* Individual Option Item */
          .custom-select-option {
            padding: 0.55rem 0.75rem;
            font-size: 0.8rem;
            font-weight: 500;
            color: var(--text-primary);
            border-radius: 8px;
            cursor: pointer;
            transition: all var(--transition-fast);
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
            box-sizing: border-box;
          }

          .custom-select-option:hover {
            background: rgba(var(--primary-rgb), 0.08);
            color: var(--primary-color);
            transform: translateX(2px);
          }

          [data-theme="dark"] .custom-select-option:hover {
            background: rgba(59, 130, 246, 0.12);
            color: #93c5fd;
          }

          .custom-select-option.selected {
            background: var(--primary-color);
            color: white !important;
          }

          /* Date Picker Calendar Icon Contrast Fix for Night Mode */
          [data-theme="dark"] .filter-input::-webkit-calendar-picker-indicator,
          [data-theme="dark"] .form-input::-webkit-calendar-picker-indicator,
          [data-theme="dark"] input[type="date"]::-webkit-calendar-picker-indicator {
            filter: invert(1) brightness(0.95) !important;
            cursor: pointer !important;
          }
          .filter-input::-webkit-calendar-picker-indicator,
          .form-input::-webkit-calendar-picker-indicator,
          input[type="date"]::-webkit-calendar-picker-indicator {
            cursor: pointer !important;
            transition: transform 0.2s ease !important;
          }
          .filter-input::-webkit-calendar-picker-indicator:hover,
          .form-input::-webkit-calendar-picker-indicator:hover,
          input[type="date"]::-webkit-calendar-picker-indicator:hover {
            transform: scale(1.15) !important;
          }

          /* Search Icon Theme Contrast Fix for Night Mode */
          .search-icon-svg {
            color: var(--primary-color) !important;
            opacity: 0.8 !important;
            transition: all var(--transition-fast) !important;
          }
          .search-container:focus-within .search-icon-svg {
            color: var(--primary-hover) !important;
            opacity: 1 !important;
            transform: scale(1.05) !important;
          }
          [data-theme="dark"] .search-icon-svg {
            color: #60a5fa !important;
            opacity: 0.95 !important;
          }
          [data-theme="dark"] .search-container:focus-within .search-icon-svg {
            color: #93c5fd !important;
            opacity: 1 !important;
          }
          .compact-table {
            font-size: 0.8rem;
            min-width: 760px;
          }
          .compact-table th,
          .compact-table td {
            padding: 0.42rem 0.58rem;
            font-size: 0.8rem;
            line-height: 1.32;
            vertical-align: top;
          }
          .compact-table small {
            font-size: 0.72rem;
          }
          .compact-table textarea.form-input {
            font-size: 0.8rem;
          }
          .compact-table .btn-table {
            padding: 0.4rem 0.62rem;
            font-size: 0.74rem;
            border-radius: var(--radius-sm);
          }
        `}</style>

        <style jsx global>{`
          .admin-container {
            min-height: 100vh;
            background: var(--bg-primary);
          }

          .admin-sidebar {
            width: var(--ds-sidebar-w) !important;
            min-width: var(--ds-sidebar-w) !important;
          }

          .admin-main {
            margin-left: var(--ds-sidebar-w) !important;
            width: calc(100% - var(--ds-sidebar-w));
            min-width: 0;
            padding: clamp(1rem, 2vw, 1.75rem) !important;
          }

          .tab-viewport,
          .dashboard-content,
          .admin-content,
          .table-section {
            width: 100%;
            max-width: 1360px;
            margin-inline: auto;
            min-width: 0;
          }

          .stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr)) !important;
            gap: var(--ds-gap-md) !important;
          }

          .charts-grid,
          .recent-activity-grid {
            grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr)) !important;
            gap: var(--ds-gap-lg) !important;
          }

          .filter-bar {
            grid-template-columns: repeat(auto-fit, minmax(min(100%, 11rem), 1fr)) !important;
            padding: var(--ds-card-pad) !important;
          }

          .main-header,
          .section-head,
          .section-head-btn,
          .header-actions,
          .modal-actions {
            gap: var(--ds-gap-sm) !important;
          }

          .modal-backdrop,
          .admin-modal-backdrop {
            padding: var(--ds-page-pad) !important;
          }

          .modal-card,
          .admin-modal,
          .profile-panel {
            width: min(100%, 44rem) !important;
            max-height: min(90vh, 52rem);
            border-radius: var(--ds-modal-radius) !important;
            overflow: auto;
          }

          .table-wrapper,
          .orders-table-wrap,
          .admin-table-wrapper {
            width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          table {
            width: 100%;
            min-width: 44rem;
          }

          @media (max-width: 768px) {
            .admin-container {
              flex-direction: column !important;
            }

            .admin-sidebar {
              position: sticky !important;
              top: 0;
              width: 100% !important;
              min-width: 0 !important;
              height: auto !important;
              max-height: 42vh;
              border-right: 0 !important;
              border-bottom: 1px solid var(--border-color);
            }

            .admin-main {
              margin-left: 0 !important;
              width: 100%;
              padding: 1rem !important;
            }

            .sidebar-nav {
              flex-direction: row !important;
              overflow-x: auto;
              padding-bottom: 0.25rem;
            }

            .nav-btn {
              white-space: nowrap;
              flex: 0 0 auto;
            }

            .main-header,
            .section-head,
            .section-head-btn,
            .header-actions {
              flex-direction: column !important;
              align-items: stretch !important;
            }
          }
        `}</style>

        <style jsx global>{`
          :root {
            --admin-sidebar-width: 15rem;
            --admin-content-max: 88rem;
            --admin-gap: 1rem;
            --admin-panel-pad: 1rem;
            --admin-control-height: 2.75rem;
            --admin-radius: 0.75rem;
          }

          .admin-container {
            align-items: stretch !important;
            min-width: 0 !important;
            overflow-x: clip !important;
          }

          .admin-sidebar {
            width: var(--admin-sidebar-width) !important;
            min-width: var(--admin-sidebar-width) !important;
          }

          .admin-main {
            width: calc(100% - var(--admin-sidebar-width)) !important;
            margin-left: var(--admin-sidebar-width) !important;
            min-width: 0 !important;
            padding: 1.25rem !important;
            overflow-x: clip !important;
          }

          .tab-viewport,
          .overview-tab,
          .dashboard-content,
          .admin-content,
          .products-tab,
          .banners-tab,
          .faqs-tab,
          .orders-tab,
          .users-tab,
          .notifications-tab,
          .settings-tab {
            width: min(100%, var(--admin-content-max)) !important;
            max-width: var(--admin-content-max) !important;
            margin-inline: auto !important;
            min-width: 0 !important;
          }

          .stats-grid {
            display: grid !important;
            grid-template-columns: repeat(auto-fit, minmax(13.5rem, 1fr)) !important;
            gap: var(--admin-gap) !important;
            align-items: stretch !important;
          }

          .stat-card,
          .chart-card,
          .activity-card,
          .products-tab.card,
          .banners-tab.card,
          .faqs-tab.card,
          .orders-tab.card,
          .users-tab.card,
          .notifications-tab.card,
          .settings-tab.card {
            min-width: 0 !important;
            border-radius: var(--admin-radius) !important;
            padding: var(--admin-panel-pad) !important;
            box-shadow: var(--shadow-sm) !important;
            transform: none !important;
          }

          .stat-card {
            min-height: 8rem !important;
            display: grid !important;
            align-content: space-between !important;
            gap: 0.55rem !important;
          }

          .stat-label,
          .stat-desc {
            line-height: 1.35 !important;
          }

          .stat-val {
            font-size: 1.65rem !important;
            line-height: 1.05 !important;
            letter-spacing: 0 !important;
            overflow-wrap: anywhere !important;
          }

          .charts-grid,
          .recent-activity-grid {
            display: grid !important;
            grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr)) !important;
            gap: var(--admin-gap) !important;
            align-items: stretch !important;
            margin-top: var(--admin-gap) !important;
          }

          .chart-card {
            display: flex !important;
            flex-direction: column !important;
            min-height: 20rem !important;
          }

          .chart-wrapper {
            width: 100% !important;
            min-height: 14rem !important;
            display: grid !important;
            place-items: center !important;
          }

          .svg-chart {
            width: 100% !important;
            height: auto !important;
            max-height: 16rem !important;
          }

          .donut-chart-flex {
            display: grid !important;
            grid-template-columns: auto minmax(0, 1fr) !important;
            gap: 1rem !important;
            align-items: center !important;
          }

          .section-head-btn,
          .main-header,
          .header-actions {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: var(--admin-gap) !important;
            min-width: 0 !important;
          }

          .section-head-btn h3,
          .main-header h1 {
            min-width: 0 !important;
            overflow-wrap: anywhere !important;
          }

          .filter-bar {
            display: grid !important;
            grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)) !important;
            gap: 0.75rem !important;
            align-items: end !important;
            margin-bottom: var(--admin-gap) !important;
          }

          .filter-group,
          .form-group {
            min-width: 0 !important;
          }

          .custom-select-trigger,
          input,
          textarea,
          select {
            min-height: var(--admin-control-height) !important;
            border-radius: var(--admin-radius) !important;
          }

          .table-responsive {
            width: 100% !important;
            max-width: 100% !important;
            overflow-x: auto !important;
            border-radius: var(--admin-radius) !important;
          }

          .admin-table {
            min-width: 48rem !important;
            table-layout: auto !important;
            font-size: 0.875rem !important;
          }

          .admin-table th,
          .admin-table td {
            padding: 0.8rem 0.9rem !important;
            vertical-align: top !important;
            line-height: 1.4 !important;
          }

          .max-cell-width {
            max-width: 24rem !important;
            white-space: normal !important;
            overflow-wrap: anywhere !important;
          }

          .actions-flex {
            display: flex !important;
            gap: 0.5rem !important;
            flex-wrap: wrap !important;
          }

          .btn,
          .btn-table {
            min-height: 2.5rem !important;
            border-radius: var(--admin-radius) !important;
            white-space: nowrap !important;
          }

          .admin-main.fixed-page {
            height: 100vh !important;
            padding-top: 0 !important;
            overflow-x: clip !important;
            overflow-y: auto !important;
            scrollbar-width: thin;
            overscroll-behavior: contain;
          }

          .fixed-page .tab-viewport,
          .overview-tab {
            overflow: visible !important;
          }

          .overview-tab {
            gap: 0.85rem !important;
            padding: 0 !important;
            padding-bottom: 1.25rem !important;
          }

          .main-header {
            position: sticky !important;
            top: 0 !important;
            z-index: 900 !important;
            min-height: auto !important;
            padding: 0.6rem 1.25rem !important;
            margin-top: 0 !important;
            margin-left: -1.25rem !important;
            margin-right: -1.25rem !important;
            margin-bottom: 0.75rem !important;
            background: var(--bg-primary) !important;
            background-image: var(--app-bg-gradient) !important;
            border-bottom: 1px solid var(--border-color) !important;
            box-shadow: 0 10px 24px rgba(2, 6, 23, 0.18) !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            isolation: isolate;
            overflow: visible !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
          }

          .main-header h1 {
            font-size: clamp(1.05rem, 1.6vw, 1.35rem) !important;
            line-height: 1.15 !important;
            flex: 0 1 auto !important;
            margin-right: 1rem !important;
          }

          .main-header::before {
            content: '';
            position: absolute;
            inset: 0;
            z-index: -1;
            background: var(--bg-primary);
            background-image: var(--app-bg-gradient);
          }

          .main-header::after {
            content: '';
            position: absolute;
            left: 0;
            right: 0;
            bottom: -1px;
            height: 1px;
            background: var(--border-color);
            pointer-events: none;
          }

          .main-header .header-actions {
            flex: 1 1 auto !important;
            margin-left: auto !important;
            display: flex !important;
            align-items: center !important;
            justify-content: flex-end !important;
            gap: 0.75rem !important;
            min-width: 0 !important;
          }

          .main-header .btn-refresh {
            flex: 0 0 auto !important;
          }

          .main-header .db-indicator {
            flex: 0 1 auto !important;
            white-space: nowrap !important;
          }

          .stats-grid {
            margin-bottom: 0 !important;
          }

          .stat-card {
            min-height: 6.7rem !important;
            padding: 0.9rem 1rem !important;
          }

          .charts-grid,
          .recent-activity-grid {
            margin-top: 0 !important;
          }

          .chart-card {
            min-height: 17.5rem !important;
          }

          .chart-wrapper,
          .donut-chart-flex {
            min-height: 12rem !important;
          }

          .activity-card-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 1rem;
            margin-bottom: 0.8rem;
          }

          .activity-card-header h3 {
            margin: 0 0 0.2rem !important;
          }

          .activity-card-header p {
            margin: 0;
            color: var(--text-secondary);
            font-size: 0.82rem;
            line-height: 1.45;
          }

          .cancellation-card {
            overflow: visible !important;
          }

          .cancellation-count-btn {
            border: 0 !important;
            cursor: pointer !important;
            flex-shrink: 0;
            text-transform: uppercase;
          }

          .dashboard-cancellation-table {
            max-height: clamp(14rem, 36vh, 24rem) !important;
            min-height: 0 !important;
            overflow: auto !important;
            overscroll-behavior: contain;
          }

          .dashboard-cancellation-table .admin-table thead th {
            position: sticky !important;
            top: 0 !important;
            z-index: 20 !important;
          }

          .dashboard-cancellation-table .sticky-action-col {
            z-index: 12 !important;
          }

          .dashboard-cancellation-table .admin-table thead th.sticky-action-col {
            z-index: 24 !important;
          }

          .cancellation-mobile-list {
            display: none;
          }

          .cancellation-mobile-item {
            border: 1px solid var(--border-color);
            background: var(--bg-secondary);
            border-radius: var(--admin-radius);
            padding: 0.9rem;
          }

          .cancellation-mobile-top,
          .cancellation-mobile-actions {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.65rem;
            flex-wrap: wrap;
          }

          .cancellation-mobile-top {
            margin-bottom: 0.8rem;
          }

          .cancellation-mobile-grid {
            display: grid;
            grid-template-columns: max-content minmax(0, 1fr);
            gap: 0.35rem 0.85rem;
            margin-bottom: 0.8rem;
            font-size: 0.82rem;
          }

          .cancellation-mobile-grid span {
            color: var(--text-muted);
          }

          .cancellation-mobile-grid strong {
            color: var(--text-primary);
            overflow-wrap: anywhere;
          }

          .cancellation-mobile-item textarea {
            width: 100%;
            min-height: 4.5rem;
            resize: vertical;
            margin-bottom: 0.75rem;
          }

          @media (min-width: 1180px) {
            :root {
              --admin-sidebar-width: 15.5rem;
              --admin-gap: 1.1rem;
              --admin-panel-pad: 1.15rem;
            }

            .stat-val {
              font-size: 1.85rem !important;
            }

            .admin-table {
              font-size: 0.9rem !important;
            }
          }

          @media (max-width: 1100px) {
            :root {
              --admin-sidebar-width: 13rem;
              --admin-gap: 0.85rem;
              --admin-panel-pad: 0.9rem;
            }

            .admin-main {
              padding: 1rem !important;
              padding-top: 0 !important;
            }

            .charts-grid,
            .recent-activity-grid {
              grid-template-columns: 1fr !important;
            }

          }

          @media (max-width: 820px) {
            :root {
              --admin-sidebar-width: 100%;
              --admin-gap: 0.75rem;
              --admin-panel-pad: 0.85rem;
              --admin-control-height: 2.6rem;
            }

            .admin-container {
              display: block !important;
            }

            .admin-sidebar {
              position: sticky !important;
              top: 0 !important;
              width: 100% !important;
              min-width: 0 !important;
              height: auto !important;
              max-height: 44vh !important;
            }

            .admin-main {
              width: 100% !important;
              margin-left: 0 !important;
              padding: 0 0.85rem 0.85rem !important;
            }

            .stats-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }

            .section-head-btn,
            .main-header,
            .header-actions {
              align-items: stretch !important;
              flex-direction: column !important;
            }

            .section-head-btn > *,
            .header-actions > * {
              width: 100% !important;
            }

            .main-header {
              position: sticky !important;
              top: 0 !important;
              z-index: 900 !important;
              margin-left: -0.85rem !important;
              margin-right: -0.85rem !important;
              margin-top: 0 !important;
              padding: 0.75rem !important;
            }

            .main-header .header-actions {
              align-items: stretch !important;
              flex-direction: column !important;
              justify-content: flex-start !important;
              margin-left: 0 !important;
            }

            .main-header .db-indicator {
              white-space: normal !important;
            }

            .overview-tab {
              padding-bottom: 1rem !important;
            }

            .activity-card-header {
              align-items: stretch;
              flex-direction: column;
              gap: 0.75rem;
            }

            .cancellation-count-btn {
              width: fit-content !important;
            }

          }

          @media (max-width: 520px) {
            .stats-grid {
              grid-template-columns: 1fr !important;
            }

            .stat-card {
              min-height: 7rem !important;
            }

            .stat-val {
              font-size: 1.45rem !important;
            }

            .admin-table {
              min-width: 42rem !important;
            }

            .dashboard-cancellation-table {
              display: none !important;
            }

            .cancellation-mobile-list {
              display: flex;
              flex-direction: column;
              gap: 0.75rem;
            }

            .cancellation-mobile-actions .btn-table {
              flex: 1 1 8rem;
            }
          }
        `}</style>
      </div>
    </>
  );
}
