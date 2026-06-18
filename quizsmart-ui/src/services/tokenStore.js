/**
 * tokenStore — in-memory access-token singleton.
 *
 * The access token must NEVER be written to localStorage (XSS risk).
 * It lives only in memory. This module bridges:
 *   • AuthContext  (React component tree) — calls set() / clear()
 *   • apiClient.js (Axios interceptor)     — calls get()
 *
 * Because this is a plain JS module it survives re-renders but is
 * reset to null on a hard page refresh — AuthContext handles the
 * silent /auth/refresh on mount to restore it.
 */

let _token = null;

export const tokenStore = {
  /** Returns the current access token, or null if not authenticated. */
  get: () => _token,

  /** Store a new access token (called after login or successful refresh). */
  set: (token) => { _token = token; },

  /** Clear the access token (called on logout or failed refresh). */
  clear: () => { _token = null; },
};
