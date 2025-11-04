import axios from 'axios';
import { config } from '../config';
import { attemptTokenRefresh, isTokenValid } from './tokenRefresh';

const api = axios.create({ baseURL: config.apiBaseUrl });

let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = (token) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (cb) => {
  refreshSubscribers.push(cb);
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers = config.headers || {};
  config.headers.accept = 'application/json';
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error?.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const newTokens = await attemptTokenRefresh(refreshToken);
        localStorage.setItem('access_token', newTokens.access_token);
        localStorage.setItem('refresh_token', newTokens.refresh_token);

        api.defaults.headers.common.Authorization = `Bearer ${newTokens.access_token}`;
        originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`;

        onRefreshed(newTokens.access_token);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        window.dispatchEvent(new CustomEvent('auth:login-required'));
        return Promise.reject(refreshError);
      }
    }

    if (error?.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:login-required'));
    }

    return Promise.reject(error);
  }
);

// ---- Auth helpers ----
function base64UrlDecode(input) {
  try {
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

export function decodeJwt(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  return base64UrlDecode(parts[1]);
}

export function getCurrentAccessToken() {
  return localStorage.getItem('access_token') || '';
}

export function getUserRoleFromToken() {
  const token = getCurrentAccessToken();
  const payload = decodeJwt(token);
  if (!payload) return null;
  // Try common claim names
  if (typeof payload.role !== 'undefined') return payload.role;
  if (typeof payload.roles !== 'undefined') return payload.roles;
  if (typeof payload.user_role !== 'undefined') return payload.user_role;
  return null;
}

export function isAdminUser() {
  const role = getUserRoleFromToken();
  // Accept role "1" as number or string, or arrays containing 1
  if (Array.isArray(role)) return role.includes(1) || role.includes('1');
  return role === 1 || role === '1';
}



export const fetchVMData = async (dateFilter = null) => {
  try {
    let url = '/status';
    if (dateFilter) {
      let dateString = String(dateFilter).trim();
      if (dateFilter instanceof Date) {
        dateString = dateFilter.toISOString().split('T')[0];
      } else if (typeof dateFilter === 'object') {
        console.warn('Invalid dateFilter object received:', dateFilter);
        dateString = null;
      }
      if (dateString && dateString !== 'null' && dateString !== '[object Object]') {
        url = `/status/?date_filter=${encodeURIComponent(dateString)}`;
      }
    }
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching VM data:', error);
    throw error;
  }
};

export const fetchVMMasterData = async () => {
  try {
    const response = await api.get('/vm');
    return response.data;
  } catch (error) {
    console.error('Error fetching VM master data:', error);
    throw error;
  }
};

export const createVM = async (vmData) => {
  try {
    const response = await api.post('/vm', vmData);
    return response.data;
  } catch (error) {
    console.error('Error creating VM:', error);
    throw error;
  }
};

export const updateVM = async (vmId, vmData) => {
  try {
    const response = await api.put(`/vm/${vmId}`, vmData);
    return response.data;
  } catch (error) {
    console.error('Error updating VM:', error);
    throw error;
  }
};

export const deleteVM = async (vmId) => {
  try {
    const response = await api.delete(`/vm/${vmId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting VM:', error);
    throw error;
  }
};

export const fetchRealtimePingStatus = async () => {
  try {
    const response = await api.get('/monitor/ping');
    return response.data;
  } catch (error) {
    console.error('Error fetching real-time ping status:', error);
    throw error;
  }
};

export const checkPingStatus = async (ip) => {
  try {
    const response = await api.post('/monitor/ping_status', { ip });
    return response.data;
  } catch (error) {
    console.error('Error checking ping status:', error);
    throw error;
  }
};

// ---- Users ----
export const createUser = async (user) => {
  // Guard on client: enforce admin role
  if (!isAdminUser()) {
    const error = new Error('Forbidden: Admin role required');
    error.code = 'FORBIDDEN';
    throw error;
  }
  try {
    const response = await api.post('/users/create', user);
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// ---- Log Management ----
export const uploadLog = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/logs/upload', formData);
    return response.data;
  } catch (error) {
    console.error('Error uploading log:', error);
    throw error;
  }
};

export const getLogsPath = async () => {
  try {
    const response = await api.get('/logs/path');
    return response.data;
  } catch (error) {
    console.error('Error fetching logs path:', error);
    throw error;
  }
};

export const getLogsList = async () => {
  try {
    const response = await api.get('/logs/list');
    return response.data;
  } catch (error) {
    console.error('Error fetching logs list:', error);
    throw error;
  }
};

export const downloadLog = async (filename) => {
  try {
    const response = await api.get(`/logs/download/${filename}`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Error downloading log:', error);
    throw error;
  }
};


export default api;