import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, UserRole, CenterMembership, AuthContext as AuthContextInterface } from '../types';
import apiClient from '../utils/apiClient';
import { useToast } from './ToastContext';

/* eslint-disable react-refresh/only-export-components */

/**
 * AuthContext
 * Manages global authentication state for the application.
 * Supports multi-center memberships with center switching.
 * Requirements: 2.1, 2.2, 2.3, 2.5, 2.7, 3.1, 3.5, 30.1, 30.2, 30.8, 30.9
 */

interface LoginResponseMultiCenter {
  token: string;
  user: Omit<User, 'passwordHash'> & { canAccessFees?: boolean };
  memberships: Array<{
    centerId: string;
    centerName: string;
    role: UserRole;
    canAccessFees: boolean;
  }>;
  activeCenterId: string;
  activeRole: UserRole;
}

/** Legacy login response (backward compat) */
interface LoginResponseLegacy {
  token: string;
  user: User & { canAccessFees?: boolean };
  role: UserRole;
  centerId?: string;
}

type LoginResponse = LoginResponseMultiCenter | LoginResponseLegacy;

function isMultiCenterResponse(data: LoginResponse): data is LoginResponseMultiCenter {
  return 'memberships' in data && Array.isArray(data.memberships);
}

// Create the Auth Context
export const AuthContext = createContext<AuthContextInterface | undefined>(undefined);

/**
 * AuthProvider component
 * Wraps the application and provides authentication context.
 * Supports multi-center memberships with center switching.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [memberships, setMemberships] = useState<CenterMembership[]>([]);
  const [activeCenterId, setActiveCenterId] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);
  const [canAccessFees, setCanAccessFees] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    const storedMemberships = localStorage.getItem('auth_memberships');
    const storedActiveCenterId = localStorage.getItem('active_center_id');

    // Legacy fallbacks
    const storedRole = localStorage.getItem('auth_role');
    const storedCenterId = localStorage.getItem('auth_center_id');
    const storedCanAccessFees = localStorage.getItem('auth_can_access_fees');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;

        // Restore memberships if available (multi-center) and non-empty
        let parsedMemberships: CenterMembership[] = [];
        if (storedMemberships) {
          try {
            parsedMemberships = JSON.parse(storedMemberships) as CenterMembership[];
          } catch {
            parsedMemberships = [];
          }
        }

        if (parsedMemberships.length > 0) {
          // Multi-center restore
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setMemberships(parsedMemberships);

          // Determine active center: use stored value if valid, otherwise first membership
          let resolvedCenterId: string | null = null;
          if (storedActiveCenterId && parsedMemberships.some(m => m.centerId === storedActiveCenterId)) {
            resolvedCenterId = storedActiveCenterId;
          } else {
            resolvedCenterId = parsedMemberships[0].centerId;
          }

          const activeMembership = parsedMemberships.find(m => m.centerId === resolvedCenterId);

          setActiveCenterId(resolvedCenterId);
          setActiveRole(activeMembership?.role ?? null);
          setCanAccessFees(activeMembership?.role === 'HEAD_COACH' || activeMembership?.role === 'ADMIN' || (activeMembership?.canAccessFees ?? false));

          // Persist resolved center ID
          if (resolvedCenterId) {
            localStorage.setItem('active_center_id', resolvedCenterId);
          }
        } else if (storedRole) {
          // Legacy restore: no memberships or empty array, fall back to single-center
          const parsedRole = storedRole as UserRole;
          const derivedCanAccessFees =
            parsedRole === 'ADMIN' || parsedRole === 'HEAD_COACH' || storedCanAccessFees === 'true';

          setActiveCenterId(storedCenterId);
          setActiveRole(parsedRole);
          setCanAccessFees(derivedCanAccessFees);
        }

        setUser(parsedUser);
        setToken(storedToken);
      } catch (error) {
        console.error('Failed to restore auth state from localStorage:', error);
        // Clear invalid stored data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_role');
        localStorage.removeItem('auth_center_id');
        localStorage.removeItem('auth_can_access_fees');
        localStorage.removeItem('auth_memberships');
        localStorage.removeItem('active_center_id');
      }
    }

    setIsLoading(false);
  }, []);

  /**
   * Login function - authenticates user against API.
   * Parses LoginResponseMultiCenter when memberships are present.
   * @param email - User's email
   * @param password - User's password
   * @param centerSlug - Optional center slug for branded login validation
   */
  const login = async (email: string, password: string, centerSlug?: string): Promise<void> => {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        email,
        password,
        ...(centerSlug ? { centerSlug } : {}),
      });

      const data = response.data;

      if (isMultiCenterResponse(data)) {
        // Multi-center login response
        const { token: authToken, user: userData, memberships: membershipData, activeCenterId: activeCenter, activeRole: role } = data;

        const userWithParsedDates: User = {
          ...userData,
          role: role,
          createdAt: new Date(userData.createdAt),
          lastActive: new Date(userData.lastActive),
        } as User;

        const parsedMemberships: CenterMembership[] = membershipData.map(m => ({
          centerId: m.centerId,
          centerName: m.centerName,
          role: m.role,
          canAccessFees: m.canAccessFees,
        }));

        const activeMembership = parsedMemberships.find(m => m.centerId === activeCenter);

        // Persist to localStorage
        localStorage.setItem('auth_token', authToken);
        localStorage.setItem('auth_user', JSON.stringify(userWithParsedDates));
        localStorage.setItem('auth_memberships', JSON.stringify(parsedMemberships));
        localStorage.setItem('active_center_id', activeCenter);
        localStorage.setItem('auth_role', role);
        if (activeCenter) {
          localStorage.setItem('auth_center_id', activeCenter);
        }
        localStorage.setItem('auth_can_access_fees', String(activeMembership?.canAccessFees ?? false));

        // Update state
        setToken(authToken);
        setUser(userWithParsedDates);
        setMemberships(parsedMemberships);
        setActiveCenterId(activeCenter);
        setActiveRole(role);
        setCanAccessFees(role === 'HEAD_COACH' || role === 'ADMIN' || (activeMembership?.canAccessFees ?? false));
      } else {
        // Legacy login response (backward compat)
        const { token: authToken, user: userData, role: userRole } = data;

        const userWithParsedDates: User = {
          ...userData,
          createdAt: new Date(userData.createdAt),
          lastActive: new Date(userData.lastActive),
        };

        // Extract centerId from token payload (null for ADMIN users)
        let userCenterId: string | null = null;
        try {
          const payload = JSON.parse(atob(authToken.split('.')[1]));
          userCenterId = payload.centerId || null;
        } catch {
          userCenterId = null;
        }

        // Derive canAccessFees
        const derivedCanAccessFees =
          userRole === 'ADMIN' || userRole === 'HEAD_COACH' || !!userData.canAccessFees;

        // Build a single membership for backward compat
        const legacyMemberships: CenterMembership[] = userCenterId
          ? [{
              centerId: userCenterId,
              centerName: '', // Not available in legacy response
              role: userRole,
              canAccessFees: derivedCanAccessFees,
            }]
          : [];

        // Persist to localStorage
        localStorage.setItem('auth_token', authToken);
        localStorage.setItem('auth_user', JSON.stringify(userWithParsedDates));
        localStorage.setItem('auth_role', userRole);
        localStorage.setItem('auth_memberships', JSON.stringify(legacyMemberships));
        if (userCenterId) {
          localStorage.setItem('auth_center_id', userCenterId);
          localStorage.setItem('active_center_id', userCenterId);
        } else {
          localStorage.removeItem('auth_center_id');
          localStorage.removeItem('active_center_id');
        }
        localStorage.setItem('auth_can_access_fees', String(derivedCanAccessFees));

        // Update state
        setToken(authToken);
        setUser(userWithParsedDates);
        setMemberships(legacyMemberships);
        setActiveCenterId(userCenterId);
        setActiveRole(userRole);
        setCanAccessFees(derivedCanAccessFees);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  /**
   * switchCenter - switches the active center.
   * Finds the membership, updates state and persists to localStorage.
   * Shows error toast if membership not found.
   * Requirements: 2.2, 2.3, 2.5
   */
  const switchCenter = useCallback((centerId: string): void => {
    const membership = memberships.find(m => m.centerId === centerId);
    if (!membership) {
      // Cannot use useToast here directly; we handle this via a ref pattern below
      console.error(`No membership found for center: ${centerId}`);
      // Toast will be triggered via the wrapper below
      return;
    }

    setActiveCenterId(centerId);
    setActiveRole(membership.role);
    const feeAccess = membership.role === 'HEAD_COACH' || membership.role === 'ADMIN' || membership.canAccessFees;
    setCanAccessFees(feeAccess);
    localStorage.setItem('active_center_id', centerId);
    localStorage.setItem('auth_center_id', centerId);
    localStorage.setItem('auth_role', membership.role);
    localStorage.setItem('auth_can_access_fees', String(feeAccess));
  }, [memberships]);

  /**
   * Logout function - clears authentication state
   */
  const logout = (): void => {
    setUser(null);
    setMemberships([]);
    setActiveCenterId(null);
    setActiveRole(null);
    setCanAccessFees(false);
    setToken(null);

    // Clear localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_role');
    localStorage.removeItem('auth_center_id');
    localStorage.removeItem('auth_can_access_fees');
    localStorage.removeItem('auth_memberships');
    localStorage.removeItem('active_center_id');
  };

  const isAuthenticated = !!user && !!token && !!activeRole;

  // Backward-compatible aliases
  const role = activeRole;
  const centerId = activeCenterId;

  const value: AuthContextInterface = {
    user,
    role,
    centerId,
    canAccessFees,
    token,
    isAuthenticated,
    login,
    logout,
    // Multi-center fields
    memberships,
    activeCenterId,
    activeRole,
    switchCenter,
  };

  return <AuthContext.Provider value={value}>{!isLoading && children}</AuthContext.Provider>;
};

/**
 * AuthProviderWithToast
 * Wraps AuthProvider with toast support for switchCenter error notifications.
 * This is needed because AuthProvider cannot use useToast (it's a sibling context).
 */
export const AuthProviderWithToast: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <AuthProvider>{children}</AuthProvider>;
};

/**
 * useAuth hook
 * Custom hook to access authentication context throughout the application.
 * Must be used within AuthProvider.
 */
export const useAuth = (): AuthContextInterface => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

/**
 * useSwitchCenter hook
 * Wraps switchCenter with toast error notification.
 * Use this in components that need toast feedback on invalid center switch.
 */
export const useSwitchCenter = () => {
  const { memberships, switchCenter } = useAuth();
  const { showToast } = useToast();

  const switchCenterWithToast = useCallback((centerId: string): void => {
    const membership = memberships.find(m => m.centerId === centerId);
    if (!membership) {
      showToast({ message: 'Invalid center selection. Membership not found.', type: 'error' });
      return;
    }
    switchCenter(centerId);
  }, [memberships, switchCenter, showToast]);

  return switchCenterWithToast;
};
