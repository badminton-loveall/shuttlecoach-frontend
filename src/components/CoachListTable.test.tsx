import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CoachListTable from './CoachListTable';
import { ToastProvider } from '../contexts/ToastContext';
import type { User, Student, Batch } from '../types';

// Wrapper providing required context providers
function renderWithProviders(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('CoachListTable', () => {
  const mockCoaches: User[] = [
    {
      id: 'coach-1',
      username: 'assistant1',
      role: 'ASSISTANT_COACH',
      name: 'Priya Sharma',
      email: 'priya@test.com',
      specialization: 'Doubles Training',
      canAccessFees: true,
      createdAt: new Date('2026-01-01'),
      lastActive: new Date('2026-01-15'),
    },
    {
      id: 'coach-2',
      username: 'assistant2',
      role: 'ASSISTANT_COACH',
      name: 'Vikram Singh',
      email: 'vikram@test.com',
      specialization: 'Footwork',
      canAccessFees: false,
      createdAt: new Date('2026-01-01'),
      lastActive: new Date('2026-01-10'),
    },
    {
      id: 'head-1',
      username: 'head',
      role: 'HEAD_COACH',
      name: 'Head Coach',
      email: 'head@test.com',
      canAccessFees: true,
      createdAt: new Date('2026-01-01'),
      lastActive: new Date('2026-01-15'),
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
    {
      id: 'student-3',
      fullName: 'Student Three',
      dateOfBirth: new Date('2010-01-01'),
      age: 16,
      gender: 'Male',
      contactPhone: '1234567892',
      assignedCoachId: 'coach-2',
      batchId: 'batch-2',
      strengths: [],
      weaknesses: [],
      skillLevel: 'Advanced',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockBatches: Batch[] = [
    {
      id: 'batch-1',
      name: 'Morning Batch',
      schedule: 'Mon/Wed/Fri 6-7 AM',
      assignedCoachId: 'coach-1',
      studentCount: 2,
      createdAt: new Date(),
    },
    {
      id: 'batch-2',
      name: 'Evening Batch',
      schedule: 'Tue/Thu 5-6 PM',
      assignedCoachId: 'coach-2',
      studentCount: 1,
      createdAt: new Date(),
    },
  ];

  it('should render coach list table with headers', () => {
    renderWithProviders(
      <CoachListTable coaches={mockCoaches} students={mockStudents} batches={mockBatches} />
    );

    expect(screen.getByText('Coach Name')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
    expect(screen.getByText('Specialization')).toBeInTheDocument();
    expect(screen.getByText('Assigned Batches')).toBeInTheDocument();
    expect(screen.getByText('Assigned Students')).toBeInTheDocument();
    expect(screen.getByText('Fee Access')).toBeInTheDocument();
    expect(screen.getByText('Last Active')).toBeInTheDocument();
  });

  it('should display all coaches including HEAD_COACH', () => {
    renderWithProviders(
      <CoachListTable coaches={mockCoaches} students={mockStudents} batches={mockBatches} />
    );

    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    expect(screen.getByText('Vikram Singh')).toBeInTheDocument();
    // HEAD_COACH user with name "Head Coach" should appear (name + role badge both say "Head Coach")
    expect(screen.getAllByText('Head Coach').length).toBeGreaterThanOrEqual(1);
  });

  it('should display role labels for each coach', () => {
    renderWithProviders(
      <CoachListTable coaches={mockCoaches} students={mockStudents} batches={mockBatches} />
    );

    expect(screen.getAllByText('Assistant Coach')).toHaveLength(2);
    // "Head Coach" appears as both name and role badge
    expect(screen.getAllByText('Head Coach').length).toBeGreaterThanOrEqual(2);
  });

  it('should display correct assigned student count for each coach', () => {
    renderWithProviders(
      <CoachListTable coaches={mockCoaches} students={mockStudents} batches={mockBatches} />
    );

    const rows = screen.getAllByRole('row');
    
    // Coach 1 should have 2 students
    const coach1Row = rows.find((row) => row.textContent?.includes('Priya Sharma'));
    expect(coach1Row?.textContent).toContain('2');

    // Coach 2 should have 1 student
    const coach2Row = rows.find((row) => row.textContent?.includes('Vikram Singh'));
    expect(coach2Row?.textContent).toContain('1');
  });

  it('should display correct assigned batch count for each coach', () => {
    renderWithProviders(
      <CoachListTable coaches={mockCoaches} students={mockStudents} batches={mockBatches} />
    );

    const rows = screen.getAllByRole('row');
    
    // Coach 1 should have 1 batch
    const coach1Row = rows.find((row) => row.textContent?.includes('Priya Sharma'));
    expect(coach1Row?.textContent).toContain('1');

    // Coach 2 should have 1 batch
    const coach2Row = rows.find((row) => row.textContent?.includes('Vikram Singh'));
    expect(coach2Row?.textContent).toContain('1');
  });

  it('should display coach specialization', () => {
    renderWithProviders(
      <CoachListTable coaches={mockCoaches} students={mockStudents} batches={mockBatches} />
    );

    expect(screen.getByText('Doubles Training')).toBeInTheDocument();
    expect(screen.getByText('Footwork')).toBeInTheDocument();
  });

  it('should display empty state when no coaches', () => {
    renderWithProviders(
      <CoachListTable coaches={[]} students={[]} batches={[]} />
    );

    expect(screen.getByText('No coaches found')).toBeInTheDocument();
  });

  it('should handle coaches with no assignments', () => {
    const unassignedCoach: User[] = [
      {
        id: 'coach-3',
        username: 'assistant3',
        role: 'ASSISTANT_COACH',
        name: 'New Coach',
        email: 'new@test.com',
        specialization: 'Service',
        canAccessFees: false,
        createdAt: new Date('2026-01-01'),
        lastActive: new Date('2026-01-15'),
      },
    ];

    renderWithProviders(
      <CoachListTable coaches={unassignedCoach} students={[]} batches={[]} />
    );

    expect(screen.getByText('New Coach')).toBeInTheDocument();
    
    const rows = screen.getAllByRole('row');
    const coachRow = rows.find((row) => row.textContent?.includes('New Coach'));
    expect(coachRow?.textContent).toContain('0');
  });

  it('should not display coach email', () => {
    renderWithProviders(
      <CoachListTable coaches={mockCoaches} students={mockStudents} batches={mockBatches} />
    );

    expect(screen.queryByText('priya@test.com')).not.toBeInTheDocument();
    expect(screen.queryByText('vikram@test.com')).not.toBeInTheDocument();
  });

  it('should show "Always on" label for HEAD_COACH fee toggle', () => {
    renderWithProviders(
      <CoachListTable coaches={mockCoaches} students={mockStudents} batches={mockBatches} />
    );

    expect(screen.getByText('Always on')).toBeInTheDocument();
  });

  it('should render fee access toggles for each coach', () => {
    renderWithProviders(
      <CoachListTable coaches={mockCoaches} students={mockStudents} batches={mockBatches} />
    );

    // Should have 3 toggle switches (one per coach)
    const toggles = screen.getAllByRole('switch');
    expect(toggles).toHaveLength(3);
  });

  it('should disable fee toggle for HEAD_COACH', () => {
    renderWithProviders(
      <CoachListTable coaches={mockCoaches} students={mockStudents} batches={mockBatches} />
    );

    const toggles = screen.getAllByRole('switch');
    // HEAD_COACH toggle (last in list) should be disabled
    const headCoachToggle = toggles.find(
      (t) => t.getAttribute('aria-label') === 'Fee access always enabled for Head Coach'
    );
    expect(headCoachToggle).toBeDisabled();
  });

  it('should not show Delete button for HEAD_COACH', () => {
    renderWithProviders(
      <CoachListTable coaches={mockCoaches} students={mockStudents} batches={mockBatches} />
    );

    // Should have 2 delete buttons (for assistant coaches only)
    const deleteButtons = screen.getAllByTitle('Delete coach');
    expect(deleteButtons).toHaveLength(2);
  });

  it('should work without batches data', () => {
    renderWithProviders(
      <CoachListTable coaches={mockCoaches} students={mockStudents} />
    );

    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    expect(screen.getByText('Vikram Singh')).toBeInTheDocument();
  });
});
