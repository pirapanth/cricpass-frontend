import React from 'react';
import { RefreshCw, AlertCircle, X, Server } from 'lucide-react';

/**
 * Reusable centered modal popup for asynchronous blocking checks
 * (e.g., player NIC lookup "Checking...!" and Render cold-start team loading).
 */
export default function LoadingPopup({
  isOpen,
  title = 'Loading...',
  message = 'Please wait while we fetch the latest data...',
  badge = null,
  error = null,
  onRetry = null,
  onDismiss = null,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-live="polite"
      aria-label={title}
    >
      <div className="w-full max-w-sm bg-slate-800/95 border border-slate-700 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
        <div className="p-6 text-center space-y-4">
          {error ? (
            <>
              <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <AlertCircle className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-extrabold text-white tracking-tight">
                  Connection Taking Longer
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">{error}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Now</span>
                  </button>
                )}
                {onDismiss && (
                  <button
                    type="button"
                    onClick={onDismiss}
                    className="py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Continue</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20" />
                <div className="w-14 h-14 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                <Server className="w-5 h-5 text-emerald-400 absolute" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-extrabold text-white tracking-tight">{title}</h3>
                {message && (
                  <p className="text-xs text-slate-300 leading-relaxed">{message}</p>
                )}
              </div>

              {badge && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-emerald-500/30 text-[11px] font-mono font-semibold text-emerald-300">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>{badge}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
