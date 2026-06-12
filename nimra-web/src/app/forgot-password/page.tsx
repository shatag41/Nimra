'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { sendRequest } from '../../utils/api';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Reset Password
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const res = await sendRequest({ type: 'requestOTP', email });
      if (res.success) {
        setMessage(res.message ?? 'OTP sent successfully.');
        setStep(2);
      } else {
        setError(res.message ?? 'Failed to request OTP.');
      }
    } catch {
      setError('Failed to request OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const res = await sendRequest({ type: 'resetPassword', email, otp, newPassword });
      if (res.success) {
        setMessage('Password reset successful. Redirecting to login...');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(res.message ?? 'Failed to reset password.');
      }
    } catch {
      setError('Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="auth-page">
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
          <div className="auth-card-header">
            <span className="auth-kicker">Account Recovery</span>
            <h2>Forgot Password</h2>
            <p>{step === 1 ? 'Enter your registered email to receive an OTP.' : 'Enter the OTP and set your new password.'}</p>
          </div>
          
          {error && <div className="auth-alert error">{error}</div>}
          {message && <div className="auth-alert success">{message}</div>}

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
                <input 
                  id="new-password"
                  type="password" 
                  placeholder="New password" 
                  className="auth-input" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required 
                />
              </div>
              <div>
                <button className="btn btn-primary auth-submit" type="submit" disabled={isLoading}>
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          )}

          <div className="auth-footer-link">
            Remember your password? <Link href="/login" className="auth-link">Login</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
