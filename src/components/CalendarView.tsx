/**
 * CalendarView Component
 * Renders a week/month calendar grid with session slots, navigation, and attendance indicators.
 *
 * Requirements: 14.1, 14.2, 14.3, 14.6, 15.2, 15.7
 * - Displays all SessionSlots on corresponding days of the week
 * - Shows start and end time for each SessionSlot
 * - Displays multiple SessionSlots on the same day as separate entries
 * - Supports navigation between weeks/months
 * - Supports week and month views
 * - Shows attendance status indicator for recorded sessions
 */

import React, { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { CalendarEntry } from '../types';

/* --------------------------------------------------------------------------
   Types
   -------------------------------------------------------------------------- */

export type CalendarViewMode = 'week' | 'month';

export interface CalendarViewProps {
  /** Calendar entries to display on the grid */
  entries: CalendarEntry[];
  /** Initial view mode (defaults to 'week') */
  initialViewMode?: CalendarViewMode;
  /** Callback when a session entry is clicked */
  onSessionClick?: (entry: CalendarEntry) => void;
  /** Optional CSS class for container */
  className?: string;
}

/* --------------------------------------------------------------------------
   Date helpers
   -------------------------------------------------------------------------- */

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Get the start of the week (Sunday) for a given date.
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get all dates for the week starting at `weekStart`.
 */
function getWeekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/**
 * Get the first day of the month.
 */
function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get all calendar cells for a month grid view (includes trailing/leading days).
 */
function getMonthGridDates(date: Date): Date[] {
  const firstDay = getMonthStart(date);
  const startOffset = firstDay.getDay(); // 0=Sun offset
  const gridStart = new Date(firstDay);
  gridStart.setDate(gridStart.getDate() - startOffset);

  // 6 rows x 7 columns = 42 cells maximum
  const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const endOffset = 6 - lastDayOfMonth.getDay();
  const totalCells = startOffset + lastDayOfMonth.getDate() + endOffset;

  return Array.from({ length: totalCells }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/**
 * Format date as YYYY-MM-DD for comparison with CalendarEntry.date.
 */
function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Format month and year label.
 */
function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Format week range label.
 */
function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const startStr = weekStart.toLocaleDateString('en-US', options);
  const endStr = weekEnd.toLocaleDateString('en-US', { ...options, year: 'numeric' });
  return `${startStr} - ${endStr}`;
}

/**
 * Check if two dates are on the same calendar day.
 */
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/* --------------------------------------------------------------------------
   Sub-components
   -------------------------------------------------------------------------- */

interface SessionSlotCardProps {
  entry: CalendarEntry;
  compact?: boolean;
  onClick?: (entry: CalendarEntry) => void;
}

const SessionSlotCard: React.FC<SessionSlotCardProps> = ({ entry, compact, onClick }) => {
  return (
    <button
      type="button"
      onClick={() => onClick?.(entry)}
      className={cn(
        'w-full text-left rounded-md transition-colors',
        'hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        entry.attendanceRecorded
          ? 'bg-green-50'
          : '',
        compact ? 'px-1.5 py-1 text-xs' : 'px-2 py-1.5 text-sm'
      )}
      style={{
        border: entry.attendanceRecorded ? '1px solid #86EFAC' : '1px solid var(--border-default)',
        backgroundColor: entry.attendanceRecorded ? undefined : 'var(--surface-card)',
      }}
      aria-label={`Session: ${entry.batchName} at ${entry.startTime} - ${entry.endTime}${entry.attendanceRecorded ? ' (attendance recorded)' : ''}`}
    >
      <div className="flex items-center gap-1">
        {/* Attendance indicator dot */}
        {entry.attendanceRecorded && (
          <span
            className="inline-block w-2 h-2 rounded-full bg-green-500 flex-shrink-0"
            title="Attendance recorded"
            aria-hidden="true"
          />
        )}
        <span className={cn('font-medium truncate', compact ? 'text-xs' : 'text-sm')} style={{ color: 'var(--text-primary)' }}>
          {entry.batchName}
        </span>
      </div>
      <div className={cn(compact ? 'text-[10px]' : 'text-xs')} style={{ color: 'var(--text-tertiary)' }}>
        {entry.startTime} - {entry.endTime}
      </div>
      {!compact && entry.focusArea && (
        <div className="text-xs text-blue-600 truncate mt-0.5">
          {entry.focusArea}
        </div>
      )}
    </button>
  );
};

/* --------------------------------------------------------------------------
   CalendarView Component
   -------------------------------------------------------------------------- */

export const CalendarView: React.FC<CalendarViewProps> = ({
  entries,
  initialViewMode = 'week',
  onSessionClick,
  className,
}) => {
  const [viewMode, setViewMode] = useState<CalendarViewMode>(initialViewMode);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Build a lookup map: dateKey -> entries[]
  const entriesByDate = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const entry of entries) {
      const key = entry.date;
      const existing = map.get(key);
      if (existing) {
        existing.push(entry);
      } else {
        map.set(key, [entry]);
      }
    }
    return map;
  }, [entries]);

  /* ---------- Navigation handlers ---------- */

  const goToPrevious = useCallback(() => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'week') {
        d.setDate(d.getDate() - 7);
      } else {
        d.setMonth(d.getMonth() - 1);
      }
      return d;
    });
  }, [viewMode]);

  const goToNext = useCallback(() => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'week') {
        d.setDate(d.getDate() + 7);
      } else {
        d.setMonth(d.getMonth() + 1);
      }
      return d;
    });
  }, [viewMode]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  /* ---------- Date calculations ---------- */

  const weekStart = useMemo(() => getWeekStart(currentDate), [currentDate]);
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);
  const monthGridDates = useMemo(() => getMonthGridDates(currentDate), [currentDate]);

  const today = new Date();

  /* ---------- Header label ---------- */

  const headerLabel = useMemo(() => {
    if (viewMode === 'week') {
      return formatWeekRange(weekStart);
    }
    return formatMonthYear(currentDate);
  }, [viewMode, weekStart, currentDate]);

  /* ---------- Render ---------- */

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Toolbar: view toggle + navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        {/* View mode toggle */}
        <div
          className="flex items-center gap-1 rounded-lg p-1"
          style={{ backgroundColor: 'var(--surface-hover)' }}
        >
          <button
            type="button"
            onClick={() => setViewMode('week')}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              viewMode === 'week'
                ? 'shadow-sm'
                : ''
            )}
            style={viewMode === 'week'
              ? { backgroundColor: 'var(--surface-card)', color: 'var(--text-primary)' }
              : { color: 'var(--text-secondary)' }
            }
            aria-pressed={viewMode === 'week'}
          >
            Week
          </button>
          <button
            type="button"
            onClick={() => setViewMode('month')}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              viewMode === 'month'
                ? 'shadow-sm'
                : ''
            )}
            style={viewMode === 'month'
              ? { backgroundColor: 'var(--surface-card)', color: 'var(--text-primary)' }
              : { color: 'var(--text-secondary)' }
            }
            aria-pressed={viewMode === 'month'}
          >
            Month
          </button>
        </div>

        {/* Navigation controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
          >
            Today
          </button>
          <button
            type="button"
            onClick={goToPrevious}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            aria-label={viewMode === 'week' ? 'Previous week' : 'Previous month'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-semibold min-w-[180px] text-center" style={{ color: 'var(--text-primary)' }}>
            {headerLabel}
          </span>
          <button
            type="button"
            onClick={goToNext}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            aria-label={viewMode === 'week' ? 'Next week' : 'Next month'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      {viewMode === 'week' ? (
        <WeekGrid
          dates={weekDates}
          entriesByDate={entriesByDate}
          today={today}
          onSessionClick={onSessionClick}
        />
      ) : (
        <MonthGrid
          dates={monthGridDates}
          currentMonth={currentDate.getMonth()}
          entriesByDate={entriesByDate}
          today={today}
          onSessionClick={onSessionClick}
        />
      )}
    </div>
  );
};

/* --------------------------------------------------------------------------
   WeekGrid
   -------------------------------------------------------------------------- */

interface WeekGridProps {
  dates: Date[];
  entriesByDate: Map<string, CalendarEntry[]>;
  today: Date;
  onSessionClick?: (entry: CalendarEntry) => void;
}

const WeekGrid: React.FC<WeekGridProps> = ({ dates, entriesByDate, today, onSessionClick }) => {
  return (
    <div
      className="grid grid-cols-7 gap-px rounded-lg overflow-hidden"
      style={{ backgroundColor: 'var(--border-default)', border: '1px solid var(--border-default)' }}
    >
      {/* Day headers */}
      {DAY_LABELS.map((label) => (
        <div
          key={label}
          className="px-2 py-2 text-center text-xs font-semibold uppercase"
          style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--text-secondary)' }}
        >
          {label}
        </div>
      ))}

      {/* Day cells */}
      {dates.map((date) => {
        const key = formatDateKey(date);
        const dayEntries = entriesByDate.get(key) || [];
        const isToday = isSameDay(date, today);

        return (
          <div
            key={key}
            className={cn(
              'min-h-[120px] p-2 flex flex-col',
              isToday && 'ring-2 ring-inset ring-blue-500'
            )}
            style={{ backgroundColor: 'var(--surface-card)' }}
          >
            {/* Date number */}
            <span
              className={cn(
                'text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full',
                isToday
                  ? 'bg-blue-600 text-white'
                  : ''
              )}
              style={isToday ? undefined : { color: 'var(--text-primary)' }}
            >
              {date.getDate()}
            </span>

            {/* Session entries */}
            <div className="flex flex-col gap-1 flex-1 overflow-y-auto">
              {dayEntries.map((entry, idx) => (
                <SessionSlotCard
                  key={`${entry.batchId}-${entry.startTime}-${idx}`}
                  entry={entry}
                  onClick={onSessionClick}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* --------------------------------------------------------------------------
   MonthGrid
   -------------------------------------------------------------------------- */

interface MonthGridProps {
  dates: Date[];
  currentMonth: number;
  entriesByDate: Map<string, CalendarEntry[]>;
  today: Date;
  onSessionClick?: (entry: CalendarEntry) => void;
}

const MonthGrid: React.FC<MonthGridProps> = ({
  dates,
  currentMonth,
  entriesByDate,
  today,
  onSessionClick,
}) => {
  return (
    <div
      className="grid grid-cols-7 gap-px rounded-lg overflow-hidden"
      style={{ backgroundColor: 'var(--border-default)', border: '1px solid var(--border-default)' }}
    >
      {/* Day headers */}
      {DAY_LABELS.map((label) => (
        <div
          key={label}
          className="px-2 py-2 text-center text-xs font-semibold uppercase"
          style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--text-secondary)' }}
        >
          {label}
        </div>
      ))}

      {/* Day cells */}
      {dates.map((date) => {
        const key = formatDateKey(date);
        const dayEntries = entriesByDate.get(key) || [];
        const isToday = isSameDay(date, today);
        const isCurrentMonth = date.getMonth() === currentMonth;

        return (
          <div
            key={key}
            className={cn(
              'min-h-[80px] p-1.5 flex flex-col',
              !isCurrentMonth && 'opacity-40',
              isToday && 'ring-2 ring-inset ring-blue-500'
            )}
            style={{ backgroundColor: 'var(--surface-card)' }}
          >
            {/* Date number */}
            <span
              className={cn(
                'text-xs font-medium mb-0.5 w-6 h-6 flex items-center justify-center rounded-full',
                isToday
                  ? 'bg-blue-600 text-white'
                  : ''
              )}
              style={isToday ? undefined : { color: 'var(--text-primary)' }}
            >
              {date.getDate()}
            </span>

            {/* Session entries (compact for month view) */}
            <div className="flex flex-col gap-0.5 flex-1 overflow-y-auto">
              {dayEntries.slice(0, 2).map((entry, idx) => (
                <SessionSlotCard
                  key={`${entry.batchId}-${entry.startTime}-${idx}`}
                  entry={entry}
                  compact
                  onClick={onSessionClick}
                />
              ))}
              {dayEntries.length > 2 && (
                <span className="text-[10px] text-center" style={{ color: 'var(--text-tertiary)' }}>
                  +{dayEntries.length - 2} more
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CalendarView;
