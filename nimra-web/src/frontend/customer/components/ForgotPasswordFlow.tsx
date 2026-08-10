'use client';

import React, { useEffect, useState } from 'react';
import { sendRequest } from '@/utils/api';
import { useNotification } from '@/frontend/customer/contexts/NotificationContext';
import LoadingButton from '@/frontend/shared/LoadingButton';
import OtpResendPrompt from './OtpResendPrompt';

type Props = { initialEmail?: string; fixedEmail?: boolean; onSuccess?: () => void; className?: string; submitClassName?: string };

/** Shared OTP password-recovery UI for login and authenticated settings. */
export default function ForgotPasswordFlow({ initialEmail = '', fixedEmail = false, onSuccess, className = '', submitClassName = 'btn btn-primary auth-submit' }: Props) {
  const { notify } = useNotification();
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => setEmail(initialEmail), [initialEmail]);
  useEffect(() => {
    if (step !== 2 || resendSeconds <= 0) return;
    const timer = window.setInterval(() => setResendSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds, step]);

  const requestOtp = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const result = await sendRequest({ type: 'requestOTP', email });
      if (!result.success) return notify.error('OTP Failed', result.message ?? 'Failed to request OTP.');
      notify.success('OTP Sent', result.message ?? 'OTP sent successfully.');
      setStep(2); setResendSeconds(30);
    } catch { notify.error('OTP Error', 'Failed to request OTP.'); }
    finally { setIsLoading(false); }
  };
  const resetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isLoading) return;
    if (newPassword.length < 4) return notify.error('Invalid Password', 'New password must be at least 4 characters.');
    if (newPassword !== confirmPassword) return notify.error('Mismatch', 'New passwords do not match.');
    setIsLoading(true);
    try {
      const result = await sendRequest({ type: 'resetPassword', email, otp, newPassword });
      if (!result.success) return notify.error('Reset Failed', result.message ?? 'Failed to reset password.');
      notify.success('Password Reset', 'Password reset successful!'); onSuccess?.();
    } catch { notify.error('Reset Error', 'Failed to reset password.'); }
    finally { setIsLoading(false); }
  };

  return <div className={className}>{step === 1 ? <form className="auth-form" onSubmit={(event) => { event.preventDefault(); void requestOtp(); }}>
    <div className="auth-field"><label htmlFor="recovery-email">Registered Email</label><input id="recovery-email" type="email" className="auth-input" value={email} onChange={(event) => setEmail(event.target.value)} disabled={fixedEmail} required /></div>
    <LoadingButton className={submitClassName} type="submit" isLoading={isLoading} loadingText="Sending OTP...">Send OTP</LoadingButton>
  </form> : <form className="auth-form" onSubmit={resetPassword}>
    <div className="auth-field"><label htmlFor="recovery-email-confirmed">Email</label><input id="recovery-email-confirmed" type="email" className="auth-input" value={email} disabled /></div>
    <div className="auth-field"><label htmlFor="recovery-otp">Enter OTP</label><input id="recovery-otp" type="text" inputMode="numeric" maxLength={6} className="auth-input" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} required /></div>
    <OtpResendPrompt seconds={resendSeconds} isLoading={isLoading} onResend={() => void requestOtp()} />
    <div className="auth-field"><label htmlFor="recovery-new-password">New Password</label><input id="recovery-new-password" type="password" className="auth-input" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" minLength={4} required /></div>
    <div className="auth-field"><label htmlFor="recovery-confirm-password">Confirm New Password</label><input id="recovery-confirm-password" type="password" className="auth-input" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={4} required /></div>
    <LoadingButton className={submitClassName} type="submit" isLoading={isLoading} loadingText="Saving...">Reset Password</LoadingButton>
  </form>}</div>;
}
