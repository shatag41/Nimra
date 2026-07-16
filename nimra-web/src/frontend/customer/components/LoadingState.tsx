'use client';

type LoadingStateProps = {
  label?: string;
  compact?: boolean;
};

export default function LoadingState({ label = 'Loading', compact = false }: LoadingStateProps) {
  return (
    <div className={`route-loading-skeleton ${compact ? 'compact' : ''}`} aria-label={label} aria-busy="true" role="status">
      <span className="route-skeleton-heading" />
      <span className="route-skeleton-copy" />
      <div className="route-skeleton-grid">
        {Array.from({ length: compact ? 2 : 4 }, (_, index) => <span key={index} />)}
      </div>
      <small>{label}…</small>
      <style jsx>{`
        .route-loading-skeleton { width:min(1180px,calc(100% - 2rem)); min-height:62vh; margin:0 auto; padding:clamp(1.5rem,5vw,4rem) 0; display:grid; align-content:start; gap:.9rem; color:var(--text-secondary); }
        .route-loading-skeleton.compact { min-height:240px; padding:1rem 0; }
        .route-skeleton-heading,.route-skeleton-copy,.route-skeleton-grid span { display:block; border-radius:14px; background:linear-gradient(90deg,var(--bg-secondary),color-mix(in srgb,var(--primary-color) 9%,var(--bg-secondary)),var(--bg-secondary)); background-size:200% 100%; animation:route-shimmer 1.25s infinite linear; }
        .route-skeleton-heading { width:min(440px,68%); height:34px; }.route-skeleton-copy { width:min(620px,88%); height:16px; }
        .route-skeleton-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1rem; margin-top:.8rem; }.route-skeleton-grid span { min-height:${compact ? '90px' : '180px'}; }
        .route-loading-skeleton small { font-size:.78rem; }
        @keyframes route-shimmer { to { background-position:-200% 0; } }
        @media(max-width:700px){.route-skeleton-grid{grid-template-columns:1fr}.route-skeleton-grid span{min-height:120px}}
        @media(prefers-reduced-motion:reduce){.route-skeleton-heading,.route-skeleton-copy,.route-skeleton-grid span{animation:none}}
      `}</style>
    </div>
  );
}
