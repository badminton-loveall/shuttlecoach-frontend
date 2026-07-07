import React, { useMemo, useState } from 'react';
import type { FeeRecord, Student, Expense, PaymentFilters, PaymentMethod, ExpenseType } from '../types';
import { filterPayments, sortTransactions, getUniquePaymentMethods, getUniqueExpenseTypes } from '../utils/filtering';
import { calculateFinancialSummary } from '../utils/financial';
import './CoachProfile.css';

interface CoachPaymentsTabProps {
  coachId: string;
  fees: FeeRecord[];
  expenses?: Expense[];
  students: Student[];
}

export const CoachPaymentsTab: React.FC<CoachPaymentsTabProps> = ({
  coachId,
  fees,
  expenses = [],
  students,
}) => {
  const [filters, setFilters] = useState<PaymentFilters>({});

  const assignedStudentIds = useMemo(() => {
    return students
      .filter((s) => s.assignedCoachId === coachId)
      .map((s) => s.id);
  }, [coachId, students]);

  const coachFees = useMemo(() => {
    return fees.filter((fee) => assignedStudentIds.includes(fee.studentId));
  }, [fees, assignedStudentIds]);

  const uniqueStudents = useMemo(() => {
    return Array.from(new Set(coachFees.map((f) => f.studentId)))
      .map((studentId) => students.find((s) => s.id === studentId))
      .filter((s) => s !== undefined) as Student[];
  }, [coachFees, students]);

  const uniqueBatches = useMemo(() => {
    const batches = new Set(
      uniqueStudents
        .map((s) => s.batchId)
        .filter((b) => b !== undefined) as string[]
    );
    return Array.from(batches).sort();
  }, [uniqueStudents]);

  const uniquePaymentMethods = useMemo(() => {
    return getUniquePaymentMethods(coachFees);
  }, [coachFees]);

  const uniqueExpenseTypes = useMemo(() => {
    return getUniqueExpenseTypes(expenses);
  }, [expenses]);

  const filteredAndSorted = useMemo(() => {
    const filtered = filterPayments(coachFees, expenses, filters);
    return sortTransactions(filtered);
  }, [coachFees, expenses, filters]);

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

  const handleFilterChange = (key: keyof PaymentFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleClearFilters = () => {
    setFilters({});
  };

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

  if (coachFees.length === 0) {
    return (
      <div className="tab-empty">
        <p className="empty-text">No payment records for students of this coach</p>
      </div>
    );
  }

  return (
    <div className="coach-profile-tab-content">
      <div className="tab-header">
        <h3 className="tab-title">Payment Records & Expenses</h3>
      </div>

      <div className="filters-section">
        <div className="filters-container">
          <div className="filter-group">
            <label htmlFor="dateFrom" className="filter-label">From Date</label>
            <input id="dateFrom" type="date" value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''} onChange={(e) => handleFilterChange('dateFrom', e.target.value ? new Date(e.target.value) : undefined)} className="filter-input" />
          </div>

          <div className="filter-group">
            <label htmlFor="dateTo" className="filter-label">To Date</label>
            <input id="dateTo" type="date" value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''} onChange={(e) => handleFilterChange('dateTo', e.target.value ? new Date(e.target.value) : undefined)} className="filter-input" />
          </div>

          <div className="filter-group">
            <label htmlFor="student" className="filter-label">Student</label>
            <select id="student" value={filters.student || ''} onChange={(e) => handleFilterChange('student', e.target.value || undefined)} className="filter-select">
              <option value="">All Students</option>
              {uniqueStudents.map((student) => (<option key={student.id} value={student.id}>{student.fullName}</option>))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="batch" className="filter-label">Batch</label>
            <select id="batch" value={filters.batch || ''} onChange={(e) => handleFilterChange('batch', e.target.value || undefined)} className="filter-select">
              <option value="">All Batches</option>
              {uniqueBatches.map((batch) => (<option key={batch} value={batch}>{batch}</option>))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="paymentMethod" className="filter-label">Payment Method</label>
            <select id="paymentMethod" value={filters.paymentMethod || ''} onChange={(e) => handleFilterChange('paymentMethod', e.target.value as PaymentMethod | undefined)} className="filter-select">
              <option value="">All Methods</option>
              {uniquePaymentMethods.map((method) => (<option key={method} value={method}>{method}</option>))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="expenseType" className="filter-label">Expense Type</label>
            <select id="expenseType" value={filters.expenseType || ''} onChange={(e) => handleFilterChange('expenseType', e.target.value as ExpenseType | undefined)} className="filter-select">
              <option value="">All Types</option>
              {uniqueExpenseTypes.map((type) => (<option key={type} value={type}>{type}</option>))}
            </select>
          </div>

          {hasActiveFilters && (
            <div className="filter-group filter-button-group">
              <button onClick={handleClearFilters} className="btn-secondary filter-button" aria-label="Clear all filters">Clear Filters</button>
            </div>
          )}
        </div>

        {hasActiveFilters && (
          <div className="active-filters">
            {filters.dateFrom && (<span className="filter-badge">From: {filters.dateFrom.toLocaleDateString('en-IN')}</span>)}
            {filters.dateTo && (<span className="filter-badge">To: {filters.dateTo.toLocaleDateString('en-IN')}</span>)}
            {filters.student && (<span className="filter-badge">Student: {uniqueStudents.find((s) => s.id === filters.student)?.fullName}</span>)}
            {filters.batch && (<span className="filter-badge">Batch: {filters.batch}</span>)}
            {filters.paymentMethod && (<span className="filter-badge">Method: {filters.paymentMethod}</span>)}
            {filters.expenseType && (<span className="filter-badge">Type: {filters.expenseType}</span>)}
          </div>
        )}

        <div className="filter-result-info">
          Showing {stats.count} transaction{stats.count !== 1 ? 's' : ''}
          {hasActiveFilters && ` (filtered from ${coachFees.length + expenses.length} total)`}
        </div>
      </div>

      <div className="payment-stats-grid">
        <div className="stat-card"><div className="stat-label">Total Income</div><div className="stat-value">{formatCurrency(stats.totalIncome)}</div></div>
        <div className="stat-card"><div className="stat-label">Total Expenses</div><div className="stat-value">{formatCurrency(stats.totalExpenses)}</div></div>
        <div className="stat-card"><div className="stat-label">Net Balance</div><div className={`stat-value ${stats.netBalance < 0 ? 'negative' : 'positive'}`}>{formatCurrency(stats.netBalance)}</div></div>
        <div className="stat-card stat-card--success"><div className="stat-label">Paid</div><div className="stat-value">{formatCurrency(stats.paid)}</div></div>
        <div className="stat-card stat-card--warning"><div className="stat-label">Pending</div><div className="stat-value">{formatCurrency(stats.pending)}</div></div>
        <div className="stat-card stat-card--danger"><div className="stat-label">Overdue</div><div className="stat-value">{formatCurrency(stats.overdue)}</div></div>
      </div>

      <div className="payment-table-container">
        <table className="payment-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Student Name</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Details</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.length === 0 ? (
              <tr><td colSpan={6} className="cell-empty">No transactions match the selected filters</td></tr>
            ) : (
              filteredAndSorted.map((transaction) => {
                const isFee = 'monthYear' in transaction;
                const fee = isFee ? (transaction as FeeRecord) : null;
                const expense = !isFee ? (transaction as Expense) : null;

                if (fee) {
                  const student = students.find((s) => s.id === fee.studentId);
                  return (
                    <tr key={fee.id} className="row-fee">
                      <td className="cell-type"><span className="type-badge type-badge--income">Income</span></td>
                      <td className="cell-student"><div className="student-cell"><span className="student-name">{student?.fullName || 'Unknown'}</span><span className="student-email">{student?.email || '—'}</span></div></td>
                      <td className="cell-amount">{formatCurrency(fee.amount)}</td>
                      <td className="cell-date">{(fee.paidDate || fee.createdAt).toLocaleDateString('en-IN', {year: 'numeric', month: 'short', day: 'numeric'})}</td>
                      <td className="cell-details"><span className="detail-month">{fee.monthYear}</span>{fee.transactionRef && <span className="detail-ref">Ref: {fee.transactionRef}</span>}</td>
                      <td className="cell-status"><span className={`badge ${getStatusBadge(fee.status)}`}>{getStatusLabel(fee.status)}</span></td>
                    </tr>
                  );
                } else if (expense) {
                  return (
                    <tr key={expense.id} className="row-expense">
                      <td className="cell-type"><span className="type-badge type-badge--expense">Expense</span></td>
                      <td className="cell-student"><span className="expense-type-label">{expense.type}</span></td>
                      <td className="cell-amount cell-amount--expense">{formatCurrency(expense.amount)}</td>
                      <td className="cell-date">{expense.date.toLocaleDateString('en-IN', {year: 'numeric', month: 'short', day: 'numeric'})}</td>
                      <td className="cell-details"><span className="detail-description">{expense.description}</span></td>
                      <td className="cell-status"><span className="badge badge--secondary">Recorded</span></td>
                    </tr>
                  );
                }
                return null;
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CoachPaymentsTab;
