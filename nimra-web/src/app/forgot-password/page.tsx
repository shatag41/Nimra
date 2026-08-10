'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthPageWrapper from '@/frontend/customer/components/AuthPageWrapper';
import ForgotPasswordFlow from '@/frontend/customer/components/ForgotPasswordFlow';

export default function ForgotPasswordPage() {
  const router = useRouter();
  return <AuthPageWrapper className="forgot-password-page">
    <style dangerouslySetInnerHTML={{ __html: `
      .auth-shell.glass { width:min(100%,880px)!important; grid-template-columns:42% 58%!important; }
      .forgot-password-page .auth-logo span { font-size:clamp(.88rem,1.6vw,1.05rem)!important; }
      .forgot-password-page .auth-brand-panel h1 { font-size:clamp(1.28rem,2.25vw,1.65rem)!important; }
      .forgot-password-page .auth-brand-panel p { font-size:clamp(.7rem,1.25vw,.8rem)!important; }
      .forgot-password-page .auth-highlight strong { font-size:clamp(.72rem,1.25vw,.82rem)!important; }
      .forgot-password-page .auth-highlight span { font-size:clamp(.58rem,1vw,.67rem)!important; }
      .forgot-password-page .auth-brand-footer { font-size:clamp(.58rem,1vw,.68rem)!important; }
      .forgot-password-page .auth-kicker { font-size:clamp(.58rem,1vw,.66rem)!important; }
      .forgot-password-page .auth-card-header h2 { font-size:clamp(1.08rem,2vw,1.3rem)!important; }
      .forgot-password-page .auth-card-header p { font-size:clamp(.68rem,1.2vw,.78rem)!important; }
      .forgot-password-page .auth-field label { font-size:clamp(.65rem,1.1vw,.74rem)!important; }
      .forgot-password-page .auth-input { font-size:clamp(.72rem,1.2vw,.82rem)!important; }
      .forgot-password-page .auth-submit { font-size:clamp(.7rem,1.2vw,.8rem)!important; }
      .forgot-password-page .otp-resend-prompt { display:flex; align-items:center; justify-content:center; gap:.3rem; margin:.15rem 0 0; color:var(--text-secondary); font-size:clamp(.68rem,1.2vw,.78rem); }
      .forgot-password-page .otp-resend-button { padding:0; border:0; background:transparent; color:var(--primary-color); font:inherit; font-weight:700; cursor:pointer; }
      .forgot-password-page .otp-resend-button:disabled { color:var(--text-muted); cursor:not-allowed; }
    ` }} />
    <div className="auth-shell glass">
      <aside className="auth-brand-panel"><div className="auth-brand-content"><div className="auth-logo"><svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M50 5C50 5 15 45 15 65C15 84.33 30.67 100 50 100C69.33 100 85 84.33 85 65C85 45 50 5 50 5Z" fill="url(#forgotWaterGrad)"/><path d="M43 75C37 75 32 70 32 64C32 63.45 32.45 63 33 63C33.55 63 34 63.45 34 64C34 68.97 38.03 73 43 73C43.55 73 44 73.45 44 74C44 74.55 43.55 75 43 75Z" fill="white" fillOpacity="0.6"/><defs><linearGradient id="forgotWaterGrad" x1="50" y1="5" x2="50" y2="100" gradientUnits="userSpaceOnUse"><stop stopColor="#00E5FF"/><stop offset="1" stopColor="#00a299"/></linearGradient></defs></svg><span>NIMRA</span></div><h1>Reset access securely.</h1><p>Verify your registered email and create a new password for your NIMRA account.</p><div className="auth-highlights"><div className="auth-highlight"><strong>OTP</strong><span>email verification</span></div><div className="auth-highlight"><strong>Quick</strong><span>password recovery</span></div><div className="auth-highlight"><strong>Safe</strong><span>account access</span></div></div></div><div className="auth-brand-footer">Secure recovery for NIMRA portal accounts</div></aside>
      <div className="auth-card"><div style={{ maxWidth: '300px', margin: '0 auto', width: '100%' }}><div className="auth-card-header" style={{ marginBottom: '0.8vh', textAlign: 'center' }}><span className="auth-kicker">Account Recovery</span><h2>Forgot Password</h2><p>Enter your registered email to receive an OTP, then set a new password.</p></div><ForgotPasswordFlow onSuccess={() => setTimeout(() => router.push('/login'), 2000)} /><div className="auth-footer-link" style={{ textAlign: 'center', marginTop: '0.8vh', color: 'var(--text-secondary)' }}>Remember your password? <Link href="/login" style={{ color: 'var(--primary-color)', fontWeight: 'bold', textDecoration: 'none' }}>Login</Link></div></div></div>
    </div>
  </AuthPageWrapper>;
}
