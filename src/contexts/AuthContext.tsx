import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, UserRole, AuthContext as AuthContextInterface } from '../types';
import apiClient from '../utils/apiClient';

/* eslint-disable react-refresh/only-export-components */

/**
 * AuthContext
 * Manages global authentication state for the application
 * Provides user, role, token, login, logout, and isAuthenticated
 * Requirements: 30.1, 30.2, 30.8, 30.9
 */

interface LoginResponse {
  token: string;
  user: User;
  role: UserRole;
}

// Create the Auth Context
export const AuthContext = createContext<AuthContextInterface | undefined>(undefined);

/**
 * AuthProvider component
 * Wraps the application and provides authentication context
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    const storedRole = localStorage.getItem('auth_role');

    if (storedToken && storedUser && storedRole) {
      try {
        // Create a local state object to batch updates
        const parsedUser = JSON.parse(storedUser) as User;
        const parsedRole = storedRole as UserRole;
        
        // Batch the state updates
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(parsedUser);
        setRole(parsedRole);
        setToken(storedToken);
      } catch (error) {
        console.error('Failed to restore auth state from localStorage:', error);
        // Clear invalid stored data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_role');
      }
    }

    setIsLoading(false);
  }, []);

  /**
   * Login function - authenticates user against API
   * @param username - User's username
   * @param password - User's password
   */
  const login = async (username: string, password: string): Promise<void> => {
    try {
      // Call API login endpoint
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        username,
        password,
      });

      const { token, user: userData, role: userRole } = response.data;

      // Parse date strings from API response
      const userWithParsedDates: User = {
        ...userData,
        createdAt: new Date(userData.createdAt),
        lastActive: new Date(userData.lastActive),
      };

      // Persist to localStorage FIRST (before state updates)
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(userWithParsedDates));
      localStorage.setItem('auth_role', userRole);

      // Store in state (will trigger re-renders)
      // The order matters: token, user, then role so isAuthenticated resolves properly
      setToken(token);
      setUser(userWithParsedDates);
      setRole(userRole);
    } catch (error) {
      console.error('Login error:', error);
      // Re-throw the error so UI can display it
      throw error;
    }
  };

  /**
   * Logout function - clears authentication state
   */
  const logout = (): void => {
    // Clear state
    setUser(null);
    setRole(null);
    setToken(null);

    // Clear localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_role');
  };

  const isAuthenticated = !!user && !!token && !!role;

  const value: AuthContextInterface = {
    user,
    role,
    token,
    isAuthenticated,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{!isLoading && children}</AuthContext.Provider>;
};

/**
 * useAuth hook
 * Custom hook to access authentication context throughout the application
 * Must be used within AuthProvider
 */
export const useAuth = (): AuthContextInterface => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
