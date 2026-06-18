import apiClient, { API_BASE_URL } from './apiClient';
import { tokenStore } from './tokenStore';
import axios from 'axios';

// ── Login ──────────────────────────────────────────────────────────────────────
/**
 * Authenticates the user.
 * • Server sets the HttpOnly refresh-token cookie automatically.
 * • We receive the short-lived accessToken in the JSON body.
 * • We store user identity info (NOT the token) in localStorage for page-refresh persistence.
 * • The access token is stored only in the tokenStore (in-memory).
 */
const login = async (email, password) => {
  try {
    const response = await apiClient.post('/auth/login', { email, password });
    const { accessToken, userId, fullName, role } = response.data;

    // Store access token in memory only
    tokenStore.set(accessToken);

    // Store non-sensitive identity info in localStorage for page-refresh restore
    localStorage.setItem('user', JSON.stringify({ userId, fullName, role }));

    return response.data;
  } catch (error) {
    const message = error.response?.data || 'An unexpected error occurred.';
    throw typeof message === 'object' ? JSON.stringify(message) : message;
  }
};

// ── Logout ─────────────────────────────────────────────────────────────────────
/**
 * Revokes the current device's refresh token on the server, then clears local state.
 */
const logout = async () => {
  try {
    // Tell the server to revoke the HttpOnly cookie (fire-and-forget)
    await apiClient.post('/auth/logout');
  } catch {
    // Ignore — we still clear local state even if the server call fails
  } finally {
    tokenStore.clear();
    localStorage.removeItem('user');
  }
};

// ── Silent refresh ─────────────────────────────────────────────────────────────
/**
 * Attempts to silently renew the access token using the HttpOnly cookie.
 * Called by AuthContext on mount to restore sessions after hard refresh.
 * Returns { accessToken, expiresAt } on success, or throws on failure.
 */
const silentRefresh = async () => {
  const response = await axios.post(
    `${API_BASE_URL}/auth/refresh`,
    {},
    { withCredentials: true }
  );
  return response.data; // { accessToken, expiresAt }
};

// ── Register ───────────────────────────────────────────────────────────────────
const register = async (userData) => {
  try {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message || error.response?.data || 'Registration failed.';
    throw typeof message === 'object' ? JSON.stringify(message) : message;
  }
};

// ── Email verification ─────────────────────────────────────────────────────────
const verifyEmail = async (email, code) => {
  try {
    const response = await apiClient.post('/auth/verify-email', { email, code });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message || error.response?.data || 'Verification failed.';
    throw typeof message === 'object' ? JSON.stringify(message) : message;
  }
};

// ── Forgot password ────────────────────────────────────────────────────────────
const forgotPassword = async (email) => {
  try {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    const message = error.response?.data || 'Failed to send reset code.';
    throw typeof message === 'object' ? JSON.stringify(message) : message;
  }
};

// ── Verify reset code ──────────────────────────────────────────────────────────
const verifyResetCode = async (email, code) => {
  try {
    const response = await apiClient.post('/auth/verify-reset-code', { email, code });
    return response.data;
  } catch (error) {
    const message = error.response?.data || 'Invalid reset code.';
    throw typeof message === 'object' ? JSON.stringify(message) : message;
  }
};

// ── Reset password ─────────────────────────────────────────────────────────────
const resetPassword = async (email, code, newPassword) => {
  try {
    const response = await apiClient.post('/auth/reset-password', { email, code, newPassword });
    return response.data;
  } catch (error) {
    const message = error.response?.data || 'Failed to reset password.';
    throw typeof message === 'object' ? JSON.stringify(message) : message;
  }
};

// ── Get current user (from localStorage — identity only, no token) ─────────────
const getCurrentUser = () => {
  const userData = localStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
};

export default {
  login,
  logout,
  silentRefresh,
  register,
  verifyEmail,
  getCurrentUser,
  forgotPassword,
  verifyResetCode,
  resetPassword,
};
