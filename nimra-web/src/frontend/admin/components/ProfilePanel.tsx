'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  deleteCustomerAccount,
  fetchAccountDeletionStatus,
  sendAccountDeletionOTP,
  verifyAccountDeletionOTP,
} from '@/utils/api';
import LogoutConfirmationModal from '@/frontend/customer/components/LogoutConfirmationModal';
import { CurrentUser } from '../hooks/useAdminData';

type DeleteStep = 'closed' | 'confirm' | 'active' | 'verify' | 'final';

interface ProfilePanelProps {
  currentUser: CurrentUser | null;
  isProfilePanelOpen: boolean;
  setIsProfilePanelOpen: (open: boolean) => void;
  profileForm: { name: string; email: string; phone: string };
  setProfileForm: React.Dispatch<React.SetStateAction<{ name: string; email: string; phone: string }>>;
  profileFeedback: { type: 'success' | 'error'; text: string } | null;
  setProfileFeedback: (feedback: { type: 'success' | 'error'; text: string } | null) => void;
  profileValidationErrors: { [key: string]: string };
  setProfileValidationErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  isProfileSaving: boolean;
  handleProfileSave: () => Promise<void>;
  onAccountDeleted: () => void;
}

export default function ProfilePanel({
  currentUser, isProfilePanelOpen, setIsProfilePanelOpen, profileForm, setProfileForm,
  profileFeedback, setProfileFeedback, profileValidationErrors, setProfileValidationErrors,
  isProfileSaving, handleProfileSave, onAccountDeleted,
}: ProfilePanelProps) {
  const [deleteStep, setDeleteStep] = useState<DeleteStep>('closed');
  const [deletionEmail, setDeletionEmail] = useState('');
  const [deletionOtp, setDeletionOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);
  const [processingDeletion, setProcessingDeletion] = useState(false);
  const verifyingOtpRef = useRef('');

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setInterval(() => setResendSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  useEffect(() => {
    if (!otpSent || deletionOtp.length !== 6 || !currentUser?.id || verifyingOtpRef.current === deletionOtp) return;
    verifyingOtpRef.current = deletionOtp;
    setOtpMessage('Verifying code...');
    verifyAccountDeletionOTP(currentUser.id, deletionEmail, deletionOtp).then((result) => {
      if (result.success && result.otpVerified) {
        setOtpVerified(true);
        setOtpMessage('Email verified successfully.');
        setDeleteStep('final');
      } else {
        setOtpVerified(false);
        setOtpMessage(result.message);
      }
    });
  }, [currentUser?.id, deletionEmail, deletionOtp, otpSent]);

  const beginDeletion = () => {
    setDeletionEmail(currentUser?.email || currentUser?.username || '');
    setDeletionOtp('');
    setOtpSent(false);
    setOtpVerified(false);
    setOtpMessage('');
    verifyingOtpRef.current = '';
    setIsProfilePanelOpen(false);
    setDeleteStep('confirm');
  };

  const closeDeletion = () => {
    if (processingDeletion) return;
    setDeleteStep('closed');
    setIsProfilePanelOpen(true);
  };

  const checkDeletionStatus = async () => {
    if (!currentUser?.id) return;
    setProcessingDeletion(true);
    const result = await fetchAccountDeletionStatus(currentUser.id);
    setProcessingDeletion(false);
    if (!result.success) return setOtpMessage(result.message);
    if (result.hasActiveOrders) return setDeleteStep('active');
    setDeleteStep('verify');
  };

  const sendDeletionOtp = async () => {
    if (!currentUser?.id) return;
    if (deletionEmail.trim().toLowerCase() !== String(currentUser.email || currentUser.username).trim().toLowerCase()) {
      setOtpMessage('The email address must match your registered email.');
      return;
    }
    setProcessingDeletion(true);
    const result = await sendAccountDeletionOTP(currentUser.id, deletionEmail);
    setProcessingDeletion(false);
    if (!result.success) return setOtpMessage(result.message);
    setOtpSent(true);
    setOtpVerified(false);
    setDeletionOtp('');
    verifyingOtpRef.current = '';
    setResendSeconds(60);
    setOtpMessage('OTP sent successfully to your registered email.');
  };

  const deleteAccount = async () => {
    if (!currentUser?.id || !otpVerified) return;
    setProcessingDeletion(true);
    const result = await deleteCustomerAccount(currentUser.id);
    setProcessingDeletion(false);
    if (!result.success) {
      setOtpMessage(result.message);
      setDeleteStep('verify');
      return;
    }
    setDeleteStep('closed');
    onAccountDeleted();
  };

  const deletionTitle = deleteStep === 'confirm' ? 'Delete Your Account?'
    : deleteStep === 'active' ? 'Active Order Detected'
    : deleteStep === 'final' ? 'Permanently Delete Account?'
    : 'Verify Your Email';
  const deletionDescription = deleteStep === 'confirm'
    ? 'Your Super Admin account will be permanently removed after email verification.'
    : deleteStep === 'active'
      ? 'This account cannot be deleted until all active orders are completed or cancelled.'
      : deleteStep === 'final'
        ? 'Email verification is complete. This action is permanent and cannot be undone.'
        : 'Confirm your registered email address and enter the verification code sent to it.';

  return <>
    {isProfilePanelOpen && <div className="profile-panel-overlay" onClick={() => setIsProfilePanelOpen(false)}>
      <div className="profile-panel" onClick={(event) => event.stopPropagation()}>
        <div className="profile-panel-header">
          <div><h2>Edit Profile</h2><p>Update your profile information</p></div>
          <div className="profile-header-actions">
            <button type="button" className="profile-delete-account" onClick={beginDeletion}>Delete Account</button>
            <button type="button" onClick={() => setIsProfilePanelOpen(false)} className="close-btn" aria-label="Close profile editor"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>
        </div>
        <div className="profile-panel-content">
          <div className="profile-avatar-section"><div className="profile-panel-avatar">{currentUser?.name?.[0] || 'A'}</div></div>
          <form className="profile-form" onSubmit={(event) => { event.preventDefault(); void handleProfileSave(); }}>
            <div className="form-group"><label htmlFor="profile-name">Full Name</label><input id="profile-name" type="text" value={profileForm.name} onChange={(event) => { setProfileForm((previous) => ({ ...previous, name: event.target.value })); if (profileValidationErrors.name) setProfileValidationErrors((previous) => ({ ...previous, name: '' })); }} className={`form-input ${profileValidationErrors.name ? 'form-input-error' : ''}`}/>{profileValidationErrors.name && <div className="form-input-error-message">{profileValidationErrors.name}</div>}</div>
            <div className="form-group"><label htmlFor="profile-email">Email Address</label><input id="profile-email" type="email" required autoComplete="email" title="Enter a valid email address" value={profileForm.email} onChange={(event) => { setProfileForm((previous) => ({ ...previous, email: event.target.value })); if (profileValidationErrors.email) setProfileValidationErrors((previous) => ({ ...previous, email: '' })); }} className={`form-input ${profileValidationErrors.email ? 'form-input-error' : ''}`} placeholder="your@email.com"/>{profileValidationErrors.email && <div className="form-input-error-message">{profileValidationErrors.email}</div>}</div>
            <div className="form-group"><label htmlFor="profile-phone">Phone Number</label><input id="profile-phone" type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} autoComplete="tel" title="Enter a valid 10-digit phone number" value={profileForm.phone} onChange={(event) => { const phone = event.target.value.replace(/\D/g, '').slice(0, 10); setProfileForm((previous) => ({ ...previous, phone })); if (profileValidationErrors.phone) setProfileValidationErrors((previous) => ({ ...previous, phone: '' })); }} className={`form-input ${profileValidationErrors.phone ? 'form-input-error' : ''}`} placeholder="9999999999"/>{profileValidationErrors.phone && <div className="form-input-error-message">{profileValidationErrors.phone}</div>}</div>
            {profileFeedback && <div className={`profile-feedback ${profileFeedback.type}`}>{profileFeedback.text}</div>}
            <div className="profile-actions"><button onClick={() => { setProfileFeedback(null); setIsProfilePanelOpen(false); }} className="btn btn-secondary" type="button">Cancel</button><button className="btn btn-primary" type="submit" disabled={isProfileSaving}>{isProfileSaving ? 'Saving...' : 'Save Changes'}</button></div>
          </form>
        </div>
      </div>
    </div>}
    <LogoutConfirmationModal
      isOpen={deleteStep !== 'closed'} onClose={closeDeletion}
      onConfirm={deleteStep === 'confirm' ? checkDeletionStatus : deleteStep === 'active' ? closeDeletion : deleteStep === 'final' ? deleteAccount : sendDeletionOtp}
      title={deletionTitle} description={deletionDescription}
      confirmText={deleteStep === 'confirm' ? 'Continue' : deleteStep === 'active' ? 'Keep Account' : deleteStep === 'final' ? 'Delete Permanently' : otpSent ? 'Waiting for Verification' : 'Send OTP'}
      confirmButtonClass="btn btn-error" isProcessing={processingDeletion}
      confirmDisabled={deleteStep === 'verify' && otpSent} showCancelButton={deleteStep !== 'active'} stableFlowLayout
      contentKey={`${deleteStep}-${otpSent ? 'otp' : 'email'}`}
    >
      {deleteStep === 'verify' && <div className="deletion-verification-fields"><label>Current Email Address<input type="email" value={deletionEmail} onChange={(event) => { setDeletionEmail(event.target.value); setOtpVerified(false); }} autoComplete="email"/></label>{otpSent && <label>OTP<input type="text" inputMode="numeric" maxLength={6} value={deletionOtp} onChange={(event) => { setDeletionOtp(event.target.value.replace(/\D/g, '').slice(0, 6)); setOtpVerified(false); setOtpMessage(''); }} autoComplete="one-time-code"/></label>}{otpMessage && <p className={otpVerified ? 'otp-message success' : 'otp-message'}>{otpMessage}</p>}{otpSent && <button type="button" className="resend-otp" onClick={sendDeletionOtp} disabled={resendSeconds > 0 || processingDeletion}>{resendSeconds > 0 ? `Resend OTP in ${resendSeconds}s` : 'Resend OTP'}</button>}</div>}
    </LogoutConfirmationModal>
  </>;
}
