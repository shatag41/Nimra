'use client';

import React, { useState } from 'react';
import { useAuth } from '@/frontend/customer/contexts/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import Link from 'next/link';
import { sendRequest } from '@/utils/api';
import { useNotification } from '@/frontend/customer/contexts/NotificationContext';

export default function LoginPage() {
  const { login } = useAuth();
  const { notify } = useNotification();
  const [activeTab, setActiveTab] = useState<'mobile' | 'email'>('mobile');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    if (activeTab === 'mobile') {
      const trimmedUsername = username.trim();
      if (!trimmedUsername) {
        setError('Mobile number is required');
        return false;
      }
      if (!/^\d{10}$/.test(trimmedUsername)) {
        setError('Please enter a valid 10-digit mobile number');
        return false;
      }
    } else {
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        setError('Email is required');
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        setError('Please enter a valid email address');
        return false;
      }
    }

    if (!password) {
      setError('Password is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      const loginIdentifier = activeTab === 'mobile' ? username.trim() : email.trim();
      const res = await sendRequest({ type: 'login', username: loginIdentifier, password });
      if (res.success && res.user) {
        login(res.user);
        notify.success('Login Successful', `Welcome back, ${res.user.Name}!`);
      } else {
        setError(res.message ?? 'Login failed. Please try again.');
        notify.error('Login Failed', res.message ?? 'Login failed.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
      notify.error('Login Error', 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (accessToken: string) => {
    try {
      setError('');
      const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!profileRes.ok) {
        throw new Error('Failed to load Google profile.');
      }

      const payload = await profileRes.json();

      const res = await sendRequest({ 
        type: 'googleSignIn', 
        email: payload.email, 
        name: payload.name 
      });

      if (res.success && res.user) {
        login(res.user);
        notify.success('Login Successful', `Welcome back, ${res.user.Name}!`);
      } else {
        setError(res.message ?? 'Google Sign-In failed.');
        notify.error('Login Failed', res.message ?? 'Google Sign-In failed.');
      }
    } catch {
      setError('Google Sign-In failed.');
      notify.error('Login Error', 'Google Sign-In failed.');
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => handleGoogleSuccess(tokenResponse.access_token),
    onError: () => setError('Google Sign-In failed'),
  });

  return (
    <section className="auth-page">
      <style dangerouslySetInnerHTML={{__html: `
        .auth-page {
          padding: clamp(0.75rem, 2vw, 1.25rem) !important;
        }
        .auth-shell.glass {
          width: min(100%, 880px) !important;
          min-height: 0 !important;
          max-height: calc(100svh - 1.5rem) !important;
          grid-template-columns: minmax(280px, 0.8fr) minmax(360px, 1fr) !important;
          border-radius: var(--radius-xl) !important;
        }
        .auth-brand-panel {
          padding: clamp(1rem, 2.5vw, 1.5rem) !important;
          min-height: 0 !important;
        }
        .auth-logo {
          margin-bottom: 0.75rem !important;
          font-size: 0.95rem !important;
        }
        .auth-brand-panel h1 {
          max-width: 280px !important;
          margin-bottom: 0.5rem !important;
          font-size: clamp(1.15rem, 2.4vw, 1.45rem) !important;
          line-height: 1.12 !important;
        }
        .auth-brand-panel p {
          max-width: 280px !important;
          font-size: 0.78rem !important;
          line-height: 1.45 !important;
        }
        .auth-highlights {
          grid-template-columns: 1fr !important;
          gap: 0.45rem !important;
          margin-top: 1rem !important;
        }
        .auth-highlight {
          padding: 0.55rem 0.7rem !important;
        }
        .auth-highlight strong,
        .auth-highlight span {
          font-size: 0.68rem !important;
        }
        .auth-brand-footer {
          font-size: 0.65rem !important;
        }
        .auth-card {
          padding: clamp(1rem, 2.4vw, 1.35rem) !important;
          justify-content: center !important;
        }
        .auth-card > div {
          max-width: 400px !important;
        }
        .auth-card-header {
          margin-bottom: 0.75rem !important;
        }
        .auth-card-header h2 {
          font-size: clamp(1.18rem, 2.6vw, 1.35rem) !important;
          margin-bottom: 0.2rem !important;
        }
        .auth-card-header p {
          font-size: 0.78rem !important;
          line-height: 1.35 !important;
        }
        .auth-form {
          gap: 0.65rem !important;
        }
        .auth-tab-btn {
          flex: 1; min-height: 36px; padding: 0.4rem 0.55rem; border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 700; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; gap: 0.4rem; font-size: 0.78rem;
        }
        .auth-tab-btn:hover:not(.active) {
          background: var(--primary-color);
          color: white;
        }
        .auth-tab-btn.active {
          background: var(--primary-color); color: white; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }
        .auth-tab-btn:not(.active) {
          background: transparent; color: var(--text-secondary);
        }
        .auth-input {
          min-height: 40px !important;
          font-size: 0.85rem !important;
        }
        .auth-submit {
          min-height: 40px !important;
          transition: all 0.2s ease;
        }
        .auth-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
        }
        .auth-google-button {
          min-height: 40px !important;
          font-size: 0.85rem !important;
          transition: all 0.2s ease !important;
        }
        .auth-google-button:hover:not(:disabled) {
          background: var(--bg-secondary) !important;
          border-color: #d1d5db !important;
          transform: translateY(-1px);
        }
        .auth-input-wrapper:focus-within {
          border-radius: var(--radius-md);
        }
        .enhanced-back-btn {
          position: fixed;
          top: 1.5rem;
          left: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-primary);
          font-size: 0.95rem;
          font-weight: 700;
          text-decoration: none;
          z-index: 1000;
          transition: all 0.2s ease;
          background: var(--bg-secondary);
          padding: 0.6rem 1.2rem;
          border-radius: 999px;
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-md);
        }
        .enhanced-back-btn:hover {
          color: var(--primary-color);
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
          border-color: var(--primary-color);
        }
        .auth-brand-panel {
          padding: clamp(1rem, 2.5vw, 1.5rem) !important;
          min-height: 0 !important;
          border-right: 1px solid var(--border-color);
        }
        @media (max-width: 760px) {
          .auth-shell.glass {
            width: min(100%, 380px) !important;
            max-height: none !important;
            grid-template-columns: 1fr !important;
          }
          .auth-brand-panel {
            display: none !important;
          }
          .auth-card {
            padding: 1rem !important;
          }
        }
      `}} />
      <Link href="/" className="enhanced-back-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        Home
      </Link>
      <div className="auth-shell glass">
        <aside className="auth-brand-panel">
          <div className="auth-brand-content">
            <div className="auth-logo">
              <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 5C50 5 15 45 15 65C15 84.33 30.67 100 50 100C69.33 100 85 84.33 85 65C85 45 50 5 50 5Z" fill="url(#loginWaterGrad)"/>
                <path d="M43 75C37 75 32 70 32 64C32 63.45 32.45 63 33 63C33.55 63 34 63.45 34 64C34 68.97 38.03 73 43 73C43.55 73 44 73.45 44 74C44 74.55 43.55 75 43 75Z" fill="white" fillOpacity="0.6"/>
                <defs>
                  <linearGradient id="loginWaterGrad" x1="50" y1="5" x2="50" y2="100" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00E5FF"/>
                    <stop offset="1" stopColor="#00a299"/>
                  </linearGradient>
                </defs>
              </svg>
              <span>NIMRA</span>
            </div>
            <h1>Pure hydration, delivered with trust.</h1>
            <p>Sign in to manage your orders, track deliveries, and place inquiries for NIMRA packaged drinking water.</p>
            <div className="auth-highlights">
              <div className="auth-highlight"><strong>10-step</strong><span>purification care</span></div>
              <div className="auth-highlight"><strong>Pune</strong><span>local supply network</span></div>
              <div className="auth-highlight"><strong>Secure</strong><span>customer access</span></div>
            </div>
          </div>
          <div className="auth-brand-footer">T.S. Enterprises packaged drinking water portal</div>
        </aside>

        <div className="auth-card">
          <div style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>
          <div className="auth-card-header" style={{ marginBottom: '0.8vh', textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(1.2rem, 3vh, 1.4rem)', fontWeight: '800', marginBottom: '0.2vh', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Login to NIMRA
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.7rem, 1.5vh, 0.85rem)', lineHeight: '1.4' }}>
              Access your account to manage orders, track deliveries, and more.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: '1vw', marginBottom: '0.8vh', background: 'var(--bg-secondary)', padding: '0.5vh', borderRadius: 'var(--radius-lg)' }}>
              <button
                type="button"
                onClick={() => { setActiveTab('mobile'); setError(''); }}
                className={`auth-tab-btn ${activeTab === 'mobile' ? 'active' : ''}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/></svg>
                Mobile
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('email'); setError(''); }}
                className={`auth-tab-btn ${activeTab === 'email' ? 'active' : ''}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                Email
              </button>
            </div>

            {error && <div className="auth-alert error" style={{ padding: '0.75rem', background: 'rgba(220,38,38,0.1)', color: '#dc2626', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1rem', border: '1px solid rgba(220,38,38,0.2)' }}>{error}</div>}

          {activeTab === 'mobile' ? (
            <div className="auth-field">
              <label htmlFor="username" style={{ fontSize: 'clamp(0.75rem, 1.6vh, 0.85rem)', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5vh', display: 'block' }}>Mobile Number*</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/></svg>
                </span>
                <input 
                  id="username"
                  type="text" 
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  placeholder="10-digit mobile number" 
                  className="auth-input" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                  required 
                  style={{ paddingLeft: '1.8rem', width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          ) : (
            <div className="auth-field">
              <label htmlFor="email" style={{ fontSize: 'clamp(0.75rem, 1.6vh, 0.85rem)', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5vh', display: 'block' }}>Email Address*</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 10 }}>
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </span>
                <input 
                  id="email"
                  type="email" 
                  placeholder="your.email@example.com" 
                  className="auth-input" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  style={{ paddingLeft: '1.8rem', width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          )}
          
          <div className="auth-field" style={{ marginTop: '1vh' }}>
            <div className="auth-field-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5vh' }}>
              <label htmlFor="password" style={{ fontSize: 'clamp(0.75rem, 1.6vh, 0.85rem)', fontWeight: '600', color: 'var(--text-secondary)' }}>Password*</label>
              <Link href="/forgot-password" style={{ fontSize: 'clamp(0.7rem, 1.5vh, 0.8rem)', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600' }}>Forgot password?</Link>
            </div>
            <div className="auth-input-wrapper" style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 10 }}>
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </span>
              <input 
                id="password"
                type={showPassword ? "text" : "password"} 
                placeholder="Enter your password" 
                className="auth-input" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                style={{ paddingLeft: '1.8rem', paddingRight: '2.5rem', width: '100%', boxSizing: 'border-box' }}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle-btn"
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>
          
          <div style={{ marginTop: '0.8vh' }}>
            <button className="btn btn-primary auth-submit" type="submit" disabled={isLoading} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1vw', padding: '0.8vh', fontSize: 'clamp(0.8rem, 1.8vh, 0.95rem)' }}>
              {isLoading ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Logging in...
                </>
              ) : (
                <>
                  Login to Account
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </>
              )}
            </button>
          </div>

          <div className="auth-divider" style={{ display: 'flex', alignItems: 'center', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'clamp(0.6rem, 1.4vh, 0.75rem)', fontWeight: 'bold', margin: '0.8vh 0' }}>
             <span style={{ flex: 1, borderBottom: '1px solid var(--border-color)' }}></span>
             <span style={{ padding: '0 1rem' }}>OR</span>
             <span style={{ flex: 1, borderBottom: '1px solid var(--border-color)' }}></span>
          </div>

          <div className="auth-google">
             <button
                type="button"
                className="auth-google-button"
                onClick={() => googleLogin()}
                disabled={isLoading}
                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', padding: '0.65rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: 'var(--shadow-sm)' }}
             >
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
                Continue with Google
             </button>
          </div>

          <div className="auth-footer-link" style={{ textAlign: 'center', marginTop: '0.8vh', fontSize: 'clamp(0.75rem, 1.6vh, 0.85rem)', color: 'var(--text-secondary)' }}>
            Don&apos;t have an account? <Link href="/register" style={{ color: 'var(--primary-color)', fontWeight: 'bold', textDecoration: 'none' }}>Create account →</Link>
          </div>
        </form>
        </div>
      </div>
    </div>
    </section>
  );
}
