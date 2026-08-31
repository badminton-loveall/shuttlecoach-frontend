import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import StudentDashboard from './StudentDashboard';
import { AuthContext } from '../contexts/AuthContext';
import type { User } from '../types';

/**
 * StudentDashboard now sources everything live from the API (a student's
 * users.id === students.id, so GET /students/:id resolves "me" directly).
 * These tests mock apiClient by endpoint rather than local JSON fixtures.
 */

const mockStudent = {
  id: 'user-004',
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
  batchName: 'Morning Beginners',
  assignedCoachName: 'Coach Kumar',
};

const mockAssessment = {
  id: 'assessment-001',
  studentId: 'user-004',
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
};

const mockFee = {
  id: 'fee-001',
  studentId: 'user-004',
  amount: 5000,
  monthYear: '2026-01',
  dueDate: '2026-01-05T00:00:00Z',
  status: 'PAID',
  paidDate: '2026-01-03T00:00:00Z',
  paymentMethod: 'UPI',
  createdAt: '2025-12-20T00:00:00Z',
  updatedAt: '2026-01-03T00:00:00Z',
};

const mockCalendarEntry = {
  date: new Date().toISOString().slice(0, 10),
  dayOfWeek: 'MON',
  startTime: '06:00',
  endTime: '07:00',
  batchId: 'batch-001',
  batchName: 'Morning Beginners',
  weekNumber: 1,
  focusArea: 'Footwork Fundamentals',
  drills: ['Grip Practice', 'Court Movement Patterns'],
  attendanceRecorded: false,
  coachNote: 'Bring extra shuttles',
};

vi.mock('../utils/apiClient', () => ({
  default: {
    get: vi.fn((url: string) => {
      if (url.startsWith('/students/')) {
        return Promise.resolve({ data: mockStudent });
      }
      if (url.startsWith('/assessments')) {
        return Promise.resolve({ data: [mockAssessment] });
      }
      if (url.startsWith('/fees')) {
        return Promise.resolve({ data: [mockFee] });
      }
      if (url.startsWith('/session-calendar')) {
        return Promise.resolve({ data: { entries: [mockCalendarEntry], sessions: [] } });
      }
      if (url.startsWith('/session-notes')) {
        return Promise.resolve({ data: [] });
      }
      if (url.startsWith('/attendance/stats')) {
        return Promise.resolve({ data: { stats: [] } });
      }
      return Promise.resolve({ data: [] });
    }),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
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
    sessionStorage.clear();
  });

  describe('Profile and Batch Info', () => {
    it('should display the student name and batch/coach info from the API', async () => {
      renderWithAuth(<StudentDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Welcome back, Arjun Verma/i)).toBeInTheDocument();
      });

      expect(screen.getAllByText('Morning Beginners').length).toBeGreaterThan(0);
      expect(screen.getByText(/Coach: Coach Kumar/i)).toBeInTheDocument();
    });
  });

  describe('Up Next Session', () => {
    it('should display the next session with focus area and drills', async () => {
      renderWithAuth(<StudentDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Up Next')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('Footwork Fundamentals')).toBeInTheDocument();
      });

      expect(screen.getByText('Grip Practice')).toBeInTheDocument();
      expect(screen.getByText('Court Movement Patterns')).toBeInTheDocument();
    });
  });

  describe('Coach Notes Section', () => {
    it("should display a Coach's Notes section", async () => {
      renderWithAuth(<StudentDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Coach's Notes")).toBeInTheDocument();
      });
    });
  });

  describe('Fee History Display', () => {
    it('should display fee history alongside outstanding balance', async () => {
      renderWithAuth(<StudentDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Fee History')).toBeInTheDocument();
      });

      expect(screen.getByText('Outstanding Balance')).toBeInTheDocument();
    });
  });

  describe('Read-Only Display', () => {
    it('should not display any edit controls', async () => {
      renderWithAuth(<StudentDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Fee History')).toBeInTheDocument();
      });

      const buttons = screen.queryAllByRole('button');
      const editButtons = buttons.filter(
        (btn) =>
          btn.textContent?.toLowerCase().includes('edit') ||
          btn.textContent?.toLowerCase().includes('save') ||
          btn.textContent?.toLowerCase().includes('update')
      );

      expect(editButtons.length).toBe(0);
    });
  });
});
