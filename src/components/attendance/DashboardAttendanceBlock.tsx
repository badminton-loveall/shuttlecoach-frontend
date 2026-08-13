import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getTodaySessions, getCurrentSession } from '../../utils/attendanceBlockUtils';
import { useBatchStudents } from '../../hooks/useBatchStudents';
import { useMarkAttendance } from '../../hooks/useAttendance';
import { SessionTabBar } from './SessionTabBar';
import { StudentAttendanceList } from './StudentAttendanceList';
import { AttendanceSubmitFooter } from './AttendanceSubmitFooter';
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
  const { students, loading: studentsLoading } = useBatchStudents(selectedSession?.batchId);
  const { markAttendance, loading: submitting } = useMarkAttendance();

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

  const handleToggle = useCallback((studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
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
      setAttendanceMap({});

      // Reset to idle after 3 seconds
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

          {/* Student list */}
          <StudentAttendanceList
            students={students}
            attendanceMap={attendanceMap}
            onToggle={handleToggle}
            loading={studentsLoading}
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
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 'var(--radius)',
  padding: '1.25rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '1.125rem',
  fontWeight: 700,
  color: 'hsl(var(--foreground))',
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
  fontSize: '0.875rem',
  color: 'hsl(var(--muted-foreground))',
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
  color: 'hsl(var(--primary))',
  fontWeight: 700,
};

const completeTextStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '0.875rem',
  color: 'hsl(var(--muted-foreground))',
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
  color: 'hsl(var(--primary))',
  fontWeight: 700,
};

const successTextStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '0.875rem',
  color: 'hsl(var(--foreground))',
  fontWeight: 600,
};

// ─── Loading skeleton ─────────────────────────────────────────────────────────

const skeletonContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  padding: '0.5rem 0',
};

const skeletonBarStyle: React.CSSProperties = {
  height: '1rem',
  borderRadius: 'var(--radius)',
  backgroundColor: 'hsl(var(--muted))',
  animation: 'pulse 1.5s ease-in-out infinite',
  opacity: 0.6,
};

export default DashboardAttendanceBlock;
