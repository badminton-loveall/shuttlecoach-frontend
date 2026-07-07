import React, { useMemo } from 'react';
import type { Expense, PaymentFilters } from '../types';
import './CoachProfile.css';

/**
 * ExpenseLedger Component
 * 
 * Displays all coach expense records with:
 * - Type, amount, date, description, createdBy
 * - Sorted by date descending (most recent first)
 * - Filtered by date range if provided
 * - Empty state when no records exist
 * - Responsive design for mobile/desktop
 * 
 * Requirements: 12.2, 15.1, 15.2
 */

interface ExpenseLedgerProps {
  expenses: Expense[];
  filters?: PaymentFilters;
  isLoading?: boolean;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
  canEdit?: boolean;
}

const EXPENSE_TYPE_LABELS: Record<string, string> = {
  SHUTTLE: 'Shuttle',
  SUPPLIES: 'Supplies',
  TRAVEL: 'Travel',
  OTHER: 'Other',
};

export const ExpenseLedger: React.FC<ExpenseLedgerProps> = ({
  expenses,
  filters = {},
  isLoading = false,
  onEdit,
  onDelete,
  canEdit = true,
}) => {
  // Filter expenses by date range
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      // Apply date range filter if provided
      if (filters.dateFrom && expense.date < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo) {
        // Include expenses on the "to" date (up to end of day)
        const toDateEndOfDay = new Date(filters.dateTo);
        toDateEndOfDay.setHours(23, 59, 59, 999);
        if (expense.date > toDateEndOfDay) {
          return false;
        }
      }
      return true;
    });
  }, [expenses, filters]);

  // Sort by date descending (most recent first)
  const sortedExpenses = useMemo(() => {
    const sorted = [...filteredExpenses].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    return sorted;
  }, [filteredExpenses]);

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getExpenseTypeLabel = (type: string): string => {
    return EXPENSE_TYPE_LABELS[type] || type;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="expense-ledger">
        <div className="expense-ledger-header">
          <h4 className="ledger-title">Expense Records</h4>
        </div>
        <div className="ledger-loading">
          <div className="skeleton-row" />
          <div className="skeleton-row" />
          <div className="skeleton-row" />
        </div>
      </div>
    );
  }

  // Empty state
  if (sortedExpenses.length === 0) {
    return (
      <div className="expense-ledger">
        <div className="expense-ledger-header">
          <h4 className="ledger-title">Expense Records</h4>
        </div>
        <div className="ledger-empty">
          <svg
            className="ledger-empty-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="ledger-empty-text">
            {Object.keys(filters).length > 0 && filters.dateFrom
              ? 'No expenses in selected date range'
              : 'No expenses recorded'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="expense-ledger">
      <div className="expense-ledger-header">
        <h4 className="ledger-title">Expense Records</h4>
        <span className="ledger-count">
          {sortedExpenses.length} {sortedExpenses.length === 1 ? 'record' : 'records'}
        </span>
      </div>

      {/* Desktop table view */}
      <div className="ledger-table-container">
        <table className="ledger-table">
          <thead>
            <tr>
              <th className="col-type">Type</th>
              <th className="col-amount">Amount</th>
              <th className="col-date">Date</th>
              <th className="col-description">Description</th>
              <th className="col-created-by">Created By</th>
              {canEdit && <th className="col-actions">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {sortedExpenses.map((expense) => (
              <tr key={expense.id} className="ledger-row" onMouseEnter={(e) => {
                const row = e.currentTarget;
                if (canEdit) {
                  row.classList.add('row-hover');
                }
              }} onMouseLeave={(e) => {
                const row = e.currentTarget;
                row.classList.remove('row-hover');
              }}>
                <td className="col-type">
                  <span className="expense-type-badge">
                    {getExpenseTypeLabel(expense.type)}
                  </span>
                </td>
                <td className="col-amount">
                  <span className="amount-value">{formatCurrency(expense.amount)}</span>
                </td>
                <td className="col-date">
                  <span className="date-value">{formatDate(expense.date)}</span>
                </td>
                <td className="col-description">
                  <span className="description-value" title={expense.description}>
                    {expense.description || '—'}
                  </span>
                </td>
                <td className="col-created-by">
                  <span className="created-by-value">{expense.createdBy || '—'}</span>
                </td>
                {canEdit && (
                  <td className="col-actions">
                    <div className="action-buttons">
                      <button
                        type="button"
                        className="btn-action btn-edit"
                        onClick={() => onEdit?.(expense)}
                        title="Edit expense"
                        aria-label={`Edit expense: ${expense.description}`}
                      >
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span className="btn-text">Edit</span>
                      </button>
                      <button
                        type="button"
                        className="btn-action btn-delete"
                        onClick={() => onDelete?.(expense)}
                        title="Delete expense"
                        aria-label={`Delete expense: ${expense.description}`}
                      >
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="btn-text">Delete</span>
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpenseLedger;
