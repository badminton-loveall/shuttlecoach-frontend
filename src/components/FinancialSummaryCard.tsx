import React from 'react';
import type { FinancialSummary } from '../types';

/**
 * FinancialSummaryCard Component
 * 
 * Displays financial summary metrics for coach income and expenses including:
 * - Total income, expenses, and net balance in color-coded cards
 * - Period-based breakdowns (monthly, quarterly, year-to-date)
 * - Date range display
 * - Currency formatting as INR
 * 
 * **Validates: Requirements 12.4, 16.1**
 */

interface FinancialSummaryCardProps {
  summary: FinancialSummary;
  dateRange: { from: Date; to: Date };
}

export const FinancialSummaryCard: React.FC<FinancialSummaryCardProps> = ({
  summary,
  dateRange,
}) => {
  /**
   * Format amount as INR currency with ₹ symbol and 2 decimal places
   */
  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  /**
   * Format date range for display
   */
  const formatDateRange = (): string => {
    const from = dateRange.from.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const to = dateRange.to.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `${from} - ${to}`;
  };

  /**
   * Get color classes for net balance based on positive/negative
   */
  const getNetBalanceClasses = (): string => {
    const isPositive = summary.netBalance >= 0;
    if (isPositive) {
      return 'bg-green-50 border-green-200';
    }
    return 'bg-red-50 border-red-200';
  };

  /**
   * Get text color classes for net balance value
   */
  const getNetBalanceTextClasses = (): string => {
    const isPositive = summary.netBalance >= 0;
    if (isPositive) {
      return 'text-green-700';
    }
    return 'text-red-700';
  };

  // Separate period data by type for organized display
  const monthlyData = summary.periodData.filter((p) => p.period === 'MONTH');
  const quarterlyData = summary.periodData.filter((p) => p.period === 'QUARTER');
  const yearData = summary.periodData.filter((p) => p.period === 'YEAR');

  return (
    <div className="space-y-6">
      {/* Header with date range */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Financial Summary
        </h3>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {formatDateRange()}
        </span>
      </div>

      {/* Main metrics cards - 3 column grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Total Income Card - Green */}
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                Total Income
              </p>
              <p className="mt-2 text-2xl font-bold text-green-700 dark:text-green-300">
                {formatCurrency(summary.totalIncome)}
              </p>
            </div>
            {/* Income Icon */}
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-800">
              <svg
                className="h-6 w-6 text-green-600 dark:text-green-400"
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
            </div>
          </div>
        </div>

        {/* Total Expenses Card - Red */}
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                Total Expenses
              </p>
              <p className="mt-2 text-2xl font-bold text-red-700 dark:text-red-300">
                {formatCurrency(summary.totalExpenses)}
              </p>
            </div>
            {/* Expenses Icon */}
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-800">
              <svg
                className="h-6 w-6 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Net Balance Card - Blue/Green/Red based on value */}
        <div
          className={`rounded-lg border p-6 ${getNetBalanceClasses()} dark:border-blue-800 dark:bg-blue-900/20`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Net Balance
              </p>
              <p className={`mt-2 text-2xl font-bold ${getNetBalanceTextClasses()}`}>
                {formatCurrency(summary.netBalance)}
              </p>
            </div>
            {/* Balance Icon */}
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-800">
              <svg
                className="h-6 w-6 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Period-based Breakdown Section */}
      {(monthlyData.length > 0 || quarterlyData.length > 0 || yearData.length > 0) && (
        <div className="space-y-4">
          <h4 className="text-base font-semibold text-gray-900 dark:text-white">
            Period Breakdown
          </h4>

          {/* Year-to-Date */}
          {yearData.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-3 flex items-center justify-between">
                <h5 className="font-semibold text-gray-900 dark:text-white">
                  {yearData[0].label || 'Year-to-Date'}
                </h5>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Income
                  </p>
                  <p className="mt-1 text-lg font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(yearData[0].income)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Expenses
                  </p>
                  <p className="mt-1 text-lg font-semibold text-red-600 dark:text-red-400">
                    {formatCurrency(yearData[0].expenses)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Net
                  </p>
                  <p
                    className={`mt-1 text-lg font-semibold ${
                      yearData[0].net >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatCurrency(yearData[0].net)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quarterly Breakdown */}
          {quarterlyData.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Quarterly
              </h5>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {quarterlyData.map((quarter, idx) => (
                  <div
                    key={idx}
                    className="rounded border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900"
                  >
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {quarter.label}
                    </p>
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Income:</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(quarter.income)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Exp:</span>
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          {formatCurrency(quarter.expenses)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-gray-300 pt-1 dark:border-gray-600">
                        <span className="text-gray-600 dark:text-gray-400">Net:</span>
                        <span
                          className={`font-semibold ${
                            quarter.net >= 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {formatCurrency(quarter.net)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monthly Breakdown - Scrollable on mobile */}
          {monthlyData.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Monthly
              </h5>
              <div className="overflow-x-auto">
                <div className="inline-grid min-w-full grid-cols-12 gap-2">
                  {monthlyData.map((month, idx) => (
                    <div
                      key={idx}
                      className="rounded border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-900"
                    >
                      <p className="truncate text-xs font-medium text-gray-600 dark:text-gray-400">
                        {month.label
                          ? month.label
                              .split(' ')
                              .map((word) => word.slice(0, 3))
                              .join(' ')
                          : 'Month'}
                      </p>
                      <div className="mt-1 space-y-0.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">+</span>
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(month.income)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">-</span>
                          <span className="font-semibold text-red-600 dark:text-red-400">
                            {formatCurrency(month.expenses)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state for zero transactions */}
      {summary.periodData.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-900">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            No transaction data available for the selected period
          </p>
        </div>
      )}
    </div>
  );
};

export default FinancialSummaryCard;
