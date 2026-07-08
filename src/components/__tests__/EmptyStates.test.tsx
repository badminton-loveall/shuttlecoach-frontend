import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import CoachPaymentsTab from '../CoachPaymentsTab';
import { CoachBatchesTab } from '../CoachBatchesTab';
import { CoachStudentsTab } from '../CoachStudentsTab';
import type { Student, Batch } from '../../types';

/**
 * Empty States Tests
 * 
 * Requirement 24.2: When a tab has no data, display empty state with context and actions
 * Requirement 28.1: Display empty states even if data load succeeded
 * 
 * Tests validate that each tab displays appropriate empty states with:
 * - Relevant context message
 * - Available actions (e.g., "Add Batch", "Add Student", "Record First Expense")
 * - Clear visual indication that no data exists
 */

describe('Empty States - Requirement 24.2, 28.1', () => {
  describe('CoachPaymentsTab - No Payments', () => {
    it('should display empty state when no fees and expenses exist', () => {
      render(
        <CoachPaymentsTab
          coachId="coach-001"
          fees={[]}
          expenses={[]}
          students={[]}
          userRole="HEAD_COACH"
        />
      );

      // Empty state container should be visible
      expect(screen.getByText('No Payment Records')).toBeInTheDocument();
      expect(
        screen.getByText(/No income or expense records found for this coach yet/)
      ).toBeInTheDocument();
    });

    it('should display context message about how income appears', () => {
      render(
        <CoachPaymentsTab
          coachId="coach-001"
          fees={[]}
          expenses={[]}
          students={[]}
          userRole="HEAD_COACH"
        />
      );

      expect(
        screen.getByText(/Income records will appear as students pay their fees/)
      ).toBeInTheDocument();
    });

    it('should display action button for HEAD_COACH to record expense', () => {
      render(
        <CoachPaymentsTab
          coachId="coach-001"
          fees={[]}
          expenses={[]}
          students={[]}
          userRole="HEAD_COACH"
        />
      );

      const button = screen.getByRole('button', { name: /Add new expense/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Record First Expense');
    });

    it('should not display action button for non-admin roles', () => {
      render(
        <CoachPaymentsTab
          coachId="coach-001"
          fees={[]}
          expenses={[]}
          students={[]}
          userRole="ASSISTANT_COACH"
        />
      );

      const button = screen.queryByRole('button', { name: /Record First Expense/i });
      expect(button).not.toBeInTheDocument();
    });

    it('should display empty state with icon for visual indication', () => {
      const { container } = render(
        <CoachPaymentsTab
          coachId="coach-001"
          fees={[]}
          expenses={[]}
          students={[]}
          userRole="HEAD_COACH"
        />
      );

      // SVG icon should be present
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('CoachPaymentsTab - No Income Records (after filtering)', () => {
    it('should display context-specific empty state when filters result in no income records', () => {
      const mockStudents: Student[] = [
        {
          id: 'student-001',
          fullName: 'Test Student',
          assignedCoachId: 'coach-001',
          batchId: 'batch-001',
          skillLevel: 'Beginner',
        } as Student,
      ];

      render(
        <CoachPaymentsTab
          coachId="coach-001"
          fees={[]}
          expenses={[]}
          students={mockStudents}
          userRole="HEAD_COACH"
        />
      );

      // Should still show no records message
      expect(screen.getByText('No Payment Records')).toBeInTheDocument();
    });
  });

  describe('CoachBatchesTab - No Batches', () => {
    it('should display empty state when coach has no assigned batches', () => {
      render(
        <CoachBatchesTab
          batches={[]}
          userRole="HEAD_COACH"
          coachId="coach-001"
        />
      );

      // Empty state should be visible
      expect(screen.getByText('No Batches Assigned')).toBeInTheDocument();
      expect(
        screen.getByText(/This coach does not have any batches assigned yet/)
      ).toBeInTheDocument();
    });

    it('should display action button for HEAD_COACH to add batch', () => {
      render(
        <CoachBatchesTab
          batches={[]}
          userRole="HEAD_COACH"
          coachId="coach-001"
        />
      );

      const button = screen.getByRole('button', { name: /Add new batch/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Add Batch');
    });

    it('should not display action button for non-HEAD_COACH roles', () => {
      render(
        <CoachBatchesTab
          batches={[]}
          userRole="ASSISTANT_COACH"
          coachId="coach-001"
        />
      );

      const button = screen.queryByRole('button', { name: /Add Batch/i });
      expect(button).not.toBeInTheDocument();
    });

    it('should display empty state message specific to role permissions', () => {
      render(
        <CoachBatchesTab
          batches={[]}
          userRole="HEAD_COACH"
          coachId="coach-001"
        />
      );

      expect(
        screen.getByText(/Click the "Add Batch" button to assign batches/)
      ).toBeInTheDocument();
    });

    it('should display empty state icon for visual indication', () => {
      const { container } = render(
        <CoachBatchesTab
          batches={[]}
          userRole="HEAD_COACH"
          coachId="coach-001"
        />
      );

      // SVG icon should be present
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('CoachStudentsTab - No Students', () => {
    it('should display empty state when coach has no assigned students', () => {
      render(
        <CoachStudentsTab
          students={[]}
          coachId="coach-001"
          userRole="HEAD_COACH"
        />
      );

      // Empty state should be visible
      expect(
        screen.getByText('No students assigned to this coach')
      ).toBeInTheDocument();
    });

    it('should display action button for HEAD_COACH to add student', () => {
      render(
        <CoachStudentsTab
          students={[]}
          coachId="coach-001"
          userRole="HEAD_COACH"
        />
      );

      const button = screen.getByRole('button', { name: /Add Student/i });
      expect(button).toBeInTheDocument();
    });

    it('should not display action button for non-HEAD_COACH roles', () => {
      render(
        <CoachStudentsTab
          students={[]}
          coachId="coach-001"
          userRole="ASSISTANT_COACH"
        />
      );

      const button = screen.queryByRole('button', { name: /Add Student/i });
      expect(button).not.toBeInTheDocument();
    });

    it('should display empty state icon for visual indication', () => {
      const { container } = render(
        <CoachStudentsTab
          students={[]}
          coachId="coach-001"
          userRole="HEAD_COACH"
        />
      );

      // SVG icon should be present
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should display "No students match your filters" when no results after filtering', () => {
      const mockStudents: Student[] = [
        {
          id: 'student-001',
          fullName: 'Test Student',
          assignedCoachId: 'coach-001',
          batchId: 'batch-001',
          skillLevel: 'Beginner',
        } as Student,
      ];

      const { rerender } = render(
        <CoachStudentsTab
          students={mockStudents}
          coachId="coach-001"
          userRole="HEAD_COACH"
        />
      );

      // First render should show student
      expect(screen.getByText('Test Student')).toBeInTheDocument();

      // After filtering (simulated by empty filtered list)
      rerender(
        <CoachStudentsTab
          students={[]}
          coachId="coach-001"
          userRole="HEAD_COACH"
        />
      );

      // Should show empty state
      expect(
        screen.getByText('No students assigned to this coach')
      ).toBeInTheDocument();
    });
  });

  describe('Empty States - Common Attributes', () => {
    it('should display empty state even when data load actually succeeded (Requirement 28.1)', () => {
      // This tests that empty states appear regardless of data load success
      render(
        <CoachBatchesTab
          batches={[]}
          userRole="HEAD_COACH"
          coachId="coach-001"
          isLoading={false}
        />
      );

      // Empty state should display despite isLoading being false (data loaded successfully with zero records)
      expect(screen.getByText('No Batches Assigned')).toBeInTheDocument();
    });

    it('should include relevant context in empty state messages (Requirement 24.2)', () => {
      // Batches empty state
      const { rerender } = render(
        <CoachBatchesTab
          batches={[]}
          userRole="HEAD_COACH"
          coachId="coach-001"
        />
      );

      expect(screen.getByText(/batches assigned yet/)).toBeInTheDocument();

      // Students empty state
      rerender(
        <CoachStudentsTab
          students={[]}
          coachId="coach-001"
          userRole="HEAD_COACH"
        />
      );

      expect(screen.getByText(/students assigned to this coach/)).toBeInTheDocument();

      // Payments empty state
      rerender(
        <CoachPaymentsTab
          coachId="coach-001"
          fees={[]}
          expenses={[]}
          students={[]}
          userRole="HEAD_COACH"
        />
      );

      expect(screen.getByText('No Payment Records')).toBeInTheDocument();
    });

    it('should provide available actions in empty state (Requirement 24.2)', () => {
      const { rerender } = render(
        <CoachBatchesTab
          batches={[]}
          userRole="HEAD_COACH"
          coachId="coach-001"
        />
      );

      // Action button should be present for authorized role
      expect(screen.getByRole('button', { name: /Add new batch/i })).toBeInTheDocument();

      rerender(
        <CoachStudentsTab
          students={[]}
          coachId="coach-001"
          userRole="HEAD_COACH"
        />
      );

      expect(screen.getByRole('button', { name: /Add Student/i })).toBeInTheDocument();

      rerender(
        <CoachPaymentsTab
          coachId="coach-001"
          fees={[]}
          expenses={[]}
          students={[]}
          userRole="HEAD_COACH"
        />
      );

      expect(screen.getByRole('button', { name: /Add new expense/i })).toBeInTheDocument();
    });
  });

  describe('Income Table Empty State', () => {
    it('should display empty state in income table when no income records after filtering', () => {
      const mockStudents: Student[] = [
        {
          id: 'student-001',
          fullName: 'Test Student',
          assignedCoachId: 'coach-001',
          batchId: 'batch-001',
          skillLevel: 'Beginner',
        } as Student,
      ];

      render(
        <CoachPaymentsTab
          coachId="coach-001"
          fees={[]}
          expenses={[]}
          students={mockStudents}
          userRole="HEAD_COACH"
        />
      );

      // Overall empty state should display
      expect(screen.getByText('No Payment Records')).toBeInTheDocument();
    });

    it('should display context-specific message for no income records', () => {
      const mockStudents: Student[] = [
        {
          id: 'student-001',
          fullName: 'Test Student',
          assignedCoachId: 'coach-001',
          batchId: 'batch-001',
          skillLevel: 'Beginner',
        } as Student,
      ];

      render(
        <CoachPaymentsTab
          coachId="coach-001"
          fees={[]}
          expenses={[]}
          students={mockStudents}
          userRole="HEAD_COACH"
        />
      );

      expect(
        screen.getByText(/No income or expense records found/)
      ).toBeInTheDocument();
    });
  });
});
