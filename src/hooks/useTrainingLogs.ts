/**
 * useTrainingLogs Hook
 * Manages training log CRUD operations with API backend.
 * Requirements: 31.9, 31.10, 30.1, 30.2
 *
 * - Fetches training logs from API
 * - Creates new training log entries
 */

import { useState, useEffect, useCallback } from 'react';
import type { TrainingLog } from '../types';
import apiClient from '../utils/apiClient';

export interface CreateTrainingLogData {
  studentId: string;
  weekNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  cycleKey: string;
  sessionNotes: string;
  isCompleted: boolean;
  recordedBy: string;
}

export interface TrainingLogFilters {
  studentId?: string;
  cycleKey?: string;
}

/**
 * Parse a training log from API response, ensuring Date fields are proper Date objects.
 */
function parseTrainingLogDates(raw: Record<string, unknown>): TrainingLog {
  return {
    ...raw,
    recordedAt: new Date(raw.recordedAt as string),
  } as TrainingLog;
}

/**
 * Hook providing training log operations with API backend.
 */
export function useTrainingLogs(filters?: TrainingLogFilters) {
  const [logs, setLogs] = useState<TrainingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch training logs from API
   */
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (filters?.studentId) params.append('studentId', filters.studentId);
      if (filters?.cycleKey) params.append('cycleKey', filters.cycleKey);

      const response = await apiClient.get<TrainingLog[]>(`/training-logs?${params.toString()}`);
      
      // Parse date fields
      const parsedLogs = response.data.map((l) =>
        parseTrainingLogDates(l as unknown as Record<string, unknown>)
      );

      setLogs(parsedLogs);
    } catch (err) {
      console.error('Failed to fetch training logs:', err);
      setError('Failed to load training logs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch logs on mount and when filters change
  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  /**
   * Create a new training log entry via API.
   */
  const createLog = useCallback(
    async (data: CreateTrainingLogData): Promise<TrainingLog> => {
      try {
        const response = await apiClient.post<TrainingLog>('/training-logs', data);
        const newLog = parseTrainingLogDates(response.data as unknown as Record<string, unknown>);

        // Refresh the logs list
        await fetchLogs();

        return newLog;
      } catch (err) {
        console.error('Failed to create training log:', err);
        throw err;
      }
    },
    [fetchLogs]
  );

  return {
    logs,
    loading,
    error,
    createLog,
    refetch: fetchLogs,
  };
}
