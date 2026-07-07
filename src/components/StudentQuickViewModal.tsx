import React, { useRef, useEffect } from 'react';
import type { Student } from '../types';
import './StudentQuickViewModal.css';

/**
 * StudentQuickViewModal Component
 * Displays student quick view modal with key student information
 *
 * Requirements:
 * 11.1: Display summary modal with key student information (name, age, skill level, batch, scores)
 * 11.2: Display link to view full student profile
 * 11.3: Accept student data and isOpen/onClose props
 * 11.4: Close on close button click, outside click (backdrop), process only first close action
 */

export interface StudentQuickViewModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StudentQuickViewModal: React.FC<StudentQuickViewModalProps> = ({
  student,
  isOpen,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeProcessedRef = useRef(false);

  /**
   * Handle close action (only process first one)
   */
  const handleClose = () => {
    if (!closeProcessedRef.current) {
      closeProcessedRef.current = true;
      onClose();
      // Reset the flag after modal is fully closed
      setTimeout(() => {
        closeProcessedRef.current = false;
      }, 300);
    }
  };

  /**
   * Handle backdrop click (outside modal)
   */
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  /**
   * Handle Escape key
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  if (!isOpen || !student) return null;

  return (
    <div
      className="modal-overlay"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="modal-content modal-content--small"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="student-quick-view-title"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h2 id="student-quick-view-title" className="modal-title">
              Student Details
            </h2>
            <p className="modal-subtitle">Quick view of student information</p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={handleClose}
            aria-label="Close student details modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body space-y-6">
          {/* Student Header with Photo */}
          <div className="flex items-center gap-4">
            {student.profilePhoto ? (
              <img
                src={student.profilePhoto}
                alt={student.fullName}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xl font-medium text-blue-600">
                  {student.fullName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {student.fullName}
              </h3>
              <p className="text-sm text-gray-600">{student.email || '—'}</p>
            </div>
          </div>

          {/* Student Information Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Age */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Age
              </label>
              <p className="text-base font-semibold text-gray-900">
                {student.age} years
              </p>
            </div>

            {/* Skill Level */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Skill Level
              </label>
              <p className="text-base font-semibold text-gray-900">
                {student.skillLevel || '—'}
              </p>
            </div>

            {/* Batch Assignment */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Batch
              </label>
              <p className="text-base font-semibold text-gray-900">
                {student.batchId || '—'}
              </p>
            </div>

            {/* Contact Phone */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Phone
              </label>
              <p className="text-base font-semibold text-gray-900">
                {student.contactPhone || '—'}
              </p>
            </div>
          </div>

          {/* Additional Details */}
          <div className="space-y-3">
            {/* Gender */}
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">
                Gender
              </label>
              <p className="text-sm text-gray-900">{student.gender || '—'}</p>
            </div>

            {/* Guardian Name (if available and under 18) */}
            {student.age < 18 && student.guardianName && (
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  Guardian Name
                </label>
                <p className="text-sm text-gray-900">{student.guardianName}</p>
              </div>
            )}

            {/* Medical Conditions */}
            {student.medicalConditions && (
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  Medical Conditions
                </label>
                <p className="text-sm text-gray-900">{student.medicalConditions}</p>
              </div>
            )}

            {/* Strengths */}
            {student.strengths && student.strengths.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  Strengths
                </label>
                <div className="flex flex-wrap gap-2">
                  {student.strengths.map((strength, index) => (
                    <span
                      key={index}
                      className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                    >
                      {strength}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Weaknesses */}
            {student.weaknesses && student.weaknesses.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  Areas to Improve
                </label>
                <div className="flex flex-wrap gap-2">
                  {student.weaknesses.map((weakness, index) => (
                    <span
                      key={index}
                      className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded"
                    >
                      {weakness}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Coach Feedback */}
            {student.coachFeedback && (
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  Coach Feedback
                </label>
                <p className="text-sm text-gray-900 bg-blue-50 p-2 rounded">
                  {student.coachFeedback}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClose}
          >
            Close
          </button>
          <a
            href={`/students/${student.id}`}
            className="btn btn-primary"
            aria-label={`View full profile for ${student.fullName}`}
          >
            View Full Profile
          </a>
        </div>
      </div>
    </div>
  );
};

export default StudentQuickViewModal;
