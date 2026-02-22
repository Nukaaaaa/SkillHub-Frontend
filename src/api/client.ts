import axios from 'axios';

// Define base URLs for different services
const SERVICES = {
  USER: import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:8081/api',
  ROOM: import.meta.env.VITE_ROOM_SERVICE_URL || 'http://localhost:8082/api',
  CONTENT: import.meta.env.VITE_CONTENT_SERVICE_URL || 'http://localhost:8083/api',
};

// Default URL for fallback/general use
const API_URL = SERVICES.ROOM;

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to get client for specific service
export const getServiceClient = (service: keyof typeof SERVICES) => {
  const instance = axios.create({
    baseURL: SERVICES[service],
    timeout: 5000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Apply common request interceptor
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Apply common response interceptor
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        // Avoid redirect loop if we're already on login/register
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// Global interceptors are now handled per-instance in getServiceClient
