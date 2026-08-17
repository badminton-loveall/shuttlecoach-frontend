/**
 * SessionDrillDown Component
 * Expandable panel that appears below a session card when clicked.
 * Shows the list of students enrolled in the selected batch with name + skill level badge.
 * Handles loading, error, and empty states.
 *
 * Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 5.1, 6.1, 6.3
 */

import React, { useState } from 'react';
import { useBatchStudents } from '../hooks/useBatchStudents';
import type { CalendarEntry, Student, SkillLevel } from '../types';
import './SessionDrillDown.css';

export interface SessionDrillDownProps {
  /** The calendar entry for the selected session */
  session: CalendarEntry;
  /** Whether this panel is currently expanded */
  isExpanded: boolean;
  /** Callback to collapse the panel */
  onCollapse: () => void;
  /** Callback when a student is clicked */
  onStudentClick: (student: Student) => void;
  /** Currently selected student ID (for highlight) */
  selectedStudentId?: string;
}

/* --------------------------------------------------------------------------
   Skill Badge Utility
   -------------------------------------------------------------------------- */

const SKILL_BADGE_MAP: Record<SkillLevel, { className: string; label: string }> = {
  Beginner: { className: 'session-drill-down__badge--beginner', label: 'Beginner' },
  Intermediate: { className: 'session-drill-down__badge--intermediate', label: 'Intermediate' },
  Advanced: { className: 'session-drill-down__badge--advanced', label: 'Advanced' },
  Professional: { className: 'session-drill-down__badge--professional', label: 'Professional' },
};

/* --------------------------------------------------------------------------
   Component
   -------------------------------------------------------------------------- */

export const SessionDrillDown: React.FC<SessionDrillDownProps> = ({
  session,
  isExpanded,
  onStudentClick,
  selectedStudentId,
}) => {
  // Retry counter — used as key to force remount and refetch
  const [retryCount, setRetryCount] = useState(0);

  if (!isExpanded) {
    return null;
  }

  return (
    <SessionDrillDownInner
      key={`${session.batchId}-${retryCount}`}
      session={session}
      onStudentClick={onStudentClick}
      selectedStudentId={selectedStudentId}
      onRetry={() => setRetryCount((c) => c + 1)}
    />
  );
};

/* --------------------------------------------------------------------------
   Inner component — remounted on retry to force useBatchStudents refetch
   -------------------------------------------------------------------------- */

interface InnerProps {
  session: CalendarEntry;
  onStudentClick: (student: Student) => void;
  selectedStudentId?: string;
  onRetry: () => void;
}

const SessionDrillDownInner: React.FC<InnerProps> = ({
  session,
  onStudentClick,
  selectedStudentId,
  onRetry,
}) => {
  const { students, loading, error } = useBatchStudents(session.batchId);

  return (
    <div
      className="session-drill-down"
      role="region"
      aria-label={`Students in ${session.batchName}`}
    >
      <div className="session-drill-down__panel">
        {/* Loading state */}
        {loading && (
          <div className="session-drill-down__loading" aria-busy="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="session-drill-down__skeleton-row">
                <div className="session-drill-down__skeleton-avatar" />
                <div className="session-drill-down__skeleton-text" />
                <div className="session-drill-down__skeleton-badge" />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="session-drill-down__error">
            <p className="session-drill-down__error-message">{error}</p>
            <button
              type="button"
              className="session-drill-down__retry-btn"
              onClick={onRetry}
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && students.length === 0 && (
          <div className="session-drill-down__empty">
            <p className="session-drill-down__empty-message">
              No students enrolled in this batch yet.
            </p>
          </div>
        )}

        {/* Student list */}
        {!loading && !error && students.length > 0 && (
          <ul className="session-drill-down__student-list" role="list">
            {students.map((student) => {
              const badge = SKILL_BADGE_MAP[student.skillLevel] || SKILL_BADGE_MAP.Beginner;
              const isSelected = selectedStudentId === student.id;

              return (
                <li
                  key={student.id}
                  className={`session-drill-down__student-row${isSelected ? ' session-drill-down__student-row--selected' : ''}`}
                  onClick={() => onStudentClick(student)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onStudentClick(student);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                >
                  <span className="session-drill-down__student-name">
                    {student.fullName}
                  </span>
                  <span className={`session-drill-down__skill-badge ${badge.className}`}>
                    {badge.label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SessionDrillDown;
