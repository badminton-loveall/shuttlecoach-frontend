import React from 'react';
import { StudentAttendanceRow } from './StudentAttendanceRow';
import type { Student, AttendanceStatus } from '../../types';

export interface StudentAttendanceListProps {
  students: Student[];
  attendanceMap: Record<string, AttendanceStatus>;
  onToggle: (studentId: string, status: AttendanceStatus) => void;
  loading: boolean;
  onNameClick?: (student: Student) => void;
  /** Student ids currently being saved to the server. */
  savingIds?: Set<string>;
}

/**
 * StudentAttendanceList Component
 * Renders the scrollable list of students with attendance toggles.
 * Handles loading, empty, and normal states.
 *
 * Requirements: 3.1 (display student list), 3.2 (display full name),
 * 3.3 (loading indicator), 3.4 (empty batch message)
 */
export const StudentAttendanceList: React.FC<StudentAttendanceListProps> = ({
  students,
  attendanceMap,
  onToggle,
  loading,
  onNameClick,
  savingIds,
}) => {
  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={loadingStyle} role="status" aria-label="Loading students">
          <div style={spinnerStyle} />
          <span>Loading students...</span>
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={emptyStyle}>
          <span>No students in this batch</span>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {students.map((student) => (
        <StudentAttendanceRow
          key={student.id}
          student={student}
          status={attendanceMap[student.id]}
          onToggle={onToggle}
          onNameClick={onNameClick}
          saving={savingIds?.has(student.id)}
        />
      ))}
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const containerStyle: React.CSSProperties = {
  maxHeight: '320px',
  overflowY: 'auto',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--surface-card)',
};

const loadingStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--space-sm)',
  padding: 'var(--space-xl) var(--space-md)',
  color: 'var(--text-secondary)',
  fontSize: 'var(--font-sm)',
};

const spinnerStyle: React.CSSProperties = {
  width: '16px',
  height: '16px',
  border: '2px solid var(--border-default)',
  borderTopColor: 'var(--color-primary)',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
};

const emptyStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'var(--space-xl) var(--space-md)',
  color: 'var(--text-secondary)',
  fontSize: 'var(--font-sm)',
};

export default StudentAttendanceList;
