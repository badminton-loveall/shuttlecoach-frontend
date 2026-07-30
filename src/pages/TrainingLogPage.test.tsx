import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Route, Routes, MemoryRouter } from 'react-router-dom';
import TrainingLogPage from './TrainingLogPage';
import { AuthContext } from '../contexts/AuthContext';
import type { User, UserRole, AuthContext as AuthContextType } from '../types';

// Mock the hooks
vi.mock('../hooks/useTrainingLogs', () => ({
  useTrainingLogs: vi.fn(),
}));

vi.mock('../hooks/useStudent', () => ({
  useStudent: vi.fn(),
}));

import { useTrainingLogs } from '../hooks/useTrainingLogs';
import { useStudent } from '../hooks/useStudent';

const mockUseTrainingLogs = vi.mocked(useTrainingLogs);
const mockUseStudent = vi.mocked(useStudent);

// Mock data
const mockUser: User = {
  id: 'user-002',
  username: 'assistant_coach1',
  role: 'ASSISTANT_COACH' as UserRole,
  name: 'Priya Sharma',
  email: 'priya@shuttlecoach.com',
  createdAt: new Date('2026-01-02'),
  lastActive: new Date('2026-01-14'),
};

const mockAuthContext: AuthContextType = {
  user: mockUser,
  role: 'ASSISTANT_COACH' as UserRole,
  token: 'mock-token',
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
};

const mockStudent = {
  id: 'student-001',
  fullName: 'Arjun Verma',
  dateOfBirth: new Date('2014-03-15'),
  phone: '9876543210',
  status: 'ACTIVE' as const,
  assignedCoachId: 'user-002',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-10'),
};

const mockLogs = [
  {
    id: 'log-001',
    studentId: 'student-001',
    weekNumber: 1 as const,
    cycleKey: 'Jan-Feb 2026',
    sessionNotes: 'First session notes',
    isCompleted: true,
    recordedBy: 'Priya Sharma',
    recordedAt: new Date('2026-01-10T14:30:00Z'),
  },
  {
    id: 'log-002',
    studentId: 'student-001',
    weekNumber: 2 as const,
    cycleKey: 'Jan-Feb 2026',
    sessionNotes: 'Second session notes',
    isCompleted: false,
    recordedBy: 'Priya Sharma',
    recordedAt: new Date('2026-01-17T14:30:00Z'),
  },
];

const mockCreateLog = vi.fn();
const mockRefetch = vi.fn();

// Helper to render with router and auth context
const renderWithContext = (studentId: string, authContext = mockAuthContext) => {
  return render(
    <AuthContext.Provider value={authContext}>
      <MemoryRouter initialEntries={[`/training-log/${studentId}`]}>
        <Routes>
          <Route path="/training-log/:studentId" element={<TrainingLogPage />} />
          <Route path="/students" element={<div>Students List</div>} />
          <Route path="/access-denied" element={<div>Access Denied</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('TrainingLogPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseStudent.mockReturnValue({
      student: mockStudent as any,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseTrainingLogs.mockReturnValue({
      logs: mockLogs as any,
      loading: false,
      error: null,
      createLog: mockCreateLog,
      refetch: mockRefetch,
    });
  });

  it('renders the training log page with student name', () => {
    renderWithContext('student-001');

    expect(screen.getByText(/Training Log -/)).toBeInTheDocument();
    expect(screen.getByText(/Arjun Verma/)).toBeInTheDocument();
  });

  it('displays loading state while data is being fetched', () => {
    mockUseStudent.mockReturnValue({
      student: null,
      loading: true,
      error: null,
      refetch: vi.fn(),
    });

    renderWithContext('student-001');

    expect(screen.getByText(/Loading training logs.../)).toBeInTheDocument();
  });

  it('displays error state when API fails', () => {
    mockUseTrainingLogs.mockReturnValue({
      logs: [],
      loading: false,
      error: 'Failed to load training logs. Please try again.',
      createLog: mockCreateLog,
      refetch: mockRefetch,
    });

    renderWithContext('student-001');

    expect(screen.getByText(/Failed to load training logs/)).toBeInTheDocument();
  });

  it('displays week selector buttons (1-8)', () => {
    renderWithContext('student-001');

    for (let week = 1; week <= 8; week++) {
      expect(screen.getByRole('button', { name: week.toString() })).toBeInTheDocument();
    }
  });

  it('displays current cycle key', () => {
    renderWithContext('student-001');

    expect(screen.getByText(/Current Cycle:/)).toBeInTheDocument();
  });

  it('allows entering session notes', () => {
    renderWithContext('student-001');

    const textarea = screen.getByPlaceholderText(/Describe the training session/);
    fireEvent.change(textarea, { target: { value: 'Great progress today!' } });

    expect(textarea).toHaveValue('Great progress today!');
  });

  it('allows toggling mark completed checkbox', () => {
    renderWithContext('student-001');

    const checkbox = screen.getByRole('checkbox', { name: /Mark week as completed/i });
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('shows error when trying to save without session notes', async () => {
    renderWithContext('student-001');

    const saveButton = screen.getByRole('button', { name: /Save Training Log/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/Please enter session notes before saving/i)).toBeInTheDocument();
    });
  });

  it('calls createLog when saving a training log', async () => {
    mockCreateLog.mockResolvedValue({
      id: 'log-new',
      studentId: 'student-001',
      weekNumber: 2,
      cycleKey: 'Jul-Aug 2026',
      sessionNotes: 'Excellent footwork drills today.',
      isCompleted: true,
      recordedBy: 'Priya Sharma',
      recordedAt: new Date(),
    });

    renderWithContext('student-001');

    // Select week 2
    const week2Button = screen.getByRole('button', { name: '2' });
    fireEvent.click(week2Button);

    // Enter session notes
    const textarea = screen.getByPlaceholderText(/Describe the training session/);
    fireEvent.change(textarea, {
      target: { value: 'Excellent footwork drills today.' },
    });

    // Mark as completed
    const checkbox = screen.getByRole('checkbox', { name: /Mark week as completed/i });
    fireEvent.click(checkbox);

    // Save
    const saveButton = screen.getByRole('button', { name: /Save Training Log/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockCreateLog).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: 'student-001',
          weekNumber: 2,
          sessionNotes: 'Excellent footwork drills today.',
          isCompleted: true,
          recordedBy: 'Priya Sharma',
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Training log saved successfully!/i)).toBeInTheDocument();
    });
  });

  it('displays past training logs sorted by recordedAt descending', () => {
    renderWithContext('student-001');

    // Should display both logs
    expect(screen.getByText('First session notes')).toBeInTheDocument();
    expect(screen.getByText('Second session notes')).toBeInTheDocument();

    // Most recent (log-002, Week 2) should appear first in sorted order
    const logs = screen.getAllByText(/Week \d+ -/);
    expect(logs[0]).toHaveTextContent('Week 2');
    expect(logs[1]).toHaveTextContent('Week 1');
  });

  it('shows completed badge for completed training logs', () => {
    renderWithContext('student-001');

    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('displays coach name who is recording', () => {
    renderWithContext('student-001');

    expect(screen.getByText(/Recording as:/)).toBeInTheDocument();
    const coachNames = screen.getAllByText('Priya Sharma');
    expect(coachNames.length).toBeGreaterThan(0);
  });

  it('displays empty state when no training logs exist', () => {
    mockUseTrainingLogs.mockReturnValue({
      logs: [],
      loading: false,
      error: null,
      createLog: mockCreateLog,
      refetch: mockRefetch,
    });

    renderWithContext('student-001');

    expect(
      screen.getByText(/No training logs recorded yet. Start by adding your first session notes above./i)
    ).toBeInTheDocument();
  });

  it('shows back to student profile button', () => {
    renderWithContext('student-001');

    const backButton = screen.getByRole('button', { name: /Back to Student Profile/i });
    expect(backButton).toBeInTheDocument();
  });

  it('shows error message when createLog fails', async () => {
    mockCreateLog.mockRejectedValue(new Error('Network error'));

    renderWithContext('student-001');

    const textarea = screen.getByPlaceholderText(/Describe the training session/);
    fireEvent.change(textarea, { target: { value: 'Test notes' } });

    const saveButton = screen.getByRole('button', { name: /Save Training Log/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/Error saving training log. Please try again./i)).toBeInTheDocument();
    });
  });
});
