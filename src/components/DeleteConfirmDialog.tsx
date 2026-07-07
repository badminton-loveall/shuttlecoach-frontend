import React, { useState } from 'react';
import type { Student, FeeRecord } from '../types';
import './DeleteConfirmDialog.css';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fee: FeeRecord | null;
  student: Student | null;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  fee,
  student,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 300));
      onConfirm();
      setIsDeleting(false);
    } catch (error) {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !fee || !student) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-icon-danger">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 9v2M12 17v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h2 className="dialog-title">Delete Fee</h2>

        <p className="dialog-message">
          Are you sure you want to delete this fee? This action cannot be undone.
        </p>

        <div className="dialog-details">
          <div className="detail-row">
            <span className="detail-label">Student:</span>
            <span className="detail-value">{student.fullName}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Amount:</span>
            <span className="detail-value">₹{fee.amount.toLocaleString('en-IN')}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Month/Year:</span>
            <span className="detail-value">{fee.monthYear}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Status:</span>
            <span className="detail-value">{fee.status}</span>
          </div>
        </div>

        <div className="dialog-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Fee'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmDialog;
