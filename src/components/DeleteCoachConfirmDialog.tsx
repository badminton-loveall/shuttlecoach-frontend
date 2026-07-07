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
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={() => !isDeleting && onClose()}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2M6.228 6.228a9 9 0 1012.544 0M6.228 6.228L3.5 3.5" />
              </svg>
              Delete Coach
            </h2>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-4">
            {/* Error */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Warning */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Are you sure you want to delete <strong>{coach.name}</strong>? This action cannot be undone.
              </p>
            </div>

            {/* Assignments Info */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                This coach has the following assignments:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-blue-500 rounded-full"></span>
                  <span>{assignedBatchCount} batch{assignedBatchCount !== 1 ? 'es' : ''}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-green-500 rounded-full"></span>
                  <span>{assignedStudentCount} student{assignedStudentCount !== 1 ? 's' : ''}</span>
                </li>
              </ul>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 italic">
                All assignments will be automatically unassigned when the coach is deleted.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Deleting...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
