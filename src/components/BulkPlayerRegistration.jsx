import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ArrowLeft,
  CheckCircle2,
  Trash2,
  RefreshCw,
  AlertCircle,
  Building2,
  Phone,
  Shield,
  Sparkles,
  ExternalLink,
  Send
} from 'lucide-react';
import PlayerFormModal from './PlayerFormModal';
import { bulkRegisterPlayers } from '../api';
import { formatDisplayPhone } from '../utils/phoneUtils';
import { formatDriveImageUrl, isDriveUrl, getDriveViewUrl } from '../utils/imageUtils';

export default function BulkPlayerRegistration({
  team = null,
  adminPhone = '',
  onBack,
  onRegistrationComplete
}) {
  const [stagedPlayers, setStagedPlayers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successResult, setSuccessResult] = useState(null);

  // Add player to local staging array
  const handleAddPlayer = (newPlayer) => {
    setStagedPlayers((prev) => [...prev, newPlayer]);
    setError(null);
  };

  // Remove player from local staging array
  const handleRemovePlayer = (indexToRemove) => {
    setStagedPlayers((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Clear all staged players
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all staged players from this batch?')) {
      setStagedPlayers([]);
      setError(null);
    }
  };

  // Commit all staged players to backend in a single bulk operation
  const handleRegisterAll = async () => {
    if (stagedPlayers.length === 0) {
      setError('Please add at least one player to the staging list before submitting.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessResult(null);

    try {
      const response = await bulkRegisterPlayers({
        players: stagedPlayers,
        admin_phone: adminPhone || team?.phone_number
      });

      if (response?.success) {
        setSuccessResult({
          count: response.count || stagedPlayers.length,
          message: response.message || 'All players registered successfully!'
        });
        setStagedPlayers([]);
        if (onRegistrationComplete) {
          onRegistrationComplete();
        }
      } else {
        throw new Error(response?.message || 'Bulk registration failed');
      }
    } catch (err) {
      console.error('Bulk registration error:', err);
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        'Failed to register staged players. Please try again.';
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const stagedNics = stagedPlayers.map((p) => p.nic);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Team Portal</span>
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Bulk Player Registration</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
                Batch Mode
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Stage multiple players and enroll them into CricPass simultaneously.
            </p>
          </div>
        </div>

        {/* Club Admin Context Pill */}
        {team && (
          <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-xs">
            <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[11px]">Authorized Club</span>
              <span className="text-white font-bold">{team.team_name}</span>
            </div>
            {adminPhone && (
              <div className="border-l border-slate-700 pl-3">
                <span className="text-slate-400 block text-[11px]">Admin WhatsApp</span>
                <span className="text-emerald-300 font-mono font-bold">{formatDisplayPhone(adminPhone)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Success View Banner */}
      {successResult && (
        <div className="p-6 bg-gradient-to-br from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/40 rounded-2xl space-y-4 animate-fadeIn shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                Batch Committed
              </span>
              <h3 className="text-xl font-bold text-white mt-0.5">
                {successResult.count} Player(s) Successfully Registered!
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                A single consolidated notification has been sent to your registered WhatsApp number{' '}
                <strong className="text-emerald-300 font-mono">{formatDisplayPhone(adminPhone || team?.phone_number)}</strong>.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => {
                setSuccessResult(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              + Register Another Batch
            </button>
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              Return to Club Roster
            </button>
          </div>
        </div>
      )}

      {/* Error Alert Box */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-3 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <div className="flex-1">
            <span className="font-bold block">Batch Registration Error:</span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-400 hover:text-white px-2 py-1 text-xs cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Staging Control Bar */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Staged Players Pool</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-bold text-xs">
                {stagedPlayers.length} {stagedPlayers.length === 1 ? 'Player' : 'Players'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Players added here are held locally until you commit them with "Register All Players".
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {stagedPlayers.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              disabled={submitting}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Clear All
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Player +</span>
          </button>
        </div>
      </div>

      {/* Staged Players List */}
      {stagedPlayers.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500 mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No Players Staged Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Your staging list is empty. Click the button below to add your first player to this batch.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Player +</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {stagedPlayers.map((player, idx) => (
              <div
                key={`${player.nic}-${idx}`}
                className="bg-slate-800/90 border border-slate-700 hover:border-emerald-500/40 rounded-xl p-4 transition-all shadow-md flex items-center justify-between gap-3 animate-fadeIn"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Photo thumbnail or default avatar */}
                  {player.image_url ? (
                    <img
                      src={formatDriveImageUrl(player.image_url)}
                      alt={player.fullName}
                      className="w-12 h-12 rounded-xl object-cover border border-emerald-500/50 shadow shrink-0"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=150&auto=format&fit=crop&q=80';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 font-bold shrink-0">
                      {player.fullName.charAt(0)}
                    </div>
                  )}

                  {/* Player info + ✅ Checkmark */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-white text-sm truncate">{player.fullName}</h4>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                        <span>✅</span>
                        <span>Staged</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                      <span>NIC: <strong className="text-slate-200">{player.nic}</strong></span>
                      <span>Phone: <strong className="text-slate-200">{player.phone}</strong></span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <Building2 className="w-3 h-3 text-emerald-400" />
                      <span className="truncate">{player.teamName || 'Assigned Club'}</span>
                      {player.image_url && isDriveUrl(player.image_url) && (
                        <a
                          href={getDriveViewUrl(player.image_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 text-emerald-400 hover:text-emerald-300 underline"
                        >
                          <span>Photo</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => handleRemovePlayer(idx)}
                  disabled={submitting}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Remove from batch"
                  aria-label="Remove player"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Commit Button Bar */}
          <div className="pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleRegisterAll}
              disabled={submitting || stagedPlayers.length === 0}
              className="w-full flex items-center justify-center gap-2.5 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-extrabold rounded-2xl shadow-xl shadow-emerald-500/25 text-base sm:text-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Registering {stagedPlayers.length} Player(s) to CricPass...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-white" />
                  <span>Register All Players ({stagedPlayers.length})</span>
                </>
              )}
            </button>
            <p className="text-center text-xs text-slate-500 mt-2">
              All {stagedPlayers.length} staged player(s) will be committed to MongoDB and marked ACTIVE. A single WhatsApp summary will be sent to the club administrator.
            </p>
          </div>
        </div>
      )}

      {/* Add Player Popup Modal */}
      <PlayerFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddPlayer}
        defaultTeam={team}
        existingNics={stagedNics}
      />
    </div>
  );
}
