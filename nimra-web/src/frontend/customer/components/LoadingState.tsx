import React from 'react';

type LoadingStateProps = {
  label?: string;
  compact?: boolean;
};

export default function LoadingState({ label = 'Loading experience', compact = false }: LoadingStateProps) {
  return (
    <div className={`loading-state ds-loading-state ${compact ? 'compact' : ''}`} role="status" aria-live="polite">
      <span className="ds-loading-orb" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
