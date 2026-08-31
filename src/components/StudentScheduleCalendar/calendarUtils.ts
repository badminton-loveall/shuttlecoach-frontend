import type { CalendarEntry } from '../../types';

export interface GridDay {
  date: string; // ISO date string (YYYY-MM-DD)
  dayNumber: number; // 1-31
  isCurrentMonth: boolean;
}

/**
 * Builds an array of GridDay objects for a given month, including
 * leading days from the previous month and trailing days from the next month
 * so the total length is always a multiple of 7.
 *
 * @param year - Full year (e.g. 2024)
 * @param month - 0-indexed month (0 = January, 11 = December)
 */
export function buildGridDays(year: number, month: number): GridDay[] {
  const days: GridDay[] = [];

  // First day of the current month
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay(); // 0 = Sunday

  // Last day of the current month
  const lastOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastOfMonth.getDate();

  // Leading days from previous month
  if (startWeekday > 0) {
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startWeekday - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const d = new Date(year, month - 1, dayNum);
      days.push({
        date: formatDate(d),
        dayNumber: dayNum,
        isCurrentMonth: false,
      });
    }
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    days.push({
      date: formatDate(d),
      dayNumber: day,
      isCurrentMonth: true,
    });
  }

  // Trailing days from next month
  const remainder = days.length % 7;
  if (remainder > 0) {
    const trailingCount = 7 - remainder;
    for (let day = 1; day <= trailingCount; day++) {
      const d = new Date(year, month + 1, day);
      days.push({
        date: formatDate(d),
        dayNumber: day,
        isCurrentMonth: false,
      });
    }
  }

  return days;
}

/**
 * Groups CalendarEntry records by date string for O(1) lookup.
 */
export function buildEntriesMap(
  entries: CalendarEntry[]
): Map<string, CalendarEntry[]> {
  const map = new Map<string, CalendarEntry[]>();
  for (const entry of entries) {
    const existing = map.get(entry.date);
    if (existing) {
      existing.push(entry);
    } else {
      map.set(entry.date, [entry]);
    }
  }
  return map;
}

/**
 * Returns the first and last date of a given month in YYYY-MM-DD format.
 *
 * @param year - Full year (e.g. 2024)
 * @param month - 0-indexed month (0 = January, 11 = December)
 */
export function getMonthDateRange(
  year: number,
  month: number
): { startDate: string; endDate: string } {
  const monthStr = String(month + 1).padStart(2, '0');
  const startDate = `${year}-${monthStr}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate };
}

/**
 * Returns today's date as an ISO date string (YYYY-MM-DD).
 */
export function getToday(): string {
  return formatDate(new Date());
}

/**
 * Formats a Date object as YYYY-MM-DD.
 */
export function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
