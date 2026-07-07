import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddStudentModal } from './AddStudentModal';
import type { Student, Batch } from '../types';
import apiClient from '../utils/apiClient';

// Mock API client
vi.mock('../utils/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('AddStudentModal', () => {
  const mockBatches: Batch[] = [
    {
      id: 'batch-1',
      name: 'Morning Batch',
      schedule: 'Mon-Wed-Fri 7-8 AM',
      assignedCoachId: 'coach-1',
      studentCount: 5,
      createdAt: new Date(),
    },
    {
      id: 'batch-2',
      name: 'Evening Batch',
      schedule: 'Tue-Thu 5-6 PM',
      assignedCoachId: 'coach-1',
      studentCount: 8,
      createdAt: new Date(),
    },
  ];

  const mockStudents: Student[] = [
    {
      id: 'student-1',
      fullName: 'John Doe',
      age: 12,
      gender: 'Male',
      contactPhone: '9876543210',
      skillLevel: 'Beginner',
      batchId: undefined,
      assignedCoachId: undefined,
      dateOfBirth: new Date('2012-01-15'),
      createdAt: new Date(),
      updatedAt: new Date(),
      strengths: [],
      weaknesses: [],
    },
    {
      id: 'student-2',
      fullName: 'Jane Smith',
      age: 14,
      gender: 'Female',
      contactPhone: '9876543211',
      skillLevel: 'Intermediate',
      batchId: undefined,
      assignedCoachId: undefined,
      dateOfBirth: new Date('2010-05-20'),
      createdAt: new Date(),
      updatedAt: new Date(),
      strengths: [],
      weaknesses: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when modal is closed', () => {
    const { container } = render(
      <AddStudentModal
        isOpen={false}
        onClose={vi.fn()}
        onStudentAssigned={vi.fn()}
        coachId="coach-1"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('displays loading state while fetching students', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: mockStudents });

    render(
      <AddStudentModal
        isOpen={true}
        onClose={vi.fn()}
        onStudentAssigned={vi.fn()}
        coachId="coach-1"
        availableBatches={mockBatches}
      />
    );

    // Should show loading skeletons initially
    const skeletons = screen.getAllByRole('generic').filter((el) =>
      el.className.includes('animate-pulse')
    );
    expect(skeletons.length).toBeGreaterThan(0);

    // Wait for students to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('fetches and displays available students', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: mockStudents });

    render(
      <AddStudentModal
        isOpen={true}
        onClose={vi.fn()}
        onStudentAssigned={vi.fn()}
        coachId="coach-1"
        availableBatches={mockBatches}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('filters out already assigned students', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: mockStudents });

    render(
      <AddStudentModal
        isOpen={true}
        onClose={vi.fn()}
        onStudentAssigned={vi.fn()}
        coachId="coach-1"
        currentAssignedStudentIds={['student-1']}
        availableBatches={mockBatches}
      />
    );

    await waitFor(() => {
      // Only Jane Smith should be displayed
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  it('displays error when no students are available', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: [] });

    render(
      <AddStudentModal
        isOpen={true}
        onClose={vi.fn()}
        onStudentAssigned={vi.fn()}
        coachId="coach-1"
        currentAssignedStudentIds={['student-1', 'student-2']}
        availableBatches={mockBatches}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No Available Students')).toBeInTheDocument();
    });
  });

  it('selects first student by default', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: mockStudents });

    render(
      <AddStudentModal
        isOpen={true}
        onClose={vi.fn()}
        onStudentAssigned={vi.fn()}
        coachId="coach-1"
        availableBatches={mockBatches}
      />
    );

    await waitFor(() => {
      const firstStudentRadio = screen.getByRole('radio', {
        name: /select student: john doe/i,
      }) as HTMLInputElement;
      expect(firstStudentRadio.checked).toBe(true);
    });
  });

  it('allows user to select different students', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: mockStudents });

    render(
      <AddStudentModal
        isOpen={true}
        onClose={vi.fn()}
        onStudentAssigned={vi.fn()}
        coachId="coach-1"
        availableBatches={mockBatches}
      />
    );

    await waitFor(() => {
      const janeRadio = screen.getByRole('radio', {
        name: /select student: jane smith/i,
      }) as HTMLInputElement;
      fireEvent.click(janeRadio);
      expect(janeRadio.checked).toBe(true);
    });
  });

  it('displays batch selection dropdown', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: mockStudents });

    render(
      <AddStudentModal
        isOpen={true}
        onClose={vi.fn()}
        onStudentAssigned={vi.fn()}
        coachId="coach-1"
        availableBatches={mockBatches}
      />
    );

    // Check for batch selection label
    await waitFor(() => {
      expect(screen.getByText('Select Batch *')).toBeInTheDocument();
    });

    // Check for batch options in the select
    const batchSelect = screen.getByRole('combobox') as HTMLSelectElement;
    expect(batchSelect).toBeInTheDocument();
    expect(batchSelect.options.length).toBeGreaterThan(1); // At least 1 option + default
  });

  it('assigns student to coach when form submitted', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: mockStudents });
    (apiClient.post as any).mockResolvedValueOnce({ data: { success: true } });

    const onStudentAssigned = vi.fn();
    const { rerender } = render(
      <AddStudentModal
        isOpen={true}
        onClose={vi.fn()}
        onStudentAssigned={onStudentAssigned}
        coachId="coach-1"
        availableBatches={mockBatches}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click assign button
    const assignButton = screen.getByText('Assign Student');
    fireEvent.click(assignButton);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(`/coaches/coach-1/students`, {
        studentId: 'student-1',
        batchId: 'batch-1',
      });
      expect(onStudentAssigned).toHaveBeenCalledWith('student-1');
    });
  });

  it('displays error when API call fails', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: mockStudents });
    (apiClient.post as any).mockRejectedValueOnce(
      new Error('API Error')
    );

    render(
      <AddStudentModal
        isOpen={true}
        onClose={vi.fn()}
        onStudentAssigned={vi.fn()}
        coachId="coach-1"
        availableBatches={mockBatches}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const assignButton = screen.getByText('Assign Student');
    fireEvent.click(assignButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to assign student/i)).toBeInTheDocument();
    });
  });

  it('closes modal on close button click', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: mockStudents });
    const onClose = vi.fn();

    render(
      <AddStudentModal
        isOpen={true}
        onClose={onClose}
        onStudentAssigned={vi.fn()}
        coachId="coach-1"
        availableBatches={mockBatches}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: 'Close modal' });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('closes modal on cancel button click', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: mockStudents });
    const onClose = vi.fn();

    render(
      <AddStudentModal
        isOpen={true}
        onClose={onClose}
        onStudentAssigned={vi.fn()}
        coachId="coach-1"
        availableBatches={mockBatches}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('closes modal on overlay click', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: mockStudents });
    const onClose = vi.fn();

    const { container } = render(
      <AddStudentModal
        isOpen={true}
        onClose={onClose}
        onStudentAssigned={vi.fn()}
        coachId="coach-1"
        availableBatches={mockBatches}
      />
    );

    // Find the overlay
    const overlay = container.querySelector('.modal-overlay');
    if (overlay) {
      fireEvent.click(overlay);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('prevents modal close during assignment', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: mockStudents });
    (apiClient.post as any).mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ data: { success: true } }), 500)
        )
    );

    const onClose = vi.fn();
    render(
      <AddStudentModal
        isOpen={true}
        onClose={onClose}
        onStudentAssigned={vi.fn()}
        coachId="coach-1"
        availableBatches={mockBatches}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const assignButton = screen.getByText('Assign Student');
    fireEvent.click(assignButton);

    // Try to close while assigning
    const closeButton = screen.getByRole('button', { name: 'Close modal' });
    expect(closeButton).toBeDisabled();
  });

  it('displays error when no batch selected', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: mockStudents });

    render(
      <AddStudentModal
        isOpen={true}
        onClose={vi.fn()}
        onStudentAssigned={vi.fn()}
        coachId="coach-1"
        availableBatches={[]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No batches available for this coach')).toBeInTheDocument();
    });
  });
});
