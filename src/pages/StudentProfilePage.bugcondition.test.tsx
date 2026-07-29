import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { StudentProfilePage } from './StudentProfilePage';
import type { User, AuthContext as AuthContextType } from '../types';

/**
 * Bug Condition Exploration Test - Sub-condition 2: Profile Page Miss
 *
 * Validates: Requirements 1.2
 *
 * EXPECTED TO FAIL on unfixed code.
 * The `StudentProfilePage` calls `useStudents()` which fetches page 1 (20 students),
 * then does `students.find(s => s.id === id)`. If the student ID is not in page 1
 * (e.g., student-025), `.find()` returns undefined and the page shows "Student Not Found".
 *
 * The expected behavior is that the page fetches the specific student via
 * `GET /students/:id` directly, so any valid student ID works regardless of pagination.
 */

// Mock DashboardLayout
vi.mock('../components/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock apiClient
vi.mock('../utils/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

import apiClient from '../utils/apiClient';

const mockedApiClient = vi.mocked(apiClient);

// Mock all child components
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

vi.mock('../components/StudentFeeTab', () => ({
  StudentFeeTab: () => <div data-testid="student-fee-tab">Student Fee Tab</div>,
}));

describe('StudentProfilePage - Bug Condition: Profile Page Miss for student not in page 1', () => {
  const mockHeadCoach: User = {
    id: 'user-001',
    username: 'head_coach',
    role: 'HEAD_COACH',
    name: 'Sumit Dali',
    email: 'sumit@shuttlecoach.com',
    createdAt: new Date('2026-01-01T08:00:00Z'),
    lastActive: new Date('2026-01-15T10:30:00Z'),
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

    // Mock GET /students to return page 1 with students student-001 through student-020
    // student-025 is NOT in this list
    const page1Students = Array.from({ length: 20 }, (_, i) => ({
      id: `student-${String(i + 1).padStart(3, '0')}`,
      fullName: `Student ${i + 1}`,
      dateOfBirth: '2010-05-15',
      age: 15,
      gender: 'Male',
      contactPhone: '9876543210',
      baidNumber: `BAID-2026-${String(i + 1).padStart(3, '0')}`,
      batchId: 'batch-001',
      assignedCoachId: 'user-001',
      skillLevel: 'Beginner',
      strengths: [],
      weaknesses: [],
      createdAt: '2026-01-05T09:00:00Z',
      updatedAt: '2026-01-15T10:30:00Z',
    }));

    // The target student (student-025) that should be loaded via GET /students/:id
    const targetStudent = {
      id: 'student-025',
      fullName: 'Rajesh Kumar',
      dateOfBirth: '2009-08-20',
      age: 16,
      gender: 'Male',
      contactPhone: '9876543299',
      baidNumber: 'BAID-2026-025',
      batchId: 'batch-002',
      assignedCoachId: 'user-001',
      skillLevel: 'Intermediate',
      strengths: ['Forehand'],
      weaknesses: ['Backhand'],
      createdAt: '2026-01-10T09:00:00Z',
      updatedAt: '2026-01-20T10:30:00Z',
    };

    mockedApiClient.get.mockImplementation((url: string) => {
      if (url.startsWith('/students?') || url === '/students') {
        // Return page 1 students (does NOT include student-025)
        return Promise.resolve({
          data: {
            students: page1Students,
            total: 30,
            page: 1,
          },
        });
      }
      if (url === '/students/student-025') {
        // Direct fetch for the specific student
        return Promise.resolve({
          data: targetStudent,
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
  });

  it('should display student-025 data even though it is not in page 1 of the list', async () => {
    /**
     * On unfixed code: StudentProfilePage calls useStudents() which fetches
     * GET /students (page 1, 20 students). Then it does students.find(s => s.id === 'student-025')
     * which returns undefined because student-025 is not in page 1.
     * The page then shows "Student Not Found" instead of fetching the student directly.
     *
     * Expected behavior: The page should call GET /students/student-025 directly
     * and display the student's name "Rajesh Kumar".
     */
    const authContext = createMockAuthContext(mockHeadCoach);

    render(
      <MemoryRouter initialEntries={['/student/student-025']}>
        <AuthContext.Provider value={authContext}>
          <Routes>
            <Route path="/student/:id" element={<StudentProfilePage />} />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // The student's name should be visible if properly fetched by ID
    // On unfixed code, this will fail because students.find() returns undefined
    // and the page shows "Student Not Found" instead
    expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
    expect(screen.queryByText('Student Not Found')).not.toBeInTheDocument();
  });
});
