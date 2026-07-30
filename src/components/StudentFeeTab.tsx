import React, { useState, useMemo } from 'react';
import type { Student } from '../types';
import CreateFeeModal, { type CreateFeeFormData } from './CreateFeeModal';
import EditFeeModal, { type EditFeeFormData } from './EditFeeModal';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { useFees } from '../hooks/useFees';
import { computeFeeStats } from '../utils/feeStats';
import { useToast } from '../contexts/ToastContext';
import './StudentFeeTab.css';

interface StudentFeeTabProps {
  student: Student;
}

export const StudentFeeTab: React.FC<StudentFeeTabProps> = ({ student }) => {
  const [isCreateFeeModalOpen, setIsCreateFeeModalOpen] = useState(false);
  const [isEditFeeModalOpen, setIsEditFeeModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFeeId, setSelectedFeeId] = useState<string | null>(null);

  const { fees, loading, error, createFee, markFeeAsPaid, waiveFee } = useFees({
    studentId: student.id,
  });
  const { showToast } = useToast();

  // Sort fees by dueDate ascending
  const studentFees = useMemo(() => {
    return [...fees].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  }, [fees]);

  // Compute fee statistics using shared utility
  const stats = useMemo(() => computeFeeStats(fees), [fees]);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Format date
  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Get status badge color classes
  const getStatusBadgeClasses = (status: string): string => {
    switch (status) {
      case 'PAID':
        return 'fee-status-badge fee-status-badge--paid';
      case 'PENDING':
        return 'fee-status-badge fee-status-badge--pending';
      case 'OVERDUE':
        return 'fee-status-badge fee-status-badge--overdue';
      case 'WAIVED':
        return 'fee-status-badge fee-status-badge--waived';
      default:
        return 'fee-status-badge fee-status-badge--pending';
    }
  };

  // Handler for creating new fee via API
  const handleCreateFeeSubmit = async (feeData: CreateFeeFormData) => {
    try {
      await createFee({
        studentId: student.id,
        amount: feeData.amount,
        monthYear: feeData.monthYear,
        dueDate: feeData.dueDate,
        notes: feeData.notes,
      });
      setIsCreateFeeModalOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create fee. Please try again.';
      showToast({ message, type: 'error' });
    }
  };

  // Handler for opening edit fee modal
  const handleEditFeeClick = (feeId: string) => {
    setSelectedFeeId(feeId);
    setIsEditFeeModalOpen(true);
  };

  // Handler for closing edit fee modal
  const handleCloseEditFeeModal = () => {
    setIsEditFeeModalOpen(false);
    setSelectedFeeId(null);
  };

  // Handler for submitting edit fee - marks as paid via API
  const handleEditFeeSubmit = async (feeData: EditFeeFormData) => {
    try {
      await markFeeAsPaid(feeData.feeId, {
        paidDate: new Date().toISOString(),
        paymentMethod: 'CASH',
        notes: feeData.notes,
      });
      handleCloseEditFeeModal();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update fee. Please try again.';
      showToast({ message, type: 'error' });
    }
  };

  // Handler for opening delete confirmation dialog (waive fee)
  const handleDeleteFeeClick = (feeId: string) => {
    setSelectedFeeId(feeId);
    setIsDeleteDialogOpen(true);
  };

  // Handler for closing delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedFeeId(null);
  };

  // Handler for confirming fee deletion (waive via API)
  const handleDeleteFeeConfirm = async () => {
    if (!selectedFeeId) return;

    try {
      await waiveFee(selectedFeeId, { reason: 'Waived by coach' });
      handleCloseDeleteDialog();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to waive fee. Please try again.';
      showToast({ message, type: 'error' });
    }
  };

  // Get selected fee details
  const selectedFee = selectedFeeId ? fees.find((fee) => fee.id === selectedFeeId) ?? null : null;

  // Loading state
  if (loading) {
    return (
      <div className="student-fee-tab">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading fees...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="student-fee-tab">
        <div className="flex flex-col items-center justify-center py-12">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-500 dark:text-red-400 mb-3">
            <path d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
          </svg>
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-fee-tab">
      {/* Statistics Cards */}
      <div className="fee-stats-grid">
        <div className="fee-stat-card">
          <div className="fee-stat-label">Total Fees</div>
          <div className="fee-stat-value">{formatCurrency(stats.totalAmount)}</div>
          <div className="fee-stat-count">{studentFees.length} fees</div>
        </div>

        <div className="fee-stat-card fee-stat-card--paid">
          <div className="fee-stat-label">Paid</div>
          <div className="fee-stat-value">{formatCurrency(stats.paidAmount)}</div>
        </div>

        <div className="fee-stat-card fee-stat-card--pending">
          <div className="fee-stat-label">Pending</div>
          <div className="fee-stat-value">{formatCurrency(stats.pendingAmount)}</div>
        </div>

        {stats.overdueCount > 0 && (
          <div className="fee-stat-card fee-stat-card--overdue">
            <div className="fee-stat-label">Overdue</div>
            <div className="fee-stat-value">{stats.overdueCount} fees</div>
          </div>
        )}
      </div>

      {/* Header with Create Button */}
      <div className="fee-tab-header">
        <div>
          <h3 className="fee-tab-title">Fee Records</h3>
          <p className="fee-tab-subtitle">Manage fee payments for {student.fullName}</p>
        </div>
        <button
          onClick={() => setIsCreateFeeModalOpen(true)}
          className="btn-create-fee-student"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Fee
        </button>
      </div>

      {/* Fees Table */}
      {studentFees.length > 0 ? (
        <div className="fees-table-container">
          <table className="fees-table">
            <thead>
              <tr>
                <th>Month/Year</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {studentFees.map((fee) => (
                <tr key={fee.id} className={`fee-row fee-row--${fee.status.toLowerCase()}`}>
                  <td className="fee-month">{fee.monthYear}</td>
                  <td className="fee-amount">{formatCurrency(fee.amount)}</td>
                  <td className="fee-date">{formatDate(fee.dueDate)}</td>
                  <td>
                    <span className={getStatusBadgeClasses(fee.status)}>
                      {fee.status}
                    </span>
                  </td>
                  <td>
                    <div className="fee-actions">
                      {(fee.status === 'PENDING' || fee.status === 'OVERDUE') && (
                        <>
                          <button
                            onClick={() => handleEditFeeClick(fee.id)}
                            className="fee-action-btn fee-action-btn--edit"
                            title="Edit fee"
                          >
                            Edit
                          </button>
                          {fee.status === 'PENDING' && (
                            <button
                              onClick={() => handleDeleteFeeClick(fee.id)}
                              className="fee-action-btn fee-action-btn--delete"
                              title="Waive fee"
                            >
                              Waive
                            </button>
                          )}
                        </>
                      )}
                      {fee.status === 'PAID' && (
                        <span className="fee-status-text">Paid</span>
                      )}
                      {fee.status === 'WAIVED' && (
                        <span className="fee-status-text">Waived</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="fees-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
            <path d="M12 6v6m0 4h.01" />
          </svg>
          <p className="fees-empty-text">No fee records found</p>
          <button
            onClick={() => setIsCreateFeeModalOpen(true)}
            className="fees-empty-button"
          >
            Create First Fee
          </button>
        </div>
      )}

      {/* Modals */}
      <CreateFeeModal
        isOpen={isCreateFeeModalOpen}
        onClose={() => setIsCreateFeeModalOpen(false)}
        onSubmit={handleCreateFeeSubmit}
        students={[student]}
        existingFees={fees}
      />

      <EditFeeModal
        isOpen={isEditFeeModalOpen}
        onClose={handleCloseEditFeeModal}
        onSubmit={handleEditFeeSubmit}
        fee={selectedFee}
        student={student}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleDeleteFeeConfirm}
        fee={selectedFee}
        student={student}
      />
    </div>
  );
};

export default StudentFeeTab;
