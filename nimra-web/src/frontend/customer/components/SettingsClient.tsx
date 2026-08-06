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
import LoadingButton from '@/frontend/shared/LoadingButton';

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
    document.documentElement.classList.add('settings-scroll-page');
    document.body.classList.add('settings-scroll-page');
    return () => {
      document.documentElement.classList.remove('settings-scroll-page');
      document.body.classList.remove('settings-scroll-page');
    };
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
    if (savingPreferences) return;
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
    if (changingPassword) return;
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
    if (sendingOtp) return;
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
        <div className="settings-hero">
          <CustomerPageHeader
            badge="SETTINGS"
            title="Account Settings"
            subtitle="Manage security, communication preferences, and your NIMRA account."
          />
        </div>

        <div className="settings-grid">
          <section className="setting-card settings-card password-card">
            <div className="card-heading">
              <span className="card-icon section-icon"><SettingsIcon type="lock" /></span>
              <div><h2 className="section-title">Change Password</h2><p>Update the password used to access your account.</p></div>
            </div>
            <form onSubmit={handlePasswordChange} className="settings-form">
              <label>Current Password<input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" required /></label>
              <label>New Password<input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" minLength={6} required /></label>
              <label>Confirm New Password<input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" minLength={6} required /></label>
              <button className="settings-btn primary" disabled={changingPassword}>{changingPassword ? 'Updating…' : 'Update Password'}</button>
            </form>
          </section>

          <section className="setting-card settings-card preferences-card">
            <div className="card-heading preference-heading">
              <span className="card-icon section-icon"><SettingsIcon type="mail" /></span>
              <div><h2 className="section-title">Email Preferences</h2><p>Choose which messages you want to receive.</p></div>
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

          <section className="setting-card settings-card danger-card">
            <div className="card-heading">
              <span className="card-icon section-icon danger"><SettingsIcon type="trash" /></span>
              <div><h2 className="section-title">Delete Account</h2><p>Permanently remove your profile and saved account information.</p></div>
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
          .settings-page {
            width: 100%;
            max-width: 100%;
            min-width: 0;
            padding: 0.5rem 0.65rem calc(var(--mobile-nav-height, 4.25rem) + 5.5rem + env(safe-area-inset-bottom));
            overflow-x: hidden;
          }
          .settings-shell,
          .settings-grid,
          .setting-card,
          .card-heading,
          .card-heading > div,
          .settings-form,
          .preference-list,
          .preference-row,
          .preference-row > span:first-child {
            width: 100%;
            max-width: 100%;
            min-width: 0;
            box-sizing: border-box;
          }
          .settings-shell { gap: 0.8rem; }
          .settings-grid { gap: 0.8rem; }
          .settings-page .setting-card.settings-card {
            padding: 0.75rem !important;
            border-radius: 0.85rem;
          }
          .card-heading {
            align-items: center;
            gap: 0.38rem;
            margin-bottom: 0.45rem;
          }
          .settings-page .settings-card .card-heading h2.section-title {
            margin: 0 0 0.08rem;
            font-size: clamp(18px, 4.8vw, 21px) !important;
            line-height: 1.2 !important;
            font-weight: 700 !important;
            overflow-wrap: anywhere !important;
          }
          .card-heading p {
            font-size: clamp(0.62rem, 2.8vw, 0.66rem);
            line-height: 1.32;
            overflow-wrap: anywhere;
          }
          .settings-page .settings-card .card-icon.section-icon {
            width: 1.5rem !important;
            height: 1.5rem !important;
            flex-basis: 1.5rem !important;
            border-radius: 0.36rem;
          }
          .settings-page .settings-card .card-icon.section-icon :global(svg) {
            width: 0.72rem !important;
            height: 0.72rem !important;
          }
          .settings-form {
            gap: 0.45rem;
          }
          label {
            min-width: 0;
            gap: 0.22rem;
            font-size: 0.72rem;
            overflow-wrap: anywhere;
          }
          input[type='password'],
          input[type='text'],
          input[type='email'] {
            max-width: 100%;
            min-width: 0;
            min-height: 2.75rem;
            padding: 0.55rem 0.7rem;
            font-size: 0.8rem;
          }
          .settings-btn {
            min-height: 2.75rem;
            padding: 0.55rem 0.8rem;
            font-size: 0.75rem;
            touch-action: manipulation;
          }
          .settings-form .settings-btn {
            width: 100%;
            justify-self: stretch;
          }
          .preference-row {
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 0.65rem;
            min-height: 3.75rem;
            padding: 0.6rem;
          }
          .preference-row strong,
          .preference-row small,
          .preference-footer > span,
          .delete-confirmation p {
            max-width: 100%;
            white-space: normal;
            overflow-wrap: anywhere;
          }
          .preference-row strong { font-size: 0.76rem; }
          .preference-row small { font-size: 0.67rem; line-height: 1.35; }
          .toggle { flex: 0 0 auto; }
          .preference-footer { align-items: stretch; flex-direction: column; }
          .preference-footer .settings-btn { width: 100%; }
          .delete-actions { flex-direction: column-reverse; }
          .delete-actions .settings-btn { width: 100%; }
        }

        @media (max-width: 768px) {
          :global(html.settings-scroll-page),
          :global(body.settings-scroll-page) {
            height: auto !important;
            min-height: 100% !important;
            overflow-x: clip !important;
            overflow-y: visible !important;
          }

          :global(.mobile-navbar) {
            position: fixed !important;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
          }

          :global(.ds-main.settings-route-main),
          :global(.settings-route-main > .settings-route-transition) {
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            transform: none !important;
            filter: none !important;
            contain: none !important;
            will-change: auto !important;
          }

          :global(.ds-main.settings-route-main) {
            padding-top: 0 !important;
          }

          .settings-page {
            padding-top: var(--mobile-navbar-height, 64px) !important;
            overflow: visible !important;
            transform: none !important;
            filter: none !important;
            contain: none !important;
          }

          .settings-shell {
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            transform: none !important;
            filter: none !important;
            contain: none !important;
          }

          .settings-hero {
            position: relative !important;
            top: auto !important;
            z-index: auto !important;
            display: block !important;
            width: 100%;
            max-width: 100%;
            min-width: 0;
            height: auto !important;
            max-height: none !important;
            margin-top: 0;
            overflow: hidden !important;
            transform: none !important;
            filter: none !important;
            contain: none !important;
            isolation: auto;
            background: #f8fbff !important;
            opacity: 1 !important;
            border-bottom: 1px solid rgba(37, 99, 235, 0.18);
            box-shadow: 0 7px 18px rgba(37, 99, 235, 0.1);
          }

          :global(.settings-page .settings-hero > .customer-page-header) {
            position: relative !important;
            top: auto !important;
            z-index: auto !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding-top: 0.65rem !important;
            padding-bottom: 0.7rem !important;
            overflow: visible !important;
            isolation: isolate;
            background:
              radial-gradient(circle at 18% 18%, rgba(147, 197, 253, 0.34), transparent 32%),
              radial-gradient(circle at 83% 52%, rgba(125, 211, 252, 0.28), transparent 34%),
              linear-gradient(110deg, #edf6ff 0%, #ffffff 49%, #dff5ff 100%) !important;
            box-shadow: 0 8px 22px rgba(37, 99, 235, 0.1) !important;
            transform: none !important;
            -webkit-transform: none !important;
            animation: none !important;
          }

          :global([data-theme="dark"] .settings-page .settings-hero > .customer-page-header) {
            background:
              radial-gradient(circle at 18% 18%, rgba(37, 99, 235, 0.24), transparent 34%),
              radial-gradient(circle at 83% 52%, rgba(14, 165, 233, 0.18), transparent 34%),
              linear-gradient(110deg, #081525 0%, #0f172a 48%, #0b2436 100%) !important;
          }

          .settings-page .settings-card .card-heading {
            align-items: center !important;
            gap: 0.34rem !important;
            margin-bottom: 0.38rem !important;
          }

          .settings-page .settings-card .card-heading h2.section-title {
            margin: 0.2rem 0 0.1rem !important;
            font-size: 1.05rem !important;
            font-weight: 700 !important;
            line-height: 1.25 !important;
            letter-spacing: normal !important;
          }

          .settings-page .settings-card .card-heading p {
            margin: 0 !important;
            font-size: 0.66rem !important;
            line-height: 1.3 !important;
          }

          .settings-page .settings-card .card-icon.section-icon {
            width: 1.375rem !important;
            height: 1.375rem !important;
            flex: 0 0 1.375rem !important;
            border-radius: 0.35rem !important;
          }

          .settings-page .settings-card .card-icon.section-icon :global(svg) {
            width: 0.68rem !important;
            height: 0.68rem !important;
          }

          .settings-grid {
            margin-top: 0 !important;
          }
        }
      `}</style>
    </main>
  );
}
