import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import * as fc from 'fast-check';
import { AuthContext } from '../contexts/AuthContext';
import { StudentProfilePage } from './StudentProfilePage';
import { canEditStudent, canArchiveStudent } from '../utils/studentProfileUtils';
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

// Mock useBatches hook
vi.mock('../hooks/useBatches', () => ({
  useBatches: () => ({
    batches: [
      { id: 'batch-001', name: 'Morning Beginners', schedule: 'Mon/Wed/Fri 6-7AM', studentCount: 5, createdAt: new Date() },
      { id: 'batch-002', name: 'Advanced Evening', schedule: 'Tue/Thu 5-7PM', studentCount: 3, createdAt: new Date() },
    ],
    loading: false,
    error: null,
    getBatchName: (batchId: string | undefined) => {
      const map: Record<string, string> = {
        'batch-001': 'Morning Beginners',
        'batch-002': 'Advanced Evening',
      };
      if (!batchId) return 'Unknown batch';
      return map[batchId] ?? 'Unknown batch';
    },
    refetch: vi.fn(),
  }),
}));

// Mock useToast hook
vi.mock('../contexts/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
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


// --- Property-Based Tests (fast-check) ---

// Generators matching project conventions
const roleArbitrary = fc.oneof(
  fc.constant('HEAD_COACH'),
  fc.constant('ASSISTANT_COACH'),
  fc.constant('STUDENT'),
  fc.string({ minLength: 1, maxLength: 20 })
);

const userIdArbitrary = fc.uuid();

const studentWithCoachArbitrary = fc.record({
  assignedCoachId: fc.option(fc.uuid(), { nil: undefined }),
});

describe('Feature: student-profile-crud, Property 11: API access control enforcement', () => {
  /**
   * Validates: Requirements 6.1, 6.2, 6.3
   *
   * For any user/student combination, canEditStudent returns true
   * iff HEAD_COACH or (ASSISTANT_COACH with matching assignedCoachId).
   * All other combinations must return false (403 equivalent on frontend).
   */
  it('canEditStudent returns true iff HEAD_COACH or assigned ASSISTANT_COACH', () => {
    fc.assert(
      fc.property(roleArbitrary, userIdArbitrary, studentWithCoachArbitrary, (role, userId, student) => {
        const result = canEditStudent(role, userId, student);

        const expected =
          role === 'HEAD_COACH' ||
          (role === 'ASSISTANT_COACH' && student.assignedCoachId === userId);

        expect(result).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  it('non-HEAD_COACH and non-assigned ASSISTANT_COACH always denied (403 equivalent)', () => {
    fc.assert(
      fc.property(
        roleArbitrary.filter((r) => r !== 'HEAD_COACH' && r !== 'ASSISTANT_COACH'),
        userIdArbitrary,
        studentWithCoachArbitrary,
        (role, userId, student) => {
          const result = canEditStudent(role, userId, student);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('ASSISTANT_COACH with non-matching assignedCoachId is denied', () => {
    fc.assert(
      fc.property(
        userIdArbitrary,
        userIdArbitrary.filter((id) => id !== ''), // different userId for student
        (coachId, differentId) => {
          // Ensure the IDs are different
          fc.pre(coachId !== differentId);
          const student = { assignedCoachId: differentId };
          const result = canEditStudent('ASSISTANT_COACH', coachId, student);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: student-profile-crud, Property 13: Archive restricted to HEAD_COACH', () => {
  /**
   * Validates: Requirements 5.4, 5.5
   *
   * For any non-HEAD_COACH role, canArchiveStudent returns false.
   * HEAD_COACH always returns true.
   */
  it('canArchiveStudent returns false for any non-HEAD_COACH role', () => {
    fc.assert(
      fc.property(
        roleArbitrary.filter((r) => r !== 'HEAD_COACH'),
        (role) => {
          const result = canArchiveStudent(role);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('canArchiveStudent returns true for HEAD_COACH', () => {
    const result = canArchiveStudent('HEAD_COACH');
    expect(result).toBe(true);
  });

  it('archive permission is independent of userId and student assignment', () => {
    fc.assert(
      fc.property(
        roleArbitrary,
        userIdArbitrary,
        studentWithCoachArbitrary,
        (role, _userId, _student) => {
          const result = canArchiveStudent(role);
          // Archive depends solely on role, never on userId or student data
          expect(result).toBe(role === 'HEAD_COACH');
        }
      ),
      { numRuns: 100 }
    );
  });
});
