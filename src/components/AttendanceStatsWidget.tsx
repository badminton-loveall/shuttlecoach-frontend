/**
 * AttendanceStatsWidget Component
 * A compact dashboard card showing today's attendance summary and a 7-day trend indicator.
 *
 * Requirements: 5.1, 5.2, 5.3
 *
 * Displays:
 * - Total students expected today
 * - Total present, absent counts
 * - Overall attendance rate for the current day
 * - A 7-day trend as compact visual bars
 */

import React, { useMemo } from 'react';
import type { AttendanceRecord, AttendanceStats } from '../types';

export interface AttendanceStatsWidgetProps {
  /** Per-student attendance stats for the current period */
  stats: AttendanceStats[];
  /** Attendance records for the last 7 days (used for trend) */
  recentRecords: AttendanceRecord[];
  /** Whether data is currently loading */
  loading?: boolean;
  /** Error message if data fetch failed */
  error?: string | null;
}

/**
 * Compute today's summary from stats array.
 */
function computeTodaySummary(stats: AttendanceStats[]) {
  const totalExpected = stats.reduce((sum, s) => sum + s.totalSessions, 0);
  const totalPresent = stats.reduce((sum, s) => sum + s.attended, 0);
  const totalLate = stats.reduce((sum, s) => sum + s.late, 0);
  const totalAbsent = stats.reduce((sum, s) => sum + s.absent, 0);
  const rate = totalExpected > 0
    ? Math.round(((totalPresent + totalLate) / totalExpected) * 100)
    : 0;

  return { totalExpected, totalPresent, totalLate, totalAbsent, rate };
}

/**
 * Compute 7-day trend data from recent attendance records.
 * Returns an array of 7 items (oldest to newest), each with a rate (0-100).
 */
function compute7DayTrend(records: AttendanceRecord[]): Array<{ date: string; rate: number }> {
  const today = new Date();
  const days: Array<{ date: string; rate: number }> = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);

    const dayRecords = records.filter((r) => r.sessionDate === dateStr);
    const total = dayRecords.length;
    const attended = dayRecords.filter(
      (r) => r.status === 'PRESENT' || r.status === 'LATE'
    ).length;
    const rate = total > 0 ? Math.round((attended / total) * 100) : -1; // -1 = no data

    days.push({ date: dateStr, rate });
  }

  return days;
}

/**
 * Get color class for the rate badge.
 */
function getRateColorClass(rate: number): string {
  if (rate >= 90) return 'text-green-700 bg-green-100';
  if (rate >= 75) return 'text-blue-700 bg-blue-100';
  if (rate >= 50) return 'text-yellow-700 bg-yellow-100';
  return 'text-red-700 bg-red-100';
}

/**
 * Get bar color class for trend bar based on rate.
 */
function getTrendBarColor(rate: number): string {
  if (rate >= 90) return 'bg-green-500';
  if (rate >= 75) return 'bg-blue-500';
  if (rate >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
}

/**
 * Format short day name for trend display.
 */
function getShortDay(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'narrow' });
}

export const AttendanceStatsWidget: React.FC<AttendanceStatsWidgetProps> = ({
  stats,
  recentRecords,
  loading = false,
  error = null,
}) => {
  const summary = useMemo(() => computeTodaySummary(stats), [stats]);
  const trend = useMemo(() => compute7DayTrend(recentRecords), [recentRecords]);

  // Loading state
  if (loading) {
    return (
      <div className="rounded-lg" style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading attendance data...</p>
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

  return (
    <div className="rounded-lg" style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', boxShadow: 'var(--shadow-card)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">
          Attendance Today
        </h3>
        {summary.totalExpected > 0 && (
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${getRateColorClass(summary.rate)}`}
          >
            {summary.rate}%
          </span>
        )}
      </div>

      {/* Summary Stats */}
      {summary.totalExpected === 0 ? (
        <p className="text-sm text-gray-500 mb-4">
          No attendance data for today yet.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Present */}
          <div className="text-center">
            <p className="text-xl font-bold text-green-600">
              {summary.totalPresent + summary.totalLate}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Present</p>
          </div>
          {/* Absent */}
          <div className="text-center">
            <p className="text-xl font-bold text-red-600">
              {summary.totalAbsent}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Absent</p>
          </div>
          {/* Total Expected */}
          <div className="text-center">
            <p className="text-xl font-bold text-gray-700">
              {summary.totalExpected}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Expected</p>
          </div>
        </div>
      )}

      {/* 7-Day Trend */}
      <div>
        <p className="text-xs uppercase tracking-wide font-medium text-gray-500 mb-2">
          7-Day Trend
        </p>
        <div className="flex items-end gap-1.5 h-10">
          {trend.map((day) => (
            <div
              key={day.date}
              className="flex flex-col items-center flex-1"
              title={
                day.rate >= 0
                  ? `${getShortDay(day.date)}: ${day.rate}%`
                  : `${getShortDay(day.date)}: No data`
              }
            >
              {/* Bar */}
              <div className="w-full flex items-end justify-center h-7">
                {day.rate >= 0 ? (
                  <div
                    className={`w-full max-w-[12px] rounded-sm ${getTrendBarColor(day.rate)}`}
                    style={{ height: `${Math.max(day.rate * 0.28, 2)}px` }}
                  />
                ) : (
                  <div className="w-full max-w-[12px] h-[2px] rounded-sm" style={{ backgroundColor: 'var(--border-default)' }} />
                )}
              </div>
              {/* Day label */}
              <span className="text-[9px] text-gray-400 mt-0.5 leading-none">
                {getShortDay(day.date)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AttendanceStatsWidget;
