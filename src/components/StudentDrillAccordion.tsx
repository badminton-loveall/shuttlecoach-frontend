/**
 * StudentDrillAccordion Component
 * Renders an expandable accordion row for a student showing their drill assignments.
 * Displays student name with a skill-level-colored indicator.
 * When expanded, shows drill names and their focus areas.
 *
 * Requirements: 4.1, 4.2, 4.4, 4.5
 */

import React from 'react';
import type { BatchStudentDrill } from '../hooks/useBatchStudentsDrills';
import './StudentDrillAccordion.css';

export interface StudentDrillAccordionProps {
  student: BatchStudentDrill;
  isExpanded: boolean;
  onToggle: () => void;
}

const SKILL_COLORS: Record<string, string> = {
  Beginner: '#3B82F6',
  Intermediate: '#F97316',
  Advanced: '#8B5CF6',
  Professional: '#10B981',
};

export const StudentDrillAccordion: React.FC<StudentDrillAccordionProps> = ({
  student,
  isExpanded,
  onToggle,
}) => {
  const skillColor = SKILL_COLORS[student.skillLevel] || SKILL_COLORS.Beginner;

  return (
    <div className="student-drill-accordion">
      {/* Clickable row */}
      <button
        type="button"
        className="student-drill-accordion__header"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`drills-${student.studentId}`}
      >
        <div className="student-drill-accordion__student-info">
          <span
            className="student-drill-accordion__skill-dot"
            style={{ backgroundColor: skillColor }}
            title={student.skillLevel}
          />
          <span className="student-drill-accordion__name">{student.fullName}</span>
          <span
            className="student-drill-accordion__skill-badge"
            style={{ color: skillColor, borderColor: skillColor }}
          >
            {student.skillLevel}
          </span>
        </div>

        {/* Chevron icon */}
        <svg
          className={`student-drill-accordion__chevron ${isExpanded ? 'student-drill-accordion__chevron--expanded' : ''}`}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Expanded drill list */}
      {isExpanded && (
        <div
          id={`drills-${student.studentId}`}
          className="student-drill-accordion__content"
          role="region"
          aria-label={`Drills for ${student.fullName}`}
        >
          {student.drills.length === 0 ? (
            <p className="student-drill-accordion__empty">No drills scheduled</p>
          ) : (
            <ul className="student-drill-accordion__drill-list">
              {student.drills.map((drill, index) => (
                <li key={index} className="student-drill-accordion__drill-item">
                  <span className="student-drill-accordion__drill-name">{drill.name}</span>
                  {drill.focusArea && (
                    <span className="student-drill-accordion__drill-focus">{drill.focusArea}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentDrillAccordion;
