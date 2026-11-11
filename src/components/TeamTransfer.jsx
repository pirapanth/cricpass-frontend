import React, { useState } from 'react';
import {
  ArrowLeftRight,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  User,
  Calendar,
  Send,
  Mail,
  MessageSquare,
  Sparkles,
  KeyRound,
  Check,
  Lock,
  ChevronRight,
  Clock,
  Search
} from 'lucide-react';
import {
  searchPlayerByNIC,
  initiateTransfer,
  verifyTransferOTP,
  sendWhatsAppOTP,
  verifyWhatsAppOTP,
  grantMutualClearance,
  cancelTransfer
} from '../api';
import { formatDisplayPhone, maskDisplayPhone } from '../utils/phoneUtils';
import useTeams from '../hooks/useTeams';
import TeamSelectDropdown from './TeamSelectDropdown';
import LoadingPopup from './LoadingPopup';

export default function TeamTransfer() {
  // Fetch teams with Render cold-start resilience & guaranteed array state
  const {
    teams,
    loadingTeams,
    teamsError,
    loadingMessage,
    attempt,
    reloadTeams,
  } = useTeams();
  const [teamsPopupDismissed, setTeamsPopupDismissed] = useState(false);

  const safeTeams = Array.isArray(teams) ? teams : [];

  // Step 1: Form state
  const [playerNic, setPlayerNic] = useState('');
  const [playerData, setPlayerData] = useState(null);
  const [searchingPlayer, setSearchingPlayer] = useState(false);
  const [playerSearchError, setPlayerSearchError] = useState(null);

  const [currentTeamId, setCurrentTeamId] = useState('');
  const [newTeamId, setNewTeamId] = useState('');
  const [transferType, setTransferType] = useState('ALLOWED'); // ALLOWED or NOT_ALLOWED

  const [initiating, setInitiating] = useState(false);
  const [initiateError, setInitiateError] = useState(null);

  // Step 2: Transfer Session & Sequential Email OTP state
  const [transferResult, setTransferResult] = useState(null);

  // Current Team Admin Email OTP state
  const [currentOtpCode, setCurrentOtpCode] = useState('');
  const [sendingCurrentOtp, setSendingCurrentOtp] = useState(false);
  const [currentOtpSent, setCurrentOtpSent] = useState(false);
  const [verifyingCurrentOtp, setVerifyingCurrentOtp] = useState(false);
  const [currentOtpVerified, setCurrentOtpVerified] = useState(false);
  const [currentOtpMessage, setCurrentOtpMessage] = useState(null);
  const [currentOtpError, setCurrentOtpError] = useState(null);

  // New Team Admin Email OTP state
  const [newOtpCode, setNewOtpCode] = useState('');
  const [sendingNewOtp, setSendingNewOtp] = useState(false);
  const [newOtpSent, setNewOtpSent] = useState(false);
  const [verifyingNewOtp, setVerifyingNewOtp] = useState(false);
  const [newOtpVerified, setNewOtpVerified] = useState(false);
  const [newOtpMessage, setNewOtpMessage] = useState(null);
  const [newOtpError, setNewOtpError] = useState(null);

  // Step 3: Success state
  const [transferApprovedData, setTransferApprovedData] = useState(null);

  // Post-Transfer Mutual Clearance state (Reduce 30d to 14d)
  const [showClearancePanel, setShowClearancePanel] = useState(false);
  const [clearanceOtpCode, setClearanceOtpCode] = useState('');
  const [sendingClearanceOtp, setSendingClearanceOtp] = useState(false);
  const [clearanceOtpSent, setClearanceOtpSent] = useState(false);
  const [verifyingClearanceOtp, setVerifyingClearanceOtp] = useState(false);
  const [clearanceSuccessData, setClearanceSuccessData] = useState(null);
  const [clearanceMessage, setClearanceMessage] = useState(null);
  const [clearanceError, setClearanceError] = useState(null);
  const [cancellingTransfer, setCancellingTransfer] = useState(false);

  // Lookup player by NIC
  const handleLookupPlayer = async () => {
    if (!playerNic.trim()) {
      setPlayerSearchError('Please enter player NIC');
      return;
    }
    setSearchingPlayer(true);
    setPlayerSearchError(null);
    setPlayerData(null);

    try {
      const res = await searchPlayerByNIC(playerNic.trim().toUpperCase());
      if (res?.data) {
        setPlayerData(res.data);
        if (res.data.current_team?._id) {
          setCurrentTeamId(res.data.current_team._id);
        } else if (res.data.current_team?.team_id) {
          setCurrentTeamId(res.data.current_team.team_id);
        }
      }
    } catch (err) {
      setPlayerSearchError(err.message || 'Player not found');
    } finally {
      setSearchingPlayer(false);
    }
  };

  // Initiate Transfer Request
  const handleInitiateTransfer = async (e) => {
    e.preventDefault();
    setInitiateError(null);

    if (!playerData && !playerNic.trim()) {
      setInitiateError('Please look up a player by NIC first');
      return;
    }

    // Only allow transfer if player status is ACTIVE • Eligible to Play
    if (playerData && playerData.status !== 'ACTIVE') {
      if (playerData.status === 'COOLING_OFF') {
        setInitiateError(
          `Transfer Not Allowed: This player is currently in a cooling-off period (${playerData.remaining_cooling_off_days || 0} days remaining). Only players with "ACTIVE • Eligible to Play" status can be transferred.`
        );
      } else if (playerData.status === 'PENDING_TRANSFER') {
        setInitiateError(
          'Transfer Not Allowed: This player is currently in a team transferring period. Another transfer cannot be initiated until the active transfer is completed.'
        );
      } else {
        setInitiateError(
          `Transfer Not Allowed: Player status is "${playerData.status}". Only players with "ACTIVE • Eligible to Play" status can be transferred.`
        );
      }
      return;
    }

    if (!newTeamId) {
      setInitiateError('Please select a destination receiving team');
      return;
    }

    if (currentTeamId === newTeamId) {
      setInitiateError('Current team and destination team cannot be the same');
      return;
    }

    setInitiating(true);

    try {
      const payload = {
        player_id: playerData?._id || playerNic.trim().toUpperCase(),
        new_team_id: newTeamId,
        transfer_type: transferType,
      };

      const res = await initiateTransfer(payload);
      if (res?.data) {
        setTransferResult(res.data);
        // Reset OTP states for new session
        setCurrentOtpCode('');
        setCurrentOtpSent(false);
        setCurrentOtpVerified(false);
        setCurrentOtpMessage(null);
        setCurrentOtpError(null);

        setNewOtpCode('');
        setNewOtpSent(false);
        setNewOtpVerified(false);
        setNewOtpMessage(null);
        setNewOtpError(null);
      }
    } catch (err) {
      setInitiateError(err.message || 'Failed to initiate transfer request');
    } finally {
      setInitiating(false);
    }
  };

  // -------------------------------------------------------------
  // CURRENT TEAM ADMIN: Send WhatsApp OTP
  // -------------------------------------------------------------
  const handleSendCurrentAdminEmailOtp = async () => {
    const adminPhone = formatDisplayPhone(transferResult?.current_team_admin?.phone_number) || transferResult?.current_team_admin?.admin_email;
    if (!adminPhone) {
      setCurrentOtpError('Current team does not have a registered administrator WhatsApp number');
      return;
    }

    setSendingCurrentOtp(true);
    setCurrentOtpError(null);
    setCurrentOtpMessage(null);

    try {
      await sendWhatsAppOTP(
        adminPhone,
        `Transfer Release Approval: ${playerData?.full_name || 'Player'}`
      );
      setCurrentOtpSent(true);
      setCurrentOtpMessage(`OTP sent to your WhatsApp number (${maskDisplayPhone(adminPhone)})`);
    } catch (err) {
      setCurrentOtpError(err.message || 'Failed to dispatch WhatsApp OTP to current team admin');
    } finally {
      setSendingCurrentOtp(false);
    }
  };

  // -------------------------------------------------------------
  // CURRENT TEAM ADMIN: Check WhatsApp OTP
  // -------------------------------------------------------------
  const handleCheckCurrentAdminEmailOtp = async (e) => {
    if (e) e.preventDefault();
    const adminPhone = formatDisplayPhone(transferResult?.current_team_admin?.phone_number) || transferResult?.current_team_admin?.admin_email;

    if (!currentOtpCode.trim()) {
      setCurrentOtpError('Please enter the 6-digit verification code');
      return;
    }

    setVerifyingCurrentOtp(true);
    setCurrentOtpError(null);

    try {
      // 1. Verify code against WhatsApp OTP service
      const verifyRes = await verifyWhatsAppOTP(adminPhone, currentOtpCode.trim());
      if (!verifyRes?.success) {
        throw new Error(verifyRes?.message || 'Invalid verification code');
      }

      // 2. Register Current Team Admin approval with Transfer endpoint
      await verifyTransferOTP({
        transfer_id: transferResult.transfer._id,
        email_verified: true,
        role: 'CURRENT_TEAM'
      });

      setCurrentOtpVerified(true);
      setCurrentOtpMessage('✅ Current Team Admin authorization verified successfully via WhatsApp! Now proceed to Step 2.');
    } catch (err) {
      setCurrentOtpError(err.message || 'Invalid or expired OTP code');
    } finally {
      setVerifyingCurrentOtp(false);
    }
  };

  // -------------------------------------------------------------
  // NEW TEAM ADMIN: Send WhatsApp OTP
  // -------------------------------------------------------------
  const handleSendNewAdminEmailOtp = async () => {
    const adminPhone = formatDisplayPhone(transferResult?.new_team_admin?.phone_number) || transferResult?.new_team_admin?.admin_email;
    if (!adminPhone) {
      setNewOtpError('Receiving team does not have a registered administrator WhatsApp number');
      return;
    }

    setSendingNewOtp(true);
    setNewOtpError(null);
    setNewOtpMessage(null);

    try {
      await sendWhatsAppOTP(
        adminPhone,
        `Transfer Acceptance Approval: ${playerData?.full_name || 'Player'}`
      );
      setNewOtpSent(true);
      setNewOtpMessage(`OTP sent to your WhatsApp number (${maskDisplayPhone(adminPhone)})`);
    } catch (err) {
      setNewOtpError(err.message || 'Failed to dispatch WhatsApp OTP to receiving team admin');
    } finally {
      setSendingNewOtp(false);
    }
  };

  // -------------------------------------------------------------
  // NEW TEAM ADMIN: Check WhatsApp OTP & Finalize Transfer
  // -------------------------------------------------------------
  const handleCheckNewAdminEmailOtp = async (e) => {
    if (e) e.preventDefault();
    const adminPhone = formatDisplayPhone(transferResult?.new_team_admin?.phone_number) || transferResult?.new_team_admin?.admin_email;

    if (!newOtpCode.trim()) {
      setNewOtpError('Please enter the 6-digit verification code');
      return;
    }

    setVerifyingNewOtp(true);
    setNewOtpError(null);

    try {
      // 1. Verify code against WhatsApp OTP service
      const verifyRes = await verifyWhatsAppOTP(adminPhone, newOtpCode.trim());
      if (!verifyRes?.success) {
        throw new Error(verifyRes?.message || 'Invalid verification code');
      }

      // 2. Finalize Transfer in MongoDB Atlas
      const finalizeRes = await verifyTransferOTP({
        transfer_id: transferResult.transfer._id,
        email_verified: true,
        role: 'NEW_TEAM'
      });

      if (finalizeRes?.data?.transfer?.status === 'APPROVED' || finalizeRes?.data?.player_update) {
        setNewOtpVerified(true);
        setTransferApprovedData(finalizeRes.data);
      } else {
        setNewOtpVerified(true);
        setNewOtpMessage('New Team Admin verified via WhatsApp. Processing transfer approval...');
      }
    } catch (err) {
      setNewOtpError(err.message || 'Invalid or expired OTP code');
    } finally {
      setVerifyingNewOtp(false);
    }
  };

  // -------------------------------------------------------------
  // MUTUAL CLEARANCE: Send Clearance OTP to Previous Releasing Club Admin
  // -------------------------------------------------------------
  const handleSendClearanceOtp = async () => {
    const adminPhone = formatDisplayPhone(playerData?.latest_transfer?.current_team_id?.phone_number) || playerData?.latest_transfer?.current_team_id?.admin_email;
    if (!adminPhone) {
      setClearanceError('Original releasing club does not have a registered admin WhatsApp phone number');
      return;
    }

    setSendingClearanceOtp(true);
    setClearanceError(null);

    try {
      await sendWhatsAppOTP(
        adminPhone,
        `Mutual Clearance (14-Day Reduction) for ${playerData.full_name}`
      );
      setClearanceOtpSent(true);
      setClearanceMessage(`OTP sent to your WhatsApp number (${maskDisplayPhone(adminPhone)})`);
    } catch (err) {
      setClearanceError(err.message || 'Failed to dispatch clearance OTP to releasing club admin');
    } finally {
      setSendingClearanceOtp(false);
    }
  };

  // -------------------------------------------------------------
  // MUTUAL CLEARANCE: Verify Clearance OTP & Reduce to 14 Days
  // -------------------------------------------------------------
  const handleVerifyClearanceOtp = async (e) => {
    if (e) e.preventDefault();
    const adminPhone = formatDisplayPhone(playerData?.latest_transfer?.current_team_id?.phone_number) || playerData?.latest_transfer?.current_team_id?.admin_email;

    if (!clearanceOtpCode.trim()) {
      setClearanceError('Please enter the 6-digit verification code');
      return;
    }

    setVerifyingClearanceOtp(true);
    setClearanceError(null);

    try {
      // 1. Verify OTP code against WhatsApp OTP service
      const verifyRes = await verifyWhatsAppOTP(adminPhone, clearanceOtpCode.trim());
      if (!verifyRes?.success) {
        throw new Error(verifyRes?.message || 'Invalid or expired verification code');
      }

      // 2. Commit clearance reduction on backend
      const res = await grantMutualClearance({
        player_id: playerData._id,
        transfer_id: playerData.latest_transfer?._id
      });

      if (res?.data) {
        setClearanceSuccessData(res);
        // Refresh player data
        const updated = await searchPlayerByNIC(playerData.nic_number);
        if (updated?.data) setPlayerData(updated.data);
      }
    } catch (err) {
      setClearanceError(err.message || 'Failed to authorize mutual clearance');
    } finally {
      setVerifyingClearanceOtp(false);
    }
  };

  const handleResumePendingTransfer = () => {
    const pending = playerData?.pending_transfer;
    if (!pending) return;

    setTransferResult({
      transfer: pending,
      current_team_admin: pending.current_team_id,
      new_team_admin: pending.new_team_id,
    });
    setCurrentOtpCode('');
    setCurrentOtpSent(false);
    setCurrentOtpVerified(Boolean(pending.current_team_otp_verified));
    setCurrentOtpMessage(null);
    setCurrentOtpError(null);

    setNewOtpCode('');
    setNewOtpSent(false);
    setNewOtpVerified(Boolean(pending.new_team_otp_verified));
    setNewOtpMessage(null);
    setNewOtpError(null);
    setInitiateError(null);
  };

  const handleCancelTransferSession = async (transferIdOverride = null, playerIdOverride = null) => {
    setCancellingTransfer(true);
    setInitiateError(null);
    try {
      await cancelTransfer({
        transfer_id: transferIdOverride || transferResult?.transfer?._id || playerData?.pending_transfer?._id,
        player_id: playerIdOverride || playerData?._id,
      });

      setTransferResult(null);
      setCurrentOtpCode('');
      setCurrentOtpSent(false);
      setCurrentOtpVerified(false);
      setCurrentOtpMessage(null);
      setCurrentOtpError(null);
      setNewOtpCode('');
      setNewOtpSent(false);
      setNewOtpVerified(false);
      setNewOtpMessage(null);
      setNewOtpError(null);

      if (playerData?.nic_number) {
        const refreshed = await searchPlayerByNIC(playerData.nic_number);
        if (refreshed?.data) {
          setPlayerData(refreshed.data);
          if (refreshed.data.current_team?._id) {
            setCurrentTeamId(refreshed.data.current_team._id);
          }
        }
      }
    } catch (err) {
      setInitiateError(err.message || 'Failed to cancel pending transfer session');
    } finally {
      setCancellingTransfer(false);
    }
  };

  const resetTransferFlow = () => {
    setPlayerNic('');
    setPlayerData(null);
    setCurrentTeamId('');
    setNewTeamId('');
    setTransferType('ALLOWED');
    setTransferResult(null);
    setCurrentOtpCode('');
    setCurrentOtpSent(false);
    setCurrentOtpVerified(false);
    setCurrentOtpMessage(null);
    setCurrentOtpError(null);
    setNewOtpCode('');
    setNewOtpSent(false);
    setNewOtpVerified(false);
    setNewOtpMessage(null);
    setNewOtpError(null);
    setTransferApprovedData(null);
    setShowClearancePanel(false);
    setClearanceOtpCode('');
    setClearanceOtpSent(false);
    setClearanceSuccessData(null);
    setClearanceMessage(null);
    setClearanceError(null);
    setInitiateError(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Loading Popup: Player NIC Check ("Checking...!") or Cold-Start Team Loading */}
      <LoadingPopup
        isOpen={
          searchingPlayer ||
          loadingTeams ||
          (!teamsPopupDismissed && Boolean(teamsError))
        }
        title={searchingPlayer ? 'Checking...!' : 'Loading Teams...'}
        message={
          searchingPlayer
            ? 'Checking player NIC record in CricPass database...'
            : loadingMessage
        }
        badge={!searchingPlayer && attempt > 1 ? `Attempt ${attempt} of 4` : null}
        error={!searchingPlayer ? teamsError : null}
        onRetry={() => {
          setTeamsPopupDismissed(false);
          reloadTeams();
        }}
        onDismiss={() => setTeamsPopupDismissed(true)}
      />

      {/* Title Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold tracking-wide uppercase">
          <ArrowLeftRight className="w-3.5 h-3.5" />
          WhatsApp OTP Verified Transfer Protocol
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Player Inter-Club Transfer
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
          Transfer players between clubs with dual WhatsApp OTP authorization and automatic cooling-off enforcement.
        </p>
      </div>

      {/* STEP 3: Transfer Approval Celebration Banner */}
      {transferApprovedData && (
        <div className="bg-gradient-to-br from-emerald-950/90 via-slate-900 to-teal-950/90 border border-emerald-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fadeIn">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-500/30">
                Transfer Authorized & Approved
              </span>
              <h2 className="text-2xl font-bold text-white mt-1">
                {transferApprovedData.player_update?.full_name} Successfully Transferred!
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/60">
              <div className="text-xs font-semibold text-slate-400">Assigned Destination Club</div>
              <div className="text-base font-bold text-white mt-1">
                {transferApprovedData.transfer?.new_team_id?.team_name || 'Destination Team'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/60">
              <div className="text-xs font-semibold text-slate-400">Cooling-Off Cooldown</div>
              <div className="text-base font-bold text-amber-400 mt-1 flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{transferApprovedData.player_update?.cooling_off_days} Days Required</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {transferResult?.transfer?.transfer_type === 'ALLOWED'
                  ? 'Mutual clearance (14 days)'
                  : 'Contested transfer (30 days / 1 month)'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/60">
              <div className="text-xs font-semibold text-slate-400">Eligible to Play On</div>
              <div className="text-base font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(transferApprovedData.player_update?.eligible_to_play_date)}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={resetTransferFlow}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm rounded-xl border border-slate-600 transition-colors cursor-pointer"
            >
              Initiate Another Transfer
            </button>
          </div>
        </div>
      )}

      {/* MUTUAL CLEARANCE CELEBRATION BANNER */}
      {clearanceSuccessData && (
        <div className="bg-gradient-to-br from-cyan-950/90 via-slate-900 to-teal-950/90 border border-cyan-500/50 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fadeIn">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg">
              <CheckCircle className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-500/30">
                Mutual Clearance Granted
              </span>
              <h2 className="text-2xl font-bold text-white mt-1">
                Cooling-Off Successfully Reduced to 14 Days!
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/60">
              <div className="text-xs font-semibold text-slate-400">Player</div>
              <div className="text-base font-bold text-white mt-1">
                {clearanceSuccessData.data?.full_name}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/60">
              <div className="text-xs font-semibold text-slate-400">Status</div>
              <div className="text-base font-bold text-emerald-400 mt-1">
                {clearanceSuccessData.data?.status === 'ACTIVE' ? 'ACTIVE • Eligible to Play' : `COOLING-OFF (${clearanceSuccessData.data?.remaining_cooling_off_days}d left)`}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/60">
              <div className="text-xs font-semibold text-slate-400">Eligible on</div>
              <div className="text-base font-bold text-cyan-400 mt-1">
                {formatDate(clearanceSuccessData.data?.eligible_to_play_date)}
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => {
                setClearanceSuccessData(null);
                setShowClearancePanel(false);
              }}
              className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm rounded-xl transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Sequential Email OTP Verification Panel */}
      {transferResult && !transferApprovedData && (
        <div className="bg-slate-800/90 border border-cyan-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-sm animate-fadeIn">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {transferResult.transfer.transfer_type === 'ALLOWED'
                    ? 'Dual WhatsApp OTP Authorization (2-Step Protocol)'
                    : 'Receiving Club WhatsApp OTP Authorization (Contested)'}
                </h2>
                <p className="text-xs text-slate-400">
                  {transferResult.transfer.transfer_type === 'ALLOWED'
                    ? 'Step 1: Current Team Admin WhatsApp OTP -> Step 2: Destination Team Admin WhatsApp OTP'
                    : 'Current team approval bypassed. Receiving team admin authorizes player arrival via WhatsApp.'}
                </p>
              </div>
            </div>

            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
              transferResult.transfer.transfer_type === 'ALLOWED'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
            }`}>
              {transferResult.transfer.transfer_type === 'ALLOWED'
                ? 'Mutual (14 Days Cooling-Off)'
                : 'Contested (30 Days Cooling-Off)'}
            </span>
          </div>

          {/* ============================================================== */}
          {/* STEP 2A: CURRENT TEAM ADMIN EMAIL OTP (Only for ALLOWED type)   */}
          {/* ============================================================== */}
          {transferResult.transfer.transfer_type === 'ALLOWED' && (
            <div className={`p-5 rounded-2xl border transition-all ${
              currentOtpVerified
                ? 'bg-emerald-950/30 border-emerald-500/40'
                : 'bg-slate-900/90 border-slate-700/80'
            }`}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    currentOtpVerified
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {currentOtpVerified ? <Check className="w-4 h-4 stroke-[3]" /> : '1'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Step 1: Current Team Admin Release Consent
                    </h3>
                    <p className="text-xs text-slate-400">
                      Club: <strong className="text-slate-200">{transferResult.current_team_admin?.team_name}</strong> • Admin: {transferResult.current_team_admin?.admin_name}
                    </p>
                  </div>
                </div>

                {currentOtpVerified ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950 border border-emerald-500/40 text-emerald-300 rounded-full text-xs font-bold font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    VERIFIED
                  </span>
                ) : (
                  <span className="text-xs text-amber-400 font-semibold bg-amber-950/50 px-2.5 py-0.5 rounded border border-amber-500/20">
                    Awaiting Verification
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-300 flex items-center gap-2 mb-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Admin WhatsApp Number:</span>
                <strong className="text-emerald-300 font-mono">
                  {maskDisplayPhone(transferResult.current_team_admin?.phone_number) || transferResult.current_team_admin?.admin_email || 'No phone registered'}
                </strong>
              </div>

              {currentOtpMessage && (
                <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 mb-3">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{currentOtpMessage}</span>
                </div>
              )}

              {currentOtpError && (
                <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2 mb-3">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{currentOtpError}</span>
                </div>
              )}

              {!currentOtpVerified && (
                <div className="space-y-3 pt-1">
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    {!currentOtpSent ? (
                      <button
                        type="button"
                        onClick={handleSendCurrentAdminEmailOtp}
                        disabled={sendingCurrentOtp || (!transferResult.current_team_admin?.phone_number && !transferResult.current_team_admin?.admin_email)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {sendingCurrentOtp ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Sending WhatsApp OTP...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Send WhatsApp OTP to Current Admin</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="flex-1 flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={currentOtpCode}
                          onChange={(e) => setCurrentOtpCode(e.target.value.trim())}
                          placeholder="Enter 6-digit OTP"
                          className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-center text-sm font-mono tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />

                        <button
                          type="button"
                          onClick={handleCheckCurrentAdminEmailOtp}
                          disabled={verifyingCurrentOtp || !currentOtpCode}
                          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                        >
                          {verifyingCurrentOtp ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Checking...</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Check OTP & Approve Step 1</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={handleSendCurrentAdminEmailOtp}
                          disabled={sendingCurrentOtp}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                        >
                          Resend
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 2B: NEW TEAM ADMIN EMAIL OTP                              */}
          {/* ============================================================== */}
          <div className={`p-5 rounded-2xl border transition-all ${
            // Locked if ALLOWED and current team not yet verified
            transferResult.transfer.transfer_type === 'ALLOWED' && !currentOtpVerified
              ? 'opacity-60 bg-slate-900/40 border-slate-800'
              : newOtpVerified
              ? 'bg-emerald-950/30 border-emerald-500/40'
              : 'bg-slate-900/90 border-slate-700/80'
          }`}>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                  newOtpVerified
                    ? 'bg-emerald-500 text-slate-950'
                    : transferResult.transfer.transfer_type === 'ALLOWED' && !currentOtpVerified
                    ? 'bg-slate-800 text-slate-500'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>
                  {newOtpVerified ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : transferResult.transfer.transfer_type === 'ALLOWED' && !currentOtpVerified ? (
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                  ) : (
                    transferResult.transfer.transfer_type === 'ALLOWED' ? '2' : '1'
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>
                      {transferResult.transfer.transfer_type === 'ALLOWED'
                        ? 'Step 2: Destination Team Admin Acceptance Consent'
                        : 'Destination Team Admin Acceptance Consent'}
                    </span>
                    {transferResult.transfer.transfer_type === 'ALLOWED' && !currentOtpVerified && (
                      <span className="text-[11px] text-slate-400 font-normal">
                        (Locked until Step 1 completes)
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Club: <strong className="text-slate-200">{transferResult.new_team_admin?.team_name}</strong> • Admin: {transferResult.new_team_admin?.admin_name}
                  </p>
                </div>
              </div>

              {newOtpVerified ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950 border border-emerald-500/40 text-emerald-300 rounded-full text-xs font-bold font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  VERIFIED
                </span>
              ) : transferResult.transfer.transfer_type === 'NOT_ALLOWED' ? (
                <span className="text-xs text-amber-400 font-semibold bg-amber-950/50 px-2.5 py-0.5 rounded border border-amber-500/20">
                  Required for Clearance
                </span>
              ) : null}
            </div>

            <div className="text-xs text-slate-300 flex items-center gap-2 mb-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Admin WhatsApp Number:</span>
              <strong className="text-emerald-300 font-mono">
                {maskDisplayPhone(transferResult.new_team_admin?.phone_number) || transferResult.new_team_admin?.admin_email || 'No phone registered'}
              </strong>
            </div>

            {newOtpMessage && (
              <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 mb-3">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{newOtpMessage}</span>
              </div>
            )}

            {newOtpError && (
              <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2 mb-3">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{newOtpError}</span>
              </div>
            )}

            {/* If transfer is ALLOWED and Current Team hasn't verified, keep Step 2 locked */}
            {transferResult.transfer.transfer_type === 'ALLOWED' && !currentOtpVerified ? (
              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Please complete <strong>Step 1</strong> (Current Team Admin WhatsApp OTP) to unlock Step 2.
                </span>
              </div>
            ) : !newOtpVerified ? (
              <div className="space-y-3 pt-1">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  {!newOtpSent ? (
                    <button
                      type="button"
                      onClick={handleSendNewAdminEmailOtp}
                      disabled={sendingNewOtp || (!transferResult.new_team_admin?.phone_number && !transferResult.new_team_admin?.admin_email)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {sendingNewOtp ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending WhatsApp OTP...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Send WhatsApp OTP to Destination Team Admin</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex-1 flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={newOtpCode}
                        onChange={(e) => setNewOtpCode(e.target.value.trim())}
                        placeholder="Enter 6-digit OTP"
                        className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-center text-sm font-mono tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />

                      <button
                        type="button"
                        onClick={handleCheckNewAdminEmailOtp}
                        disabled={verifyingNewOtp || !newOtpCode}
                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        {verifyingNewOtp ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Finalizing Transfer...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Check OTP & Finalize Transfer</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleSendNewAdminEmailOtp}
                        disabled={sendingNewOtp}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                      >
                        Resend
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-700">
            <button
              type="button"
              onClick={() => handleCancelTransferSession()}
              disabled={cancellingTransfer}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              {cancellingTransfer ? 'Cancelling Session...' : 'Cancel Transfer Session'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 1: Transfer Initiation Form */}
      {!transferResult && !transferApprovedData && (
        <form onSubmit={handleInitiateTransfer} className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 backdrop-blur-sm">
          {initiateError && (
            <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{initiateError}</span>
            </div>
          )}

          {/* 1. Player Lookup by NIC */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              1. Player National Identity Card (NIC)
            </label>
            <div className="flex items-stretch gap-2 w-full">
              <input
                type="text"
                value={playerNic}
                onChange={(e) => setPlayerNic(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleLookupPlayer();
                  }
                }}
                placeholder="Enter Player NIC (e.g., 199707291234)"
                className="flex-1 min-w-0 px-3.5 sm:px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleLookupPlayer}
                disabled={searchingPlayer}
                aria-label="Find Player"
                title="Find Player"
                className="shrink-0 w-12 sm:w-auto sm:px-4 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center shadow-lg shadow-emerald-950/40"
              >
                {searchingPlayer ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </button>
            </div>

            {playerSearchError && (
              <p className="text-xs text-rose-400 font-medium">{playerSearchError}</p>
            )}

            {playerData && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white">{playerData.full_name}</span>
                    <span className="text-slate-400 font-mono">({playerData.nic_number})</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-slate-300">
                      Current Club: <strong className="text-emerald-400">{playerData.current_team?.team_name || 'Free Agent'}</strong>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {playerData.status === 'ACTIVE' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-bold text-[11px]">
                          ACTIVE • Eligible to Play
                        </span>
                      )}
                      {playerData.status === 'COOLING_OFF' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold text-[11px]">
                          COOLING-OFF ({playerData.remaining_cooling_off_days || 0}d left)
                        </span>
                      )}
                      {playerData.status === 'PENDING_TRANSFER' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/40 text-sky-300 font-bold text-[11px]">
                          TRANSFERRING IN PROGRESS
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Warning callouts if transfer is not allowed */}
                {playerData.status === 'COOLING_OFF' && (
                  <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <strong className="block text-white font-semibold">Transfer Blocked — Player in Cooling-Off Period</strong>
                      <span>
                        This player has <strong>{playerData.remaining_cooling_off_days || 0} days remaining</strong> in their cooling-off cooldown (eligible to return on {formatDate(playerData.eligible_to_play_date)}). Only players with <strong>ACTIVE • Eligible to Play</strong> status can be transferred.
                      </span>
                    </div>
                  </div>
                )}

                {/* POST-TRANSFER MUTUAL CLEARANCE (Reduce 30 Days to 14 Days) */}
                {playerData.status === 'COOLING_OFF' && playerData.latest_transfer?.transfer_type === 'NOT_ALLOWED' && (
                  <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/50 space-y-3 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Post-Transfer Mutual Clearance Option
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-500/30 font-bold">
                        Reduce 30d Cooldown to 14d
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      This player was transferred under a contested <strong>30-day (1 Month)</strong> period. If the original releasing club (<strong>{playerData.latest_transfer.current_team_id?.team_name}</strong>) now consents to allow the transfer, you can reduce their cooling-off cooldown to <strong>14 days</strong>.
                    </p>

                    <div className="text-xs text-slate-400 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                      <span>Destination Receiving Club (Locked):</span>
                      <strong className="text-emerald-400">{playerData.current_team?.team_name}</strong>
                    </div>

                    {!showClearancePanel ? (
                      <button
                        type="button"
                        onClick={() => {
                          setShowClearancePanel(true);
                          setClearanceError(null);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Grant Releasing Club Clearance & Reduce to 14 Days</span>
                      </button>
                    ) : (
                      <div className="space-y-3 pt-2 border-t border-slate-800">
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <MessageSquare className="w-4 h-4 text-emerald-400" />
                          <span>Releasing Club Admin WhatsApp:</span>
                          <strong className="text-emerald-300 font-mono">
                            {maskDisplayPhone(playerData.latest_transfer.current_team_id?.phone_number) || playerData.latest_transfer.current_team_id?.admin_email || 'No phone registered'}
                          </strong>
                        </div>

                        {clearanceMessage && (
                          <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{clearanceMessage}</span>
                          </div>
                        )}

                        {clearanceError && (
                          <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>{clearanceError}</span>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-2.5">
                          {!clearanceOtpSent ? (
                            <button
                              type="button"
                              onClick={handleSendClearanceOtp}
                              disabled={sendingClearanceOtp || (!playerData.latest_transfer.current_team_id?.phone_number && !playerData.latest_transfer.current_team_id?.admin_email)}
                              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {sendingClearanceOtp ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Sending WhatsApp OTP...</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Send WhatsApp OTP to Releasing Club Admin</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <div className="flex-1 flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                maxLength={6}
                                value={clearanceOtpCode}
                                onChange={(e) => setClearanceOtpCode(e.target.value.trim())}
                                placeholder="Enter 6-digit OTP"
                                className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-center text-sm font-mono tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                              />

                              <button
                                type="button"
                                onClick={handleVerifyClearanceOtp}
                                disabled={verifyingClearanceOtp || !clearanceOtpCode}
                                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                              >
                                {verifyingClearanceOtp ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Verifying...</span>
                                  </>
                                ) : (
                                  <>
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span>Check OTP & Reduce to 14 Days</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={handleSendClearanceOtp}
                                disabled={sendingClearanceOtp}
                                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                              >
                                Resend
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {playerData.status === 'PENDING_TRANSFER' && (
                  <div className="p-3.5 rounded-xl bg-sky-950/60 border border-sky-500/40 text-sky-200 text-xs space-y-2.5 animate-fadeIn">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <strong className="block text-white font-semibold">Transfer Session Already In Progress</strong>
                        <span>
                          This player has a pending transfer session awaiting WhatsApp OTP verification. You can resume verification or cancel it to start over.
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pl-6">
                      {playerData.pending_transfer && (
                        <button
                          type="button"
                          onClick={handleResumePendingTransfer}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer"
                        >
                          Resume OTP Verification
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCancelTransferSession(playerData.pending_transfer?._id, playerData._id)}
                        disabled={cancellingTransfer}
                        className="px-3 py-1.5 rounded-lg bg-rose-900/70 hover:bg-rose-800 border border-rose-500/40 text-rose-200 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {cancellingTransfer ? 'Cancelling...' : 'Cancel Pending Transfer'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Team Selection Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Current Team */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Current Releasing Team
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
                    <span>Retry</span>
                  </button>
                )}
              </div>
              <TeamSelectDropdown
                teams={safeTeams}
                value={currentTeamId}
                onChange={(selectedId) => {
                  setCurrentTeamId(selectedId);
                  if (selectedId && selectedId === newTeamId) {
                    setNewTeamId('');
                  }
                }}
                placeholder="-- Select Current Team --"
                emptyOptionLabel="-- Clear Selection --"
                loading={loadingTeams}
                error={teamsError}
                onRetry={reloadTeams}
              />
              {currentTeamId && (
                <div className="text-xs text-slate-400 font-mono px-1">
                  Admin WhatsApp:{' '}
                  <strong className="text-emerald-300">
                    {maskDisplayPhone(
                      safeTeams.find(
                        (t) => t._id === currentTeamId || t.team_id === currentTeamId
                      )?.phone_number
                    ) || 'No phone registered'}
                  </strong>
                </div>
              )}
            </div>

            {/* Destination New Team */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Destination Receiving Team
              </label>
              <TeamSelectDropdown
                teams={safeTeams}
                value={newTeamId}
                onChange={(selectedId) => setNewTeamId(selectedId)}
                placeholder="-- Select New Team --"
                disabledTeamId={currentTeamId}
                disabledBadgeText="Current"
                loading={loadingTeams}
                error={teamsError}
                onRetry={reloadTeams}
              />
              {newTeamId && (
                <div className="text-xs text-slate-400 font-mono px-1">
                  Admin WhatsApp:{' '}
                  <strong className="text-emerald-300">
                    {maskDisplayPhone(
                      safeTeams.find(
                        (t) => t._id === newTeamId || t.team_id === newTeamId
                      )?.phone_number
                    ) || 'No phone registered'}
                  </strong>
                </div>
              )}
            </div>
          </div>

          {/* 3. Transfer Type Radio Options */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Transfer Clearance Category & Cooling-Off Period
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option A: Allowed */}
              <label
                onClick={() => setTransferType('ALLOWED')}
                className={`relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  transferType === 'ALLOWED'
                    ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-900/60 border-slate-700 hover:border-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="transfer_type"
                  value="ALLOWED"
                  checked={transferType === 'ALLOWED'}
                  onChange={() => setTransferType('ALLOWED')}
                  className="mt-1 text-emerald-500 focus:ring-emerald-400"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-white">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Allowed by Current Team</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Dual 2-Step WhatsApp OTP verification (Current Team Admin first, then Receiving Team Admin). Enforces a <strong className="text-emerald-400">14-Day (2 Weeks)</strong> cooling-off period.
                  </p>
                </div>
              </label>

              {/* Option B: Not Allowed */}
              <label
                onClick={() => setTransferType('NOT_ALLOWED')}
                className={`relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  transferType === 'NOT_ALLOWED'
                    ? 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-500/10'
                    : 'bg-slate-900/60 border-slate-700 hover:border-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="transfer_type"
                  value="NOT_ALLOWED"
                  checked={transferType === 'NOT_ALLOWED'}
                  onChange={() => setTransferType('NOT_ALLOWED')}
                  className="mt-1 text-amber-500 focus:ring-amber-400"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-white">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Not Allowed by Current Team</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Contested transfer. Current team is bypassed; requires WhatsApp OTP from Receiving Team Admin only. Enforces a strict mandatory <strong className="text-amber-400">30-Day (1 Month)</strong> cooling-off cooldown.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-700">
            {playerData && playerData.status !== 'ACTIVE' && (
              <p className="text-center text-xs text-amber-400 font-semibold mb-3">
                ⚠️ Cannot initiate transfer: Player must have "ACTIVE • Eligible to Play" status.
              </p>
            )}

            <button
              type="submit"
              disabled={initiating || Boolean(playerData && playerData.status !== 'ACTIVE')}
              className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-500/20 text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {initiating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Initiating Transfer Session...</span>
                </>
              ) : playerData && playerData.status !== 'ACTIVE' ? (
                <span>Transfer Blocked (Player Not Active)</span>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>
                    {transferType === 'ALLOWED'
                      ? 'Initiate Dual-Authorization'
                      : 'Initiate Contested Transfer Protocol'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}