import axios from 'axios';
import { parseJwt } from '../utils/auth';

// Define base URLs for different services
const SERVICES = {
  USER: import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:8081/api',
  ROOM: import.meta.env.VITE_ROOM_SERVICE_URL || 'http://localhost:8082/api',
  CONTENT: import.meta.env.VITE_CONTENT_SERVICE_URL || 'http://localhost:8083/api',
  INTERACTION: import.meta.env.VITE_INTERACTION_SERVICE_URL || 'http://localhost:8084/api/interactions',
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
