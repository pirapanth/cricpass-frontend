import React, { useState } from 'react';
import {
  Building,
  User,
  Phone,
  Mail,
  Lock,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Copy,
  Check,
  MessageSquare,
  ArrowLeft,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Sparkles
} from 'lucide-react';
import {
  registerTeam,
  verifyTeamOtp,
  completeTeamRegistration
} from '../api';
import {
  handlePlus94PhoneInput,
  handlePlus94KeyDown,
  isValidPlus94Phone
} from '../utils/phoneUtils';

const ADMIN_WHATSAPP_NUMBER =
  import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER || '94726589947';

/**
 * TeamRegistration Component (3-Step UI Wizard)
 * Step 1: Team & Admin Details
 * Step 2: Verification (WhatsApp wa.me direct button or Email fallback) + 6-digit OTP entry
 * Step 3: Set Admin Login Password & Confirm
 * Completion: Team Created with unique Team ID & direct link to Login
 */
export default function TeamRegistration({ onSuccess, onCancel }) {
  const [step, setStep] = useState(1);

  // Step 1 State: Form data
  const [formData, setFormData] = useState({
    adminName: '',
    teamName: '',
    phone: '+94',
    email: ''
  });

  // Step 2 State: Verification session & OTP entry
  const [method, setMethod] = useState('whatsapp'); // 'whatsapp' | 'email'
  const [verifyToken, setVerifyToken] = useState('');
  const [otp, setOtp] = useState('');
  const [tokenCopied, setTokenCopied] = useState(false);

  // Step 3 State: Password setup
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [idCopied, setIdCopied] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let finalVal = value;
    if (name === 'phone') {
      finalVal = handlePlus94PhoneInput(value);
    }
    setFormData((prev) => ({ ...prev, [name]: finalVal }));
  };

  const handleCopyToken = () => {
    if (verifyToken) {
      navigator.clipboard.writeText(verifyToken);
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    }
  };

  const handleCopyTeamId = () => {
    if (successData?.teamId) {
      navigator.clipboard.writeText(successData.teamId);
      setIdCopied(true);
      setTimeout(() => setIdCopied(false), 2000);
    }
  };

  // ==============================================================
  // STEP 1 SUBMISSION: Start Team Admin Verification
  // ==============================================================
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.teamName.trim()) {
      setError('Team / Club Name is required.');
      return;
    }
    if (!formData.adminName.trim()) {
      setError('Admin Full Name is required.');
      return;
    }
    if (!isValidPlus94Phone(formData.phone)) {
      setError('WhatsApp Number must be +94 followed by 9 digits without leading 0 (e.g. +94770000000).');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('A valid Admin Email address is required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        adminName: formData.adminName.trim(),
        teamName: formData.teamName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim()
      };

      const res = await registerTeam(payload);

      if (res?.success) {
        setMethod(res.method || 'whatsapp');
        setVerifyToken(res.verifyToken || '');
        setStep(2);
      } else {
        setError(res?.message || 'Failed to start verification.');
      }
    } catch (err) {
      console.error('Step 1 registration error:', err);
      setError(err.message || 'Failed to start registration verification.');
    } finally {
      setLoading(false);
    }
  };

  // ==============================================================
  // STEP 2 SUBMISSION: Verify 6-Digit OTP
  // ==============================================================
  const handleStep2VerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setError('Please enter the valid 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyTeamOtp({
        verifyToken,
        otp: cleanOtp
      });

      if (res?.success && res?.verified) {
        setStep(3);
      } else {
        setError(res?.error || res?.message || 'Invalid or expired OTP.');
      }
    } catch (err) {
      console.error('Step 2 OTP verification error:', err);
      setError(err.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  // ==============================================================
  // STEP 3 SUBMISSION: Set Password & Create Official Team
  // ==============================================================
  const handleStep3CompleteRegistration = async (e) => {
    e.preventDefault();
    setError(null);

    if (!password.trim() || password.trim().length < 6) {
      setError('Password must be at least 6 characters in length.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both password fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await completeTeamRegistration({
        verifyToken,
        password: password.trim(),
        confirmPassword: confirmPassword.trim()
      });

      if (res?.success) {
        setSuccessData({
          teamId: res.teamId,
          teamName: res.teamName || formData.teamName
        });
        setStep(4);
      } else {
        setError(res?.error || res?.message || 'Failed to complete registration.');
      }
    } catch (err) {
      console.error('Step 3 completion error:', err);
      setError(err.message || 'Failed to complete team registration.');
    } finally {
      setLoading(false);
    }
  };

  const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(verifyToken || '')}`;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 3-Step Wizard Progress Header */}
      {step <= 3 && (
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs font-semibold">
            <div className={`flex items-center gap-1.5 ${step === 1 ? 'text-emerald-400' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step > 1 ? 'bg-emerald-500 text-slate-950 font-black' : step === 1 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
              }`}>
                {step > 1 ? '✓' : '1'}
              </span>
              <span>1. Team Details</span>
            </div>

            <div className="flex-1 mx-3 h-0.5 bg-slate-800 relative">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: step > 1 ? '100%' : '0%' }}
              />
            </div>

            <div className={`flex items-center gap-1.5 ${step === 2 ? 'text-emerald-400' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step > 2 ? 'bg-emerald-500 text-slate-950 font-black' : step === 2 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
              }`}>
                {step > 2 ? '✓' : '2'}
              </span>
              <span>2. Verify OTP</span>
            </div>

            <div className="flex-1 mx-3 h-0.5 bg-slate-800 relative">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: step > 2 ? '100%' : '0%' }}
              />
            </div>

            <div className={`flex items-center gap-1.5 ${step === 3 ? 'text-emerald-400' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 3 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
              }`}>
                3
              </span>
              <span>3. Set Password</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert Box */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* STATE 1: Team Details Form (No password field)                 */}
      {/* ============================================================== */}
      {step === 1 && (
        <form onSubmit={handleStep1Submit} className="space-y-4">
          {/* Club / Team Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Club / Team Name <span className="text-emerald-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Building className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="teamName"
                value={formData.teamName}
                onChange={handleInputChange}
                placeholder="e.g. Galle Gladiators or Colombo Stars"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                required
              />
            </div>
          </div>

          {/* Admin Full Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Admin Full Name <span className="text-emerald-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="adminName"
                value={formData.adminName}
                onChange={handleInputChange}
                placeholder="e.g. Mahela Jayawardene"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                required
              />
            </div>
          </div>

          {/* WhatsApp Contact Phone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              WhatsApp Number (with Country Code) <span className="text-emerald-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                name="phone"
                maxLength={12}
                value={formData.phone}
                onKeyDown={handlePlus94KeyDown}
                onChange={handleInputChange}
                placeholder="+94770000000"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Starts with <span className="text-emerald-400 font-mono font-bold">+94</span> followed by 9 digits (e.g. +94771234567). Leading 0 is removed.
            </p>
          </div>

          {/* Admin Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Admin Email Address <span className="text-emerald-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="admin@clubdomain.lk"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                required
              />
            </div>
          </div>

          {/* Submit Step 1 Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 text-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Checking Details & Starting Verification...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Proceed to Step 2: Verification</span>
              </span>
            )}
          </button>

          {onCancel && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel & Return to Sign In
              </button>
            </div>
          )}
        </form>
      )}

      {/* ============================================================== */}
      {/* STATE 2: Verification & 6-Digit OTP Entry                      */}
      {/* ============================================================== */}
      {step === 2 && (
        <div className="space-y-6 animate-fadeIn">
          {/* Method A: WhatsApp Flow */}
          {method === 'whatsapp' ? (
            <div className="space-y-4 p-5 sm:p-6 bg-[#0f172a] border border-slate-800 rounded-2xl shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    WhatsApp Verification Required
                  </h3>
                  <p className="text-xs text-slate-400">
                    Send your unique verification token to our CricPass WhatsApp bot to receive your 6-digit OTP.
                  </p>
                </div>
              </div>

              {/* Token Display Box */}
              <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl text-center space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Your Verification Token
                </span>
                <div className="flex items-center justify-center gap-3">
                  <span className="font-mono text-2xl sm:text-3xl font-black text-emerald-400 tracking-widest select-all">
                    {verifyToken || 'VERIFY-TOKEN'}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyToken}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Copy Token"
                    aria-label="Copy token"
                  >
                    {tokenCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Official Bot WhatsApp: <strong className="text-slate-200 font-mono">+{ADMIN_WHATSAPP_NUMBER}</strong>
                </p>
              </div>

              {/* Green WhatsApp Action Button */}
              <div className="space-y-2.5">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-6 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-[#25D366]/20 cursor-pointer"
                >
                  <MessageSquare className="w-5 h-5 fill-current" />
                  <span>Send Verify Code via WhatsApp</span>
                  <ExternalLink className="w-4 h-4 opacity-80" />
                </a>

                {/* Privacy Consent Note */}
                <p className="text-xs text-slate-400 text-center italic">
                  By clicking above, you consent to receive your CricPass OTP and official team alerts on WhatsApp.
                </p>
              </div>
            </div>
          ) : (
            /* Method B: Email Fallback Notice */
            <div className="space-y-4 p-5 sm:p-6 bg-[#0f172a] border border-amber-500/30 rounded-2xl shadow-xl">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Email Verification Fallback
                  </h3>
                  <p className="text-xs text-amber-200/90 leading-relaxed">
                    WhatsApp is currently restarting and your 6-digit OTP has been sent to your registered email address instead.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-300">
                Please check your inbox at <strong className="text-emerald-400 font-mono">{formData.email}</strong> for your 6-digit verification code.
              </div>
            </div>
          )}

          {/* 6-Digit OTP Entry Form */}
          <form onSubmit={handleStep2VerifyOtp} className="p-5 sm:p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
            <div className="space-y-1.5 text-center">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Enter 6-Digit Verification OTP <span className="text-emerald-400">*</span>
              </label>
              <p className="text-xs text-slate-400">
                Enter the 6-digit code received via {method === 'whatsapp' ? 'WhatsApp' : 'Email'}
              </p>
            </div>

            <div className="max-w-xs mx-auto">
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full py-3 px-4 bg-slate-950 border border-slate-700 rounded-xl text-center text-2xl font-mono tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.trim().length !== 6}
              className="w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 text-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying OTP...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify OTP</span>
                </span>
              )}
            </button>

            <div className="pt-1 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep(1);
                }}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Contact Details</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* STATE 3: Set Admin Login Password                              */}
      {/* ============================================================== */}
      {step === 3 && (
        <form onSubmit={handleStep3CompleteRegistration} className="space-y-4 animate-fadeIn">
          {/* Verified Badge */}
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Contact Verified! Set your admin login password</span>
            </div>
            <span className="text-[10px] bg-emerald-900/90 text-emerald-300 px-2.5 py-0.5 rounded font-mono font-bold tracking-wider">
              VERIFIED
            </span>
          </div>

          {/* Club Summary Pill */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center justify-between">
            <span>Registering Club: <strong className="text-white">{formData.teamName}</strong></span>
            <span className="font-mono text-emerald-400">{formData.phone}</span>
          </div>

          {/* Admin Login Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Admin Login Password <span className="text-emerald-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create secure portal password (min. 6 chars)"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                tabIndex={-1}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Admin Login Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Confirm Admin Login Password <span className="text-emerald-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm secure portal password"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                tabIndex={-1}
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Complete Registration Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 text-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Creating Team & Generating Credentials...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Complete Registration & Create Team</span>
              </span>
            )}
          </button>
        </form>
      )}

      {/* ============================================================== */}
      {/* COMPLETION CARD: Team Created Successfully                     */}
      {/* ============================================================== */}
      {step === 4 && successData && (
        <div className="space-y-6 p-6 sm:p-7 bg-[#0f172a] border border-emerald-500/40 rounded-2xl shadow-2xl animate-fadeIn">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-white tracking-tight">
              Registration Completed Successfully!
            </h3>
            <p className="text-xs text-slate-300">
              Your club <strong className="text-white">{successData.teamName}</strong> has been officially registered in CricPass.
            </p>
          </div>

          {/* Team ID Highlight Card */}
          <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl text-center space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Official Unique Team ID
            </span>
            <div className="flex items-center justify-center gap-3">
              <span className="font-mono text-3xl font-black text-cyan-400 tracking-wider select-all">
                {successData.teamId}
              </span>
              <button
                type="button"
                onClick={handleCopyTeamId}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Copy Team ID"
                aria-label="Copy Team ID"
              >
                {idCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Store this ID safely. It is required along with your password to access the Team Admin Portal.
            </p>
          </div>

          {/* Go to Team Admin Login Button */}
          <button
            type="button"
            onClick={() => {
              if (onSuccess) {
                onSuccess({
                  teamId: successData.teamId,
                  team_id: successData.teamId,
                  teamName: successData.teamName
                });
              }
            }}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>Go to Team Admin Login</span>
          </button>
        </div>
      )}
    </div>
  );
}
