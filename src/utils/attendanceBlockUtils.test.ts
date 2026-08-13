import { describe, it, expect } from 'vitest';
import { getTodaySessions, getCurrentSession, parseTimeToMinutes } from './attendanceBlockUtils';
import type { CalendarEntry } from '../types';

function makeEntry(overrides: Partial<CalendarEntry> = {}): CalendarEntry {
  return {
    date: '2026-01-15',
    dayOfWeek: 3,
    startTime: '09:00',
    endTime: '10:30',
    batchId: 'batch-1',
    batchName: 'Morning Batch',
    weekNumber: 3,
    focusArea: 'Footwork',
    drills: ['Drill A'],
    attendanceRecorded: false,
    ...overrides,
  };
}

describe('parseTimeToMinutes', () => {
  it('parses "09:00" to 540', () => {
    expect(parseTimeToMinutes('09:00')).toBe(540);
  });

  it('parses "14:30" to 870', () => {
    expect(parseTimeToMinutes('14:30')).toBe(870);
  });

  it('parses "00:00" to 0', () => {
    expect(parseTimeToMinutes('00:00')).toBe(0);
  });

  it('parses "23:59" to 1439', () => {
    expect(parseTimeToMinutes('23:59')).toBe(1439);
  });
});

describe('getTodaySessions', () => {
  it('returns empty array when no entries match today', () => {
    const entries = [makeEntry({ date: '2020-01-01' })];
    const result = getTodaySessions(entries);
    expect(result).toEqual([]);
  });

  it('filters to today only and sorts by startTime', () => {
    const todayStr = formatToday();
    const entries = [
      makeEntry({ date: todayStr, startTime: '14:00', endTime: '15:30', batchName: 'Afternoon' }),
      makeEntry({ date: '2020-05-01', startTime: '08:00', endTime: '09:00' }),
      makeEntry({ date: todayStr, startTime: '09:00', endTime: '10:30', batchName: 'Morning' }),
      makeEntry({ date: todayStr, startTime: '11:00', endTime: '12:00', batchName: 'Midday' }),
    ];

    const result = getTodaySessions(entries);

    expect(result).toHaveLength(3);
    expect(result[0].batchName).toBe('Morning');
    expect(result[1].batchName).toBe('Midday');
    expect(result[2].batchName).toBe('Afternoon');
  });

  it('returns empty array for empty input', () => {
    expect(getTodaySessions([])).toEqual([]);
  });
});

describe('getCurrentSession', () => {
  it('returns null/index -1 for empty sessions', () => {
    const result = getCurrentSession([], new Date());
    expect(result).toEqual({ session: null, index: -1 });
  });

  it('detects an in-progress session', () => {
    const sessions = [
      makeEntry({ startTime: '09:00', endTime: '10:30' }),
      makeEntry({ startTime: '11:00', endTime: '12:30' }),
    ];
    // Set current time to 09:45 (within first session)
    const now = new Date(2026, 0, 15, 9, 45);

    const result = getCurrentSession(sessions, now);

    expect(result.index).toBe(0);
    expect(result.session?.startTime).toBe('09:00');
  });

  it('detects the next upcoming session when none in-progress', () => {
    const sessions = [
      makeEntry({ startTime: '09:00', endTime: '10:30' }),
      makeEntry({ startTime: '14:00', endTime: '15:30' }),
    ];
    // Set current time to 12:00 (between sessions)
    const now = new Date(2026, 0, 15, 12, 0);

    const result = getCurrentSession(sessions, now);

    expect(result.index).toBe(1);
    expect(result.session?.startTime).toBe('14:00');
  });

  it('returns last unrecorded session when all have ended', () => {
    const sessions = [
      makeEntry({ startTime: '09:00', endTime: '10:30', attendanceRecorded: true }),
      makeEntry({ startTime: '11:00', endTime: '12:30', attendanceRecorded: false }),
      makeEntry({ startTime: '14:00', endTime: '15:30', attendanceRecorded: true }),
    ];
    // Set current time to 18:00 (all sessions over)
    const now = new Date(2026, 0, 15, 18, 0);

    const result = getCurrentSession(sessions, now);

    expect(result.index).toBe(1);
    expect(result.session?.startTime).toBe('11:00');
  });

  it('returns null when all sessions ended and all recorded', () => {
    const sessions = [
      makeEntry({ startTime: '09:00', endTime: '10:30', attendanceRecorded: true }),
      makeEntry({ startTime: '11:00', endTime: '12:30', attendanceRecorded: true }),
    ];
    // Set current time to 18:00 (all sessions over)
    const now = new Date(2026, 0, 15, 18, 0);

    const result = getCurrentSession(sessions, now);

    expect(result).toEqual({ session: null, index: -1 });
  });

  it('prefers in-progress over next upcoming', () => {
    const sessions = [
      makeEntry({ startTime: '09:00', endTime: '10:30' }),
      makeEntry({ startTime: '10:00', endTime: '11:30' }),
    ];
    // 10:15 — falls within both sessions, should pick first match
    const now = new Date(2026, 0, 15, 10, 15);

    const result = getCurrentSession(sessions, now);

    expect(result.index).toBe(0);
    expect(result.session?.startTime).toBe('09:00');
  });

  it('returns session at exact startTime boundary', () => {
    const sessions = [makeEntry({ startTime: '09:00', endTime: '10:30' })];
    const now = new Date(2026, 0, 15, 9, 0);

    const result = getCurrentSession(sessions, now);

    expect(result.index).toBe(0);
  });

  it('returns session at exact endTime boundary', () => {
    const sessions = [makeEntry({ startTime: '09:00', endTime: '10:30' })];
    const now = new Date(2026, 0, 15, 10, 30);

    const result = getCurrentSession(sessions, now);

    expect(result.index).toBe(0);
  });
});

/** Helper: returns today's date as YYYY-MM-DD */
function formatToday(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
