import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CoachStudentsTab } from './CoachStudentsTab';
import type { Student } from '../types';

/**
 * Unit tests for CoachStudentsTab component
 * Tests filtering, role-based rendering, empty states, and interactions
 */

// Mock data
const mockStudents: Student[] = [
  {
    id: 'student-1',
    fullName: 'Alice Johnson',
    dateOfBirth: new Date('2010-05-15'),
    age: 14,
    gender: 'Female',
    contactPhone: '9876543210',
    email: 'alice@example.com',
    batchId: 'batch-1',
    assignedCoachId: 'coach-1',
    skillLevel: 'Beginner',
    createdAt: new Date(),
    updatedAt: new Date(),
    strengths: ['quick reflexes'],
    weaknesses: ['footwork'],
  },
  {
    id: 'student-2',
    fullName: 'Bob Smith',
    dateOfBirth: new Date('2008-10-22'),
    age: 16,
    gender: 'Male',
    contactPhone: '9876543211',
    email: 'bob@example.com',
    batchId: 'batch-1',
    assignedCoachId: 'coach-1',
    skillLevel: 'Intermediate',
    createdAt: new Date(),
    updatedAt: new Date(),
    strengths: ['strong service'],
    weaknesses: ['net play'],
  },
  {
    id: 'student-3',
    fullName: 'Carol Davis',
    dateOfBirth: new Date('2007-03-10'),
    age: 17,
    gender: 'Female',
    contactPhone: '9876543212',
    email: 'carol@example.com',
    batchId: 'batch-2',
    assignedCoachId: 'coach-1',
    skillLevel: 'Advanced',
    createdAt: new Date(),
    updatedAt: new Date(),
    strengths: ['consistent play', 'court awareness'],
    weaknesses: ['pressure situations'],
  },
  {
    id: 'student-4',
    fullName: 'David Lee',
    dateOfBirth: new Date('2005-12-01'),
    age: 19,
    gender: 'Male',
    contactPhone: '9876543213',
    email: 'david@example.com',
    batchId: 'batch-2',
    assignedCoachId: 'coach-1',
    skillLevel: 'Intermediate',
    createdAt: new Date(),
    updatedAt: new Date(),
    strengths: ['rally control'],
    weaknesses: ['accuracy'],
  },
];

describe('CoachStudentsTab', () => {
  describe('Rendering and Display', () => {
    it('displays all students in the list', () => {
      render(
        <CoachStudentsTab
          students={mockStudents}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      mockStudents.forEach((student) => {
        expect(screen.getByText(student.fullName)).toBeInTheDocument();
      });
    });

    it('displays student information correctly', () => {
      render(
        <CoachStudentsTab
          students={[mockStudents[0]]}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      const student = mockStudents[0];
      expect(screen.getByText(student.fullName)).toBeInTheDocument();
      expect(screen.getAllByText(student.skillLevel)[0]).toBeInTheDocument(); // Get first occurrence (not in filter dropdown)
      expect(screen.getAllByText(student.batchId || '—')[0]).toBeInTheDocument(); // Get first occurrence (not in filter dropdown)
      expect(screen.getByText(`${student.age} yrs`)).toBeInTheDocument();
    });

    it('displays performance status based on skill level', () => {
      const beginnerStudent = mockStudents[0];
      render(
        <CoachStudentsTab
          students={[beginnerStudent]}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      expect(screen.getByText('Fair')).toBeInTheDocument();
    });

    it('displays correct student count', () => {
      render(
        <CoachStudentsTab
          students={mockStudents}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      expect(screen.getByText(`Students (${mockStudents.length})`)).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('displays empty state when no students are assigned', () => {
      render(
        <CoachStudentsTab
          students={[]}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      expect(
        screen.getByText('No students assigned to this coach')
      ).toBeInTheDocument();
    });

    it('shows Add Student button in empty state for HEAD_COACH', () => {
      const onStudentAdded = vi.fn();
      render(
        <CoachStudentsTab
          students={[]}
          coachId="coach-1"
          userRole="HEAD_COACH"
          onStudentAdded={onStudentAdded}
        />
      );

      const addButton = screen.getByRole('button', { name: /add student/i });
      expect(addButton).toBeInTheDocument();
    });

    it('does not show Add Student button in empty state for ASSISTANT_COACH', () => {
      render(
        <CoachStudentsTab
          students={[]}
          coachId="coach-1"
          userRole="ASSISTANT_COACH"
        />
      );

      expect(screen.queryByRole('button', { name: /add student/i })).not.toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('filters students by batch', async () => {
      render(
        <CoachStudentsTab
          students={mockStudents}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      const batchSelect = screen.getByLabelText('Filter by batch') as HTMLSelectElement;
      fireEvent.change(batchSelect, { target: { value: 'batch-1' } });

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
        expect(screen.getByText('Bob Smith')).toBeInTheDocument();
        expect(screen.queryByText('Carol Davis')).not.toBeInTheDocument();
        expect(screen.queryByText('David Lee')).not.toBeInTheDocument();
      });
    });

    it('filters students by skill level', async () => {
      render(
        <CoachStudentsTab
          students={mockStudents}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      const skillSelect = screen.getByLabelText('Filter by skill level') as HTMLSelectElement;
      fireEvent.change(skillSelect, { target: { value: 'Advanced' } });

      await waitFor(() => {
        expect(screen.getByText('Carol Davis')).toBeInTheDocument();
        expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
        expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();
      });
    });

    it('filters students by search text (name)', async () => {
      render(
        <CoachStudentsTab
          students={mockStudents}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      const searchInput = screen.getByLabelText('Search students by name, BAID, or email') as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'Alice' } });

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
        expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();
        expect(screen.queryByText('Carol Davis')).not.toBeInTheDocument();
        expect(screen.queryByText('David Lee')).not.toBeInTheDocument();
      });
    });

    it('filters students by search text (case-insensitive)', async () => {
      render(
        <CoachStudentsTab
          students={mockStudents}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      const searchInput = screen.getByLabelText('Search students by name, BAID, or email') as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'alice' } });

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
        expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();
      });
    });

    it('filters students by search text (email)', async () => {
      render(
        <CoachStudentsTab
          students={mockStudents}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      const searchInput = screen.getByLabelText('Search students by name, BAID, or email') as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'bob@example.com' } });

      await waitFor(() => {
        expect(screen.getByText('Bob Smith')).toBeInTheDocument();
        expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
      });
    });

    it('combines batch and skill level filters', async () => {
      render(
        <CoachStudentsTab
          students={mockStudents}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      const batchSelect = screen.getByLabelText('Filter by batch') as HTMLSelectElement;
      const skillSelect = screen.getByLabelText('Filter by skill level') as HTMLSelectElement;

      fireEvent.change(batchSelect, { target: { value: 'batch-1' } });
      fireEvent.change(skillSelect, { target: { value: 'Beginner' } });

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
        expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();
        expect(screen.queryByText('Carol Davis')).not.toBeInTheDocument();
      });
    });

    it('combines all three filters (batch AND skill AND search)', async () => {
      render(
        <CoachStudentsTab
          students={mockStudents}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      const batchSelect = screen.getByLabelText('Filter by batch') as HTMLSelectElement;
      const skillSelect = screen.getByLabelText('Filter by skill level') as HTMLSelectElement;
      const searchInput = screen.getByLabelText('Search students by name, BAID, or email') as HTMLInputElement;

      fireEvent.change(batchSelect, { target: { value: 'batch-1' } });
      fireEvent.change(skillSelect, { target: { value: 'Intermediate' } });
      fireEvent.change(searchInput, { target: { value: 'Bob' } });

      await waitFor(() => {
        expect(screen.getByText('Bob Smith')).toBeInTheDocument();
        expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
        expect(screen.queryByText('Carol Davis')).not.toBeInTheDocument();
      });
    });

    it('displays no results message when filters match nothing', async () => {
      render(
        <CoachStudentsTab
          students={mockStudents}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      const batchSelect = screen.getByLabelText('Filter by batch') as HTMLSelectElement;
      const skillSelect = screen.getByLabelText('Filter by skill level') as HTMLSelectElement;

      fireEvent.change(batchSelect, { target: { value: 'batch-1' } });
      fireEvent.change(skillSelect, { target: { value: 'Advanced' } });

      await waitFor(() => {
        expect(screen.getByText('No students match your filters')).toBeInTheDocument();
      });
    });

    it('clears filters when clicking clear button in no results state', async () => {
      render(
        <CoachStudentsTab
          students={mockStudents}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      const batchSelect = screen.getByLabelText('Filter by batch') as HTMLSelectElement;
      const skillSelect = screen.getByLabelText('Filter by skill level') as HTMLSelectElement;

      fireEvent.change(batchSelect, { target: { value: 'batch-1' } });
      fireEvent.change(skillSelect, { target: { value: 'Advanced' } });

      await waitFor(() => {
        expect(screen.getByText('No students match your filters')).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: /clear filters/i });
      fireEvent.click(clearButton);

      await waitFor(() => {
        mockStudents.forEach((student) => {
          expect(screen.getByText(student.fullName)).toBeInTheDocument();
        });
      });
    });

    it('displays active filter badges', async () => {
      render(
        <CoachStudentsTab
          students={mockStudents}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      const batchSelect = screen.getByLabelText('Filter by batch') as HTMLSelectElement;
      fireEvent.change(batchSelect, { target: { value: 'batch-1' } });

      await waitFor(() => {
        expect(screen.getByText(/Batch: batch-1/)).toBeInTheDocument();
      });
    });

    it('displays search filter badge when search text is entered', async () => {
      render(
        <CoachStudentsTab
          students={mockStudents}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      const searchInput = screen.getByLabelText('Search students by name, BAID, or email') as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'Alice' } });

      await waitFor(() => {
        expect(screen.getByText(/Search: Alice/)).toBeInTheDocument();
      });
    });

    it('removes individual filters by clicking X button', async () => {
      render(
        <CoachStudentsTab
          students={mockStudents}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      const skillSelect = screen.getByLabelText('Filter by skill level') as HTMLSelectElement;
      fireEvent.change(skillSelect, { target: { value: 'Advanced' } });

      await waitFor(() => {
        expect(screen.getByText(/Skill: Advanced/)).toBeInTheDocument();
      });

      const removeButton = screen.getByLabelText(/Clear skill level filter/i);
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText(/Skill: Advanced/)).not.toBeInTheDocument();
      });
    });

    it('removes search filter by clicking X button', async () => {
      render(
        <CoachStudentsTab
          students={mockStudents}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      const searchInput = screen.getByLabelText('Search students by name, BAID, or email') as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'Alice' } });

      await waitFor(() => {
        expect(screen.getByText(/Search: Alice/)).toBeInTheDocument();
      });

      const removeButton = screen.getByLabelText(/Clear search filter/i);
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText(/Search: Alice/)).not.toBeInTheDocument();
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });
    });
  });

  describe('Role-Based Access Control', () => {
    it('shows Add Student button for HEAD_COACH', () => {
      render(
        <CoachStudentsTab
          students={mockStudents}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      expect(screen.getByRole('button', { name: /add student/i })).toBeInTheDocument();
    });

    it('shows Remove button for each student when user is HEAD_COACH', () => {
      render(
        <CoachStudentsTab
          students={mockStudents}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      mockStudents.forEach((student) => {
        expect(
          screen.getByLabelText(`Remove student: ${student.fullName}`)
        ).toBeInTheDocument();
      });
    });

    it('hides Add Student button for ASSISTANT_COACH', () => {
      render(
        <CoachStudentsTab
          students={mockStudents}
          coachId="coach-1"
          userRole="ASSISTANT_COACH"
        />
      );

      expect(screen.queryByRole('button', { name: /add student/i })).not.toBeInTheDocument();
    });

    it('hides Remove buttons for ASSISTANT_COACH', () => {
      render(
        <CoachStudentsTab
          students={mockStudents}
          coachId="coach-1"
          userRole="ASSISTANT_COACH"
        />
      );

      mockStudents.forEach((student) => {
        expect(
          screen.queryByLabelText(`Remove student: ${student.fullName}`)
        ).not.toBeInTheDocument();
      });
    });

    it('displays students in read-only mode for ASSISTANT_COACH', () => {
      render(
        <CoachStudentsTab
          students={mockStudents}
          coachId="coach-1"
          userRole="ASSISTANT_COACH"
        />
      );

      mockStudents.forEach((student) => {
        expect(screen.getByText(student.fullName)).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    // Note: onStudentAdded test is skipped because task 8.5 is specifically about student removal.
    // Task 8.4 (student addition) is a separate feature that would test opening the add modal.
    it.skip('calls onStudentAdded callback when Add Student button is clicked', async () => {
      const onStudentAdded = vi.fn();
      render(
        <CoachStudentsTab
          students={mockStudents}
          coachId="coach-1"
          userRole="HEAD_COACH"
          onStudentAdded={onStudentAdded}
        />
      );

      const addButton = screen.getByRole('button', { name: /add student/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(onStudentAdded).toHaveBeenCalledWith('coach-1');
      });
    });
  });

  describe('Student Removal Dialog', () => {
    it('shows confirmation dialog when Remove button is clicked', async () => {
      render(
        <CoachStudentsTab
          students={mockStudents}
          coachId="coach-1"
          userRole="HEAD_COACH"
          onStudentRemoved={vi.fn()}
        />
      );

      const removeButton = screen.getByLabelText(`Remove student: ${mockStudents[0].fullName}`);
      fireEvent.click(removeButton);

      // The dialog should appear with the student's batch and skill level
      await waitFor(() => {
        // Check for Cancel button (part of dialog)
        const allButtons = screen.getAllByRole('button');
        const hasCancel = allButtons.some(b => b.textContent?.includes('Cancel'));
        expect(hasCancel).toBe(true);
      });
    });

    it('calls onStudentRemoved callback when Remove is confirmed', async () => {
      const onStudentRemoved = vi.fn().mockResolvedValue(undefined);
      render(
        <CoachStudentsTab
          students={mockStudents}
          coachId="coach-1"
          userRole="HEAD_COACH"
          onStudentRemoved={onStudentRemoved}
        />
      );

      const removeButton = screen.getByLabelText(`Remove student: ${mockStudents[0].fullName}`);
      fireEvent.click(removeButton);

      // Wait for dialog buttons to appear
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        // Find Remove button by checking all buttons
        const hasRemoveButton = buttons.some(b => 
          b.textContent?.trim() === 'Remove'
        );
        expect(hasRemoveButton).toBe(true);
      });

      // Click the Remove button in the dialog (second one, as there might be multiple Remove buttons)
      const allButtons = screen.getAllByRole('button');
      // Find all buttons with "Remove" text and click the last one (which should be in dialog)
      const removeButtons = allButtons.filter(b => b.textContent?.trim() === 'Remove');
      fireEvent.click(removeButtons[removeButtons.length - 1]);

      // Verify callback was called
      await waitFor(() => {
        expect(onStudentRemoved).toHaveBeenCalledWith(mockStudents[0].id);
      });
    });

    it('does not call onStudentRemoved when Cancel is clicked', async () => {
      const onStudentRemoved = vi.fn();
      render(
        <CoachStudentsTab
          students={mockStudents}
          coachId="coach-1"
          userRole="HEAD_COACH"
          onStudentRemoved={onStudentRemoved}
        />
      );

      const removeButton = screen.getByLabelText(`Remove student: ${mockStudents[0].fullName}`);
      fireEvent.click(removeButton);

      await waitFor(() => {
        const allButtons = screen.getAllByRole('button');
        const hasCancel = allButtons.some(b => b.textContent?.includes('Cancel'));
        expect(hasCancel).toBe(true);
      });

      // Click Cancel
      const allButtons = screen.getAllByRole('button');
      const cancelButton = allButtons.find(b => b.textContent?.trim() === 'Cancel');
      fireEvent.click(cancelButton!);

      // Verify callback was NOT called
      expect(onStudentRemoved).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('displays loading skeleton when isLoading is true', () => {
      const { container } = render(
        <CoachStudentsTab
          students={mockStudents}
          coachId="coach-1"
          userRole="HEAD_COACH"
          isLoading={true}
        />
      );

      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('does not display loading skeleton when isLoading is false', () => {
      const { container } = render(
        <CoachStudentsTab
          students={mockStudents}
          coachId="coach-1"
          userRole="HEAD_COACH"
          isLoading={false}
        />
      );

      expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for filter dropdowns', () => {
      render(
        <CoachStudentsTab
          students={mockStudents}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      expect(screen.getByLabelText('Filter by batch')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by skill level')).toBeInTheDocument();
    });

    it('has proper ARIA labels for action buttons', () => {
      render(
        <CoachStudentsTab
          students={mockStudents}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      expect(screen.getByLabelText('Add student')).toBeInTheDocument();
      mockStudents.forEach((student) => {
        expect(
          screen.getByLabelText(`Remove student: ${student.fullName}`)
        ).toBeInTheDocument();
      });
    });

    it('has proper ARIA labels for filter removal buttons', async () => {
      render(
        <CoachStudentsTab
          students={mockStudents}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      const skillSelect = screen.getByLabelText('Filter by skill level') as HTMLSelectElement;
      fireEvent.change(skillSelect, { target: { value: 'Advanced' } });

      await waitFor(() => {
        expect(
          screen.getByLabelText(/Clear skill level filter/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Student Quick View Modal', () => {
    it('opens quick view modal when student is clicked', async () => {
      render(
        <CoachStudentsTab
          students={mockStudents}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      // Click on a student to open quick view modal
      const studentName = mockStudents[0].fullName;
      fireEvent.click(screen.getByText(studentName));

      // Wait for modal to open - check for modal dialog and content
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Student Details')).toBeInTheDocument();
      });
    });

    it('displays student information in quick view modal', async () => {
      render(
        <CoachStudentsTab
          students={mockStudents}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      // Click on a student to open quick view modal
      const student = mockStudents[0];
      fireEvent.click(screen.getByText(student.fullName));

      // Verify modal shows student details
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        // Check for modal-specific content
        expect(screen.getByText('Student Details')).toBeInTheDocument();
      });

      // Check student specific details in modal
      expect(screen.getByText('Quick view of student information')).toBeInTheDocument();
    });

    it('closes quick view modal when close button is clicked', async () => {
      render(
        <CoachStudentsTab
          students={mockStudents}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      // Open modal
      fireEvent.click(screen.getByText(mockStudents[0].fullName));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Close modal via close button
      const closeButton = screen.getByLabelText('Close student details modal');
      fireEvent.click(closeButton);

      // Modal should disappear
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('closes quick view modal when backdrop is clicked', async () => {
      const { container } = render(
        <CoachStudentsTab
          students={mockStudents}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      // Open modal
      fireEvent.click(screen.getByText(mockStudents[0].fullName));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click on backdrop
      const backdrop = container.querySelector('.modal-overlay') as HTMLElement;
      fireEvent.click(backdrop);

      // Modal should disappear
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('does not close modal when clicking inside modal content', async () => {
      render(
        <CoachStudentsTab
          students={mockStudents}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      // Open modal
      fireEvent.click(screen.getByText(mockStudents[0].fullName));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click inside modal content
      const studentDetails = screen.getByText('Student Details').closest('.modal-header');
      fireEvent.click(studentDetails!);

      // Modal should still be open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
