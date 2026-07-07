import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import CoachPaymentsTab from '../CoachPaymentsTab';
import type { FeeRecord, Student, Expense } from '../../types';

/**
 * Integration Tests for Delete Expense Functionality in CoachPaymentsTab
 * Tests deletion workflow, confirmation dialog, and list updates
 * Requirements: 15.1, 15.4, 15.5, 15.6, 15.7
 */

describe('CoachPaymentsTab - Delete Expense Integration', () => {
  const mockStudents: Student[] = [
    {
      id: 'student-001',
      fullName: 'Arjun Verma',
      email: 'arjun@example.com',
      assignedCoachId: 'coach-001',
      batchId: 'batch-001',
      skillLevel: 'Beginner',
    } as Student,
  ];

  const mockFeeRecords: FeeRecord[] = [
    {
      id: 'fee-001',
      studentId: 'student-001',
      amount: 1000,
      monthYear: 'January 2026',
      dueDate: new Date('2026-01-31'),
      paidDate: new Date('2026-01-10'),
      status: 'PAID',
      paymentMethod: 'UPI',
      transactionRef: 'UPI001',
      createdAt: new Date('2026-01-10'),
      updatedAt: new Date('2026-01-10'),
    },
  ];

  const mockExpenses: Expense[] = [
    {
      id: 'exp-001',
      coachId: 'coach-001',
      type: 'SHUTTLE',
      amount: 500,
      date: new Date('2026-01-05'),
      description: 'Shuttle for training',
      createdAt: new Date('2026-01-05'),
      updatedAt: new Date('2026-01-05'),
      createdBy: 'coach-001',
    },
    {
      id: 'exp-002',
      coachId: 'coach-001',
      type: 'SUPPLIES',
      amount: 300,
      date: new Date('2026-01-10'),
      description: 'Training equipment',
      createdAt: new Date('2026-01-10'),
      updatedAt: new Date('2026-01-10'),
      createdBy: 'coach-001',
    },
  ];

  describe('Delete Button Visibility', () => {
    it('should show delete button on expense row for HEAD_COACH', async () => {
      const mockOnDelete = vi.fn();

      render(
        <CoachPaymentsTab
          coachId="coach-001"
          fees={mockFeeRecords}
          expenses={mockExpenses}
          students={mockStudents}
          onExpenseDeleted={mockOnDelete}
          userRole="HEAD_COACH"
        />
      );

      // Wait for expense data to appear
      await waitFor(() => {
        expect(screen.getByText('Shuttle for training')).toBeInTheDocument();
      });

      // The delete buttons should be visible (filter by aria-label)
      const buttons = screen.getAllByRole('button');
      const deleteButtons = buttons.filter(b => b.getAttribute('aria-label')?.includes('Delete'));
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    it('should not show delete button for ASSISTANT_COACH', () => {
      const mockOnDelete = vi.fn();

      render(
        <CoachPaymentsTab
          coachId="coach-001"
          fees={mockFeeRecords}
          expenses={mockExpenses}
          students={mockStudents}
          onExpenseDeleted={mockOnDelete}
          userRole="ASSISTANT_COACH"
        />
      );

      // For ASSISTANT_COACH, canEdit should be false
      // So no delete/edit buttons should be rendered in the table
      const buttons = screen.getAllByRole('button');
      const actionButtons = buttons.filter(b => 
        b.getAttribute('aria-label')?.includes('Delete') || b.getAttribute('aria-label')?.includes('Edit')
      );
      expect(actionButtons.length).toBe(0);
    });
  });

  describe('Delete Confirmation Dialog', () => {
    it('should open confirmation dialog when delete button is clicked', async () => {
      const mockOnDelete = vi.fn();

      render(
        <CoachPaymentsTab
          coachId="coach-001"
          fees={mockFeeRecords}
          expenses={mockExpenses}
          students={mockStudents}
          onExpenseDeleted={mockOnDelete}
          userRole="HEAD_COACH"
        />
      );

      // Wait for expense records to appear
      await waitFor(() => {
        expect(screen.getByText('Shuttle for training')).toBeInTheDocument();
      });

      // Get first delete button and click it
      const buttons = screen.getAllByRole('button');
      const deleteButtons = buttons.filter(b => b.getAttribute('aria-label')?.includes('Delete'));
      fireEvent.click(deleteButtons[0]);

      // Dialog should open
      await waitFor(() => {
        expect(screen.getByText('Delete Expense?')).toBeInTheDocument();
      });
    });

    it('should display expense details in confirmation dialog', async () => {
      const mockOnDelete = vi.fn();

      render(
        <CoachPaymentsTab
          coachId="coach-001"
          fees={mockFeeRecords}
          expenses={mockExpenses}
          students={mockStudents}
          onExpenseDeleted={mockOnDelete}
          userRole="HEAD_COACH"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Shuttle for training')).toBeInTheDocument();
      });

      // Click delete button for first expense
      const buttons = screen.getAllByRole('button');
      const deleteButtons = buttons.filter(b => b.getAttribute('aria-label')?.includes('Delete'));
      fireEvent.click(deleteButtons[0]);

      // Wait for dialog and verify expense details are shown
      await waitFor(() => {
        expect(screen.getByText('SHUTTLE')).toBeInTheDocument();
        expect(screen.getByText('₹500')).toBeInTheDocument();
      });
    });

    it('should prevent deletion until user clicks Delete button', async () => {
      const mockOnDelete = vi.fn();

      render(
        <CoachPaymentsTab
          coachId="coach-001"
          fees={mockFeeRecords}
          expenses={mockExpenses}
          students={mockStudents}
          onExpenseDeleted={mockOnDelete}
          userRole="HEAD_COACH"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Shuttle for training')).toBeInTheDocument();
      });

      // Click delete button
      const buttons = screen.getAllByRole('button');
      const deleteButtons = buttons.filter(b => b.getAttribute('aria-label')?.includes('Delete'));
      fireEvent.click(deleteButtons[0]);

      // Wait for dialog
      await waitFor(() => {
        expect(screen.getByText('Delete Expense?')).toBeInTheDocument();
      });

      // Verify onExpenseDeleted was NOT called yet
      expect(mockOnDelete).not.toHaveBeenCalled();
    });
  });

  describe('Delete Confirmation Actions', () => {
    it('should close dialog when Cancel button is clicked', async () => {
      const mockOnDelete = vi.fn();

      render(
        <CoachPaymentsTab
          coachId="coach-001"
          fees={mockFeeRecords}
          expenses={mockExpenses}
          students={mockStudents}
          onExpenseDeleted={mockOnDelete}
          userRole="HEAD_COACH"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Shuttle for training')).toBeInTheDocument();
      });

      // Click delete button
      const buttons = screen.getAllByRole('button');
      const deleteButtons = buttons.filter(b => b.getAttribute('aria-label')?.includes('Delete'));
      fireEvent.click(deleteButtons[0]);

      // Wait for dialog
      await waitFor(() => {
        expect(screen.getByText('Delete Expense?')).toBeInTheDocument();
      });

      // Click Cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByText('Delete Expense?')).not.toBeInTheDocument();
      });

      // Deletion callback should NOT be called
      expect(mockOnDelete).not.toHaveBeenCalled();
    });

    it('should call onExpenseDeleted callback when Delete button is clicked', async () => {
      const mockOnDelete = vi.fn();

      render(
        <CoachPaymentsTab
          coachId="coach-001"
          fees={mockFeeRecords}
          expenses={mockExpenses}
          students={mockStudents}
          onExpenseDeleted={mockOnDelete}
          userRole="HEAD_COACH"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Shuttle for training')).toBeInTheDocument();
      });

      // Click delete button for first expense
      const buttons = screen.getAllByRole('button');
      const deleteButtons = buttons.filter(b => b.getAttribute('aria-label')?.includes('Delete'));
      fireEvent.click(deleteButtons[0]);

      // Wait for dialog
      await waitFor(() => {
        expect(screen.getByText('Delete Expense?')).toBeInTheDocument();
      });

      // Click Delete confirmation button
      const deleteConfirmButton = screen.getByRole('button', { name: /^delete$/i });
      fireEvent.click(deleteConfirmButton);

      // Wait for callback
      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith('exp-001');
      });
    });
  });

  describe('Delete Error Handling', () => {
    it('should show loading state while deleting', async () => {
      const mockOnDelete = vi.fn(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <CoachPaymentsTab
          coachId="coach-001"
          fees={mockFeeRecords}
          expenses={mockExpenses}
          students={mockStudents}
          onExpenseDeleted={mockOnDelete}
          userRole="HEAD_COACH"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Shuttle for training')).toBeInTheDocument();
      });

      // Click delete button
      const buttons = screen.getAllByRole('button');
      const deleteButtons = buttons.filter(b => b.getAttribute('aria-label')?.includes('Delete'));
      fireEvent.click(deleteButtons[0]);

      // Wait for dialog
      await waitFor(() => {
        expect(screen.getByText('Delete Expense?')).toBeInTheDocument();
      });

      // Click Delete
      const deleteConfirmButton = screen.getByRole('button', { name: /^delete$/i });
      fireEvent.click(deleteConfirmButton);

      // During deletion, should show "Deleting..."
      await waitFor(() => {
        expect(screen.getByText('Deleting...')).toBeInTheDocument();
      });
    });
  });

  describe('Multiple Expenses', () => {
    it('should delete correct expense when multiple are present', async () => {
      const mockOnDelete = vi.fn();

      render(
        <CoachPaymentsTab
          coachId="coach-001"
          fees={mockFeeRecords}
          expenses={mockExpenses}
          students={mockStudents}
          onExpenseDeleted={mockOnDelete}
          userRole="HEAD_COACH"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Shuttle for training')).toBeInTheDocument();
        expect(screen.getByText('Training equipment')).toBeInTheDocument();
      });

      // Click delete button for second expense
      const buttons = screen.getAllByRole('button');
      const deleteButtons = buttons.filter(b => b.getAttribute('aria-label')?.includes('Delete'));
      fireEvent.click(deleteButtons[1]);

      // Wait for dialog
      await waitFor(() => {
        expect(screen.getByText('Delete Expense?')).toBeInTheDocument();
        expect(screen.getByText('Training equipment')).toBeInTheDocument();
      });

      // Click Delete
      const deleteConfirmButton = screen.getByRole('button', { name: /^delete$/i });
      fireEvent.click(deleteConfirmButton);

      // Verify correct expense ID is passed
      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith('exp-002');
      });
    });
  });

  describe('Delete Dialog Accessibility', () => {
    it('should have accessible buttons in delete dialog', async () => {
      const mockOnDelete = vi.fn();

      render(
        <CoachPaymentsTab
          coachId="coach-001"
          fees={mockFeeRecords}
          expenses={mockExpenses}
          students={mockStudents}
          onExpenseDeleted={mockOnDelete}
          userRole="HEAD_COACH"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Shuttle for training')).toBeInTheDocument();
      });

      // Click delete button
      const buttons = screen.getAllByRole('button');
      const deleteButtons = buttons.filter(b => b.getAttribute('aria-label')?.includes('Delete'));
      fireEvent.click(deleteButtons[0]);

      // Wait for dialog
      await waitFor(() => {
        expect(screen.getByText('Delete Expense?')).toBeInTheDocument();
      });

      // Verify buttons are properly labeled
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      const deleteButton = screen.getByRole('button', { name: /^delete$/i });

      expect(cancelButton).toBeInTheDocument();
      expect(deleteButton).toBeInTheDocument();
    });
  });
});
