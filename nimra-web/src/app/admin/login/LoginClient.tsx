'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { sendRequest } from '../../../utils/api';
import { AdminUser } from '../../../types/cms';

export default function LoginClient() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    const session = localStorage.getItem('nimra_admin_user');
    if (session) {
      try {
        const adminSession = JSON.parse(session);
        if (adminSession.role !== 'Admin') {
          localStorage.removeItem('nimra_admin_user');
          Cookies.remove('nimra_user', { path: '/' });
          return;
        }
        if (!Cookies.get('nimra_user')) {
          Cookies.set(
            'nimra_user',
            JSON.stringify({
              ID: 0,
              Name: adminSession.name,
              Username: adminSession.username,
              Mobile: '',
              Role: adminSession.role,
              Active: true,
            }),
            { expires: 7 }
          );
        }
        router.replace('/admin');
      } catch {
        localStorage.removeItem('nimra_admin_user');
      }
    }
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await sendRequest({ type: 'login', username, password });
      if (res.success && res.user) {
        const matchedUser = res.user;
        if (matchedUser.Role !== 'Admin') {
          setError('Admin access requires an active Admin role.');
          return;
        }
        const userSession = {
          ID: matchedUser.ID,
          Name: matchedUser.Name,
          Username: matchedUser.Username,
          Mobile: '',
          Role: matchedUser.Role,
          Active: true,
        };
        // Save user session
        Cookies.set('nimra_user', JSON.stringify(userSession), { path: '/', sameSite: 'lax' });
        localStorage.setItem(
          'nimra_admin_user',
          JSON.stringify({
            username: matchedUser.Username,
            role: matchedUser.Role,
            name: matchedUser.Name,
          })
        );
        localStorage.setItem('nimra_admin_active_tab', 'dashboard');
        router.replace('/admin');
      } else {
        setError(res.message || 'Invalid username or password. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error. Please check backend sync settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="bubbles">
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
      </div>
      
      <div className="login-card glass animate-fade-in">
        <div className="login-header">
          <svg width="46" height="46" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 5C50 5 15 45 15 65C15 84.33 30.67 100 50 100C69.33 100 85 84.33 85 65C85 45 50 5 50 5Z" fill="url(#waterGrad)"/>
            <path d="M43 75C37 75 32 70 32 64C32 63.45 32.45 63 33 63C33.55 63 34 63.45 34 64C34 68.97 38.03 73 43 73C43.55 73 44 73.45 44 74C44 74.55 43.55 75 43 75Z" fill="white" fillOpacity="0.6"/>
            <defs>
              <linearGradient id="waterGrad" x1="50" y1="5" x2="50" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00E5FF"/>
                <stop offset="1" stopColor="#00a299"/>
              </linearGradient>
            </defs>
          </svg>
          <h2>NIMRA PORTAL</h2>
          <p>Sign in to manage orders, catalog, and inquiries.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter admin username"
              className="login-input"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="login-input"
              disabled={loading}
            />
          </div>

          {error && <div className="error-box">{error}</div>}

          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? (
              <span className="spinner"></span>
            ) : (
              'Access Dashboard'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>© 2026 NIMRA. Secure Shopify-Like Console.</p>
        </div>
      </div>

      <style jsx>{`
        .login-wrapper {
          min-height: 85vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          background: radial-gradient(circle at 10% 20%, rgba(0, 162, 153, 0.05) 0%, transparent 90%), 
                      radial-gradient(circle at 90% 80%, rgba(15, 23, 42, 0.05) 0%, transparent 90%);
          overflow: hidden;
          padding: 2rem 1.5rem;
        }

        /* Floating background bubble animation */
        .bubbles {
          position: absolute;
          width: 100%;
          height: 100%;
          z-index: 0;
          overflow: hidden;
          top: 0;
          left: 0;
        }
        .bubble {
          position: absolute;
          bottom: -100px;
          width: 40px;
          height: 40px;
          background: rgba(0, 162, 153, 0.08);
          border-radius: 50%;
          animation: bubbleUp 15s infinite ease-in;
        }
        .bubble:nth-child(1) { left: 10%; width: 50px; height: 50px; animation-duration: 12s; }
        .bubble:nth-child(2) { left: 25%; width: 30px; height: 30px; animation-duration: 18s; animation-delay: 2s; }
        .bubble:nth-child(3) { left: 45%; width: 60px; height: 60px; animation-duration: 14s; animation-delay: 4s; }
        .bubble:nth-child(4) { left: 70%; width: 25px; height: 25px; animation-duration: 20s; animation-delay: 1s; }
        .bubble:nth-child(5) { left: 85%; width: 45px; height: 45px; animation-duration: 16s; animation-delay: 5s; }

        @keyframes bubbleUp {
          0% { transform: translateY(0) scale(0.8); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { transform: translateY(-110vh) scale(1.3); opacity: 0; }
        }

        .login-card {
          width: 100%;
          max-width: 450px;
          border-radius: 16px;
          padding: 2.5rem 2rem;
          box-shadow: var(--card-hover-shadow);
          z-index: 10;
          border: 1px solid var(--border-color);
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .login-header h2 {
          font-size: 1.8rem;
          margin-top: 1rem;
          letter-spacing: 0.05em;
          background: linear-gradient(135deg, var(--text-primary) 30%, var(--primary-color) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .login-header p {
          color: var(--text-secondary);
          font-size: 0.9rem;
          margin-top: 0.5rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }
        .form-group label {
          font-weight: 700;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        
        .login-input {
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 0.85rem 1rem;
          background: var(--bg-primary);
          color: var(--text-primary);
          font: inherit;
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }
        .login-input:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(0, 162, 153, 0.15);
        }

        .error-box {
          background-color: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          text-align: center;
        }

        .login-btn {
          height: 48px;
          margin-top: 0.5rem;
          font-size: 1rem;
          width: 100%;
        }

        .login-footer {
          margin-top: 2rem;
          text-align: center;
        }
        .login-footer p {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
