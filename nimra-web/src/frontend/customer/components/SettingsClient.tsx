'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/frontend/customer/hooks/useAuth';
import {
  changeAccountPassword,
  deleteCustomerAccount,
  fetchEmailPreferences,
  saveEmailPreferences,
} from '@/utils/api';
import type { EmailPreferences } from '@/types/cms';
import CustomerPageHeader from './CustomerPageHeader';

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
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
  const [preferencesError, setPreferencesError] = useState('');
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login?next=/settings');
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

  const handlePreferenceSave = async () => {
    if (!user?.ID || !preferences) return;
    setSavingPreferences(true);
    const result = await saveEmailPreferences(user.ID, preferences);
    setSavingPreferences(false);
    if (result.success && result.preferences) {
      setPreferences(result.preferences);
      updateUserSession({ ...user, EmailPreferences: JSON.stringify(result.preferences) });
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.ID) return;
    if (newPassword.length < 6) return toast.error('New password must be at least 6 characters.');
    if (newPassword !== confirmPassword) return toast.error('New passwords do not match.');
    if (currentPassword === newPassword) return toast.error('Choose a password different from your current password.');

    setChangingPassword(true);
    const result = await changeAccountPassword(user.ID, currentPassword, newPassword);
    setChangingPassword(false);
    if (result.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const handleAccountDelete = async () => {
    if (!user?.ID || deleteConfirmation !== 'DELETE') return;
    setDeletingAccount(true);
    const result = await deleteCustomerAccount(user.ID, deletePassword);
    setDeletingAccount(false);
    if (!result.success) return toast.error(result.message);
    toast.success(result.message);
    clearSession();
    window.location.replace('/');
  };

  if (!mounted || isLoading || (!isAuthenticated && !user)) {
    return <main className="settings-loading">Loading account settings…</main>;
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
            {!showDelete ? (
              <button className="settings-btn danger-outline" onClick={() => setShowDelete(true)}>Delete Account</button>
            ) : (
              <div className="delete-confirmation">
                <p>This action cannot be undone. Enter your password and type <strong>DELETE</strong> to continue.</p>
                <label>Current Password<input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} autoComplete="current-password" /></label>
                <label>Confirmation<input type="text" value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value)} placeholder="Type DELETE" autoComplete="off" /></label>
                <div className="delete-actions">
                  <button className="settings-btn secondary" onClick={() => { setShowDelete(false); setDeletePassword(''); setDeleteConfirmation(''); }}>Cancel</button>
                  <button className="settings-btn danger-solid" onClick={handleAccountDelete} disabled={deletingAccount || !deletePassword || deleteConfirmation !== 'DELETE'}>{deletingAccount ? 'Deleting…' : 'Delete Permanently'}</button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      <style jsx>{`
        .settings-page { min-height: 100vh; padding: 2rem 1rem 3rem; background: var(--bg-primary); color: var(--text-primary); }
        .settings-shell { display: grid; gap: clamp(1.5rem, 3.5vw, 2.5rem); width: min(1100px, 100%); margin: 0 auto; }
        .settings-grid { display: grid; grid-template-columns: minmax(280px, .82fr) minmax(420px, 1.18fr); gap: 1rem; align-items: start; }
        .setting-card { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-xl); box-shadow: var(--shadow-md); padding: 1.25rem; }
        .preferences-card { grid-row: span 2; }
        .card-heading { display: flex; align-items: flex-start; gap: .8rem; margin-bottom: 1.15rem; }
        .card-heading h2 { margin: 0 0 .25rem; font-size: 1.05rem; }
        .card-heading p { margin: 0; color: var(--text-secondary); font-size: .78rem; line-height: 1.5; }
        .card-icon { width: 36px; height: 36px; display: grid; place-items: center; flex: 0 0 auto; color: var(--primary-color); background: color-mix(in srgb, var(--primary-color) 10%, transparent); border: 1px solid color-mix(in srgb, var(--primary-color) 22%, transparent); border-radius: 10px; }
        .card-icon :global(svg) { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
        .card-icon.danger { color: #dc2626; background: rgba(220,38,38,.08); border-color: rgba(220,38,38,.18); }
        .settings-form, .delete-confirmation { display: grid; gap: .8rem; }
        label { display: grid; gap: .35rem; color: var(--text-secondary); font-size: .75rem; font-weight: 700; }
        input[type='password'], input[type='text'] { width: 100%; min-height: 40px; padding: .65rem .75rem; color: var(--text-primary); background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); font: inherit; outline: none; }
        input:focus { border-color: var(--primary-color); box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 12%, transparent); }
        .settings-btn { min-height: 38px; padding: .55rem .9rem; border: 1px solid transparent; border-radius: var(--radius-md); font: inherit; font-size: .78rem; font-weight: 800; cursor: pointer; transition: transform var(--transition-fast), opacity var(--transition-fast), background var(--transition-fast); }
        .settings-btn:hover:not(:disabled) { transform: translateY(-1px); }
        .settings-btn:disabled { opacity: .55; cursor: not-allowed; }
        .settings-btn.primary { color: white; background: var(--primary-color); }
        .settings-form .settings-btn { justify-self: start; margin-top: .15rem; }
        .preference-list { border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; }
        .preference-row { position: relative; grid-template-columns: 1fr auto; align-items: center; gap: 1rem; padding: .85rem .95rem; border-bottom: 1px solid var(--border-color); cursor: pointer; }
        .preference-row:last-child { border-bottom: 0; }
        .preference-row > span:first-child { display: grid; gap: .15rem; }
        .preference-row strong { color: var(--text-primary); font-size: .82rem; }
        .preference-row small { color: var(--text-muted); font-size: .7rem; font-weight: 500; line-height: 1.4; }
        .preference-row input { position: absolute; opacity: 0; pointer-events: none; }
        .toggle { width: 38px; height: 22px; padding: 2px; display: flex; align-items: center; background: var(--border-color); border-radius: 999px; transition: background var(--transition-fast); }
        .toggle span { width: 18px; height: 18px; background: white; border-radius: 50%; box-shadow: 0 1px 4px rgba(0,0,0,.2); transition: transform var(--transition-fast); }
        .preference-row input:checked + .toggle { background: var(--primary-color); }
        .preference-row input:checked + .toggle span { transform: translateX(16px); }
        .preference-row input:focus-visible + .toggle { outline: 3px solid color-mix(in srgb, var(--primary-color) 25%, transparent); outline-offset: 2px; }
        .preference-footer { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-top: 1rem; }
        .preference-footer > span { color: var(--text-muted); font-size: .7rem; }
        .preference-skeleton, .load-error { min-height: 230px; display: grid; place-items: center; align-content: center; gap: .65rem; color: var(--text-secondary); border: 1px dashed var(--border-color); border-radius: var(--radius-lg); font-size: .82rem; }
        .load-error p { margin: 0; }
        .load-error button { border: 0; background: transparent; color: var(--primary-color); font-weight: 700; cursor: pointer; }
        .danger-card { border-color: rgba(220,38,38,.2); }
        .danger-outline { color: #dc2626; background: transparent; border-color: rgba(220,38,38,.35); }
        .danger-solid { color: white; background: #dc2626; }
        .secondary { color: var(--text-primary); background: var(--bg-tertiary); border-color: var(--border-color); }
        .delete-confirmation { padding-top: .8rem; border-top: 1px solid var(--border-color); }
        .delete-confirmation p { margin: 0 0 .15rem; color: var(--text-secondary); font-size: .75rem; line-height: 1.5; }
        .delete-actions { display: flex; justify-content: flex-end; gap: .55rem; margin-top: .25rem; }
        @media (max-width: 800px) {
          .settings-grid { grid-template-columns: 1fr; }
          .preferences-card { grid-row: auto; }
        }
        @media (max-width: 560px) {
          .settings-page { padding: 1.25rem .75rem 2rem; }
          .setting-card { padding: 1rem; }
          .preference-row { padding: .75rem; }
          .preference-footer { align-items: stretch; flex-direction: column; }
          .preference-footer .settings-btn { width: 100%; }
          .delete-actions { flex-direction: column-reverse; }
          .delete-actions .settings-btn { width: 100%; }
        }
      `}</style>
    </main>
  );
}
