/**
 * StudentDrillDrawer Component
 * Slide-over drawer from the right displaying today's drills for a selected student.
 * Fetches drill data using useBatchStudentsDrills, filters for the selected student,
 * and groups drills by focus area.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 5.2, 6.2
 */

import React, { useMemo } from 'react';
import { useBatchStudentsDrills } from '../hooks/useBatchStudentsDrills';
import type { Student } from '../types';
import './StudentDrillDrawer.css';

export interface StudentDrillDrawerProps {
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Callback to close the drawer */
  onClose: () => void;
  /** Student info */
  student: Student;
  /** Batch ID for drill lookup */
  batchId: string;
  /** Session date (today's date as ISO string, YYYY-MM-DD) */
  sessionDate: string;
}

const SKILL_COLORS: Record<string, string> = {
  Beginner: '#3B82F6',
  Intermediate: '#F97316',
  Advanced: '#8B5CF6',
  Professional: '#10B981',
};

/**
 * Groups an array of drills by their focusArea field.
 */
function groupDrillsByFocusArea(
  drills: Array<{ name: string; focusArea: string }>
): Record<string, Array<{ name: string; focusArea: string }>> {
  const groups: Record<string, Array<{ name: string; focusArea: string }>> = {};
  for (const drill of drills) {
    const key = drill.focusArea || 'General';
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(drill);
  }
  return groups;
}

export const StudentDrillDrawer: React.FC<StudentDrillDrawerProps> = ({
  isOpen,
  onClose,
  student,
  batchId,
  sessionDate,
}) => {
  const { students, loading, error } = useBatchStudentsDrills({
    batchId,
    date: sessionDate,
  });

  // Filter drills for the selected student from the batch response
  const studentDrills = useMemo(() => {
    const match = students.find((s) => s.studentId === student.id);
    return match?.drills ?? [];
  }, [students, student.id]);

  // Group drills by focus area
  const groupedDrills = useMemo(() => groupDrillsByFocusArea(studentDrills), [studentDrills]);
  const focusAreas = Object.keys(groupedDrills);

  if (!isOpen) return null;

  const skillColor = SKILL_COLORS[student.skillLevel] || SKILL_COLORS.Beginner;

  return (
    <>
      {/* Backdrop */}
      <div
        className="student-drill-drawer__backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        className="student-drill-drawer"
        role="dialog"
        aria-label={`Drills for ${student.fullName}`}
        aria-modal="true"
      >
        {/* Header */}
        <div className="student-drill-drawer__header">
          <div className="student-drill-drawer__student-info">
            <h2 className="student-drill-drawer__name">{student.fullName}</h2>
            <span
              className="student-drill-drawer__skill-badge"
              style={{ color: skillColor, borderColor: skillColor }}
            >
              {student.skillLevel}
            </span>
          </div>

          <button
            type="button"
            className="student-drill-drawer__close-btn"
            onClick={onClose}
            aria-label="Close drawer"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="student-drill-drawer__body">
          {loading && (
            <div className="student-drill-drawer__loading">
              <p className="student-drill-drawer__loading-text">Loading drills…</p>
            </div>
          )}

          {error && (
            <div className="student-drill-drawer__error">
              <p className="student-drill-drawer__error-text">{error}</p>
            </div>
          )}

          {!loading && !error && studentDrills.length === 0 && (
            <div className="student-drill-drawer__empty">
              <p className="student-drill-drawer__empty-text">
                No drills assigned for today. Please set up a curriculum plan for this batch.
              </p>
            </div>
          )}

          {!loading && !error && focusAreas.length > 0 &&
            focusAreas.map((area) => (
              <div key={area} className="student-drill-drawer__focus-group">
                <h3 className="student-drill-drawer__focus-label">{area}</h3>
                <ul className="student-drill-drawer__drill-list">
                  {groupedDrills[area].map((drill, idx) => (
                    <li key={idx} className="student-drill-drawer__drill-item">
                      {drill.name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      </aside>
    </>
  );
};

export default StudentDrillDrawer;
