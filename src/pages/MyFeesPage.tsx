import React, { useMemo } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { StatCard } from '../components/StatCard';
import { useFees } from '../hooks/useFees';
import type { FeeStatus } from '../types';
import { computeAllFeeStatuses } from '../utils/feeUtils';
import { formatCurrency, formatDate, formatMonthYear } from '../utils/formatters';

/**
 * MyFeesPage
 * Displays the student's own fee balance and payment history.
 */

function getStatusBadgeClasses(status: FeeStatus): string {
  switch (status) {
    case 'PAID':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'OVERDUE':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'WAIVED':
      return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
  }
}

export const MyFeesPage: React.FC = () => {
  const { fees: rawFees, loading, error } = useFees();

  const fees = useMemo(() => {
    const withStatuses = computeAllFeeStatuses(rawFees);
    return withStatuses.sort((a, b) => new Date(b.monthYear).getTime() - new Date(a.monthYear).getTime());
  }, [rawFees]);

  const outstandingBalance = useMemo(
    () => fees.filter((f) => f.status === 'PENDING' || f.status === 'OVERDUE').reduce((sum, f) => sum + f.amount, 0),
    [fees]
  );
  const overdueCount = useMemo(() => fees.filter((f) => f.status === 'OVERDUE').length, [fees]);
  const paidCount = useMemo(() => fees.filter((f) => f.status === 'PAID').length, [fees]);

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="section-stack">
          <div className="page-header">
            <div>
              <h1 className="page-header-title">My Fees</h1>
              <p className="page-header-subtitle">
                Your payment history and outstanding balance
              </p>
            </div>
          </div>

          {/* Summary Cards — reuses the coach dashboard's StatCard for identical sizing */}
          <div className="card-grid">
            <StatCard
              title="Outstanding Balance"
              value={loading ? '...' : formatCurrency(outstandingBalance)}
              label={!loading && outstandingBalance > 0 ? 'Payment due' : undefined}
              variant="primary"
            />
            <StatCard
              title="Overdue Months"
              value={loading ? '...' : overdueCount}
              variant="danger"
            />
            <StatCard
              title="Months Paid"
              value={loading ? '...' : paidCount}
              variant="success"
            />
          </div>

          {/* Fee History */}
          <div>
            <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
              Payment History
            </h2>

            {loading ? (
              <div className="shadow text-center" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-xl)', backgroundColor: 'var(--surface-card)' }}>
                <p style={{ color: 'var(--text-tertiary)' }}>Loading fee records...</p>
              </div>
            ) : error ? (
              <div className="shadow text-center" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-xl)', backgroundColor: 'var(--surface-card)' }}>
                <p style={{ color: 'var(--text-tertiary)' }}>{error}</p>
              </div>
            ) : fees.length === 0 ? (
              <div className="shadow text-center" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-xl)', backgroundColor: 'var(--surface-card)' }}>
                <p style={{ color: 'var(--text-tertiary)' }}>No fee records found</p>
              </div>
            ) : (
              <div className="shadow overflow-hidden" style={{ borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface-card)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead style={{ backgroundColor: 'var(--surface-hover)' }}>
                      <tr>
                        <th className="text-left text-xs font-medium uppercase tracking-wider" style={{ padding: 'var(--space-sm) var(--space-lg)', color: 'var(--text-tertiary)' }}>Month/Year</th>
                        <th className="text-left text-xs font-medium uppercase tracking-wider" style={{ padding: 'var(--space-sm) var(--space-lg)', color: 'var(--text-tertiary)' }}>Amount</th>
                        <th className="text-left text-xs font-medium uppercase tracking-wider" style={{ padding: 'var(--space-sm) var(--space-lg)', color: 'var(--text-tertiary)' }}>Due Date</th>
                        <th className="text-left text-xs font-medium uppercase tracking-wider" style={{ padding: 'var(--space-sm) var(--space-lg)', color: 'var(--text-tertiary)' }}>Status</th>
                        <th className="text-left text-xs font-medium uppercase tracking-wider" style={{ padding: 'var(--space-sm) var(--space-lg)', color: 'var(--text-tertiary)' }}>Paid Date</th>
                        <th className="text-left text-xs font-medium uppercase tracking-wider" style={{ padding: 'var(--space-sm) var(--space-lg)', color: 'var(--text-tertiary)' }}>Method</th>
                      </tr>
                    </thead>
                    <tbody style={{ borderTop: '1px solid var(--border-default)', backgroundColor: 'var(--surface-card)' }}>
                      {fees.map((fee) => (
                        <tr key={fee.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                          <td className="whitespace-nowrap text-sm font-medium" style={{ padding: 'var(--space-md) var(--space-lg)', color: 'var(--text-primary)' }}>
                            {formatMonthYear(fee.monthYear)}
                          </td>
                          <td className="whitespace-nowrap text-sm font-medium" style={{ padding: 'var(--space-md) var(--space-lg)', color: 'var(--text-primary)' }}>
                            {formatCurrency(fee.amount)}
                          </td>
                          <td className="whitespace-nowrap text-sm" style={{ padding: 'var(--space-md) var(--space-lg)', color: 'var(--text-tertiary)' }}>
                            {formatDate(fee.dueDate)}
                          </td>
                          <td className="whitespace-nowrap" style={{ padding: 'var(--space-md) var(--space-lg)' }}>
                            <span
                              className={`inline-flex text-xs font-semibold ${getStatusBadgeClasses(fee.status)}`}
                              style={{ padding: 'var(--space-xs) var(--space-sm)', borderRadius: 'var(--radius-pill)' }}
                            >
                              {fee.status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap text-sm" style={{ padding: 'var(--space-md) var(--space-lg)', color: 'var(--text-tertiary)' }}>
                            {fee.paidDate ? formatDate(fee.paidDate) : '-'}
                          </td>
                          <td className="whitespace-nowrap text-sm" style={{ padding: 'var(--space-md) var(--space-lg)', color: 'var(--text-tertiary)' }}>
                            {fee.paymentMethod || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyFeesPage;
