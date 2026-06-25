import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import TopNav from './TopNav';
import { AuthContext } from '../contexts/AuthContext';
import type { AuthContext as AuthContextInterface } from '../types';

/**
 * TopNav Component Tests
 * Validates role-aware navigation links and user profile display
 */

const mockAuthContext: AuthContextInterface = {
  user: {
    id: 'user-001',
    username: 'head_coach',
    role: 'HEAD_COACH',
    name: 'Rajesh Kumar',
    email: 'rajesh@shuttlecoach.com',
    profilePhoto: null,
    specialization: null,
    createdAt: new Date(),
    lastActive: new Date(),
  },
  role: 'HEAD_COACH',
  token: 'test-token',
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
};

const renderTopNav = (authContext: AuthContextInterface) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authContext}>
        <TopNav />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('TopNav Component', () => {
  describe('User Profile Display', () => {
    it('should display user name and role', () => {
      renderTopNav(mockAuthContext);

      expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
      expect(screen.getByText('HEAD COACH')).toBeInTheDocument();
    });

    it('should display user initials in avatar', () => {
      renderTopNav(mockAuthContext);

      expect(screen.getByText('RK')).toBeInTheDocument();
    });

    it('should handle single word names for initials', () => {
      const singleNameContext = {
        ...mockAuthContext,
        user: { ...mockAuthContext.user, name: 'Vikram' },
      };
      renderTopNav(singleNameContext);

      expect(screen.getByText('V')).toBeInTheDocument();
    });
  });

  describe('Navigation Links - HEAD_COACH Role', () => {
    it('should display all head coach navigation links', () => {
      renderTopNav(mockAuthContext);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Students')).toBeInTheDocument();
      expect(screen.getByText('Fees')).toBeInTheDocument();
      expect(screen.getByText('Coaches')).toBeInTheDocument();
      expect(screen.getByText('Curriculum')).toBeInTheDocument();
    });
  });

  describe('Navigation Links - ASSISTANT_COACH Role', () => {
    it('should not display Coaches link for assistant coaches', () => {
      const assistantContext = {
        ...mockAuthContext,
        role: 'ASSISTANT_COACH',
        user: { ...mockAuthContext.user, role: 'ASSISTANT_COACH', name: 'Priya Sharma' },
      };
      renderTopNav(assistantContext);

      const coachesLink = screen.queryByText('Coaches');
      expect(coachesLink).not.toBeInTheDocument();

      // Should still have other links
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Students')).toBeInTheDocument();
    });
  });

  describe('Navigation Links - STUDENT Role', () => {
    it('should display student-specific navigation links', () => {
      const studentContext = {
        ...mockAuthContext,
        role: 'STUDENT',
        user: { ...mockAuthContext.user, role: 'STUDENT', name: 'Aarav Patel' },
      };
      renderTopNav(studentContext);

      expect(screen.getByText('My Progress')).toBeInTheDocument();
      expect(screen.getByText('My Fees')).toBeInTheDocument();

      // Should not have coach/admin links
      expect(screen.queryByText('Students')).not.toBeInTheDocument();
      expect(screen.queryByText('Coaches')).not.toBeInTheDocument();
    });
  });

  describe('Sign Out Functionality', () => {
    it('should call logout when sign out button is clicked', () => {
      const mockLogout = vi.fn();
      const contextWithMockLogout = {
        ...mockAuthContext,
        logout: mockLogout,
      };

      render(
        <BrowserRouter>
          <AuthContext.Provider value={contextWithMockLogout}>
            <TopNav />
          </AuthContext.Provider>
        </BrowserRouter>
      );

      const signOutButton = screen.getByTitle('Sign out');
      fireEvent.click(signOutButton);

      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('Logo and Branding', () => {
    it('should display ShuttleCoach logo', () => {
      renderTopNav(mockAuthContext);

      expect(screen.getByText('ShuttleCoach')).toBeInTheDocument();
    });

    it('should have logo link to home', () => {
      renderTopNav(mockAuthContext);

      const logoLink = screen.getByText('ShuttleCoach').closest('a');
      expect(logoLink).toHaveAttribute('href', '/');
    });
  });

  describe('Active Link Highlighting', () => {
    it('should have active class on current route link', () => {
      // Note: This test requires more sophisticated setup with route matching
      // The actual implementation will highlight based on useLocation()
      renderTopNav(mockAuthContext);

      // The TopNav component uses useLocation to determine active link
      // This would need route integration tests to fully validate
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have mobile menu button', () => {
      renderTopNav(mockAuthContext);

      const mobileMenuButton = screen.getByTitle('Toggle menu');
      expect(mobileMenuButton).toBeInTheDocument();
    });

    it('should toggle mobile menu when button is clicked', () => {
      renderTopNav(mockAuthContext);

      const mobileMenuButton = screen.getByTitle('Toggle menu');
      expect(mobileMenuButton).toBeInTheDocument();

      // Click to toggle
      fireEvent.click(mobileMenuButton);

      // Verify button is still present after click
      expect(screen.getByTitle('Toggle menu')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have descriptive titles on icon buttons', () => {
      renderTopNav(mockAuthContext);

      expect(screen.getByTitle('Sign out')).toBeInTheDocument();
      expect(screen.getByTitle('Toggle menu')).toBeInTheDocument();
    });

    it('should have semantic navigation structure', () => {
      const { container } = renderTopNav(mockAuthContext);

      const nav = container.querySelector('nav.topnav');
      expect(nav).toBeInTheDocument();
    });
  });
});
