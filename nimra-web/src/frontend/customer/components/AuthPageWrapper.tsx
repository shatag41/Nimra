import React from 'react';

interface AuthPageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

function AuthBackground() {
  return <div className="auth-flow-background" aria-hidden="true" />;
}

export default function AuthPageWrapper({ children, className = '' }: AuthPageWrapperProps) {
  return (
    <section className={`auth-page auth-flow auth-mobile-flow ${className}`.trim()}>
      <AuthBackground />
      <div className="auth-flow-stage">
        <div className="auth-shared-mark" aria-hidden="true">
          <svg viewBox="0 0 100 100" role="img">
            <defs>
              <linearGradient id="auth-drop-gradient" x1="26" y1="12" x2="76" y2="91" gradientUnits="userSpaceOnUse">
                <stop className="nimra-logo-gradient-start" stopColor="#0f172a" />
                <stop className="nimra-logo-gradient-mid" offset="0.55" stopColor="#1e3a8a" />
                <stop className="nimra-logo-gradient-end" offset="1" stopColor="#2563eb" />
              </linearGradient>
            </defs>
            <path d="M50 7C50 7 20 44 20 64a30 30 0 0 0 60 0C80 44 50 7 50 7Z" fill="url(#auth-drop-gradient)" />
            <path d="M35 63c0 9 7 16 16 16" fill="none" stroke="#fff" strokeLinecap="round" strokeWidth="5" opacity=".52" />
            <text x="50" y="68" textAnchor="middle" fill="#fff" fontFamily="system-ui, sans-serif" fontSize="34" fontWeight="800">N</text>
          </svg>
        </div>
        {children}
        <div className="auth-benefits" aria-label="NIMRA service benefits">
          <div><span aria-hidden="true">✓</span><strong>Secure &amp; Safe</strong><small>Protected account</small></div>
          <div><span aria-hidden="true">◇</span><strong>Pure &amp; Healthy</strong><small>Quality hydration</small></div>
          <div><span aria-hidden="true">▣</span><strong>Fast Delivery</strong><small>Quick service</small></div>
          <div><span aria-hidden="true">◉</span><strong>24/7 Support</strong><small>Here to help</small></div>
        </div>
      </div>
    </section>
  );
}
