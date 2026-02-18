import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

let serverOffline = false;

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 500, // Short timeout for faster fallback
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    if (serverOffline) {
      // If server is known to be offline, cancel request immediately to use mock fallback
      return Promise.reject({ message: 'Server currently offline', isOffline: true });
    }
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If request timed out or network error, mark server as offline
    if (error.code === 'ECONNABORTED' || !error.response) {
      serverOffline = true;
      console.warn('Backend server is offline. Switching to absolute Standalone Mode.');
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
