'use client';

import React, { useEffect, useRef } from 'react';

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
}: LogoutConfirmationModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isProcessing) {
          onClose();
        }
        if (e.key === 'Tab') {
          e.preventDefault();
          const focusableElements = [
            confirmButtonRef.current,
            cancelButtonRef.current,
          ].filter(Boolean) as HTMLElement[];
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
  }, [isOpen, onClose, isProcessing]);

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

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div
        ref={overlayRef}
        className="modal-overlay"
        onClick={() => !isProcessing && onClose()}
        role="presentation"
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-title" className="modal-title">
          {title}
        </h2>
        <p id="modal-description" className="modal-description">
          {description}
        </p>
        <div className="modal-actions">
          <button
            ref={cancelButtonRef}
            className="btn btn-secondary"
            onClick={onClose}
            aria-label={cancelText}
            disabled={isProcessing}
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            className={confirmButtonClass}
            onClick={onConfirm}
            aria-label={confirmText}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          z-index: 10000;
          animation: fadeIn 0.2s ease-out;
        }

        .modal-content {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: var(--bg-primary);
          padding: 2rem;
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
          border: 1px solid var(--border-color);
          z-index: 10001;
          width: 90%;
          max-width: 400px;
          animation: scaleIn 0.3s ease-out;
        }

        .modal-title {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 0.75rem 0;
        }

        .modal-description {
          color: var(--text-secondary);
          font-size: 0.95rem;
          margin: 0 0 1.5rem 0;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        @media (max-width: 480px) {
          .modal-content {
            width: 95%;
            padding: 1.5rem;
          }

          .modal-actions {
            flex-direction: column-reverse;
          }
        }
      `}</style>
    </>
  );
});

export default LogoutConfirmationModal;
