/**
 * API Client for ShuttleCoach Backend
 * Configures axios with base URL, request/response interceptors
 * Requirements: 30.1, 30.2, 30.8, 30.9
 *
 * Features:
 * - Automatic JWT token injection in Authorization header
 * - 401 error handling (auto-logout and redirect to login)
 * - Base URL configuration from environment variable
 */

import axios from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Get API base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Create axios instance with base configuration
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

/**
 * Request Interceptor
 * Adds JWT token from localStorage to Authorization header
 * Adds X-Center-Id header from localStorage for center-scoped API requests
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    const token = localStorage.getItem('auth_token');

    // Add Authorization header if token exists
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add X-Center-Id header for multi-center scoping
    const centerId = localStorage.getItem('active_center_id');
    if (centerId && config.headers) {
      config.headers['X-Center-Id'] = centerId;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Requests whose own 401 means "this attempt was rejected" (wrong
 * credentials, expired reset token, ...), not "your existing session
 * expired" — the auto-logout-and-redirect below must not fire for these,
 * or a failed login attempt forces a hard reload of /login before the
 * page's own error state ever gets a chance to render, which reads to the
 * user as the form silently resetting with no error message at all.
 */
const AUTH_ENDPOINTS_EXEMPT_FROM_AUTO_LOGOUT = [
  '/auth/login',
  '/auth/forgot-password',
  '/auth/reset-password',
];

/**
 * Response Interceptor
 * Handles 401 Unauthorized errors by logging out and redirecting to login
 */
apiClient.interceptors.response.use(
  (response) => {
    // Pass through successful responses
    return response;
  },
  (error: AxiosError) => {
    // Handle 401 Unauthorized errors
    const requestUrl = error.config?.url ?? '';
    const isExemptAuthRequest = AUTH_ENDPOINTS_EXEMPT_FROM_AUTO_LOGOUT.some((path) =>
      requestUrl.includes(path)
    );

    if (error.response?.status === 401 && !isExemptAuthRequest) {
      // Clear authentication state
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_role');

      // Redirect to login page
      // Use window.location to force full page reload and trigger auth context reset
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default apiClient;
