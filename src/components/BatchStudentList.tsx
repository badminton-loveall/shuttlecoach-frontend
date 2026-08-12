/**
 * BatchStudentList Component
 * Fetches and displays a list of students for a batch on a specific date.
 * Each student is rendered as a StudentDrillAccordion with expand/collapse behavior.
 * Only one accordion can be expanded at a time.
 *
 * Requirements: 3.3, 3.4, 4.1
 */

import React, { useState } from 'react';
import { useBatchStudentsDrills } from '../hooks/useBatchStudentsDrills';
import { StudentDrillAccordion } from './StudentDrillAccordion';
import './BatchStudentList.css';

export interface BatchStudentListProps {
  batchId: string;
  date: string;
  batchColor: string;
}

export const BatchStudentList: React.FC<BatchStudentListProps> = ({
  batchId,
  date,
  batchColor,
}) => {
  const { students, loading, error, refetch } = useBatchStudentsDrills({ batchId, date });
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  const handleToggle = (studentId: string) => {
    setExpandedStudentId((prev) => (prev === studentId ? null : studentId));
  };

  // Loading state — skeleton
  if (loading) {
    return (
      <div className="batch-student-list batch-student-list--loading" aria-busy="true">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="batch-student-list__skeleton-row">
            <div className="batch-student-list__skeleton-dot" />
            <div className="batch-student-list__skeleton-text" />
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="batch-student-list batch-student-list--error">
        <p className="batch-student-list__error-message">{error}</p>
        <button
          type="button"
          className="batch-student-list__retry-btn"
          onClick={() => void refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (students.length === 0) {
    return (
      <div className="batch-student-list batch-student-list--empty">
        <p className="batch-student-list__empty-message">No students enrolled in this batch.</p>
      </div>
    );
  }

  // Student list
  return (
    <div
      className="batch-student-list"
      style={{ '--batch-accent-color': batchColor } as React.CSSProperties}
    >
      {students.map((student) => (
        <StudentDrillAccordion
          key={student.studentId}
          student={student}
          isExpanded={expandedStudentId === student.studentId}
          onToggle={() => handleToggle(student.studentId)}
        />
      ))}
    </div>
  );
};

export default BatchStudentList;
