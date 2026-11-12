import React, { useState, useRef } from 'react';
import {
  UserPlus,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  User,
  Phone,
  Upload,
  Trash2,
  FileCheck,
  Mail,
  KeyRound,
  ShieldCheck,
  Send,
  MessageSquare
} from 'lucide-react';
import { registerPlayer, sendWhatsAppOTP, verifyWhatsAppOTP } from '../api';
import useTeams from '../hooks/useTeams';
import TeamSelectDropdown from './TeamSelectDropdown';
import LoadingPopup from './LoadingPopup';
import {
  handlePlus94PhoneInput,
  handlePlus94KeyDown,
  isValidPlus94Phone,
  formatDisplayPhone,
  maskDisplayPhone,
} from '../utils/phoneUtils';

export default function PlayerRegister({ onPlayerRegistered }) {
  const {
    teams,
    loadingTeams,
    teamsError,
    loadingMessage,
    attempt,
    reloadTeams,
  } = useTeams();
  const [teamsPopupDismissed, setTeamsPopupDismissed] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    nic_number: '',
    phone_number: '+94',
    image_url: '',
    current_team_id: ''
  });

  // Local image file upload state
  const [selectedFileName, setSelectedFileName] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Email OTP state for Team Admin approval
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpMessage, setOtpMessage] = useState(null);
  const [otpError, setOtpError] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  const safeTeams = Array.isArray(teams) ? teams : [];
  const selectedTeam = safeTeams.find((t) => t._id === formData.current_team_id);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === 'nic_number') {
      finalValue = value.toUpperCase();
    } else if (name === 'phone_number') {
      finalValue = handlePlus94PhoneInput(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue
    }));

    // Reset OTP verification if team changes
    if (name === 'current_team_id') {
      setOtpSent(false);
      setOtpVerified(false);
      setOtpCode('');
      setOtpMessage(null);
      setOtpError(null);
    }
  };

  // Handle local image selection from File Manager
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, JPEG, WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Selected image is too large. Please select an image under 5MB.');
      return;
    }

    setError(null);
    setSelectedFileName(file.name);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setImagePreview(base64String);
      setFormData((prev) => ({
        ...prev,
        image_url: base64String
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedFileName('');
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, image_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // -------------------------------------------------------------
  // Send WhatsApp OTP to Selected Team Admin
  // -------------------------------------------------------------
  const handleSendAdminWhatsAppOtp = async () => {
    if (!selectedTeam) {
      setOtpError('Please select a club first');
      return;
    }

    const adminPhone = formatDisplayPhone(selectedTeam.phone_number);
    if (!adminPhone) {
      setOtpError('This club does not have a registered administrator WhatsApp number');
      return;
    }

    setSendingOtp(true);
    setOtpError(null);
    setOtpMessage(null);

    try {
      await sendWhatsAppOTP(
        adminPhone,
        `Player Registration Approval (${formData.full_name || 'New Player'})`
      );
      setOtpSent(true);
      setOtpMessage(`OTP sent to your WhatsApp number (${maskDisplayPhone(adminPhone)})`);
    } catch (err) {
      setOtpError(err.message || 'Failed to dispatch WhatsApp OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  // -------------------------------------------------------------
  // Verify WhatsApp OTP Code
  // -------------------------------------------------------------
  const handleCheckWhatsAppOtp = async (e) => {
    if (e) e.preventDefault();
    const adminPhone = formatDisplayPhone(selectedTeam?.phone_number);
    if (!adminPhone) return;

    if (!otpCode.trim()) {
      setOtpError('Please enter the 6-digit code received via WhatsApp');
      return;
    }

    setVerifyingOtp(true);
    setOtpError(null);

    try {
      const res = await verifyWhatsAppOTP(adminPhone, otpCode.trim());
      if (res?.success) {
        setOtpVerified(true);
        setOtpMessage('✅ OTP Verified! Team Admin has authorized this player registration via WhatsApp.');
      }
    } catch (err) {
      setOtpError(err.message || 'Invalid or expired OTP code');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // -------------------------------------------------------------
  // Submit Player Registration to MongoDB Atlas
  // -------------------------------------------------------------
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.full_name.trim()) {
      setError('Full Name is required');
      return;
    }
    if (!formData.nic_number.trim()) {
      setError('NIC Number is required');
      return;
    }
    if (!formData.phone_number.trim() || formData.phone_number.trim() === '+94') {
      setError('Phone Number is required');
      return;
    }
    if (!isValidPlus94Phone(formData.phone_number.trim())) {
      setError('Contact Phone Number must be +94 followed by 9 digits without a leading 0 (e.g. +94770000000)');
      return;
    }

    // If assigning to a club, WhatsApp OTP verification is mandatory!
    if (formData.current_team_id && !otpVerified) {
      setError('Club admin WhatsApp OTP authorization is required before registering to a team.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        full_name: formData.full_name.trim(),
        nic_number: formData.nic_number.trim().toUpperCase(),
        phone_number: formData.phone_number.trim(),
        image_url: formData.image_url || undefined,
        current_team_id: formData.current_team_id || undefined
      };

      const res = await registerPlayer(payload);
      if (res?.data) {
        setSuccessData(res.data);
        if (onPlayerRegistered) onPlayerRegistered(res.data);
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      nic_number: '',
      phone_number: '+94',
      image_url: '',
      current_team_id: ''
    });
    handleRemoveImage();
    setOtpSent(false);
    setOtpVerified(false);
    setOtpCode('');
    setOtpMessage(null);
    setOtpError(null);
    setSuccessData(null);
    setError(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Loading Popup until teams finish loading (handles Render cold starts) */}
      <LoadingPopup
        isOpen={loadingTeams || (!teamsPopupDismissed && Boolean(teamsError))}
        title="Loading Teams..."
        message={loadingMessage}
        badge={attempt > 1 ? `Attempt ${attempt} of 4` : null}
        error={teamsError}
        onRetry={() => {
          setTeamsPopupDismissed(false);
          reloadTeams();
        }}
        onDismiss={() => setTeamsPopupDismissed(true)}
      />

      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide uppercase">
          <UserPlus className="w-3.5 h-3.5" />
          Verified Player Enrollment
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Register New Cricket Player
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
          Enroll a cricket player with unique NIC verification and Team Admin Email OTP authorization.
        </p>
      </div>

      {/* Success Banner */}
      {successData && (
        <div className="bg-gradient-to-br from-emerald-950/90 via-slate-900 to-teal-950/90 border border-emerald-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fadeIn">
          <div className="flex items-center gap-4">
            {successData.image_url ? (
              <img
                src={successData.image_url}
                alt={successData.full_name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
            )}
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-500/30">
                Saved
              </span>
              <h2 className="text-2xl font-bold text-white mt-1">
                {successData.full_name} Successfully Registered!
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-xs">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/60">
              <span className="text-slate-400 block font-medium">NIC Number:</span>
              <span className="font-mono text-emerald-400 font-bold text-sm mt-1 block">
                {successData.nic_number}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/60">
              <span className="text-slate-400 block font-medium">Assigned Club:</span>
              <span className="text-white font-bold text-sm mt-1 block">
                {successData.current_team_id?.team_name || 'Free Agent (Unassigned)'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/60">
              <span className="text-slate-400 block font-medium">Status:</span>
              <span className="text-emerald-400 font-bold text-sm mt-1 block">
                ACTIVE • Eligible to Play
              </span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={resetForm}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer"
            >
              Register Another Player
            </button>
          </div>
        </div>
      )}

      {/* Registration Form */}
      {!successData && (
        <form onSubmit={handleRegisterSubmit} className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 backdrop-blur-sm">
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="sm:col-span-2 space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Full Name <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="e.g. Dinesh"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  required
                />
              </div>
            </div>

            {/* NIC Number */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                NIC Number <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                name="nic_number"
                value={formData.nic_number}
                onChange={handleChange}
                placeholder="e.g. 199707291234 or 971234567V"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white uppercase font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold tracking-wider"
                required
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Contact Phone Number <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onKeyDown={handlePlus94KeyDown}
                  onChange={handleChange}
                  placeholder="+94770000000"
                  maxLength={12}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
                  required
                />
              </div>
            </div>

            {/* Team Selection */}
            <div className="sm:col-span-2 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Select Club / Team Assignment
                </label>
                {teamsError && !loadingTeams && (
                  <button
                    type="button"
                    onClick={() => {
                      setTeamsPopupDismissed(false);
                      reloadTeams();
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry Load</span>
                  </button>
                )}
              </div>
              <TeamSelectDropdown
                teams={safeTeams}
                value={formData.current_team_id}
                onChange={(selectedId) =>
                  handleChange({
                    target: { name: 'current_team_id', value: selectedId }
                  })
                }
                placeholder="-- Select Club / Team --"
                emptyOptionLabel="-- No Team (Register as Free Agent) --"
                loading={loadingTeams}
                error={teamsError}
                onRetry={reloadTeams}
                showLeftIcon={true}
              />
            </div>

            {/* TEAM ADMIN WHATSAPP OTP VERIFICATION SECTION */}
            {selectedTeam && (
              <div className="sm:col-span-2 p-4 rounded-xl bg-slate-900/90 border border-emerald-500/40 space-y-3 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      Team Admin WhatsApp Authorization
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 font-mono">
                    Admin WhatsApp: <strong className="text-emerald-300">{maskDisplayPhone(selectedTeam.phone_number) || 'No phone registered'}</strong>
                  </div>
                </div>

                {otpMessage && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{otpMessage}</span>
                  </div>
                )}

                {otpError && (
                  <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{otpError}</span>
                  </div>
                )}

                {!otpVerified ? (
                  <div className="space-y-3 pt-1">
                    <p className="text-xs text-slate-300">
                      To register under <strong>{selectedTeam.team_name}</strong>, a verification code must be sent to the team admin's WhatsApp number ({maskDisplayPhone(selectedTeam.phone_number) || 'No phone registered'}).
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2.5">
                      {!otpSent ? (
                        <button
                          type="button"
                          onClick={handleSendAdminWhatsAppOtp}
                          disabled={sendingOtp || !selectedTeam.phone_number}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {sendingOtp ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Sending WhatsApp OTP...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>Send OTP to Team Admin WhatsApp</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="flex-1 flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.trim())}
                            placeholder="Enter 6-digit OTP"
                            className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-center text-sm font-mono tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />

                          <button
                            type="button"
                            onClick={handleCheckWhatsAppOtp}
                            disabled={verifyingOtp || !otpCode}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                          >
                            {verifyingOtp ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Checking...</span>
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Check OTP</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={handleSendAdminWhatsAppOtp}
                            disabled={sendingOtp}
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
                          >
                            Resend
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Authorization Approved by {selectedTeam.admin_name} ({maskDisplayPhone(selectedTeam.phone_number)})</span>
                    </div>
                    <span className="text-[11px] bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
                      VERIFIED
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* File Manager Image Picker */}
            <div className="sm:col-span-2 space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Player Photo (Select from Computer / File Manager)
              </label>

              {/* Hidden native file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageFileChange}
                accept="image/*"
                className="hidden"
              />

              {!imagePreview ? (
                /* Clickable File Drop Box */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-900/60 hover:bg-slate-900 rounded-2xl p-6 text-center cursor-pointer transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 group-hover:text-emerald-400 group-hover:border-emerald-500/40 mx-auto flex items-center justify-center transition-colors mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Click to select player photo from File Manager
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports JPG, PNG, WEBP (Max 5MB)
                  </p>
                </div>
              ) : (
                /* Selected Image Preview Thumbnail */
                <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-500/40 flex items-center justify-between gap-4 animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <img
                      src={imagePreview}
                      alt="Player Preview"
                      className="w-14 h-14 rounded-xl object-cover border-2 border-emerald-500 shadow-md"
                    />
                    <div>
                      <span className="text-[11px] text-emerald-400 font-medium">Image loaded ready for upload</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
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
                  </div>

                  
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700">
            <button
              type="submit"
              disabled={loading || (Boolean(formData.current_team_id) && !otpVerified)}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-600/30 text-sm sm:text-base transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving Player...</span>
                </>
              ) : formData.current_team_id && !otpVerified ? (
                <span className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4" />
                  <span>Verify Team Admin Email OTP to Enable Registration</span>
                </span>
              ) : (
                <span>Save & Register</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
