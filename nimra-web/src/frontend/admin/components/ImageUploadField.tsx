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

const MAX_FILE_SIZE = 15 * 1024 * 1024; // Limit to 15MB for raw uploads
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

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
  const [warning, setWarning] = useState('');
  const [localPreview, setLocalPreview] = useState('');

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const processAndUploadFile = (file: File) => {
    setError('');
    setWarning('');

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
        const fileAspect = img.width / img.height;
        const targetAspect = aspect === 'product' ? 0.8 : 16 / 9; // 4:5 portrait is 0.8

        // Warning if aspect ratio differs significantly (more than 10% difference)
        const aspectDiff = Math.abs(fileAspect - targetAspect);
        if (aspect === 'product' && aspectDiff > 0.08) {
          setWarning(
            `Warning: The uploaded image aspect ratio (${fileAspect.toFixed(2)}) differs significantly from the recommended 4:5 portrait aspect ratio. It may look stretched or cropped.`
          );
        }

        // Automatic compression and optimization using canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set maximum boundary sizes while keeping original aspect ratio
        const maxW = aspect === 'product' ? 1200 : 1600;
        const maxH = aspect === 'product' ? 1500 : 900;
        
        let width = img.width;
        let height = img.height;

        if (width > maxW || height > maxH) {
          if (width / height > maxW / maxH) {
            width = maxW;
            height = Math.round(maxW / fileAspect);
          } else {
            height = maxH;
            width = Math.round(maxH * fileAspect);
          }
        }

        canvas.width = width;
        canvas.height = height;

        if (ctx) {
          // Fill background with white for JPEG format
          const isPNG = file.type === 'image/png' || file.type === 'image/gif';
          if (!isPNG) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
          } else {
            ctx.clearRect(0, 0, width, height);
          }

          ctx.drawImage(img, 0, 0, width, height);

          const mimeType = isPNG ? 'image/png' : 'image/jpeg';
          const extension = isPNG ? 'png' : 'jpg';

          canvas.toBlob(
            async (blob) => {
              if (!blob) {
                setError('Failed to optimize image.');
                setUploading(false);
                return;
              }

              const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, `_optimized.${extension}`), {
                type: mimeType,
              });

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
            0.85 // Compress at 85% quality to save space
          );
        } else {
          setUploading(false);
        }
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
    setWarning('');
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
          {aspect === 'product' ? 'Recommended: 1200 × 1500 px (4:5 Ratio)' : 'Recommended: 1600 × 900 px (16:9 Ratio)'}
        </span>
      </div>

      <div
        className={`image-upload ${isDragging ? 'is-dragging' : ''} ${hasImage ? 'has-image' : ''}`}
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
          <div className={`image-upload-preview ${aspect}`} style={{ position: 'relative', width: '100%', height: '220px', borderRadius: '8px', overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewSrc} alt={`${label} preview`} style={{ width: '100%', height: '100%', objectFit: 'contain', background: 'rgba(0,0,0,0.03)' }} />
            {uploading && <div className="image-upload-progress">Optimizing & Uploading...</div>}
          </div>
        ) : (
          <div className={`image-upload-empty ${aspect}`}>
            <span className="image-upload-icon">Upload</span>
            <strong>Drag and drop an image here</strong>
            <small>JPG, PNG, WebP, or GIF format</small>
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

      {warning && (
        <div style={{
          marginTop: '0.5rem',
          background: 'rgba(234, 179, 8, 0.1)',
          border: '1px solid rgba(234, 179, 8, 0.25)',
          borderRadius: '6px',
          padding: '0.5rem 0.75rem',
          fontSize: '0.78rem',
          color: 'rgba(202, 138, 4, 1)',
          lineHeight: '1.4'
        }}>
          ⚠️ {warning}
        </div>
      )}

      {error && <p className="image-upload-error" style={{ marginTop: '0.5rem' }}>{error}</p>}
      {uploading && <p className="image-upload-note">Compressing and optimizing secure storage path...</p>}
      {!error && !uploading && value && <p className="image-upload-note">Saved image will display automatically on the site.</p>}
    </div>
  );
}
