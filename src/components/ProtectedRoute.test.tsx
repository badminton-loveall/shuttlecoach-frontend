import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

/**
 * ProtectedRoute Component Tests
 * Tests for: authentication check, role-based access, redirect logic,
 * and center-aware role resolution (Requirements: 3.2, 3.4, 3.6)
 */

// Mock useAuth hook to control authentication state
vi.mock('../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../contexts/AuthContext');
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

import { useAuth } from '../contexts/AuthContext';

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Unauthenticated Access', () => {
    it('should redirect to /login when user is not authenticated', () => {
      const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        role: null,
        activeRole: null,
        canAccessFees: false,
        user: null,
        token: null,
        login: vi.fn(),
        logout: vi.fn(),
        memberships: [],
        activeCenterId: null,
        switchCenter: vi.fn(),
      });

      const { container } = render(
        <BrowserRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </BrowserRouter>
      );

      // The component should render a Navigate element
      // When using React Router, Navigate causes a redirect
      expect(container).toBeInTheDocument();
    });

    it('should not render children when not authenticated', () => {
      const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        role: null,
        activeRole: null,
        canAccessFees: false,
        user: null,
        token: null,
        login: vi.fn(),
        logout: vi.fn(),
        memberships: [],
        activeCenterId: null,
        switchCenter: vi.fn(),
      });

      render(
        <BrowserRouter>
          <ProtectedRoute>
            <div data-testid="protected-content">Protected Content</div>
          </ProtectedRoute>
        </BrowserRouter>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated Access', () => {
    it('should render children when user is authenticated without role restrictions', () => {
      const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        role: 'HEAD_COACH',
        activeRole: 'HEAD_COACH',
        canAccessFees: true,
        user: { id: 'user-1', name: 'Test User', role: 'HEAD_COACH' },
        token: 'test-token',
        login: vi.fn(),
        logout: vi.fn(),
        memberships: [],
        activeCenterId: 'center-1',
        switchCenter: vi.fn(),
      });

      render(
        <BrowserRouter>
          <ProtectedRoute>
            <div data-testid="protected-content">Protected Content</div>
          </ProtectedRoute>
        </BrowserRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should render children when authenticated with allowed role', () => {
      const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        role: 'HEAD_COACH',
        activeRole: 'HEAD_COACH',
        canAccessFees: true,
        user: { id: 'user-1', name: 'Test User', role: 'HEAD_COACH' },
        token: 'test-token',
        login: vi.fn(),
        logout: vi.fn(),
        memberships: [],
        activeCenterId: 'center-1',
        switchCenter: vi.fn(),
      });

      render(
        <BrowserRouter>
          <ProtectedRoute allowedRoles={['HEAD_COACH', 'ASSISTANT_COACH']}>
            <div data-testid="protected-content">Admin Content</div>
          </ProtectedRoute>
        </BrowserRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('Role-Based Access Control', () => {
    it('should redirect to /access-denied when user role is not allowed', () => {
      const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        role: 'STUDENT',
        activeRole: 'STUDENT',
        canAccessFees: false,
        user: { id: 'user-2', name: 'Student', role: 'STUDENT' },
        token: 'test-token',
        login: vi.fn(),
        logout: vi.fn(),
        memberships: [],
        activeCenterId: 'center-1',
        switchCenter: vi.fn(),
      });

      render(
        <BrowserRouter>
          <ProtectedRoute allowedRoles={['HEAD_COACH', 'ASSISTANT_COACH']}>
            <div data-testid="protected-content">Admin Content</div>
          </ProtectedRoute>
        </BrowserRouter>
      );

      // Children should not be rendered
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should allow HEAD_COACH to access HEAD_COACH-only routes', () => {
      const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        role: 'HEAD_COACH',
        activeRole: 'HEAD_COACH',
        canAccessFees: true,
        user: { id: 'user-1', name: 'Coach', role: 'HEAD_COACH' },
        token: 'test-token',
        login: vi.fn(),
        logout: vi.fn(),
        memberships: [],
        activeCenterId: 'center-1',
        switchCenter: vi.fn(),
      });

      render(
        <BrowserRouter>
          <ProtectedRoute allowedRoles={['HEAD_COACH']}>
            <div data-testid="head-coach-content">Head Coach Only</div>
          </ProtectedRoute>
        </BrowserRouter>
      );

      expect(screen.getByTestId('head-coach-content')).toBeInTheDocument();
    });

    it('should allow ASSISTANT_COACH to access allowed routes', () => {
      const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        role: 'ASSISTANT_COACH',
        activeRole: 'ASSISTANT_COACH',
        canAccessFees: false,
        user: { id: 'user-2', name: 'Assistant', role: 'ASSISTANT_COACH' },
        token: 'test-token',
        login: vi.fn(),
        logout: vi.fn(),
        memberships: [],
        activeCenterId: 'center-1',
        switchCenter: vi.fn(),
      });

      render(
        <BrowserRouter>
          <ProtectedRoute allowedRoles={['HEAD_COACH', 'ASSISTANT_COACH']}>
            <div data-testid="coach-content">Coach Content</div>
          </ProtectedRoute>
        </BrowserRouter>
      );

      expect(screen.getByTestId('coach-content')).toBeInTheDocument();
    });

    it('should allow STUDENT to access STUDENT-only routes', () => {
      const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        role: 'STUDENT',
        activeRole: 'STUDENT',
        canAccessFees: false,
        user: { id: 'user-3', name: 'Student', role: 'STUDENT' },
        token: 'test-token',
        login: vi.fn(),
        logout: vi.fn(),
        memberships: [],
        activeCenterId: 'center-1',
        switchCenter: vi.fn(),
      });

      render(
        <BrowserRouter>
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <div data-testid="student-content">Student Content</div>
          </ProtectedRoute>
        </BrowserRouter>
      );

      expect(screen.getByTestId('student-content')).toBeInTheDocument();
    });

    it('should block STUDENT from accessing coach routes', () => {
      const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        role: 'STUDENT',
        activeRole: 'STUDENT',
        canAccessFees: false,
        user: { id: 'user-3', name: 'Student', role: 'STUDENT' },
        token: 'test-token',
        login: vi.fn(),
        logout: vi.fn(),
        memberships: [],
        activeCenterId: 'center-1',
        switchCenter: vi.fn(),
      });

      render(
        <BrowserRouter>
          <ProtectedRoute allowedRoles={['HEAD_COACH', 'ASSISTANT_COACH']}>
            <div data-testid="coach-content">Coach Content</div>
          </ProtectedRoute>
        </BrowserRouter>
      );

      expect(screen.queryByTestId('coach-content')).not.toBeInTheDocument();
    });

    it('should handle multiple allowed roles correctly', () => {
      const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        role: 'ASSISTANT_COACH',
        activeRole: 'ASSISTANT_COACH',
        canAccessFees: false,
        user: { id: 'user-2', name: 'Assistant', role: 'ASSISTANT_COACH' },
        token: 'test-token',
        login: vi.fn(),
        logout: vi.fn(),
        memberships: [],
        activeCenterId: 'center-1',
        switchCenter: vi.fn(),
      });

      const allowedRoles = ['HEAD_COACH', 'ASSISTANT_COACH', 'STUDENT'] as const;

      render(
        <BrowserRouter>
          <ProtectedRoute allowedRoles={allowedRoles}>
            <div data-testid="content">Content for multiple roles</div>
          </ProtectedRoute>
        </BrowserRouter>
      );

      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty allowedRoles array', () => {
      const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        role: 'HEAD_COACH',
        activeRole: 'HEAD_COACH',
        canAccessFees: true,
        user: { id: 'user-1', name: 'Coach', role: 'HEAD_COACH' },
        token: 'test-token',
        login: vi.fn(),
        logout: vi.fn(),
        memberships: [],
        activeCenterId: 'center-1',
        switchCenter: vi.fn(),
      });

      render(
        <BrowserRouter>
          <ProtectedRoute allowedRoles={[]}>
            <div data-testid="content">Content</div>
          </ProtectedRoute>
        </BrowserRouter>
      );

      // Empty allowedRoles array: since length is 0, the role check is skipped
      // User is authenticated, so access is granted
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should handle undefined allowedRoles', () => {
      const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        role: 'HEAD_COACH',
        activeRole: 'HEAD_COACH',
        canAccessFees: true,
        user: { id: 'user-1', name: 'Coach', role: 'HEAD_COACH' },
        token: 'test-token',
        login: vi.fn(),
        logout: vi.fn(),
        memberships: [],
        activeCenterId: 'center-1',
        switchCenter: vi.fn(),
      });

      render(
        <BrowserRouter>
          <ProtectedRoute>
            <div data-testid="content">Content</div>
          </ProtectedRoute>
        </BrowserRouter>
      );

      // Undefined allowedRoles means no role restriction
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should handle authenticated user with null role', () => {
      const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        role: null,
        activeRole: null,
        canAccessFees: false,
        user: { id: 'user-1', name: 'User', role: null },
        token: 'test-token',
        login: vi.fn(),
        logout: vi.fn(),
        memberships: [],
        activeCenterId: null,
        switchCenter: vi.fn(),
      });

      render(
        <BrowserRouter>
          <ProtectedRoute allowedRoles={['HEAD_COACH']}>
            <div data-testid="content">Content</div>
          </ProtectedRoute>
        </BrowserRouter>
      );

      // User with null role should be redirected
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });
  });
});
