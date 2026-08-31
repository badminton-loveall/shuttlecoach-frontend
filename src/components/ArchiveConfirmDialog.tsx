import React from 'react';

/**
 * ArchiveConfirmDialog Component
 * Confirmation dialog for archiving (soft-deleting) a student.
 * Displays a warning message with the student's name and
 * provides Cancel/Archive actions.
 */

export interface ArchiveConfirmDialogProps {
  isOpen: boolean;
  studentName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const ArchiveConfirmDialog: React.FC<ArchiveConfirmDialogProps> = ({
  isOpen,
  studentName,
  onConfirm,
  onCancel,
  isLoading,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div className="dialog-overlay" />

      <div className="fixed inset-0 flex items-center justify-center" style={{ padding: 'var(--space-md)', zIndex: 1001 }}>
        <div className="dialog-content">
          <div style={{ paddingBottom: 'var(--space-md)', borderBottom: '1px solid var(--border-default)' }}>
            <h2 className="dialog-title" style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <svg style={{ height: '24px', width: '24px', color: 'var(--color-warning)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2M6.228 6.228a9 9 0 1012.544 0M6.228 6.228L3.5 3.5" />
              </svg>
              Archive Student
            </h2>
          </div>

          <div className="dialog-warning">
            <p>
              Are you sure you want to archive <strong>{studentName}</strong>? This action will remove the student from active views.
            </p>
          </div>

          <div className="dialog-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Archiving...' : 'Confirm Archive'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ArchiveConfirmDialog;
