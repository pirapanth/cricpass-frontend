import React, { useState, useEffect } from 'react';
import {
  Shield,
  Trash2,
  Users,
  Building,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Clock,
  CheckCircle2,
  Lock,
  ArrowLeftRight,
  UserX,
  X,
  Sparkles
} from 'lucide-react';
import {
  getAdminOverview,
  deletePlayer,
  deleteTeam
} from '../api';

export default function MasterAdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(null);

  const [loading, setLoading] = useState(false);
  const [overviewData, setOverviewData] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  const [activeAdminTab, setActiveAdminTab] = useState('teams'); // 'teams' | 'players' | 'transfers'

  // Delete Confirmation Modal state
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'player' | 'team', id, name }
  const [deleting, setDeleting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  const MASTER_PASSWORD = 'admin'; // Default testing password

  useEffect(() => {
    if (isAuthenticated) {
      loadOverview();
    }
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError(null);

    if (password.trim() === MASTER_PASSWORD || password.trim() === 'cricpass2026') {
      setIsAuthenticated(true);
      setPassword('');
    } else {
      setLoginError('Incorrect Master Admin password. Hint: try "admin"');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setOverviewData(null);
    setPassword('');
  };

  const loadOverview = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await getAdminOverview();
      if (res?.data) {
        setOverviewData(res.data);
      }
    } catch (err) {
      setFetchError(err.message || 'Failed to load Master Admin overview');
    } finally {
      setLoading(false);
    }
  };

  // Open confirmation modal
  const promptDelete = (type, id, name) => {
    setDeleteTarget({ type, id, name });
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
  };

  // Execute deletion
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      if (deleteTarget.type === 'player') {
        await deletePlayer(deleteTarget.id);
        setActionSuccess(`Player "${deleteTarget.name}" deleted successfully.`);
      } else if (deleteTarget.type === 'team') {
        await deleteTeam(deleteTarget.id);
        setActionSuccess(`Team "${deleteTarget.name}" deleted and players safely unassigned.`);
      }

      closeDeleteModal();
      await loadOverview();

      setTimeout(() => {
        setActionSuccess(null);
      }, 3500);
    } catch (err) {
      alert(`Deletion failed: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold tracking-wide uppercase">
          <Shield className="w-3.5 h-3.5" />
          Master Administrative Governance
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Master Admin Control Center
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
          System-wide oversight of all registered cricket clubs, complete player registry, transfer audits, and administrative governance.
        </p>
      </div>

      {/* VIEW A: MASTER ADMIN LOGIN */}
      {!isAuthenticated && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-xl max-w-md mx-auto space-y-6 backdrop-blur-sm animate-fadeIn">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-700">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Master Admin Authentication</h2>
              <p className="text-xs text-slate-400">Protected restricted clearance zone</p>
            </div>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Admin Access Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (hint: admin)"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-bold rounded-xl shadow-lg shadow-rose-600/30 text-sm transition-all cursor-pointer"
            >
              Authenticate Master Admin
            </button>
          </form>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-slate-400 flex items-center justify-between">
            <span>Default Test Password:</span>
            <button
              type="button"
              onClick={() => setPassword('admin')}
              className="text-rose-400 font-mono font-bold hover:underline"
            >
              admin
            </button>
          </div>
        </div>
      )}

      {/* VIEW B: MASTER ADMIN DASHBOARD */}
      {isAuthenticated && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Actions & Notification */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                Master Admin Authenticated Session
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadOverview}
                disabled={loading}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Data</span>
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {actionSuccess && (
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 shadow-lg animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {fetchError && (
            <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{fetchError}</span>
            </div>
          )}

          {/* Stats Overview Grid */}
          {overviewData?.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
                  <span>Total Clubs</span>
                  <Building className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-3xl font-extrabold text-white mt-2 font-mono">
                  {overviewData.summary.total_teams}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Affiliated clubs</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
                  <span>Total Players</span>
                  <Users className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-extrabold text-white mt-2 font-mono">
                  {overviewData.summary.total_players}
                </div>
                <div className="text-[11px] text-emerald-400 mt-1 font-semibold">
                  {overviewData.summary.active_players} Active Players
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
                  <span>Cooling-Off</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-3xl font-extrabold text-amber-400 mt-2 font-mono">
                  {overviewData.summary.cooling_off_players}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">In clearance cooldown</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
                  <span>Transfers</span>
                  <ArrowLeftRight className="w-4 h-4 text-violet-400" />
                </div>
                <div className="text-3xl font-extrabold text-white mt-2 font-mono">
                  {overviewData.summary.approved_transfer_requests || 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {overviewData.summary.pending_transfer_requests || 0} Pending OTP
                </div>
              </div>
            </div>
          )}

          {/* Directory Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-700 pb-2">
            <button
              onClick={() => setActiveAdminTab('teams')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeAdminTab === 'teams'
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Teams Directory ({overviewData?.teams?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('players')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeAdminTab === 'players'
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Players Registry ({overviewData?.players?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('transfers')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeAdminTab === 'transfers'
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Recent Transfer Logs</span>
            </button>
          </div>

          {/* TAB 1: TEAMS TABLE */}
          {activeAdminTab === 'teams' && (
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
                    <tr>
                      <th className="py-3.5 px-4">Team ID</th>
                      <th className="py-3.5 px-4">Team Name</th>
                      <th className="py-3.5 px-4">Admin Name</th>
                      <th className="py-3.5 px-4">Admin Phone</th>
                      <th className="py-3.5 px-4 text-center">Players</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60 font-medium">
                    {overviewData?.teams?.map((team) => (
                      <tr key={team._id} className="hover:bg-slate-750/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                          {team.team_id}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white">
                          {team.team_name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {team.admin_name}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {team.phone_number}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 font-mono text-xs">
                            {team.total_players}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => promptDelete('team', team._id, team.team_name)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-white hover:bg-rose-900/50 transition-colors cursor-pointer"
                            title="Delete Team"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(!overviewData?.teams || overviewData.teams.length === 0) && (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-400">
                          No teams registered yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: PLAYERS TABLE */}
          {activeAdminTab === 'players' && (
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
                    <tr>
                      <th className="py-3.5 px-4">Full Name</th>
                      <th className="py-3.5 px-4">NIC Number</th>
                      <th className="py-3.5 px-4">Phone Number</th>
                      <th className="py-3.5 px-4">Affiliated Club</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60 font-medium">
                    {overviewData?.players?.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-750/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">
                          {p.full_name}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-emerald-400">
                          {p.nic_number}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {p.phone_number}
                        </td>
                        <td className="py-3.5 px-4 text-slate-200">
                          {p.team_name}
                        </td>
                        <td className="py-3.5 px-4">
                          {p.status === 'ACTIVE' && (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                              ACTIVE
                            </span>
                          )}
                          {p.status === 'COOLING_OFF' && (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                              COOLING-OFF ({p.remaining_cooling_off_days}d)
                            </span>
                          )}
                          {p.status === 'PENDING_TRANSFER' && (
                            <span className="px-2.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[11px] font-bold">
                              PENDING TRANSFER
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => promptDelete('player', p._id, p.full_name)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-white hover:bg-rose-900/50 transition-colors cursor-pointer"
                            title="Delete Player"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(!overviewData?.players || overviewData.players.length === 0) && (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-400">
                          No players registered yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: RECENT TRANSFERS */}
          {activeAdminTab === 'transfers' && (
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
                    <tr>
                      <th className="py-3.5 px-4">Player</th>
                      <th className="py-3.5 px-4">From Club</th>
                      <th className="py-3.5 px-4">To Club</th>
                      <th className="py-3.5 px-4">Transfer Type</th>
                      <th className="py-3.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60 font-medium">
                    {overviewData?.recent_transfers?.map((tr) => (
                      <tr key={tr._id} className="hover:bg-slate-750/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">
                          {tr.player_id?.full_name || 'Player'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {tr.current_team_id?.team_name || 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-cyan-400">
                          {tr.new_team_id?.team_name || 'N/A'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                            tr.transfer_type === 'ALLOWED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                          }`}>
                            {tr.transfer_type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            tr.status === 'APPROVED'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-amber-500/15 text-amber-300'
                          }`}>
                            {tr.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(!overviewData?.recent_transfers || overviewData.recent_transfers.length === 0) && (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-slate-400">
                          No recent transfers recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">
                  Confirm Deletion
                </h3>
                <span className="text-xs text-rose-400 font-semibold uppercase tracking-wider">
                  Irreversible Administrative Action
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete the {deleteTarget.type}{' '}
              <strong className="text-white">"{deleteTarget.name}"</strong>?
              {deleteTarget.type === 'team' && (
                <span className="block mt-2 text-amber-300 font-medium">
                  Note: All players affiliated with this club will automatically be converted to Free Agents.
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
