'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/frontend/customer/contexts/NotificationContext';
import { useAuth } from '@/frontend/customer/hooks/useAuth';
import {
  changeAccountPassword,
  deleteCustomerAccount,
  fetchAccountDeletionStatus,
  fetchEmailPreferences,
  sendAccountDeletionOTP,
  saveEmailPreferences,
  verifyAccountDeletionOTP,
} from '@/utils/api';
import type { EmailPreferences } from '@/types/cms';
import { clearCustomerOrdersCache } from '@/frontend/customer/hooks/useCustomerOrders';
import CustomerPageHeader from './CustomerPageHeader';
import LogoutConfirmationModal from './LogoutConfirmationModal';

type DeleteStep = 'closed' | 'confirm' | 'active' | 'verify';

const preferenceOptions: Array<{
  key: keyof EmailPreferences;
  label: string;
  description: string;
}> = [
  { key: 'orderConfirmation', label: 'Order Confirmation', description: 'Receipt and confirmation after placing an order.' },
  { key: 'orderStatusUpdates', label: 'Order Status Updates', description: 'Changes to processing, fulfillment, and delivery status.' },
];

function SettingsIcon({ type }: { type: 'lock' | 'mail' | 'trash' }) {
  if (type === 'mail') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>;
  }
  if (type === 'trash') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/></svg>;
}

export default function SettingsClient() {
  const { user, isAuthenticated, isLoading, clearSession, updateUserSession } = useAuth();
  const { notify } = useNotification();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
  const [preferencesError, setPreferencesError] = useState('');
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [deleteStep, setDeleteStep] = useState<DeleteStep>('closed');
  const [deletionEmail, setDeletionEmail] = useState('');
  const [deletionOtp, setDeletionOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [accountDeleted, setAccountDeleted] = useState(false);
  const [checkingDeletion, setCheckingDeletion] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const verifyingOtpRef = useRef('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/');
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!user?.ID) return;
    let active = true;
    setPreferencesError('');
    fetchEmailPreferences(user.ID).then((result) => {
      if (!active) return;
      if (result.success && result.preferences) setPreferences(result.preferences);
      else setPreferencesError(result.message || 'Unable to load email preferences.');
    });
    return () => { active = false; };
  }, [user?.ID]);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setInterval(() => setResendSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  useEffect(() => {
    if (!otpSent || deletionOtp.length !== 6 || !user?.ID || verifyingOtpRef.current === deletionOtp) return;
    verifyingOtpRef.current = deletionOtp;
    setOtpMessage('Verifying code...');
    verifyAccountDeletionOTP(user.ID, deletionEmail, deletionOtp).then((result) => {
      if (result.success && result.otpVerified) {
        setOtpVerified(true);
        setOtpMessage('Email verified successfully.');
      } else {
        setOtpVerified(false);
        setOtpMessage(result.message);
      }
    });
  }, [deletionEmail, deletionOtp, otpSent, user?.ID]);

  const handlePreferenceSave = async () => {
    if (!user?.ID || !preferences) return;
    setSavingPreferences(true);
    const result = await saveEmailPreferences(user.ID, preferences);
    setSavingPreferences(false);
    if (result.success && result.preferences) {
      setPreferences(result.preferences);
      updateUserSession({ ...user, EmailPreferences: JSON.stringify(result.preferences) });
      notify.success('Preferences Saved', result.message);
    } else {
      notify.error('Save Failed', result.message);
    }
  };

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.ID) return;
    if (newPassword.length < 6) return notify.error('Invalid Password', 'New password must be at least 6 characters.');
    if (newPassword !== confirmPassword) return notify.error('Mismatch', 'New passwords do not match.');
    if (currentPassword === newPassword) return notify.error('Same Password', 'Choose a password different from your current password.');

    setChangingPassword(true);
    const result = await changeAccountPassword(user.ID, currentPassword, newPassword);
    setChangingPassword(false);
    if (result.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      notify.success('Password Updated', result.message);
    } else {
      notify.error('Update Failed', result.message);
    }
  };

  const handleAccountDelete = async () => {
    if (!user?.ID || !otpVerified) return;
    setDeletingAccount(true);
    const result = await deleteCustomerAccount(user.ID);
    if (!result.success) {
      setDeletingAccount(false);
      return notify.error('Delete Failed', result.message);
    }
    setAccountDeleted(true);
    closeAfterDeletion();
  };

  const checkDeletionStatus = async () => {
    if (!user?.ID) return;
    setCheckingDeletion(true);
    const result = await fetchAccountDeletionStatus(user.ID);
    setCheckingDeletion(false);
    if (!result.success) return notify.error('Unable to Check Orders', result.message);
    if (result.hasActiveOrders) return setDeleteStep('active');
    setDeletionEmail(String(user.Username || ''));
    setDeleteStep('verify');
  };

  const sendDeletionOtp = async () => {
    if (!user?.ID) return;
    if (deletionEmail.trim().toLowerCase() !== String(user.Username || '').trim().toLowerCase()) {
      setOtpMessage('The email address must match your registered email.');
      return;
    }
    setSendingOtp(true);
    const result = await sendAccountDeletionOTP(user.ID, deletionEmail);
    setSendingOtp(false);
    if (!result.success) {
      setOtpMessage(result.message);
      if (result.hasActiveOrders) setDeleteStep('active');
      return;
    }
    setOtpSent(true);
    setOtpVerified(false);
    setDeletionOtp('');
    verifyingOtpRef.current = '';
    setResendSeconds(60);
    setOtpMessage('');
    notify.success('OTP Sent', 'OTP sent successfully to your registered email.');
  };

  const closeAfterDeletion = () => {
    if (user?.ID) {
      localStorage.removeItem(`nimra-cart-${user.ID}`);
      clearCustomerOrdersCache(user.ID);
    }
    notify.custom({ type: 'success', title: 'Account deleted successfully', durationMs: 3000 });
    clearSession();
    router.replace('/');
  };

  const deletionModalTitle = deleteStep === 'confirm' ? 'Delete Your Account?'
    : deleteStep === 'active' ? 'Active Order Detected'
    : 'Verify Your Email';
  const deletionModalDescription = deleteStep === 'confirm'
    ? "You're about to permanently delete your NIMRA account. Before proceeding, we'll check if you have any active orders."
    : deleteStep === 'active'
      ? 'You currently have one or more active orders. Your account cannot be deleted until your active orders are cancelled and the cancellation request has been reviewed by an administrator.'
      : 'Confirm your registered email address and enter the verification code to securely delete your account.';
  const deletionModalConfirmText = deleteStep === 'confirm' ? 'Continue'
    : deleteStep === 'active' ? 'Cancel Active Order(s)'
    : otpSent ? 'Delete Permanently' : 'Send OTP';
  const handleDeletionModalConfirm = deleteStep === 'confirm' ? checkDeletionStatus
    : deleteStep === 'active' ? () => { sessionStorage.setItem('nimra-delete-account-cancellation-flow', '1'); router.push('/orders'); }
    : otpSent ? handleAccountDelete : sendDeletionOtp;

  if (!mounted || isLoading || accountDeleted || (!isAuthenticated && !user)) {
    return (
      <main className="settings-loading" aria-live="polite" aria-busy="true">
        <span className="settings-loading-bar" />
        <span className="settings-loading-bar short" />
        <span className="settings-loading-card" />
        <p>{accountDeleted ? 'Account deleted. Redirecting…' : 'Loading account settings…'}</p>
        <style jsx>{`
          .settings-loading { min-height:70vh; display:grid; align-content:center; gap:.8rem; width:min(760px,calc(100% - 2rem)); margin:auto; color:var(--text-secondary); }
          .settings-loading-bar,.settings-loading-card { border-radius:14px; background:linear-gradient(90deg,var(--bg-secondary),color-mix(in srgb,var(--primary-color) 10%,var(--bg-secondary)),var(--bg-secondary)); background-size:200% 100%; animation:settings-shimmer 1.2s infinite linear; }
          .settings-loading-bar { width:62%; height:24px; }.settings-loading-bar.short { width:38%; height:14px; }.settings-loading-card { height:220px; }
          .settings-loading p { margin:0; font-size:.85rem; } @keyframes settings-shimmer { to { background-position:-200% 0; } }
        `}</style>
      </main>
    );
  }

  return (
    <main className="settings-page">
      <div className="settings-shell">
        <CustomerPageHeader
          badge="SETTINGS"
          title="Account Settings"
          subtitle="Manage security, communication preferences, and your NIMRA account."
        />

        <div className="settings-grid">
          <section className="setting-card password-card">
            <div className="card-heading">
              <span className="card-icon"><SettingsIcon type="lock" /></span>
              <div><h2>Change Password</h2><p>Update the password used to access your account.</p></div>
            </div>
            <form onSubmit={handlePasswordChange} className="settings-form">
              <label>Current Password<input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" required /></label>
              <label>New Password<input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" minLength={6} required /></label>
              <label>Confirm New Password<input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" minLength={6} required /></label>
              <button className="settings-btn primary" disabled={changingPassword}>{changingPassword ? 'Updating…' : 'Update Password'}</button>
            </form>
          </section>

          <section className="setting-card preferences-card">
            <div className="card-heading preference-heading">
              <span className="card-icon"><SettingsIcon type="mail" /></span>
              <div><h2>Email Preferences</h2><p>Choose which messages you want to receive.</p></div>
            </div>
            {preferencesError ? (
              <div className="load-error"><p>{preferencesError}</p><button onClick={() => window.location.reload()}>Try Again</button></div>
            ) : !preferences ? (
              <div className="preference-skeleton" aria-label="Loading email preferences">Loading preferences…</div>
            ) : (
              <>
                <div className="preference-list">
                  {preferenceOptions.map((option) => (
                    <label className="preference-row" key={option.key}>
                      <span><strong>{option.label}</strong><small>{option.description}</small></span>
                      <input
                        type="checkbox"
                        checked={preferences[option.key]}
                        onChange={(event) => setPreferences((current) => current ? { ...current, [option.key]: event.target.checked } : current)}
                      />
                      <span className="toggle" aria-hidden="true"><span /></span>
                    </label>
                  ))}
                </div>
                <div className="preference-footer">
                  <span>Preferences are synced to your account.</span>
                  <button className="settings-btn primary" onClick={handlePreferenceSave} disabled={savingPreferences}>{savingPreferences ? 'Saving…' : 'Save Preferences'}</button>
                </div>
              </>
            )}
          </section>

          <section className="setting-card danger-card">
            <div className="card-heading">
              <span className="card-icon danger"><SettingsIcon type="trash" /></span>
              <div><h2>Delete Account</h2><p>Permanently remove your profile and saved account information.</p></div>
            </div>
            <button className="settings-btn danger-outline" onClick={() => setDeleteStep('confirm')}>Delete Account</button>
          </section>
        </div>
      </div>

      <LogoutConfirmationModal
        isOpen={deleteStep !== 'closed'}
        onClose={() => setDeleteStep('closed')}
        onConfirm={handleDeletionModalConfirm}
        title={deletionModalTitle}
        description={deletionModalDescription}
        confirmText={deletionModalConfirmText}
        cancelText={deleteStep === 'active' ? 'Keep My Account' : 'Cancel'}
        confirmButtonClass="btn btn-error"
        isProcessing={checkingDeletion || sendingOtp || deletingAccount}
        confirmDisabled={deleteStep === 'verify' && otpSent && !otpVerified}
        showCancelButton
        contentKey={`${deleteStep}-${otpSent ? 'otp' : 'email'}`}
        stableFlowLayout
      >
        {deleteStep === 'verify' && <div className="deletion-verification-fields">
          <label>Current Email Address<input type="email" value={deletionEmail} onChange={(event) => { setDeletionEmail(event.target.value); setOtpVerified(false); }} autoComplete="email" /></label>
          {otpSent && <label>OTP<input type="text" inputMode="numeric" maxLength={6} value={deletionOtp} onChange={(event) => { setDeletionOtp(event.target.value.replace(/\D/g, '').slice(0, 6)); setOtpVerified(false); setOtpMessage(''); }} autoComplete="one-time-code" /></label>}
          {otpMessage && <p className={otpVerified ? 'otp-message success' : 'otp-message'}>{otpMessage}</p>}
          {otpSent && <button type="button" className="resend-otp" onClick={sendDeletionOtp} disabled={resendSeconds > 0 || sendingOtp}>{resendSeconds > 0 ? `Resend OTP in ${resendSeconds}s` : 'Resend OTP'}</button>}
        </div>}
      </LogoutConfirmationModal>
      <style jsx>{`
        .settings-page { min-height: 100vh; padding: 0.5rem 1rem 2rem; background: var(--bg-primary); color: var(--text-primary); }
        .settings-shell { display: grid; gap: clamp(1rem, 2vw, 1.25rem); width: min(1100px, 100%); margin: 0 auto; }
        
        :global(.settings-page .customer-page-header) {
          padding-block: clamp(0.6rem, 1.5vw, 0.9rem) !important;
          margin-bottom: 0 !important;
        }
        :global(.settings-page .customer-page-header h1) {
          font-size: clamp(1.1rem, 1.3vw, 1.25rem) !important;
        }

        .settings-grid { display: grid; grid-template-columns: minmax(280px, .82fr) minmax(420px, 1.18fr); gap: 1rem; align-items: start; }
        .setting-card { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-xl); box-shadow: var(--shadow-md); padding: .7rem; }
        .preferences-card { grid-row: span 2; }
        .card-heading { display: flex; align-items: flex-start; gap: .4rem; margin-bottom: .4rem; }
        .card-heading h2 { margin: 0 0 .1rem; font-size: .95rem; }
        .card-heading p { margin: 0; color: var(--text-secondary); font-size: .75rem; line-height: 1.35; }
        .card-icon { width: 28px; height: 28px; display: grid; place-items: center; flex: 0 0 auto; color: var(--primary-color); background: color-mix(in srgb, var(--primary-color) 10%, transparent); border: 1px solid color-mix(in srgb, var(--primary-color) 22%, transparent); border-radius: 8px; }
        .card-icon :global(svg) { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
        .card-icon.danger { color: #dc2626; background: rgba(220,38,38,.08); border-color: rgba(220,38,38,.18); }
        .settings-form, .delete-confirmation { display: grid; gap: .3rem; }
        label { display: grid; gap: .1rem; color: var(--text-secondary); font-size: .7rem; font-weight: 700; }
        input[type='password'], input[type='text'], input[type='email'] { width: 100%; min-height: 28px; padding: .2rem .4rem; color: var(--text-primary); background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); font: inherit; font-size: .75rem; outline: none; }
        input:focus { border-color: var(--primary-color); box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 12%, transparent); }
        .settings-btn { min-height: 26px; padding: .25rem .6rem; border: 1px solid transparent; border-radius: var(--radius-md); font: inherit; font-size: .7rem; font-weight: 800; cursor: pointer; transition: transform var(--transition-fast), opacity var(--transition-fast), background var(--transition-fast); }
        .settings-btn:hover:not(:disabled) { transform: translateY(-1px); }
        .settings-btn:disabled { opacity: .55; cursor: not-allowed; }
        .settings-btn.primary { color: white; background: var(--primary-color); }
        .settings-form .settings-btn { justify-self: start; margin-top: .1rem; }
        .preference-list { border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; }
        .preference-row { position: relative; grid-template-columns: 1fr auto; align-items: center; gap: 0.75rem; padding: .65rem .75rem; border-bottom: 1px solid var(--border-color); cursor: pointer; }
        .preference-row:last-child { border-bottom: 0; }
        .preference-row > span:first-child { display: grid; gap: .1rem; }
        .preference-row strong { color: var(--text-primary); font-size: .8rem; }
        .preference-row small { color: var(--text-muted); font-size: .7rem; font-weight: 500; line-height: 1.3; }
        .preference-row input { position: absolute; opacity: 0; pointer-events: none; }
        .toggle { width: 34px; height: 20px; padding: 2px; display: flex; align-items: center; background: var(--border-color); border-radius: 999px; transition: background var(--transition-fast); }
        .toggle span { width: 16px; height: 16px; background: white; border-radius: 50%; box-shadow: 0 1px 4px rgba(0,0,0,.2); transition: transform var(--transition-fast); }
        .preference-row input:checked + .toggle { background: var(--primary-color); }
        .preference-row input:checked + .toggle span { transform: translateX(14px); }
        .preference-row input:focus-visible + .toggle { outline: 3px solid color-mix(in srgb, var(--primary-color) 25%, transparent); outline-offset: 2px; }
        .preference-footer { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; margin-top: 0.75rem; }
        .preference-footer > span { color: var(--text-muted); font-size: .7rem; }
        .preference-skeleton, .load-error { min-height: 200px; display: grid; place-items: center; align-content: center; gap: .5rem; color: var(--text-secondary); border: 1px dashed var(--border-color); border-radius: var(--radius-lg); font-size: .8rem; }
        .load-error p { margin: 0; }
        .load-error button { border: 0; background: transparent; color: var(--primary-color); font-weight: 700; cursor: pointer; }
        .danger-card { border-color: rgba(220,38,38,.2); }
        .danger-outline { color: #dc2626; background: transparent; border-color: rgba(220,38,38,.35); }
        .danger-solid { color: white; background: #dc2626; }
        .secondary { color: var(--text-primary); background: var(--bg-tertiary); border-color: var(--border-color); }
        .delete-confirmation { padding-top: .6rem; border-top: 1px solid var(--border-color); }
        .delete-confirmation p { margin: 0 0 .15rem; color: var(--text-secondary); font-size: .75rem; line-height: 1.4; }
        .delete-actions { display: flex; justify-content: flex-end; gap: .55rem; margin-top: .25rem; }
        .deletion-verification-fields { display: grid; gap: .45rem; }
        .deletion-verification-fields label { gap: .15rem; font-size: .7rem; }
        .deletion-verification-fields input { min-height: 30px; padding: .3rem .5rem; }
        .otp-message { margin: 0; color: #dc2626; font-size: .7rem; }
        .otp-message.success { color: #16a34a; }
        .resend-otp { justify-self: start; padding: 0; color: var(--primary-color); background: transparent; border: 0; font: inherit; font-size: .7rem; font-weight: 700; cursor: pointer; }
        .resend-otp:disabled { color: var(--text-muted); cursor: not-allowed; }
        @media (max-width: 800px) {
          .settings-grid { grid-template-columns: 1fr; }
          .preferences-card { grid-row: auto; }
        }
        @media (max-width: 560px) {
          .settings-page { padding: 0.5rem .75rem 1.5rem; }
          .setting-card { padding: 0.85rem; }
          .preference-row { padding: .65rem; }
          .preference-footer { align-items: stretch; flex-direction: column; }
          .preference-footer .settings-btn { width: 100%; }
          .delete-actions { flex-direction: column-reverse; }
          .delete-actions .settings-btn { width: 100%; }
        }
      `}</style>
    </main>
  );
}
