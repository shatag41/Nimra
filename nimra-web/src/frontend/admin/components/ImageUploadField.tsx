'use client';

import React, { useEffect, useRef, useState } from 'react';
import { getUploadImageUrl } from '@/utils/uploadImage';

interface ImageUploadFieldProps {
  label: string;
  value?: string;
  scope: 'products' | 'banners';
  aspect?: 'product' | 'upcoming' | 'wide';
  required?: boolean;
  disabled?: boolean;
  onChange: (url: string) => void;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const PRODUCT_RATIO_W = 3;
const PRODUCT_RATIO_H = 4;
const WIDE_OUT_W = 1600;
const WIDE_OUT_H = 900;

function isProductRatio(width: number, height: number) {
  return width > 0 && height > 0 && width * PRODUCT_RATIO_H === height * PRODUCT_RATIO_W;
}

function isSquareRatio(width: number, height: number) {
  return width > 0 && height > 0 && width === height;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read the image file.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Unable to load the selected image.'));
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/jpeg', quality = 0.9): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to optimize image.'));
    }, type, quality);
  });
}

function drawCroppedToCanvas(
  img: HTMLImageElement,
  canvas: HTMLCanvasElement,
  targetW: number,
  targetH: number,
) {
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to optimize image.');

  const targetAspect = targetW / targetH;
  const srcAspect = img.width / img.height;
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;

  if (srcAspect > targetAspect) {
    sw = Math.round(img.height * targetAspect);
    sx = Math.round((img.width - sw) / 2);
  } else if (srcAspect < targetAspect) {
    sh = Math.round(img.width / targetAspect);
    sy = Math.round((img.height - sh) / 2);
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetW, targetH);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
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

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('scope', scope);
    formData.append('imageKind', aspect);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();

    if (!res.ok || !data.success || !data.path) {
      throw new Error(data.message || 'Upload failed.');
    }

    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(URL.createObjectURL(file));
    onChange(data.path);
  };

  const processAndUploadFile = async (file: File) => {
    setError('');

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Use a JPG, PNG, WebP, or GIF image.');
      return;
    }

    setUploading(true);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const img = await loadImage(dataUrl);

      if (aspect === 'product') {
        if (!isProductRatio(img.width, img.height)) {
          throw new Error(`Product image must use a 3:4 ratio. Selected image is ${img.width}x${img.height}px.`);
        }

        await uploadFile(file);
        return;
      }

      if (aspect === 'upcoming') {
        if (!isSquareRatio(img.width, img.height)) {
          throw new Error(`Upcoming product image must use a square 1:1 ratio. Selected image is ${img.width}x${img.height}px.`);
        }

        await uploadFile(file);
        return;
      }

      const canvas = document.createElement('canvas');
      drawCroppedToCanvas(img, canvas, WIDE_OUT_W, WIDE_OUT_H);
      const blob = await canvasToBlob(canvas, 'image/jpeg', 0.9);
      const optimizedFile = new File(
        [blob],
        file.name.replace(/\.[^/.]+$/, `_${WIDE_OUT_W}x${WIDE_OUT_H}.jpg`),
        { type: 'image/jpeg' },
      );

      await uploadFile(optimizedFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file && !disabled && !uploading) void processAndUploadFile(file);
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
  const sizeLabel = aspect === 'product'
    ? '3:4 product image'
    : aspect === 'upcoming'
      ? '1:1 upcoming product image'
      : '1600 x 900px, 16:9 banner';

  return (
    <div className={`form-group image-upload-field image-upload-field-${aspect}`}>
      <div className="image-upload-heading">
        <label>{label}</label>
        <span>{sizeLabel}</span>
      </div>

      <div
        className={`image-upload image-upload-${aspect} ${isDragging ? 'is-dragging' : ''} ${hasImage ? 'has-image' : ''}`}
        onDragEnter={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
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
          <div className={`image-upload-preview ${aspect}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewSrc} alt={`${label} preview`} />
            {uploading && <div className="image-upload-progress">{aspect === 'wide' ? 'Optimizing and uploading...' : 'Validating and uploading...'}</div>}
          </div>
        ) : (
          <button
            type="button"
            className={`image-upload-empty ${aspect}`}
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
          >
            <span className="image-upload-icon">Upload</span>
            <strong>Drag and drop an image here</strong>
            <small>
              {aspect === 'product'
                ? 'JPG, PNG, WebP, or GIF. Must be 3:4 ratio.'
                : aspect === 'upcoming'
                  ? 'Square 1:1 image. Transparent PNG preferred; the full product stays visible.'
                : 'JPG, PNG, WebP, or GIF. Saved as 1600x900px.'}
            </small>
          </button>
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

      {error && <p className="image-upload-error">{error}</p>}
      {uploading && <p className="image-upload-note">{aspect === 'wide' ? 'Resizing and uploading...' : 'Validating and uploading...'}</p>}
      {!error && !uploading && value && (
        <p className="image-upload-note">
          {aspect === 'product'
            ? 'Product images must remain 3:4 ratio.'
            : aspect === 'upcoming'
              ? 'Square images are centered and scaled uniformly without cropping. Transparent PNG is preferred.'
            : 'Saved image will display automatically on the site.'}
        </p>
      )}
    </div>
  );
}
