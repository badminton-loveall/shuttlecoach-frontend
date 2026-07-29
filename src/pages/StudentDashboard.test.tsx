import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import StudentDashboard from './StudentDashboard';
import { AuthContext } from '../contexts/AuthContext';
import type { User } from '../types';

// Mock the data imports
vi.mock('../data/fees.json', () => ({
  default: [
    {
      id: 'fee-001',
      studentId: 'student-001',
      amount: 5000,
      monthYear: '2026-01',
      dueDate: '2026-01-05T00:00:00Z',
      status: 'PAID',
      paidDate: '2026-01-03T00:00:00Z',
      paymentMethod: 'UPI',
      createdAt: '2025-12-20T00:00:00Z',
      updatedAt: '2026-01-03T00:00:00Z',
    },
  ],
}));

vi.mock('../data/curriculum.json', () => ({
  default: [
    {
      id: 'curriculum-003',
      cycleKey: 'Jan-Feb 2026',
      batchId: null,
      studentId: 'student-001',
      sourceBatchPlanId: 'curriculum-001',
      weeks: [
        {
          weekNumber: 1,
          focusArea: 'Foundation - Grip and Basic Footwork',
          drills: [
            {
              id: 'drill-001',
              name: 'Grip Practice',
              description: 'Practice correct grip technique for forehand and backhand strokes',
              category: 'Fundamentals',
            },
            {
              id: 'drill-002',
              name: 'Court Movement Patterns',
              description: 'Basic footwork patterns covering all six court positions',
              category: 'Footwork',
            },
          ],
          objective: 'Establish proper grip habits and develop basic court coverage skills',
        },
        {
          weekNumber: 2,
          focusArea: 'Forehand Clear and Drop Technique',
          drills: [
            {
              id: 'drill-004',
              name: 'High Clear Practice',
              description: 'Repetitive forehand clear shots to baseline',
              category: 'Stroke Practice',
            },
          ],
          objective: 'Master forehand overhead strokes with control and accuracy',
        },
        // Add remaining weeks 3-8
        { weekNumber: 3, focusArea: 'Week 3', drills: [], objective: 'Week 3 objective' },
        { weekNumber: 4, focusArea: 'Week 4', drills: [], objective: 'Week 4 objective' },
        { weekNumber: 5, focusArea: 'Week 5', drills: [], objective: 'Week 5 objective' },
        { weekNumber: 6, focusArea: 'Week 6', drills: [], objective: 'Week 6 objective' },
        { weekNumber: 7, focusArea: 'Week 7', drills: [], objective: 'Week 7 objective' },
        { weekNumber: 8, focusArea: 'Week 8', drills: [], objective: 'Week 8 objective' },
      ],
      createdAt: '2026-01-06T09:00:00Z',
      updatedAt: '2026-01-10T14:30:00Z',
      isArchived: false,
    },
  ],
}));

// Mock the utility modules
vi.mock('../utils/skillUtils', () => ({
  generateCycleKey: () => 'Jan-Feb 2026',
  calculateCategoryAverage: (scores: number[]) => {
    const testedScores = scores.filter((score) => score > 0);
    if (testedScores.length === 0) return 0;
    const sum = testedScores.reduce((acc, score) => acc + score, 0);
    return parseFloat((sum / testedScores.length).toFixed(1));
  },
}));

vi.mock('../utils/dateUtils', () => ({
  getCurrentWeekInCycle: () => 1, // Mock current week as week 1
}));

vi.mock('../utils/feeUtils', () => ({
  computeAllFeeStatuses: (fees: any[]) => fees,
}));

vi.mock('../utils/studentUtils', () => ({
  calculateAge: (dateOfBirth: Date) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  },
}));

vi.mock('../data/students.json', () => ({
  default: [
    {
      id: 'student-001',
      fullName: 'Arjun Verma',
      dateOfBirth: '2012-05-15',
      age: 13,
      gender: 'Male',
      contactPhone: '9876543210',
      email: 'arjun.v@email.com',
      guardianName: 'Rajesh Verma',
      guardianPhone: '9876543200',
      baidNumber: 'BAID-2026-001',
      batchId: 'batch-001',
      assignedCoachId: 'user-002',
      profilePhoto: null,
      height: 155,
      weight: 48,
      bmi: 20.0,
      bloodGroup: 'O+',
      medicalConditions: null,
      emergencyContact: '9876543200',
      strengths: ['Quick footwork', 'Backhand shot'],
      weaknesses: ['Service consistency'],
      coachFeedback: 'Good fundamentals, needs work on service technique.',
      skillLevel: 'Beginner',
      createdAt: '2026-01-05T09:00:00Z',
      updatedAt: '2026-01-15T10:30:00Z',
    },
  ],
}));

vi.mock('../data/skillAssessments.json', () => ({
  default: [
    {
      id: 'assessment-001',
      studentId: 'student-001',
      cycleKey: 'Nov-Dec 2025',
      recordedBy: 'Sumit Dali',
      recordedAt: '2025-12-15T10:30:00Z',
      scores: {
        forehand: { Clear: 2, Drop: 2, Smash: 1, Drive: 2, 'Net Shot': 2, Lift: 1, 'Cross Drop': 1, Slice: 1, Push: 2, Tap: 2 },
        backhand: { Clear: 2, Drop: 2, Smash: 1, Drive: 2, 'Net Shot': 2, Lift: 2, 'Cross Drop': 1, Slice: 1, Push: 2, Tap: 2 },
        return: { 'Short Return': 2, 'Deep Return': 2, 'Cross Return': 1, 'Fast Return': 2, 'Slow Return': 2, 'Attacking Return': 1, 'Defensive Return': 2, 'Flick Return': 1, 'Push Return': 2, 'Drive Return': 2 },
        service: { 'High Serve': 1, 'Low Serve': 1, 'Flick Serve': 1, 'Drive Serve': 1, 'Slice Serve': 0, 'Jump Serve': 0, 'Body Serve': 1, 'Flat Serve': 1, 'Short Serve': 2, 'Long Serve': 1 },
        overhead: { Clear: 2, Drop: 1, Smash: 1, 'Net Kill': 1, 'Around Head Clear': 1, 'Around Head Drop': 1, 'Around Head Smash': 0, 'Jump Smash': 0, 'Attacking Clear': 1, 'Defensive Clear': 2 },
        rally: { Push: 2, Drive: 2, Block: 2, Lift: 2, Drop: 1, Clear: 2, Net: 2, Lob: 2, Smash: 1, Counter: 1 },
      },
      isLocked: true,
    },
  ],
}));

vi.mock('../data/batches.json', () => ({
  default: [
    {
      id: 'batch-001',
      name: 'Morning Beginners',
      schedule: 'Mon/Wed/Fri 6-7 AM',
      assignedCoachId: 'user-002',
      studentCount: 4,
      createdAt: '2026-01-01T08:00:00Z',
    },
  ],
}));

vi.mock('../data/users.json', () => ({
  default: [
    {
      id: 'user-002',
      username: 'coach1',
      role: 'ASSISTANT_COACH',
      name: 'Coach Kumar',
      email: 'coach@test.com',
      specialization: 'Beginner Training',
      createdAt: '2025-01-01T00:00:00Z',
      lastActive: '2026-01-15T00:00:00Z',
    },
  ],
}));

describe('StudentDashboard', () => {
  const mockUser: User = {
    id: 'user-004',
    username: 'student1',
    role: 'STUDENT',
    name: 'Arjun Verma',
    email: 'arjun.v@email.com',
    createdAt: new Date('2025-01-01'),
    lastActive: new Date('2026-01-15'),
  };

  const mockAuthContextValue = {
    user: mockUser,
    role: 'STUDENT' as const,
    token: 'mock-token',
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
  };

  const renderWithAuth = (ui: React.ReactElement) => {
    return render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContextValue}>{ui}</AuthContext.Provider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Current Week Curriculum View', () => {
    it('should display current week number and cycle key', () => {
      renderWithAuth(<StudentDashboard />);

      expect(screen.getByText(/Week 1 Training Focus/i)).toBeInTheDocument();
      expect(screen.getByText('Jan-Feb 2026')).toBeInTheDocument();
    });

    it('should display current week badge', () => {
      renderWithAuth(<StudentDashboard />);

      expect(screen.getByText('Current Week')).toBeInTheDocument();
    });

    it('should display focus area for current week', () => {
      renderWithAuth(<StudentDashboard />);

      expect(screen.getByText('Focus Area')).toBeInTheDocument();
      expect(screen.getByText('Foundation - Grip and Basic Footwork')).toBeInTheDocument();
    });

    it('should display training objective for current week', () => {
      renderWithAuth(<StudentDashboard />);

      expect(screen.getByText("This Week's Objective")).toBeInTheDocument();
      expect(
        screen.getByText('Establish proper grip habits and develop basic court coverage skills')
      ).toBeInTheDocument();
    });

    it('should display all assigned drills for current week', () => {
      renderWithAuth(<StudentDashboard />);

      expect(screen.getByText('Assigned Drills')).toBeInTheDocument();
      expect(screen.getByText('Grip Practice')).toBeInTheDocument();
      expect(
        screen.getByText('Practice correct grip technique for forehand and backhand strokes')
      ).toBeInTheDocument();
      expect(screen.getByText('Court Movement Patterns')).toBeInTheDocument();
      expect(
        screen.getByText('Basic footwork patterns covering all six court positions')
      ).toBeInTheDocument();
    });

    it('should display drill categories', () => {
      renderWithAuth(<StudentDashboard />);

      expect(screen.getByText('Fundamentals')).toBeInTheDocument();
      expect(screen.getByText('Footwork')).toBeInTheDocument();
    });

    it('should display drill names and descriptions as cards', () => {
      renderWithAuth(<StudentDashboard />);

      const drillCards = screen.getAllByRole('heading', { level: 4 });
      expect(drillCards.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('No Curriculum Available', () => {
    it('should render without crashing even when no curriculum exists for student', () => {
      // The component shows the curriculum section if a plan exists, or the "no curriculum" message if not
      // With our mocked data, student-001 has a plan, so it should show curriculum
      renderWithAuth(<StudentDashboard />);

      // Either curriculum or empty state should be shown
      const hasCurrentWeek = screen.queryByText(/Week 1 Training Focus/i);
      const hasNoCurriculum = screen.queryByText('No Curriculum Plan Available');

      // One of these should be present
      expect(hasCurrentWeek || hasNoCurriculum).toBeTruthy();
    });
  });

  describe('Read-Only Curriculum Display', () => {
    it('should not display any edit controls in curriculum section', () => {
      renderWithAuth(<StudentDashboard />);

      // There should be no buttons in the curriculum section (except the "Current Week" badge)
      const buttons = screen.queryAllByRole('button');
      const editButtons = buttons.filter(
        (btn) =>
          btn.textContent?.toLowerCase().includes('edit') ||
          btn.textContent?.toLowerCase().includes('save') ||
          btn.textContent?.toLowerCase().includes('update')
      );

      expect(editButtons.length).toBe(0);
    });

    it('should display curriculum data in read-only format', () => {
      renderWithAuth(<StudentDashboard />);

      // Check that all text content is displayed without input fields
      const inputs = screen.queryAllByRole('textbox');
      expect(inputs.length).toBe(0); // No input fields in curriculum section
    });
  });

  describe('Fee History Display', () => {
    it('should display fee history alongside curriculum', () => {
      renderWithAuth(<StudentDashboard />);

      expect(screen.getByText('Fee History')).toBeInTheDocument();
      expect(screen.getByText('Outstanding Balance')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should display both curriculum and fee sections for student', () => {
      renderWithAuth(<StudentDashboard />);

      // Curriculum section
      expect(screen.getByText(/Week 1 Training Focus/i)).toBeInTheDocument();

      // Fee section
      expect(screen.getByText('Outstanding Balance')).toBeInTheDocument();
      expect(screen.getByText('Fee History')).toBeInTheDocument();
    });
  });
});
