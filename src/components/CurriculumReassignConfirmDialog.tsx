import React from 'react';

/**
 * CurriculumReassignConfirmDialog Component
 * Confirmation dialog for curriculum reassignment when a student has existing progress.
 * Warns the coach that reassigning will reset the student's progress to Week 1, Day 1.
 *
 * Requirements: 2.8
 */

export interface CurriculumReassignConfirmDialogProps {
  isOpen: boolean;
  studentName: string;
  currentWeek: number;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const CurriculumReassignConfirmDialog: React.FC<CurriculumReassignConfirmDialogProps> = ({
  isOpen,
  studentName,
  currentWeek,
  onConfirm,
  onCancel,
  isLoading,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={!isLoading ? onCancel : undefined}>
      <div
        className="modal-content max-w-md"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reassign-dialog-title"
      >
        <div className="modal-header">
          <h2 id="reassign-dialog-title" className="text-lg font-semibold text-gray-900">
            Confirm Curriculum Reassignment
          </h2>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <span className="text-2xl" aria-hidden="true">⚠️</span>
            <div>
              <p className="text-sm text-gray-700 mb-2">
                <strong>{studentName}</strong> has existing training progress at Week {currentWeek}.
              </p>
              <p className="text-sm text-gray-700 font-semibold">
                This will reset the student's progress to Week 1, Day 1.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                All current cycle training logs will no longer align with the new curriculum plan.
                Are you sure you want to proceed?
              </p>
            </div>
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
            data-testid="confirm-reassign-btn"
          >
            {isLoading ? 'Saving...' : 'Confirm Reassignment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CurriculumReassignConfirmDialog;
