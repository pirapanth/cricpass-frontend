import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  RefreshCw,
  X
} from 'lucide-react';
import { uploadAttachment } from '../api';

/**
 * Reusable File & Image Upload Component for CricPass.
 * Connects to POST /api/upload (Google Drive storage via backend multer).
 *
 * @param {string} teamId - Identifier for the team or player (defaults to 'General')
 * @param {function} onUploadSuccess - Callback receiving { fileId, viewUrl, fileName }
 * @param {function} onRemove - Optional callback when user removes the attachment
 * @param {string} value - Existing viewUrl (for edit or prefilled mode)
 * @param {string} label - Input label text
 * @param {string} accept - Accepted mime types (e.g. "image/*" or "image/*,application/pdf")
 * @param {number} maxSizeMB - Maximum file size in megabytes (default: 10MB)
 * @param {boolean} disabled - Disable upload interactions
 * @param {string} helperText - Optional guidance text below dropzone
 */
export default function FileUpload({
  teamId = 'General',
  onUploadSuccess,
  onRemove,
  value = '',
  label = 'File Attachment / Image',
  accept = 'image/*,application/pdf',
  maxSizeMB = 10,
  disabled = false,
  helperText = 'PNG, JPG, WEBP, or PDF up to 10MB'
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedData, setUploadedData] = useState(
    value ? { viewUrl: value, fileName: 'Attached File' } : null
  );
  const [previewUrl, setPreviewUrl] = useState(value || null);
  const fileInputRef = useRef(null);

  // Validate and handle file upload
  const handleFileProcess = async (file) => {
    if (!file) return;

    setError(null);

    // 1. File Size Validation (Default 10MB)
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`File size exceeds ${maxSizeMB}MB limit. Please choose a smaller file.`);
      return;
    }

    // 2. Local Preview for images
    if (file.type.startsWith('image/')) {
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);
    } else {
      setPreviewUrl(null);
    }

    // 3. Dispatch upload request to backend
    setUploading(true);
    try {
      const response = await uploadAttachment(file, teamId);

      if (response?.success && response?.data) {
        const result = {
          fileId: response.data.fileId,
          viewUrl: response.data.viewUrl,
          fileName: response.data.fileName || file.name,
        };

        setUploadedData(result);

        // Keep local preview if image, or fall back to viewUrl
        if (!file.type.startsWith('image/')) {
          setPreviewUrl(null);
        }

        // Notify parent form component
        if (onUploadSuccess) {
          onUploadSuccess(result);
        }
      } else {
        throw new Error(response?.error || response?.message || 'Upload failed');
      }
    } catch (err) {
      console.error('File upload error:', err);
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Failed to upload file to server';
      setError(errMsg);
      setPreviewUrl(null);
      setUploadedData(null);
    } finally {
      setUploading(false);
      // Reset input element so re-uploading the same file works
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Input change handler
  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !uploading) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled || uploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  // Remove uploaded file
  const handleRemove = (e) => {
    e.stopPropagation();
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setUploadedData(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onRemove) {
      onRemove();
    }
  };

  const isImage =
    previewUrl ||
    (uploadedData?.fileName && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(uploadedData.fileName));

  return (
    <div className="space-y-2 w-full">
      {/* Label & Requirement Indicator */}
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            {label}
          </label>
          {uploadedData?.viewUrl && (
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Uploaded
            </span>
          )}
        </div>
      )}

      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        disabled={disabled || uploading}
        className="hidden"
      />

      {/* 1. UPLOADING STATE */}
      {uploading && (
        <div className="p-6 bg-slate-900/90 border border-emerald-500/40 rounded-xl flex flex-col items-center justify-center space-y-3 animate-fadeIn">
          <div className="relative">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
            <div className="absolute inset-0 blur-md bg-emerald-500/20 -z-10 rounded-full" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-white">Uploading file to Google Drive...</p>
            <p className="text-xs text-slate-400">Please hold on while the file is securely uploaded.</p>
          </div>
        </div>
      )}

      {/* 2. SUCCESS CONFIRMATION STATE */}
      {!uploading && uploadedData?.viewUrl && (
        <div className="p-4 bg-slate-900 border border-emerald-500/40 rounded-xl space-y-3 animate-fadeIn shadow-lg shadow-emerald-500/5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Thumbnail or File Icon */}
              {previewUrl ? (
                <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt={uploadedData.fileName || 'Attachment Preview'}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  {isImage ? <ImageIcon className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                </div>
              )}

              {/* File Meta */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white truncate">
                    {uploadedData.fileName || 'Uploaded File'}
                  </h4>
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                    Google Drive
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  File uploaded and stored in Google Drive successfully.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* View in Drive Button */}
              <a
                href={uploadedData.viewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                title="View in Google Drive"
              >
                <span>View</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {/* Remove File Button */}
              {!disabled && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  title="Remove attachment"
                  aria-label="Remove attachment"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Replace file shortcut */}
          {!disabled && (
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500">Need to update this file?</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-emerald-400 hover:text-emerald-300 font-semibold underline cursor-pointer"
              >
                Upload a different file
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. DEFAULT DROPZONE (When not uploading and no file selected) */}
      {!uploading && !uploadedData?.viewUrl && (
        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all group ${
            disabled ? 'opacity-60 cursor-not-allowed bg-slate-900/40 border-slate-800' : ''
          } ${
            isDragging
              ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
              : 'border-slate-700 hover:border-emerald-500/60 bg-slate-900/60 hover:bg-slate-900'
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                isDragging
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-slate-800 text-slate-400 group-hover:text-emerald-400 group-hover:bg-slate-800/80'
              }`}
            >
              <UploadCloud className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                Click to browse or drag & drop file
              </p>
              {helperText && <p className="text-xs text-slate-500">{helperText}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Error Alert Box */}
      {error && (
        <div className="p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
            aria-label="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
