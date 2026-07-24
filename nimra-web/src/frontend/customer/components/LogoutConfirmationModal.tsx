'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import LoadingButton from '@/frontend/shared/LoadingButton';

interface LogoutConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
  isProcessing?: boolean;
  processingText?: string;
  confirmDisabled?: boolean;
  showCancelButton?: boolean;
  children?: React.ReactNode;
  contentKey?: React.Key;
  stableFlowLayout?: boolean;
  centerContent?: boolean;
}

const LogoutConfirmationModal = React.memo(function LogoutConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Logout Confirmation',
  description = 'Are you sure you want to log out?',
  confirmText = 'Confirm Logout',
  cancelText = 'Cancel',
  confirmButtonClass = 'btn btn-error',
  isProcessing = false,
  processingText = 'Processing...',
  confirmDisabled = false,
  showCancelButton = true,
  children,
  contentKey,
  stableFlowLayout = false,
  centerContent = false,
}: LogoutConfirmationModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const isProcessingRef = useRef(isProcessing);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    onCloseRef.current = onClose;
    isProcessingRef.current = isProcessing;
  }, [onClose, isProcessing]);

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isProcessingRef.current) {
          onCloseRef.current();
        }
        if (e.key === 'Tab') {
          e.preventDefault();
          const focusableElements = Array.from(contentRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href]') || []);
          if (focusableElements.length > 0) {
            const currentIndex = focusableElements.indexOf(
              document.activeElement as HTMLElement
            );
            let nextIndex = e.shiftKey ? currentIndex - 1 : currentIndex + 1;
            if (nextIndex < 0) {
              nextIndex = focusableElements.length - 1;
            } else if (nextIndex >= focusableElements.length) {
              nextIndex = 0;
            }
            focusableElements[nextIndex].focus();
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      const activeElementBeforeModal = document.activeElement as HTMLElement;
      if (confirmButtonRef.current) {
        confirmButtonRef.current.focus();
      }

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        activeElementBeforeModal?.focus();
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) {
    return null;
  }

  if (!stableFlowLayout) {
    return createPortal(
      <>
        <div ref={overlayRef} className="legacy-modal-overlay" onClick={() => !isProcessing && onClose()} role="presentation" aria-hidden="true" />
        <div ref={contentRef} role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-description" className="legacy-modal-content" onClick={(e) => e.stopPropagation()}>
          <h2 id="modal-title" className="legacy-modal-title">{title}</h2>
          <p id="modal-description" className="legacy-modal-description">{description}</p>
          <div className="legacy-modal-actions">
            {showCancelButton && <button ref={cancelButtonRef} className="btn btn-secondary" onClick={onClose} aria-label={cancelText} disabled={isProcessing}>{cancelText}</button>}
            <LoadingButton ref={confirmButtonRef} className={confirmButtonClass} onClick={onConfirm} aria-label={confirmText} disabled={confirmDisabled} isLoading={isProcessing} loadingText={processingText}>{confirmText}</LoadingButton>
          </div>
        </div>
        <style jsx>{`
          .legacy-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,.6); z-index: 10000; animation: legacyFadeIn .2s ease-out; }
          .legacy-modal-content { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); background: var(--bg-primary); padding: 2rem; border-radius: var(--radius-xl); box-shadow: var(--shadow-xl); border: 1px solid var(--border-color); z-index: 10001; width: 90%; max-width: 400px; animation: legacyScaleIn .3s ease-out; }
          .legacy-modal-title { font-family: var(--font-heading); font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0 0 .75rem; }
          .legacy-modal-description { color: var(--text-secondary); font-size: .95rem; margin: 0 0 1.5rem; }
          .legacy-modal-actions { display: flex; gap: 1rem; justify-content: flex-end; }
          @keyframes legacyFadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes legacyScaleIn { from { opacity: 0; transform: translate(-50%,-50%) scale(.9); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
          @media (max-width:480px) { .legacy-modal-content { width:95%; padding:1.5rem; } .legacy-modal-actions { flex-direction:column-reverse; } }
        `}</style>
      </>,
      document.body
    );
  }

  return createPortal(
      <div
        ref={overlayRef}
        className="modal-overlay"
        onClick={() => !isProcessing && onClose()}
        role="presentation"
      >
        <div
          ref={contentRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
          className={`modal-content ${centerContent ? 'centered-copy' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div key={contentKey} className="modal-step">
            <h2 id="modal-title" className="modal-title">{title}</h2>
            <p id="modal-description" className="modal-description">{description}</p>
            <div className="modal-body">{children}</div>
          </div>
          <div className="modal-actions">
            {showCancelButton && <button
              ref={cancelButtonRef}
              className="btn btn-secondary"
              onClick={onClose}
              aria-label={cancelText}
              disabled={isProcessing}
            >
              {cancelText}
            </button>}
            <LoadingButton
              ref={confirmButtonRef}
              className={confirmButtonClass}
              onClick={onConfirm}
              aria-label={confirmText}
              disabled={confirmDisabled}
              isLoading={isProcessing}
              loadingText={processingText}
            >
              {confirmText}
            </LoadingButton>
          </div>
        </div>
        <style jsx>{`
          .modal-overlay {
            position: fixed;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
            z-index: 10000;
            animation: fadeIn 0.2s ease-out;
          }

          .modal-content {
            display: flex;
            flex-direction: column;
            width: 520px;
            max-width: 92vw;
            min-height: 220px;
            height: auto;
            max-height: 90vh;
            overflow: hidden;
            background: var(--bg-primary);
            padding: 1.25rem;
            border-radius: var(--radius-xl);
            box-shadow: var(--shadow-xl);
            border: 1px solid var(--border-color);
            animation: scaleIn 0.3s ease-out;
          }

          .modal-step {
            display: flex;
            flex: 1;
            min-height: 0;
            flex-direction: column;
            animation: stepIn 0.2s ease-out;
          }

          .modal-content.centered-copy .modal-step {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            margin: 0;
            padding: 0;
            transform: translateY(0.45rem);
          }

          .modal-content.centered-copy .modal-title,
          .modal-content.centered-copy .modal-description {
            width: 100%;
            text-align: center;
          }

          .modal-content.centered-copy .modal-title {
            margin: 0 0 0.25rem;
          }

          .modal-content.centered-copy .modal-description {
            margin: 0;
          }

          .modal-title {
            flex: 0 0 auto;
            font-family: var(--font-heading);
            font-size: 1.15rem;
            font-weight: 700;
            color: var(--text-primary);
            margin: 0 0 0.35rem;
          }

          .modal-description {
            flex: 0 0 auto;
            color: var(--text-secondary);
            font-size: 0.8rem;
            line-height: 1.45;
            margin: 0;
          }

          .modal-body {
            display: flex;
            flex: 1;
            flex-direction: column;
            justify-content: center;
            overflow: auto;
            padding: 0.5rem 0;
          }

          .modal-body:empty {
            display: none;
          }

          .modal-actions {
            display: flex;
            flex: 0 0 auto;
            gap: 0.75rem;
            justify-content: flex-end;
            padding-top: 0.75rem;
            border-top: 1px solid var(--border-color);
          }

          .modal-actions :global(button) {
            min-height: 32px;
            padding: 0.35rem 0.8rem;
            font-size: 0.75rem;
          }

          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
          @keyframes stepIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

          @media (max-width: 480px) {
            .modal-overlay { padding: .75rem; }
            .modal-content { width: 520px; max-width: 92vw; min-height: 200px; height: auto; padding: 1rem; }
          }
        `}</style>
      </div>,
      document.body
  );
});

export default LogoutConfirmationModal;
