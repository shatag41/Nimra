'use client';

import React, { useEffect, useRef, useState } from 'react';
import { getUploadImageUrl } from '@/utils/uploadImage';

interface ImageUploadFieldProps {
  label: string;
  value?: string;
  scope: 'products' | 'banners';
  aspect?: 'product' | 'wide';
  required?: boolean;
  disabled?: boolean;
  onChange: (url: string) => void;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Minimum dimensions before rejecting
const PRODUCT_MIN_W = 640;
const PRODUCT_MIN_H = 480;

// Output canvas size for product images (4:3 landscape)
const PRODUCT_OUT_W = 1200;
const PRODUCT_OUT_H = 900;

// Wide output (16:9 banner)
const WIDE_OUT_W = 1600;
const WIDE_OUT_H = 900;

/**
 * Center-crop `img` to the given target aspect ratio, then draw it
 * onto a canvas at the target output size.
 */
function drawCroppedToCanvas(
  img: HTMLImageElement,
  canvas: HTMLCanvasElement,
  targetW: number,
  targetH: number,
): void {
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const targetAspect = targetW / targetH;
  const srcAspect = img.width / img.height;

  let sx = 0, sy = 0, sw = img.width, sh = img.height;

  if (srcAspect > targetAspect) {
    // Source is wider than target — crop the sides
    sw = Math.round(img.height * targetAspect);
    sx = Math.round((img.width - sw) / 2);
  } else if (srcAspect < targetAspect) {
    // Source is taller than target — crop top/bottom
    sh = Math.round(img.width / targetAspect);
    sy = Math.round((img.height - sh) / 2);
  }

  // White background for JPEG (transparent for PNG)
  const isPNG = img.src.startsWith('data:image/png') || img.src.startsWith('data:image/gif');
  if (!isPNG) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);
  } else {
    ctx.clearRect(0, 0, targetW, targetH);
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
}

export default function ImageUploadField({
  label,
  value,
  scope,
  aspect = 'product',
  required = false,
  disabled = false,
  onChange,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [localPreview, setLocalPreview] = useState('');

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const processAndUploadFile = (file: File) => {
    setError('');

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Use a JPG, PNG, WebP, or GIF image.');
      return;
    }

    setUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        // ── Minimum resolution guard ─────────────────────────
        if (aspect === 'product') {
          if (img.width < PRODUCT_MIN_W || img.height < PRODUCT_MIN_H) {
            setError(
              `Image too small (${img.width}x${img.height}px). Minimum required: ${PRODUCT_MIN_W}x${PRODUCT_MIN_H}px. Recommended: 1200x900px or any 4:3 size such as 1600x1200px.`
            );
            setUploading(false);
            return;
          }
        }

        // ── Auto center-crop + resize to standard output size ─
        const canvas = document.createElement('canvas');
        const targetW = aspect === 'product' ? PRODUCT_OUT_W : WIDE_OUT_W;
        const targetH = aspect === 'product' ? PRODUCT_OUT_H : WIDE_OUT_H;

        if (aspect === 'product') {
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setError('Failed to optimize image.');
            setUploading(false);
            return;
          }

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, targetW, targetH);

          const scale = Math.min(targetW / img.width, targetH / img.height);
          const drawW = Math.round(img.width * scale);
          const drawH = Math.round(img.height * scale);
          const dx = Math.round((targetW - drawW) / 2);
          const dy = Math.round((targetH - drawH) / 2);
          ctx.drawImage(img, 0, 0, img.width, img.height, dx, dy, drawW, drawH);
        } else {
          drawCroppedToCanvas(img, canvas, targetW, targetH);
        }

        const isPNG = file.type === 'image/png' || file.type === 'image/gif';
        const mimeType = isPNG ? 'image/png' : 'image/jpeg';
        const extension = isPNG ? 'png' : 'jpg';

        canvas.toBlob(
          async (blob) => {
            if (!blob) {
              setError('Failed to optimize image.');
              setUploading(false);
              return;
            }

            const optimizedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, `_optimized.${extension}`),
              { type: mimeType }
            );

            try {
              const formData = new FormData();
              formData.append('file', optimizedFile);
              formData.append('scope', scope);

              const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
              });
              const data = await res.json();

              if (!res.ok || !data.success || !data.path) {
                throw new Error(data.message || 'Upload failed.');
              }

              const previewUrl = URL.createObjectURL(optimizedFile);
              if (localPreview) URL.revokeObjectURL(localPreview);
              setLocalPreview(previewUrl);
              onChange(data.path);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Upload failed.');
            } finally {
              setUploading(false);
              if (inputRef.current) inputRef.current.value = '';
            }
          },
          mimeType,
          0.88 // 88% quality — great balance of file size vs. visual quality
        );
      };
      img.onerror = () => {
        setError('Failed to load image file.');
        setUploading(false);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) processAndUploadFile(file);
  };

  const handleRemove = () => {
    setError('');
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
      setLocalPreview('');
    }
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const previewSrc = localPreview || getUploadImageUrl(value);
  const hasImage = Boolean(previewSrc);

  return (
    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <label>{label}</label>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          {aspect === 'product'
            ? 'Recommended: 1200 x 900 px (4:3), also 1600 x 1200 px'
            : 'Recommended: 1600 x 900 px (16:9 Ratio)'}
        </span>
      </div>

      <div
        className={`image-upload ${isDragging ? 'is-dragging' : ''} ${hasImage ? 'has-image' : ''}`}
        onDragEnter={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (!disabled) handleFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          className="image-upload-input"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          required={required && !value}
          disabled={disabled || uploading}
          onChange={(e) => handleFiles(e.target.files)}
        />

        {hasImage ? (
          <div
            className={`image-upload-preview ${aspect}`}
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: aspect === 'product' ? '4 / 3' : '16 / 9',
              maxHeight: aspect === 'product' ? '260px' : '160px',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewSrc}
              alt={`${label} preview`}
              style={{ width: '100%', height: '100%', objectFit: aspect === 'product' ? 'contain' : 'cover', background: 'var(--product-img-bg, #f4f6f8)' }}
            />
            {uploading && <div className="image-upload-progress">Optimizing &amp; Uploading...</div>}
          </div>
        ) : (
          <div className={`image-upload-empty ${aspect}`}>
            <span className="image-upload-icon">Upload</span>
            <strong>Drag and drop an image here</strong>
            <small>JPG, PNG, WebP, or GIF - min {aspect === 'product' ? '640x480px' : '800x450px'}</small>
          </div>
        )}

        <div className="image-upload-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
          >
            {hasImage ? 'Replace Image' : 'Browse Image'}
          </button>
          {hasImage && (
            <button
              type="button"
              className="btn btn-danger btn-sm"
              disabled={disabled || uploading}
              onClick={handleRemove}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {error && <p className="image-upload-error" style={{ marginTop: '0.5rem' }}>{error}</p>}
      {uploading && <p className="image-upload-note">{aspect === 'product' ? 'Fitting into 4:3' : 'Auto-cropping to 16:9'}, compressing, and uploading...</p>}
      {!error && !uploading && value && <p className="image-upload-note">Saved image will display automatically on the site.</p>}
    </div>
  );
}
