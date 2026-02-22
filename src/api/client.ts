import axios from 'axios';

// Define base URLs for different services
const SERVICES = {
  USER: import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:8081/api',
  ROOM: import.meta.env.VITE_ROOM_SERVICE_URL || 'http://localhost:8082/api',
  CONTENT: import.meta.env.VITE_CONTENT_SERVICE_URL || 'http://localhost:8083/api',
};

// Default URL for fallback/general use
const API_URL = SERVICES.ROOM;

let serverOffline = false;

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 2000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to get client for specific service
export const getServiceClient = (service: keyof typeof SERVICES) => {
  apiClient.defaults.baseURL = SERVICES[service];
  return apiClient;
};

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
