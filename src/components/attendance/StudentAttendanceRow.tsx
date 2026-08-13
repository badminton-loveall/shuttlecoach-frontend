import React from 'react';
import type { Student, AttendanceStatus } from '../../types';

export interface StudentAttendanceRowProps {
  student: Student;
  status: AttendanceStatus | undefined;
  onToggle: (studentId: string, status: AttendanceStatus) => void;
}

/**
 * StudentAttendanceRow Component
 * Renders a single student row with Present/Absent toggle buttons.
 * Applies immediate visual confirmation on toggle (optimistic UI).
 */
export const StudentAttendanceRow: React.FC<StudentAttendanceRowProps> = ({
  student,
  status,
  onToggle,
}) => {
  return (
    <div style={rowStyle}>
      <span style={nameStyle}>{student.fullName}</span>
      <div style={toggleGroupStyle}>
        <button
          type="button"
          onClick={() => onToggle(student.id, 'PRESENT')}
          style={getButtonStyle(status === 'PRESENT', 'PRESENT')}
          aria-label={`Mark ${student.fullName} present`}
          aria-pressed={status === 'PRESENT'}
        >
          P
        </button>
        <button
          type="button"
          onClick={() => onToggle(student.id, 'ABSENT')}
          style={getButtonStyle(status === 'ABSENT', 'ABSENT')}
          aria-label={`Mark ${student.fullName} absent`}
          aria-pressed={status === 'ABSENT'}
        >
          A
        </button>
      </div>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.5rem 0.75rem',
  borderBottom: '1px solid hsl(var(--border))',
  gap: '0.75rem',
};

const nameStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 500,
  color: 'hsl(var(--foreground))',
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const toggleGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.375rem',
  flexShrink: 0,
};

function getButtonStyle(
  isActive: boolean,
  buttonType: 'PRESENT' | 'ABSENT'
): React.CSSProperties {
  const base: React.CSSProperties = {
    width: '32px',
    height: '32px',
    borderRadius: 'var(--radius)',
    border: '1px solid hsl(var(--border))',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
  };

  if (!isActive) {
    return {
      ...base,
      backgroundColor: 'hsl(var(--muted))',
      color: 'hsl(var(--muted-foreground))',
    };
  }

  if (buttonType === 'PRESENT') {
    return {
      ...base,
      backgroundColor: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground, 222.2 47.4% 11.2%))',
      borderColor: 'hsl(var(--primary))',
    };
  }

  // ABSENT active
  return {
    ...base,
    backgroundColor: 'hsl(var(--destructive))',
    color: 'hsl(var(--destructive-foreground))',
    borderColor: 'hsl(var(--destructive))',
  };
}

export default StudentAttendanceRow;
