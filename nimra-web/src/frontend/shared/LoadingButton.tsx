'use client';

import React from 'react';

type LoadingButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  loadingText: string;
};

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(function LoadingButton({ isLoading = false, loadingText, disabled, children, onClick, ...props }, forwardedRef) {
  const clickLock = React.useRef(false);

  React.useEffect(() => {
    if (!isLoading) clickLock.current = false;
  }, [isLoading]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isLoading || clickLock.current) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    clickLock.current = true;
    onClick?.(event);
    // Validation-only clicks do not set an external pending state. Release the
    // synchronous lock after the event; real requests remain disabled by isLoading.
    queueMicrotask(() => { if (!isLoading) clickLock.current = false; });
  };

  return (
    <button ref={forwardedRef} {...props} disabled={disabled || isLoading} aria-busy={isLoading || undefined} onClick={handleClick}>
      {isLoading ? <span className="shared-loading-button-content"><span className="shared-loading-button-spinner" aria-hidden="true" />{loadingText}</span> : children}
    </button>
  );
});

export default LoadingButton;
