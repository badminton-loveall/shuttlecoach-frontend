import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { AssistantCoachDashboard } from './AssistantCoachDashboard';
import type { User, AuthContext as AuthContextType } from '../types';

/**
 * AssistantCoachDashboard Tests
 * Verifies assistant coach dashboard displays scoped data (only assigned students)
 * Tests stat cards show correct counts/averages from assigned students
 * Tests student grid displays only assigned students
 * Tests filter and search work on scoped data
 */

// Mock DashboardLayout
vi.mock('../components/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock useStudents hook to return data from mocked students.json
vi.mock('../hooks/useStudents', () => ({
  useStudents: () => ({
    students: [
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
        id: 'student-002',
        fullName: 'Neha Sharma',
        dateOfBirth: new Date('2010-08-22'),
        age: 15,
        gender: 'Female',
        contactPhone: '9876543211',
        baidNumber: 'BAID-2026-002',
        batchId: 'batch-001',
        assignedCoachId: 'user-002',
        skillLevel: 'Intermediate',
        createdAt: new Date('2026-01-06T09:00:00Z'),
        updatedAt: new Date('2026-01-14T14:00:00Z'),
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
      {
        id: 'student-004',
        fullName: 'Ananya Singh',
        dateOfBirth: new Date('2011-11-28'),
        age: 14,
        gender: 'Female',
        contactPhone: '9876543213',
        baidNumber: 'BAID-2026-004',
        batchId: 'batch-001',
        assignedCoachId: 'user-002',
        skillLevel: 'Intermediate',
        createdAt: new Date('2026-01-08T09:00:00Z'),
        updatedAt: new Date('2026-01-12T15:20:00Z'),
        strengths: [],
        weaknesses: [],
      },
      {
        id: 'student-005',
        fullName: 'Karan Desai',
        dateOfBirth: new Date('2007-06-05'),
        age: 18,
        gender: 'Male',
        contactPhone: '9876543214',
        baidNumber: undefined,
        batchId: 'batch-003',
        assignedCoachId: 'user-003',
        skillLevel: 'Professional',
        createdAt: new Date('2026-01-09T09:00:00Z'),
        updatedAt: new Date('2026-01-15T09:00:00Z'),
        strengths: [],
        weaknesses: [],
      },
      {
        id: 'student-006',
        fullName: 'Simran Malhotra',
        dateOfBirth: new Date('2013-02-14'),
        age: 12,
        gender: 'Female',
        contactPhone: '9876543215',
        baidNumber: undefined,
        batchId: 'batch-002',
        assignedCoachId: 'user-003',
        skillLevel: 'Beginner',
        createdAt: new Date('2026-01-10T09:00:00Z'),
        updatedAt: new Date('2026-01-14T12:30:00Z'),
        strengths: [],
        weaknesses: [],
      },
      {
        id: 'student-007',
        fullName: 'Vikram Joshi',
        dateOfBirth: new Date('2014-04-07'),
        age: 11,
        gender: 'Male',
        contactPhone: '9876543218',
        baidNumber: undefined,
        batchId: 'batch-001',
        assignedCoachId: 'user-002',
        skillLevel: 'Beginner',
        createdAt: new Date('2026-01-13T09:00:00Z'),
        updatedAt: new Date('2026-01-14T10:15:00Z'),
        strengths: [],
        weaknesses: [],
      },
    ],
    loading: false,
    error: null,
    total: 7,
    refetch: vi.fn(),
    getStudent: vi.fn(),
    createStudent: vi.fn(),
    updateStudent: vi.fn(),
  }),
}));

// Mock useFees hook
vi.mock('../hooks/useFees', () => ({
  useFees: () => ({
    fees: [],
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

// Mock StatCard
vi.mock('../components/StatCard', () => ({
  default: ({
    title,
    value,
    label,
  }: {
    title: string;
    value: string | number;
    label?: string;
  }) => (
    <div data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <h3>{title}</h3>
      <div>{value}</div>
      {label && <p>{label}</p>}
    </div>
  ),
}));

// Mock StudentGrid
vi.mock('../components/StudentGrid', () => ({
  default: ({
    students,
    onStudentClick,
  }: {
    students: Array<{ id: string; fullName: string }>;
    onStudentClick?: (id: string) => void;
  }) => (
    <div data-testid="student-grid">
      {students.map((s) => (
        <div key={s.id} data-testid={`student-${s.id}`} onClick={() => onStudentClick?.(s.id)}>
          {s.fullName}
        </div>
      ))}
    </div>
  ),
}));

// Mock SearchInput
vi.mock('../components/SearchInput', () => ({
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <input
      data-testid="search-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search"
    />
  ),
}));

// Mock FilterBar
vi.mock('../components/FilterBar', () => ({
  default: ({ filters }: { filters: { batch: string; skillLevel: string; coach: string } }) => (
    <div data-testid="filter-bar">
      <span data-testid="filter-batch">{filters.batch || 'All Batches'}</span>
      <span data-testid="filter-skill">{filters.skillLevel || 'All Levels'}</span>
    </div>
  ),
}));

// Mock students data
vi.mock('../data/students.json', () => ({
  default: [
    {
      id: 'student-001',
      fullName: 'Arjun Verma',
      dateOfBirth: '2012-05-15',
      age: 13,
      gender: 'Male',
      contactPhone: '9876543210',
      baidNumber: 'BAID-2026-001',
      batchId: 'batch-001',
      assignedCoachId: 'user-002',
      skillLevel: 'Beginner',
      createdAt: '2026-01-05T09:00:00Z',
      updatedAt: '2026-01-15T10:30:00Z',
      strengths: [],
      weaknesses: [],
    },
    {
      id: 'student-002',
      fullName: 'Neha Sharma',
      dateOfBirth: '2010-08-22',
      age: 15,
      gender: 'Female',
      contactPhone: '9876543211',
      baidNumber: 'BAID-2026-002',
      batchId: 'batch-001',
      assignedCoachId: 'user-002',
      skillLevel: 'Intermediate',
      createdAt: '2026-01-06T09:00:00Z',
      updatedAt: '2026-01-14T14:00:00Z',
      strengths: [],
      weaknesses: [],
    },
    {
      id: 'student-003',
      fullName: 'Rohan Kapoor',
      dateOfBirth: '2008-03-10',
      age: 17,
      gender: 'Male',
      contactPhone: '9876543212',
      baidNumber: 'BAID-2026-003',
      batchId: 'batch-002',
      assignedCoachId: 'user-003',
      skillLevel: 'Advanced',
      createdAt: '2026-01-07T09:00:00Z',
      updatedAt: '2026-01-13T11:45:00Z',
      strengths: [],
      weaknesses: [],
    },
    {
      id: 'student-004',
      fullName: 'Ananya Singh',
      dateOfBirth: '2011-11-28',
      age: 14,
      gender: 'Female',
      contactPhone: '9876543213',
      baidNumber: 'BAID-2026-004',
      batchId: 'batch-001',
      assignedCoachId: 'user-002',
      skillLevel: 'Intermediate',
      createdAt: '2026-01-08T09:00:00Z',
      updatedAt: '2026-01-12T15:20:00Z',
      strengths: [],
      weaknesses: [],
    },
    {
      id: 'student-005',
      fullName: 'Karan Desai',
      dateOfBirth: '2007-06-05',
      age: 18,
      gender: 'Male',
      contactPhone: '9876543214',
      baidNumber: null,
      batchId: 'batch-003',
      assignedCoachId: 'user-003',
      skillLevel: 'Professional',
      createdAt: '2026-01-09T09:00:00Z',
      updatedAt: '2026-01-15T09:00:00Z',
      strengths: [],
      weaknesses: [],
    },
    {
      id: 'student-006',
      fullName: 'Simran Malhotra',
      dateOfBirth: '2013-02-14',
      age: 12,
      gender: 'Female',
      contactPhone: '9876543215',
      baidNumber: null,
      batchId: 'batch-002',
      assignedCoachId: 'user-003',
      skillLevel: 'Beginner',
      createdAt: '2026-01-10T09:00:00Z',
      updatedAt: '2026-01-14T12:30:00Z',
      strengths: [],
      weaknesses: [],
    },
    {
      id: 'student-007',
      fullName: 'Vikram Joshi',
      dateOfBirth: '2014-04-07',
      age: 11,
      gender: 'Male',
      contactPhone: '9876543218',
      baidNumber: null,
      batchId: 'batch-001',
      assignedCoachId: 'user-002',
      skillLevel: 'Beginner',
      createdAt: '2026-01-13T09:00:00Z',
      updatedAt: '2026-01-14T10:15:00Z',
      strengths: [],
      weaknesses: [],
    },
  ],
}));

describe('AssistantCoachDashboard', () => {
  const mockUser: User = {
    id: 'user-002',
    username: 'assistant_coach1',
    role: 'ASSISTANT_COACH',
    name: 'Priya Sharma',
    email: 'priya@shuttlecoach.com',
    createdAt: new Date('2026-01-02T08:00:00Z'),
    lastActive: new Date('2026-01-14T14:20:00Z'),
  };

  const mockAuthContext: AuthContextType = {
    user: mockUser,
    role: 'ASSISTANT_COACH',
    token: 'mock-token',
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
  };

  const renderWithAuth = (authContext: AuthContextType = mockAuthContext) => {
    return render(
      <BrowserRouter>
        <AuthContext.Provider value={authContext}>
          <AssistantCoachDashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Welcome Section', () => {
    it('renders welcome message with assistant coach name', () => {
      renderWithAuth();
      expect(screen.getByText(/Welcome, Priya Sharma!/)).toBeInTheDocument();
    });

    it('renders scoped subtitle for assistant coach', () => {
      renderWithAuth();
      expect(screen.getByText(/Here's an overview of your assigned students/)).toBeInTheDocument();
    });
  });

  describe('Stat Cards - Scoped Data', () => {
    it('displays total assigned students count (4 students assigned to user-002)', async () => {
      renderWithAuth();
      const statCard = screen.getByTestId('stat-card-assigned-students');
      await waitFor(() => {
        expect(statCard).toHaveTextContent('Assigned Students');
        expect(statCard).toHaveTextContent('4');
      });
    });

    it('displays BAID-registered count from assigned students only (3 out of 4)', async () => {
      renderWithAuth();
      const statCard = screen.getByTestId('stat-card-baid-registered');
      await waitFor(() => {
        expect(statCard).toHaveTextContent('BAID Registered');
        expect(statCard).toHaveTextContent('3/4');
        expect(statCard).toHaveTextContent('75% registered');
      });
    });

    it('displays average progress from assigned students only', async () => {
      renderWithAuth();
      // Assigned students: Beginner(1), Intermediate(2), Intermediate(2), Beginner(1)
      // Average: (1 + 2 + 2 + 1) / 4 = 1.5
      const statCard = screen.getByTestId('stat-card-avg-progress');
      await waitFor(() => {
        expect(statCard).toHaveTextContent('Avg Progress');
        expect(statCard).toHaveTextContent('1.5');
      });
    });

    it('does not display batch count card', () => {
      renderWithAuth();
      expect(screen.queryByTestId('stat-card-batches')).not.toBeInTheDocument();
    });
  });

  describe('Student Grid - Scoped Data', () => {
    it('displays only assigned students in the grid', async () => {
      renderWithAuth();
      await waitFor(() => {
        // Should show 4 students assigned to user-002
        expect(screen.getByTestId('student-student-001')).toBeInTheDocument();
        expect(screen.getByTestId('student-student-002')).toBeInTheDocument();
        expect(screen.getByTestId('student-student-004')).toBeInTheDocument();
        expect(screen.getByTestId('student-student-007')).toBeInTheDocument();

        // Should NOT show students assigned to other coaches
        expect(screen.queryByTestId('student-student-003')).not.toBeInTheDocument();
        expect(screen.queryByTestId('student-student-005')).not.toBeInTheDocument();
        expect(screen.queryByTestId('student-student-006')).not.toBeInTheDocument();
      });
    });

    it('displays "My Students" as section title', () => {
      renderWithAuth();
      expect(screen.getByText('My Students')).toBeInTheDocument();
    });
  });

  describe('Search and Filter', () => {
    it('renders search input', () => {
      renderWithAuth();
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    it('renders filter bar', () => {
      renderWithAuth();
      expect(screen.getByTestId('filter-bar')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty state when assistant coach has no assigned students', () => {
      const mockAuthWithNoStudents: AuthContextType = {
        ...mockAuthContext,
        user: {
          ...mockUser,
          id: 'user-999', // Coach with no assigned students
        },
      };

      renderWithAuth(mockAuthWithNoStudents);

      // StatCard should show 0 students
      const statCard = screen.getByTestId('stat-card-assigned-students');
      expect(statCard).toHaveTextContent('0');
    });
  });

  describe('Different Assistant Coach', () => {
    it('displays correct assigned students for user-003', async () => {
      const mockAuthUser003: AuthContextType = {
        ...mockAuthContext,
        user: {
          id: 'user-003',
          username: 'assistant_coach2',
          role: 'ASSISTANT_COACH',
          name: 'Vikram Singh',
          email: 'vikram@shuttlecoach.com',
          createdAt: new Date('2026-01-03T08:00:00Z'),
          lastActive: new Date('2026-01-13T09:15:00Z'),
        },
      };

      renderWithAuth(mockAuthUser003);

      await waitFor(() => {
        // Should show 3 students assigned to user-003
        expect(screen.getByTestId('student-student-003')).toBeInTheDocument();
        expect(screen.getByTestId('student-student-005')).toBeInTheDocument();
        expect(screen.getByTestId('student-student-006')).toBeInTheDocument();

        // Should NOT show students assigned to user-002
        expect(screen.queryByTestId('student-student-001')).not.toBeInTheDocument();
        expect(screen.queryByTestId('student-student-002')).not.toBeInTheDocument();
      });

      // Check stat card shows 3 students
      const statCard = screen.getByTestId('stat-card-assigned-students');
      expect(statCard).toHaveTextContent('3');
    });

    it('calculates BAID percentage correctly for user-003 (1 out of 3)', async () => {
      const mockAuthUser003: AuthContextType = {
        ...mockAuthContext,
        user: {
          id: 'user-003',
          username: 'assistant_coach2',
          role: 'ASSISTANT_COACH',
          name: 'Vikram Singh',
          email: 'vikram@shuttlecoach.com',
          createdAt: new Date('2026-01-03T08:00:00Z'),
          lastActive: new Date('2026-01-13T09:15:00Z'),
        },
      };

      renderWithAuth(mockAuthUser003);

      const statCard = screen.getByTestId('stat-card-baid-registered');
      await waitFor(() => {
        expect(statCard).toHaveTextContent('1/3');
        expect(statCard).toHaveTextContent('33% registered');
      });
    });
  });
});
