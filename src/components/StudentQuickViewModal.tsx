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
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          {/* Student Header with Photo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            {student.profilePhoto ? (
              <img
                src={student.profilePhoto}
                alt={student.fullName}
                style={{ height: '64px', width: '64px', borderRadius: 'var(--radius-pill)', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ height: '64px', width: '64px', borderRadius: 'var(--radius-pill)', backgroundColor: 'var(--feedback-info-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 'var(--font-h3)', fontWeight: 'var(--weight-medium)', color: 'var(--color-info-text)' }}>
                  {student.fullName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
                {student.fullName}
              </h3>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>{student.email || '—'}</p>
            </div>
          </div>

          {/* Student Information Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-md)' }}>
            {/* Age */}
            <div style={{ backgroundColor: 'var(--surface-hover)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-md)' }}>
              <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>
                Age
              </label>
              <p style={{ fontSize: 'var(--font-body)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
                {student.age} years
              </p>
            </div>

            {/* Skill Level */}
            <div style={{ backgroundColor: 'var(--surface-hover)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-md)' }}>
              <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>
                Skill Level
              </label>
              <p style={{ fontSize: 'var(--font-body)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
                {student.skillLevel || '—'}
              </p>
            </div>

            {/* Batch Assignment */}
            <div style={{ backgroundColor: 'var(--surface-hover)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-md)' }}>
              <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>
                Batch
              </label>
              <p style={{ fontSize: 'var(--font-body)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
                {student.batchId || '—'}
              </p>
            </div>

            {/* Contact Phone */}
            <div style={{ backgroundColor: 'var(--surface-hover)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-md)' }}>
              <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>
                Phone
              </label>
              <p style={{ fontSize: 'var(--font-body)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
                {student.contactPhone || '—'}
              </p>
            </div>
          </div>

          {/* Additional Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {/* Gender */}
            <div>
              <label style={{ fontSize: 'var(--font-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)', display: 'block', marginBottom: 'var(--space-xs)' }}>
                Gender
              </label>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>{student.gender || '—'}</p>
            </div>

            {/* Guardian Name (if available and under 18) */}
            {student.age < 18 && student.guardianName && (
              <div>
                <label style={{ fontSize: 'var(--font-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)', display: 'block', marginBottom: 'var(--space-xs)' }}>
                  Guardian Name
                </label>
                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>{student.guardianName}</p>
              </div>
            )}

            {/* Medical Conditions */}
            {student.medicalConditions && (
              <div>
                <label style={{ fontSize: 'var(--font-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)', display: 'block', marginBottom: 'var(--space-xs)' }}>
                  Medical Conditions
                </label>
                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>{student.medicalConditions}</p>
              </div>
            )}

            {/* Strengths */}
            {student.strengths && student.strengths.length > 0 && (
              <div>
                <label style={{ fontSize: 'var(--font-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)', display: 'block', marginBottom: 'var(--space-xs)' }}>
                  Strengths
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                  {student.strengths.map((strength, index) => (
                    <span
                      key={index}
                      style={{ display: 'inline-block', backgroundColor: 'var(--feedback-success-light)', color: 'var(--color-success-text)', fontSize: 'var(--font-xs)', padding: 'var(--space-xs) var(--space-sm)', borderRadius: 'var(--radius-sm)' }}
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
                <label style={{ fontSize: 'var(--font-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)', display: 'block', marginBottom: 'var(--space-xs)' }}>
                  Areas to Improve
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                  {student.weaknesses.map((weakness, index) => (
                    <span
                      key={index}
                      style={{ display: 'inline-block', backgroundColor: 'var(--feedback-warning-light)', color: 'var(--color-warning-text)', fontSize: 'var(--font-xs)', padding: 'var(--space-xs) var(--space-sm)', borderRadius: 'var(--radius-sm)' }}
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
                <label style={{ fontSize: 'var(--font-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)', display: 'block', marginBottom: 'var(--space-xs)' }}>
                  Coach Feedback
                </label>
                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)', backgroundColor: 'var(--feedback-info-light)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)' }}>
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
