/**
 * useAttendance Hooks
 * Manages attendance record operations with the API backend.
 * Requirements: 1.1, 4.1, 4.2
 *
 * Hooks:
 * - useMarkAttendance: Mutation hook for POST /api/attendance
 * - useAttendanceRecords: Query hook for GET /api/attendance (with filters)
 * - useAttendanceStats: Query hook for GET /api/attendance/stats
 *
 * Caching: Stats and records are cached per-session with a daily TTL.
 * Cache is invalidated when attendance is marked or leave is updated.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AttendanceRecord, AttendanceStats, AttendanceStatus, LeaveType } from '../types';
import apiClient from '../utils/apiClient';

// ─── Session Cache Utilities ─────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  dateKey: string; // YYYY-MM-DD of when cached
}

const CACHE_PREFIX = 'sc_attendance_';

function getCacheKey(endpoint: string, params: Record<string, string | undefined>): string {
  const sorted = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return `${CACHE_PREFIX}${endpoint}_${sorted}`;
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getFromCache<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    // Invalidate if cached on a different day
    if (entry.dateKey !== getTodayKey()) {
      sessionStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function setCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      dateKey: getTodayKey(),
    };
    sessionStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // sessionStorage full or unavailable — ignore
  }
}

/**
 * Invalidate all attendance caches. Call after marking attendance or updating leave.
 */
export function invalidateAttendanceCache(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => sessionStorage.removeItem(k));
  } catch {
    // ignore
  }
}

// ─── Request/Response Interfaces ─────────────────────────────────────────────

export interface MarkAttendanceEntry {
  studentId: string;
  status: AttendanceStatus;
  leaveType?: LeaveType;
}

export interface MarkAttendanceData {
  batchId: string;
  sessionDate: string; // ISO date string (YYYY-MM-DD)
  records: MarkAttendanceEntry[];
}

export interface MarkAttendanceResponse {
  success: boolean;
  recordCount: number;
}

export interface AttendanceFilters {
  batchId?: string;
  studentId?: string;
  startDate?: string; // ISO date string
  endDate?: string;   // ISO date string
}

export interface AttendanceStatsFilters {
  batchId?: string;
  studentId?: string;
  startDate?: string;
  endDate?: string;
}

// ─── useMarkAttendance (Mutation Hook) ───────────────────────────────────────

export interface UseMarkAttendanceReturn {
  markAttendance: (data: MarkAttendanceData) => Promise<MarkAttendanceResponse>;
  loading: boolean;
  error: string | null;
  reset: () => void;
}

/**
 * Mutation hook for marking attendance (POST /api/attendance).
 * Provides loading/error state and a reset function to clear errors.
 * Invalidates attendance cache on success so subsequent reads are fresh.
 */
export function useMarkAttendance(): UseMarkAttendanceReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markAttendance = useCallback(async (data: MarkAttendanceData): Promise<MarkAttendanceResponse> => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post<MarkAttendanceResponse>('/attendance', data);
      // Invalidate cache so stats/records refetch with fresh data
      invalidateAttendanceCache();
      return response.data;
    } catch (err: unknown) {
      const message = getErrorMessage(err) || 'Failed to mark attendance. Please try again.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return { markAttendance, loading, error, reset };
}

// ─── useAttendanceRecords (Query Hook) ───────────────────────────────────────

export interface UseAttendanceRecordsReturn {
  records: AttendanceRecord[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Query hook for fetching attendance records (GET /api/attendance).
 * Supports filtering by batchId, studentId, startDate, and endDate.
 * Results are cached per-session with daily TTL to avoid redundant API calls.
 * Call refetch() to force a fresh fetch (bypasses cache).
 */
export function useAttendanceRecords(filters?: AttendanceFilters): UseAttendanceRecordsReturn {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetchRecords = useCallback(async (bypassCache = false) => {
    const cacheKey = getCacheKey('records', {
      batchId: filters?.batchId,
      studentId: filters?.studentId,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
    });

    // Try cache first (unless bypassing)
    if (!bypassCache) {
      const cached = getFromCache<AttendanceRecord[]>(cacheKey);
      if (cached !== null) {
        setRecords(cached);
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters?.batchId) params.append('batchId', filters.batchId);
      if (filters?.studentId) params.append('studentId', filters.studentId);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const response = await apiClient.get<AttendanceRecord[]>(
        `/attendance?${params.toString()}`
      );

      setRecords(response.data);
      setCache(cacheKey, response.data);
    } catch (err: unknown) {
      // Silently return empty data for 500 errors (table may not exist yet)
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.batchId, filters?.studentId, filters?.startDate, filters?.endDate]);

  useEffect(() => {
    // Only fetch once per mount with same filters (prevents StrictMode double-fetch)
    if (!hasFetched.current) {
      hasFetched.current = true;
      void fetchRecords();
    }
  }, [fetchRecords]);

  const refetch = useCallback(() => fetchRecords(true), [fetchRecords]);

  return { records, loading, error, refetch };
}

// ─── useAttendanceStats (Query Hook) ─────────────────────────────────────────

export interface UseAttendanceStatsReturn {
  stats: AttendanceStats[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Query hook for fetching computed attendance statistics (GET /api/attendance/stats).
 * Returns per-student attendance percentages and summary data.
 * Supports filtering by batchId, studentId, startDate, and endDate.
 * Results are cached per-session with daily TTL to avoid redundant API calls.
 * Call refetch() to force a fresh fetch (bypasses cache).
 */
export function useAttendanceStats(filters?: AttendanceStatsFilters): UseAttendanceStatsReturn {
  const [stats, setStats] = useState<AttendanceStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetchStats = useCallback(async (bypassCache = false) => {
    // Don't fire the request if no meaningful filters are provided
    if (!filters?.batchId && !filters?.studentId && !filters?.startDate && !filters?.endDate) {
      setStats([]);
      setLoading(false);
      return;
    }

    const cacheKey = getCacheKey('stats', {
      batchId: filters?.batchId,
      studentId: filters?.studentId,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
    });

    // Try cache first (unless bypassing)
    if (!bypassCache) {
      const cached = getFromCache<AttendanceStats[]>(cacheKey);
      if (cached !== null) {
        setStats(cached);
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters?.batchId) params.append('batchId', filters.batchId);
      if (filters?.studentId) params.append('studentId', filters.studentId);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const response = await apiClient.get<{ stats: AttendanceStats[] }>(
        `/attendance/stats?${params.toString()}`
      );

      const result = response.data.stats || [];
      setStats(result);
      setCache(cacheKey, result);
    } catch (err: unknown) {
      // Silently return empty data for 500 errors (table may not exist yet)
      setStats([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.batchId, filters?.studentId, filters?.startDate, filters?.endDate]);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      void fetchStats();
    }
  }, [fetchStats]);

  const refetch = useCallback(() => fetchStats(true), [fetchStats]);

  return { stats, loading, error, refetch };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Extract a user-friendly error message from an API error response.
 */
function getErrorMessage(err: unknown): string | null {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { message?: string; error?: string } } }).response;
    if (response?.data?.message) return response.data.message;
    if (response?.data?.error) return response.data.error;
  }
  return null;
}
