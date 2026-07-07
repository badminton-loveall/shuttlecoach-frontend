import React, { useMemo } from 'react';
import type { FeeRecord, Student, PaymentMethod } from '../types';

/**
 * IncomeLedger Component
 * 
 * Displays income records from student fees in a table or list format.
 * Supports date range filtering and date-descending sorting.
 *
 * Requirements: 13.1, 13.2, 13.3
 * 
 * Features:
 * - Display all income records from student fees
 * - Show: student name, fee amount, collection date, payment method, reference
 * - Filter by date range (if provided via props)
 * - Sort by date descending (most recent first)
 * - Display empty state when no records exist
 * - Responsive design: cards on mobile, table on desktop
 * - Format currency with ₹ symbol
 */

interface IncomeLedgerProps {
  /** Array of fee records to display */
  fees: FeeRecord[];
  
  /** Array of students to look up student names */
  students: Student[];
  
  /** Optional date range filter */
  dateRange?: {
    from: Date;
    to: Date;
  };
  
  /** Optional CSS class for styling */
  className?: string;
}

export const IncomeLedger: React.FC<IncomeLedgerProps> = ({
  fees,
  students,
  dateRange,
  className = '',
}) => {
  /**
   * Filter and sort fee records
   * 1. Filter by paid status (income = PAID only)
   * 2. Filter by date range if provided
   * 3. Sort by collection date descending (most recent first)
   */
  const filteredAndSortedFees = useMemo(() => {
    // Filter to only PAID fees (income records)
    let filtered = fees.filter((fee) => fee.status === 'PAID');

    // Apply date range filter if provided
    if (dateRange) {
      filtered = filtered.filter((fee) => {
        const paidDate = fee.paidDate ? new Date(fee.paidDate) : null;
        if (!paidDate) return false;

        const fromDate = new Date(dateRange.from);
        const toDate = new Date(dateRange.to);
        
        // Set toDate to end of day for inclusive filtering
        toDate.setHours(23, 59, 59, 999);

        return paidDate >= fromDate && paidDate <= toDate;
      });
    }

    // Sort by collection date descending (most recent first)
    return [...filtered].sort((a, b) => {
      const dateA = a.paidDate ? new Date(a.paidDate).getTime() : 0;
      const dateB = b.paidDate ? new Date(b.paidDate).getTime() : 0;
      return dateB - dateA;
    });
  }, [fees, dateRange]);

  /**
   * Format currency value with ₹ symbol
   */
  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  /**
   * Format date in DD MMM YYYY format
   */
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  /**
   * Get student name from student array
   */
  const getStudentName = (studentId: string): string => {
    const student = students.find((s) => s.id === studentId);
    return student?.fullName || 'Unknown Student';
  };

  /**
   * Format payment method for display
   */
  const formatPaymentMethod = (method?: PaymentMethod): string => {
    if (!method) return '—';
    const methodMap: Record<PaymentMethod, string> = {
      CASH: 'Cash',
      UPI: 'UPI',
      BANK_TRANSFER: 'Bank Transfer',
    };
    return methodMap[method] || method;
  };

  // Empty state
  if (filteredAndSortedFees.length === 0) {
    const emptyMessage = dateRange
      ? 'No income records found in the selected date range'
      : 'No income records found';

    return (
      <div className={`text-center py-12 px-4 ${className}`}>
        <svg
          className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="mt-4 text-gray-600 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Income Records ({filteredAndSortedFees.length})
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Student Fee Income</p>
      </div>

      {/* Desktop table layout */}
      <div className="hidden lg:block overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                Student Name
              </th>
              <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                Amount
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                Collection Date
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                Payment Method
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                Reference
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredAndSortedFees.map((fee) => (
              <tr
                key={fee.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                  {getStudentName(fee.studentId)}
                </td>
                <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-semibold">
                  {formatCurrency(fee.amount)}
                </td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                  {fee.paidDate ? formatDate(new Date(fee.paidDate)) : '—'}
                </td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                  {formatPaymentMethod(fee.paymentMethod)}
                </td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                  {fee.transactionRef || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card layout */}
      <div className="lg:hidden space-y-3">
        {filteredAndSortedFees.map((fee) => (
          <div
            key={fee.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900"
          >
            <div className="flex justify-between items-start mb-3">
              <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                {getStudentName(fee.studentId)}
              </h4>
              <span className="text-base font-semibold text-green-600 dark:text-green-500">
                {formatCurrency(fee.amount)}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Collection Date</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {fee.paidDate ? formatDate(new Date(fee.paidDate)) : '—'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Payment Method</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {formatPaymentMethod(fee.paymentMethod)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Reference</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {fee.transactionRef || '—'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IncomeLedger;
