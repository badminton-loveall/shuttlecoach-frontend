/**
 * Attendance Block Utilities
 * Functions for session filtering and current session detection
 * used by the DashboardAttendanceBlock component.
 */

import type { CalendarEntry } from '../types';

/**
 * Filters calendar entries to only today's sessions, sorted chronologically by start time.
 *
 * @param entries - Full list of calendar entries (may span multiple days)
 * @returns Today's entries sorted by startTime ascending
 */
export function getTodaySessions(entries: CalendarEntry[]): CalendarEntry[] {
  const today = new Date();
  const todayStr = formatDateString(today);

  return entries
    .filter((entry) => entry.date === todayStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/**
 * Determines the current/relevant session from today's sorted sessions.
 *
 * Algorithm:
 * 1. Find an in-progress session (startTime <= now <= endTime) → return it
 * 2. If none in-progress, find the next upcoming session (startTime > now) → return it
 * 3. If all ended, find the last session with attendanceRecorded === false → return it
 * 4. If all recorded, return { session: null, index: -1 }
 *
 * @param todaySessions - Today's sessions, pre-filtered and sorted by startTime
 * @param now - Current date/time for comparison
 * @returns The detected session and its index, or null/-1 if none applicable
 */
export function getCurrentSession(
  todaySessions: CalendarEntry[],
  now: Date
): { session: CalendarEntry | null; index: number } {
  if (todaySessions.length === 0) {
    return { session: null, index: -1 };
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Step 1: Find in-progress session
  for (let i = 0; i < todaySessions.length; i++) {
    const session = todaySessions[i];
    const startMinutes = parseTimeToMinutes(session.startTime);
    const endMinutes = parseTimeToMinutes(session.endTime);

    if (startMinutes <= currentMinutes && currentMinutes <= endMinutes) {
      return { session, index: i };
    }
  }

  // Step 2: Find next upcoming session
  for (let i = 0; i < todaySessions.length; i++) {
    const session = todaySessions[i];
    const startMinutes = parseTimeToMinutes(session.startTime);

    if (startMinutes > currentMinutes) {
      return { session, index: i };
    }
  }

  // Step 3: All sessions ended — find last unrecorded session
  for (let i = todaySessions.length - 1; i >= 0; i--) {
    const session = todaySessions[i];
    if (!session.attendanceRecorded) {
      return { session, index: i };
    }
  }

  // Step 4: All sessions recorded
  return { session: null, index: -1 };
}

/**
 * Parses a time string (HH:MM) into total minutes since midnight.
 * @param time - Time string in "HH:MM" format
 * @returns Total minutes since midnight
 */
export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Formats a Date into an ISO date string (YYYY-MM-DD) using local time.
 * @param date - Date to format
 * @returns Date string in "YYYY-MM-DD" format
 */
function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
