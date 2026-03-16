'use client';

import { useState, useRef, useCallback } from 'react';

interface GeoreferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GeoreferenceModal({ isOpen, onClose }: GeoreferenceModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'application/pdf'];
  const ACCEPTED_EXTENSIONS = '.png,.jpg,.jpeg,.pdf';

  const handleFile = useCallback((file: File) => {
    if (ACCEPTED_TYPES.includes(file.type)) {
      setSelectedFile(file);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleClose = useCallback(() => {
    setSelectedFile(null);
    setIsDragging(false);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.6)',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: '#1e2230',
          borderRadius: 12,
          width: 480,
          maxWidth: '90vw',
          padding: 24,
          color: '#ffffff',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            Georeference Site Plan
          </h2>
          <button
            onClick={handleClose}
            style={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 6,
              color: '#9ca3af',
              cursor: 'pointer',
              fontSize: 18,
            }}
          >
            ×
          </button>
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? '#3b82f6' : '#4b5563'}`,
            borderRadius: 8,
            padding: 40,
            textAlign: 'center',
            cursor: 'pointer',
            background: isDragging ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.03)',
            transition: 'all 150ms ease',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />

          {/* Upload icon */}
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6b7280"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ margin: '0 auto 12px' }}
          >
            <polyline points="16 16 12 12 8 16" />
            <line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
          </svg>

          <p style={{ fontSize: 14, color: '#d1d5db', margin: '0 0 4px' }}>
            Drag and drop a site plan here
          </p>
          <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
            Accepts PNG, JPG, or PDF
          </p>
        </div>

        {/* Selected file feedback */}
        {selectedFile && (
          <div
            style={{
              marginTop: 16,
              padding: 16,
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: 8,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#93c5fd' }}>
                {selectedFile.name}
              </span>
            </div>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
              Coming soon — georeferencing will be available in a future update.
            </p>
          </div>
        )}

        {/* Close button */}
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleClose}
            style={{
              padding: '8px 20px',
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              borderRadius: 6,
              background: '#374151',
              color: '#d1d5db',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
