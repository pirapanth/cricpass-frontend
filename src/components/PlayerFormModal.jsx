import React, { useState, useRef, useEffect } from 'react';
import {
  UserPlus,
  X,
  Upload,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Building2,
  User,
  Phone,
  Shield,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { uploadAttachment } from '../api';
import useTeams from '../hooks/useTeams';
import {
  handlePlus94PhoneInput,
  handlePlus94KeyDown,
  isValidPlus94Phone
} from '../utils/phoneUtils';
import {
  formatDriveImageUrl,
  isDriveUrl,
  getDriveViewUrl
} from '../utils/imageUtils';

export default function PlayerFormModal({
  isOpen,
  onClose,
  onSave,
  defaultTeam = null,
  existingNics = []
}) {
  const { teams } = useTeams();
  const safeTeams = Array.isArray(teams) ? teams : [];

  const [fullName, setFullName] = useState('');
  const [nic, setNic] = useState('');
  const [phone, setPhone] = useState('+94');
  const [teamId, setTeamId] = useState(defaultTeam?._id || defaultTeam?.team_id || defaultTeam?.teamId || '');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('Uploading photo...');
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Automatically lock teamId to current logged-in team
  useEffect(() => {
    if (isOpen && defaultTeam) {
      setTeamId(defaultTeam._id || defaultTeam.team_id || defaultTeam.teamId || '');
    }
  }, [isOpen, defaultTeam]);

  if (!isOpen) return null;

  // Resolve current logged-in team details for display
  const currentTeamId = defaultTeam?._id || defaultTeam?.team_id || defaultTeam?.teamId || teamId || '';
  const currentTeamName =
    defaultTeam?.team_name ||
    defaultTeam?.teamName ||
    safeTeams.find((t) => t._id === currentTeamId || t.team_id === currentTeamId)?.team_name ||
    'Your Assigned Club';
  const currentTeamCode =
    defaultTeam?.team_id ||
    defaultTeam?.teamId ||
    safeTeams.find((t) => t._id === currentTeamId || t.team_id === currentTeamId)?.team_id ||
    '';

  // Handle local image file selection and upload to Google Drive
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, JPEG, WEBP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Selected image is too large. Maximum allowed size is 10MB.');
      return;
    }

    setError(null);
    setSelectedFileName(file.name);

    // Instant local preview
    const localBlob = URL.createObjectURL(file);
    setImagePreview(localBlob);

    // Upload directly to Google Drive via POST /api/upload
    setUploadingImage(true);
    setUploadStatusText('Optimizing & uploading photo...');

    const statusTimer = setTimeout(() => {
      setUploadStatusText('uploading...');
    }, 3500);

    try {
      const targetTeamKey =
        defaultTeam?.team_id ||
        defaultTeam?.team_name ||
        teamId ||
        'BulkPlayerPhoto';
      const uploadRes = await uploadAttachment(file, targetTeamKey);
      if (uploadRes?.success && uploadRes?.data?.viewUrl) {
        setImageUrl(uploadRes.data.viewUrl);
      } else {
        throw new Error(uploadRes?.error || 'Failed to upload photo');
      }
    } catch (err) {
      console.error('Player photo upload error:', err);
      const errMsg =
        err.response?.data?.error ||
        err.message ||
        'Image upload failed. Please try again.';
      setError(`Upload Error: ${errMsg}`);
      if (localBlob) URL.revokeObjectURL(localBlob);
      setImagePreview(null);
      setImageUrl('');
      setSelectedFileName('');
    } finally {
      clearTimeout(statusTimer);
      setUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveImage = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setImageUrl('');
    setSelectedFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    setError(null);

    if (uploadingImage) {
      setError('Please wait for the player photo to finish uploading.');
      return;
    }

    const trimmedName = fullName.trim();
    const formattedNic = nic.trim().toUpperCase();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setError('Player Full Name is required.');
      return;
    }

    if (!formattedNic) {
      setError('Player NIC Number is required.');
      return;
    }

    // Check if NIC is already staged in the current batch
    if (existingNics.includes(formattedNic)) {
      setError(`Player with NIC '${formattedNic}' is already added to this bulk staging list.`);
      return;
    }

    if (!trimmedPhone || trimmedPhone === '+94') {
      setError('Contact Phone Number is required.');
      return;
    }

    if (!isValidPlus94Phone(trimmedPhone)) {
      setError('Contact Phone Number must be +94 followed by 9 digits without a leading 0 (e.g. +94770000000)');
      return;
    }

    // Ensure teamId is locked to current logged-in team
    const finalTeamId = defaultTeam?._id || defaultTeam?.team_id || defaultTeam?.teamId || teamId;
    if (!finalTeamId) {
      setError('Current club information is missing. Please refresh and log in again.');
      return;
    }

    // Commit to staging array
    onSave({
      fullName: trimmedName,
      nic: formattedNic,
      phone: trimmedPhone,
      teamId: finalTeamId,
      teamName: currentTeamName,
      image_url: imageUrl || null,
      selectedFileName: selectedFileName || null
    });

    // Reset fields and close modal
    setFullName('');
    setNic('');
    setPhone('+94');
    handleRemoveImage();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl p-6 sm:p-7 space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Add Player</h3>
              <p className="text-xs text-slate-400">Save player details before bulk registration</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSave} className="space-y-4">
          {/* 1. Full Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              1. Full Name <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Kumar Sangakkara"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* 2. NIC Number */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              2. NIC Number <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={nic}
                onChange={(e) => setNic(e.target.value.toUpperCase())}
                placeholder="e.g. 199012345678 or 901234567V"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* 3. Contact Phone Number */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              3. Contact Phone Number <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(handlePlus94PhoneInput(e.target.value))}
                onKeyDown={handlePlus94KeyDown}
                placeholder="+94770000000"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <p className="text-[11px] text-slate-500">Format: +94 followed by 9 digits</p>
          </div>

          {/* 4. Club / Team Assignment (Read-Only for Logged-in Team) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                4. Club / Team Assignment <span className="text-emerald-400 text-[11px] font-normal normal-case">(Current Club)</span>
              </label>
            </div>
            <div className="w-full flex items-center justify-between px-3.5 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white block">
                    {currentTeamName}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-emerald-400 font-mono font-bold border border-slate-700">
                  {currentTeamCode || 'ASSIGNED'}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Automatically assigned to your team.</span>
            </p>
          </div>

          {/* 5. Player Photo (Google Drive Upload) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                5. Player Photo (Optinal)
              </label>
              {imageUrl && !uploadingImage && (
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Uploaded
                </span>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              disabled={uploadingImage}
            />

            {uploadingImage ? (
              <div className="p-5 bg-slate-950 border border-emerald-500/40 rounded-xl flex flex-col items-center justify-center space-y-2 animate-fadeIn">
                <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
                <p className="text-xs font-semibold text-white">{uploadStatusText}</p>
                <p className="text-[11px] text-slate-400">Please hold on while the file is processed.</p>
              </div>
            ) : !imagePreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-950/60 hover:bg-slate-950 rounded-xl p-4 text-center cursor-pointer transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 group-hover:text-emerald-400 mx-auto flex items-center justify-center mb-2 transition-colors">
                  <Upload className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Click to select player photo
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  JPG, PNG, WEBP (Max 10MB)
                </p>
              </div>
            ) : (
              <div className="p-3 bg-slate-950 border border-emerald-500/40 rounded-xl flex items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={formatDriveImageUrl(imagePreview || imageUrl)}
                    alt="Player Preview"
                    className="w-12 h-12 rounded-lg object-cover border border-emerald-500 shadow shrink-0"
                    onError={(e) => {
                      if (imagePreview && !imagePreview.startsWith('blob:')) {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=150&auto=format&fit=crop&q=80';
                      }
                    }}
                  />
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                    title="Remove image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadingImage}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {uploadingImage ? 'Saving ...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
