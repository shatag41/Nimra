import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface CustomSelectOption {
  value: string;
  label: string;
}

export interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  clearable?: boolean;
  onClear?: () => void;
  portalMenu?: boolean;
}

interface PortalMenuPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  clearable = false,
  onClear,
  portalMenu = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [portalPosition, setPortalPosition] = useState<PortalMenuPosition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const updatePortalPosition = useCallback(() => {
    if (!portalMenu || !triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const viewportPadding = 8;
    const menuGap = 6;
    const desiredHeight = Math.min(148, options.length * 34 + 8);
    const spaceBelow = window.innerHeight - rect.bottom - menuGap - viewportPadding;
    const spaceAbove = rect.top - menuGap - viewportPadding;
    const openAbove = spaceBelow < desiredHeight && spaceAbove > spaceBelow;
    const availableHeight = openAbove ? spaceAbove : spaceBelow;
    const maxHeight = Math.max(48, Math.min(desiredHeight, availableHeight));
    const width = Math.min(rect.width, window.innerWidth - viewportPadding * 2);
    const viewportLeft = Math.min(
      Math.max(rect.left, viewportPadding),
      window.innerWidth - width - viewportPadding
    );

    setPortalPosition({
      top: (openAbove ? rect.top - maxHeight - menuGap : rect.bottom + menuGap) + window.scrollY,
      left: viewportLeft + window.scrollX,
      width,
      maxHeight,
    });
  }, [options.length, portalMenu]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (containerRef.current && containerRef.current.contains(target)) {
        return;
      }
      if (target.closest('.custom-select-options-list')) {
        return;
      }
      setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen || !portalMenu) return;

    updatePortalPosition();
    const handleViewportChange = () => updatePortalPosition();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    const resizeObserver = new ResizeObserver(handleViewportChange);
    if (triggerRef.current) resizeObserver.observe(triggerRef.current);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
      resizeObserver.disconnect();
    };
  }, [isOpen, portalMenu, updatePortalPosition]);

  const selectedOpt = options.find(o => o.value === value);

  const optionsMenu = (
    <div
      className={`custom-select-options-list ${portalMenu ? 'custom-select-options-list-portal' : ''}`}
      style={portalMenu && portalPosition ? {
        top: portalPosition.top,
        left: portalPosition.left,
        width: portalPosition.width,
        maxHeight: portalPosition.maxHeight,
      } : undefined}
    >
      {options.map((opt) => (
        <div
          key={opt.value}
          onClick={() => {
            onChange(opt.value);
            setIsOpen(false);
          }}
          className={`custom-select-option ${opt.value === value ? 'selected' : ''}`}
        >
          {opt.label}
        </div>
      ))}
    </div>
  );

  return (
    <div ref={containerRef} className="custom-select-container">
      <div
        ref={triggerRef}
        onClick={() => {
          if (!isOpen && portalMenu) updatePortalPosition();
          setIsOpen(!isOpen);
        }}
        className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
      >
        <span className="custom-select-text">{selectedOpt ? selectedOpt.label : placeholder}</span>
        <div className="custom-select-actions">
          {clearable && value !== 'All' && value !== 'latest' && onClear && (
            <span 
              onClick={(e) => {
                e.stopPropagation();
                onClear();
                setIsOpen(false);
              }} 
              className="custom-select-clear"
            >
              ✕
            </span>
          )}
          <span className="custom-select-arrow">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </span>
        </div>
      </div>
      {isOpen && (!portalMenu ? optionsMenu : portalPosition && createPortal(optionsMenu, document.body))}
    </div>
  );
}
