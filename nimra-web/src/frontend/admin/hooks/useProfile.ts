import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { fetchUsers, requestEmailChangeOTP, saveUser } from '@/utils/api';
import type { CurrentUser } from './useAdminData';

export const useProfile = (
  currentUser: CurrentUser | null,
  setCurrentUser: React.Dispatch<React.SetStateAction<CurrentUser | null>>,
  showAlert: (text: string, type?: 'success' | 'error') => void
) => {
  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profileValidationErrors, setProfileValidationErrors] = useState<{ [key: string]: string }>({});
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isEmailVerificationPending, setIsEmailVerificationPending] = useState(false);
  const [emailChangeOtp, setEmailChangeOtp] = useState('');

  // Sync profileForm when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        name: currentUser.name || '',
        email: currentUser.email || currentUser.username || '',
        phone: currentUser.phone || '',
      });
      setProfileFeedback(null);
    }
  }, [currentUser]);

  // Disable body scroll when profile panel is open
  useEffect(() => {
    if (isProfilePanelOpen) {
      document.body.style.overflow = 'hidden';
      setProfileValidationErrors({});
      setProfileFeedback(null);
      setIsEmailVerificationPending(false);
      setEmailChangeOtp('');

      if (currentUser?.id) {
        let active = true;
        fetchUsers().then((users) => {
          if (!active) return;
          const storedUser = users.find((user) => String(user.ID) === String(currentUser.id));
          if (!storedUser) return;
          setProfileForm({
            name: storedUser.Name || currentUser.name || '',
            email: storedUser.Email || storedUser.Username || currentUser.email || currentUser.username || '',
            phone: storedUser.Mobile || currentUser.phone || '',
          });
        }).catch((error) => {
          console.warn('Unable to refresh the stored admin profile.', error);
        });
        return () => {
          active = false;
          document.body.style.overflow = '';
        };
      }
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [currentUser, isProfilePanelOpen]);

  const handleProfileSave = async () => {
    const trimmedName = (profileForm.name || '').trim();
    const trimmedEmail = (profileForm.email || '').trim();
    const trimmedPhone = (profileForm.phone || '').toString().trim();
    const errors: { [key: string]: string } = {};

    if (!trimmedName) {
      errors.name = 'Please enter your full name';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      errors.email = 'Please enter your email address';
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address (e.g., name@example.com)';
    }

    const phoneRegex = /^[0-9]{10}$/;
    const cleanedPhone = trimmedPhone.replace(/\D/g, '');
    if (trimmedPhone && !phoneRegex.test(cleanedPhone)) {
      errors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (Object.keys(errors).length > 0) {
      setProfileValidationErrors(errors);
      setProfileFeedback({ type: 'error', text: 'Please fix the errors below before saving.' });
      return;
    }

    setProfileValidationErrors({});
    const storedEmail = String(currentUser?.email || currentUser?.username || '').trim().toLowerCase();
    const emailChanged = trimmedEmail.toLowerCase() !== storedEmail;

    if (emailChanged && !isEmailVerificationPending) {
      if (!currentUser?.id) {
        setProfileFeedback({ type: 'error', text: 'Unable to identify the current admin account.' });
        return;
      }
      setIsProfileSaving(true);
      const otpResult = await requestEmailChangeOTP(currentUser.id, trimmedEmail);
      setIsProfileSaving(false);
      if (!otpResult.success) {
        setProfileFeedback({ type: 'error', text: otpResult.message || 'Unable to send the verification code.' });
        return;
      }
      setIsEmailVerificationPending(true);
      setEmailChangeOtp('');
      setProfileFeedback({ type: 'success', text: 'A verification code was sent to your new email address.' });
      return;
    }

    if (emailChanged && !/^\d{6}$/.test(emailChangeOtp)) {
      setProfileValidationErrors((previous) => ({ ...previous, otp: 'Enter the 6-digit verification code.' }));
      return;
    }

    setIsProfileSaving(true);
    setProfileFeedback(null);

    try {
      const existingCookie = Cookies.get('nimra_user');
      const parsedCookieUser = existingCookie ? JSON.parse(existingCookie) : null;
      const updatedSession = {
        ...(parsedCookieUser || {}),
        ID: currentUser?.id || parsedCookieUser?.ID || 0,
        Name: trimmedName,
        Username: trimmedEmail,
        Mobile: cleanedPhone,
        Role: currentUser?.role || parsedCookieUser?.Role || 'Admin',
        Active: true,
      };

      const saveResult = await saveUser(
        {
          ID: currentUser?.id || parsedCookieUser?.ID || 0,
          Name: trimmedName,
          Username: trimmedEmail,
          Mobile: cleanedPhone,
          ...(emailChanged ? { otp: emailChangeOtp } : {}),
        },
        'update'
      );

      if (!saveResult.success) {
        const message = saveResult.message || 'Unable to update profile';
        if (emailChanged) setProfileValidationErrors((previous) => ({ ...previous, otp: message }));
        setProfileFeedback({ type: 'error', text: message });
        return;
      }

      Cookies.set('nimra_user', JSON.stringify(updatedSession), { path: '/', sameSite: 'lax' });

      const updatedAdminSession = {
        id: currentUser?.id || parsedCookieUser?.ID || 0,
        username: trimmedEmail,
        role: currentUser?.role || 'ADMIN',
        name: trimmedName,
        email: trimmedEmail,
        phone: cleanedPhone,
      };

      localStorage.setItem('nimra_admin_user', JSON.stringify(updatedAdminSession));
      setCurrentUser(updatedAdminSession);
      setIsEmailVerificationPending(false);
      setEmailChangeOtp('');
      setProfileFeedback({ type: 'success', text: 'Profile updated successfully. Your admin details are now saved.' });
      showAlert('Profile updated successfully!', 'success');
      window.setTimeout(() => {
        setIsProfilePanelOpen(false);
        setProfileFeedback(null);
      }, 800);
    } catch (error) {
      console.error('Failed to save admin profile', error);
      setProfileFeedback({ type: 'error', text: 'Unable to save your profile right now. Please try again.' });
    } finally {
      setIsProfileSaving(false);
    }
  };

  return {
    isProfilePanelOpen,
    setIsProfilePanelOpen,
    profileForm,
    setProfileForm,
    profileFeedback,
    setProfileFeedback,
    profileValidationErrors,
    setProfileValidationErrors,
    isProfileSaving,
    isEmailVerificationPending,
    emailChangeOtp,
    setEmailChangeOtp,
    handleProfileSave,
  };
};

export type ProfileHook = ReturnType<typeof useProfile>;
