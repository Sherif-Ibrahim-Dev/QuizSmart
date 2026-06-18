import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import authService from '../services/authService';
import { tokenStore } from '../services/tokenStore';

// ── Context definition ─────────────────────────────────────────────────────────
const AuthContext = createContext(null);

/**
 * AuthProvider — wrap the app tree with this component.
 *
 * Auth state shape:
 *   user        : { userId, fullName, role } | null  — persisted in localStorage
 *   accessToken : string | null                       — in-memory only, never localStorage
 *   isLoading   : boolean                             — true while silent refresh is in flight on mount
 *
 * Behaviour:
 *   • On mount  → calls POST /auth/refresh (the HttpOnly cookie is sent automatically).
 *                 Success → restores the session silently.
 *                 Failure → user is unauthenticated (cookie absent or expired).
 *   • login()   → full credential login, sets accessToken + user info.
 *   • logout()  → revokes cookie on server, clears all local state.
 *
 * Listens for the 'auth:logout' custom event dispatched by the Axios
 * interceptor when a refresh call fails mid-session (expired or reuse-attack).
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Bootstrap identity from localStorage (no token — just userId/fullName/role)
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);

  // ── Silent refresh on mount ──────────────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true;

    const restoreSession = async () => {
      try {
        const { accessToken } = await authService.silentRefresh();
        if (!isMounted.current) return;

        tokenStore.set(accessToken);

        // Restore user identity from localStorage (set during a previous login)
        const storedUser = authService.getCurrentUser();
        if (storedUser) setUser(storedUser);
      } catch {
        // No valid cookie or refresh failed — user must log in manually
        if (!isMounted.current) return;
        tokenStore.clear();
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        if (isMounted.current) setIsLoading(false);
      }
    };

    restoreSession();

    return () => { isMounted.current = false; };
  }, []);

  // ── Listen for forced-logout events from the Axios interceptor ───────────────
  useEffect(() => {
    const handleForceLogout = () => {
      tokenStore.clear();
      localStorage.removeItem('user');
      setUser(null);
      // Redirect to login without using React Router (we're outside the Router tree)
      window.location.href = '/login';
    };

    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, []);

  // ── login ────────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password);
    // authService.login() already stores token + user info
    const storedUser = authService.getCurrentUser();
    setUser(storedUser);
    return data;
  }, []);

  // ── logout ───────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const value = {
    user,          // { userId, fullName, role } | null
    isLoading,     // true only during the initial silent-refresh on mount
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ── Hook ───────────────────────────────────────────────────────────────────────
/**
 * useAuth — access the auth context from any component.
 * Must be used inside <AuthProvider>.
 */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>');
  return ctx;
};
