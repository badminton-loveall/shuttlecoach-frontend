import React from 'react';
import type { FeeRecord, Student, FeeStatus } from '../types';

/**
 * FeeListTable Component
 * Displays fee records in a table format with status indicators and action buttons
 * Requirements: 10.3, 10.4, 10.5, 10.6
 */

interface FeeListTableProps {
  fees: FeeRecord[];
  students: Student[];
  onMarkPaid?: (feeId: string) => void;
  onWaive?: (feeId: string) => void;
}

export const FeeListTable: React.FC<FeeListTableProps> = ({ fees, students, onMarkPaid, onWaive }) => {
  // Create a map for quick student lookup
  const studentMap = React.useMemo(() => {
    return students.reduce(
      (acc, student) => {
        acc[student.id] = student;
        return acc;
      },
      {} as Record<string, Student>
    );
  }, [students]);

  // Sort fees by due date (earliest first)
  const sortedFees = React.useMemo(() => {
    return [...fees].sort((a, b) => {
      const dateA = new Date(a.dueDate).getTime();
      const dateB = new Date(b.dueDate).getTime();
      return dateA - dateB;
    });
  }, [fees]);

  // Get student name by ID
  const getStudentName = (studentId: string): string => {
    return studentMap[studentId]?.fullName || 'Unknown Student';
  };

  // Get badge color classes based on status
  const getStatusBadgeClasses = (status: FeeStatus): string => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'WAIVED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Format date
  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  if (fees.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">No fee records found</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Student Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Month/Year
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedFees.map((fee) => (
              <tr key={fee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                  {getStudentName(fee.studentId)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {fee.monthYear}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-medium">
                  {formatCurrency(fee.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(fee.dueDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClasses(fee.status)}`}
                  >
                    {fee.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  {(fee.status === 'PENDING' || fee.status === 'OVERDUE') && (
                    <>
                      {onMarkPaid && (
                        <button
                          onClick={() => onMarkPaid(fee.id)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 font-medium"
                        >
                          Mark Paid
                        </button>
                      )}
                      {onWaive && (
                        <button
                          onClick={() => onWaive(fee.id)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                        >
                          Waive
                        </button>
                      )}
                    </>
                  )}
                  {fee.status === 'PAID' && fee.paidDate && (
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      Paid on {formatDate(fee.paidDate)}
                    </span>
                  )}
                  {fee.status === 'WAIVED' && (
                    <span className="text-gray-500 dark:text-gray-400 text-xs">Fee waived</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FeeListTable;
