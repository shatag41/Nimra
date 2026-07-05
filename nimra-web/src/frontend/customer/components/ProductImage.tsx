'use client';

import React from 'react';

interface ProductImageProps {
  src?: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  style?: React.CSSProperties;
  imgStyle?: React.CSSProperties;
}

/**
 * Global product image component.
 * Always renders a wider 3:4 portrait container with object-fit: contain so every
 * product image keeps the full product visible inside a uniform card layout.
 */
export default function ProductImage({
  src,
  alt,
  className = '',
  containerClassName = '',
  style,
  imgStyle,
}: ProductImageProps) {
  const defaultContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    aspectRatio: '3 / 4',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--product-image-bg, var(--product-img-bg, #f4f6f8))',
    ...style,
  };

  const defaultImgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    objectPosition: 'center',
    display: 'block',
    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    ...imgStyle,
  };

  if (!src) {
    return (
      <div className={`product-image-container ${containerClassName}`} style={defaultContainerStyle}>
        <span className="product-img-fallback">NIMRA</span>
      </div>
    );
  }

  return (
    <div className={`product-image-container ${containerClassName}`} style={defaultContainerStyle}>
      <img
        src={src}
        alt={alt}
        className={`product-img ${className}`}
        style={defaultImgStyle}
        loading="lazy"
        decoding="async"
        onError={(e) => {
          const target = e.currentTarget;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent && !parent.querySelector('.product-img-fallback')) {
            const fallback = document.createElement('span');
            fallback.className = 'product-img-fallback';
            fallback.textContent = 'NIMRA';
            parent.appendChild(fallback);
          }
        }}
      />
    </div>
  );
}
