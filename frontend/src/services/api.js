import axios from 'axios';

// Axios instance with auth header injection
const api = axios.create({ baseURL: 'http://10.0.5.22:8000' });

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
  (error) => {
    if (error?.response?.status === 401) {
      // Notify app to open login modal
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



export const fetchVMData = async () => {
  try {
    const response = await api.get('/status');
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

export default api;
