import axios from 'axios';
import { optimizeImageForUpload } from './utils/imageUtils';

// Sanitize base URL: checks VITE_API_BASE_URL, VITE_API_URL, REACT_APP_API_BASE_URL, or local/prod defaults
const defaultBaseUrl = import.meta.env.DEV
  ? 'http://localhost:5000/api'
  : 'https://cricpass-backend.onrender.com/api';

const envBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  (typeof process !== 'undefined' && process.env?.REACT_APP_API_BASE_URL) ||
  defaultBaseUrl ||
  'http://localhost:10000/api';

const rawBaseUrl = String(envBaseUrl).trim().replace(/\/+$/, '');
const API_BASE_URL = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`;

console.log('[API Config] Initialized Axios client:', {
  mode: import.meta.env.MODE,
  viteApiUrl: import.meta.env.VITE_API_URL || '(not set)',
  resolvedBaseUrl: API_BASE_URL,
});

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30-second timeout to handle Render cold-start spins and OTP delays
});

// Request interceptor for full URL & payload debug logging
api.interceptors.request.use(
  (config) => {
    const fullUrl = `${config.baseURL || ''}${config.url || ''}`;
    console.log(
      `[API Request] ${String(config.method || 'GET').toUpperCase()} ${fullUrl}`,
      config.data !== undefined ? { payload: config.data } : ''
    );
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor for consistent error extraction and debug visibility
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API Response Error]', {
      url: `${error.config?.baseURL || ''}${error.config?.url || ''}`,
      status: error.response?.status,
      code: error.code,
      data: error.response?.data,
      message: error.message,
    });

    const customMessage =
      error.response?.data?.message ||
      (error.response?.data?.errors
        ? error.response.data.errors.map((e) => e.message).join(', ')
        : null) ||
      error.message ||
      'An unexpected error occurred';

    const normalizedError = new Error(customMessage);
    normalizedError.status = error.response?.status;
    normalizedError.code = error.code;
    normalizedError.response = error.response;
    normalizedError.isCanceled =
      axios.isCancel(error) ||
      error.code === 'ERR_CANCELED' ||
      error.name === 'CanceledError';

    return Promise.reject(normalizedError);
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
  const response = await api.post('/players/register', playerData, { timeout: 60000 });
  return response.data;
};

/**
 * 2b. Bulk register multiple players
 */
export const bulkRegisterPlayers = async ({ players, admin_phone }) => {
  const response = await api.post('/players/bulk-register', {
    players,
    admin_phone
  }, { timeout: 60000 });
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

const isRetryableTeamsError = (error) => {
  if (!error) return false;
  if (
    error.isCanceled ||
    error.name === 'CanceledError' ||
    error.name === 'AbortError' ||
    error.code === 'ERR_CANCELED'
  ) {
    return false;
  }
  const status = error.status ?? error.response?.status;
  if (!status) return true; // Network timeout, DNS, or server still booting
  return status >= 500 || status === 408 || status === 429;
};

/**
 * Additional helpers for dropdowns & team operations
 */
export const getTeams = async (config = {}) => {
  const response = await api.get('/teams', config);
  const payload = response?.data;
  const safeTeams = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload)
      ? payload
      : [];

  return {
    ...(payload && typeof payload === 'object' ? payload : { success: true }),
    data: safeTeams,
  };
};

/**
 * Fetch teams with automatic retries and progressive status callbacks
 * to handle Render free-tier cold starts (15-35s wake-up latency).
 */
export const getTeamsWithRetry = async ({
  maxAttempts = 4,
  baseDelayMs = 2000,
  timeoutMs = 35000,
  signal,
  onStatusChange,
} = {}) => {
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (signal?.aborted) {
      const abortErr = new Error('Request aborted');
      abortErr.name = 'AbortError';
      abortErr.isCanceled = true;
      throw abortErr;
    }

    if (onStatusChange) {
      onStatusChange({
        attempt,
        maxAttempts,
        phase: attempt === 1 ? 'initial' : 'retrying',
        message:
          attempt === 1
            ? 'Loading teams from server...'
            : `Waking up server / Loading teams... (Attempt ${attempt} of ${maxAttempts})`,
      });
    }

    try {
      const result = await getTeams({ timeout: timeoutMs, signal });
      return {
        ...result,
        data: Array.isArray(result?.data) ? result.data : [],
      };
    } catch (error) {
      lastError = error;

      if (!isRetryableTeamsError(error) || attempt >= maxAttempts || signal?.aborted) {
        throw error;
      }

      const waitMs = Math.min(baseDelayMs * attempt, 6000);
      if (onStatusChange) {
        onStatusChange({
          attempt,
          maxAttempts,
          phase: 'waiting',
          message: `Server is waking up from sleep... Retrying in ${Math.round(waitMs / 1000)}s (Attempt ${attempt + 1} of ${maxAttempts})`,
        });
      }

      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, waitMs);
        if (signal) {
          const onAbort = () => {
            clearTimeout(timer);
            const abortErr = new Error('Request aborted');
            abortErr.name = 'AbortError';
            abortErr.isCanceled = true;
            reject(abortErr);
          };
          if (signal.aborted) {
            onAbort();
            return;
          }
          signal.addEventListener('abort', onAbort, { once: true });
        }
      });
    }
  }

  throw lastError || new Error('Unable to load registered teams.');
};

export const registerTeam = async (teamData) => {
  const response = await api.post('/teams/register', teamData, { timeout: 60000 });
  return response.data;
};

export const verifyTeamOtp = async ({ verifyToken, otp }) => {
  const response = await api.post('/teams/verify-otp', { verifyToken, otp }, { timeout: 60000 });
  return response.data;
};

export const completeTeamRegistration = async ({ verifyToken, password, confirmPassword }) => {
  const response = await api.post(
    '/teams/complete-registration',
    { verifyToken, password, confirmPassword },
    { timeout: 60000 }
  );
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
 * 11. Send 6-digit WhatsApp OTP
 */
export const sendWhatsAppOTP = async (phone, purpose = 'Verification') => {
  const payload = { phone, purpose };
  const targetUrl = `${API_BASE_URL}/otp/send-whatsapp-otp`;
  console.log('[OTP Dispatch] Calling POST send-whatsapp-otp:', {
    url: targetUrl,
    payload,
  });

  try {
    const response = await api.post('/otp/send-whatsapp-otp', payload);
    console.log('[OTP Dispatch] send-whatsapp-otp succeeded:', {
      status: response.status,
      data: response.data,
    });
    return response.data;
  } catch (error) {
    console.error('[OTP Dispatch] send-whatsapp-otp failed:', {
      url: targetUrl,
      message: error.message,
    });
    throw error;
  }
};

/**
 * 12. Verify 6-digit WhatsApp OTP
 */
export const verifyWhatsAppOTP = async (phone, code) => {
  const payload = { phone, code };
  const targetUrl = `${API_BASE_URL}/otp/verify-whatsapp-otp`;
  console.log('[OTP Dispatch] Calling POST verify-whatsapp-otp:', {
    url: targetUrl,
    payload: { phone, code: code ? '***' : code },
  });

  try {
    const response = await api.post('/otp/verify-whatsapp-otp', payload);
    console.log('[OTP Dispatch] verify-whatsapp-otp succeeded:', {
      status: response.status,
      data: response.data,
    });
    return response.data;
  } catch (error) {
    console.error('[OTP Dispatch] verify-whatsapp-otp failed:', {
      url: targetUrl,
      message: error.message,
    });
    throw error;
  }
};

// Legacy aliases for backward compatibility
export const sendEmailOTP = sendWhatsAppOTP;
export const verifyEmailOTP = verifyWhatsAppOTP;

/**
 * 13. Change Team Admin Password (after OTP verification)
 */
export const changeTeamPassword = async ({ team_id, phone_number, new_password }) => {
  const response = await api.put('/teams/change-password', { team_id, phone_number, new_password });
  return response.data;
};

/**
 * 13b. Lookup team(s) registered with an admin WhatsApp number
 */
export const lookupTeamsByPhone = async (phone_number) => {
  const response = await api.post('/teams/lookup-by-phone', { phone_number });
  return response.data;
};

/**
 * 13c. Initiate new phone verification for Team Admin
 */
export const initiatePhoneChange = async ({ team_id, new_phone }) => {
  const response = await api.post('/teams/initiate-phone-change', { team_id, new_phone });
  return response.data;
};

/**
 * 14. Change Team Admin WhatsApp / Email Address (after dual OTP verification)
 */
export const changeTeamEmail = async ({ team_id, new_email, new_phone, new_password, verifyToken }) => {
  const response = await api.put('/teams/change-email', { team_id, new_email, new_phone, new_password, verifyToken });
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
 * 15b. Cancel a pending transfer session and restore player status to ACTIVE
 */
export const cancelTransfer = async (cancelData) => {
  const response = await api.post('/transfers/cancel', cancelData);
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

/**
 * 17. Upload File / Attachment to Google Drive
 * Automatically compresses heavy client images to prevent 30000ms timeouts,
 * sets a generous 120-second timeout, and retries on cold-start timeouts.
 */
export const uploadAttachment = async (file, teamId = 'General', { retries = 1 } = {}) => {
  // 1. Optimize image in the browser if it's a large photo
  let uploadFile = file;
  try {
    uploadFile = await optimizeImageForUpload(file);
  } catch (optErr) {
    console.warn('[uploadAttachment] Image optimization skipped:', optErr);
  }

  const formData = new FormData();
  formData.append('file', uploadFile);
  if (teamId) {
    formData.append('teamId', teamId);
  }

  let attempt = 0;
  while (attempt <= retries) {
    try {
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 120 seconds (2 minutes) to prevent 30000ms timeout
      });
      return response.data;
    } catch (err) {
      const isTimeout =
        err.code === 'ECONNABORTED' ||
        (typeof err.message === 'string' && err.message.toLowerCase().includes('timeout'));
      const isNetworkErr = !err.response && !err.status;

      if ((isTimeout || isNetworkErr) && attempt < retries) {
        attempt++;
        console.warn(`[uploadAttachment] Upload timed out/network glitch on attempt ${attempt}. Retrying in 2s...`);
        await new Promise((res) => setTimeout(res, 2000));
        continue;
      }

      if (isTimeout) {
        const timeoutError = new Error(
          'Upload request timed out. The server or cloud storage is taking longer than expected. Please try again.'
        );
        timeoutError.originalError = err;
        throw timeoutError;
      }
      throw err;
    }
  }
};

export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
