import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import { config } from '../config';
import { attemptTokenRefresh, shouldRefreshToken, TOKEN_REFRESH_CONFIG } from '../services/tokenRefresh';

const AuthContext = createContext(null);

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

function decodeJwt(jwtToken) {
  try {
    const [, payloadBase64] = jwtToken.split('.');
    const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payloadJson);
  } catch (e) {
    return null;
  }
}

function isTokenValid(jwtToken) {
  if (!jwtToken) return false;
  const payload = decodeJwt(jwtToken);
  if (!payload || !payload.exp) return false;
  const nowSeconds = Math.floor(Date.now() / 1000);
  return payload.exp > nowSeconds;
}

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem(ACCESS_TOKEN_KEY) || '');
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem(REFRESH_TOKEN_KEY) || '');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [sessionExpiredReason, setSessionExpiredReason] = useState(null);

  useEffect(() => {
    if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    else localStorage.removeItem(ACCESS_TOKEN_KEY);
  }, [accessToken]);

  useEffect(() => {
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    else localStorage.removeItem(REFRESH_TOKEN_KEY);
  }, [refreshToken]);

  const hasValidToken = useMemo(() => isTokenValid(accessToken), [accessToken]);

  const requireAuth = useCallback(() => {
    if (hasValidToken) return true;
    setIsLoginOpen(true);
    return false;
  }, [hasValidToken]);

  const saveTokens = useCallback((tokens) => {
    setAccessToken(tokens?.access_token || '');
    setRefreshToken(tokens?.refresh_token || '');
    setSessionExpiredReason(null);
  }, []);

  // Fetch current user info from backend
  const fetchMe = useCallback(async () => {
    if (!isTokenValid(accessToken)) {
      setUser(null);
      return null;
    }
    try {
      const res = await fetch(`${config.apiBaseUrl}/users/me`, {
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (!res.ok) throw new Error('Failed to load user');
      const data = await res.json();
      console.log('Fetched user:', data);
      setUser(data);
      return data;
    } catch (e) {
      setUser(null);
      return null;
    }
  }, [accessToken]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  // Listen for 401s/sign-in requirements dispatched from the API layer
  useEffect(() => {
    function onLoginRequired() {
      // Decide a best-effort reason
      const hasRefresh = !!(localStorage.getItem(REFRESH_TOKEN_KEY));
      const hasAccess = !!(localStorage.getItem(ACCESS_TOKEN_KEY));
      let reason = 'refresh_error';
      if (!hasRefresh) reason = 'refresh_token_expired';
      else if (!hasAccess) reason = 'refresh_error';
      setSessionExpiredReason(reason);
      setIsLoginOpen(true);
    }
    window.addEventListener('auth:login-required', onLoginRequired);
    return () => window.removeEventListener('auth:login-required', onLoginRequired);
  }, []);

  // Proactive token refresh loop (checks every CHECK_EXPIRY_INTERVAL_MS)
  useEffect(() => {
    if (!refreshToken) return;
    const interval = setInterval(async () => {
      try {
        const currentAccess = localStorage.getItem(ACCESS_TOKEN_KEY) || accessToken;
        if (currentAccess && shouldRefreshToken(currentAccess)) {
          const tokens = await attemptTokenRefresh(refreshToken);
          if (tokens?.access_token) setAccessToken(tokens.access_token);
          if (tokens?.refresh_token) setRefreshToken(tokens.refresh_token);
        }
      } catch (e) {
        // Refresh failed; force re-login
        setSessionExpiredReason('refresh_error');
        setIsLoginOpen(true);
      }
    }, TOKEN_REFRESH_CONFIG.CHECK_EXPIRY_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [accessToken, refreshToken]);

  const value = useMemo(() => ({
    accessToken,
    refreshToken,
    hasValidToken,
    isLoginOpen,
    setIsLoginOpen,
    requireAuth,
    saveTokens,
    user,
    refreshUser: fetchMe,
    sessionExpiredReason,
    setSessionExpiredReason,
    clear: () => {
      setAccessToken('');
      setRefreshToken('');
      setUser(null);
      setSessionExpiredReason(null);
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }), [accessToken, refreshToken, hasValidToken, isLoginOpen, requireAuth, saveTokens, user, fetchMe]);

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}


