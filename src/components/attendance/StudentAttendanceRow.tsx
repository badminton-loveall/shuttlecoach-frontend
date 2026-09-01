import React from 'react';
import type { Student, AttendanceStatus } from '../../types';

export interface StudentAttendanceRowProps {
  student: Student;
  status: AttendanceStatus | undefined;
  onToggle: (studentId: string, status: AttendanceStatus) => void;
  onNameClick?: (student: Student) => void;
  /** True while this student's tap is being saved to the server. */
  saving?: boolean;
}

/**
 * StudentAttendanceRow Component
 * Renders a single student row with clickable name and Present/Absent toggle buttons.
 * Clicking the name opens the drill detail panel.
 * Tapping P or A saves that student's attendance immediately (no separate submit step).
 */
export const StudentAttendanceRow: React.FC<StudentAttendanceRowProps> = ({
  student,
  status,
  onToggle,
  onNameClick,
  saving = false,
}) => {
  return (
    <div style={{ ...rowStyle, opacity: saving ? 0.6 : 1 }}>
      <span
        style={{ ...nameStyle, ...(onNameClick ? clickableNameStyle : {}) }}
        onClick={onNameClick ? () => onNameClick(student) : undefined}
        role={onNameClick ? 'button' : undefined}
        tabIndex={onNameClick ? 0 : undefined}
        onKeyDown={onNameClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNameClick(student); } } : undefined}
      >
        {student.fullName}
      </span>
      <div style={toggleGroupStyle}>
        <button
          type="button"
          onClick={() => onToggle(student.id, 'PRESENT')}
          disabled={saving}
          style={getButtonStyle(status === 'PRESENT', 'PRESENT')}
          aria-label={`Mark ${student.fullName} present`}
          aria-pressed={status === 'PRESENT'}
        >
          P
        </button>
        <button
          type="button"
          onClick={() => onToggle(student.id, 'ABSENT')}
          disabled={saving}
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
  padding: 'var(--space-sm) var(--space-md)',
  borderBottom: '1px solid var(--border-default)',
  gap: 'var(--space-sm)',
};

const nameStyle: React.CSSProperties = {
  fontSize: 'var(--font-sm)',
  fontWeight: 500,
  color: 'var(--text-primary)',
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const clickableNameStyle: React.CSSProperties = {
  cursor: 'pointer',
  color: 'var(--color-primary-dark)',
};

const toggleGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-sm)',
  flexShrink: 0,
};

function getButtonStyle(
  isActive: boolean,
  buttonType: 'PRESENT' | 'ABSENT'
): React.CSSProperties {
  const base: React.CSSProperties = {
    width: '32px',
    height: '32px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-default)',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 'var(--font-xs)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
  };

  if (!isActive) {
    return {
      ...base,
      backgroundColor: 'var(--surface-hover)',
      color: 'var(--text-tertiary)',
    };
  }

  if (buttonType === 'PRESENT') {
    return {
      ...base,
      backgroundColor: 'var(--color-primary)',
      color: 'var(--text-primary)',
      borderColor: 'var(--color-primary)',
    };
  }

  // ABSENT active
  return {
    ...base,
    backgroundColor: 'var(--color-danger)',
    color: '#fff',
    borderColor: 'var(--color-danger)',
  };
}

export default StudentAttendanceRow;
