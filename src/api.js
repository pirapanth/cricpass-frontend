import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Response interceptor for consistent error extraction
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const customMessage =
      error.response?.data?.message ||
      (error.response?.data?.errors
        ? error.response.data.errors.map((e) => e.message).join(', ')
        : null) ||
      error.message ||
      'An unexpected error occurred';
    
    return Promise.reject(new Error(customMessage));
  }
);

/**
 * 1. Search player by National Identity Card (NIC)
 * Returns player info, current team, and remaining cooling-off days
 */
export const searchPlayerByNIC = async (nic) => {
  const response = await api.get(`/players/search/${encodeURIComponent(nic.trim())}`);
  return response.data;
};

/**
 * 2. Register a new player
 */
export const registerPlayer = async (playerData) => {
  const response = await api.post('/players/register', playerData);
  return response.data;
};

/**
 * 3. Initiate transfer between teams
 */
export const initiateTransfer = async (transferData) => {
  const response = await api.post('/transfers/initiate', transferData);
  return response.data;
};

/**
 * 4. Verify dual OTPs for player transfer
 */
export const verifyTransferOTP = async (otpData) => {
  const response = await api.post('/transfers/verify-otp', otpData);
  return response.data;
};

/**
 * 5. Update team admin phone number (Two-step OTP flow)
 */
export const updateAdminPhone = async (phoneData) => {
  const response = await api.put('/teams/update-phone', phoneData);
  return response.data;
};

/**
 * 6. Get Master Admin overview (Teams, Players, Metrics)
 */
export const getAdminOverview = async () => {
  const response = await api.get('/admin/overview');
  return response.data;
};

/**
 * 7. Delete player by Mongo ID
 */
export const deletePlayer = async (id) => {
  const response = await api.delete(`/admin/players/${id}`);
  return response.data;
};

/**
 * 8. Delete team by Mongo ID or team_id
 */
export const deleteTeam = async (id) => {
  const response = await api.delete(`/admin/teams/${id}`);
  return response.data;
};

/**
 * Additional helpers for dropdowns & team operations
 */
export const getTeams = async () => {
  const response = await api.get('/teams');
  return response.data;
};

export const registerTeam = async (teamData) => {
  const response = await api.post('/teams/register', teamData);
  return response.data;
};

export const getTeamById = async (id) => {
  const response = await api.get(`/teams/${id}`);
  return response.data;
};

/**
 * 9. Master Admin Login (queries MongoDB Atlas Admin collection)
 */
export const loginMasterAdmin = async ({ username, password }) => {
  const response = await api.post('/admin/login', { username, password });
  return response.data;
};

/**
 * 10. Team Admin Login (queries MongoDB Atlas Teams collection)
 */
export const loginTeamAdmin = async ({ team_id, password, phone_number }) => {
  const response = await api.post('/teams/login', { team_id, password, phone_number });
  return response.data;
};

/**
 * 11. Send 6-digit Email OTP via Nodemailer
 */
export const sendEmailOTP = async (email, purpose = 'Verification') => {
  const response = await api.post('/otp/send-email-otp', { email, purpose });
  return response.data;
};

/**
 * 12. Verify 6-digit Email OTP
 */
export const verifyEmailOTP = async (email, code) => {
  const response = await api.post('/otp/verify-email-otp', { email, code });
  return response.data;
};

/**
 * 13. Change Team Admin Password (after OTP verification)
 */
export const changeTeamPassword = async ({ team_id, new_password }) => {
  const response = await api.put('/teams/change-password', { team_id, new_password });
  return response.data;
};

/**
 * 14. Change Team Admin Email Address (after dual OTP verification)
 */
export const changeTeamEmail = async ({ team_id, new_email, new_password }) => {
  const response = await api.put('/teams/change-email', { team_id, new_email, new_password });
  return response.data;
};

/**
 * 15. Grant Mutual Clearance (Reduces 30-day cooling-off to 14 days)
 */
export const grantMutualClearance = async (clearanceData) => {
  const response = await api.post('/transfers/grant-mutual-clearance', clearanceData);
  return response.data;
};

/**
 * 16. Submit Contact Us / Issue Report with optional attachment
 */
export const submitContactReport = async (contactData) => {
  const response = await api.post('/contact/submit', contactData);
  return response.data;
};

export const getTransfers = async (params = {}) => {
  const response = await api.get('/transfers', { params });
  return response.data;
};

export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
