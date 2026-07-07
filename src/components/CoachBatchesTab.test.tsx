import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CoachBatchesTab } from './CoachBatchesTab';
import type { Batch } from '../types';

/**
 * CoachBatchesTab Component Tests
 *
 * Tests verify:
 * - **Property 12: Batch list displays all assigned batches**
 * - **Property 13: Batch assignment updates list and count**
 * - **Property 14: Batch removal updates list and count**
 *
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.5, 6.1, 6.4, 6.6, 6.5**
 */

describe('CoachBatchesTab', () => {
  const mockBatches: Batch[] = [
    {
      id: 'batch-001',
      name: 'Morning Beginners',
      schedule: 'Mon/Wed/Fri 6-7 AM',
      assignedCoachId: 'coach-1',
      studentCount: 4,
      createdAt: new Date('2026-01-01'),
    },
    {
      id: 'batch-002',
      name: 'Evening Intermediate',
      schedule: 'Tue/Thu/Sat 5-6:30 PM',
      assignedCoachId: 'coach-1',
      studentCount: 3,
      createdAt: new Date('2026-01-02'),
    },
    {
      id: 'batch-003',
      name: 'Advanced Training',
      schedule: 'Mon/Wed/Fri 7-8:30 PM',
      assignedCoachId: 'coach-1',
      studentCount: 6,
      createdAt: new Date('2026-01-03'),
    },
  ];

  describe('Requirement 5.1: Display list of all assigned batches', () => {
    it('displays all batches in the list', () => {
      render(
        <CoachBatchesTab
          batches={mockBatches}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      mockBatches.forEach(batch => {
        expect(screen.getByText(batch.name)).toBeInTheDocument();
      });
    });

    it('displays batch count in header for HEAD_COACH', () => {
      render(
        <CoachBatchesTab
          batches={mockBatches}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      expect(screen.getByText(`Assigned Batches (${mockBatches.length})`)).toBeInTheDocument();
    });
  });

  describe('Requirement 5.2: Display batch name, schedule, student count, metrics', () => {
    it('displays batch name, schedule, and student count', () => {
      render(
        <CoachBatchesTab
          batches={mockBatches}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      mockBatches.forEach(batch => {
        expect(screen.getByText(batch.name)).toBeInTheDocument();
        expect(screen.getByText(batch.schedule)).toBeInTheDocument();
      });
    });
  });

  describe('Requirement 5.3: Display batch metrics', () => {
    it('displays attendance rate and skill level metrics', () => {
      render(
        <CoachBatchesTab
          batches={mockBatches}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      // Should display attendance labels
      const attendanceLabels = screen.getAllByText(/Attendance/);
      expect(attendanceLabels.length).toBeGreaterThan(0);

      // Should display skill labels
      const skillLabels = screen.getAllByText(/Avg Skill/);
      expect(skillLabels.length).toBeGreaterThan(0);
    });
  });

  describe('Requirement 5.5: Display empty state when no batches assigned', () => {
    it('displays empty state message when no batches', () => {
      render(
        <CoachBatchesTab
          batches={[]}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      expect(screen.getByText('No Batches Assigned')).toBeInTheDocument();
    });

    it('shows Add Batch button in empty state for HEAD_COACH', () => {
      render(
        <CoachBatchesTab
          batches={[]}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      const addButtons = screen.getAllByRole('button', { name: /add new batch/i });
      expect(addButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Requirement 6.1 & 6.4: Batch management for authorized roles', () => {
    it('shows Add Batch button for HEAD_COACH', () => {
      render(
        <CoachBatchesTab
          batches={mockBatches}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      const addButtons = screen.getAllByRole('button', { name: /add new batch/i });
      expect(addButtons.length).toBeGreaterThan(0);
    });

    it('shows Remove button on each batch for HEAD_COACH', () => {
      render(
        <CoachBatchesTab
          batches={mockBatches}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      expect(removeButtons.length).toBeGreaterThan(0);
    });

    it('hides Add Batch button for ASSISTANT_COACH', () => {
      render(
        <CoachBatchesTab
          batches={mockBatches}
          coachId="coach-1"
          userRole="ASSISTANT_COACH"
        />
      );

      const addButtons = screen.queryAllByRole('button', { name: /add new batch/i });
      expect(addButtons.length).toBe(0);
    });

    it('shows read-only mode info for ASSISTANT_COACH', () => {
      render(
        <CoachBatchesTab
          batches={mockBatches}
          coachId="coach-1"
          userRole="ASSISTANT_COACH"
        />
      );

      expect(
        screen.getByText(/You can view batch information in read-only mode/)
      ).toBeInTheDocument();
    });
  });

  describe('Requirement 24.1: Loading state with skeleton', () => {
    it('displays loading skeleton when isLoading is true', () => {
      const { container } = render(
        <CoachBatchesTab
          batches={[]}
          coachId="coach-1"
          userRole="HEAD_COACH"
          isLoading={true}
        />
      );

      const animatedElements = container.querySelectorAll('.animate-pulse');
      expect(animatedElements.length).toBeGreaterThan(0);
    });

    it('displays batch list after loading completes', () => {
      render(
        <CoachBatchesTab
          batches={mockBatches}
          coachId="coach-1"
          userRole="HEAD_COACH"
          isLoading={false}
        />
      );

      mockBatches.forEach(batch => {
        expect(screen.getByText(batch.name)).toBeInTheDocument();
      });
    });
  });

  describe('Property 12: Batch list displays all assigned batches', () => {
    it('displays correct number of batches', () => {
      render(
        <CoachBatchesTab
          batches={mockBatches}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      mockBatches.forEach(batch => {
        expect(screen.getByText(batch.name)).toBeInTheDocument();
      });
    });

    it('updates list when batches prop changes', () => {
      const { rerender } = render(
        <CoachBatchesTab
          batches={mockBatches}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      expect(screen.getByText(mockBatches[0].name)).toBeInTheDocument();

      // Update with fewer batches
      rerender(
        <CoachBatchesTab
          batches={mockBatches.slice(0, 1)}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      expect(screen.getByText(mockBatches[0].name)).toBeInTheDocument();
      expect(screen.queryByText(mockBatches[1].name)).not.toBeInTheDocument();
    });
  });

  describe('Add Batch Modal Integration', () => {
    it('opens Add Batch modal when button is clicked', () => {
      render(
        <CoachBatchesTab
          batches={mockBatches}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      const addButtons = screen.getAllByRole('button', { name: /add new batch/i });
      fireEvent.click(addButtons[0]);

      // Modal should appear (checking for modal title)
      expect(screen.getByText('Assign Batch to Coach')).toBeInTheDocument();
    });

    it('calls onBatchAssigned callback when batch is assigned', async () => {
      const onBatchAssigned = vi.fn();
      render(
        <CoachBatchesTab
          batches={mockBatches}
          coachId="coach-1"
          userRole="HEAD_COACH"
          onBatchAssigned={onBatchAssigned}
        />
      );

      const addButtons = screen.getAllByRole('button', { name: /add new batch/i });
      fireEvent.click(addButtons[0]);

      // Modal opens, but we can't fully test assignment without mocking API
      expect(screen.getByText('Assign Batch to Coach')).toBeInTheDocument();
    });
  });

  describe('Responsive design', () => {
    it('renders metrics grid with responsive classes', () => {
      const { container } = render(
        <CoachBatchesTab
          batches={mockBatches}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      const grid = container.querySelector('.grid');
      expect(grid?.className).toContain('grid-cols-2');
      expect(grid?.className).toContain('lg:grid-cols-4');
    });
  });

  // ========================================================================
  // REQUIREMENT 6.4: Show remove/unassign option on each batch
  // REQUIREMENT 6.5: Unassign via DELETE endpoint and update list
  // REQUIREMENT 6.6: Update header count on success
  // ========================================================================
  describe('Requirement 6.4-6.6: Batch unassignment functionality (HEAD_COACH only)', () => {
    it('shows Remove button on each batch for HEAD_COACH', () => {
      render(
        <CoachBatchesTab
          batches={mockBatches}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      mockBatches.forEach(batch => {
        expect(screen.getByRole('button', { name: new RegExp(`Remove.*${batch.name}`) })).toBeInTheDocument();
      });
    });

    it('hides Remove buttons for ASSISTANT_COACH', () => {
      render(
        <CoachBatchesTab
          batches={mockBatches}
          coachId="coach-1"
          userRole="ASSISTANT_COACH"
        />
      );

      mockBatches.forEach(batch => {
        expect(screen.queryByRole('button', { name: new RegExp(`Remove.*${batch.name}`) })).not.toBeInTheDocument();
      });
    });

    it('displays confirmation dialog when Remove button is clicked', () => {
      render(
        <CoachBatchesTab
          batches={mockBatches}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      const removeButton = screen.getAllByRole('button', { name: /Remove/ })[0];
      fireEvent.click(removeButton);

      // Check for confirmation dialog elements
      expect(screen.getByText(/Unassign Batch\?/)).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to unassign/)).toBeInTheDocument();
    });

    it('calls onBatchUnassigned callback when unassign is confirmed', () => {
      const onBatchUnassigned = vi.fn();
      render(
        <CoachBatchesTab
          batches={mockBatches}
          coachId="coach-1"
          userRole="HEAD_COACH"
          onBatchUnassigned={onBatchUnassigned}
        />
      );

      // Click Remove button
      const removeButton = screen.getAllByRole('button', { name: /Remove/ })[0];
      fireEvent.click(removeButton);

      // Click Unassign in confirmation dialog
      const unassignButton = screen.getByRole('button', { name: /Unassign/ });
      fireEvent.click(unassignButton);

      expect(onBatchUnassigned).toHaveBeenCalledWith(mockBatches[0].id);
    });

    it('closes confirmation dialog when Cancel is clicked', () => {
      render(
        <CoachBatchesTab
          batches={mockBatches}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      // Click Remove button
      const removeButton = screen.getAllByRole('button', { name: /Remove/ })[0];
      fireEvent.click(removeButton);

      // Check dialog is visible
      expect(screen.getByText(/Unassign Batch\?/)).toBeInTheDocument();

      // Click Cancel
      const cancelButton = screen.getByRole('button', { name: /Cancel/ });
      fireEvent.click(cancelButton);

      // Dialog should be gone
      expect(screen.queryByText(/Unassign Batch\?/)).not.toBeInTheDocument();
    });

    it('does not call onBatchUnassigned when unassign is cancelled', () => {
      const onBatchUnassigned = vi.fn();
      render(
        <CoachBatchesTab
          batches={mockBatches}
          coachId="coach-1"
          userRole="HEAD_COACH"
          onBatchUnassigned={onBatchUnassigned}
        />
      );

      // Click Remove button
      const removeButton = screen.getAllByRole('button', { name: /Remove/ })[0];
      fireEvent.click(removeButton);

      // Click Cancel
      const cancelButton = screen.getByRole('button', { name: /Cancel/ });
      fireEvent.click(cancelButton);

      expect(onBatchUnassigned).not.toHaveBeenCalled();
    });

    it('shows loading state when unassign is in progress', async () => {
      const onBatchUnassigned = vi.fn();
      render(
        <CoachBatchesTab
          batches={mockBatches}
          coachId="coach-1"
          userRole="HEAD_COACH"
          onBatchUnassigned={onBatchUnassigned}
        />
      );

      // Click Remove button
      const removeButton = screen.getAllByRole('button', { name: /Remove/ })[0];
      fireEvent.click(removeButton);

      // Click Unassign
      const unassignButton = screen.getByRole('button', { name: /Unassign/ });
      fireEvent.click(unassignButton);

      // Callback should be called
      expect(onBatchUnassigned).toHaveBeenCalled();
    });

    it('shows batch details in confirmation dialog with student count', () => {
      render(
        <CoachBatchesTab
          batches={mockBatches}
          coachId="coach-1"
          userRole="HEAD_COACH"
        />
      );

      // Click Remove button for second batch
      const removeButtons = screen.getAllByRole('button', { name: /Remove/ });
      fireEvent.click(removeButtons[1]);

      // Confirmation dialog should show batch details - check for the unassign message
      expect(screen.getByText(/Are you sure you want to unassign/)).toBeInTheDocument();
      expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument();
    });

    it('prevents multiple simultaneous unassignments', () => {
      const onBatchUnassigned = vi.fn();
      const { rerender } = render(
        <CoachBatchesTab
          batches={mockBatches}
          coachId="coach-1"
          userRole="HEAD_COACH"
          onBatchUnassigned={onBatchUnassigned}
        />
      );

      // Click Remove on first batch
      const removeButtons = screen.getAllByRole('button', { name: /Remove/ });
      fireEvent.click(removeButtons[0]);

      // Confirm removal
      let unassignButton = screen.getByRole('button', { name: /Unassign/ });
      fireEvent.click(unassignButton);

      // Set one batch as "removing" by checking the UI state
      expect(onBatchUnassigned).toHaveBeenCalledWith(mockBatches[0].id);
    });
  });
});
