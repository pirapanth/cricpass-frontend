import React, { useState, useRef } from 'react';
import {
  X,
  MessageSquare,
  FileText,
  Paperclip,
  Send,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  UploadCloud,
  FileCheck,
  Trash2
} from 'lucide-react';
import { submitContactReport } from '../api';

export default function ContactUsModal({ isOpen, onClose }) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState(null); // { filename, content (base64), contentType, size }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 5MB Limit: 5 * 1024 * 1024 bytes
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError('Attachment file size exceeds the 5MB limit. Please select a smaller file.');
      return;
    }

    setError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachment({
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        content: reader.result, // base64 data URL
        size: (file.size / 1024).toFixed(1) // KB
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!description.trim()) {
      setError('Please describe your issue or inquiry');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        user_email: 'v70524817@gmail.com',
        email: 'v70524817@gmail.com',
        subject: subject.trim() || 'General Inquiry / CricPass Support Request',
        description: description.trim(),
        issue_description: description.trim(),
        attachment: attachment
          ? {
              filename: attachment.filename,
              content: attachment.content,
              contentType: attachment.contentType
            }
          : undefined
      };

      await submitContactReport(payload);
      setShowSuccessPopup(true);
    } catch (err) {
      setError(err.message || 'Failed to submit report. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAll = () => {
    setShowSuccessPopup(false);
    setSubject('');
    setDescription('');
    setAttachment(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      {/* SUCCESS POPUP ALERT */}
      {showSuccessPopup ? (
        <div className="bg-slate-800 border border-emerald-500/50 rounded-2xl w-full max-w-md p-6 sm:p-8 space-y-6 shadow-2xl relative text-center animate-scaleIn">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/30">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Your Issue Was Successfully Reported!</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              An official dispatch has been sent to our Master Administration support desk. Our team will review your report and attached documents shortly.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCloseAll}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/30 cursor-pointer"
          >
            Done
          </button>
        </div>
      ) : (
        /* CONTACT US FORM MODAL */
        <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg p-6 sm:p-8 space-y-5 shadow-2xl relative max-h-[92vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-700">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Contact Us & Support Helpdesk</h3>
                <p className="text-[11px] text-slate-400">Report an issue, dispute, or general inquiry</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Subject */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Subject / Issue Category
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Player NIC Registration Correction or Team Transfer Query"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Detailed Issue Description <span className="text-emerald-400">*</span>
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please provide full details of your issue, club names, player NIC numbers, or technical concerns..."
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                required
              />
            </div>

            {/* File Attachment (Max 5MB) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Attachment (Image or Document, Max 5MB)
                </label>
                <span className="text-[10px] text-slate-400">Optional</span>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,.pdf,.doc,.docx,.txt"
                className="hidden"
              />

              {!attachment ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-900/60 rounded-xl p-3.5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400"
                >
                  <UploadCloud className="w-5 h-5 text-slate-400" />
                  <span className="font-medium">Click to select screenshot or document</span>
                  <span className="text-[10px] text-slate-500">Supported: JPG, PNG, PDF, DOC, TXT (up to 5MB)</span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs text-white font-medium truncate">{attachment.filename}</div>
                      <div className="text-[10px] text-slate-400">{attachment.size} KB</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveAttachment}
                    className="p-1 rounded-lg text-rose-400 hover:text-white hover:bg-rose-900/40 cursor-pointer transition-colors"
                    title="Remove attachment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending Report...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Issue Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
