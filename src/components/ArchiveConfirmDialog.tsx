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
    <div className="modal-overlay">
      <div
        className="modal-content max-w-md"
      >
        <div className="modal-header">
          <h2 className="text-lg font-semibold text-gray-900">
            Archive Student
          </h2>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <span className="text-2xl" aria-hidden="true">⚠️</span>
            <p className="text-sm text-gray-700">
              Are you sure you want to archive <strong>{studentName}</strong>? This action will remove the student from active views.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 pb-6">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Archiving...' : 'Confirm Archive'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArchiveConfirmDialog;
