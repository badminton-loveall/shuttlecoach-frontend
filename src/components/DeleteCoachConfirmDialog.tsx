import React, { useState } from 'react';
import type { User } from '../types';

/**
 * DeleteCoachConfirmDialog Component
 * Confirmation dialog for deleting an assistant coach
 * 
 * Features:
 * - Shows coach name and warns about consequences
 * - Shows assignment statistics (batches/students to be unassigned)
 * - Requires explicit confirmation
 * - Handles deletion with async operation
 */

interface DeleteCoachConfirmDialogProps {
  isOpen: boolean;
  coach: User | null;
  assignedBatchCount?: number;
  assignedStudentCount?: number;
  onClose: () => void;
  onConfirm: (coachId: string) => Promise<void>;
}

export const DeleteCoachConfirmDialog: React.FC<DeleteCoachConfirmDialogProps> = ({
  isOpen,
  coach,
  assignedBatchCount = 0,
  assignedStudentCount = 0,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!coach) return;

    setIsDeleting(true);
    setError(null);

    try {
      await onConfirm(coach.id);
      onClose();
    } catch (err) {
      console.error('Error deleting coach:', err);
      setError('Failed to delete coach. Please try again.');
      setIsDeleting(false);
    }
  };

  if (!isOpen || !coach) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="dialog-overlay"
        onClick={() => !isDeleting && onClose()}
      />

      {/* Dialog */}
      <div className="fixed inset-0 flex items-center justify-center" style={{ padding: 'var(--space-md)', zIndex: 1001 }}>
        <div
          className="dialog-content"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ paddingBottom: 'var(--space-md)', borderBottom: '1px solid var(--border-default)' }}>
            <h2 className="dialog-title" style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <svg style={{ height: '24px', width: '24px', color: 'var(--color-danger)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2M6.228 6.228a9 9 0 1012.544 0M6.228 6.228L3.5 3.5" />
              </svg>
              Delete Coach
            </h2>
          </div>

          {/* Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {/* Error */}
            {error && (
              <div className="dialog-error">
                <p>{error}</p>
              </div>
            )}

            {/* Warning */}
            <div className="dialog-warning">
              <p>
                Are you sure you want to delete <strong>{coach.name}</strong>? This action cannot be undone.
              </p>
            </div>

            {/* Assignments Info */}
            <div className="dialog-info">
              <p className="info-label">
                This coach has the following assignments:
              </p>
              <ul>
                <li>
                  <span style={{ height: '6px', width: '6px', backgroundColor: 'var(--color-info)', borderRadius: '50%', display: 'inline-block' }}></span>
                  <span>{assignedBatchCount} batch{assignedBatchCount !== 1 ? 'es' : ''}</span>
                </li>
                <li>
                  <span style={{ height: '6px', width: '6px', backgroundColor: 'var(--color-success)', borderRadius: '50%', display: 'inline-block' }}></span>
                  <span>{assignedStudentCount} student{assignedStudentCount !== 1 ? 's' : ''}</span>
                </li>
              </ul>
              <p className="info-note">
                All assignments will be automatically unassigned when the coach is deleted.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="dialog-actions">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isDeleting}
              className="btn btn-danger"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}
            >
              {isDeleting ? (
                <>
                  <svg className="animate-spin" style={{ height: '16px', width: '16px' }} viewBox="0 0 24 24">
                    <circle
                      style={{ opacity: 0.25 }}
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      style={{ opacity: 0.75 }}
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Deleting...
                </>
              ) : (
                <>
                  <svg style={{ height: '16px', width: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Coach
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeleteCoachConfirmDialog;
