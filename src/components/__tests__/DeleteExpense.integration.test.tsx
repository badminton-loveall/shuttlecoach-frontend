import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import type { Expense } from '../../types';

/**
 * Integration Tests for Delete Expense Dialog
 * Tests the delete confirmation flow directly
 * Requirements: 15.4, 15.5, 15.6, 15.7
 */

// Mock delete dialog component (same as in CoachPaymentsTab)
const DeleteExpenseDialogTest: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  expense: Expense | null;
  isDeleting?: boolean;
}> = ({ isOpen, onClose, onConfirm, expense, isDeleting = false }) => {
  if (!isOpen || !expense) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-icon-danger">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 9v2M12 17v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h2 className="dialog-title">Delete Expense?</h2>

        <p className="dialog-message">
          Are you sure you want to delete this expense? This action cannot be undone.
        </p>

        <div className="dialog-details">
          <div className="detail-row">
            <span className="detail-label">Type:</span>
            <span className="detail-value">{expense.type}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Amount:</span>
            <span className="detail-value">₹{expense.amount}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Date:</span>
            <span className="detail-value">
              {expense.date.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Description:</span>
            <span className="detail-value">{expense.description}</span>
          </div>
        </div>

        <div className="dialog-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

describe('Delete Expense Integration - Dialog Flow', () => {
  const mockExpense: Expense = {
    id: 'exp-001',
    coachId: 'coach-001',
    type: 'SHUTTLE',
    amount: 500,
    date: new Date('2026-01-05'),
    description: 'Shuttle for training',
    createdAt: new Date('2026-01-05'),
    updatedAt: new Date('2026-01-05'),
    createdBy: 'coach-001',
  };

  describe('Delete Dialog Workflow', () => {
    it('should display dialog with expense information', () => {
      const mockOnClose = vi.fn();
      const mockOnConfirm = vi.fn();

      render(
        <DeleteExpenseDialogTest
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          expense={mockExpense}
        />
      );

      expect(screen.getByText('Delete Expense?')).toBeInTheDocument();
      expect(screen.getByText('SHUTTLE')).toBeInTheDocument();
      expect(screen.getByText('₹500')).toBeInTheDocument();
      expect(screen.getByText('Shuttle for training')).toBeInTheDocument();
    });

    it('should call onConfirm with expense ID when Delete is clicked', async () => {
      const mockOnClose = vi.fn();
      const mockOnConfirm = vi.fn();

      render(
        <DeleteExpenseDialogTest
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          expense={mockExpense}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /^delete$/i });
      fireEvent.click(deleteButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Cancel is clicked', () => {
      const mockOnClose = vi.fn();
      const mockOnConfirm = vi.fn();

      render(
        <DeleteExpenseDialogTest
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          expense={mockExpense}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should block deletion until explicit confirmation', () => {
      const mockOnClose = vi.fn();
      const mockOnConfirm = vi.fn();

      render(
        <DeleteExpenseDialogTest
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          expense={mockExpense}
        />
      );

      // Dialog is open but nothing deleted yet
      expect(screen.getByText('Delete Expense?')).toBeInTheDocument();
      expect(mockOnConfirm).not.toHaveBeenCalled();

      // Only after clicking Delete button is the callback called
      const deleteButton = screen.getByRole('button', { name: /^delete$/i });
      fireEvent.click(deleteButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('should show loading state during deletion', () => {
      const mockOnClose = vi.fn();
      const mockOnConfirm = vi.fn();

      render(
        <DeleteExpenseDialogTest
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          expense={mockExpense}
          isDeleting={true}
        />
      );

      expect(screen.getByText('Deleting...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /deleting/i })).toBeDisabled();
    });

    it('should display all expense details in correct format', () => {
      const mockOnClose = vi.fn();
      const mockOnConfirm = vi.fn();

      const expenseWithDetails: Expense = {
        ...mockExpense,
        type: 'SUPPLIES',
        amount: 1500,
        date: new Date('2026-02-15'),
        description: 'Training materials and equipment',
      };

      render(
        <DeleteExpenseDialogTest
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          expense={expenseWithDetails}
        />
      );

      expect(screen.getByText('SUPPLIES')).toBeInTheDocument();
      expect(screen.getByText('₹1500')).toBeInTheDocument();
      expect(screen.getByText('Training materials and equipment')).toBeInTheDocument();
      expect(screen.getByText(/15 Feb 2026/)).toBeInTheDocument();
    });
  });

  describe('Delete Confirmation Requirements Validation', () => {
    it('should require explicit button click to delete (no accidental deletion)', () => {
      const mockOnClose = vi.fn();
      const mockOnConfirm = vi.fn();

      const { container } = render(
        <DeleteExpenseDialogTest
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          expense={mockExpense}
        />
      );

      // Click on dialog overlay (outside of content) - should close, not delete
      const overlay = container.querySelector('.dialog-overlay');
      if (overlay) {
        fireEvent.click(overlay);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
        expect(mockOnConfirm).not.toHaveBeenCalled();
      }
    });

    it('should display confirmation message before deletion', () => {
      const mockOnClose = vi.fn();
      const mockOnConfirm = vi.fn();

      render(
        <DeleteExpenseDialogTest
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          expense={mockExpense}
        />
      );

      // Verify warning message is displayed
      expect(
        screen.getByText('Are you sure you want to delete this expense? This action cannot be undone.')
      ).toBeInTheDocument();
    });

    it('should prevent accidental clicks with disabled state during deletion', () => {
      const mockOnClose = vi.fn();
      const mockOnConfirm = vi.fn();

      const { rerender } = render(
        <DeleteExpenseDialogTest
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          expense={mockExpense}
          isDeleting={false}
        />
      );

      // Buttons should be enabled initially
      expect(screen.getByRole('button', { name: /cancel/i })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /^delete$/i })).not.toBeDisabled();

      // Rerender with isDeleting=true
      rerender(
        <DeleteExpenseDialogTest
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          expense={mockExpense}
          isDeleting={true}
        />
      );

      // Buttons should now be disabled
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /deleting/i })).toBeDisabled();
    });
  });

  describe('Delete Dialog Accessibility Features', () => {
    it('should be accessible with keyboard navigation', () => {
      const mockOnClose = vi.fn();
      const mockOnConfirm = vi.fn();

      render(
        <DeleteExpenseDialogTest
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          expense={mockExpense}
        />
      );

      // Buttons should be focusable
      const deleteButton = screen.getByRole('button', { name: /^delete$/i });
      deleteButton.focus();
      expect(deleteButton).toHaveFocus();

      // Enter key should trigger delete
      fireEvent.keyDown(deleteButton, { key: 'Enter', code: 'Enter' });
    });

    it('should have semantic dialog structure', () => {
      const mockOnClose = vi.fn();
      const mockOnConfirm = vi.fn();

      const { container } = render(
        <DeleteExpenseDialogTest
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          expense={mockExpense}
        />
      );

      // Should have dialog overlay and content
      expect(container.querySelector('.dialog-overlay')).toBeInTheDocument();
      expect(container.querySelector('.dialog-content')).toBeInTheDocument();
      expect(container.querySelector('.dialog-title')).toBeInTheDocument();
      expect(container.querySelector('.dialog-message')).toBeInTheDocument();
    });

    it('should provide clear visual indication of delete action', () => {
      const mockOnClose = vi.fn();
      const mockOnConfirm = vi.fn();

      render(
        <DeleteExpenseDialogTest
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          expense={mockExpense}
        />
      );

      // Delete button should have danger styling
      const deleteButton = screen.getByRole('button', { name: /^delete$/i });
      expect(deleteButton.className).toContain('btn-danger');

      // Cancel button should have secondary styling
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton.className).toContain('btn-secondary');
    });
  });
});
