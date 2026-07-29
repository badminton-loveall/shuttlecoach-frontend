import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { StudentDashboard } from './StudentDashboard';
import type { User, AuthContext as AuthContextType } from '../types';

/**
 * Bug Condition Exploration Test - Sub-condition 3: Dashboard Stale Data
 *
 * Validates: Requirements 1.3
 *
 * EXPECTED TO FAIL on unfixed code.
 * The `StudentDashboard` reads from static JSON files and resolves users via
 * a hardcoded `USER_TO_STUDENT_MAP` which only contains entries for 'user-004'
 * and 'user-005'. Any other user (e.g., 'user-099', a student created via the API)
 * will not be found, and the dashboard shows "Unable to load student data".
 *
 * The expected behavior is that the dashboard loads the student's data from the API
 * using the authenticated user's context, so even API-created students see their data.
 */

// Mock DashboardLayout
vi.mock('../components/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock SkillRadarChart
vi.mock('../components/SkillRadarChart', () => ({
  SkillRadarChart: () => <div data-testid="skill-radar-chart">Skill Radar Chart</div>,
}));

describe('StudentDashboard - Bug Condition: Stale Data for API-created students', () => {
  const mockStudentUser: User = {
    id: 'user-099',
    username: 'api_student',
    role: 'STUDENT',
    name: 'API Created Student',
    email: 'apistudent@example.com',
    createdAt: new Date('2026-02-01T08:00:00Z'),
    lastActive: new Date('2026-02-15T10:30:00Z'),
  };

  const createMockAuthContext = (user: User): AuthContextType => ({
    user,
    role: user.role,
    token: 'mock-token',
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display student data from API for user-099 (not in USER_TO_STUDENT_MAP)', async () => {
    /**
     * On unfixed code: StudentDashboard reads from static JSON and uses
     * USER_TO_STUDENT_MAP which only maps user-004 and user-005.
     * For user-099, studentId will be null, student will be null,
     * and the component renders "Unable to load student data".
     *
     * Expected behavior: The dashboard should fetch the student data from the API
     * for the authenticated user, so user-099 sees their data.
     */
    const authContext = createMockAuthContext(mockStudentUser);

    render(
      <MemoryRouter>
        <AuthContext.Provider value={authContext}>
          <StudentDashboard />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    // Wait for component to settle
    await waitFor(() => {
      // The component should NOT show the "Unable to load student data" message
      // if it's properly loading from the API
    }, { timeout: 2000 });

    // On unfixed code, the dashboard shows "Unable to load student data"
    // because user-099 is not in USER_TO_STUDENT_MAP
    // The expected behavior after fix is to NOT show this message
    const unableToLoadMessage = screen.queryByText('Unable to load student data');
    expect(unableToLoadMessage).not.toBeInTheDocument();
  });
});
