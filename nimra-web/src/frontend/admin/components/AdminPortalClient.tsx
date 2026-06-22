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
      </div>
    </>
  );
}
