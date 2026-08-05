'use client';

import React, { useMemo, useState } from 'react';
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
import LogoutConfirmationModal from '@/frontend/customer/components/LogoutConfirmationModal';
import LoadingState from '@/frontend/customer/components/LoadingState';
import { isSuperAdmin, normalizeRole } from '../utils/accessControl';
const AdminManagementTab = dynamic(() => import('./EnterpriseTabs').then((mod) => mod.AdminManagementTab), { ssr: false });
const SuperAdminOverview = dynamic(() => import('./SuperAdminDashboard'), { ssr: false });


// Dynamically loaded Modals & Profile
const ProfilePanel = dynamic(() => import('./ProfilePanel'), { ssr: false });
const OrderModal = dynamic(() => import('./OrderModal'), { ssr: false });
const ProductModal = dynamic(() => import('./ProductModal'), { ssr: false });
const BannerModal = dynamic(() => import('./BannerModal'), { ssr: false });
const FAQModal = dynamic(() => import('./FAQModal'), { ssr: false });
const UserModal = dynamic(() => import('./UserModal'), { ssr: false });

// Lazy-loaded Tab components
const DashboardTab = dynamic(() => import('./DashboardTab'), {
  ssr: false,
  loading: () => <LoadingState label="Loading dashboard" compact />,
});
const OrdersTab = dynamic(() => import('./OrdersTab'), {
  ssr: false,
  loading: () => <LoadingState label="Loading orders" compact />,
});
const ProductsTab = dynamic(() => import('./ProductsTab'), {
  ssr: false,
  loading: () => <LoadingState label="Loading products" compact />,
});
const BannersTab = dynamic(() => import('./BannersTab'), {
  ssr: false,
  loading: () => <LoadingState label="Loading banners" compact />,
});
const FAQsTab = dynamic(() => import('./FAQsTab'), {
  ssr: false,
  loading: () => <LoadingState label="Loading FAQs" compact />,
});
const InquiriesTab = dynamic(() => import('./InquiriesTab'), {
  ssr: false,
  loading: () => <LoadingState label="Loading inquiries" compact />,
});
const UsersTab = dynamic(() => import('./UsersTab'), {
  ssr: false,
  loading: () => <LoadingState label="Loading customers" compact />,
});
const NotificationsTab = dynamic(() => import('./NotificationsTab'), {
  ssr: false,
  loading: () => <LoadingState label="Loading notifications" compact />,
});
const SettingsTab = dynamic(() => import('./SettingsTab'), {
  ssr: false,
  loading: () => <LoadingState label="Loading settings" compact />,
});

interface AdminPortalClientProps {
  initialCMSData: CMSData;
}

export default function AdminPortalClient({ initialCMSData }: AdminPortalClientProps) {
  // 1. Data hook
  const {
    currentUser,
    setCurrentUser,
    activeTab,
    setActiveTab,
    orders,
    inquiries,
    users,
    notifications,
    adminUpdates,
    cancellationRequests,
    products,
    banners,
    faqs,
    companyInfo,
    loading,
    hasLoadedLiveData,
    loadError,
    isLoggingOut,
    saveLoading,
    showAlert,
    refreshData,
    performLogout,
    handleUpdateStatusSubmit,
    handleCancellationReview,
    handleInquiryReview,
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  React.useEffect(() => {
    if (!isMobileSidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileSidebarOpen(false);
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isMobileSidebarOpen]);

  const handleNavigateToOrdersWithFilter = (statusFilter: string, view: 'active' | 'cancellations', startDate?: string) => {
    filters.setOrderStatusFilter(statusFilter);
    setOrdersView(view);
    if (startDate) {
      filters.setOrderStartDate(startDate);
      filters.setOrderEndDate('');
    } else {
      filters.setOrderStartDate('');
      filters.setOrderEndDate('');
    }
    setActiveTab('orders');
  };

  const handleSidebarTabChange = (tab: any) => {
    if (tab === 'orders') {
      filters.setOrderStatusFilter('All');
      filters.setOrderStartDate('');
      filters.setOrderEndDate('');
      setOrdersView('active');
    }
    setActiveTab(tab);
    setIsMobileSidebarOpen(false);
  };

  // Clear contextual filter when leaving the orders page or opening Orders directly
  React.useEffect(() => {
    if (activeTab !== 'orders') {
      filters.setOrderStatusFilter('All');
      filters.setOrderStartDate('');
      filters.setOrderEndDate('');
      setOrdersView('active');
    }
  }, [activeTab]);

  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [productFormOpen, setProductFormOpen] = useState(false);

  const [editingBanner, setEditingBanner] = useState<Partial<Banner> | null>(null);
  const [bannerFormOpen, setBannerFormOpen] = useState(false);

  const [editingFAQ, setEditingFAQ] = useState<Partial<FAQ> | null>(null);
  const [faqFormOpen, setFAQFormOpen] = useState(false);

  const [editingUser, setEditingUser] = useState<Partial<AdminUser> | null>(null);
  const [userFormOpen, setUserFormOpen] = useState(false);

  // Filtered collections
  const filteredOrders = useMemo(() => filterOrders(
    orders,
    searchLower,
    filters.orderStatusFilter,
    filters.orderPaymentFilter,
    filters.orderSort,
    filters.orderStartDate,
    filters.orderEndDate
  ), [filters.orderEndDate, filters.orderPaymentFilter, filters.orderSort, filters.orderStartDate, filters.orderStatusFilter, orders, searchLower]);

  const filteredProducts = useMemo(() => filterProducts(
    products,
    searchLower,
    filters.productCategoryFilter,
    filters.productStatusFilter
  ), [filters.productCategoryFilter, filters.productStatusFilter, products, searchLower]);

  const filteredBanners = useMemo(() => filterBanners(banners, searchLower, filters.bannerStatusFilter), [banners, filters.bannerStatusFilter, searchLower]);

  const filteredFaqs = useMemo(() => filterFAQs(faqs, searchLower, filters.faqStatusFilter), [faqs, filters.faqStatusFilter, searchLower]);

  const filteredInquiries = useMemo(() => filterInquiries(
    inquiries,
    searchLower,
    filters.inquirySort,
    filters.inquiryStartDate,
    filters.inquiryEndDate
  ), [filters.inquiryEndDate, filters.inquirySort, filters.inquiryStartDate, inquiries, searchLower]);

  const customerUsers = useMemo(() => users.filter(
    (user) => !['ADMIN', 'SUPER_ADMIN'].includes(normalizeRole(user.Role))
  ), [users]);
  const filteredCustomers = useMemo(() => filterUsers(
    customerUsers,
    searchLower,
    filters.customerStatusFilter
  ), [customerUsers, filters.customerStatusFilter, searchLower]);

  const adminUsers = useMemo(() => users.filter(
    (user) => ['ADMIN', 'SUPER_ADMIN'].includes(normalizeRole(user.Role))
  ), [users]);
  const filteredAdmins = useMemo(() => filterUsers(
    adminUsers,
    searchLower,
    filters.customerStatusFilter
  ), [adminUsers, filters.customerStatusFilter, searchLower]);

  const filteredNotifications = useMemo(() => filterNotifications(
    notifications,
    searchLower,
    filters.notificationSort
  ), [filters.notificationSort, notifications, searchLower]);

  // Submits callbacks mapping to states
  const onUpdateOrderStatus = async (e: React.FormEvent, customerMessage?: string) => {
    e.preventDefault();
    if (!selectedOrder) return;
    const success = await handleUpdateStatusSubmit(selectedOrder.orderId, orderStatusVal, customerMessage);
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
    const success = await handleUserSubmit({ ...editingUser, Role: 'Customer' });
    if (success) {
      setUserFormOpen(false);
    }
  };

  if (!currentUser) return <LoadingState label="Verifying admin session" />;

  const renderShell = (content: React.ReactNode) => (
    <>
      <div className="admin-container">
        <Sidebar
          currentUser={currentUser}
          activeTab={activeTab}
          setActiveTab={handleSidebarTabChange}
          isProfilePanelOpen={profile.isProfilePanelOpen}
          isMobileOpen={isMobileSidebarOpen}
          onToggleMobile={() => setIsMobileSidebarOpen((open) => !open)}
          onEditProfile={() => {
            setIsMobileSidebarOpen(false);
            profile.setIsProfilePanelOpen(true);
          }}
          onLogout={() => {
            setIsMobileSidebarOpen(false);
            setIsLogoutModalOpen(true);
          }}
        />
        <button
          type="button"
          className={`admin-sidebar-backdrop ${isMobileSidebarOpen ? 'mobile-open' : ''}`}
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-label="Close admin navigation"
          tabIndex={isMobileSidebarOpen ? 0 : -1}
        />
        <main className={`admin-main admin-page-${activeTab} animate-fade-in fixed-page ${profile.isProfilePanelOpen ? 'blur-background' : ''}`}>
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
            isMobileSidebarOpen={isMobileSidebarOpen}
            toggleMobileSidebar={() => setIsMobileSidebarOpen((open) => !open)}
            hasActiveFilters={false}
          />
          <div className={`tab-viewport ${loading ? 'is-refreshing' : ''}`}>{content}</div>
        </main>
      </div>
      <LogoutConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => {
          if (!isLoggingOut) setIsLogoutModalOpen(false);
        }}
        onConfirm={() => performLogout(() => setIsLogoutModalOpen(false))}
        isProcessing={isLoggingOut}
        stableFlowLayout
      />
    </>
  );

  if (!hasLoadedLiveData) {
    return renderShell(loadError ? (
      <div className="admin-live-data-error card glass" role="alert">
        <h2>Unable to sync live dashboard data</h2>
        <p>{loadError || 'Please check the Google Sheets connection and try again.'}</p>
        <button type="button" className="btn btn-primary" onClick={() => void refreshData()} disabled={loading}>
          {loading ? 'Retrying...' : 'Retry Sync'}
        </button>
      </div>
    ) : (
      <LoadingState label="Syncing live dashboard data" compact />
    ));
  }

  return (
    <>
      <div className="admin-container">
        {/* SIDEBAR */}
        <Sidebar
          currentUser={currentUser}
          activeTab={activeTab}
          setActiveTab={handleSidebarTabChange}
          isProfilePanelOpen={profile.isProfilePanelOpen}
          isMobileOpen={isMobileSidebarOpen}
          onToggleMobile={() => setIsMobileSidebarOpen((open) => !open)}
          onEditProfile={() => {
            setIsMobileSidebarOpen(false);
            profile.setIsProfilePanelOpen(true);
          }}
          onLogout={() => {
            setIsMobileSidebarOpen(false);
            setIsLogoutModalOpen(true);
          }}
        />

        <button
          type="button"
          className={`admin-sidebar-backdrop ${isMobileSidebarOpen ? 'mobile-open' : ''}`}
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-label="Close admin navigation"
          tabIndex={isMobileSidebarOpen ? 0 : -1}
        />

        {/* MAIN VIEW */}
        <main className={`admin-main admin-page-${activeTab} animate-fade-in fixed-page ${profile.isProfilePanelOpen ? 'blur-background' : ''}`}>
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
            isMobileSidebarOpen={isMobileSidebarOpen}
            toggleMobileSidebar={() => setIsMobileSidebarOpen((open) => !open)}
            hasActiveFilters={
              (activeTab === 'orders' && (
                filters.orderStatusFilter !== 'All' ||
                filters.orderPaymentFilter !== 'All' ||
                filters.orderSort !== 'latest' ||
                filters.orderStartDate !== '' ||
                filters.orderEndDate !== ''
              )) ||
              (activeTab === 'products' && (
                filters.productCategoryFilter !== 'All' ||
                filters.productStatusFilter !== 'All'
              )) ||
              (activeTab === 'banners' && (
                filters.bannerStatusFilter !== 'All'
              )) ||
              (activeTab === 'faqs' && (
                filters.faqStatusFilter !== 'All'
              )) ||
              (activeTab === 'inquiries' && (
                filters.inquirySort !== 'latest' ||
                filters.inquiryStartDate !== '' ||
                filters.inquiryEndDate !== ''
              )) ||
              (activeTab === 'users' && (
                filters.customerStatusFilter !== 'All'
              )) ||
              (activeTab === 'admins' && (
                filters.customerStatusFilter !== 'All'
              ))
            }
          />

          {/* ALERTS DEPRECATED - now handled by sonner */}

          {/* TAB CONTENTS */}
          <div className={`tab-viewport ${loading ? 'is-refreshing' : ''}`}>
              {activeTab === 'dashboard' && isSuperAdmin(currentUser.role) && (
                <SuperAdminOverview
                  orders={orders}
                  users={users}
                  products={products}
                  inquiries={inquiries}
                  cancellationRequests={cancellationRequests}
                  notifications={adminUpdates}
                  onNavigate={setActiveTab}
                  onOpenCancellationRequests={() => handleNavigateToOrdersWithFilter('All', 'cancellations')}
                />
              )}

              {activeTab === 'dashboard' && !isSuperAdmin(currentUser.role) && (
                <DashboardTab
                  orders={orders}
                  products={products}
                  users={users}
                  filteredInquiries={filteredInquiries}
                  filteredOrders={filteredOrders}
                  cancellationRequests={cancellationRequests}
                  onReviewCancellation={handleCancellationReview}
                  onOpenCancellationRequests={() => {
                    handleNavigateToOrdersWithFilter('All', 'cancellations');
                  }}
                  onNavigateToOrdersWithFilter={handleNavigateToOrdersWithFilter}
                  setActiveTab={setActiveTab}
                  notifications={adminUpdates}
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
                  handleInquiryReview={handleInquiryReview}
                  saveLoading={saveLoading}
                />
              )}

              {activeTab === 'users' && (
                <UsersTab
                  currentUser={currentUser}
                  customers={filteredCustomers}
                  orders={orders}
                  cancellationRequests={cancellationRequests}
                  showFilters={filters.showFilters}
                  customerStatusFilter={filters.customerStatusFilter}
                  setCustomerStatusFilter={filters.setCustomerStatusFilter}
                  setEditingUser={setEditingUser}
                  setUserFormOpen={setUserFormOpen}
                  handleUserDelete={handleUserDelete}
                />
              )}

              {isSuperAdmin(currentUser.role) && activeTab === 'admins' && (
                <AdminManagementTab
                  users={filteredAdmins}
                  currentUserId={currentUser.id}
                  showFilters={filters.showFilters}
                  adminStatusFilter={filters.customerStatusFilter}
                  setAdminStatusFilter={filters.setCustomerStatusFilter}
                  onSave={handleUserSubmit}
                  onDelete={handleUserDelete}
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
          onClose={() => {
            if (!isLoggingOut) setIsLogoutModalOpen(false);
          }}
          onConfirm={() => performLogout(() => setIsLogoutModalOpen(false))}
          isProcessing={isLoggingOut}
          processingText="Logging out..."
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
          isEmailVerificationPending={profile.isEmailVerificationPending}
          emailChangeOtp={profile.emailChangeOtp}
          setEmailChangeOtp={profile.setEmailChangeOtp}
          handleProfileSave={profile.handleProfileSave}
          onAccountDeleted={performLogout}
        />
      </div>
    </>
  );
}
