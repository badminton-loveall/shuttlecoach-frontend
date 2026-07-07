import React from 'react';
import type { FeeRecord, Student, FeeStatus } from '../types';
import '../styles/pages.css';

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
  onEdit?: (feeId: string) => void;
  onDelete?: (feeId: string) => void;
}

export const FeeListTable: React.FC<FeeListTableProps> = ({ fees, students, onMarkPaid, onWaive, onEdit, onDelete }) => {
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
        return 'table-badge table-badge--success';
      case 'PENDING':
        return 'table-badge table-badge--pending';
      case 'OVERDUE':
        return 'table-badge table-badge--overdue';
      case 'WAIVED':
        return 'table-badge table-badge--waived';
      default:
        return 'table-badge table-badge--pending';
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
      <div className="table-filter-section">
        <div className="table-empty">No fee records found</div>
      </div>
    );
  }

  return (
    <div className="table-filter-section">
      <div className="table-container">
        <table className="table-styled">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Month/Year</th>
              <th>Amount</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedFees.map((fee) => (
              <tr key={fee.id}>
                <td className="text-bold">{getStudentName(fee.studentId)}</td>
                <td className="text-muted">{fee.monthYear}</td>
                <td className="text-bold">{formatCurrency(fee.amount)}</td>
                <td className="text-muted">{formatDate(fee.dueDate)}</td>
                <td>
                  <span className={getStatusBadgeClasses(fee.status)}>
                    {fee.status}
                  </span>
                </td>
                <td>
                  {(fee.status === 'PENDING' || fee.status === 'OVERDUE') && (
                    <div className="flex gap-2 flex-wrap">
                      {onEdit && (fee.status === 'PENDING' || fee.status === 'OVERDUE') && (
                        <button
                          onClick={() => onEdit(fee.id)}
                          className="table-action-link table-action-link--info"
                        >
                          Edit
                        </button>
                      )}
                      {onMarkPaid && (
                        <button
                          onClick={() => onMarkPaid(fee.id)}
                          className="table-action-link table-action-link--success"
                        >
                          Mark Paid
                        </button>
                      )}
                      {onWaive && (
                        <button
                          onClick={() => onWaive(fee.id)}
                          className="table-action-link table-action-link--primary"
                        >
                          Waive
                        </button>
                      )}
                      {onDelete && fee.status === 'PENDING' && (
                        <button
                          onClick={() => onDelete(fee.id)}
                          className="table-action-link table-action-link--danger"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                  {fee.status === 'PAID' && fee.paidDate && (
                    <span className="table-action-link table-action-link--muted">
                      Paid on {formatDate(fee.paidDate)}
                    </span>
                  )}
                  {fee.status === 'WAIVED' && (
                    <span className="table-action-link table-action-link--muted">
                      Fee waived
                    </span>
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
