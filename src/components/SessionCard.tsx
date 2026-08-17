/**
 * SessionCard Component
 * Displays today's upcoming session(s) with time, batch name, focus area, planned drills, and coach notes.
 * If no session is scheduled for today, shows the next upcoming session with its date.
 *
 * Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.10
 */

import React, { useMemo } from 'react';
import type { CalendarEntry } from '../types';

export interface SessionCardProps {
  /** Calendar entries for the current period (should include today and upcoming days) */
  entries: CalendarEntry[];
  /** Whether the data is currently loading */
  loading?: boolean;
  /** Error message if data fetch failed */
  error?: string | null;
  /** Whether this is a coach view (shows multiple batches) or student view (single batch) */
  variant?: 'student' | 'coach';
  /** Callback when a session entry is clicked (enables drill-down interaction) */
  onSessionClick?: (entry: CalendarEntry) => void;
  /** Currently expanded session's batchId (to show active/expanded visual state) */
  expandedBatchId?: string;
}

/**
 * Get today's date as an ISO date string (YYYY-MM-DD) in local time.
 */
function getTodayStr(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

/**
 * Format a time string (HH:MM) for display, e.g. "06:00" -> "6:00 AM"
 */
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format a date string for display when showing a future session date.
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Renders a single session entry within the card.
 * When `onClick` is provided, the entry becomes interactive with hover/active styling.
 *
 * Requirements: 7.1, 7.2, 7.3
 */
function SessionEntry({
  entry,
  showDate,
  onClick,
  isExpanded,
}: {
  entry: CalendarEntry;
  showDate: boolean;
  onClick?: (entry: CalendarEntry) => void;
  isExpanded?: boolean;
}) {
  const isClickable = !!onClick;

  return (
    <div
      className={`rounded-lg p-4 bg-[var(--surface-card)] transition-all duration-200${isClickable ? ' cursor-pointer hover:shadow-md hover:border-blue-300' : ''}${isExpanded ? ' border-blue-500 shadow-sm' : ''}`}
      style={{ border: `1px solid ${isExpanded ? 'var(--color-blue-500, #3b82f6)' : 'var(--border-default)'}` }}
      onClick={isClickable ? () => onClick(entry) : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(entry); } } : undefined}
    >
      {/* Header: Time and Batch */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Clock icon */}
          <svg
            className="w-4 h-4 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm font-semibold text-gray-900">
            {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
            {entry.batchName}
          </span>
          {/* Chevron indicator — rotates when expanded */}
          {isClickable && (
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform duration-200${isExpanded ? ' rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Date indicator (shown for future sessions) */}
      {showDate && (
        <div className="flex items-center gap-1.5 mb-3">
          <svg
            className="w-3.5 h-3.5 text-orange-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-xs font-medium text-orange-600">
            {formatDate(entry.date)}
          </span>
        </div>
      )}

      {/* Focus Area */}
      {entry.focusArea && (
        <div className="mb-3">
          <p className="text-xs uppercase tracking-wide font-medium text-gray-500 mb-1">
            Focus Area
          </p>
          <p className="text-sm font-medium text-gray-800">
            {entry.focusArea}
          </p>
        </div>
      )}

      {/* Planned Drills */}
      {entry.drills && entry.drills.length > 0 && (
        <div className="mb-3">
          <p className="text-xs uppercase tracking-wide font-medium text-gray-500 mb-1.5">
            Planned Drills
          </p>
          <ul className="space-y-1">
            {entry.drills.map((drill, idx) => (
              <li
                key={idx}
                className="flex items-center gap-2 text-sm text-gray-700"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                {drill}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Coach Note */}
      {entry.coachNote && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-default)' }}>
          <p className="text-xs uppercase tracking-wide font-medium text-gray-500 mb-1">
            Coach Note
          </p>
          <p className="text-sm text-gray-700 italic">
            {entry.coachNote}
          </p>
        </div>
      )}
    </div>
  );
}

export const SessionCard: React.FC<SessionCardProps> = ({
  entries,
  loading = false,
  error = null,
  variant = 'student',
  onSessionClick,
  expandedBatchId,
}) => {
  const todayStr = useMemo(() => getTodayStr(), []);

  /**
   * Determine which sessions to display:
   * - For coach: all today's sessions across batches (Req 17.2)
   * - For student: today's next session or nearest future session (Req 17.1, 17.10)
   */
  const { sessionsToShow, isFutureDate } = useMemo(() => {
    if (!entries || entries.length === 0) {
      return { sessionsToShow: [], isFutureDate: false };
    }

    // Sort entries by date then start time
    const sorted = [...entries].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });

    // Find today's sessions
    const todaySessions = sorted.filter((e) => e.date === todayStr);

    if (todaySessions.length > 0) {
      if (variant === 'coach') {
        // Coach sees all today's sessions (Req 17.2)
        return { sessionsToShow: todaySessions, isFutureDate: false };
      }
      // Student sees the next upcoming session for today (Req 17.1)
      return { sessionsToShow: [todaySessions[0]], isFutureDate: false };
    }

    // No session today - find next upcoming session (Req 17.10)
    const futureSessions = sorted.filter((e) => e.date > todayStr);
    if (futureSessions.length > 0) {
      if (variant === 'coach') {
        // Coach sees all sessions on the next day that has sessions
        const nextDate = futureSessions[0].date;
        const nextDaySessions = futureSessions.filter((e) => e.date === nextDate);
        return { sessionsToShow: nextDaySessions, isFutureDate: true };
      }
      // Student sees the single next upcoming session
      return { sessionsToShow: [futureSessions[0]], isFutureDate: true };
    }

    return { sessionsToShow: [], isFutureDate: false };
  }, [entries, todayStr, variant]);

  // Loading state
  if (loading) {
    return (
      <div className="rounded-lg" style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading session info...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg" style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', boxShadow: 'var(--shadow-card)' }}>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  // No sessions at all
  if (sessionsToShow.length === 0) {
    return (
      <div className="rounded-lg" style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm text-gray-500">
            No upcoming sessions scheduled
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg" style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', boxShadow: 'var(--shadow-card)' }}>
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">
          {isFutureDate ? 'Next Session' : "Today's Session"}
          {variant === 'coach' && sessionsToShow.length > 1 && 's'}
        </h3>
        {isFutureDate && sessionsToShow.length > 0 && (
          <span className="text-xs font-medium bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
            Upcoming
          </span>
        )}
      </div>

      {/* Session Entries */}
      <div className="space-y-3">
        {sessionsToShow.map((entry, idx) => (
          <SessionEntry
            key={`${entry.date}-${entry.startTime}-${entry.batchId}-${idx}`}
            entry={entry}
            showDate={isFutureDate}
            onClick={onSessionClick}
            isExpanded={expandedBatchId === entry.batchId}
          />
        ))}
      </div>
    </div>
  );
};

export default SessionCard;
