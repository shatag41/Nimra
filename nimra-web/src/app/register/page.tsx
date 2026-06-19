'use client';

import React, { useState } from 'react';
import { useAuth } from '@/frontend/customer/contexts/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import Link from 'next/link';
import { sendRequest } from '@/utils/api';
import { toast } from 'sonner';

export default function RegisterPage() {
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('Customer');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
  });

  const validate = () => {
    const newErrors = { name: '', email: '', mobile: '', password: '' };
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = 'Full name is required';
      isValid = false;
    }

    if (!email.trim() && !mobile.trim()) {
      newErrors.email = 'At least one of email or mobile is required';
      newErrors.mobile = 'At least one of email or mobile is required';
      isValid = false;
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (mobile.trim() && !/^[0-9]{10}$/.test(mobile)) {
      newErrors.mobile = 'Mobile number must be 10 digits';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrors({ name: '', email: '', mobile: '', password: '' });

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      const res = await sendRequest({
        type: 'register',
        user: {
          Name: name.trim(),
          Username: email.trim(),
          Mobile: mobile.trim(),
          Password: password,
          Role: role,
        }
      });
      if (res.success && res.user) {
        login(res.user);
        if (res.emailError) {
          toast.warning(`Account created, but welcome email failed: ${res.emailError}`);
        } else {
          toast.success('Registration successful! Welcome to NIMRA.');
        }
      } else {
        setError(res.message ?? 'Registration failed. Please try again.');
        toast.error(res.message ?? 'Registration failed.');
      }
    } catch {
      setError('Registration failed. Please try again.');
      toast.error('Registration failed. Please try again.');
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
        name: payload.name,
        role: role
      });

      if (res.success && res.user) {
        login(res.user);
        if (res.emailError) {
          toast.warning(`Account created, but welcome email failed: ${res.emailError}`);
        } else {
          toast.success('Registration successful! Welcome to NIMRA.');
        }
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
      <style dangerouslySetInnerHTML={{__html: `
        .auth-submit {
          transition: all 0.2s ease;
          width: 100%; display: flex; justify-content: center; align-items: center; gap: 0.5rem; padding: 0.75rem; font-size: 0.95rem;
        }
        .auth-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
        }
        .auth-google-button {
          width: 100%; display: flex; justify-content: center; align-items: center; gap: 0.75rem; padding: 0.65rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); color: var(--text-primary); font-weight: 600; cursor: pointer; transition: all 0.2s ease !important; box-shadow: var(--shadow-sm);
        }
        .auth-google-button:hover:not(:disabled) {
          background: var(--bg-secondary) !important;
          border-color: #d1d5db !important;
          transform: translateY(-1px);
        }
        .auth-input-wrapper:focus-within {
          border-radius: var(--radius-md);
        }
        .auth-field label {
          font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.1rem; display: block;
        }
        .auth-shell {
          grid-template-columns: 1fr minmax(360px, 420px) !important;
          max-height: 95vh !important;
          width: min(100%, 900px) !important;
        }
        .auth-card {
          padding: 1.25rem 2.25rem !important;
        }
        .auth-card-header {
          margin-bottom: 0.5rem !important;
        }
        .auth-card-header h2 {
          font-size: 1.4rem !important;
          margin-bottom: 0.15rem !important;
        }
        .auth-card-header p {
          font-size: 0.8rem !important;
          margin-bottom: 0 !important;
        }
        .auth-input {
          min-height: 38px !important;
          padding-top: 0.35rem !important;
          padding-bottom: 0.35rem !important;
          font-size: 0.85rem !important;
        }
        .auth-submit {
          min-height: 38px !important;
          padding: 0.5rem !important;
        }
        .auth-google-button {
          padding: 0.5rem !important;
        }
      `}} />
      <div className="auth-shell glass">
        <aside className="auth-brand-panel">
          <div className="auth-brand-content">
            <div className="auth-logo">
              <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 5C50 5 15 45 15 65C15 84.33 30.67 100 50 100C69.33 100 85 84.33 85 65C85 45 50 5 50 5Z" fill="url(#registerWaterGrad)"/>
                <path d="M43 75C37 75 32 70 32 64C32 63.45 32.45 63 33 63C33.55 63 34 63.45 34 64C34 68.97 38.03 73 43 73C43.55 73 44 73.45 44 74C44 74.55 43.55 75 43 75Z" fill="white" fillOpacity="0.6"/>
                <defs>
                  <linearGradient id="registerWaterGrad" x1="50" y1="5" x2="50" y2="100" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00E5FF"/>
                    <stop offset="1" stopColor="#00a299"/>
                  </linearGradient>
                </defs>
              </svg>
              <span>NIMRA</span>
            </div>
            <h1>Create your water delivery account.</h1>
            <p>Register once to place inquiries, manage orders, and stay connected with NIMRA support.</p>
            <div className="auth-highlights">
              <div className="auth-highlight"><strong>Fast</strong><span>order access</span></div>
              <div className="auth-highlight"><strong>Simple</strong><span>account setup</span></div>
              <div className="auth-highlight"><strong>Reliable</strong><span>support follow-up</span></div>
            </div>
          </div>
          <div className="auth-brand-footer">NIMRA customer and team registration</div>
        </aside>

        <div className="auth-card">
          <div className="auth-card-header">
            <span className="auth-kicker">New Account</span>
            <h2>Create Account</h2>
            <p>Enter your details to start using the NIMRA portal.</p>
          </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-alert error">{error}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6vh 1vw' }}>
            <div className="auth-field" style={{ gridColumn: 'span 1' }}>
              <label htmlFor="name">Full Name*</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 10 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
                <input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  className="auth-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{ paddingLeft: '1.8rem', width: '100%', boxSizing: 'border-box', textOverflow: 'ellipsis' }}
                />
              </div>
              {errors.name && <p style={{ color: '#ef4444', fontSize: 'clamp(0.65rem, 1.5vh, 0.75rem)', marginTop: '0.5vh' }}>{errors.name}</p>}
            </div>

            <div className="auth-field" style={{ gridColumn: 'span 1' }}>
              <label htmlFor="mobile">Mobile Number</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 10 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/></svg>
                </span>
                <input
                  id="mobile"
                  type="tel"
                  pattern="[0-9]{10}"
                  placeholder="10-digit mobile"
                  className="auth-input"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  maxLength={10}
                  style={{ paddingLeft: '1.8rem', width: '100%', boxSizing: 'border-box', textOverflow: 'ellipsis' }}
                />
              </div>
              {errors.mobile && <p style={{ color: '#ef4444', fontSize: 'clamp(0.65rem, 1.5vh, 0.75rem)', marginTop: '0.5vh' }}>{errors.mobile}</p>}
            </div>

            <div className="auth-field" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="email">Email Address*</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 10 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </span>
                <input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  className="auth-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '1.8rem', width: '100%', boxSizing: 'border-box', textOverflow: 'ellipsis' }}
                />
              </div>
              {errors.email && <p style={{ color: '#ef4444', fontSize: 'clamp(0.65rem, 1.5vh, 0.75rem)', marginTop: '0.5vh' }}>{errors.email}</p>}
            </div>

            <div className="auth-field" style={{ gridColumn: '1 / -1', width: '70%' }}>
              <label htmlFor="password">Password*</label>
              <div className="auth-input-wrapper" style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 10 }}>
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Secure password"
                  className="auth-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingLeft: '1.8rem', paddingRight: '2.5rem', width: '100%', boxSizing: 'border-box', textOverflow: 'ellipsis' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle-btn"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              {errors.password && <p style={{ color: '#ef4444', fontSize: 'clamp(0.65rem, 1.5vh, 0.75rem)', marginTop: '0.5vh' }}>{errors.password}</p>}
            </div>
          </div>

          <div style={{ marginTop: '0.8vh' }}>
            <button className="btn btn-primary auth-submit" type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Registering...
                </>
              ) : (
                <>
                  Create Account
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </>
              )}
            </button>
          </div>

          <div className="auth-divider" style={{ display: 'flex', alignItems: 'center', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'clamp(0.6rem, 1.4vh, 0.7rem)', fontWeight: 'bold', margin: '0.8vh 0' }}>
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
             >
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
                Sign up with Google
             </button>
          </div>

          <div className="auth-footer-link" style={{ textAlign: 'center', marginTop: '0.8vh', fontSize: 'clamp(0.75rem, 1.6vh, 0.8rem)', color: 'var(--text-secondary)' }}>
            Already have an account? <Link href="/login" className="auth-link">Login</Link>
          </div>
        </form>
      </div>
      </div>
    </section>
  );
}
