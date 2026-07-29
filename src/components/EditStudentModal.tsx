import React, { useState, useCallback } from 'react';
import type { Student } from '../types';
import { PersonalInfoForm } from './PersonalInfoForm';
import { getChangedFields, classifyError } from '../utils/studentProfileUtils';
import apiClient from '../utils/apiClient';

/**
 * EditStudentModal Component
 * Modal dialog for editing student personal information.
 *
 * Follows the EditCoachModal pattern: modal-overlay > modal-content > modal-header + form structure.
 * Wraps PersonalInfoForm in editing mode and handles PATCH API submission.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 */

export interface EditStudentModalProps {
  isOpen: boolean;
  student: Student;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  isOpen,
  student,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(async (updatedFields: Partial<Student>) => {
    setError(null);

    // Compute only the fields that actually changed
    const changedFields = getChangedFields(student, updatedFields);

    // If nothing changed, just close
    if (Object.keys(changedFields).length === 0) {
      onClose();
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.patch(`/students/${student.id}`, changedFields);
      setIsSubmitting(false);
      onSuccess();
    } catch (err: unknown) {
      const classified = classifyError(err);
      setError(classified.message);
      setIsSubmitting(false);
    }
  }, [student, onClose, onSuccess]);

  const handleCancel = useCallback(() => {
    if (!isSubmitting) {
      setError(null);
      onClose();
    }
  }, [isSubmitting, onClose]);

  const handleOverlayClick = useCallback(() => {
    if (!isSubmitting) {
      setError(null);
      onClose();
    }
  }, [isSubmitting, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} data-testid="edit-student-modal">
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Edit Student</h2>
            <p className="modal-subtitle">Update information for {student.fullName}</p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={handleCancel}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400" role="alert">
            {error}
          </div>
        )}

        {isSubmitting && (
          <div className="flex items-center justify-center py-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <span className="ml-2 text-sm text-gray-500">Saving changes...</span>
          </div>
        )}

        <div className={isSubmitting ? 'pointer-events-none opacity-50' : ''}>
          <PersonalInfoForm
            student={student}
            isEditing={true}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
};

export default EditStudentModal;
