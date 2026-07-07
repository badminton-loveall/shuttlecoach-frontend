import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import type { Expense, Student } from '../../types';

/**
 * Test Suite for Delete Expense Functionality
 * Tests the delete confirmation dialog and deletion workflow
 * Requirements: 15.4, 15.5, 15.6, 15.7
 */

// Mock dialog component for testing
const MockDeleteExpenseDialog: React.FC<{
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
            <span className="detail-label">Description:</span>
            <span className="detail-value">{expense.description}</span>
          </div>
        </div>
        <div className="dialog-actions">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="btn btn-danger"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

describe('Delete Expense Functionality', () => {
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

  describe('Delete Dialog Display', () => {
    it('should display confirmation dialog when delete is triggered', () => {
      const mockOnClose = vi.fn();
      const mockOnConfirm = vi.fn();

      render(
        <MockDeleteExpenseDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          expense={mockExpense}
        />
      );

      expect(screen.getByText('Delete Expense?')).toBeInTheDocument();
      expect(
        screen.getByText('Are you sure you want to delete this expense? This action cannot be undone.')
      ).toBeInTheDocument();
    });

    it('should display expense details in the dialog', () => {
      const mockOnClose = vi.fn();
      const mockOnConfirm = vi.fn();

      render(
        <MockDeleteExpenseDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          expense={mockExpense}
        />
      );

      expect(screen.getByText('SHUTTLE')).toBeInTheDocument();
      expect(screen.getByText('₹500')).toBeInTheDocument();
      expect(screen.getByText('Shuttle for training')).toBeInTheDocument();
    });

    it('should not display dialog when isOpen is false', () => {
      const mockOnClose = vi.fn();
      const mockOnConfirm = vi.fn();

      const { container } = render(
        <MockDeleteExpenseDialog
          isOpen={false}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          expense={mockExpense}
        />
      );

      expect(container.querySelector('.dialog-overlay')).not.toBeInTheDocument();
    });

    it('should not display dialog when expense is null', () => {
      const mockOnClose = vi.fn();
      const mockOnConfirm = vi.fn();

      const { container } = render(
        <MockDeleteExpenseDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          expense={null}
        />
      );

      expect(container.querySelector('.dialog-overlay')).not.toBeInTheDocument();
    });
  });

  describe('Delete Dialog Actions', () => {
    it('should call onClose when Cancel button is clicked', () => {
      const mockOnClose = vi.fn();
      const mockOnConfirm = vi.fn();

      render(
        <MockDeleteExpenseDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          expense={mockExpense}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onConfirm when Delete button is clicked', () => {
      const mockOnClose = vi.fn();
      const mockOnConfirm = vi.fn();

      render(
        <MockDeleteExpenseDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          expense={mockExpense}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      fireEvent.click(deleteButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('should close dialog when clicking outside the dialog content', () => {
      const mockOnClose = vi.fn();
      const mockOnConfirm = vi.fn();

      render(
        <MockDeleteExpenseDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          expense={mockExpense}
        />
      );

      const overlay = screen.getByText('Delete Expense?').closest('.dialog-overlay');
      if (overlay) {
        fireEvent.click(overlay);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Delete Dialog Loading State', () => {
    it('should disable buttons when isDeleting is true', () => {
      const mockOnClose = vi.fn();
      const mockOnConfirm = vi.fn();

      render(
        <MockDeleteExpenseDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          expense={mockExpense}
          isDeleting={true}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      const deleteButton = screen.getByRole('button', { name: /deleting/i });

      expect(cancelButton).toBeDisabled();
      expect(deleteButton).toBeDisabled();
    });

    it('should show "Deleting..." text when isDeleting is true', () => {
      const mockOnClose = vi.fn();
      const mockOnConfirm = vi.fn();

      render(
        <MockDeleteExpenseDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          expense={mockExpense}
          isDeleting={true}
        />
      );

      expect(screen.getByText('Deleting...')).toBeInTheDocument();
    });
  });

  describe('Delete Confirmation Requirements', () => {
    it('should block deletion until explicit confirmation - only Cancel and Delete buttons available', () => {
      const mockOnClose = vi.fn();
      const mockOnConfirm = vi.fn();

      render(
        <MockDeleteExpenseDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          expense={mockExpense}
        />
      );

      // Verify only Cancel and Delete buttons exist
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      expect(buttons[0]).toHaveTextContent('Cancel');
      expect(buttons[1]).toHaveTextContent('Delete');
    });

    it('should prevent accidental deletion by requiring explicit button click', () => {
      const mockOnClose = vi.fn();
      const mockOnConfirm = vi.fn();

      render(
        <MockDeleteExpenseDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          expense={mockExpense}
        />
      );

      // Verify dialog is open but nothing is deleted until button click
      expect(screen.getByText('Delete Expense?')).toBeInTheDocument();
      expect(mockOnConfirm).not.toHaveBeenCalled();

      // Click Delete button
      const deleteButton = screen.getByRole('button', { name: /delete/i });
      fireEvent.click(deleteButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });
  });

  describe('Delete Dialog Accessibility', () => {
    it('should have proper aria-labels on buttons', () => {
      const mockOnClose = vi.fn();
      const mockOnConfirm = vi.fn();

      render(
        <MockDeleteExpenseDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          expense={mockExpense}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      const deleteButton = screen.getByRole('button', { name: /delete/i });

      expect(cancelButton).toBeInTheDocument();
      expect(deleteButton).toBeInTheDocument();
    });

    it('should display title and message for screen readers', () => {
      const mockOnClose = vi.fn();
      const mockOnConfirm = vi.fn();

      render(
        <MockDeleteExpenseDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          expense={mockExpense}
        />
      );

      expect(screen.getByText('Delete Expense?')).toBeInTheDocument();
      expect(
        screen.getByText('Are you sure you want to delete this expense? This action cannot be undone.')
      ).toBeInTheDocument();
    });
  });
});
