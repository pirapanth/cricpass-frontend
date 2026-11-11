import React, { useState, useEffect, useRef } from 'react';
import {
  UserCircle2,
  Building,
  Phone,
  Mail,
  Shield,
  KeyRound,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  LogOut,
  Sparkles,
  Users,
  Edit3,
  X,
  Zap,
  Clock,
  Plus,
  Trash2,
  Lock,
  Upload,
  FileCheck,
  ArrowLeftRight,
  ShieldAlert,
  ShieldCheck,
  Send,
  Eye,
  EyeOff,
  ArrowLeft,
  Search,
  Filter,
  ChevronRight,
  Key
} from 'lucide-react';
import {
  getTeams,
  registerTeam,
  updateAdminPhone,
  getTeamById,
  getAdminOverview,
  deletePlayer,
  deleteTeam,
  loginMasterAdmin,
  loginTeamAdmin,
  sendWhatsAppOTP,
  verifyWhatsAppOTP,
  changeTeamPassword,
  changeTeamEmail,
  lookupTeamsByPhone
} from '../api';
import {
  handlePlus94PhoneInput,
  handlePlus94KeyDown,
  isValidPlus94Phone,
  formatDisplayPhone,
  maskDisplayPhone
} from '../utils/phoneUtils';

export default function TeamAdminPortal() {
  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);

  // Authentication Mode: 'SIGN_IN' | 'REGISTER_TEAM'
  const [authMode, setAuthMode] = useState('SIGN_IN');

  // Authenticated session state
  // role: null | 'TEAM_ADMIN' | 'MASTER_ADMIN'
  const [userRole, setUserRole] = useState(null);
  const [authenticatedTeam, setAuthenticatedTeam] = useState(null);
  const [teamRoster, setTeamRoster] = useState([]);

  // Master Admin Overview Data
  const [adminOverviewData, setAdminOverviewData] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [activeMasterTab, setActiveMasterTab] = useState('teams'); // 'teams' | 'players' | 'transfers'
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingRecord, setDeletingRecord] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState(null);

  // Sign-In Form State
  const [loginTeamId, setLoginTeamId] = useState('');
  const [loginCredential, setLoginCredential] = useState(''); // password or phone
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [loginSuccess, setLoginSuccess] = useState(null);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  // Register Team Form State
  const [newTeamData, setNewTeamData] = useState({
    team_name: '',
    admin_name: '',
    admin_email: '',
    phone_number: '+94',
    password: '',
    image_url: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [teamLogoPreview, setTeamLogoPreview] = useState(null);
  const [registerTeamLoading, setRegisterTeamLoading] = useState(false);
  const [registerTeamError, setRegisterTeamError] = useState(null);
  const [registerTeamSuccess, setRegisterTeamSuccess] = useState(null);
  const teamFileInputRef = useRef(null);

  // Email OTP state for Team Registration
  const [teamEmailOtpSent, setTeamEmailOtpSent] = useState(false);
  const [sendingTeamEmailOtp, setSendingTeamEmailOtp] = useState(false);
  const [teamEmailOtpCode, setTeamEmailOtpCode] = useState('');
  const [verifyingTeamEmailOtp, setVerifyingTeamEmailOtp] = useState(false);
  const [teamEmailVerified, setTeamEmailVerified] = useState(false);
  const [teamEmailOtpMessage, setTeamEmailOtpMessage] = useState(null);
  const [teamEmailOtpError, setTeamEmailOtpError] = useState(null);

  // 2-Step Phone Update Modal State (for Team Admins)
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneStep, setPhoneStep] = useState(1);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [oldPhoneOtp, setOldPhoneOtp] = useState('');
  const [newPhoneOtp, setNewPhoneOtp] = useState('');
  const [devOldOtp, setDevOldOtp] = useState(null);
  const [devNewOtp, setDevNewOtp] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [modalSuccess, setModalSuccess] = useState(null);

  // Master Admin Drill-down & Filtering State
  const [masterTeamSearch, setMasterTeamSearch] = useState('');
  const [masterSelectedTeamId, setMasterSelectedTeamId] = useState(''); // '' means viewing all teams directory
  const [masterPlayerSearch, setMasterPlayerSearch] = useState('');

  // Team Admin Change Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwdOtpSent, setPwdOtpSent] = useState(false);
  const [pwdOtpSending, setPwdOtpSending] = useState(false);
  const [pwdOtpCode, setPwdOtpCode] = useState('');
  const [pwdOtpVerifying, setPwdOtpVerifying] = useState(false);
  const [pwdOtpVerified, setPwdOtpVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [pwdUpdating, setPwdUpdating] = useState(false);
  const [pwdModalError, setPwdModalError] = useState(null);
  const [pwdModalSuccess, setPwdModalSuccess] = useState(null);

  // Team Admin Change Email Modal State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailChangeStep, setEmailChangeStep] = useState(1); // 1: verify current, 2: verify new, 3: set password
  const [currEmailOtpSent, setCurrEmailOtpSent] = useState(false);
  const [currEmailOtpSending, setCurrEmailOtpSending] = useState(false);
  const [currEmailOtpCode, setCurrEmailOtpCode] = useState('');
  const [currEmailOtpVerifying, setCurrEmailOtpVerifying] = useState(false);
  const [currEmailVerified, setCurrEmailVerified] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newEmailOtpSent, setNewEmailOtpSent] = useState(false);
  const [newEmailOtpSending, setNewEmailOtpSending] = useState(false);
  const [newEmailOtpCode, setNewEmailOtpCode] = useState('');
  const [newEmailOtpVerifying, setNewEmailOtpVerifying] = useState(false);
  const [newEmailVerified, setNewEmailVerified] = useState(false);
  const [emailNewPassword, setEmailNewPassword] = useState('');
  const [emailConfirmNewPassword, setEmailConfirmNewPassword] = useState('');
  const [showEmailNewPassword, setShowEmailNewPassword] = useState(false);
  const [showEmailConfirmNewPassword, setShowEmailConfirmNewPassword] = useState(false);
  const [emailUpdating, setEmailUpdating] = useState(false);
  const [emailModalError, setEmailModalError] = useState(null);
  const [emailModalSuccess, setEmailModalSuccess] = useState(null);

  // Team Admin Forgot Password Modal State (Sign-In tab)
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: enter WhatsApp & send OTP, 2: verify OTP, 3: new password
  const [forgotPhone, setForgotPhone] = useState('+94');
  const [forgotMatchedTeams, setForgotMatchedTeams] = useState([]);
  const [forgotSelectedTeamId, setForgotSelectedTeamId] = useState('');
  const [forgotOtpSending, setForgotOtpSending] = useState(false);
  const [forgotOtpCode, setForgotOtpCode] = useState('');
  const [forgotOtpVerifying, setForgotOtpVerifying] = useState(false);
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [forgotUpdating, setForgotUpdating] = useState(false);
  const [forgotError, setForgotError] = useState(null);
  const [forgotSuccess, setForgotSuccess] = useState(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setLoadingTeams(true);
    try {
      const res = await getTeams();
      if (res?.data) {
        setTeams(res.data);
      }
    } catch (err) {
      console.error('Failed to load teams:', err);
    } finally {
      setLoadingTeams(false);
    }
  };

  const loadMasterAdminOverview = async () => {
    setLoadingOverview(true);
    try {
      const res = await getAdminOverview();
      if (res?.data) {
        setAdminOverviewData(res.data);
      }
    } catch (err) {
      console.error('Failed to load Master Admin overview:', err);
    } finally {
      setLoadingOverview(false);
    }
  };

  // -------------------------------------------------------------
  // Sign In Flow (Authenticates directly against MongoDB Atlas)
  // -------------------------------------------------------------
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(null);
    setLoginSuccess(null);

    const cleanTeamId = loginTeamId.trim();
    const cleanCred = loginCredential.trim();

    if (!cleanTeamId || !cleanCred) {
      setLoginError('Both Team Identifier and Password are required');
      return;
    }

    setIsSubmittingLogin(true);

    try {
      // 1. Authenticate Master Admin directly against MongoDB Atlas database
      if (cleanTeamId.toLowerCase() === 'cricpass' || !cleanTeamId.includes('-')) {
        try {
          const adminRes = await loginMasterAdmin({
            username: cleanTeamId.toLowerCase(),
            password: cleanCred
          });
          if (adminRes.success) {
            setUserRole('MASTER_ADMIN');
            setAuthenticatedTeam(null);
            await loadMasterAdminOverview();
            setIsSubmittingLogin(false);
            return;
          }
        } catch (adminErr) {
          // If identifier wasn't a Master Admin username, proceed to check Team Admin
        }
      }

      // 2. Authenticate Team Admin directly against MongoDB Atlas Teams collection
      const teamRes = await loginTeamAdmin({
        team_id: cleanTeamId.toUpperCase(),
        password: cleanCred,
        phone_number: cleanCred
      });

      if (teamRes.success && teamRes.data?.team) {
        setAuthenticatedTeam(teamRes.data.team);
        setTeamRoster(teamRes.data.players || []);
        setUserRole('TEAM_ADMIN');
      } else {
        throw new Error(teamRes.message || 'Invalid credentials');
      }
    } catch (err) {
      setLoginError(err.message || 'Invalid credentials. Record not found.');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleLogout = () => {
    setUserRole(null);
    setAuthenticatedTeam(null);
    setTeamRoster([]);
    setAdminOverviewData(null);
    setLoginTeamId('');
    setLoginCredential('');
    setLoginError(null);
    setLoginSuccess(null);
  };

  // -------------------------------------------------------------
  // Forgot Password Handlers (for Sign-In Tab)
  // -------------------------------------------------------------
  const openForgotModal = () => {
    setLoginError(null);
    setLoginSuccess(null);

    const typedIdentifier = loginTeamId.trim();
    if (!typedIdentifier) {
      setLoginError('Please enter your Team Identifier or Club Name first before clicking Forgot the password.');
      return;
    }

    const normalized = typedIdentifier.toUpperCase();
    const matchedTeam = teams.find(
      (t) =>
        String(t.team_id || '').toUpperCase() === normalized ||
        String(t.team_name || '').toUpperCase() === normalized
    );

    if (!matchedTeam) {
      setLoginError(`No registered club found matching "${typedIdentifier}". Please check your Team ID or Club Name.`);
      return;
    }

    const formattedPhone = matchedTeam.phone_number ? formatDisplayPhone(matchedTeam.phone_number) : '';
    if (!isValidPlus94Phone(formattedPhone)) {
      setLoginError('This club does not have a valid registered Admin WhatsApp number.');
      return;
    }

    setShowForgotModal(true);
    setForgotStep(1);
    setForgotPhone(formattedPhone);
    setForgotMatchedTeams([matchedTeam]);
    setForgotSelectedTeamId(matchedTeam.team_id);
    setForgotOtpSending(false);
    setForgotOtpCode('');
    setForgotOtpVerifying(false);
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setShowForgotNewPassword(false);
    setShowForgotConfirmPassword(false);
    setForgotUpdating(false);
    setForgotError(null);
    setForgotSuccess(null);
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
  };

  const handleSendForgotOtp = async (e) => {
    if (e) e.preventDefault();
    setForgotError(null);

    const cleanPhone = forgotPhone.trim();
    if (!forgotSelectedTeamId || !isValidPlus94Phone(cleanPhone)) {
      setForgotError('No valid registered Admin WhatsApp number found for this team.');
      return;
    }

    setForgotOtpSending(true);
    try {
      const lookupRes = await lookupTeamsByPhone(cleanPhone);
      const matched = lookupRes?.data || [];
      const exactTeam = matched.find((t) => t.team_id === forgotSelectedTeamId);
      if (!exactTeam) {
        setForgotError(`Registered Admin WhatsApp number ${maskDisplayPhone(cleanPhone)} could not be verified for ${forgotSelectedTeamId}`);
        return;
      }

      await sendWhatsAppOTP(cleanPhone, 'Team Admin Password Reset');
      setForgotOtpCode('');
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.message || 'Failed to dispatch OTP to WhatsApp number');
    } finally {
      setForgotOtpSending(false);
    }
  };

  const handleVerifyForgotOtp = async (e) => {
    if (e) e.preventDefault();
    setForgotError(null);

    if (!forgotOtpCode.trim()) {
      setForgotError('Please enter the 6-digit OTP received on WhatsApp');
      return;
    }

    setForgotOtpVerifying(true);
    try {
      const res = await verifyWhatsAppOTP(forgotPhone.trim(), forgotOtpCode.trim());
      if (res?.success) {
        setForgotStep(3);
      }
    } catch (err) {
      setForgotError(err.message || 'Invalid or expired OTP code');
    } finally {
      setForgotOtpVerifying(false);
    }
  };

  const handleSubmitForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError(null);

    if (!forgotNewPassword.trim()) {
      setForgotError('Please enter a new password');
      return;
    }
    if (forgotNewPassword.trim().length < 6) {
      setForgotError('Password must be at least 6 characters in length');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match. Please verify both fields.');
      return;
    }

    setForgotUpdating(true);
    try {
      const res = await changeTeamPassword({
        team_id: forgotSelectedTeamId || undefined,
        phone_number: forgotPhone.trim(),
        new_password: forgotNewPassword.trim()
      });

      const updatedTeamId = res?.data?.team_id || forgotSelectedTeamId;
      setForgotSuccess('Password updated successfully! Redirecting to Sign In...');
      await fetchTeams();

      setTimeout(() => {
        setShowForgotModal(false);
        setAuthMode('SIGN_IN');
        if (updatedTeamId) {
          setLoginTeamId(updatedTeamId);
        }
        setLoginCredential('');
        setLoginError(null);
        setLoginSuccess('Password updated successfully! Please sign in with your new password.');
      }, 1200);
    } catch (err) {
      setForgotError(err.message || 'Failed to update password');
    } finally {
      setForgotUpdating(false);
    }
  };

  // -------------------------------------------------------------
  // Send WhatsApp OTP for Team Registration
  // -------------------------------------------------------------
  const handleSendTeamEmailOtp = async () => {
    const phoneToVerify = newTeamData.phone_number?.trim();
    if (!isValidPlus94Phone(phoneToVerify)) {
      setTeamEmailOtpError(
        'Please enter a valid 9-digit WhatsApp number after +94 without a leading 0 (e.g. +94771454651)'
      );
      return;
    }

    setSendingTeamEmailOtp(true);
    setTeamEmailOtpError(null);
    setTeamEmailOtpMessage(null);

    try {
      await sendWhatsAppOTP(
        phoneToVerify,
        `Team Admin Registration Authorization (${newTeamData.team_name || 'New Team'})`
      );
      setTeamEmailOtpSent(true);
      setTeamEmailOtpMessage(`OTP sent to your WhatsApp number (${phoneToVerify})`);
    } catch (err) {
      setTeamEmailOtpError(err.message || 'Failed to dispatch WhatsApp verification code');
    } finally {
      setSendingTeamEmailOtp(false);
    }
  };

  // -------------------------------------------------------------
  // Verify WhatsApp OTP Code for Team Registration
  // -------------------------------------------------------------
  const handleCheckTeamEmailOtp = async (e) => {
    if (e) e.preventDefault();
    const phoneToVerify = newTeamData.phone_number?.trim();

    if (!teamEmailOtpCode.trim()) {
      setTeamEmailOtpError('Please enter the 6-digit OTP code received on WhatsApp');
      return;
    }

    setVerifyingTeamEmailOtp(true);
    setTeamEmailOtpError(null);

    try {
      const res = await verifyWhatsAppOTP(phoneToVerify, teamEmailOtpCode.trim());
      if (res?.success) {
        setTeamEmailVerified(true);
        setTeamEmailOtpMessage('✅ WhatsApp verified successfully! You can now register the club team.');
      }
    } catch (err) {
      setTeamEmailOtpError(err.message || 'Invalid or expired OTP code. Please try again.');
    } finally {
      setVerifyingTeamEmailOtp(false);
    }
  };

  // -------------------------------------------------------------
  // Register New Team Flow
  // -------------------------------------------------------------
  const handleTeamLogoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setRegisterTeamError('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setTeamLogoPreview(reader.result);
      setNewTeamData((prev) => ({ ...prev, image_url: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRegisterTeamSubmit = async (e) => {
    e.preventDefault();
    setRegisterTeamError(null);
    setRegisterTeamSuccess(null);

    if (!newTeamData.team_name.trim()) {
      setRegisterTeamError('Team / Club Name is required');
      return;
    }
    if (!newTeamData.admin_name.trim()) {
      setRegisterTeamError('Admin Full Name is required');
      return;
    }
    if (!isValidPlus94Phone(newTeamData.phone_number)) {
      setRegisterTeamError(
        'WhatsApp Number must be +94 followed by 9 digits without a leading 0 (e.g. +94771454651)'
      );
      return;
    }
    if (!teamEmailVerified) {
      setRegisterTeamError('WhatsApp OTP verification is mandatory. Please verify your WhatsApp number before registering.');
      return;
    }
    if (!newTeamData.password.trim()) {
      setRegisterTeamError('Admin Login Password is required');
      return;
    }
    if (!confirmPassword.trim()) {
      setRegisterTeamError('Please confirm your admin login password');
      return;
    }
    if (newTeamData.password.trim() !== confirmPassword.trim()) {
      setRegisterTeamError('Passwords do not match. Please ensure both passwords match.');
      return;
    }

    setRegisterTeamLoading(true);

    try {
      const formattedPhone = newTeamData.phone_number.trim();
      const derivedEmail =
        newTeamData.admin_email?.trim().toLowerCase() ||
        `${formattedPhone.replace(/\D/g, '')}@cricpass.lk`;

      const payload = {
        team_name: newTeamData.team_name.trim(),
        admin_name: newTeamData.admin_name.trim(),
        admin_email: derivedEmail,
        phone_number: formattedPhone,
        password: newTeamData.password.trim(),
        image_url: newTeamData.image_url || undefined
      };

      const res = await registerTeam(payload);
      if (res?.data) {
        const assignedTeamId = res.data.team_id;
        setRegisterTeamSuccess(
          `Team "${res.data.team_name}" registered successfully! Assigned Unique Team ID: ${assignedTeamId}`
        );
        await fetchTeams();

        // Pre-fill Sign-In credentials
        setLoginTeamId(assignedTeamId);
        setLoginCredential(newTeamData.password.trim());

        // Reset form
        setNewTeamData({
          team_name: '',
          admin_name: '',
          admin_email: '',
          phone_number: '+94',
          password: '',
          image_url: ''
        });
        setConfirmPassword('');
        setShowRegisterPassword(false);
        setShowConfirmPassword(false);
        setTeamLogoPreview(null);
        setTeamEmailOtpSent(false);
        setTeamEmailVerified(false);
        setTeamEmailOtpCode('');
        setTeamEmailOtpMessage(null);

        // Switch back to Sign-In tab after 2.5s
        setTimeout(() => {
          setAuthMode('SIGN_IN');
          setRegisterTeamSuccess(null);
        }, 2500);
      }
    } catch (err) {
      setRegisterTeamError(err.message || 'Failed to register team');
    } finally {
      setRegisterTeamLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Master Admin Deletion Flow
  // -------------------------------------------------------------
  const promptDeleteRecord = (type, id, name) => {
    setDeleteTarget({ type, id, name });
  };

  const confirmDeleteRecord = async () => {
    if (!deleteTarget) return;
    setDeletingRecord(true);
    try {
      if (deleteTarget.type === 'player') {
        await deletePlayer(deleteTarget.id);
        setActionSuccessMessage(`Player "${deleteTarget.name}" deleted successfully.`);
      } else if (deleteTarget.type === 'team') {
        await deleteTeam(deleteTarget.id);
        setActionSuccessMessage(`Team "${deleteTarget.name}" deleted and players safely converted to Free Agents.`);
      }
      setDeleteTarget(null);
      await loadMasterAdminOverview();
      await fetchTeams();
      setTimeout(() => setActionSuccessMessage(null), 3500);
    } catch (err) {
      alert(`Deletion failed: ${err.message}`);
    } finally {
      setDeletingRecord(false);
    }
  };

  // -------------------------------------------------------------
  // 2-Step Phone Update Modal Handlers (for Team Admin)
  // -------------------------------------------------------------
  const openPhoneModal = () => {
    setShowPhoneModal(true);
    setPhoneStep(1);
    setNewPhoneNumber('+94');
    setOldPhoneOtp('');
    setNewPhoneOtp('');
    setDevOldOtp(null);
    setDevNewOtp(null);
    setModalError(null);
    setModalSuccess(null);
  };

  const closePhoneModal = () => {
    setShowPhoneModal(false);
  };

  const handleRequestOldPhoneOtp = async (e) => {
    e.preventDefault();
    setModalError(null);
    if (!newPhoneNumber.trim() || newPhoneNumber.trim() === '+94') {
      setModalError('Please enter the new WhatsApp phone number');
      return;
    }
    if (!isValidPlus94Phone(newPhoneNumber.trim())) {
      setModalError('Phone number must be +94 followed by 9 digits without a leading 0 (e.g. +94771454651)');
      return;
    }
    if (newPhoneNumber.trim() === formatDisplayPhone(authenticatedTeam.phone_number)) {
      setModalError('New phone number cannot be identical to current phone number');
      return;
    }

    setModalLoading(true);
    try {
      const res = await updateAdminPhone({
        team_id: authenticatedTeam.team_id,
        new_phone_number: newPhoneNumber.trim(),
        step: 'INITIATE',
      });
      if (res?.data) {
        setDevOldOtp(res.data.dev_old_phone_otp);
        setPhoneStep(2);
      }
    } catch (err) {
      setModalError(err.message || 'Failed to initiate phone update');
    } finally {
      setModalLoading(false);
    }
  };

  const handleVerifyOldPhoneOtp = async (e) => {
    e.preventDefault();
    setModalError(null);
    if (!oldPhoneOtp.trim()) {
      setModalError('Please enter the OTP sent to your current phone');
      return;
    }

    setModalLoading(true);
    try {
      const res = await updateAdminPhone({
        team_id: authenticatedTeam.team_id,
        old_phone_otp: oldPhoneOtp.trim(),
        step: 'VERIFY_OLD',
      });
      if (res?.data) {
        setDevNewOtp(res.data.dev_new_phone_otp);
        setPhoneStep(3);
      }
    } catch (err) {
      setModalError(err.message || 'Invalid old phone OTP');
    } finally {
      setModalLoading(false);
    }
  };

  const handleVerifyNewPhoneOtp = async (e) => {
    e.preventDefault();
    setModalError(null);
    if (!newPhoneOtp.trim()) {
      setModalError('Please enter the OTP sent to your new phone');
      return;
    }

    setModalLoading(true);
    try {
      const res = await updateAdminPhone({
        team_id: authenticatedTeam.team_id,
        new_phone_otp: newPhoneOtp.trim(),
        step: 'VERIFY_NEW',
      });
      if (res?.data) {
        setAuthenticatedTeam(res.data);
        setModalSuccess('Phone number successfully updated!');
        setTimeout(() => {
          closePhoneModal();
          fetchTeams();
        }, 1500);
      }
    } catch (err) {
      setModalError(err.message || 'Invalid new phone OTP');
    } finally {
      setModalLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Change Password Handlers (for Logged-in Team Admin)
  // -------------------------------------------------------------
  const openPasswordModal = () => {
    setShowPasswordModal(true);
    setPwdOtpSent(false);
    setPwdOtpSending(false);
    setPwdOtpCode('');
    setPwdOtpVerifying(false);
    setPwdOtpVerified(false);
    setNewPassword('');
    setConfirmNewPassword('');
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
    setPwdUpdating(false);
    setPwdModalError(null);
    setPwdModalSuccess(null);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
  };

  const handleSendPasswordOtp = async () => {
    const adminPhone = authenticatedTeam?.phone_number || authenticatedTeam?.admin_email;
    if (!adminPhone) {
      setPwdModalError('No registered admin WhatsApp phone number found for this club');
      return;
    }
    setPwdOtpSending(true);
    setPwdModalError(null);
    try {
      await sendWhatsAppOTP(adminPhone, 'Team Admin Password Change Authorization');
      setPwdOtpSent(true);
    } catch (err) {
      setPwdModalError(err.message || 'Failed to dispatch OTP to admin WhatsApp');
    } finally {
      setPwdOtpSending(false);
    }
  };

  const handleVerifyPasswordOtp = async (e) => {
    if (e) e.preventDefault();
    const adminPhone = authenticatedTeam?.phone_number || authenticatedTeam?.admin_email;
    if (!pwdOtpCode.trim()) {
      setPwdModalError('Please enter the 6-digit OTP code');
      return;
    }
    setPwdOtpVerifying(true);
    setPwdModalError(null);
    try {
      const res = await verifyWhatsAppOTP(adminPhone, pwdOtpCode.trim());
      if (res?.success) {
        setPwdOtpVerified(true);
      }
    } catch (err) {
      setPwdModalError(err.message || 'Invalid or expired OTP code');
    } finally {
      setPwdOtpVerifying(false);
    }
  };

  const handleSubmitNewPassword = async (e) => {
    e.preventDefault();
    setPwdModalError(null);
    if (!newPassword.trim()) {
      setPwdModalError('Please enter a new password');
      return;
    }
    if (newPassword.trim().length < 6) {
      setPwdModalError('Password must be at least 6 characters in length');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwdModalError('Passwords do not match. Please verify both fields.');
      return;
    }

    setPwdUpdating(true);
    try {
      await changeTeamPassword({
        team_id: authenticatedTeam.team_id,
        new_password: newPassword.trim()
      });
      setPwdModalSuccess('Password updated successfully!');
      setTimeout(() => {
        closePasswordModal();
      }, 1800);
    } catch (err) {
      setPwdModalError(err.message || 'Failed to update password');
    } finally {
      setPwdUpdating(false);
    }
  };

  // -------------------------------------------------------------
  // Change Email Handlers (for Logged-in Team Admin)
  // -------------------------------------------------------------
  const openEmailModal = () => {
    setShowEmailModal(true);
    setEmailChangeStep(1);
    setCurrEmailOtpSent(false);
    setCurrEmailOtpSending(false);
    setCurrEmailOtpCode('');
    setCurrEmailOtpVerifying(false);
    setCurrEmailVerified(false);
    setNewAdminEmail('+94');
    setNewEmailOtpSent(false);
    setNewEmailOtpSending(false);
    setNewEmailOtpCode('');
    setNewEmailOtpVerifying(false);
    setNewEmailVerified(false);
    setEmailNewPassword('');
    setEmailConfirmNewPassword('');
    setShowEmailNewPassword(false);
    setShowEmailConfirmNewPassword(false);
    setEmailUpdating(false);
    setEmailModalError(null);
    setEmailModalSuccess(null);
  };

  const closeEmailModal = () => {
    setShowEmailModal(false);
  };

  // Step 1: Send OTP to Current WhatsApp
  const handleSendCurrEmailOtp = async () => {
    const currPhone = formatDisplayPhone(authenticatedTeam?.phone_number) || authenticatedTeam?.admin_email;
    if (!currPhone) {
      setEmailModalError('No current admin WhatsApp number found');
      return;
    }
    setCurrEmailOtpSending(true);
    setEmailModalError(null);
    try {
      await sendWhatsAppOTP(currPhone, 'Authorization to Change Admin WhatsApp Number');
      setCurrEmailOtpSent(true);
    } catch (err) {
      setEmailModalError(err.message || 'Failed to dispatch OTP to current WhatsApp');
    } finally {
      setCurrEmailOtpSending(false);
    }
  };

  // Step 1: Verify OTP for Current WhatsApp
  const handleVerifyCurrEmailOtp = async (e) => {
    if (e) e.preventDefault();
    if (!currEmailOtpCode.trim()) {
      setEmailModalError('Please enter the OTP code received on WhatsApp');
      return;
    }
    const currPhone = formatDisplayPhone(authenticatedTeam?.phone_number) || authenticatedTeam?.admin_email;
    setCurrEmailOtpVerifying(true);
    setEmailModalError(null);
    try {
      const res = await verifyWhatsAppOTP(currPhone, currEmailOtpCode.trim());
      if (res?.success) {
        setCurrEmailVerified(true);
        setEmailChangeStep(2);
      }
    } catch (err) {
      setEmailModalError(err.message || 'Invalid or expired OTP code');
    } finally {
      setCurrEmailOtpVerifying(false);
    }
  };

  // Step 2: Send OTP to New WhatsApp Number
  const handleSendNewEmailOtp = async () => {
    const contactToVerify = newAdminEmail.trim();
    if (!isValidPlus94Phone(contactToVerify)) {
      setEmailModalError('WhatsApp number must be +94 followed by 9 digits without a leading 0 (e.g. +94771454651)');
      return;
    }

    setNewEmailOtpSending(true);
    setEmailModalError(null);
    try {
      await sendWhatsAppOTP(contactToVerify, 'New Admin WhatsApp Verification');
      setNewEmailOtpSent(true);
    } catch (err) {
      setEmailModalError(err.message || 'Failed to dispatch verification code to new WhatsApp');
    } finally {
      setNewEmailOtpSending(false);
    }
  };

  // Step 2: Verify OTP for New WhatsApp Number
  const handleVerifyNewEmailOtp = async (e) => {
    if (e) e.preventDefault();
    if (!newEmailOtpCode.trim()) {
      setEmailModalError('Please enter the 6-digit OTP received on WhatsApp');
      return;
    }
    setNewEmailOtpVerifying(true);
    setEmailModalError(null);
    try {
      const res = await verifyWhatsAppOTP(newAdminEmail.trim(), newEmailOtpCode.trim());
      if (res?.success) {
        setNewEmailVerified(true);
        setEmailChangeStep(3);
      }
    } catch (err) {
      setEmailModalError(err.message || 'Invalid or expired OTP code');
    } finally {
      setNewEmailOtpVerifying(false);
    }
  };

  // Step 3: Enter New Password & Submit Both
  const handleSubmitNewEmailAndPassword = async (e) => {
    e.preventDefault();
    setEmailModalError(null);
    if (!emailNewPassword.trim()) {
      setEmailModalError('Please enter a new password for the account');
      return;
    }
    if (emailNewPassword.trim().length < 6) {
      setEmailModalError('Password must be at least 6 characters in length');
      return;
    }
    if (emailNewPassword !== emailConfirmNewPassword) {
      setEmailModalError('Passwords do not match. Please verify both fields.');
      return;
    }

    setEmailUpdating(true);
    try {
      const cleanNewPhone = newAdminEmail.trim();
      const res = await changeTeamEmail({
        team_id: authenticatedTeam.team_id,
        new_phone: cleanNewPhone,
        new_email: cleanNewPhone,
        new_password: emailNewPassword.trim()
      });

      if (res?.data) {
        setAuthenticatedTeam(res.data);
      } else {
        setAuthenticatedTeam((prev) => ({
          ...prev,
          phone_number: cleanNewPhone
        }));
      }

      setEmailModalSuccess(
        'WhatsApp number updated! Official credential confirmation dispatched to the new WhatsApp number.'
      );
      setTimeout(() => {
        closeEmailModal();
        fetchTeams();
      }, 2500);
    } catch (err) {
      setEmailModalError(err.message || 'Failed to update WhatsApp contact');
    } finally {
      setEmailUpdating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* ============================================================== */}
      {/* 1. NOT LOGGED IN: SIGN IN OR REGISTER NEW TEAM TABS            */}
      {/* ============================================================== */}
      {!userRole && (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold tracking-wide uppercase">
              <UserCircle2 className="w-3.5 h-3.5" />
              Club Administration & Governance Portal
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Team Admin Access
            </h1>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Sign in to manage your club roster, update verified credentials, or enroll a new cricket team.
            </p>
          </div>

          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm">
            {/* Top Switcher Tabs: Sign In vs Register Team */}
            <div className="grid grid-cols-2 border-b border-slate-700 bg-slate-900/60 p-1.5 gap-1.5">
              <button
                type="button"
                onClick={() => setAuthMode('SIGN_IN')}
                className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  authMode === 'SIGN_IN'
                    ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthMode('REGISTER_TEAM')}
                className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  authMode === 'REGISTER_TEAM'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Register New Team</span>
              </button>
            </div>

            <div className="p-6 sm:p-8">
              {/* ------------------------------------------------------ */}
              {/* TAB A: SIGN IN FORM                                    */}
              {/* ------------------------------------------------------ */}
              {authMode === 'SIGN_IN' && (
                <div className="space-y-6 animate-fadeIn">
                  {loginSuccess && (
                    <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{loginSuccess}</span>
                    </div>
                  )}

                  {loginError && (
                    <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Team Identifier, Club Name or Username
                      </label>
                      <input
                        type="text"
                        value={loginTeamId}
                        onChange={(e) => setLoginTeamId(e.target.value)}
                        placeholder="e.g. TEAM-001, Colombo Lions"
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                        required
                      />
                      <span className="block text-[11px] text-slate-500">
                        Club Admins enter Team ID or Team Name
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Admin Password
                        </label>
                        <button
                          type="button"
                          onClick={openForgotModal}
                          className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors cursor-pointer"
                        >
                          Forgot the password?
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showLoginPassword ? 'text' : 'password'}
                          value={loginCredential}
                          onChange={(e) => setLoginCredential(e.target.value)}
                          placeholder="Enter your admin password"
                          className="w-full pl-10 pr-10 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                          tabIndex={-1}
                          title={showLoginPassword ? 'Hide password' : 'Show password'}
                        >
                          {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingLogin}
                      className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-400 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-600/30 text-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingLogin ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Authenticating...</span>
                        </>
                      ) : (
                        <span>Sign In</span>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* ------------------------------------------------------ */}
              {/* TAB B: REGISTER NEW TEAM FORM                          */}
              {/* ------------------------------------------------------ */}
              {authMode === 'REGISTER_TEAM' && (
                <div className="space-y-6 animate-fadeIn">
                  {registerTeamError && (
                    <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{registerTeamError}</span>
                    </div>
                  )}

                  {registerTeamSuccess && (
                    <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{registerTeamSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleRegisterTeamSubmit} className="space-y-4">

                    {/* Team Name */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Club / Team Name <span className="text-emerald-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={newTeamData.team_name}
                        onChange={(e) =>
                          setNewTeamData((prev) => ({ ...prev, team_name: e.target.value }))
                        }
                        placeholder="e.g. Galle Gladiators or Colombo Stars"
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        required
                      />
                    </div>

                    {/* Admin Name */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Admin Full Name <span className="text-emerald-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={newTeamData.admin_name}
                        onChange={(e) =>
                          setNewTeamData((prev) => ({ ...prev, admin_name: e.target.value }))
                        }
                        placeholder="e.g. Mahela Jayawardene"
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        required
                      />
                    </div>

                    {/* Admin WhatsApp & OTP Verification */}
                    <div className="space-y-2 p-3.5 rounded-xl bg-slate-900/90 border border-slate-700">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        WhatsApp Number (with Country Code) <span className="text-emerald-400">*</span>
                      </label>
                      <input
                        type="tel"
                        maxLength={12}
                        value={newTeamData.phone_number}
                        onKeyDown={handlePlus94KeyDown}
                        onChange={(e) => {
                          const formatted = handlePlus94PhoneInput(e.target.value);
                          setNewTeamData((prev) => ({
                            ...prev,
                            phone_number: formatted,
                            admin_email: `${formatted.replace(/\D/g, '')}@cricpass.lk`
                          }));
                          // Reset OTP verification if phone is changed
                          setTeamEmailVerified(false);
                          setTeamEmailOtpSent(false);
                          setTeamEmailOtpCode('');
                          setTeamEmailOtpMessage(null);
                          setTeamEmailOtpError(null);
                        }}
                        placeholder="+94771454651"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        required
                      />
                      <p className="text-[11px] text-slate-400">
                        Always starts with <span className="text-emerald-400 font-mono font-bold">+94</span> followed by 9 digits (e.g. <span className="font-mono text-slate-300">+94771454651</span>). Leading 0 is removed automatically.
                      </p>

                      {/* WhatsApp OTP Verification Section */}
                      {teamEmailOtpMessage && (
                        <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{teamEmailOtpMessage}</span>
                        </div>
                      )}

                      {teamEmailOtpError && (
                        <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>{teamEmailOtpError}</span>
                        </div>
                      )}

                      {!teamEmailVerified ? (
                        <div className="pt-1 space-y-2">
                          {!teamEmailOtpSent ? (
                            <button
                              type="button"
                              onClick={handleSendTeamEmailOtp}
                              disabled={sendingTeamEmailOtp || newTeamData.phone_number.length <= 3}
                              className="w-full flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {sendingTeamEmailOtp ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Sending OTP to WhatsApp...</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Send OTP to WhatsApp Number</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                maxLength={6}
                                value={teamEmailOtpCode}
                                onChange={(e) => setTeamEmailOtpCode(e.target.value.trim())}
                                placeholder="Enter 6-digit OTP"
                                className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-center text-sm font-mono tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />

                              <button
                                type="button"
                                onClick={handleCheckTeamEmailOtp}
                                disabled={verifyingTeamEmailOtp || !teamEmailOtpCode.trim()}
                                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                              >
                                {verifyingTeamEmailOtp ? (
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
                                onClick={handleSendTeamEmailOtp}
                                disabled={sendingTeamEmailOtp}
                                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                              >
                                Resend
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 text-emerald-300 font-bold">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span>WhatsApp Number Verified! Ready for Registration</span>
                          </div>
                          <span className="text-[10px] bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
                            VERIFIED
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Admin Password */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Admin Login Password <span className="text-emerald-400">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showRegisterPassword ? 'text' : 'password'}
                          value={newTeamData.password}
                          onChange={(e) =>
                            setNewTeamData((prev) => ({ ...prev, password: e.target.value }))
                          }
                          placeholder="Create secure portal password"
                          className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                          tabIndex={-1}
                          title={showRegisterPassword ? 'Hide password' : 'Show password'}
                        >
                          {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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

                    {/* Club Logo / Image from File Manager */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Club Logo / Crest (Optional - Select from File Manager)
                      </label>
                      <input
                        type="file"
                        ref={teamFileInputRef}
                        onChange={handleTeamLogoFileChange}
                        accept="image/*"
                        className="hidden"
                      />

                      {!teamLogoPreview ? (
                        <div
                          onClick={() => teamFileInputRef.current?.click()}
                          className="border border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-900/60 rounded-xl p-3 text-center cursor-pointer transition-all flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-emerald-400"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Choose Club Logo from File Manager</span>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-500/40 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img
                              src={teamLogoPreview}
                              alt="Team Crest"
                              className="w-8 h-8 rounded-lg object-cover border border-emerald-500"
                            />
                            <span className="text-xs text-white font-medium">Logo selected</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setTeamLogoPreview(null);
                              setNewTeamData((prev) => ({ ...prev, image_url: '' }));
                            }}
                            className="text-rose-400 hover:text-white text-xs cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={registerTeamLoading || !teamEmailVerified}
                      className="w-full mt-2 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 text-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {registerTeamLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Registering Club...</span>
                        </span>
                      ) : !teamEmailVerified ? (
                        <span className="flex items-center justify-center gap-2">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Verify Admin OTP to Enable Registration</span>
                        </span>
                      ) : (
                        <span>Create & Register Club Team</span>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. AUTHENTICATED AS: MASTER ADMIN                              */}
      {/* ============================================================== */}
      {userRole === 'MASTER_ADMIN' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Master Admin Header */}
          <div className="bg-slate-800/90 border border-rose-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-lg">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-white">Master Admin Control Center</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-950 border border-rose-500/40 text-rose-300 font-mono font-bold text-xs">
                      Super Admin
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Logged in via secure identifier: <strong className="text-white font-mono">cricpass</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={loadMasterAdminOverview}
                  disabled={loadingOverview}
                  className="flex items-center gap-2 px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingOverview ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-4 py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-800/40 text-rose-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>

          {actionSuccessMessage && (
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 shadow-lg animate-fadeIn">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionSuccessMessage}</span>
            </div>
          )}

          {/* Stats Overview Grid */}
          {adminOverviewData?.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
                  <span>Total Clubs</span>
                  <Building className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-3xl font-extrabold text-white mt-2 font-mono">
                  {adminOverviewData.summary.total_teams}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
                  <span>Total Players</span>
                  <Users className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-extrabold text-white mt-2 font-mono">
                  {adminOverviewData.summary.total_players}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
                  <span>Cooling-Off</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-3xl font-extrabold text-amber-400 mt-2 font-mono">
                  {adminOverviewData.summary.cooling_off_players}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
                  <span>Transfers</span>
                  <ArrowLeftRight className="w-4 h-4 text-violet-400" />
                </div>
                <div className="text-3xl font-extrabold text-white mt-2 font-mono">
                  {adminOverviewData.summary.approved_transfer_requests || 0}
                </div>
              </div>
            </div>
          )}

          {/* Directory Tabs */}
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveMasterTab('teams')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeMasterTab === 'teams'
                    ? 'bg-slate-700 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>Teams Directory ({adminOverviewData?.teams?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveMasterTab('players')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeMasterTab === 'players'
                    ? 'bg-slate-700 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Players Registry ({adminOverviewData?.players?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveMasterTab('transfers')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeMasterTab === 'transfers'
                    ? 'bg-slate-700 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>Recent Transfers</span>
              </button>
            </div>

            {/* Quick Register New Team Button for Master Admin */}
            <button
              onClick={() => {
                setUserRole(null);
                setAuthMode('REGISTER_TEAM');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Team</span>
            </button>
          </div>

          {/* TAB 1: TEAMS DIRECTORY & DRILL-DOWN PLAYERS LIST */}
          {activeMasterTab === 'teams' && (
            <div className="space-y-4">
              {/* Teams Filter & Dropdown Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-slate-800/90 border border-slate-700 rounded-2xl shadow-lg">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={masterTeamSearch}
                    onChange={(e) => setMasterTeamSearch(e.target.value)}
                    placeholder="Search teams by name, ID or admin..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <select
                      value={masterSelectedTeamId}
                      onChange={(e) => {
                        setMasterSelectedTeamId(e.target.value);
                        setMasterPlayerSearch('');
                      }}
                      className="px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                    >
                      <option value="">-- Select Team to view players --</option>
                      {adminOverviewData?.teams?.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.team_name} ({t.team_id})
                        </option>
                      ))}
                    </select>
                  </div>

                  {masterSelectedTeamId && (
                    <button
                      type="button"
                      onClick={() => {
                        setMasterSelectedTeamId('');
                        setMasterPlayerSearch('');
                      }}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap"
                    >
                      Show All Teams
                    </button>
                  )}
                </div>
              </div>

              {/* 1A. DRILL-DOWN VIEW: PLAYERS OF SELECTED TEAM */}
              {masterSelectedTeamId ? (
                (() => {
                  const selectedTeamObj = adminOverviewData?.teams?.find(
                    (t) => t._id === masterSelectedTeamId || t.team_id === masterSelectedTeamId
                  );
                  const drillDownPlayers = (adminOverviewData?.players || []).filter((p) => {
                    const belongs =
                      p.current_team_id === masterSelectedTeamId ||
                      p.team_name === selectedTeamObj?.team_name;
                    if (!belongs) return false;
                    if (!masterPlayerSearch.trim()) return true;
                    const q = masterPlayerSearch.trim().toLowerCase();
                    return (
                      p.full_name?.toLowerCase().includes(q) ||
                      p.nic_number?.toLowerCase().includes(q)
                    );
                  });

                  return (
                    <div className="bg-slate-800/90 border border-cyan-500/30 rounded-2xl overflow-hidden shadow-xl space-y-4 p-5 animate-fadeIn">
                      {/* Drill-down Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-700 gap-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setMasterSelectedTeamId('');
                              setMasterPlayerSearch('');
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>All Teams</span>
                          </button>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-extrabold text-white text-base">
                                {selectedTeamObj?.team_name || 'Selected Team'}
                              </h3>
                              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">
                                {selectedTeamObj?.team_id}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Admin: <strong className="text-slate-200">{selectedTeamObj?.admin_name}</strong> |{' '}
                              WhatsApp: <span className="font-mono text-emerald-400">{formatDisplayPhone(selectedTeamObj?.phone_number)}</span>
                            </p>
                          </div>
                        </div>

                        {/* Player Name Search Filter (e.g. 'kar' matches 'karan' and 'karna') */}
                        <div className="relative w-full sm:w-64">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Search className="w-3.5 h-3.5" />
                          </div>
                          <input
                            type="text"
                            value={masterPlayerSearch}
                            onChange={(e) => setMasterPlayerSearch(e.target.value)}
                            placeholder="Filter player name (e.g. 'kar')..."
                            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          />
                        </div>
                      </div>

                      {/* Matching count indicator */}
                      <div className="text-[11px] text-slate-400 flex items-center justify-between">
                        <span>
                          Showing <strong className="text-white">{drillDownPlayers.length}</strong> player(s) affiliated with {selectedTeamObj?.team_name}
                          {masterPlayerSearch.trim() && (
                            <span> matching &ldquo;<span className="text-cyan-400">{masterPlayerSearch}</span>&rdquo;</span>
                          )}
                        </span>
                      </div>

                      {/* Players Table for Selected Team */}
                      <div className="overflow-x-auto rounded-xl border border-slate-700/80">
                        <table className="w-full text-left text-xs text-slate-300">
                          <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
                            <tr>
                              <th className="py-3 px-4">Player Full Name</th>
                              <th className="py-3 px-4">NIC Number</th>
                              <th className="py-3 px-4">Phone Number</th>
                              <th className="py-3 px-4">Eligibility Status</th>
                              <th className="py-3 px-4 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700/60 font-medium bg-slate-850/50">
                            {drillDownPlayers.map((player) => (
                              <tr key={player._id} className="hover:bg-slate-750/50 transition-colors">
                                <td className="py-3 px-4 font-bold text-white">{player.full_name}</td>
                                <td className="py-3 px-4 font-mono font-semibold text-emerald-400">{player.nic_number}</td>
                                <td className="py-3 px-4 font-mono text-slate-300">{formatDisplayPhone(player.phone_number)}</td>
                                <td className="py-3 px-4">
                                  {player.status === 'ACTIVE' && (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                                      ACTIVE
                                    </span>
                                  )}
                                  {player.status === 'COOLING_OFF' && (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                                      COOLING-OFF ({player.remaining_cooling_off_days}d)
                                    </span>
                                  )}
                                  {player.status === 'PENDING_TRANSFER' && (
                                    <span className="px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[11px] font-bold">
                                      PENDING TRANSFER
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => promptDeleteRecord('player', player._id, player.full_name)}
                                    className="p-1.5 rounded-lg text-rose-400 hover:text-white hover:bg-rose-900/50 transition-colors cursor-pointer"
                                    title="Delete Player"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {drillDownPlayers.length === 0 && (
                              <tr>
                                <td colSpan="5" className="py-8 text-center text-slate-400">
                                  {masterPlayerSearch.trim()
                                    ? `No players found matching "${masterPlayerSearch}" in this team roster.`
                                    : 'No players currently registered to this team.'}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()
              ) : (
                /* 1B. ALL TEAMS DIRECTORY TABLE */
                (() => {
                  const filteredTeams = (adminOverviewData?.teams || []).filter((team) => {
                    if (!masterTeamSearch.trim()) return true;
                    const q = masterTeamSearch.trim().toLowerCase();
                    return (
                      team.team_name?.toLowerCase().includes(q) ||
                      team.team_id?.toLowerCase().includes(q) ||
                      team.admin_name?.toLowerCase().includes(q) ||
                      team.admin_email?.toLowerCase().includes(q)
                    );
                  });

                  return (
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
                            {filteredTeams.map((team) => (
                              <tr key={team._id} className="hover:bg-slate-750/50 transition-colors">
                                <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">{team.team_id}</td>
                                <td className="py-3.5 px-4">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMasterSelectedTeamId(team._id);
                                      setMasterPlayerSearch('');
                                    }}
                                    className="font-bold text-white hover:text-cyan-400 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                                  >
                                    <span>{team.team_name}</span>
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                                  </button>
                                </td>
                                <td className="py-3.5 px-4 text-slate-300">
                                  <div className="font-semibold text-white">{team.admin_name}</div>
                                </td>
                                <td className="py-3.5 px-4 font-mono text-emerald-400">{formatDisplayPhone(team.phone_number)}</td>
                                <td className="py-3.5 px-4 text-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMasterSelectedTeamId(team._id);
                                      setMasterPlayerSearch('');
                                    }}
                                    className="px-2.5 py-1 rounded-full bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold cursor-pointer transition-colors"
                                    title="Click to view player roster"
                                  >
                                    {team.total_players} players
                                  </button>
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMasterSelectedTeamId(team._id);
                                        setMasterPlayerSearch('');
                                      }}
                                      className="px-2.5 py-1 bg-slate-700 hover:bg-cyan-600 text-slate-200 hover:text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                    >
                                      View Players
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => promptDeleteRecord('team', team._id, team.team_name)}
                                      className="p-1.5 rounded-lg text-rose-400 hover:text-white hover:bg-rose-900/50 transition-colors cursor-pointer"
                                      title="Delete Team"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {filteredTeams.length === 0 && (
                              <tr>
                                <td colSpan="6" className="py-8 text-center text-slate-400">
                                  {masterTeamSearch.trim()
                                    ? `No teams found matching "${masterTeamSearch}".`
                                    : 'No teams registered yet.'}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          )}

          {/* TAB 2: PLAYERS REGISTRY WITH TEAM FILTER & SUBSTRING SEARCH */}
          {activeMasterTab === 'players' && (
            <div className="space-y-4">
              {/* Filter Toolbar for Players Tab */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-slate-800/90 border border-slate-700 rounded-2xl shadow-lg">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={masterPlayerSearch}
                    onChange={(e) => setMasterPlayerSearch(e.target.value)}
                    placeholder="Search player by name (e.g. 'kar' matches 'karan' & 'karna') or NIC..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <select
                      value={masterSelectedTeamId}
                      onChange={(e) => setMasterSelectedTeamId(e.target.value)}
                      className="px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                    >
                      <option value="">-- All Clubs (Entire League) --</option>
                      {adminOverviewData?.teams?.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.team_name} ({t.team_id})
                        </option>
                      ))}
                    </select>
                  </div>

                  {masterSelectedTeamId && (
                    <button
                      type="button"
                      onClick={() => setMasterSelectedTeamId('')}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Clear Club Filter
                    </button>
                  )}
                </div>
              </div>

              {/* Filtered Players Table */}
              {(() => {
                const selectedTeamObj = adminOverviewData?.teams?.find(
                  (t) => t._id === masterSelectedTeamId || t.team_id === masterSelectedTeamId
                );
                const filteredAllPlayers = (adminOverviewData?.players || []).filter((p) => {
                  if (masterSelectedTeamId) {
                    const belongs =
                      p.current_team_id === masterSelectedTeamId ||
                      p.team_name === selectedTeamObj?.team_name;
                    if (!belongs) return false;
                  }
                  if (!masterPlayerSearch.trim()) return true;
                  const q = masterPlayerSearch.trim().toLowerCase();
                  return (
                    p.full_name?.toLowerCase().includes(q) ||
                    p.nic_number?.toLowerCase().includes(q)
                  );
                });

                return (
                  <div className="bg-slate-800/90 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
                    <div className="p-3 bg-slate-900/60 border-b border-slate-700 flex items-center justify-between text-xs text-slate-400">
                      <span>
                        Showing <strong className="text-white">{filteredAllPlayers.length}</strong> of{' '}
                        <strong className="text-slate-300">{adminOverviewData?.players?.length || 0}</strong> players
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
                          <tr>
                            <th className="py-3.5 px-4">Full Name</th>
                            <th className="py-3.5 px-4">NIC Number</th>
                            <th className="py-3.5 px-4">Phone Number</th>
                            <th className="py-3.5 px-4">Affiliated Club</th>
                            <th className="py-3.5 px-4">Status</th>
                            <th className="py-3.5 px-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/60 font-medium">
                          {filteredAllPlayers.map((p) => (
                            <tr key={p._id} className="hover:bg-slate-750/50 transition-colors">
                              <td className="py-3.5 px-4 font-bold text-white">{p.full_name}</td>
                              <td className="py-3.5 px-4 font-mono font-semibold text-emerald-400">{p.nic_number}</td>
                              <td className="py-3.5 px-4 font-mono text-slate-300">{formatDisplayPhone(p.phone_number)}</td>
                              <td className="py-3.5 px-4 text-slate-200">{p.team_name}</td>
                              <td className="py-3.5 px-4">
                                {p.status === 'ACTIVE' && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                                    ACTIVE
                                  </span>
                                )}
                                {p.status === 'COOLING_OFF' && (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                                    COOLING-OFF ({p.remaining_cooling_off_days}d)
                                  </span>
                                )}
                                {p.status === 'PENDING_TRANSFER' && (
                                  <span className="px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[11px] font-bold">
                                    PENDING TRANSFER
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => promptDeleteRecord('player', p._id, p.full_name)}
                                  className="p-1.5 rounded-lg text-rose-400 hover:text-white hover:bg-rose-900/50 transition-colors cursor-pointer"
                                  title="Delete Player"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {filteredAllPlayers.length === 0 && (
                            <tr>
                              <td colSpan="6" className="py-8 text-center text-slate-400">
                                No players found matching the current search criteria.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 3: RECENT TRANSFERS */}
          {activeMasterTab === 'transfers' && (
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
                    {adminOverviewData?.recent_transfers?.map((tr) => (
                      <tr key={tr._id} className="hover:bg-slate-750/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">{tr.player_id?.full_name || 'Player'}</td>
                        <td className="py-3.5 px-4 text-slate-300">{tr.current_team_id?.team_name || 'N/A'}</td>
                        <td className="py-3.5 px-4 font-bold text-cyan-400">{tr.new_team_id?.team_name || 'N/A'}</td>
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
                            tr.status === 'APPROVED' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-300'
                          }`}>
                            {tr.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(!adminOverviewData?.recent_transfers || adminOverviewData.recent_transfers.length === 0) && (
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

      {/* ============================================================== */}
      {/* 3. AUTHENTICATED AS: CLUB TEAM ADMIN                           */}
      {/* ============================================================== */}
      {userRole === 'TEAM_ADMIN' && authenticatedTeam && (
        <div className="space-y-6 animate-fadeIn">
          {/* Admin Header Card */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                {authenticatedTeam.image_url ? (
                  <img
                    src={authenticatedTeam.image_url}
                    alt={authenticatedTeam.team_name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-500 shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-400 border border-cyan-400/40 flex items-center justify-center text-white shadow-lg text-2xl font-bold">
                    {authenticatedTeam.team_name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-white">{authenticatedTeam.team_name}</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-mono font-bold text-xs">
                      {authenticatedTeam.team_id}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1">
                    <span>Admin: <strong className="text-slate-200">{authenticatedTeam.admin_name}</strong></span>
                    <span className="flex items-center gap-1">
                      WhatsApp No: <strong className="text-emerald-300 font-mono">{formatDisplayPhone(authenticatedTeam.phone_number)}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={openPasswordModal}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-700/80 hover:bg-slate-700 border border-slate-600 text-slate-200 rounded-xl text-xs font-bold transition-all shadow cursor-pointer"
                  title="Change your team admin login password with WhatsApp OTP verification"
                >
                  <KeyRound className="w-4 h-4 text-cyan-400" />
                  <span>Change Password</span>
                </button>

                <button
                  type="button"
                  onClick={openEmailModal}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/40 text-teal-300 rounded-xl text-xs font-bold transition-all shadow cursor-pointer"
                  title="Update registered WhatsApp number with 2-step WhatsApp OTP verification"
                >
                  <Phone className="w-4 h-4 text-teal-400" />
                  <span>Change WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>

          {/* Team Roster List */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Club Player Roster</h3>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 font-mono">
                No of Players : {teamRoster.length} 
              </span>
            </div>

            {teamRoster.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No players currently registered to this team. Use the "Register Player" tab to assign new talent.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {teamRoster.map((player) => (
                  <div
                    key={player._id}
                    className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/70 flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="font-bold text-white text-sm">{player.full_name}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                        <span>NIC: {player.nic_number}</span>
                      </div>
                    </div>

                    <div>
                      {player.status === 'ACTIVE' ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>COOLING-OFF</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: 2-STEP PHONE NUMBER UPDATE (FOR CLUB ADMIN)           */}
      {/* ============================================================== */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">2-Step Verified Contact Change</h3>
              </div>
              <button
                onClick={closePhoneModal}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold px-2">
              <div className={`flex items-center gap-1.5 ${phoneStep >= 1 ? 'text-cyan-400' : 'text-slate-500'}`}>
                <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">1</span>
                <span>Initiate</span>
              </div>
              <div className={`h-0.5 flex-1 mx-2 ${phoneStep >= 2 ? 'bg-cyan-500' : 'bg-slate-700'}`}></div>
              <div className={`flex items-center gap-1.5 ${phoneStep >= 2 ? 'text-cyan-400' : 'text-slate-500'}`}>
                <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">2</span>
                <span>Verify Old</span>
              </div>
              <div className={`h-0.5 flex-1 mx-2 ${phoneStep >= 3 ? 'bg-cyan-500' : 'bg-slate-700'}`}></div>
              <div className={`flex items-center gap-1.5 ${phoneStep >= 3 ? 'text-cyan-400' : 'text-slate-500'}`}>
                <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">3</span>
                <span>Verify New</span>
              </div>
            </div>

            {modalError && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {modalSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{modalSuccess}</span>
              </div>
            )}

            {phoneStep === 1 && (
              <form onSubmit={handleRequestOldPhoneOtp} className="space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs space-y-1">
                  <span className="text-slate-400 block font-medium">Current Registered Contact:</span>
                  <span className="text-white font-mono font-bold text-sm">{formatDisplayPhone(authenticatedTeam?.phone_number)}</span>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Enter New Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    maxLength={12}
                    value={newPhoneNumber}
                    onKeyDown={handlePlus94KeyDown}
                    onChange={(e) => setNewPhoneNumber(handlePlus94PhoneInput(e.target.value))}
                    placeholder="+94771454651"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={modalLoading}
                  className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {modalLoading ? 'Sending OTP...' : 'Send OTP to Current Number'}
                </button>
              </form>
            )}

            {phoneStep === 2 && (
              <form onSubmit={handleVerifyOldPhoneOtp} className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">OTP Sent to Current Phone:</span>
                    <span className="text-cyan-400 font-mono font-bold text-sm">{devOldOtp || '******'}</span>
                  </div>
                  {devOldOtp && (
                    <button
                      type="button"
                      onClick={() => setOldPhoneOtp(devOldOtp)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Autofill OTP</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Enter Current Phone OTP
                  </label>
                  <input
                    type="text"
                    maxLength="6"
                    value={oldPhoneOtp}
                    onChange={(e) => setOldPhoneOtp(e.target.value.trim())}
                    placeholder="000000"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-center text-xl font-mono tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={modalLoading}
                  className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {modalLoading ? 'Verifying...' : 'Verify Old Number & Send New OTP'}
                </button>
              </form>
            )}

            {phoneStep === 3 && (
              <form onSubmit={handleVerifyNewPhoneOtp} className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">OTP Sent to New Phone ({newPhoneNumber}):</span>
                    <span className="text-emerald-400 font-mono font-bold text-sm">{devNewOtp || '******'}</span>
                  </div>
                  {devNewOtp && (
                    <button
                      type="button"
                      onClick={() => setNewPhoneOtp(devNewOtp)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Autofill OTP</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Enter New Phone OTP
                  </label>
                  <input
                    type="text"
                    maxLength="6"
                    value={newPhoneOtp}
                    onChange={(e) => setNewPhoneOtp(e.target.value.trim())}
                    placeholder="000000"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-center text-xl font-mono tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={modalLoading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {modalLoading ? 'Updating...' : 'Verify & Commit Phone Number Change'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: MASTER ADMIN DELETE CONFIRMATION MODAL                */}
      {/* ============================================================== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Confirm Deletion</h3>
                <span className="text-xs text-rose-400 font-semibold uppercase tracking-wider">
                  Irreversible Action
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
                onClick={() => setDeleteTarget(null)}
                disabled={deletingRecord}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDeleteRecord}
                disabled={deletingRecord}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {deletingRecord ? (
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
      {/* ============================================================== */}
      {/* MODAL 3: TEAM ADMIN CHANGE PASSWORD MODAL                      */}
      {/* ============================================================== */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Change Admin Password</h3>
              </div>
              <button
                type="button"
                onClick={closePasswordModal}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {pwdModalError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{pwdModalError}</span>
              </div>
            )}

            {pwdModalSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{pwdModalSuccess}</span>
              </div>
            )}

            {!pwdOtpVerified ? (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs space-y-1">
                  <span className="text-slate-400 block font-medium">Verification Code Recipient:</span>
                  <span className="text-emerald-400 font-mono font-bold text-sm">
                    {formatDisplayPhone(authenticatedTeam?.phone_number) || authenticatedTeam?.admin_email}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">
                    An OTP must be verified on your registered WhatsApp number before setting a new password.
                  </p>
                </div>

                {!pwdOtpSent ? (
                  <button
                    type="button"
                    onClick={handleSendPasswordOtp}
                    disabled={pwdOtpSending}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {pwdOtpSending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sending OTP to WhatsApp...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send OTP to Admin WhatsApp</span>
                      </>
                    )}
                  </button>
                ) : (
                  <form onSubmit={handleVerifyPasswordOtp} className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Enter 6-Digit WhatsApp OTP
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={pwdOtpCode}
                        onChange={(e) => setPwdOtpCode(e.target.value.trim())}
                        placeholder="000000"
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-center text-xl font-mono tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={pwdOtpVerifying || !pwdOtpCode.trim()}
                        className="flex-1 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        {pwdOtpVerifying ? 'Verifying OTP...' : 'Verify Email OTP'}
                      </button>

                      <button
                        type="button"
                        onClick={handleSendPasswordOtp}
                        disabled={pwdOtpSending}
                        className="px-3 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Resend
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              /* Once OTP is verified: New Password Form */
              <form onSubmit={handleSubmitNewPassword} className="space-y-4">
                <div className="p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Whatsapp OTP Verified! Enter your new password below.</span>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    New Admin Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                      tabIndex={-1}
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Confirm New Admin Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmNewPassword ? 'text' : 'password'}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                      tabIndex={-1}
                      title={showConfirmNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={pwdUpdating}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {pwdUpdating ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Updating...</span>
                    </span>
                  ) : (
                    <span>Commit New Password</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: TEAM ADMIN CHANGE EMAIL MODAL                         */}
      {/* ============================================================== */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-white text-base">Change Admin Whatsapp No</h3>
              </div>
              <button
                type="button"
                onClick={closeEmailModal}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Indicator */}
            <div className="flex items-center justify-between text-[11px] font-semibold px-1">
              <div className={`flex items-center gap-1 ${emailChangeStep >= 1 ? 'text-teal-400' : 'text-slate-500'}`}>
                <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">1</span>
                <span>Current Whatsapp No</span>
              </div>
              <div className={`h-0.5 flex-1 mx-2 ${emailChangeStep >= 2 ? 'bg-teal-500' : 'bg-slate-700'}`}></div>
              <div className={`flex items-center gap-1 ${emailChangeStep >= 2 ? 'text-teal-400' : 'text-slate-500'}`}>
                <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">2</span>
                <span>New Whatsapp No</span>
              </div>
              <div className={`h-0.5 flex-1 mx-2 ${emailChangeStep >= 3 ? 'bg-teal-500' : 'bg-slate-700'}`}></div>
              <div className={`flex items-center gap-1 ${emailChangeStep >= 3 ? 'text-teal-400' : 'text-slate-500'}`}>
                <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">3</span>
                <span>Set Password</span>
              </div>
            </div>

            {emailModalError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{emailModalError}</span>
              </div>
            )}

            {emailModalSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{emailModalSuccess}</span>
              </div>
            )}

            {/* STEP 1: VERIFY CURRENT EMAIL */}
            {emailChangeStep === 1 && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs space-y-1">
                  <span className="text-slate-400 block font-medium">Current Registered WhatsApp / Contact:</span>
                  <span className="text-white font-mono font-bold text-sm">
                    {formatDisplayPhone(authenticatedTeam?.phone_number) || authenticatedTeam?.admin_email}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Step 1 requires verifying authorization on your current registered WhatsApp number.
                  </p>
                </div>

                {!currEmailOtpSent ? (
                  <button
                    type="button"
                    onClick={handleSendCurrEmailOtp}
                    disabled={currEmailOtpSending}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {currEmailOtpSending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sending OTP to WhatsApp...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send OTP to Current WhatsApp</span>
                      </>
                    )}
                  </button>
                ) : (
                  <form onSubmit={handleVerifyCurrEmailOtp} className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Enter OTP Sent to Current WhatsApp
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={currEmailOtpCode}
                        onChange={(e) => setCurrEmailOtpCode(e.target.value.trim())}
                        placeholder="000000"
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-center text-xl font-mono tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        required
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={currEmailOtpVerifying || !currEmailOtpCode.trim()}
                        className="flex-1 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        {currEmailOtpVerifying ? 'Verifying OTP...' : 'Verify WhatsApp OTP'}
                      </button>

                      <button
                        type="button"
                        onClick={handleSendCurrEmailOtp}
                        disabled={currEmailOtpSending}
                        className="px-3 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Resend
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* STEP 2: VERIFY NEW CONTACT */}
            {emailChangeStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    WhatsApp Number (with Country Code)
                  </label>
                  <input
                    type="tel"
                    maxLength={12}
                    value={newAdminEmail}
                    onKeyDown={handlePlus94KeyDown}
                    onChange={(e) => {
                      setNewAdminEmail(handlePlus94PhoneInput(e.target.value));
                      setNewEmailOtpSent(false);
                      setNewEmailOtpCode('');
                    }}
                    placeholder="+94771454651"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                  <p className="text-[11px] text-slate-500">
                    Fixed +94 prefix • Enter 9 digits (leading 0 is automatically removed)
                  </p>
                </div>

                {!newEmailOtpSent ? (
                  <button
                    type="button"
                    onClick={handleSendNewEmailOtp}
                    disabled={newEmailOtpSending || !isValidPlus94Phone(newAdminEmail)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {newEmailOtpSending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sending OTP to New WhatsApp...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send OTP to New WhatsApp</span>
                      </>
                    )}
                  </button>
                ) : (
                  <form onSubmit={handleVerifyNewEmailOtp} className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Enter OTP Sent to New WhatsApp ({newAdminEmail})
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={newEmailOtpCode}
                        onChange={(e) => setNewEmailOtpCode(e.target.value.trim())}
                        placeholder="000000"
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-center text-xl font-mono tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        required
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={newEmailOtpVerifying || !newEmailOtpCode.trim()}
                        className="flex-1 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        {newEmailOtpVerifying ? 'Verifying...' : 'Verify New WhatsApp OTP'}
                      </button>

                      <button
                        type="button"
                        onClick={handleSendNewEmailOtp}
                        disabled={newEmailOtpSending}
                        className="px-3 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Resend
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* STEP 3: SET NEW PASSWORD FOR NEW EMAIL */}
            {emailChangeStep === 3 && (
              <form onSubmit={handleSubmitNewEmailAndPassword} className="space-y-4">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>New WhatsApp Verified: {newAdminEmail}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Now create and confirm a password for your updated credentials. Official confirmation details will be dispatched to this WhatsApp number.
                  </p>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    New Account Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showEmailNewPassword ? 'text' : 'password'}
                      value={emailNewPassword}
                      onChange={(e) => setEmailNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowEmailNewPassword(!showEmailNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                      tabIndex={-1}
                      title={showEmailNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showEmailNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Confirm New Account Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showEmailConfirmNewPassword ? 'text' : 'password'}
                      value={emailConfirmNewPassword}
                      onChange={(e) => setEmailConfirmNewPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowEmailConfirmNewPassword(!showEmailConfirmNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                      tabIndex={-1}
                      title={showEmailConfirmNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showEmailConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={emailUpdating}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {emailUpdating ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving New Email & Dispatching Credentials...</span>
                    </span>
                  ) : (
                    <span>Confirm & Update Email Address</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: FORGOT ADMIN PASSWORD MODAL (FROM SIGN-IN TAB)        */}
      {/* ============================================================== */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="font-bold text-white text-base">Reset Admin Password</h3>
                  <p className="text-[11px] text-slate-400">Step {forgotStep} of 3 • WhatsApp OTP Recovery</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeForgotModal}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {/* STEP 1: View Read-Only Masked WhatsApp & Send OTP */}
            {forgotStep === 1 && (
              <form onSubmit={handleSendForgotOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Registered Admin WhatsApp Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={forgotPhone ? maskDisplayPhone(forgotPhone) : ''}
                      readOnly
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900/70 border border-slate-700 rounded-xl text-emerald-300 font-mono text-sm cursor-not-allowed focus:outline-none select-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotOtpSending || !forgotSelectedTeamId || !isValidPlus94Phone(forgotPhone)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {forgotOtpSending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending OTP to WhatsApp...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send OTP to WhatsApp</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: Enter & Verify WhatsApp OTP */}
            {forgotStep === 2 && (
              <form onSubmit={handleVerifyForgotOtp} className="space-y-4">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs space-y-1">
                  <span className="text-slate-400 block font-medium">OTP sent to WhatsApp Number:</span>
                  <span className="text-emerald-400 font-mono font-bold text-sm">{maskDisplayPhone(forgotPhone)}</span>
                  {forgotMatchedTeams[0] && (
                    <span className="block text-[11px] text-slate-400">
                      Club: <strong className="text-slate-200">{forgotMatchedTeams[0].team_name} ({forgotMatchedTeams[0].team_id})</strong>
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Enter 6-Digit WhatsApp OTP
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={forgotOtpCode}
                    onChange={(e) => setForgotOtpCode(e.target.value.trim())}
                    placeholder="000000"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-center text-xl font-mono tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={forgotOtpVerifying || !forgotOtpCode.trim()}
                    className="flex-1 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {forgotOtpVerifying ? 'Verifying OTP...' : 'Verify OTP'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSendForgotOtp}
                    disabled={forgotOtpSending}
                    className="px-3 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    Resend
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Enter & Confirm New Password */}
            {forgotStep === 3 && (
              <form onSubmit={handleSubmitForgotPassword} className="space-y-4">
                <div className="p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    WhatsApp OTP Verified! Enter a new password
                    {forgotSelectedTeamId ? ` for ${forgotSelectedTeamId}` : ''}.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    New Admin Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showForgotNewPassword ? 'text' : 'password'}
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                      tabIndex={-1}
                      title={showForgotNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Confirm New Admin Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showForgotConfirmPassword ? 'text' : 'password'}
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                      tabIndex={-1}
                      title={showForgotConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showForgotConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotUpdating}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {forgotUpdating ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Updating Password...</span>
                    </span>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}