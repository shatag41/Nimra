'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { sendRequest } from '@/utils/api';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/frontend/customer/contexts/NotificationContext';

export default function ForgotPasswordPage() {
  const { notify } = useNotification();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Reset Password
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await sendRequest({ type: 'requestOTP', email });
      if (res.success) {
        notify.success('OTP Sent', res.message ?? 'OTP sent successfully.');
        setStep(2);
      } else {
        notify.error('OTP Failed', res.message ?? 'Failed to request OTP.');
      }
    } catch {
      notify.error('OTP Error', 'Failed to request OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await sendRequest({ type: 'resetPassword', email, otp, newPassword });
      if (res.success) {
        notify.success('Password Reset', 'Password reset successful! Redirecting to login...');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        notify.error('Reset Failed', res.message ?? 'Failed to reset password.');
      }
    } catch {
      notify.error('Reset Error', 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <style dangerouslySetInnerHTML={{__html: `
        .auth-shell.glass {
          width: clamp(300px, 60vw, 720px) !important;
          grid-template-columns: 42% 58% !important;
        }
      `}} />
      <div className="auth-shell glass">
        <aside className="auth-brand-panel">
          <div className="auth-brand-content">
            <div className="auth-logo">
              <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 5C50 5 15 45 15 65C15 84.33 30.67 100 50 100C69.33 100 85 84.33 85 65C85 45 50 5 50 5Z" fill="url(#forgotWaterGrad)"/>
                <path d="M43 75C37 75 32 70 32 64C32 63.45 32.45 63 33 63C33.55 63 34 63.45 34 64C34 68.97 38.03 73 43 73C43.55 73 44 73.45 44 74C44 74.55 43.55 75 43 75Z" fill="white" fillOpacity="0.6"/>
                <defs>
                  <linearGradient id="forgotWaterGrad" x1="50" y1="5" x2="50" y2="100" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00E5FF"/>
                    <stop offset="1" stopColor="#00a299"/>
                  </linearGradient>
                </defs>
              </svg>
              <span>NIMRA</span>
            </div>
            <h1>Reset access securely.</h1>
            <p>Verify your registered email and create a new password for your NIMRA account.</p>
            <div className="auth-highlights">
              <div className="auth-highlight"><strong>OTP</strong><span>email verification</span></div>
              <div className="auth-highlight"><strong>Quick</strong><span>password recovery</span></div>
              <div className="auth-highlight"><strong>Safe</strong><span>account access</span></div>
            </div>
          </div>
          <div className="auth-brand-footer">Secure recovery for NIMRA portal accounts</div>
        </aside>

        <div className="auth-card">
          <div style={{ maxWidth: '300px', margin: '0 auto', width: '100%' }}>
          <div className="auth-card-header" style={{ marginBottom: '0.8vh', textAlign: 'center' }}>
            <span className="auth-kicker">Account Recovery</span>
            <h2>Forgot Password</h2>
            <p>{step === 1 ? 'Enter your registered email to receive an OTP.' : 'Enter the OTP and set your new password.'}</p>
          </div>

          {step === 1 ? (
            <form className="auth-form" onSubmit={handleRequestOTP}>
              <div className="auth-field">
                <label htmlFor="email">Registered Email</label>
                <input 
                  id="email"
                  type="email" 
                  placeholder="john@example.com" 
                  className="auth-input" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              <div>
                <button className="btn btn-primary auth-submit" type="submit" disabled={isLoading}>
                  {isLoading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </div>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleResetPassword}>
              <div className="auth-field">
                <label htmlFor="reset-email">Email</label>
                <input 
                  id="reset-email"
                  type="email" 
                  className="auth-input" 
                  value={email}
                  disabled 
                />
              </div>
              <div className="auth-field">
                <label htmlFor="otp">Enter OTP</label>
                <input 
                  id="otp"
                  type="text" 
                  placeholder="6-digit OTP" 
                  className="auth-input" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required 
                />
              </div>
              <div className="auth-field">
                <label htmlFor="new-password">New Password</label>
                <div className="auth-input-wrapper" style={{ position: 'relative' }}>
                  <input 
                    id="new-password"
                    type={showPassword ? "text" : "password"} 
                    placeholder="New password" 
                    className="auth-input" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required 
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle-btn"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <button className="btn btn-primary auth-submit" type="submit" disabled={isLoading}>
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          )}

          <div className="auth-footer-link" style={{ textAlign: 'center', marginTop: '0.8vh', fontSize: 'clamp(0.75rem, 1.6vh, 0.85rem)', color: 'var(--text-secondary)' }}>
            Remember your password? <Link href="/login" style={{ color: 'var(--primary-color)', fontWeight: 'bold', textDecoration: 'none' }}>Login</Link>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
