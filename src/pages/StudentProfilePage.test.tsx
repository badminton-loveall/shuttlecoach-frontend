import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { StudentProfilePage } from './StudentProfilePage';
import type { User, AuthContext as AuthContextType } from '../types';

/**
 * StudentProfilePage Access Control Tests
 * Verifies that assistant coaches can only view students assigned to them
 * Tests access-denied message appears for non-assigned students
 */

// Mock DashboardLayout
vi.mock('../components/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock useStudent hook
vi.mock('../hooks/useStudent', () => ({
  useStudent: (id: string) => {
    const students = [
      {
        id: 'student-001',
        fullName: 'Arjun Verma',
        dateOfBirth: new Date('2012-05-15'),
        age: 13,
        gender: 'Male',
        contactPhone: '9876543210',
        baidNumber: 'BAID-2026-001',
        batchId: 'batch-001',
        assignedCoachId: 'user-002',
        skillLevel: 'Beginner',
        createdAt: new Date('2026-01-05T09:00:00Z'),
        updatedAt: new Date('2026-01-15T10:30:00Z'),
        strengths: [],
        weaknesses: [],
      },
      {
        id: 'student-003',
        fullName: 'Rohan Kapoor',
        dateOfBirth: new Date('2008-03-10'),
        age: 17,
        gender: 'Male',
        contactPhone: '9876543212',
        baidNumber: 'BAID-2026-003',
        batchId: 'batch-002',
        assignedCoachId: 'user-003',
        skillLevel: 'Advanced',
        createdAt: new Date('2026-01-07T09:00:00Z'),
        updatedAt: new Date('2026-01-13T11:45:00Z'),
        strengths: [],
        weaknesses: [],
      },
    ];
    const student = students.find((s) => s.id === id) || null;
    return {
      student,
      loading: false,
      error: null,
      refetch: vi.fn(),
    };
  },
}));

// Mock all the form and tab components
vi.mock('../components/PersonalInfoForm', () => ({
  PersonalInfoForm: () => <div data-testid="personal-info-form">Personal Info Form</div>,
}));

vi.mock('../components/TrainingTab', () => ({
  TrainingTab: () => <div data-testid="training-tab">Training Tab</div>,
}));

vi.mock('../components/SkillRadarChart', () => ({
  SkillRadarChart: () => <div data-testid="skill-radar-chart">Skill Radar Chart</div>,
}));

vi.mock('../components/TrendLineChart', () => ({
  TrendLineChart: () => <div data-testid="trend-line-chart">Trend Line Chart</div>,
}));

vi.mock('../components/WeaknessTracker', () => ({
  WeaknessTracker: () => <div data-testid="weakness-tracker">Weakness Tracker</div>,
}));

vi.mock('../components/SkillHistory', () => ({
  SkillHistory: () => <div data-testid="skill-history">Skill History</div>,
}));

describe('StudentProfilePage - Access Control', () => {
  const mockHeadCoach: User = {
    id: 'user-001',
    username: 'head_coach',
    role: 'HEAD_COACH',
    name: 'Sumit Dali',
    email: 'sumit@shuttlecoach.com',
    createdAt: new Date('2026-01-01T08:00:00Z'),
    lastActive: new Date('2026-01-15T10:30:00Z'),
  };

  const mockAssistantCoach: User = {
    id: 'user-002',
    username: 'assistant_coach1',
    role: 'ASSISTANT_COACH',
    name: 'Priya Sharma',
    email: 'priya@shuttlecoach.com',
    createdAt: new Date('2026-01-02T08:00:00Z'),
    lastActive: new Date('2026-01-14T14:20:00Z'),
  };

  const mockOtherAssistantCoach: User = {
    id: 'user-003',
    username: 'assistant_coach2',
    role: 'ASSISTANT_COACH',
    name: 'Vikram Singh',
    email: 'vikram@shuttlecoach.com',
    createdAt: new Date('2026-01-03T08:00:00Z'),
    lastActive: new Date('2026-01-13T09:15:00Z'),
  };

  const createMockAuthContext = (user: User): AuthContextType => ({
    user,
    role: user.role,
    token: 'mock-token',
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
  });

  const renderWithAuth = (authContext: AuthContextType, studentId: string) => {
    return render(
      <MemoryRouter initialEntries={[`/student/${studentId}`]}>
        <AuthContext.Provider value={authContext}>
          <Routes>
            <Route path="/student/:id" element={<StudentProfilePage />} />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Head Coach Access', () => {
    it('allows head coach to view any student profile', () => {
      const authContext = createMockAuthContext(mockHeadCoach);
      renderWithAuth(authContext, 'student-001');

      // Should show profile, not access denied
      expect(screen.getByText('Arjun Verma')).toBeInTheDocument();
      expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
    });

    it('allows head coach to view student assigned to different coach', () => {
      const authContext = createMockAuthContext(mockHeadCoach);
      renderWithAuth(authContext, 'student-003');

      // Should show profile
      expect(screen.getByText('Rohan Kapoor')).toBeInTheDocument();
      expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
    });
  });

  describe('Assistant Coach Access - Assigned Student', () => {
    it('allows assistant coach to view their assigned student', () => {
      const authContext = createMockAuthContext(mockAssistantCoach);
      renderWithAuth(authContext, 'student-001');

      // Should show profile, not access denied
      expect(screen.getByText('Arjun Verma')).toBeInTheDocument();
      expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
    });
  });

  describe('Assistant Coach Access - Non-Assigned Student', () => {
    it('shows access denied when assistant coach tries to view non-assigned student', () => {
      const authContext = createMockAuthContext(mockAssistantCoach);
      // student-003 is assigned to user-003, not user-002
      renderWithAuth(authContext, 'student-003');

      // Should show access denied
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(
        screen.getByText('You do not have permission to view this student\'s profile.')
      ).toBeInTheDocument();
      expect(screen.queryByText('Rohan Kapoor')).not.toBeInTheDocument();
    });

    it('shows helpful message explaining the restriction', () => {
      const authContext = createMockAuthContext(mockAssistantCoach);
      renderWithAuth(authContext, 'student-003');

      expect(
        screen.getByText(/This student is not assigned to you/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Please contact the Head Coach if you believe this is an error/i)
      ).toBeInTheDocument();
    });

    it('shows back to dashboard button on access denied page', () => {
      const authContext = createMockAuthContext(mockAssistantCoach);
      renderWithAuth(authContext, 'student-003');

      const backButton = screen.getByRole('button', { name: /back to dashboard/i });
      expect(backButton).toBeInTheDocument();
    });
  });

  describe('Different Assistant Coach', () => {
    it('allows user-003 to view student-003', () => {
      const authContext = createMockAuthContext(mockOtherAssistantCoach);
      renderWithAuth(authContext, 'student-003');

      expect(screen.getByText('Rohan Kapoor')).toBeInTheDocument();
      expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
    });

    it('denies user-003 access to student-001', () => {
      const authContext = createMockAuthContext(mockOtherAssistantCoach);
      renderWithAuth(authContext, 'student-001');

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByText('Arjun Verma')).not.toBeInTheDocument();
    });
  });

  describe('Student Not Found', () => {
    it('shows not found message when student does not exist', () => {
      const authContext = createMockAuthContext(mockHeadCoach);
      renderWithAuth(authContext, 'student-999');

      expect(screen.getByText('Student Not Found')).toBeInTheDocument();
      expect(screen.getByText(/could not be found/i)).toBeInTheDocument();
    });
  });
});
