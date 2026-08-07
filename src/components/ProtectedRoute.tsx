import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';

/**
 * ProtectedRoute Component
 * Wraps routes that require authentication and specific roles.
 * Uses `activeRole` from AuthContext for center-aware role resolution.
 * When the active center changes (changing activeRole), re-evaluates route access
 * and redirects to Access Denied or the default route for the new role.
 *
 * Requirements: 3.2, 3.4, 3.6
 */

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: readonly UserRole[];
  requireFeeAccess?: boolean;
}

/**
 * Returns the default route for a given role.
 * Used when a center switch results in the current route being inaccessible.
 */
function getDefaultRouteForRole(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard';
    case 'HEAD_COACH':
    case 'ASSISTANT_COACH':
      return '/dashboard';
    case 'STUDENT':
      return '/student-dashboard';
    default:
      return '/login';
  }
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireFeeAccess,
}) => {
  const { isAuthenticated, activeRole, canAccessFees } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const prevRoleRef = useRef<UserRole | null>(activeRole);

  // When activeRole changes (center switch), re-evaluate route access.
  // If the current route is no longer permitted, redirect to the default route for the new role.
  useEffect(() => {
    if (prevRoleRef.current !== activeRole && activeRole && isAuthenticated) {
      // Role changed (center switch occurred)
      if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(activeRole)) {
        // Current route not permitted for new role — redirect to default route
        const defaultRoute = getDefaultRouteForRole(activeRole);
        navigate(defaultRoute, { replace: true });
      }
    }
    prevRoleRef.current = activeRole;
  }, [activeRole, allowedRoles, isAuthenticated, navigate, location.pathname]);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role authorization if allowedRoles is specified
  if (allowedRoles && allowedRoles.length > 0 && (!activeRole || !allowedRoles.includes(activeRole))) {
    return <Navigate to="/access-denied" replace />;
  }

  // Check fee access permission if required
  if (requireFeeAccess && !canAccessFees) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
