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

export default function ProductImage({
  src,
  alt,
  className = '',
  containerClassName = '',
  style,
  imgStyle,
}: ProductImageProps) {
  // Check if image is transparent format
  const isTransparent = src
    ? src.toLowerCase().endsWith('.png') ||
      src.toLowerCase().endsWith('.webp') ||
      src.toLowerCase().includes('transparent') ||
      src.toLowerCase().endsWith('.svg')
    : false;

  const defaultContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    aspectRatio: '4 / 5',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent', // Transparent background to use matching card background
    padding: 0,
    borderRadius: 'inherit',
    ...style,
  };

  const defaultImgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: isTransparent ? 'contain' : 'cover', // Use contain for PNGs to prevent clipping, cover for standard photos
    objectPosition: 'center',
    display: 'block',
    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    background: 'transparent',
    padding: isTransparent ? '0.5rem' : '0', // Elegant padding if transparent to fit nicely
    ...imgStyle,
  };

  if (!src) {
    return (
      <div
        className={`product-image-container fallback-bg ${containerClassName}`}
        style={defaultContainerStyle}
      >
        <span style={{ fontSize: '1.5rem', opacity: 0.3 }}>💧</span>
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
      />
    </div>
  );
}
