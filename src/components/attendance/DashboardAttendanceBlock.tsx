import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getTodaySessions, getCurrentSession } from '../../utils/attendanceBlockUtils';
import { useBatchStudents } from '../../hooks/useBatchStudents';
import { useMarkAttendance, useAttendanceRecords } from '../../hooks/useAttendance';
import { useSessionDrillDown } from '../../hooks/useSessionDrillDown';
import { SessionTabBar } from './SessionTabBar';
import { StudentAttendanceList } from './StudentAttendanceList';
import { AttendanceSubmitFooter } from './AttendanceSubmitFooter';
import { StudentDrillDrawer } from '../StudentDrillDrawer';
import type { CalendarEntry, AttendanceStatus } from '../../types';
import type { MarkAttendanceData } from '../../hooks/useAttendance';

/* ============================================================================
   Types
   ============================================================================ */

export interface DashboardAttendanceBlockProps {
  calendarEntries: CalendarEntry[];
  calendarLoading: boolean;
}

type WidgetState = 'loading' | 'no-sessions' | 'idle' | 'submitting' | 'success' | 'all-complete';

type AttendanceMap = Record<string, AttendanceStatus>;

/* ============================================================================
   Helpers
   ============================================================================ */

/**
 * Formats a Date into an ISO date string (YYYY-MM-DD) using local time.
 */
function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/* ============================================================================
   Component
   ============================================================================ */

/**
 * DashboardAttendanceBlock
 *
 * Main attendance widget for the coach dashboard.
 * Displays today's sessions, auto-selects the current/relevant session,
 * loads students for the selected batch, and allows single-tap attendance marking.
 *
 * Requirements: 1.1, 1.4, 2.1-2.4, 3.1, 4.4-4.8, 6.3-6.5, 7.1-7.2
 */
export const DashboardAttendanceBlock: React.FC<DashboardAttendanceBlockProps> = ({
  calendarEntries,
  calendarLoading,
}) => {
  // ─── Derived session data ───────────────────────────────────────────────────
  const todaySessions = useMemo(() => getTodaySessions(calendarEntries), [calendarEntries]);

  // ─── Internal state ─────────────────────────────────────────────────────────
  const [selectedSessionIndex, setSelectedSessionIndex] = useState<number>(-1);
  const [attendanceMap, setAttendanceMap] = useState<AttendanceMap>({});
  const [widgetState, setWidgetState] = useState<WidgetState>('loading');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Hooks ──────────────────────────────────────────────────────────────────
  const selectedSession = todaySessions[selectedSessionIndex] ?? null;

  // Today's date for drill drawer and attendance lookup. Local components, not
  // toISOString() (UTC) — for a UTC+5:30 timezone this is the actual calendar date; the UTC
  // one lags a day behind from midnight until 5:30am local.
  const todayDateStr = useMemo(() => formatDateString(new Date()), []);

  // asOfDate excludes students whose active enrollment hasn't actually started yet — a
  // student assigned to a batch whose training begins later shouldn't appear in today's
  // attendance just because the batch has a session slot on today's weekday.
  const { students, loading: studentsLoading } = useBatchStudents(selectedSession?.batchId, todayDateStr);
  const { markAttendance, loading: submitting } = useMarkAttendance();

  // ─── Session drill-down state (for student drill drawer) ─────────────────────
  const {
    selectedStudent,
    drawerOpen,
    handleStudentClick,
    closeDrawer,
  } = useSessionDrillDown();

  // Fetch existing attendance records for today's batch to pre-fill the map
  const { records: existingRecords } = useAttendanceRecords({
    batchId: selectedSession?.batchId,
    startDate: todayDateStr,
    endDate: todayDateStr,
  });

  // Pre-populate attendanceMap from existing records (retain for the whole day)
  useEffect(() => {
    if (existingRecords && existingRecords.length > 0 && Object.keys(attendanceMap).length === 0) {
      const map: AttendanceMap = {};
      for (const rec of existingRecords) {
        if (rec.studentId && rec.status) {
          map[rec.studentId] = rec.status as AttendanceStatus;
        }
      }
      if (Object.keys(map).length > 0) {
        setAttendanceMap(map);
      }
    }
  }, [existingRecords]);

  // ─── Auto-select current session on mount / when entries change ─────────────
  useEffect(() => {
    if (calendarLoading) {
      setWidgetState('loading');
      return;
    }

    if (todaySessions.length === 0) {
      setWidgetState('no-sessions');
      return;
    }

    const { session, index } = getCurrentSession(todaySessions, new Date());

    if (session === null) {
      // All sessions recorded
      setWidgetState('all-complete');
      setSelectedSessionIndex(-1);
    } else {
      setSelectedSessionIndex(index);
      setWidgetState('idle');
    }
  }, [calendarLoading, todaySessions]);

  // ─── Clean up success timer on unmount ──────────────────────────────────────
  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleSessionSelect = useCallback((index: number) => {
    setSelectedSessionIndex(index);
    setAttendanceMap({});
    setSubmitError(null);
    setWidgetState('idle');
  }, []);

  const handleToggle = useCallback((studentId: string, status: AttendanceStatus | undefined) => {
    setAttendanceMap((prev) => {
      if (status === undefined) {
        // Toggle off — remove from map
        const next = { ...prev };
        delete next[studentId];
        return next;
      }
      return { ...prev, [studentId]: status };
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedSession) return;

    setSubmitError(null);
    setWidgetState('submitting');

    const payload: MarkAttendanceData = {
      batchId: selectedSession.batchId,
      sessionDate: formatDateString(new Date()),
      records: Object.entries(attendanceMap).map(([studentId, status]) => ({
        studentId,
        status,
      })),
    };

    try {
      await markAttendance(payload);
      setWidgetState('success');
      // Keep attendanceMap intact so P/A buttons stay filled after submission

      // Reset to idle after 3 seconds (buttons remain filled showing recorded status)
      successTimerRef.current = setTimeout(() => {
        setWidgetState('idle');
      }, 3000);
    } catch {
      setSubmitError('Failed to submit attendance. Please try again.');
      setWidgetState('idle');
    }
  }, [selectedSession, attendanceMap, markAttendance]);

  // ─── Derived values ─────────────────────────────────────────────────────────
  const allMarked = students.length > 0 && students.every((s) => attendanceMap[s.id] !== undefined);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={wrapperStyle}>
      {/* Header */}
      <h2 style={titleStyle}>Today&apos;s Attendance</h2>

      {/* Loading skeleton */}
      {widgetState === 'loading' && <LoadingSkeleton />}

      {/* No sessions today */}
      {widgetState === 'no-sessions' && (
        <div style={emptyStateStyle}>
          <span style={emptyIconStyle}>📅</span>
          <p style={emptyTextStyle}>No sessions scheduled today</p>
        </div>
      )}

      {/* All complete */}
      {widgetState === 'all-complete' && (
        <div style={completeStateStyle}>
          <span style={completeIconStyle}>✓</span>
          <p style={completeTextStyle}>All attendance submitted</p>
        </div>
      )}

      {/* Success confirmation */}
      {widgetState === 'success' && (
        <div style={successStateStyle}>
          <span style={successIconStyle}>✓</span>
          <p style={successTextStyle}>Attendance submitted</p>
        </div>
      )}

      {/* Normal idle / submitting state */}
      {(widgetState === 'idle' || widgetState === 'submitting') && (
        <>
          {/* Session tab bar (show if multiple sessions) */}
          {todaySessions.length > 1 && (
            <div style={tabBarWrapperStyle}>
              <SessionTabBar
                sessions={todaySessions}
                selectedIndex={selectedSessionIndex}
                onSelect={handleSessionSelect}
              />
            </div>
          )}

          {/* Unified student list — click name for drills, P/A to toggle attendance */}
          <StudentAttendanceList
            students={students}
            attendanceMap={attendanceMap}
            onToggle={handleToggle}
            loading={studentsLoading}
            onNameClick={handleStudentClick}
          />

          {/* Submit footer */}
          <AttendanceSubmitFooter
            allMarked={allMarked}
            submitting={submitting || widgetState === 'submitting'}
            error={submitError}
            onSubmit={handleSubmit}
          />
        </>
      )}

      {/* Student drill drawer — opens when clicking a student name. Uses the student's own
          batch, not the currently selected session tab's batch — a student can belong to a
          different batch than whichever session happens to be selected. */}
      {selectedStudent && (
        <StudentDrillDrawer
          isOpen={drawerOpen}
          onClose={closeDrawer}
          student={selectedStudent}
          batchId={selectedStudent.batchId || ''}
          sessionDate={todayDateStr}
        />
      )}
    </div>
  );
};

/* ============================================================================
   Loading Skeleton Sub-component
   ============================================================================ */

const LoadingSkeleton: React.FC = () => (
  <div style={skeletonContainerStyle} aria-label="Loading attendance data" role="status">
    <div style={{ ...skeletonBarStyle, width: '60%' }} />
    <div style={{ ...skeletonBarStyle, width: '100%', height: '2.5rem' }} />
    <div style={{ ...skeletonBarStyle, width: '100%', height: '2.5rem' }} />
    <div style={{ ...skeletonBarStyle, width: '100%', height: '2.5rem' }} />
    <div style={{ ...skeletonBarStyle, width: '40%', height: '2rem' }} />
  </div>
);

/* ============================================================================
   Styles
   ============================================================================ */

const wrapperStyle: React.CSSProperties = {
  backgroundColor: 'var(--surface-card)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-lg)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-md)',
  boxShadow: 'var(--shadow-card)',
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 'var(--font-lg)',
  fontWeight: 700,
  color: 'var(--text-primary)',
};

const tabBarWrapperStyle: React.CSSProperties = {
  marginBottom: '0.25rem',
};

// ─── Empty state ──────────────────────────────────────────────────────────────

const emptyStateStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem 1rem',
  gap: '0.5rem',
};

const emptyIconStyle: React.CSSProperties = {
  fontSize: '1.5rem',
};

const emptyTextStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 'var(--font-sm)',
  color: 'var(--text-secondary)',
  fontWeight: 500,
};

// ─── All-complete state ───────────────────────────────────────────────────────

const completeStateStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem 1rem',
  gap: '0.5rem',
};

const completeIconStyle: React.CSSProperties = {
  fontSize: '1.75rem',
  color: 'var(--color-primary)',
  fontWeight: 700,
};

const completeTextStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 'var(--font-sm)',
  color: 'var(--text-secondary)',
  fontWeight: 500,
};

// ─── Success state ────────────────────────────────────────────────────────────

const successStateStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem 1rem',
  gap: '0.5rem',
};

const successIconStyle: React.CSSProperties = {
  fontSize: '1.75rem',
  color: 'var(--color-primary)',
  fontWeight: 700,
};

const successTextStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 'var(--font-sm)',
  color: 'var(--text-primary)',
  fontWeight: 600,
};

// ─── Loading skeleton ─────────────────────────────────────────────────────────

const skeletonContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-sm)',
  padding: 'var(--space-sm) 0',
};

const skeletonBarStyle: React.CSSProperties = {
  height: '1rem',
  borderRadius: 'var(--radius-sm)',
  backgroundColor: 'var(--surface-hover)',
  animation: 'pulse 1.5s ease-in-out infinite',
  opacity: 0.6,
};

export default DashboardAttendanceBlock;
