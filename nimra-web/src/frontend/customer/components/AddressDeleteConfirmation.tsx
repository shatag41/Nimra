'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import LoadingButton from '@/frontend/shared/LoadingButton';

interface AddressDeleteConfirmationProps {
  addressType: string;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function AddressDeleteConfirmation({ addressType, isDeleting, onCancel, onConfirm }: AddressDeleteConfirmationProps) {
  React.useEffect(() => {
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => { document.documentElement.style.overflow = previousOverflow; };
  }, []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="delete-modal-overlay" role="presentation" onClick={() => !isDeleting && onCancel()}>
      <div className="delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-address-title" onClick={(event) => event.stopPropagation()}>
        <div className="delete-modal-icon" aria-hidden="true">!</div>
        <h3 id="delete-address-title">Delete {addressType} address?</h3>
        <p>This saved address will be permanently removed from your account.</p>
        <div className="delete-modal-actions">
          <button type="button" className="btn-cancel-delete" disabled={isDeleting} onClick={onCancel}>No, keep it</button>
          <LoadingButton type="button" className="btn-confirm-delete" isLoading={isDeleting} loadingText="Deleting..." onClick={onConfirm}>Yes, delete</LoadingButton>
        </div>
      </div>
      <style jsx>{`
        .delete-modal-overlay { position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:1rem;background:rgba(15,23,42,.58);backdrop-filter:blur(7px);animation:modal-fade 200ms ease-out both; }
        .delete-modal { width:min(380px,100%);max-height:calc(100dvh - 2rem);box-sizing:border-box;overflow:auto;padding:1.35rem;text-align:center;border:1px solid var(--border-color);border-radius:var(--radius-xl);background:var(--bg-primary);color:var(--text-primary);box-shadow:0 24px 70px rgba(15,23,42,.3);animation:modal-scale 220ms cubic-bezier(.22,1,.36,1) both; }
        .delete-modal-icon { display:grid;place-items:center;width:40px;height:40px;margin:0 auto .7rem;border-radius:50%;background:rgba(239,68,68,.12);color:#dc2626;font-size:1.15rem;font-weight:800; }
        .delete-modal h3 { margin:0;font-size:1.15rem; }
        .delete-modal p { margin:.5rem 0 1.25rem;color:var(--text-secondary);line-height:1.45;font-size:.88rem; }
        .delete-modal-actions { display:flex;justify-content:center;gap:.65rem; }
        .delete-modal-actions button { padding:.6rem .85rem;border-radius:var(--radius-md);font-weight:700;cursor:pointer;font-size:.85rem; }
        .btn-cancel-delete { border:1px solid var(--border-color);background:transparent;color:var(--text-primary); }
        .btn-confirm-delete { border:1px solid #ef4444;background:#ef4444;color:white; }
        button:disabled { opacity:.6;cursor:not-allowed; }
        @keyframes modal-fade { from { opacity:0; } to { opacity:1; } }
        @keyframes modal-scale { from { opacity:0;transform:scale(.96) translateY(8px); } to { opacity:1;transform:scale(1) translateY(0); } }
      `}</style>
    </div>,
    document.body
  );
}
