import React from 'react';

interface CustomerPageHeaderProps {
  badge: string;
  title: string;
  subtitle: string;
  className?: string;
  height?: number | string;
  children?: React.ReactNode;
}

export default function CustomerPageHeader({
  badge,
  title,
  subtitle,
  className = '',
  height,
  children,
}: CustomerPageHeaderProps) {
  const headingId = React.useId();
  const resolvedHeight = typeof height === 'number' ? `${height}px` : height;

  return (
    <section
      className={`customer-page-header animate-slide-up ${className}`.trim()}
      aria-labelledby={headingId}
      style={resolvedHeight ? ({ '--customer-page-header-height': resolvedHeight } as React.CSSProperties) : undefined}
    >
      <div className="customer-page-header__glow customer-page-header__glow--left" aria-hidden="true" />
      <div className="customer-page-header__glow customer-page-header__glow--right" aria-hidden="true" />

      <div className="customer-page-header__content">
        <span className="customer-page-header__badge">{badge}</span>
        <h1 id={headingId}>{title}</h1>
        <p>{subtitle}</p>
        {children && <div className="customer-page-header__children">{children}</div>}
      </div>

      <style jsx>{`
        .customer-page-header {
          --customer-page-header-height: clamp(2rem, 3vw, 2.5rem);
          position: relative;
          isolation: isolate;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100vw;
          min-height: var(--customer-page-header-height);
          padding-block: clamp(1rem, 2.2vw, 1.35rem) !important;
          margin: calc(55px - var(--ds-header-offset)) calc(50% - 50vw) clamp(0.95rem, 1.6vw, 1.2rem);
          overflow: hidden;
          border: 1px solid rgba(147, 197, 253, 0.42);
          border-top: 0;
          border-radius: 0 0 clamp(0.85rem, 1.3vw, 1.1rem) clamp(0.85rem, 1.3vw, 1.1rem);
          background:
            radial-gradient(circle at 18% 18%, rgba(147, 197, 253, 0.34), transparent 32%),
            radial-gradient(circle at 83% 52%, rgba(125, 211, 252, 0.28), transparent 34%),
            linear-gradient(110deg, #edf6ff 0%, #ffffff 49%, #dff5ff 100%);
          box-shadow:
            0 12px 30px rgba(37, 99, 235, 0.08),
            inset 0 1px rgba(255, 255, 255, 0.74);
        }

        .customer-page-header::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: -2;
          background:
            linear-gradient(90deg, rgba(255, 255, 255, 0.76), transparent 28%, transparent 72%, rgba(255, 255, 255, 0.38)),
            repeating-linear-gradient(120deg, rgba(255, 255, 255, 0.16) 0 1px, transparent 1px 42px);
          opacity: 0.88;
        }

        .customer-page-header::after {
          content: '';
          position: absolute;
          left: 17%;
          bottom: -1px;
          width: min(18rem, 28vw);
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.95), transparent);
          opacity: 0.9;
        }

        .customer-page-header__glow {
          position: absolute;
          z-index: -1;
          border-radius: 999px;
          filter: blur(8px);
          pointer-events: none;
        }

        .customer-page-header__glow--left {
          left: clamp(1rem, 8vw, 7rem);
          top: -4rem;
          width: clamp(6rem, 16vw, 14rem);
          height: clamp(6rem, 16vw, 14rem);
          background: rgba(96, 165, 250, 0.14);
        }

        .customer-page-header__glow--right {
          right: clamp(1rem, 9vw, 8rem);
          bottom: -5rem;
          width: clamp(6.5rem, 18vw, 15rem);
          height: clamp(6.5rem, 18vw, 15rem);
          background: rgba(56, 189, 248, 0.14);
        }

        .customer-page-header__content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: min(100% - 2rem, 560px);
          padding: 0;
          text-align: center;
        }

        .customer-page-header__badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 1.45rem;
          padding: 0.12rem 0.7rem;
          border: 1px solid rgba(37, 99, 235, 0.2);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.72);
          color: #2563eb;
          box-shadow:
            0 8px 20px rgba(37, 99, 235, 0.06),
            inset 0 1px rgba(255, 255, 255, 0.82);
          font-size: clamp(0.5rem, 0.48rem + 0.12vw, 0.6rem);
          font-weight: 850;
          letter-spacing: 0.11em;
          line-height: 1;
          text-transform: uppercase;
        }

        .customer-page-header h1 {
          margin: 0.08rem 0 0.04rem;
          background: linear-gradient(135deg, #0f2a55 0%, #1e3a8a 50%, #2563eb 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          font-family: var(--font-heading, inherit);
          font-size: clamp(1.2rem, 1.45vw, 1.55rem);
          font-weight: 900;
          letter-spacing: -0.035em;
          line-height: 1.2;
          padding-bottom: 0.1em;
        }

        .customer-page-header p {
          max-width: 560px;
          margin: 0;
          color: #64748b;
          font-size: clamp(0.72rem, 0.74vw, 0.84rem);
          font-weight: 500;
          line-height: 1.18;
        }

        .customer-page-header__children {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-top: 0.12rem;
        }

        :global([data-theme="dark"]) .customer-page-header {
          border-color: rgba(96, 165, 250, 0.22);
          background:
            radial-gradient(circle at 18% 18%, rgba(37, 99, 235, 0.24), transparent 34%),
            radial-gradient(circle at 83% 52%, rgba(14, 165, 233, 0.18), transparent 34%),
            linear-gradient(110deg, #081525 0%, #0f172a 48%, #0b2436 100%);
          box-shadow: 0 20px 52px rgba(0, 0, 0, 0.3);
        }

        :global([data-theme="dark"]) .customer-page-header::before {
          display: none;
        }

        :global([data-theme="dark"]) .customer-page-header__badge {
          border-color: rgba(96, 165, 250, 0.28);
          background: rgba(15, 23, 42, 0.62);
          color: #93c5fd;
          box-shadow: inset 0 1px rgba(255, 255, 255, 0.05);
        }

        :global([data-theme="dark"]) .customer-page-header h1 {
          background: linear-gradient(135deg, #f8fafc 0%, #bfdbfe 52%, #60a5fa 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        :global([data-theme="dark"]) .customer-page-header p {
          color: #cbd5e1;
        }

        @media (max-width: 640px) {
          .customer-page-header {
            width: 100vw;
            min-height: clamp(1.9rem, 7.2vw, 2.3rem);
            padding-block: clamp(0.6rem, 1.5vw, 0.8rem) !important;
            margin-bottom: 0.8rem;
          }

          .customer-page-header__content {
            width: min(100% - 1.2rem, 560px);
            padding-block: 0;
          }

          .customer-page-header__badge {
            min-height: 1.34rem;
            padding: 0.1rem 0.62rem;
          }

          .customer-page-header h1 {
            font-size: clamp(0.98rem, 4.6vw, 1.2rem);
          }

          .customer-page-header p {
            font-size: clamp(0.64rem, 2.7vw, 0.76rem);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .customer-page-header,
          .customer-page-header * {
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.001ms !important;
          }
        }
      `}</style>
    </section>
  );
}
