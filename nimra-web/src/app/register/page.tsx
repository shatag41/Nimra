'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import Link from 'next/link';
import { sendRequest } from '../../utils/api';
import { toast } from 'sonner';
import ThemeToggle from '../../components/ThemeToggle';

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
        toast.success('Registration successful! Welcome to NIMRA.');
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
        toast.success('Registration successful! Welcome to NIMRA.');
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

          <div className="auth-form-grid">
            <div className="auth-field">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                placeholder="John Doe"
                className="auth-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              {errors.name && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.5rem' }}>{errors.name}</p>}
            </div>

            <div className="auth-field">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="john@example.com"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.5rem' }}>{errors.email}</p>}
            </div>

            <div className="auth-field">
              <label htmlFor="mobile">Mobile Number</label>
              <input
                id="mobile"
                type="tel"
                pattern="[0-9]{10}"
                placeholder="10-digit mobile"
                className="auth-input"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                maxLength={10}
              />
              {errors.mobile && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.5rem' }}>{errors.mobile}</p>}
            </div>

            <div className="auth-field">
              <label htmlFor="role">Register As</label>
              <select
                id="role"
                className="auth-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="Customer">Customer</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>
          
          <p className="auth-help" style={{ marginTop: '0.25rem' }}>Either email or mobile is required.</p>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <div className="auth-input-wrapper" style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Secure password"
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
            {errors.password && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.5rem' }}>{errors.password}</p>}
          </div>

          <div>
            <button className="btn btn-primary auth-submit" type="submit" disabled={isLoading}>
              {isLoading ? 'Registering...' : 'Register'}
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
                Sign up with Google
             </button>
          </div>

          <div className="auth-footer-link">
            Already have an account? <Link href="/login" className="auth-link">Login</Link>
          </div>
        </form>
      </div>
      </div>
    </section>
  );
}
