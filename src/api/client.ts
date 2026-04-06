import axios from 'axios';
import { parseJwt } from '../utils/auth';

// Define the base URL for the API Gateway
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to get client for specific service
export const getServiceClient = (service: 'USER' | 'ROOM' | 'CONTENT' | 'INTERACTION') => {
  const instance = axios.create({
    baseURL: service === 'INTERACTION' ? `${API_URL}/interactions` : API_URL,
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

        // Emulate API Gateway behavior ONLY for ContentService
        // Other services might reject these headers due to CORS policies
        if (service === 'CONTENT') {
          const payload = parseJwt(token);
          if (payload) {
            const userId = payload.sub || payload.id || payload.userId || payload.user_id;
            if (userId) config.headers['X-User-Id'] = userId;

            // Spring Security expects roles to have the 'ROLE_' prefix if checked via hasRole()
            const rawRole = payload.role || payload.roles || payload.authorities || 'USER';
            if (rawRole) {
              let roleStr = Array.isArray(rawRole) ? rawRole.join(',') : String(rawRole);
              if (!roleStr.startsWith('ROLE_')) {
                roleStr = roleStr.split(',').map(r => r.trim().startsWith('ROLE_') ? r : `ROLE_${r}`).join(',');
              }
              config.headers['X-User-Roles'] = roleStr;
            }
          }
        }
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
