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

const MAX_FILE_SIZE = 5 * 1024 * 1024;
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
  const [localPreview, setLocalPreview] = useState('');

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const uploadFile = async (file: File) => {
    setError('');

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Use a JPG, PNG, WebP, or GIF image.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Image must be 5 MB or smaller.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(previewUrl);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('scope', scope);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data.success || !data.path) {
        throw new Error(data.message || 'Upload failed.');
      }

      onChange(data.path);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
      onChange('');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) void uploadFile(file);
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
    <div className="form-group">
      <label>{label}</label>
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
          <div className={`image-upload-preview ${aspect}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewSrc} alt={`${label} preview`} />
            {uploading && <div className="image-upload-progress">Uploading...</div>}
          </div>
        ) : (
          <div className={`image-upload-empty ${aspect}`}>
            <span className="image-upload-icon">Upload</span>
            <strong>Drag and drop an image here</strong>
            <small>JPG, PNG, WebP, or GIF up to 5 MB</small>
            <small>{aspect === 'product' ? 'Recommended: 1200 × 900 px (4:3)' : 'Recommended: 1600 × 900 px (16:9)'}</small>
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

        {value && !uploading && (
          <div className="image-upload-meta">
            Image selected from uploads storage.
          </div>
        )}
      </div>
      {error && <p className="image-upload-error">{error}</p>}
      {uploading && <p className="image-upload-note">Optimizing secure storage path...</p>}
      {!error && !uploading && value && <p className="image-upload-note">Saved image will display automatically on the site.</p>}
    </div>
  );
}
