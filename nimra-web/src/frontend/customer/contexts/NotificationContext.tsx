'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo, ReactNode } from 'react';
import Link from 'next/link';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'cart' | 'order' | 'login' | 'profile';

export interface NotificationAction {
  label: string;
  onClick?: () => void;
  href?: string;
}

export interface NotificationPayload {
  id: string; // Unique ID to force re-render/animation reset
  type: NotificationType;
  title: string;
  message?: string;
  quantity?: number;
  productName?: string;
  primaryAction?: NotificationAction;
  secondaryAction?: NotificationAction;
  durationMs?: number;
}

interface NotificationContextValue {
  notification: NotificationPayload | null;
  isVisible: boolean;
  notify: {
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
    cart: (productName: string, quantity: number, totalItems: number) => void;
    order: (title: string, message?: string) => void;
    login: (title: string, message?: string) => void;
    profile: (title: string, message?: string) => void;
    custom: (payload: Omit<NotificationPayload, 'id'>) => void;
  };
  dismiss: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  progress: number;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const DEFAULT_DURATION = 4000;
const TICK_RATE = 10;

// Returns the accent color for the progress bar based on notification type
function getProgressColor(type: NotificationType | undefined): string {
  switch (type) {
    case 'error':
      return '#EF4444';
    case 'warning':
      return '#F59E0B';
    case 'info':
      return '#2563EB';
    case 'success':
    case 'cart':
    case 'order':
    case 'login':
    case 'profile':
    default:
      return '#22C55E';
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<NotificationPayload | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeRemainingRef = useRef(DEFAULT_DURATION);
  const totalDurationRef = useRef(DEFAULT_DURATION);
  const isPausedRef = useRef(false);
  const lastTickTimeRef = useRef(Date.now());

  // Cleanup all timers on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  const dismiss = useCallback(() => {
    setIsVisible(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    
    // Give time for exit animation before clearing content
    hideTimeoutRef.current = setTimeout(() => {
      setNotification(null);
    }, 250); // 200ms exit animation + 50ms buffer
  }, []);

  const startTimer = useCallback((durationMs: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    timeRemainingRef.current = durationMs;
    totalDurationRef.current = durationMs;
    isPausedRef.current = false;
    lastTickTimeRef.current = Date.now();
    setProgress(100);

    timerRef.current = setInterval(() => {
      if (isPausedRef.current) {
        lastTickTimeRef.current = Date.now();
        return;
      }
      
      const now = Date.now();
      const delta = now - lastTickTimeRef.current;
      lastTickTimeRef.current = now;
      
      timeRemainingRef.current -= delta;
      
      if (timeRemainingRef.current <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setProgress(0);
        dismiss();
      } else {
        setProgress(Math.max(0, (timeRemainingRef.current / totalDurationRef.current) * 100));
      }
    }, TICK_RATE);
  }, [dismiss]);

  const showNotification = useCallback((payload: Omit<NotificationPayload, 'id'>) => {
    // Generate new ID to force animation restart if needed
    const newPayload: NotificationPayload = {
      ...payload,
      id: Math.random().toString(36).substring(7)
    };
    
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    
    setNotification(newPayload);
    setIsVisible(true);
    startTimer(payload.durationMs ?? DEFAULT_DURATION);
  }, [startTimer]);

  const pauseTimer = useCallback(() => {
    isPausedRef.current = true;
  }, []);

  const resumeTimer = useCallback(() => {
    lastTickTimeRef.current = Date.now();
    isPausedRef.current = false;
  }, []);

  const notify = useMemo(() => ({
    success: (title: string, message?: string) => showNotification({ type: 'success', title, message }),
    error: (title: string, message?: string) => showNotification({ type: 'error', title, message }),
    warning: (title: string, message?: string) => showNotification({ type: 'warning', title, message }),
    info: (title: string, message?: string) => showNotification({ type: 'info', title, message }),
    cart: (productName: string, quantity: number, totalItems: number) => showNotification({
      type: 'cart',
      title: 'Added to Cart',
      productName,
      quantity,
      message: `${totalItems} Item${totalItems !== 1 ? 's' : ''} in your cart`
    }),
    order: (title: string, message?: string) => showNotification({ type: 'order', title, message }),
    login: (title: string, message?: string) => showNotification({ type: 'login', title, message }),
    profile: (title: string, message?: string) => showNotification({ type: 'profile', title, message }),
    custom: showNotification
  }), [showNotification]);

  return (
    <NotificationContext.Provider value={{ notification, isVisible, notify, dismiss, pauseTimer, resumeTimer, progress }}>
      {children}
      <NotificationBanner />
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
};

function NotificationBanner() {
  const { notification, isVisible, dismiss, pauseTimer, resumeTimer, progress } = useNotification();
  
  if (!notification && !isVisible) return null;

  const { type, title, message, quantity, productName, primaryAction, secondaryAction, id } = notification || {};

  const progressColor = getProgressColor(type);
  const trackColor = `${progressColor}1A`; // 10% alpha version
  
  // Icon mapping
  const getIcon = () => {
    switch (type) {
      case 'error':
        return (
          <div className="nm-icon-wrapper nm-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="nm-icon-wrapper nm-warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
        );
      case 'info':
        return (
          <div className="nm-icon-wrapper nm-info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="8.01"></line>
              <line x1="12" y1="12" x2="12" y2="16"></line>
            </svg>
          </div>
        );
      default: // success, cart, profile, login, order
        return (
          <div className="nm-icon-wrapper nm-success">
            <svg className="nm-animated-check" viewBox="0 0 52 52">
              <circle className="nm-check-circle" cx="26" cy="26" r="25" fill="none" />
              <path className="nm-check-path" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div 
      className={`nm-toast-container ${isVisible ? 'nm-visible' : 'nm-hidden'}`}
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
      role="alert"
    >
      <div className="nm-progress-track" style={{ background: trackColor }}>
        <div className="nm-progress-bar" style={{ width: `${progress}%`, background: progressColor }} />
      </div>

      <button className="nm-close-btn" onClick={dismiss} aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <div className="nm-toast-content" key={id}>
        {getIcon()}
        
        <div className="nm-text-content">
          <h4 className="nm-title">
            {type === 'success' || type === 'order' || type === 'profile' || type === 'cart' || type === 'login' ? '✓ ' : ''}
            {type === 'error' ? '✕ ' : ''}
            {type === 'warning' ? '⚠ ' : ''}
            {type === 'info' ? 'ℹ ' : ''}
            {title}
          </h4>
          
          {type === 'cart' && productName ? (
            <div className="nm-cart-details">
              <p className="nm-product-name">{productName}</p>
              <p className="nm-quantity">Quantity &times;{quantity}</p>
              {message && <p className="nm-cart-total">{message}</p>}
            </div>
          ) : (
            message && <p className="nm-message">{message}</p>
          )}

          {/* Action Buttons for Cart */}
          {type === 'cart' && (
            <div className="nm-actions">
              <Link href="/cart" className="nm-btn-primary" onClick={dismiss}>
                View Cart &rarr;
              </Link>
            </div>
          )}

          {/* Generic Action Buttons */}
          {(primaryAction || secondaryAction) && (
            <div className="nm-actions">
              {secondaryAction && (
                secondaryAction.href ? (
                  <Link href={secondaryAction.href} className="nm-btn-secondary" onClick={() => { secondaryAction.onClick?.(); dismiss(); }}>
                    {secondaryAction.label}
                  </Link>
                ) : (
                  <button className="nm-btn-secondary" onClick={() => { secondaryAction.onClick?.(); dismiss(); }}>
                    {secondaryAction.label}
                  </button>
                )
              )}
              {primaryAction && (
                primaryAction.href ? (
                  <Link href={primaryAction.href} className="nm-btn-primary" onClick={() => { primaryAction.onClick?.(); dismiss(); }}>
                    {primaryAction.label}
                  </Link>
                ) : (
                  <button className="nm-btn-primary" onClick={() => { primaryAction.onClick?.(); dismiss(); }}>
                    {primaryAction.label}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .nm-toast-container {
          position: fixed;
          top: 5.5rem;
          right: 1.5rem;
          width: 320px;
          max-width: calc(100vw - 3rem);
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(37, 99, 235, 0.2);
          border-radius: 18px;
          box-shadow: 0 12px 40px rgba(37, 99, 235, 0.12), 0 4px 12px rgba(0, 0, 0, 0.04);
          z-index: 9999;
          overflow: hidden;
          transition: transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 200ms ease;
          transform-origin: top right;
        }

        .nm-hidden {
          transform: scale(0.96) translateY(-10px);
          opacity: 0;
          pointer-events: none;
        }

        .nm-visible {
          transform: scale(1) translateY(0);
          opacity: 1;
          pointer-events: auto;
        }

        /* Progress Line */
        .nm-progress-track {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
        }

        .nm-progress-bar {
          height: 100%;
          transition: width 10ms linear;
        }

        .nm-close-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 150ms ease, color 150ms ease;
        }

        .nm-close-btn:hover {
          background: rgba(0, 0, 0, 0.05);
          color: #1e293b;
        }

        .nm-close-btn svg {
          width: 16px;
          height: 16px;
        }

        .nm-toast-content {
          display: flex;
          gap: 12px;
          padding: 16px;
          animation: slideIn 300ms ease-out;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        /* Icon Styles */
        .nm-icon-wrapper {
          flex-shrink: 0;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nm-success {
          background: rgba(34, 197, 94, 0.12);
          color: #22c55e;
        }

        .nm-error {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .nm-warning {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }

        .nm-info {
          background: rgba(37, 99, 235, 0.1);
          color: #2563eb;
        }

        .nm-icon-wrapper svg {
          width: 20px;
          height: 20px;
        }

        /* Animated Checkmark */
        .nm-animated-check {
          width: 24px;
          height: 24px;
        }

        .nm-check-circle {
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          stroke-width: 3.5;
          stroke-miterlimit: 10;
          stroke: currentColor;
          animation: nmstroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }

        .nm-check-path {
          transform-origin: 50% 50%;
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          stroke-width: 4;
          stroke: currentColor;
          animation: nmstroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.3s forwards;
        }

        @keyframes nmstroke {
          100% { stroke-dashoffset: 0; }
        }

        /* Text Content */
        .nm-text-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .nm-title {
          font-size: 1rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px 0;
          padding-right: 20px; /* Space for close btn */
        }

        .nm-message {
          font-size: 0.9rem;
          color: #475569;
          margin: 0;
          line-height: 1.4;
        }

        .nm-cart-details {
          margin-top: 4px;
        }

        .nm-product-name {
          font-size: 0.95rem;
          font-weight: 600;
          color: #334155;
          margin: 0 0 2px 0;
        }

        .nm-quantity {
          font-size: 0.85rem;
          color: #64748b;
          margin: 0 0 6px 0;
        }

        .nm-cart-total {
          font-size: 0.8rem;
          color: #94a3b8;
          margin: 0;
        }

        /* Actions */
        .nm-actions {
          display: flex;
          gap: 10px;
          margin-top: 14px;
        }

        .nm-btn-primary, .nm-btn-secondary {
          flex: 1;
          padding: 10px 16px;
          border-radius: 10px;
          font-size: 0.88rem;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          transition: all 250ms ease;
          border: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .nm-btn-primary {
          background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
          color: white;
          box-shadow: 0 6px 16px color-mix(in srgb, var(--primary-color) 30%, transparent);
          position: relative;
          overflow: hidden;
        }
        
        .nm-btn-primary::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
          transition: left 400ms ease;
        }

        .nm-btn-primary:hover {
          filter: brightness(1.05);
          box-shadow: 0 8px 24px color-mix(in srgb, var(--primary-color) 45%, transparent);
          transform: translateY(-2px);
        }

        .nm-btn-primary:hover::before {
          left: 100%;
        }

        .nm-btn-primary:active {
          transform: translateY(1px) scale(0.98);
          box-shadow: 0 3px 10px color-mix(in srgb, var(--primary-color) 20%, transparent);
        }

        .nm-btn-secondary {
          background: transparent;
          color: #475569;
          border: 1px solid rgba(148, 163, 184, 0.3);
        }

        .nm-btn-secondary:hover {
          background: rgba(241, 245, 249, 0.8);
          color: #0f172a;
          border-color: rgba(148, 163, 184, 0.5);
        }

        /* Dark Mode Support */
        :global([data-theme="dark"]) .nm-toast-container {
          background: rgba(15, 23, 42, 0.85);
          border-color: rgba(96, 165, 250, 0.2);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(59, 130, 246, 0.1);
        }

        :global([data-theme="dark"]) .nm-title { color: #f8fafc; }
        :global([data-theme="dark"]) .nm-message { color: #cbd5e1; }
        :global([data-theme="dark"]) .nm-product-name { color: #e2e8f0; }
        :global([data-theme="dark"]) .nm-quantity { color: #94a3b8; }
        :global([data-theme="dark"]) .nm-cart-total { color: #64748b; }
        :global([data-theme="dark"]) .nm-close-btn { color: #64748b; }
        :global([data-theme="dark"]) .nm-close-btn:hover { background: rgba(255,255,255,0.1); color: #f1f5f9; }

        :global([data-theme="dark"]) .nm-btn-secondary {
          color: #cbd5e1;
          border-color: rgba(148, 163, 184, 0.2);
        }
        :global([data-theme="dark"]) .nm-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #f8fafc;
          border-color: rgba(148, 163, 184, 0.4);
        }

        @media (max-width: 640px) {
          .nm-toast-container {
            top: 1.5rem;
            left: 50%;
            transform: translateX(-50%) scale(1);
            transform-origin: center;
          }
          
          .nm-hidden {
            transform: translateX(-50%) scale(0.96) translateY(-20px);
          }
          
          .nm-visible {
            transform: translateX(-50%) scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
