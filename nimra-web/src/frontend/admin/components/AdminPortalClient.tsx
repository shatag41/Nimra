'use client';

import React, { useState } from 'react';
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
import { isSuperAdmin, normalizeRole } from '../utils/accessControl';
const AdminManagementTab = dynamic(() => import('./EnterpriseTabs').then((mod) => mod.AdminManagementTab), { ssr: false });
const LogsTab = dynamic(() => import('./EnterpriseTabs').then((mod) => mod.LogsTab), { ssr: false });
const RolesPermissionsTab = dynamic(() => import('./EnterpriseTabs').then((mod) => mod.RolesPermissionsTab), { ssr: false });
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
  loading: () => null,
});
const OrdersTab = dynamic(() => import('./OrdersTab'), {
  ssr: false,
  loading: () => null,
});
const ProductsTab = dynamic(() => import('./ProductsTab'), {
  ssr: false,
  loading: () => null,
});
const BannersTab = dynamic(() => import('./BannersTab'), {
  ssr: false,
  loading: () => null,
});
const FAQsTab = dynamic(() => import('./FAQsTab'), {
  ssr: false,
  loading: () => null,
});
const InquiriesTab = dynamic(() => import('./InquiriesTab'), {
  ssr: false,
  loading: () => null,
});
const UsersTab = dynamic(() => import('./UsersTab'), {
  ssr: false,
  loading: () => null,
});
const NotificationsTab = dynamic(() => import('./NotificationsTab'), {
  ssr: false,
  loading: () => null,
});
const SettingsTab = dynamic(() => import('./SettingsTab'), {
  ssr: false,
  loading: () => null,
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

  const handleNavigateToOrdersWithFilter = (statusFilter: string, view: 'active' | 'cancellations', startDate?: string) => {
    filters.setOrderStatusFilter(statusFilter);
    setOrdersView(view);
    if (startDate) {
      filters.setOrderStartDate(startDate);
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

  const customerUsers = users.filter((user) => normalizeRole(user.Role) === 'CUSTOMER');
  const filteredUsers = filterUsers(
    customerUsers,
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

  if (!currentUser) return null;

  return (
    <>
      <div className="admin-container">
        {/* SIDEBAR */}
        <Sidebar
          currentUser={currentUser}
          activeTab={activeTab}
          setActiveTab={handleSidebarTabChange}
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

          {/* ALERTS DEPRECATED - now handled by sonner */}

          {/* TAB CONTENTS */}
          <div className={`tab-viewport ${loading ? 'is-refreshing' : ''}`}>
              {activeTab === 'dashboard' && isSuperAdmin(currentUser.role) && (
                <SuperAdminOverview orders={orders} users={users} products={products} inquiries={inquiries} notifications={notifications} onNavigate={setActiveTab} />
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

              {isSuperAdmin(currentUser.role) && activeTab === 'admins' && (
                <AdminManagementTab users={users} onSave={handleUserSubmit} onDelete={handleUserDelete} />
              )}

              {isSuperAdmin(currentUser.role) && activeTab === 'roles' && <RolesPermissionsTab />}

              {isSuperAdmin(currentUser.role) && activeTab === 'logs' && <LogsTab />}

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
      </div>
    </>
  );
}
