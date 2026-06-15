'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import Link from 'next/link';
import { sendRequest } from '../../utils/api';
import { toast } from 'sonner';
import ThemeToggle from '../../components/ThemeToggle';

export default function LoginPage() {
  const { login } = useAuth();
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
        toast.success(`Welcome back, ${res.user.Name}!`);
      } else {
        setError(res.message ?? 'Login failed. Please try again.');
        toast.error(res.message ?? 'Login failed.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
      toast.error('Login failed. Please try again.');
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
        toast.success(`Welcome back, ${res.user.Name}!`);
      } else {
        setError(res.message ?? 'Google Sign-In failed.');
        toast.error(res.message ?? 'Google Sign-In failed.');
      }
    } catch {
      setError('Google Sign-In failed.');
      toast.error('Google Sign-In failed.');
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => handleGoogleSuccess(tokenResponse.access_token),
    onError: () => setError('Google Sign-In failed'),
  });

  return (
    <section className="auth-page">
      <div className="auth-shell glass">
        <div className="theme-toggle-wrapper">
          <ThemeToggle />
        </div>
        <aside className="auth-brand-panel">
          <div className="auth-brand-content">
            <div className="auth-logo">
              <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          <div className="auth-card-header">
            <h2>Login to NIMRA</h2>
            <p>Use your registered email or mobile number to continue.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div style={{ display: 'flex', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={() => { setActiveTab('mobile'); setError(''); }}
                style={{
                  flex: 1, padding: '0.75rem', background: 'none', border: 'none',
                  borderBottom: activeTab === 'mobile' ? '2px solid var(--primary-color)' : '2px solid transparent',
                  color: activeTab === 'mobile' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontWeight: '700', transition: 'all 0.2s ease'
                }}
              >
                Mobile Number
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('email'); setError(''); }}
                style={{
                  flex: 1, padding: '0.75rem', background: 'none', border: 'none',
                  borderBottom: activeTab === 'email' ? '2px solid var(--primary-color)' : '2px solid transparent',
                  color: activeTab === 'email' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontWeight: '700', transition: 'all 0.2s ease'
                }}
              >
                Email
              </button>
            </div>

            {error && <div className="auth-alert error">{error}</div>}

          {activeTab === 'mobile' ? (
            <div className="auth-field">
              <label htmlFor="username">Mobile Number</label>
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
              />
            </div>
          ) : (
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input 
                id="email"
                type="email" 
                placeholder="your.email@example.com" 
                className="auth-input" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
          )}
          
          <div className="auth-field">
            <div className="auth-field-row">
              <label htmlFor="password">Password</label>
              <Link href="/forgot-password" className="auth-link">Forgot password?</Link>
            </div>
            <div className="auth-input-wrapper" style={{ position: 'relative' }}>
              <input 
                id="password"
                type={showPassword ? "text" : "password"} 
                placeholder="password" 
                className="auth-input" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>

          <div className="auth-divider">OR</div>

          <div className="auth-google">
             <button
                type="button"
                className="auth-google-button"
                onClick={() => googleLogin()}
                disabled={isLoading}
             >
                Continue with Google
             </button>
          </div>

          <div className="auth-footer-link">
            Don&apos;t have an account? <Link href="/register" className="auth-link">Register</Link>
          </div>
        </form>
      </div>
      </div>
    </section>
  );
}
