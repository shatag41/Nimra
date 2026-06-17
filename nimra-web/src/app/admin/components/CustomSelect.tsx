import React, { useState, useEffect, useRef } from 'react';
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
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  clearable = false,
  onClear
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

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
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isOpen]);

  const selectedOpt = options.find(o => o.value === value);

  return (
    <div ref={containerRef} className="custom-select-container">
      <div 
        onClick={() => setIsOpen(!isOpen)} 
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
      {isOpen && typeof window !== 'undefined' && createPortal(
        <div 
          className="custom-select-options-list"
          style={{
            position: 'absolute',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            zIndex: 999999
          }}
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
        </div>,
        document.body
      )}
    </div>
  );
}
