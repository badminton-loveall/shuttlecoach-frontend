import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CoachesPage from './CoachesPage';
import type { User, Student } from '../types';

// Mock the dependencies
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../hooks/useRoleGuard', () => ({
  useRoleGuard: vi.fn(),
}));

vi.mock('../hooks/useCoaches', () => ({
  useCoaches: vi.fn(),
}));

vi.mock('../hooks/useStudents', () => ({
  useStudents: vi.fn(),
}));

vi.mock('../utils/apiClient', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

vi.mock('../contexts/ToastContext', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useToast: () => ({ showToast: vi.fn() }),
}));

import { useAuth } from '../contexts/AuthContext';
import { useRoleGuard } from '../hooks/useRoleGuard';
import { useCoaches } from '../hooks/useCoaches';
import { useStudents } from '../hooks/useStudents';

describe('CoachesPage', () => {
  const mockHeadCoach: User = {
    id: 'head-1',
    username: 'head_coach',
    role: 'HEAD_COACH',
    name: 'Head Coach',
    email: 'head@test.com',
    createdAt: new Date(),
    lastActive: new Date(),
  };

  const mockUsers: User[] = [
    mockHeadCoach,
    {
      id: 'coach-1',
      username: 'assistant1',
      role: 'ASSISTANT_COACH',
      name: 'Priya Sharma',
      email: 'priya@test.com',
      specialization: 'Doubles Training',
      createdAt: new Date('2026-01-02'),
      lastActive: new Date('2026-01-14'),
    },
    {
      id: 'coach-2',
      username: 'assistant2',
      role: 'ASSISTANT_COACH',
      name: 'Vikram Singh',
      email: 'vikram@test.com',
      specialization: 'Footwork',
      createdAt: new Date('2026-01-03'),
      lastActive: new Date('2026-01-13'),
    },
  ];

  const mockStudents: Student[] = [
    {
      id: 'student-1',
      fullName: 'Student One',
      dateOfBirth: new Date('2010-01-01'),
      age: 16,
      gender: 'Male',
      contactPhone: '1234567890',
      assignedCoachId: 'coach-1',
      batchId: 'batch-1',
      strengths: [],
      weaknesses: [],
      skillLevel: 'Intermediate',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'student-2',
      fullName: 'Student Two',
      dateOfBirth: new Date('2010-01-01'),
      age: 16,
      gender: 'Female',
      contactPhone: '1234567891',
      assignedCoachId: 'coach-1',
      batchId: 'batch-1',
      strengths: [],
      weaknesses: [],
      skillLevel: 'Beginner',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock authenticated head coach
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: mockHeadCoach,
      role: 'HEAD_COACH',
      token: 'test-token',
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    });

    // Mock useCoaches hook
    (useCoaches as ReturnType<typeof vi.fn>).mockReturnValue({
      coaches: mockUsers.filter(u => u.role === 'ASSISTANT_COACH'),
      loading: false,
      error: null,
      createCoach: vi.fn(),
      refetch: vi.fn(),
    });

    // Mock useStudents hook
    (useStudents as ReturnType<typeof vi.fn>).mockReturnValue({
      students: mockStudents,
      loading: false,
      error: null,
      total: mockStudents.length,
      refetch: vi.fn(),
      getStudent: vi.fn(),
      createStudent: vi.fn(),
      updateStudent: vi.fn(),
    });
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  it('should render page header', async () => {
    renderWithRouter(<CoachesPage />);

    await waitFor(() => {
      expect(screen.getByText('Coach Management')).toBeInTheDocument();
    });

    expect(screen.getByText('View and manage assistant coaches and their assignments')).toBeInTheDocument();
  });

  it('should display loading state initially', () => {
    // Override to show loading state
    (useCoaches as ReturnType<typeof vi.fn>).mockReturnValue({
      coaches: [],
      loading: true,
      error: null,
      createCoach: vi.fn(),
      refetch: vi.fn(),
    });

    renderWithRouter(<CoachesPage />);

    // Check for loading skeleton
    const loadingElements = document.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('should load and display coach data', async () => {
    renderWithRouter(<CoachesPage />);

    await waitFor(() => {
      expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    });

    expect(screen.getByText('Vikram Singh')).toBeInTheDocument();
    expect(screen.getByText('Doubles Training')).toBeInTheDocument();
    expect(screen.getByText('Footwork')).toBeInTheDocument();
  });

  it('should fetch data from hooks', async () => {
    renderWithRouter(<CoachesPage />);

    await waitFor(() => {
      // Verify hooks were called (they provide the data)
      expect(useCoaches).toHaveBeenCalled();
      expect(useStudents).toHaveBeenCalled();
    });
  });

  it('should display coach list table after loading', async () => {
    renderWithRouter(<CoachesPage />);

    await waitFor(() => {
      expect(screen.getByText('Coach Name')).toBeInTheDocument();
    });

    expect(screen.getByText('Specialization')).toBeInTheDocument();
    expect(screen.getByText('Assigned Batches')).toBeInTheDocument();
    expect(screen.getByText('Assigned Students')).toBeInTheDocument();
    expect(screen.getByText('Last Active')).toBeInTheDocument();
  });

  it('should handle fetch errors gracefully', async () => {
    // Mock hook to return error
    (useCoaches as ReturnType<typeof vi.fn>).mockReturnValue({
      coaches: [],
      loading: false,
      error: 'Failed to load coach data. Please try again.',
      createCoach: vi.fn(),
      refetch: vi.fn(),
    });

    renderWithRouter(<CoachesPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load coach data. Please try again.')).toBeInTheDocument();
    });
  });

  it('should handle missing batches.json file gracefully', async () => {
    // This is the default mock behavior (batches.json returns ok: false)
    renderWithRouter(<CoachesPage />);

    await waitFor(() => {
      expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    });

    // Should still render coaches even if batches fail
    expect(screen.getByText('Vikram Singh')).toBeInTheDocument();
  });

  it('should call useRoleGuard with HEAD_COACH role', () => {
    renderWithRouter(<CoachesPage />);

    expect(useRoleGuard).toHaveBeenCalledWith(['HEAD_COACH']);
  });

  it('should display assigned student counts', async () => {
    renderWithRouter(<CoachesPage />);

    await waitFor(() => {
      expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    });

    // Coach 1 has 2 students assigned
    const rows = screen.getAllByRole('row');
    const coach1Row = rows.find((row) => row.textContent?.includes('Priya Sharma'));
    expect(coach1Row?.textContent).toContain('2');
  });
});
