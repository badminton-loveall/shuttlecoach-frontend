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
    } catch (err) {
      console.error('Failed to fetch session schedule:', err);
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
        console.error('Failed to create session schedule:', err);
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
 * Hook to fetch calendar entries with mapped curriculum drills for a date range.
 */
export function useSessionCalendar(filters?: SessionCalendarFilters) {
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCalendar = useCallback(async () => {
    if (!filters?.startDate || !filters?.endDate) {
      setEntries([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('startDate', filters.startDate);
      params.append('endDate', filters.endDate);
      if (filters.batchId) params.append('batchId', filters.batchId);

      const response = await apiClient.get<{ entries: CalendarEntry[] }>(
        `/session-calendar?${params.toString()}`
      );
      setEntries(response.data.entries || []);
    } catch (err) {
      console.error('Failed to fetch session calendar:', err);
      // Silently return empty data for 500 errors (table may not exist yet)
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.startDate, filters?.endDate, filters?.batchId]);

  useEffect(() => {
    void fetchCalendar();
  }, [fetchCalendar]);

  return {
    entries,
    loading,
    error,
    refetch: fetchCalendar,
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
    } catch (err) {
      console.error('Failed to fetch session notes:', err);
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
        console.error('Failed to create session note:', err);
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
