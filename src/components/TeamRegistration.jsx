import React, { useState } from 'react';
import {
  Building,
  User,
  Phone,
  Mail,
  Lock,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  MessageSquare,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { registerTeam } from '../api';
import {
  handlePlus94PhoneInput,
  handlePlus94KeyDown,
  isValidPlus94Phone
} from '../utils/phoneUtils';

/**
 * TeamVerificationStep component
 * Renders WhatsApp button linking to wa.me with verifyToken or Email fallback box
 */
export function TeamVerificationStep({ verificationData, onReset, formData }) {
  const { method, verifyToken } = verificationData || {};
  const [copied, setCopied] = useState(false);

  const handleCopyToken = () => {
    if (verifyToken) {
      navigator.clipboard.writeText(verifyToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const whatsappUrl = `https://wa.me/94726589947?text=${encodeURIComponent(verifyToken || '')}`;

  return (
    <div className="space-y-6 animate-fadeIn">
      {method === 'whatsapp' ? (
        <div className="space-y-5 p-6 sm:p-7 bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                WhatsApp Verification Required
              </h3>
              <p className="text-xs text-slate-400">
                Send your unique verification token to our CricPass WhatsApp bot to complete team verification.
              </p>
            </div>
          </div>

          {/* Token Display Card */}
          <div className="p-4 sm:p-5 bg-slate-900/90 border border-slate-700 rounded-xl text-center space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Official Verification Token
            </span>
            <div className="flex items-center justify-center gap-3">
              <span className="font-mono text-2xl sm:text-3xl font-black text-emerald-400 tracking-widest select-all">
                {verifyToken || 'VERIFY-TOKEN'}
              </span>
              <button
                type="button"
                onClick={handleCopyToken}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Copy Token to Clipboard"
                aria-label="Copy verification token"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Admin WhatsApp Bot Number:{' '}
              <strong className="text-slate-200 font-mono">+94 72 658 9947</strong>
            </p>
          </div>

          {/* WhatsApp Direct Link Button */}
          <div className="space-y-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-6 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-[#25D366]/20 cursor-pointer"
            >
              <MessageSquare className="w-5 h-5 fill-current" />
              <span>Verify on WhatsApp</span>
              <ExternalLink className="w-4 h-4 opacity-80" />
            </a>

            {/* Privacy Consent Note */}
            <p className="text-xs text-slate-400 text-center italic">
              By clicking above, you consent to receive your CricPass OTP and official team alerts on WhatsApp.
            </p>
          </div>
        </div>
      ) : (
        /* Email Fallback Box */
        <div className="space-y-5 p-6 sm:p-7 bg-[#0f172a] border border-amber-500/30 rounded-2xl shadow-2xl">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white tracking-tight">
                Email Verification Fallback
              </h3>
              <p className="text-xs text-amber-200/90 leading-relaxed">
                WhatsApp is currently restarting and their 6-digit OTP has been sent to their registered email address instead.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl space-y-2">
            <div className="text-xs text-slate-300">
              Please check your inbox at{' '}
              <strong className="text-emerald-400 font-mono">
                {formData?.email || verificationData?.email || 'your registered email'}
              </strong>{' '}
              for your 6-digit verification code.
            </div>
          </div>
        </div>
      )}

      {/* Reset / Register Another Button */}
      {onReset && (
        <div className="pt-2 flex justify-center">
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Registration Form</span>
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * TeamRegistration Component
 * Handles the registration form submission & transitions to TeamVerificationStep
 */
export default function TeamRegistration({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    adminName: '',
    teamName: '',
    phone: '+94',
    email: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verificationData, setVerificationData] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalVal = value;
    if (name === 'phone') {
      finalVal = handlePlus94PhoneInput(value);
    }
    setFormData((prev) => ({ ...prev, [name]: finalVal }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.adminName.trim()) {
      setError('Admin Full Name is required');
      return;
    }
    if (!formData.teamName.trim()) {
      setError('Team / Club Name is required');
      return;
    }
    if (!isValidPlus94Phone(formData.phone)) {
      setError('WhatsApp Number must be +94 followed by 9 digits without leading 0 (e.g. +94770000000)');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('A valid email address is required');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        adminName: formData.adminName.trim(),
        teamName: formData.teamName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        password: formData.password?.trim() || undefined,
        // Also provide snake_case keys for complete backward compatibility
        admin_name: formData.adminName.trim(),
        team_name: formData.teamName.trim(),
        phone_number: formData.phone.trim(),
        admin_email: formData.email.trim()
      };

      const response = await registerTeam(payload);

      // Extract verification method and token from JSON response
      const method =
        response?.method ||
        response?.data?.method ||
        (response?.verifyToken ? 'whatsapp' : 'email');
      const verifyToken =
        response?.verifyToken ||
        response?.data?.verifyToken ||
        (method === 'whatsapp' ? 'VERIFY-4829' : undefined);

      const verificationResult = {
        method,
        verifyToken,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        teamName: formData.teamName.trim(),
        adminName: formData.adminName.trim(),
        ...response
      };

      // Store in component state
      setVerificationData(verificationResult);

      if (onSuccess) {
        onSuccess(verificationResult);
      }
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.message || 'Failed to submit team registration');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setVerificationData(null);
    setError(null);
    setFormData({
      adminName: '',
      teamName: '',
      phone: '+94',
      email: '',
      password: ''
    });
  };

  // If verificationData exists, render TeamVerificationStep UI
  if (verificationData) {
    return (
      <TeamVerificationStep
        verificationData={verificationData}
        formData={formData}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
              onChange={handleChange}
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
              onChange={handleChange}
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
              onChange={handleChange}
              placeholder="+94770000000"
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              required
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Starts with <span className="text-emerald-400 font-mono font-bold">+94</span> followed by 9 digits (e.g. +94771234567).
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
              onChange={handleChange}
              placeholder="admin@clubdomain.lk"
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              required
            />
          </div>
        </div>

        {/* Admin Login Password (Optional / Auto-generated if empty) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            Admin Login Password (Optional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create portal password (or default to phone)"
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 text-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Submitting Registration...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Proceed to Hybrid Verification</span>
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
              Cancel
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
