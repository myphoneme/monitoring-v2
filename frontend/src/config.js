const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  console.warn('VITE_API_BASE_URL is not defined in environment variables. Using fallback.');
}

export const config = {
  apiBaseUrl: API_BASE_URL || 'http://127.0.0.1:8000'
};
