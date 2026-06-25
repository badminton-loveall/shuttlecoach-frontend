import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, UserRole, AuthContext as AuthContextInterface } from '../types';

/* eslint-disable react-refresh/only-export-components */

/**
 * AuthContext
 * Manages global authentication state for the application
 * Provides user, role, token, login, logout, and isAuthenticated
 */

// Sample users data (imported as constant to avoid fetch issues in dev)
const USERS_DATA = [
  {
    "id": "user-001",
    "username": "head_coach",
    "password": "password123",
    "role": "HEAD_COACH",
    "name": "Rajesh Kumar",
    "email": "rajesh@shuttlecoach.com",
    "profilePhoto": null,
    "specialization": null,
    "createdAt": "2026-01-01T08:00:00Z",
    "lastActive": "2026-01-15T10:30:00Z"
  },
  {
    "id": "user-002",
    "username": "assistant_coach1",
    "password": "password123",
    "role": "ASSISTANT_COACH",
    "name": "Priya Sharma",
    "email": "priya@shuttlecoach.com",
    "profilePhoto": null,
    "specialization": "Doubles Training",
    "createdAt": "2026-01-02T08:00:00Z",
    "lastActive": "2026-01-14T14:20:00Z"
  },
  {
    "id": "user-003",
    "username": "assistant_coach2",
    "password": "password123",
    "role": "ASSISTANT_COACH",
    "name": "Vikram Singh",
    "email": "vikram@shuttlecoach.com",
    "profilePhoto": null,
    "specialization": "Footwork & Movement",
    "createdAt": "2026-01-03T08:00:00Z",
    "lastActive": "2026-01-13T09:15:00Z"
  },
  {
    "id": "user-004",
    "username": "student1",
    "password": "password123",
    "role": "STUDENT",
    "name": "Aarav Patel",
    "email": "aarav.patel@student.com",
    "profilePhoto": null,
    "specialization": null,
    "createdAt": "2026-01-05T08:00:00Z",
    "lastActive": "2026-01-15T16:45:00Z"
  },
  {
    "id": "user-005",
    "username": "student2",
    "password": "password123",
    "role": "STUDENT",
    "name": "Divya Gupta",
    "email": "divya.gupta@student.com",
    "profilePhoto": null,
    "specialization": null,
    "createdAt": "2026-01-06T08:00:00Z",
    "lastActive": "2026-01-12T11:20:00Z"
  }
] as const;

interface UserData {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  name: string;
  email?: string | null;
  profilePhoto?: string | null;
  specialization?: string | null;
  createdAt: string;
  lastActive: string;
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
   * Login function - authenticates user against users.json
   * @param username - User's username
   * @param password - User's password (plain text for JSON phase)
   */
  const login = async (username: string, password: string): Promise<void> => {
    try {
      // Type cast users data
      const users = USERS_DATA as unknown as UserData[];

      // Find user by username
      const foundUser = users.find((u) => u.username === username);

      // Validate credentials
      if (!foundUser || foundUser.password !== password) {
        throw new Error('Invalid username or password');
      }

      // Create token (simple JWT-like token for Phase 1)
      const generatedToken = `${foundUser.id}:${Date.now()}`;

      // Create user object without password
      const userWithoutPassword: User = {
        id: foundUser.id,
        username: foundUser.username,
        role: foundUser.role,
        name: foundUser.name,
        email: foundUser.email,
        profilePhoto: foundUser.profilePhoto,
        specialization: foundUser.specialization,
        createdAt: new Date(foundUser.createdAt),
        lastActive: new Date(foundUser.lastActive),
      };

      // Store in state and localStorage
      setUser(userWithoutPassword);
      setRole(foundUser.role);
      setToken(generatedToken);

      // Persist to localStorage
      localStorage.setItem('auth_token', generatedToken);
      localStorage.setItem('auth_user', JSON.stringify(userWithoutPassword));
      localStorage.setItem('auth_role', foundUser.role);
    } catch (error) {
      console.error('Login error:', error);
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
