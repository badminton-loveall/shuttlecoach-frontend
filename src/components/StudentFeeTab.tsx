import React, { useState, useMemo } from 'react';
import type { Student, FeeRecord } from '../types';
import CreateFeeModal, { type CreateFeeFormData } from './CreateFeeModal';
import EditFeeModal, { type EditFeeFormData } from './EditFeeModal';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import feesData from '../data/fees.json';
import './StudentFeeTab.css';

interface StudentFeeTabProps {
  student: Student;
}

export const StudentFeeTab: React.FC<StudentFeeTabProps> = ({ student }) => {
  const [isCreateFeeModalOpen, setIsCreateFeeModalOpen] = useState(false);
  const [isEditFeeModalOpen, setIsEditFeeModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFeeId, setSelectedFeeId] = useState<string | null>(null);
  const [localFees, setLocalFees] = useState<FeeRecord[]>([]);

  // Load and filter fees for this student
  const allFees = useMemo(() => {
    const parsedFees: FeeRecord[] = (feesData as unknown as FeeRecord[]).map((fee) => ({
      ...fee,
      dueDate: new Date(fee.dueDate),
      paidDate: fee.paidDate ? new Date(fee.paidDate) : undefined,
      createdAt: new Date(fee.createdAt),
      updatedAt: new Date(fee.updatedAt),
    }));
    
    const currentFees = localFees.length > 0 ? localFees : parsedFees;
    return currentFees.filter((fee) => fee.studentId === student.id);
  }, [student.id, localFees]);

  // Get student fees sorted by due date
  const studentFees = useMemo(() => {
    return [...allFees].sort((a, b) => {
      const dateA = new Date(a.dueDate).getTime();
      const dateB = new Date(b.dueDate).getTime();
      return dateA - dateB;
    });
  }, [allFees]);

  // Calculate fee statistics
  const stats = useMemo(() => {
    const totalAmount = studentFees.reduce((sum, fee) => sum + fee.amount, 0);
    const paidAmount = studentFees
      .filter((fee) => fee.status === 'PAID')
      .reduce((sum, fee) => sum + fee.amount, 0);
    const pendingAmount = studentFees
      .filter((fee) => fee.status === 'PENDING' || fee.status === 'OVERDUE')
      .reduce((sum, fee) => sum + fee.amount, 0);
    const overdueCount = studentFees.filter((fee) => fee.status === 'OVERDUE').length;

    return {
      totalAmount,
      paidAmount,
      pendingAmount,
      overdueCount,
    };
  }, [studentFees]);

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

  // Handler for creating new fee
  const handleCreateFeeSubmit = (feeData: CreateFeeFormData) => {
    const newFee: FeeRecord = {
      id: `fee-${Date.now()}`,
      studentId: student.id,
      amount: feeData.amount,
      monthYear: feeData.monthYear,
      dueDate: feeData.dueDate,
      status: 'PENDING',
      notes: feeData.notes || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setLocalFees([...localFees, newFee]);
    setIsCreateFeeModalOpen(false);
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

  // Handler for submitting edit fee
  const handleEditFeeSubmit = (feeData: EditFeeFormData) => {
    const feeIndex = allFees.findIndex((fee) => fee.id === feeData.feeId);
    if (feeIndex === -1) return;

    const updatedFee: FeeRecord = {
      ...allFees[feeIndex],
      amount: feeData.amount,
      dueDate: feeData.dueDate,
      notes: feeData.notes,
      updatedAt: new Date(),
    };

    const updatedFees = [...allFees];
    updatedFees[feeIndex] = updatedFee;
    setLocalFees(updatedFees);

    handleCloseEditFeeModal();
  };

  // Handler for opening delete confirmation dialog
  const handleDeleteFeeClick = (feeId: string) => {
    setSelectedFeeId(feeId);
    setIsDeleteDialogOpen(true);
  };

  // Handler for closing delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedFeeId(null);
  };

  // Handler for confirming fee deletion
  const handleDeleteFeeConfirm = () => {
    if (!selectedFeeId) return;

    const updatedFees = allFees.filter((fee) => fee.id !== selectedFeeId);
    setLocalFees(updatedFees);

    handleCloseDeleteDialog();
  };

  // Get selected fee details
  const selectedFee = selectedFeeId ? allFees.find((fee) => fee.id === selectedFeeId) ?? null : null;

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
                              title="Delete fee"
                            >
                              Delete
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
        existingFees={allFees}
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
