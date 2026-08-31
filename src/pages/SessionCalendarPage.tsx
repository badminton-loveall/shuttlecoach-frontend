/**
 * SessionCalendarPage
 * Calendar view of training sessions with drill/focus area details.
 * Coach view: multi-batch color-coded calendar with batch color legend.
 * Student view: read-only with curriculum details on session click.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 14.4, 14.5, 15.4, 15.5, 15.6
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import CalendarGrid from '../components/StudentScheduleCalendar/CalendarGrid';
import MonthNavigator from '../components/StudentScheduleCalendar/MonthNavigator';
import { BatchColorLegend } from '../components/BatchColorLegend';
import { CoachDayDetailPanel } from '../components/CoachDayDetailPanel';
import type { CoachBatchEntry } from '../components/CoachDayDetailPanel';
import { buildGridDays, buildEntriesMap, getToday } from '../components/StudentScheduleCalendar/calendarUtils';
import { assignBatchColors } from '../utils/batchColors';
import { useAuth } from '../contexts/AuthContext';
import { useSessionCalendar } from '../hooks/useSessionSchedule';
import type { CalendarEntry } from '../types';

/**
 * Compute start and end date for a 3-month window centered on the current date.
 */
function getDefaultDateRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  return {
    startDate: formatDateISO(start),
    endDate: formatDateISO(end),
  };
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Format time from HH:MM to display format (e.g., "06:00" -> "6:00 AM").
 */
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format a date string for display.
 */
function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const SessionCalendarPage: React.FC = () => {
  const { role } = useAuth();
  const navigate = useNavigate();

  const isCoach = role === 'HEAD_COACH' || role === 'ASSISTANT_COACH';

  // Date range for calendar query (3-month window) — no batchId filter (Req 2.1)
  const { startDate, endDate } = useMemo(() => getDefaultDateRange(), []);

  const { entries, loading, error } = useSessionCalendar({ startDate, endDate });

  // Month navigation state
  const now = new Date();
  const [viewedYear, setViewedYear] = useState(now.getFullYear());
  const [viewedMonth, setViewedMonth] = useState(now.getMonth());

  const handlePrevMonth = useCallback(() => {
    setViewedMonth((prev) => {
      if (prev === 0) {
        setViewedYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setViewedMonth((prev) => {
      if (prev === 11) {
        setViewedYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  // Build grid days for the current viewed month
  const gridDays = useMemo(() => buildGridDays(viewedYear, viewedMonth), [viewedYear, viewedMonth]);

  // Build entries map for CalendarGrid
  const entriesByDate = useMemo(() => buildEntriesMap(entries), [entries]);

  // Assign batch colors (Req 2.2)
  const uniqueBatchIds = useMemo(
    () => [...new Set(entries.map((e) => e.batchId))],
    [entries]
  );
  const batchColorMap = useMemo(() => assignBatchColors(uniqueBatchIds), [uniqueBatchIds]);

  // Build batchColorsByDate map for CalendarGrid (Req 2.3)
  const batchColorsByDate = useMemo(() => {
    const map = new Map<string, Array<{ batchId: string; batchName: string; color: string }>>();
    entries.forEach((entry) => {
      const existing = map.get(entry.date) || [];
      if (!existing.some((b) => b.batchId === entry.batchId)) {
        existing.push({
          batchId: entry.batchId,
          batchName: entry.batchName,
          color: batchColorMap.get(entry.batchId) || '#888',
        });
      }
      map.set(entry.date, existing);
    });
    return map;
  }, [entries, batchColorMap]);

  // Build legend data (Req 2.4) — all unique batches with their colors
  const legendBatches = useMemo(() => {
    return uniqueBatchIds.map((id) => {
      const entry = entries.find((e) => e.batchId === id);
      return {
        batchId: id,
        batchName: entry?.batchName || id,
        color: batchColorMap.get(id) || '#888',
      };
    });
  }, [uniqueBatchIds, entries, batchColorMap]);

  // Selected date and session for detail panel
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<CalendarEntry | null>(null);
  // Coach day detail panel state (Req 3.1)
  const [coachDayEntries, setCoachDayEntries] = useState<CoachBatchEntry[] | null>(null);

  const today = getToday();

  const handleDayClick = useCallback(
    (date: string) => {
      setSelectedDate(date);
      const dayEntries = entries.filter((e) => e.date === date);

      if (isCoach) {
        // Coach view: group entries by batchId and build CoachBatchEntry array (Req 3.1)
        const batchMap = new Map<string, CalendarEntry>();
        dayEntries.forEach((entry) => {
          if (!batchMap.has(entry.batchId)) {
            batchMap.set(entry.batchId, entry);
          }
        });

        const batchEntries: CoachBatchEntry[] = Array.from(batchMap.values()).map((entry) => ({
          batchId: entry.batchId,
          batchName: entry.batchName,
          batchColor: batchColorMap.get(entry.batchId) || '#888',
          startTime: entry.startTime,
          endTime: entry.endTime,
          focusArea: entry.focusArea || '',
        }));

        setCoachDayEntries(batchEntries);
        setSelectedEntry(null);
      } else {
        // Student view: show single session detail
        setCoachDayEntries(null);
        if (dayEntries.length > 0) {
          setSelectedEntry(dayEntries[0]);
        } else {
          setSelectedEntry(null);
        }
      }
    },
    [entries, isCoach, batchColorMap]
  );

  const handleCloseDetail = useCallback(() => {
    setSelectedEntry(null);
    setSelectedDate(null);
    setCoachDayEntries(null);
  }, []);

  /**
   * Navigate to attendance marking for the selected session (Coach only).
   * Requirement 15.6: quick-access button to mark attendance.
   */
  const handleMarkAttendance = useCallback(() => {
    if (selectedEntry) {
      navigate(`/attendance?batchId=${selectedEntry.batchId}&date=${selectedEntry.date}`);
    }
  }, [selectedEntry, navigate]);

  return (
    <DashboardLayout>
      <div className="hc-dashboard">
        <div className="hc-dashboard-content">
          {/* Page Header */}
          <div className="page-header">
            <div>
              <h1 className="page-header-title">Session Calendar</h1>
              <p className="page-header-subtitle">
                {isCoach
                  ? 'View all batch sessions and quickly access attendance marking'
                  : 'View your training sessions with planned drills and focus areas'}
              </p>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div
              className="rounded-md p-4 text-sm"
              style={{
                backgroundColor: 'var(--feedback-danger-light)',
                color: 'var(--color-danger)',
                border: '1px solid var(--color-danger)',
              }}
            >
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && !entries.length && (
            <div
              style={{
                backgroundColor: 'var(--surface-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-2xl)',
              }}
            >
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/3" />
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-24 bg-gray-100 rounded" />
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-24 bg-gray-100 rounded" />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Main Content: Calendar Grid + Detail Panel */}
          {!loading || entries.length > 0 ? (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Calendar with Month Navigator and Grid */}
              <div className={(selectedEntry || coachDayEntries) ? 'flex-1 min-w-0' : 'w-full'}>
                {/* Batch Color Legend (Req 2.4) */}
                {isCoach && legendBatches.length > 0 && (
                  <BatchColorLegend batches={legendBatches} />
                )}

                {/* Month Navigator */}
                <MonthNavigator
                  year={viewedYear}
                  month={viewedMonth}
                  onPrev={handlePrevMonth}
                  onNext={handleNextMonth}
                />

                {/* Calendar Grid with batch color dots */}
                <CalendarGrid
                  days={gridDays}
                  entriesByDate={entriesByDate}
                  selectedDate={selectedDate}
                  today={today}
                  onDayClick={handleDayClick}
                  batchColorsByDate={isCoach ? batchColorsByDate : undefined}
                />
              </div>

              {/* Coach Day Detail Panel (Req 3.1, 3.2, 3.3, 4.1) */}
              {isCoach && coachDayEntries && selectedDate && (
                <aside className="w-full lg:w-96 shrink-0" aria-label="Day details">
                  <CoachDayDetailPanel
                    date={selectedDate}
                    batchEntries={coachDayEntries}
                    onClose={handleCloseDetail}
                  />
                </aside>
              )}

              {/* Student Session Detail Panel */}
              {!isCoach && selectedEntry && (
                <SessionDetailPanel
                  entry={selectedEntry}
                  isCoach={isCoach}
                  onClose={handleCloseDetail}
                  onMarkAttendance={handleMarkAttendance}
                />
              )}
            </div>
          ) : null}

          {/* Empty State */}
          {!loading && !error && entries.length === 0 && (
            <div
              className="text-center"
              style={{
                backgroundColor: 'var(--surface-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-2xl)',
              }}
            >
              <svg
                className="mx-auto h-12 w-12"
                style={{ color: 'var(--text-tertiary)' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="mt-3 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                No sessions scheduled. {isCoach ? 'Create a session schedule for your batches to see calendar entries.' : 'Contact your coach to set up a session schedule.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

/* --------------------------------------------------------------------------
   Session Detail Panel
   -------------------------------------------------------------------------- */

interface SessionDetailPanelProps {
  entry: CalendarEntry;
  isCoach: boolean;
  onClose: () => void;
  onMarkAttendance: () => void;
}

const SessionDetailPanel: React.FC<SessionDetailPanelProps> = ({
  entry,
  isCoach,
  onClose,
  onMarkAttendance,
}) => {
  return (
    <aside
      className="w-full lg:w-96 shrink-0 overflow-hidden"
      style={{
        backgroundColor: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-card)',
      }}
      aria-label="Session details"
    >
      {/* Panel Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{
          borderBottom: '1px solid var(--border-default)',
          backgroundColor: 'var(--surface-hover)',
        }}
      >
        <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
          Session Details
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-md transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
          aria-label="Close session details"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Panel Content */}
      <div className="px-5 py-4 space-y-5">
        {/* Date and Time */}
        <div>
          <p className="text-xs uppercase tracking-wide font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Date & Time
          </p>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {formatDisplayDate(entry.date)}
          </p>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
          </p>
        </div>

        {/* Batch */}
        <div>
          <p className="text-xs uppercase tracking-wide font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Batch
          </p>
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium"
            style={{ backgroundColor: 'var(--feedback-info-light)', color: 'var(--color-info-text)' }}
          >
            {entry.batchName}
          </span>
        </div>

        {/* Focus Area (Req 14.5, 15.5) */}
        {entry.focusArea && (
          <div>
            <p className="text-xs uppercase tracking-wide font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
              Focus Area
            </p>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {entry.focusArea}
            </p>
          </div>
        )}

        {/* Curriculum Week */}
        {entry.weekNumber > 0 && (
          <div>
            <p className="text-xs uppercase tracking-wide font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
              Curriculum Week
            </p>
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium"
              style={{ backgroundColor: 'rgba(184, 225, 53, 0.15)', color: 'var(--color-primary-dark)' }}
            >
              Week {entry.weekNumber}
            </span>
          </div>
        )}

        {/* Planned Drills (Req 14.4, 15.4) */}
        {entry.drills && entry.drills.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-wide font-medium mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
              Planned Drills
            </p>
            <ul className="space-y-1.5">
              {entry.drills.map((drill, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-2 text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--color-success)' }} aria-hidden="true" />
                  {drill}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* No Drills Scheduled */}
        {(!entry.drills || entry.drills.length === 0) && (
          <div>
            <p className="text-xs uppercase tracking-wide font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
              Planned Drills
            </p>
            <p className="text-sm italic" style={{ color: 'var(--text-tertiary)' }}>
              No drills scheduled for this session
            </p>
          </div>
        )}

        {/* Coach Note */}
        {entry.coachNote && (
          <div>
            <p className="text-xs uppercase tracking-wide font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
              Coach Note
            </p>
            <p
              className="text-sm italic rounded-md p-3"
              style={{
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--surface-hover)',
              }}
            >
              {entry.coachNote}
            </p>
          </div>
        )}

        {/* Attendance Status Indicator */}
        <div>
          <p className="text-xs uppercase tracking-wide font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Attendance Status
          </p>
          {entry.attendanceRecorded ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--color-success-dark)' }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-success)' }} aria-hidden="true" />
              Recorded
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-slate-300)' }} aria-hidden="true" />
              Not recorded
            </span>
          )}
        </div>
      </div>

      {/* Coach Action: Mark Attendance Button (Req 15.6) */}
      {isCoach && (
        <div
          className="px-5 py-4"
          style={{
            borderTop: '1px solid var(--border-default)',
            backgroundColor: 'var(--surface-hover)',
          }}
        >
          <button
            type="button"
            onClick={onMarkAttendance}
            className="btn btn-info w-full flex items-center justify-center gap-2"
            disabled={entry.attendanceRecorded}
          >
            {/* Checkmark icon */}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {entry.attendanceRecorded ? 'Attendance Already Recorded' : 'Mark Attendance'}
          </button>
        </div>
      )}
    </aside>
  );
};

export default SessionCalendarPage;
