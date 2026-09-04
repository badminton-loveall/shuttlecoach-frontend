import React, { useEffect, useState } from 'react';
import { useBatchStudents } from '../../hooks/useBatchStudents';
import { useMarkAttendance, useAttendanceRecords } from '../../hooks/useAttendance';
import { StudentAttendanceRow } from './StudentAttendanceRow';
import { useToast } from '../../contexts/ToastContext';
import type { CalendarEntry, Student, AttendanceStatus } from '../../types';

export interface BatchAttendanceSectionProps {
  /** Today's session (one per batch) this card renders. */
  session: CalendarEntry;
  /** Today's date as YYYY-MM-DD, shared across all batch cards. */
  todayDateStr: string;
  onNameClick?: (student: Student) => void;
}

type AttendanceMap = Record<string, AttendanceStatus>;

/**
 * Formats a 24h "HH:MM" time string as 12h with AM/PM, e.g. "16:00" -> "4:00 PM".
 */
function formatTime12h(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * BatchAttendanceSection
 *
 * One card per today's batch session — shows the batch name and its timing, then its
 * students grouped into Pending / Present / Absent categories with single-tap marking.
 * Each card owns its own students/attendance fetch so batches load and save independently.
 */
export const BatchAttendanceSection: React.FC<BatchAttendanceSectionProps> = ({
  session,
  todayDateStr,
  onNameClick,
}) => {
  const { students, loading: studentsLoading } = useBatchStudents(session.batchId, todayDateStr);
  const { records: existingRecords } = useAttendanceRecords({
    batchId: session.batchId,
    startDate: todayDateStr,
    endDate: todayDateStr,
  });
  const { markAttendance } = useMarkAttendance();
  const { showToast } = useToast();

  const [attendanceMap, setAttendanceMap] = useState<AttendanceMap>({});
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  // Pre-populate attendanceMap from existing records (retain for the whole day)
  useEffect(() => {
    if (existingRecords && existingRecords.length > 0) {
      const map: AttendanceMap = {};
      for (const rec of existingRecords) {
        if (rec.studentId && rec.status) {
          map[rec.studentId] = rec.status as AttendanceStatus;
        }
      }
      setAttendanceMap(map);
    }
  }, [existingRecords]);

  const handleToggle = (studentId: string, status: AttendanceStatus) => {
    const previousStatus = attendanceMap[studentId];
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
    setSavingIds((prev) => new Set(prev).add(studentId));

    markAttendance({
      batchId: session.batchId,
      sessionDate: todayDateStr,
      records: [{ studentId, status }],
    })
      .catch(() => {
        setAttendanceMap((prev) => {
          const next = { ...prev };
          if (previousStatus === undefined) {
            delete next[studentId];
          } else {
            next[studentId] = previousStatus;
          }
          return next;
        });
        showToast({ message: 'Failed to save attendance. Please try again.', type: 'error' });
      })
      .finally(() => {
        setSavingIds((prev) => {
          const next = new Set(prev);
          next.delete(studentId);
          return next;
        });
      });
  };

  const pending = students.filter((s) => !attendanceMap[s.id]);
  const present = students.filter((s) => attendanceMap[s.id] === 'PRESENT');
  const absent = students.filter((s) => attendanceMap[s.id] === 'ABSENT');

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <span style={batchNameStyle}>{session.batchName}</span>
        <span style={timeStyle}>
          {formatTime12h(session.startTime)} – {formatTime12h(session.endTime)}
        </span>
      </div>

      {studentsLoading ? (
        <div style={emptyStyle}>Loading students...</div>
      ) : students.length === 0 ? (
        <div style={emptyStyle}>No students in this batch</div>
      ) : (
        <div style={groupsStyle}>
          <CategoryGroup label="Pending" count={pending.length} dotColor="var(--text-tertiary)">
            {pending.map((student) => (
              <StudentAttendanceRow
                key={student.id}
                student={student}
                status={attendanceMap[student.id]}
                onToggle={handleToggle}
                onNameClick={onNameClick}
                saving={savingIds.has(student.id)}
              />
            ))}
          </CategoryGroup>

          <CategoryGroup label="Present" count={present.length} dotColor="var(--color-primary)">
            {present.map((student) => (
              <StudentAttendanceRow
                key={student.id}
                student={student}
                status={attendanceMap[student.id]}
                onToggle={handleToggle}
                onNameClick={onNameClick}
                saving={savingIds.has(student.id)}
              />
            ))}
          </CategoryGroup>

          <CategoryGroup label="Absent" count={absent.length} dotColor="var(--color-danger)">
            {absent.map((student) => (
              <StudentAttendanceRow
                key={student.id}
                student={student}
                status={attendanceMap[student.id]}
                onToggle={handleToggle}
                onNameClick={onNameClick}
                saving={savingIds.has(student.id)}
              />
            ))}
          </CategoryGroup>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   CategoryGroup sub-component — collapses to nothing when empty
   ============================================================================ */

interface CategoryGroupProps {
  label: string;
  count: number;
  dotColor: string;
  children: React.ReactNode;
}

const CategoryGroup: React.FC<CategoryGroupProps> = ({ label, count, dotColor, children }) => {
  if (count === 0) return null;

  return (
    <div>
      <div style={categoryLabelStyle}>
        <span style={{ ...dotStyle, backgroundColor: dotColor }} />
        {label} ({count})
      </div>
      <div style={categoryRowsStyle}>{children}</div>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--surface-card)',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--space-sm)',
  padding: 'var(--space-sm) var(--space-md)',
  backgroundColor: 'var(--surface-hover)',
  borderBottom: '1px solid var(--border-default)',
};

const batchNameStyle: React.CSSProperties = {
  fontSize: 'var(--font-sm)',
  fontWeight: 700,
  color: 'var(--text-primary)',
};

const timeStyle: React.CSSProperties = {
  fontSize: 'var(--font-xs)',
  fontWeight: 500,
  color: 'var(--text-secondary)',
};

const groupsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const categoryLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-xs)',
  padding: 'var(--space-xs) var(--space-md)',
  fontSize: 'var(--font-xs)',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
  color: 'var(--text-secondary)',
  backgroundColor: 'var(--surface-hover)',
};

const dotStyle: React.CSSProperties = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  flexShrink: 0,
};

const categoryRowsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const emptyStyle: React.CSSProperties = {
  padding: 'var(--space-lg) var(--space-md)',
  textAlign: 'center',
  fontSize: 'var(--font-sm)',
  color: 'var(--text-secondary)',
};

export default BatchAttendanceSection;
