import { useState } from 'react';

export const useAdminFilters = () => {
  const [globalSearch, setGlobalSearch] = useState('');
  const [showFilters, setShowFilters] = useState(true);

  // Filters State
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('All');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');
  const [productStatusFilter, setProductStatusFilter] = useState('All');
  const [bannerStatusFilter, setBannerStatusFilter] = useState('All');
  const [faqStatusFilter, setFaqStatusFilter] = useState('All');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [userStatusFilter, setUserStatusFilter] = useState('All');

  // Date sorting and Date range Filter States
  const [orderSort, setOrderSort] = useState('latest');
  const [orderStartDate, setOrderStartDate] = useState('');
  const [orderEndDate, setOrderEndDate] = useState('');

  const [inquirySort, setInquirySort] = useState('latest');
  const [inquiryStartDate, setInquiryStartDate] = useState('');
  const [inquiryEndDate, setInquiryEndDate] = useState('');

  const [notificationSort, setNotificationSort] = useState('latest');

  // Clear Filter Handlers
  const handleClearOrderFilters = () => {
    setOrderStatusFilter('All');
    setOrderPaymentFilter('All');
    setOrderSort('latest');
    setOrderStartDate('');
    setOrderEndDate('');
  };

  const handleClearProductFilters = () => {
    setProductCategoryFilter('All');
    setProductStatusFilter('All');
  };

  const handleClearBannerFilters = () => {
    setBannerStatusFilter('All');
  };

  const handleClearFaqFilters = () => {
    setFaqStatusFilter('All');
  };

  const handleClearInquiryFilters = () => {
    setInquirySort('latest');
    setInquiryStartDate('');
    setInquiryEndDate('');
  };

  const handleClearUserFilters = () => {
    setUserRoleFilter('All');
    setUserStatusFilter('All');
  };

  return {
    globalSearch,
    setGlobalSearch,
    showFilters,
    setShowFilters,
    orderStatusFilter,
    setOrderStatusFilter,
    orderPaymentFilter,
    setOrderPaymentFilter,
    productCategoryFilter,
    setProductCategoryFilter,
    productStatusFilter,
    setProductStatusFilter,
    bannerStatusFilter,
    setBannerStatusFilter,
    faqStatusFilter,
    setFaqStatusFilter,
    userRoleFilter,
    setUserRoleFilter,
    userStatusFilter,
    setUserStatusFilter,
    orderSort,
    setOrderSort,
    orderStartDate,
    setOrderStartDate,
    orderEndDate,
    setOrderEndDate,
    inquirySort,
    setInquirySort,
    inquiryStartDate,
    setInquiryStartDate,
    inquiryEndDate,
    setInquiryEndDate,
    notificationSort,
    setNotificationSort,
    handleClearOrderFilters,
    handleClearProductFilters,
    handleClearBannerFilters,
    handleClearFaqFilters,
    handleClearInquiryFilters,
    handleClearUserFilters,
  };
};

export type AdminFiltersHook = ReturnType<typeof useAdminFilters>;
