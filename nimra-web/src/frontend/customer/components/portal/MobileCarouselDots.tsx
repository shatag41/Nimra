interface MobileCarouselDotsProps {
  count: number;
  activeIndex: number;
  label: string;
  onSelect: (index: number) => void;
}

export function MobileCarouselDots({ count, activeIndex, label, onSelect }: MobileCarouselDotsProps) {
  if (count <= 1) return null;

  return (
    <div className="mobile-carousel-dots" aria-label={label}>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className={`mobile-carousel-dot ${index === activeIndex ? 'active' : ''}`}
          onClick={() => onSelect(index)}
          aria-label={`Show item ${index + 1}`}
          aria-current={index === activeIndex ? 'page' : undefined}
        />
      ))}
      <style jsx>{`
        .mobile-carousel-dots {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-top: 10px;
          width: 100%;
          padding: 0;
        }
        .mobile-carousel-dot {
          width: 7px;
          height: 7px;
          flex: 0 0 7px;
          margin: 0;
          padding: 0;
          border-radius: 50%;
          background-color: #d1d5db;
          cursor: pointer;
          transition: background-color 150ms ease;
        }
        .mobile-carousel-dot.active { background-color: #2563eb; }
      `}</style>
    </div>
  );
}
