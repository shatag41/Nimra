'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ProductModalShellProps {
  title: React.ReactNode;
  titleId: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function ProductModalShell({ title, titleId, onClose, children }: ProductModalShellProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
    };
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <div className="modal-backdrop glass product-modal-backdrop">
      <div
        className="modal-card product-modal-card animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="modal-header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
