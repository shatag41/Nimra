import React, { useState, useEffect, useRef } from 'react';

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
      {isOpen && (
        <div className="custom-select-options-list">
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
      )}
    </div>
  );
}
