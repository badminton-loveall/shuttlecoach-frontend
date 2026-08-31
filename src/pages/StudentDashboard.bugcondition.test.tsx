import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { StudentDashboard } from './StudentDashboard';
import type { User, AuthContext as AuthContextType } from '../types';

/**
 * Bug Condition Regression Test - Sub-condition 3: Dashboard Stale Data
 *
 * Validates: Requirements 1.3
 *
 * StudentDashboard used to resolve students via static JSON and a hardcoded
 * name/email match, so any student created after the fixture was written
 * (e.g. via the real signup flow) never resolved and saw "Unable to load
 * student data" forever. The fix: a student's users.id === students.id, so
 * the dashboard now calls GET /students/:id with the authenticated user's own
 * id and always finds the record, regardless of when the student was created.
 */

// Mock DashboardLayout
vi.mock('../components/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock SkillRadarChart
vi.mock('../components/SkillRadarChart', () => ({
  SkillRadarChart: () => <div data-testid="skill-radar-chart">Skill Radar Chart</div>,
}));

// Mock apiClient — GET /students/:id must resolve for ANY id, mirroring the real
// backend which looks the student up directly by primary key.
vi.mock('../utils/apiClient', () => ({
  default: {
    get: vi.fn((url: string) => {
      if (url.startsWith('/students/user-099')) {
        return Promise.resolve({
          data: {
            id: 'user-099',
            fullName: 'API Created Student',
            dateOfBirth: '2013-01-01',
            age: 12,
            gender: 'Male',
            contactPhone: '9999999999',
            strengths: [],
            weaknesses: [],
            skillLevel: 'Beginner',
            createdAt: '2026-02-01T08:00:00Z',
            updatedAt: '2026-02-01T08:00:00Z',
          },
        });
      }
      return Promise.resolve({ data: [] });
    }),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
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
    sessionStorage.clear();
  });

  it('should display student data from API for user-099 (created after any hardcoded fixture)', async () => {
    const authContext = createMockAuthContext(mockStudentUser);

    render(
      <MemoryRouter>
        <AuthContext.Provider value={authContext}>
          <StudentDashboard />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, API Created Student/i)).toBeInTheDocument();
    });

    const unableToLoadMessage = screen.queryByText('Unable to load student data');
    expect(unableToLoadMessage).not.toBeInTheDocument();
  });
});
