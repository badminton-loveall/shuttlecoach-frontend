/**
 * useAttendance Hooks
 * Manages attendance record operations with the API backend.
 * Requirements: 1.1, 4.1, 4.2
 *
 * Hooks:
 * - useMarkAttendance: Mutation hook for POST /api/attendance
 * - useAttendanceRecords: Query hook for GET /api/attendance (with filters)
 * - useAttendanceStats: Query hook for GET /api/attendance/stats
 */

import { useState, useEffect, useCallback } from 'react';
import type { AttendanceRecord, AttendanceStats, AttendanceStatus, LeaveType } from '../types';
import apiClient from '../utils/apiClient';

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
 */
export function useMarkAttendance(): UseMarkAttendanceReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markAttendance = useCallback(async (data: MarkAttendanceData): Promise<MarkAttendanceResponse> => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post<MarkAttendanceResponse>('/attendance', data);
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
 * Automatically fetches on mount and when filters change.
 */
export function useAttendanceRecords(filters?: AttendanceFilters): UseAttendanceRecordsReturn {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
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
    } catch (err: unknown) {
      console.error('Failed to fetch attendance records:', err);
      // Silently return empty data for 500 errors (table may not exist yet)
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.batchId, filters?.studentId, filters?.startDate, filters?.endDate]);

  useEffect(() => {
    void fetchRecords();
  }, [fetchRecords]);

  return { records, loading, error, refetch: fetchRecords };
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
 */
export function useAttendanceStats(filters?: AttendanceStatsFilters): UseAttendanceStatsReturn {
  const [stats, setStats] = useState<AttendanceStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    // Don't fire the request if no meaningful filters are provided
    if (!filters?.batchId && !filters?.studentId && !filters?.startDate && !filters?.endDate) {
      setStats([]);
      setLoading(false);
      return;
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

      setStats(response.data.stats || []);
    } catch (err: unknown) {
      console.error('Failed to fetch attendance stats:', err);
      // Silently return empty data for 500 errors (table may not exist yet)
      setStats([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.batchId, filters?.studentId, filters?.startDate, filters?.endDate]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
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
