'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

export default function LandingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    const timer = setTimeout(() => {
      if (user?.Role === 'Admin') {
        router.replace('/admin');
      } else {
        router.replace('/customer-portal');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated, router, user]);

  return (
    <div className="landing-container">
      <div className="landing-card glass">
        <h1 className="welcome-title">
          Welcome to NIMRA, <span className="highlight-text">{user?.Name || 'Guest'}</span>!
        </h1>
        <p className="welcome-subtitle">Preparing your workspace...</p>
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      </div>

      <style jsx>{`
        .landing-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(10, 10, 10, 1) 100%);
          padding: 1rem;
        }

        .landing-card {
          padding: 3rem 2rem;
          border-radius: var(--radius-2xl);
          text-align: center;
          max-width: 500px;
          width: 100%;
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          border: 1px solid rgba(6, 182, 212, 0.15);
          box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5);
          background: rgba(15, 15, 15, 0.6);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .welcome-title {
          font-size: 2rem;
          font-weight: 800;
          color: white;
          margin-bottom: 0.5rem;
          font-family: var(--font-heading);
          letter-spacing: -0.02em;
        }

        .highlight-text {
          background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .welcome-subtitle {
          color: var(--text-secondary);
          font-size: 1.1rem;
          margin-bottom: 2.5rem;
        }

        .spinner-container {
          display: flex;
          justify-content: center;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(6, 182, 212, 0.1);
          border-left-color: var(--primary-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
