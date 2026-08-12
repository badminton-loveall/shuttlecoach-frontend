/**
 * useSessionSchedule Hook
 * Manages session schedule, calendar, and session notes operations with API backend.
 * Requirements: 14.1, 15.1, 17.1
 *
 * - Fetches session schedule for a batch
 * - Creates/updates session schedules (HEAD_COACH only)
 * - Fetches calendar entries with mapped curriculum drills
 * - Creates/updates and fetches session notes
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  SessionSchedule,
  CalendarEntry,
  SessionNote,
  SessionSlot,
  RecurrencePattern,
} from '../types';
import apiClient from '../utils/apiClient';

/* --------------------------------------------------------------------------
   Request/Response types
   -------------------------------------------------------------------------- */

export interface CreateSessionScheduleData {
  batchId: string;
  slots: SessionSlot[];
  recurrence: RecurrencePattern;
  cycleStartDate?: string;
}

export interface SessionCalendarFilters {
  startDate: string;
  endDate: string;
  batchId?: string;
}

export interface SessionNoteFilters {
  batchId: string;
  date?: string;
}

export interface CreateSessionNoteData {
  batchId: string;
  sessionDate: string;
  noteText: string;
}

/* --------------------------------------------------------------------------
   useSessionSchedule - GET /api/session-schedules/:batchId
   -------------------------------------------------------------------------- */

/**
 * Hook to fetch the structured session schedule for a batch.
 */
export function useSessionSchedule(batchId?: string) {
  const [schedule, setSchedule] = useState<SessionSchedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = useCallback(async () => {
    if (!batchId) {
      setSchedule(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<SessionSchedule>(
        `/session-schedules/${batchId}`
      );
      setSchedule(response.data);
    } catch {
      setError('Failed to load session schedule. Please try again.');
      setSchedule(null);
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    void fetchSchedule();
  }, [fetchSchedule]);

  return {
    schedule,
    loading,
    error,
    refetch: fetchSchedule,
  };
}

/* --------------------------------------------------------------------------
   useCreateSessionSchedule - POST /api/session-schedules
   -------------------------------------------------------------------------- */

/**
 * Hook to create or update a session schedule for a batch (HEAD_COACH only).
 */
export function useCreateSessionSchedule() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSchedule = useCallback(
    async (data: CreateSessionScheduleData): Promise<SessionSchedule> => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.post<SessionSchedule>(
          '/session-schedules',
          data
        );
        return response.data;
      } catch (err) {
        const message = 'Failed to save session schedule. Please try again.';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    createSchedule,
    loading,
    error,
  };
}

/* --------------------------------------------------------------------------
   useSessionCalendar - GET /api/session-calendar
   -------------------------------------------------------------------------- */

/**
 * Template-based session returned from the API when a batch has an assigned template.
 * Now includes curriculum drill data populated by the backend.
 * Requirements: 8.1, 8.3
 */
export interface TemplateSession {
  date: string;        // YYYY-MM-DD
  day_of_week: string; // Mon, Tue, Wed, Thu, Fri, Sat, Sun
  start_time: string;  // HH:MM
  duration_hours: number;
  batchId?: string;
  batchName?: string;
  weekNumber?: number;
  focusArea?: string;
  drills?: string[];
}

/** API response shape for GET /api/session-calendar (includes curriculum drill data) */
interface SessionCalendarResponse {
  entries: CalendarEntry[];
  sessions?: TemplateSession[];
}

/**
 * Map day_of_week string abbreviation to numeric DayOfWeek (0=Sun, 1=Mon, ... 6=Sat).
 */
const DAY_NAME_TO_NUMBER: Record<string, CalendarEntry['dayOfWeek']> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/**
 * Compute an end time string (HH:MM) from a start time and duration in hours.
 */
function computeEndTime(startTime: string, durationHours: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const endHours = hours + durationHours;
  // Clamp to 23:59 if duration overflows midnight (edge case)
  if (endHours >= 24) {
    return '23:59';
  }
  return `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Convert a TemplateSession into a CalendarEntry-compatible object.
 * Template sessions now include curriculum drill data from the API.
 * Requirement 8.4: batches without templates produce no sessions
 * (handled by API returning empty array).
 */
function templateSessionToCalendarEntry(session: TemplateSession): CalendarEntry {
  return {
    date: session.date,
    dayOfWeek: DAY_NAME_TO_NUMBER[session.day_of_week] ?? 0,
    startTime: session.start_time,
    endTime: computeEndTime(session.start_time, session.duration_hours),
    batchId: session.batchId || '',
    batchName: session.batchName || 'Template Session',
    weekNumber: session.weekNumber || 0,
    focusArea: session.focusArea || '',
    drills: extractCurriculumDrills(session),
    attendanceRecorded: false,
  };
}

/**
 * Extract curriculum drill names from a template session.
 * The API populates drills from the assigned curriculum plan.
 */
function extractCurriculumDrills(session: TemplateSession): string[] {
  const curriculumDrills = session.drills || [];
  return curriculumDrills;
}

/**
 * Hook to fetch calendar entries with mapped curriculum drills for a date range.
 * Merges both legacy entries and template-based sessions into a unified CalendarEntry array.
 * Results are cached per-session with daily TTL to avoid redundant API calls.
 * Call refetch() to force a fresh fetch (bypasses cache).
 *
 * Requirements: 8.1, 8.3, 8.4
 */
export function useSessionCalendar(filters?: SessionCalendarFilters) {
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCalendar = useCallback(async (bypassCache = false) => {
    if (!filters?.startDate || !filters?.endDate) {
      setEntries([]);
      setLoading(false);
      return;
    }

    const cacheKey = `sc_session_calendar_${filters.startDate}_${filters.endDate}_${filters.batchId || ''}`;

    // Try cache first (unless bypassing)
    if (!bypassCache) {
      try {
        const raw = sessionStorage.getItem(cacheKey);
        if (raw) {
          const cached = JSON.parse(raw);
          if (cached.dateKey === new Date().toISOString().slice(0, 10)) {
            setEntries(cached.data);
            setLoading(false);
            return;
          }
          sessionStorage.removeItem(cacheKey);
        }
      } catch { /* ignore */ }
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('startDate', filters.startDate);
      params.append('endDate', filters.endDate);
      if (filters.batchId) params.append('batchId', filters.batchId);

      const response = await apiClient.get<SessionCalendarResponse>(
        `/session-calendar?${params.toString()}`
      );

      // Legacy entries from schedule-based batches
      const legacyEntries: CalendarEntry[] = response.data.entries || [];

      // Template-based sessions (Req 8.1, 8.3) — convert to CalendarEntry format
      const templateSessions: CalendarEntry[] = (response.data.sessions || []).map(
        templateSessionToCalendarEntry
      );

      // Merge both sources and sort by date then start time
      const merged = [...legacyEntries, ...templateSessions].sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.startTime.localeCompare(b.startTime);
      });

      setEntries(merged);

      // Cache the merged result
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: merged,
          dateKey: new Date().toISOString().slice(0, 10),
          timestamp: Date.now(),
        }));
      } catch { /* ignore */ }
    } catch {
      // Silently return empty data for errors (table may not exist or server issues)
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.startDate, filters?.endDate, filters?.batchId]);

  useEffect(() => {
    void fetchCalendar();
  }, [fetchCalendar]);

  const refetch = useCallback(() => fetchCalendar(true), [fetchCalendar]);

  return {
    entries,
    loading,
    error,
    refetch,
  };
}

/* --------------------------------------------------------------------------
   useSessionNotes - GET /api/session-notes/:batchId
   -------------------------------------------------------------------------- */

/**
 * Hook to fetch session notes for a batch, with optional date filter.
 */
export function useSessionNotes(filters?: SessionNoteFilters) {
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    if (!filters?.batchId) {
      setNotes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.date) params.append('date', filters.date);

      const queryStr = params.toString();
      const url = `/session-notes/${filters.batchId}${queryStr ? `?${queryStr}` : ''}`;

      const response = await apiClient.get<SessionNote[]>(url);
      setNotes(response.data);
    } catch {
      setError('Failed to load session notes. Please try again.');
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.batchId, filters?.date]);

  useEffect(() => {
    void fetchNotes();
  }, [fetchNotes]);

  return {
    notes,
    loading,
    error,
    refetch: fetchNotes,
  };
}

/* --------------------------------------------------------------------------
   useCreateSessionNote - POST /api/session-notes
   -------------------------------------------------------------------------- */

/**
 * Hook to create or update a coach note for a specific batch and session date.
 */
export function useCreateSessionNote() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createNote = useCallback(
    async (data: CreateSessionNoteData): Promise<SessionNote> => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.post<SessionNote>(
          '/session-notes',
          data
        );
        return response.data;
      } catch (err) {
        const message = 'Failed to save session note. Please try again.';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    createNote,
    loading,
    error,
  };
}
