import React, { useState, useMemo } from 'react';
import { SkillAssessmentForm } from './SkillAssessmentForm';
import type { SkillAssessment } from '../types';
import './SkillHistory.css';

/**
 * SkillHistory — Displays past bi-monthly cycle assessment snapshots in a list.
 * Clicking a past snapshot opens the full assessment in a read-only modal.
 *
 * Requirements: 8.8, 8.9, 7.8
 */

export interface SkillHistoryProps {
  assessments: SkillAssessment[];
}

/**
 * Formats a Date (or date-like string) to a readable string.
 */
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export const SkillHistory: React.FC<SkillHistoryProps> = ({ assessments }) => {
  const [selectedAssessment, setSelectedAssessment] = useState<SkillAssessment | null>(null);

  // Sort assessments in reverse chronological order (most recent first)
  const sortedAssessments = useMemo(() => {
    return [...assessments].sort((a, b) => {
      const dateA = typeof a.recordedAt === 'string' ? new Date(a.recordedAt) : a.recordedAt;
      const dateB = typeof b.recordedAt === 'string' ? new Date(b.recordedAt) : b.recordedAt;
      return dateB.getTime() - dateA.getTime();
    });
  }, [assessments]);

  const handleOpenSnapshot = (assessment: SkillAssessment) => {
    setSelectedAssessment(assessment);
  };

  const handleCloseModal = () => {
    setSelectedAssessment(null);
  };

  if (assessments.length === 0) {
    return (
      <div className="skill-history" data-testid="skill-history">
        <h3 className="skill-history__title">Assessment History</h3>
        <p className="skill-history__empty" data-testid="skill-history-empty">
          No past assessments available.
        </p>
      </div>
    );
  }

  return (
    <div className="skill-history" data-testid="skill-history">
      <h3 className="skill-history__title">Assessment History</h3>
      <div className="skill-history__list" data-testid="skill-history-list">
        {sortedAssessments.map((assessment) => (
          <button
            key={assessment.id}
            type="button"
            className="skill-history__card"
            data-testid="skill-history-card"
            onClick={() => handleOpenSnapshot(assessment)}
            aria-label={`View assessment for ${assessment.cycleKey}`}
          >
            <span className="skill-history__cycle">{assessment.cycleKey}</span>
            <span className="skill-history__date">{formatDate(assessment.recordedAt)}</span>
            <span className="skill-history__recorder">{assessment.recordedBy}</span>
          </button>
        ))}
      </div>

      {/* Read-only assessment modal */}
      {selectedAssessment && (
        <div
          className="skill-history__modal-overlay"
          data-testid="skill-history-modal"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
          aria-label={`Assessment for ${selectedAssessment.cycleKey}`}
        >
          <div
            className="skill-history__modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="skill-history__modal-header">
              <h4 className="skill-history__modal-title">
                Assessment — {selectedAssessment.cycleKey}
              </h4>
              <button
                type="button"
                className="skill-history__modal-close"
                data-testid="skill-history-modal-close"
                onClick={handleCloseModal}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <div className="skill-history__modal-body">
              <SkillAssessmentForm
                studentId={selectedAssessment.studentId}
                existingAssessment={selectedAssessment}
                cycleKey={selectedAssessment.cycleKey}
                onSave={() => {
                  // No-op: read-only mode prevents saves
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
