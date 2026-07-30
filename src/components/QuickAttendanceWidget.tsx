import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { CalendarEntry, AttendanceStatus, LeaveType, Student } from '../types';
import { useMarkAttendance, type MarkAttendanceEntry } from '../hooks/useAttendance';
import apiClient from '../utils/apiClient';

/**
 * QuickAttendanceWidget Component
 * Dashboard widget for marking attendance on the next upcoming session.
 * Auto-detects the next session from calendar entries, fetches batch students,
 * and provides P/A/L toggle buttons with submit functionality.
 */

export interface QuickAttendanceWidgetProps {
  calendarEntries: CalendarEntry[];
  calendarLoading: boolean;
}

interface StudentAttendanceState {
  status: AttendanceStatus;
  leaveType?: LeaveType;
}

type WidgetState = 'idle' | 'submitting' | 'success';

/**
 * Find the next upcoming session from calendar entries.
 * Checks today's sessions first (only those not yet started or in-progress),
 * then falls back to the next future session.
 */
function getNextSession(entries: CalendarEntry[]): CalendarEntry | null {
  if (!entries || entries.length === 0) return null;

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // Today's sessions that haven't ended yet and don't have attendance recorded
  const todaySessions = entries
    .filter((e) => e.date === todayStr && e.endTime > currentTime && !e.attendanceRecorded)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (todaySessions.length > 0) return todaySessions[0];

  // Future sessions without attendance recorded
  const futureSessions = entries
    .filter((e) => e.date > todayStr && !e.attendanceRecorded)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  return futureSessions.length > 0 ? futureSessions[0] : null;
}

function formatTime(time: string): string {
  const [h, m] = time.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export const QuickAttendanceWidget: React.FC<QuickAttendanceWidgetProps> = ({
  calendarEntries,
  calendarLoading,
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, StudentAttendanceState>>({});
  const [widgetState, setWidgetState] = useState<WidgetState>('idle');

  const { markAttendance, loading: submitting, error: submitError, reset } = useMarkAttendance();

  const nextSession = useMemo(() => getNextSession(calendarEntries), [calendarEntries]);

  // Fetch students for the batch when next session is determined
  useEffect(() => {
    if (!nextSession?.batchId) {
      setStudents([]);
      return;
    }

    let cancelled = false;
    const fetchStudents = async () => {
      setStudentsLoading(true);
      try {
        const response = await apiClient.get<Student[]>('/students', {
          params: { batchId: nextSession.batchId },
        });
        if (!cancelled) {
          setStudents(response.data);
        }
      } catch {
        if (!cancelled) {
          setStudents([]);
        }
      } finally {
        if (!cancelled) {
          setStudentsLoading(false);
        }
      }
    };

    void fetchStudents();
    return () => { cancelled = true; };
  }, [nextSession?.batchId]);

  const handleStatusToggle = useCallback((studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: { status },
    }));
  }, []);

  const allMarked = useMemo(
    () => students.length > 0 && students.every((s) => attendanceMap[s.id]?.status),
    [students, attendanceMap]
  );

  const handleSubmit = useCallback(async () => {
    if (!nextSession || !allMarked) return;

    const records: MarkAttendanceEntry[] = students.map((s) => ({
      studentId: s.id,
      status: attendanceMap[s.id].status,
      leaveType: attendanceMap[s.id].leaveType,
    }));

    try {
      reset();
      await markAttendance({
        batchId: nextSession.batchId,
        sessionDate: nextSession.date,
        records,
      });
      setWidgetState('success');
    } catch {
      // Error is handled by the hook
    }
  }, [nextSession, allMarked, students, attendanceMap, markAttendance, reset]);

  // Loading state
  if (calendarLoading) {
    return (
      <div style={cardStyle}>
        <div style={headerStyle}>
          <h3 style={titleStyle}>⚡ Quick Attendance</h3>
        </div>
        <div style={{ padding: 'var(--space-md)', color: 'var(--text-secondary)' }}>
          Loading sessions...
        </div>
      </div>
    );
  }

  // No upcoming session
  if (!nextSession) {
    return (
      <div style={cardStyle}>
        <div style={headerStyle}>
          <h3 style={titleStyle}>⚡ Quick Attendance</h3>
        </div>
        <div style={{ padding: 'var(--space-md)', color: 'var(--text-secondary)', textAlign: 'center' as const }}>
          No upcoming session
        </div>
      </div>
    );
  }

  // Success state
  if (widgetState === 'success') {
    return (
      <div style={cardStyle}>
        <div style={headerStyle}>
          <h3 style={titleStyle}>⚡ Quick Attendance</h3>
        </div>
        <div style={{
          padding: 'var(--space-lg)',
          textAlign: 'center' as const,
          color: 'var(--color-success)',
          fontWeight: 600,
        }}>
          Attendance recorded ✓
        </div>
      </div>
    );
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const isToday = nextSession.date === todayStr;

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h3 style={titleStyle}>⚡ Quick Attendance</h3>
      </div>

      {/* Session info */}
      <div style={{ padding: '0 var(--space-lg)', marginBottom: 'var(--space-md)' }}>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>
          {nextSession.batchName}
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {isToday ? 'Today' : formatDate(nextSession.date)} • {formatTime(nextSession.startTime)} – {formatTime(nextSession.endTime)}
        </div>
      </div>

      {/* Student list */}
      <div style={{ padding: '0 var(--space-lg)', marginBottom: 'var(--space-md)' }}>
        {studentsLoading ? (
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Loading students...</div>
        ) : students.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No students in this batch</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 'var(--space-sm)' }}>
            {students.map((student) => {
              const currentStatus = attendanceMap[student.id]?.status;
              return (
                <div
                  key={student.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-xs) 0',
                    borderBottom: '1px solid var(--border-default)',
                  }}
                >
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', flex: 1 }}>
                    {student.fullName}
                  </span>
                  <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                    <button
                      type="button"
                      onClick={() => handleStatusToggle(student.id, 'PRESENT')}
                      style={getToggleStyle(currentStatus === 'PRESENT', 'PRESENT')}
                      aria-label={`Mark ${student.fullName} present`}
                    >
                      P
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusToggle(student.id, 'ABSENT')}
                      style={getToggleStyle(currentStatus === 'ABSENT', 'ABSENT')}
                      aria-label={`Mark ${student.fullName} absent`}
                    >
                      A
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusToggle(student.id, 'LATE')}
                      style={getToggleStyle(currentStatus === 'LATE', 'LATE')}
                      aria-label={`Mark ${student.fullName} late`}
                    >
                      L
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submit button */}
      {students.length > 0 && (
        <div style={{ padding: '0 var(--space-lg) var(--space-lg)' }}>
          {submitError && (
            <div style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginBottom: 'var(--space-sm)' }}>
              {submitError}
            </div>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allMarked || submitting}
            style={{
              width: '100%',
              padding: 'var(--space-sm) var(--space-md)',
              backgroundColor: allMarked ? 'var(--color-primary)' : 'var(--border-default)',
              color: allMarked ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: allMarked ? 'pointer' : 'not-allowed',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Attendance'}
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--surface-card)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-lg) 0',
  boxShadow: 'var(--shadow-card)',
};

const headerStyle: React.CSSProperties = {
  padding: '0 var(--space-lg)',
  marginBottom: 'var(--space-md)',
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '1rem',
  fontWeight: 700,
  color: 'var(--text-primary)',
};

function getToggleStyle(isActive: boolean, status: AttendanceStatus): React.CSSProperties {
  const baseStyle: React.CSSProperties = {
    width: '28px',
    height: '28px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-default)',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
  };

  if (!isActive) {
    return {
      ...baseStyle,
      backgroundColor: 'var(--surface-card)',
      color: 'var(--text-secondary)',
    };
  }

  switch (status) {
    case 'PRESENT':
      return { ...baseStyle, backgroundColor: '#16a34a', color: '#fff', border: '1px solid #16a34a' };
    case 'ABSENT':
      return { ...baseStyle, backgroundColor: '#dc2626', color: '#fff', border: '1px solid #dc2626' };
    case 'LATE':
      return { ...baseStyle, backgroundColor: '#eab308', color: '#fff', border: '1px solid #eab308' };
    default:
      return baseStyle;
  }
}

export default QuickAttendanceWidget;
