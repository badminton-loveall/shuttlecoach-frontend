import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';

/**
 * ProtectedRoute Component
 * Wraps routes that require authentication and specific roles
 * Redirects unauthenticated users to /login
 * Redirects unauthorized users to /access-denied
 */

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: readonly UserRole[];
  requireFeeAccess?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireFeeAccess,
}) => {
  const { isAuthenticated, role, canAccessFees } = useAuth();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role authorization if allowedRoles is specified
  if (allowedRoles && allowedRoles.length > 0 && (!role || !allowedRoles.includes(role))) {
    return <Navigate to="/access-denied" replace />;
  }

  // Check fee access permission if required
  if (requireFeeAccess && !canAccessFees) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
