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
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    const token = localStorage.getItem('auth_token');

    // Add Authorization header if token exists
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

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
    if (error.response?.status === 401) {
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
