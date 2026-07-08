import React, { useMemo, useState, useCallback } from 'react';
import type { FeeRecord, Student, Expense, PaymentFilters, PaymentMethod, ExpenseType } from '../types';
import { filterPayments, sortTransactions, getUniquePaymentMethods, getUniqueExpenseTypes } from '../utils/filtering';
import { calculateFinancialSummary } from '../utils/financial';
import { ExpenseLedger } from './ExpenseLedger';
import './CoachProfile.css';

/**
 * CoachPaymentsTab Component
 * Displays payment records for students assigned to this coach
 * Features: filter by date range, student, batch, payment method, expense type
 * Also supports sorting by date descending and recalculation of summaries
 * Delete expense functionality with confirmation dialog
 * Requirements: 13.4, 16.4, 16.5, 16.6, 15.4, 15.5, 15.6, 15.7
 */

interface CoachPaymentsTabProps {
  coachId: string;
  fees: FeeRecord[];
  expenses?: Expense[];
  students: Student[];
  onExpenseDeleted?: (expenseId: string) => void;
  userRole?: 'HEAD_COACH' | 'ASSISTANT_COACH' | 'ADMIN' | 'STUDENT';
}

export const CoachPaymentsTab: React.FC<CoachPaymentsTabProps> = ({
  coachId,
  fees,
  expenses = [],
  students,
  onExpenseDeleted,
  userRole = 'HEAD_COACH',
}) => {
  // Filter state for payments
  const [filters, setFilters] = useState<PaymentFilters>({});
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter students assigned to this coach
  const assignedStudentIds = useMemo(() => {
    return students
      .filter((s) => s.assignedCoachId === coachId)
      .map((s) => s.id);
  }, [coachId, students]);

  // Filter fees for assigned students
  const coachFees = useMemo(() => {
    return fees.filter((fee) => assignedStudentIds.includes(fee.studentId));
  }, [fees, assignedStudentIds]);

  // Get unique students (dropdown helper)
  const uniqueStudents = useMemo(() => {
    return Array.from(new Set(coachFees.map((f) => f.studentId)))
      .map((studentId) => students.find((s) => s.id === studentId))
      .filter((s) => s !== undefined) as Student[];
  }, [coachFees, students]);

  // Get unique batches from students
  const uniqueBatches = useMemo(() => {
    const batches = new Set(
      uniqueStudents
        .map((s) => s.batchId)
        .filter((b) => b !== undefined) as string[]
    );
    return Array.from(batches).sort();
  }, [uniqueStudents]);

  // Get unique payment methods
  const uniquePaymentMethods = useMemo(() => {
    return getUniquePaymentMethods(coachFees);
  }, [coachFees]);

  // Get unique expense types
  const uniqueExpenseTypes = useMemo(() => {
    return getUniqueExpenseTypes(expenses);
  }, [expenses]);

  // Apply filters and sort
  const filteredAndSorted = useMemo(() => {
    const filtered = filterPayments(coachFees, expenses, filters);
    return sortTransactions(filtered);
  }, [coachFees, expenses, filters]);

  // Calculate recalculated summaries based on filtered data
  const stats = useMemo(() => {
    const filteredFees = filteredAndSorted.filter((t) => 'monthYear' in t) as FeeRecord[];
    const filteredExpenses = filteredAndSorted.filter((t) => 'type' in t) as Expense[];

    const summary = calculateFinancialSummary(filteredFees, filteredExpenses);

    const paid = filteredFees.filter((f) => f.status === 'PAID').reduce((sum, f) => sum + f.amount, 0);
    const pending = filteredFees.filter((f) => f.status === 'PENDING').reduce((sum, f) => sum + f.amount, 0);
    const overdue = filteredFees.filter((f) => f.status === 'OVERDUE').reduce((sum, f) => sum + f.amount, 0);
    const waived = filteredFees.filter((f) => f.status === 'WAIVED').reduce((sum, f) => sum + f.amount, 0);

    return {
      totalIncome: summary.totalIncome,
      totalExpenses: summary.totalExpenses,
      netBalance: summary.netBalance,
      paid,
      pending,
      overdue,
      waived,
      count: filteredAndSorted.length,
    };
  }, [filteredAndSorted]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.dateFrom !== undefined ||
      filters.dateTo !== undefined ||
      filters.student !== undefined ||
      filters.batch !== undefined ||
      filters.paymentMethod !== undefined ||
      filters.expenseType !== undefined
    );
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (key: keyof PaymentFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({});
  };

  // Open delete confirmation dialog
  const handleDeleteClick = useCallback((expense: Expense) => {
    setExpenseToDelete(expense);
    setDeleteDialogOpen(true);
  }, []);

  // Close delete confirmation dialog
  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setExpenseToDelete(null);
  }, []);

  // Confirm and execute delete - with optimistic updates (Requirement 20.4)
  const handleConfirmDelete = useCallback(async () => {
    if (!expenseToDelete) return;

    setIsDeleting(true);
    try {
      // Call parent callback to trigger deletion
      if (onExpenseDeleted) {
        // Optimistic update: close dialog immediately
        handleCloseDeleteDialog();
        // Trigger the deletion which will refetch data and show notifications
        await onExpenseDeleted(expenseToDelete.id);
      }
    } catch (err) {
      console.error('Failed to delete expense:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [expenseToDelete, onExpenseDeleted, handleCloseDeleteDialog]);

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      PAID: 'badge--success',
      PENDING: 'badge--warning',
      OVERDUE: 'badge--danger',
      WAIVED: 'badge--info',
    };
    return statusMap[status] || 'badge--default';
  };

  const getStatusLabel = (status: string): string => {
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  // Check if no data exists at all
  if (coachFees.length === 0 && expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payment Records</h3>
        <p className="text-gray-600 text-center mb-6 max-w-sm">
          No income or expense records found for this coach yet. Income records will appear as students pay their fees.
        </p>
        {(userRole === 'HEAD_COACH' || userRole === 'ADMIN') && (
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Add new expense"
            onClick={() => {
              // This would typically open the AddExpenseForm modal
              // For now, just scroll to the section
              window.scrollTo(0, document.body.scrollHeight);
            }}
          >
            Record First Expense
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="coach-profile-tab-content">
      <div className="tab-header">
        <h3 className="tab-title">Payment Records & Expenses</h3>
      </div>

      {/* Filter UI */}
      <section className="filters-section" aria-label="Payment transaction filters">
        <div className="filters-container">
          {/* Date From Filter */}
          <div className="filter-group">
            <label htmlFor="dateFrom" className="filter-label">
              From Date
            </label>
            <input
              id="dateFrom"
              type="date"
              value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
              onChange={(e) =>
                handleFilterChange('dateFrom', e.target.value ? new Date(e.target.value) : undefined)
              }
              className="filter-input"
              aria-label="Filter transactions from date"
            />
          </div>

          {/* Date To Filter */}
          <div className="filter-group">
            <label htmlFor="dateTo" className="filter-label">
              To Date
            </label>
            <input
              id="dateTo"
              type="date"
              value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
              onChange={(e) =>
                handleFilterChange('dateTo', e.target.value ? new Date(e.target.value) : undefined)
              }
              className="filter-input"
              aria-label="Filter transactions to date"
            />
          </div>

          {/* Student Filter */}
          <div className="filter-group">
            <label htmlFor="student" className="filter-label">
              Student
            </label>
            <select
              id="student"
              value={filters.student || ''}
              onChange={(e) => handleFilterChange('student', e.target.value || undefined)}
              className="filter-select"
              aria-label="Filter transactions by student"
            >
              <option value="">All Students</option>
              {uniqueStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Filter */}
          <div className="filter-group">
            <label htmlFor="batch" className="filter-label">
              Batch
            </label>
            <select
              id="batch"
              value={filters.batch || ''}
              onChange={(e) => handleFilterChange('batch', e.target.value || undefined)}
              className="filter-select"
              aria-label="Filter transactions by batch"
            >
              <option value="">All Batches</option>
              {uniqueBatches.map((batch) => (
                <option key={batch} value={batch}>
                  {batch}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div className="filter-group">
            <label htmlFor="paymentMethod" className="filter-label">
              Payment Method
            </label>
            <select
              id="paymentMethod"
              value={filters.paymentMethod || ''}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value as PaymentMethod | undefined)}
              className="filter-select"
              aria-label="Filter transactions by payment method"
            >
              <option value="">All Methods</option>
              {uniquePaymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>

          {/* Expense Type Filter */}
          <div className="filter-group">
            <label htmlFor="expenseType" className="filter-label">
              Expense Type
            </label>
            <select
              id="expenseType"
              value={filters.expenseType || ''}
              onChange={(e) => handleFilterChange('expenseType', e.target.value as ExpenseType | undefined)}
              className="filter-select"
              aria-label="Filter transactions by expense type"
            >
              <option value="">All Types</option>
              {uniqueExpenseTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="filter-group filter-button-group">
              <button
                onClick={handleClearFilters}
                className="btn-secondary filter-button"
                aria-label="Clear all active filters"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="active-filters">
            {filters.dateFrom && (
              <span className="filter-badge">
                From: {filters.dateFrom.toLocaleDateString('en-IN')}
              </span>
            )}
            {filters.dateTo && (
              <span className="filter-badge">
                To: {filters.dateTo.toLocaleDateString('en-IN')}
              </span>
            )}
            {filters.student && (
              <span className="filter-badge">
                Student: {uniqueStudents.find((s) => s.id === filters.student)?.fullName}
              </span>
            )}
            {filters.batch && (
              <span className="filter-badge">Batch: {filters.batch}</span>
            )}
            {filters.paymentMethod && (
              <span className="filter-badge">Method: {filters.paymentMethod}</span>
            )}
            {filters.expenseType && (
              <span className="filter-badge">Type: {filters.expenseType}</span>
            )}
          </div>
        )}

        {/* Result Count */}
        <div className="filter-result-info">
          Showing {stats.count} transaction{stats.count !== 1 ? 's' : ''}
          {hasActiveFilters && ` (filtered from ${coachFees.length + expenses.length} total)`}
        </div>
      </section>

      {/* Payment Statistics */}
      <div className="payment-stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Income</div>
          <div className="stat-value">{formatCurrency(stats.totalIncome)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value">{formatCurrency(stats.totalExpenses)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Net Balance</div>
          <div className={`stat-value ${stats.netBalance < 0 ? 'negative' : 'positive'}`}>
            {formatCurrency(stats.netBalance)}
          </div>
        </div>

        <div className="stat-card stat-card--success">
          <div className="stat-label">Paid</div>
          <div className="stat-value">{formatCurrency(stats.paid)}</div>
        </div>

        <div className="stat-card stat-card--warning">
          <div className="stat-label">Pending</div>
          <div className="stat-value">{formatCurrency(stats.pending)}</div>
        </div>

        <div className="stat-card stat-card--danger">
          <div className="stat-label">Overdue</div>
          <div className="stat-value">{formatCurrency(stats.overdue)}</div>
        </div>
      </div>

      {/* Income & Payment Records Table */}
      <section className="payment-section" aria-label="Income records">
        <h4 className="section-title">Income Records</h4>
        <div className="payment-table-container">
          <table className="payment-table" aria-label="Student fee income transactions">
            <thead>
              <tr>
                <th scope="col">Type</th>
                <th scope="col">Student Name</th>
                <th scope="col">Amount</th>
                <th scope="col">Date</th>
                <th scope="col">Details</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.filter((t) => 'monthYear' in t).length === 0 ? (
                <tr>
                  <td colSpan={6} className="cell-empty">
                    <div className="empty-cell-content">
                      <svg className="empty-cell-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="empty-cell-message">
                        {Object.keys(filters).length > 0 && (filters.dateFrom || filters.dateTo || filters.student || filters.batch || filters.paymentMethod)
                          ? 'No income records match the selected filters'
                          : 'No income records yet. Income will appear as students pay their fees.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSorted.map((transaction) => {
                  const isFee = 'monthYear' in transaction;
                  if (!isFee) return null;

                  const fee = transaction as FeeRecord;
                  const student = students.find((s) => s.id === fee.studentId);
                  return (
                    <tr key={fee.id} className="row-fee">
                      <td className="cell-type">
                        <span className="type-badge type-badge--income">Income</span>
                      </td>
                      <td className="cell-student">
                        <div className="student-cell">
                          <span className="student-name">{student?.fullName || 'Unknown'}</span>
                          <span className="student-email">{student?.email || '—'}</span>
                        </div>
                      </td>
                      <td className="cell-amount">{formatCurrency(fee.amount)}</td>
                      <td className="cell-date">
                        {(fee.paidDate || fee.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="cell-details">
                        <span className="detail-month">{fee.monthYear}</span>
                        {fee.transactionRef && <span className="detail-ref">Ref: {fee.transactionRef}</span>}
                      </td>
                      <td className="cell-status">
                        <span className={`badge ${getStatusBadge(fee.status)}`}>
                          {getStatusLabel(fee.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Expense Ledger Section */}
      <section className="payment-section" aria-label="Expense records">
        <ExpenseLedger 
          expenses={filteredAndSorted.filter((t) => 'type' in t) as Expense[]}
          filters={filters}
          isLoading={false}
          onDelete={handleDeleteClick}
          canEdit={userRole === 'HEAD_COACH' || userRole === 'ADMIN'}
        />
      </section>

      {/* Delete Expense Confirmation Dialog */}
      {deleteDialogOpen && expenseToDelete && (
        <div 
          className="dialog-overlay" 
          onClick={handleCloseDeleteDialog}
          role="presentation"
        >
          <div 
            className="dialog-content" 
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
          >
            <div className="dialog-icon-danger">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v2M12 17v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h2 id="delete-dialog-title" className="dialog-title">Delete Expense?</h2>

            <p id="delete-dialog-description" className="dialog-message">
              Are you sure you want to delete this expense? This action cannot be undone.
            </p>

            <div className="dialog-details">
              <div className="detail-row">
                <span className="detail-label">Type:</span>
                <span className="detail-value">{expenseToDelete.type}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Amount:</span>
                <span className="detail-value">{formatCurrency(expenseToDelete.amount)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date:</span>
                <span className="detail-value">
                  {expenseToDelete.date.toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Description:</span>
                <span className="detail-value">{expenseToDelete.description}</span>
              </div>
            </div>

            <div className="dialog-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCloseDeleteDialog}
                disabled={isDeleting}
                aria-label="Cancel expense deletion"
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                aria-label="Confirm expense deletion"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachPaymentsTab;
