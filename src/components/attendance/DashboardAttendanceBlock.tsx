import React, { useMemo } from 'react';
import { getTodaySessions } from '../../utils/attendanceBlockUtils';
import { useSessionDrillDown } from '../../hooks/useSessionDrillDown';
import { BatchAttendanceSection } from './BatchAttendanceSection';
import { StudentDrillDrawer } from '../StudentDrillDrawer';
import type { CalendarEntry } from '../../types';

/* ============================================================================
   Types
   ============================================================================ */

export interface DashboardAttendanceBlockProps {
  calendarEntries: CalendarEntry[];
  calendarLoading: boolean;
}

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
 * Main attendance widget for the coach dashboard. Shows every batch with a session today —
 * its name and timing — each with its own students grouped into Pending / Present / Absent,
 * so a coach marking multiple batches doesn't need to tab between them one at a time.
 */
export const DashboardAttendanceBlock: React.FC<DashboardAttendanceBlockProps> = ({
  calendarEntries,
  calendarLoading,
}) => {
  // ─── Derived session data ───────────────────────────────────────────────────
  const todaySessions = useMemo(() => getTodaySessions(calendarEntries), [calendarEntries]);

  // Today's date for drill drawer and attendance lookup. Local components, not
  // toISOString() (UTC) — for a UTC+5:30 timezone this is the actual calendar date; the UTC
  // one lags a day behind from midnight until 5:30am local.
  const todayDateStr = useMemo(() => formatDateString(new Date()), []);

  // ─── Session drill-down state (for student drill drawer) ─────────────────────
  const {
    selectedStudent,
    drawerOpen,
    handleStudentClick,
    closeDrawer,
  } = useSessionDrillDown();

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={wrapperStyle}>
      {/* Header */}
      <h2 style={titleStyle}>Today&apos;s Attendance</h2>

      {/* Loading skeleton */}
      {calendarLoading && <LoadingSkeleton />}

      {/* No sessions today */}
      {!calendarLoading && todaySessions.length === 0 && (
        <div style={emptyStateStyle}>
          <span style={emptyIconStyle}>📅</span>
          <p style={emptyTextStyle}>No sessions scheduled today</p>
        </div>
      )}

      {/* One card per today's batch — each loads and saves its own students independently */}
      {!calendarLoading && todaySessions.length > 0 && (
        <div style={sectionsStyle}>
          {todaySessions.map((session) => (
            <BatchAttendanceSection
              key={`${session.batchId}-${session.date}`}
              session={session}
              todayDateStr={todayDateStr}
              onNameClick={handleStudentClick}
            />
          ))}
        </div>
      )}

      {/* Student drill drawer — opens when clicking a student name. Uses the student's own
          batch, not necessarily the batch card it was clicked from — a student can belong to a
          different batch than whichever session card happens to list them. */}
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
  padding: 'var(--space-md)',
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

const sectionsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-md)',
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
