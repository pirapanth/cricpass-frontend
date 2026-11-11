import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Phone,
  Shield,
  Calendar,
  Building2,
  RefreshCw
} from 'lucide-react';
import { searchPlayerByNIC } from '../api';

export default function PlayerSearch() {
  const [nic, setNic] = useState('');
  const [loading, setLoading] = useState(false);
  const [player, setPlayer] = useState(null);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e, directNic = null) => {
    if (e) e.preventDefault();
    const queryNic = (directNic || nic).trim().toUpperCase();
    if (!queryNic) {
      setError('Please enter a valid NIC number');
      return;
    }

    setNic(queryNic);
    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const response = await searchPlayerByNIC(queryNic);
      if (response?.data) {
        setPlayer(response.data);
      } else {
        setPlayer(null);
        setError(`No player found with NIC: ${queryNic}`);
      }
    } catch (err) {
      setPlayer(null);
      setError(err.message || `No player found with NIC: ${queryNic}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Player NIC Lookup & Clearance
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
          Query real-time player status by National Identity Card (NIC) to check club affiliation, match eligibility, and cooling-off countdowns.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-sm">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={nic}
              onChange={(e) => setNic(e.target.value.toUpperCase())}
              placeholder="Enter Player NIC (e.g., 199707291234 or 971234567V)"
              className="w-full pl-11 pr-4 py-3.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm sm:text-base tracking-wider uppercase font-mono font-semibold"
            />
          </div>

          <button
            id="search-btn"
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Checking...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Search</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 flex items-start gap-3 shadow-lg animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-rose-200 text-sm">Search Result</h4>
            <p className="text-xs text-rose-300/90">{error}</p>
          </div>
        </div>
      )}

      {/* Player Profile Result Card */}
      {player && (
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm animate-fadeIn">
          {/* Top Status Header */}
          <div className="px-6 py-4 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-4 bg-slate-900/40">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Record:</span>
              <span className="font-mono font-bold text-slate-200 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-sm">
                NIC: {player.nic_number}
              </span>
            </div>

            {/* Dynamic Status Badge */}
            <div>
              {player.status === 'ACTIVE' && (
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-bold shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>ACTIVE • Eligible to Play</span>
                </div>
              )}

              {player.status === 'COOLING_OFF' && (
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-sm animate-pulse">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>In Cooling-Off Period: {player.remaining_cooling_off_days || 0} days remaining</span>
                </div>
              )}

              {player.status === 'PENDING_TRANSFER' && (
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/15 border border-sky-500/40 text-sky-300 text-xs font-bold shadow-sm">
                  <RefreshCw className="w-4 h-4 text-sky-400 animate-spin" />
                  <span>TRANSFER PENDING • Verification in progress</span>
                </div>
              )}
            </div>
          </div>

          {/* Profile Main Body */}
          <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: Player Avatar & Core Info */}
            <div className="flex flex-col items-center text-center p-6 bg-slate-900/60 rounded-xl border border-slate-700/60">
              <div className="relative mb-4">
                {player.image_url ? (
                  <img
                    src={player.image_url}
                    alt={player.full_name}
                    className="w-28 h-28 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-lg"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=150&auto=format&fit=crop&q=80';
                    }}
                  />
                ) : (
                  <div className="w-28 h-28 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 border-2 border-slate-600 flex items-center justify-center text-slate-400 shadow-inner">
                    <User className="w-12 h-12 text-slate-400" />
                  </div>
                )}
                <div className={`absolute -bottom-2 -right-2 p-1.5 rounded-xl border-2 border-slate-900 shadow ${
                  player.is_eligible_to_play ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                }`}>
                  <Shield className="w-4 h-4" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-white tracking-tight">{player.full_name}</h2>
              <p className="text-xs font-mono text-emerald-400 mt-1 font-semibold">NIC: {player.nic_number}</p>

              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/50">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono">{player.phone_number}</span>
              </div>
            </div>

            {/* Right: Team Affiliation & Eligibility Metrics */}
            <div className="md:col-span-2 space-y-5">
              {/* Current Team Box */}
              <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-700/60">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>Current Club / Team Affiliation</span>
                </div>

                {player.current_team ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {player.current_team.team_name}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span>Admin: <strong className="text-slate-300">{player.current_team.admin_name}</strong></span>
                        <span>•</span>
                        <span>Tel: <strong className="text-slate-300 font-mono">{player.current_team.phone_number}</strong></span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold">
                      {player.current_team.team_id}
                    </span>
                  </div>
                ) : (
                  <div className="text-amber-400 text-sm font-medium">
                    Player is currently unassigned (Free Agent).
                  </div>
                )}
              </div>

              {/* Cooling-Off Details Alert */}
              {player.status === 'COOLING_OFF' && (
                <div className="p-5 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                      <Clock className="w-4 h-4" />
                      <span>Cooling-Off Protocol Active</span>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {player.remaining_cooling_off_days} Days Left
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Under the Cricket Transfer By-Laws, transferred players are required to observe a cooling-off cooldown period before representing their new club in sanctioned matches.
                  </p>

                  <div className="flex items-center gap-2 text-xs text-amber-200/90 pt-1 border-t border-amber-500/20">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span>Eligible to return on: <strong className="font-semibold text-white">{formatDate(player.eligible_to_play_date)}</strong></span>
                  </div>
                </div>
              )}

              {/* Active & Eligible Callout */}
              {player.status === 'ACTIVE' && (
                <div className="p-5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Clearance Approved</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    This player holds full match clearance and is immediately eligible for tournament match rosters and official match sheets.
                  </p>
                </div>
              )}

              {/* Pending Transfer Callout */}
              {player.status === 'PENDING_TRANSFER' && (
                <div className="p-5 rounded-xl bg-sky-950/30 border border-sky-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                    <RefreshCw className="w-4 h-4" />
                    <span>Pending Dual-OTP Team Verification</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    A transfer request has been initiated for this player and is awaiting authorization from the respective team administrators.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}