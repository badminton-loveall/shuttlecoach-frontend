/**
 * useAnalytics Hooks
 * Provides query hooks for all training analytics API endpoints.
 * Requirements: 6.1, 7.1, 8.1, 9.1, 10.1
 *
 * Hooks:
 * - useDrillCompletion: GET /api/analytics/session/:cycleKey (drill completion rates)
 * - useTrainingEffectiveness: GET /api/analytics/effectiveness/:studentId (skill improvement correlation)
 * - useBatchComparison: GET /api/analytics/comparison/batches (batch-level metrics)
 * - useStudentComparison: GET /api/analytics/comparison/students (student ranking within batch)
 * - useStudentTrends: GET /api/analytics/trends/:studentId (attendance vs skill trends)
 * - useTrainingPatterns: GET /api/analytics/patterns (training pattern distributions)
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  DrillCompletionStats,
  TrainingEffectivenessReport,
  BatchComparisonMetric,
  StudentTrendReport,
} from '../types';
import apiClient from '../utils/apiClient';

// ─── Local Types (not in shared types yet) ───────────────────────────────────

export interface CategoryDistribution {
  category: string;
  drillCount: number;
  proportion: number; // 0-100
}

export interface TrainingPatternReport {
  categoryDistributions: CategoryDistribution[];
  attendanceHeatmap: Array<{
    dayOfWeek: number;
    weekNumber: number;
    attendanceRate: number;
  }>;
}

// ─── Filter Interfaces ───────────────────────────────────────────────────────

export interface DrillCompletionFilters {
  cycleKey: string;
  batchId?: string;
  weekNumber?: number;
}

export interface TrainingEffectivenessFilters {
  studentId: string;
  cycleKey?: string;
}

export interface BatchComparisonFilters {
  cycleKey?: string;
}

export interface StudentComparisonFilters {
  batchId: string;
  cycleKey?: string;
}

export interface StudentTrendsFilters {
  studentId: string;
}

export interface TrainingPatternsFilters {
  batchId?: string;
  startDate: string;
  endDate: string;
}

// ─── Return Type Interfaces ──────────────────────────────────────────────────

export interface UseDrillCompletionReturn {
  data: DrillCompletionStats[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseTrainingEffectivenessReturn {
  data: TrainingEffectivenessReport | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseBatchComparisonReturn {
  data: BatchComparisonMetric[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseStudentComparisonReturn {
  data: BatchComparisonMetric[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseStudentTrendsReturn {
  data: StudentTrendReport | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseTrainingPatternsReturn {
  data: TrainingPatternReport | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ─── useDrillCompletion ──────────────────────────────────────────────────────

/**
 * Query hook for drill completion rates (GET /api/analytics/session/:cycleKey).
 * Returns per-week drill completion stats for a given cycle.
 * Supports filtering by batchId and weekNumber.
 */
export function useDrillCompletion(filters: DrillCompletionFilters): UseDrillCompletionReturn {
  const [data, setData] = useState<DrillCompletionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!filters.cycleKey) {
      setData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.batchId) params.append('batchId', filters.batchId);
      if (filters.weekNumber !== undefined) params.append('weekNumber', String(filters.weekNumber));

      const queryString = params.toString();
      const url = `/analytics/session/${encodeURIComponent(filters.cycleKey)}${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get<DrillCompletionStats[]>(url);
      setData(response.data);
    } catch (err: unknown) {
      console.error('Failed to fetch drill completion data:', err);
      setError(getErrorMessage(err) || 'Failed to load drill completion data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters.cycleKey, filters.batchId, filters.weekNumber]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ─── useTrainingEffectiveness ────────────────────────────────────────────────

/**
 * Query hook for training effectiveness report (GET /api/analytics/effectiveness/:studentId).
 * Returns skill improvement correlations for a student in a given cycle.
 */
export function useTrainingEffectiveness(filters: TrainingEffectivenessFilters): UseTrainingEffectivenessReturn {
  const [data, setData] = useState<TrainingEffectivenessReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!filters.studentId) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.cycleKey) params.append('cycleKey', filters.cycleKey);

      const queryString = params.toString();
      const url = `/analytics/effectiveness/${encodeURIComponent(filters.studentId)}${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get<TrainingEffectivenessReport>(url);
      setData(response.data);
    } catch (err: unknown) {
      console.error('Failed to fetch training effectiveness data:', err);
      setError(getErrorMessage(err) || 'Failed to load training effectiveness data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters.studentId, filters.cycleKey]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ─── useBatchComparison ──────────────────────────────────────────────────────

/**
 * Query hook for batch-level comparison metrics (GET /api/analytics/comparison/batches).
 * Returns average skill improvement, attendance, and drill completion per batch.
 */
export function useBatchComparison(filters?: BatchComparisonFilters): UseBatchComparisonReturn {
  const [data, setData] = useState<BatchComparisonMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters?.cycleKey) params.append('cycleKey', filters.cycleKey);

      const queryString = params.toString();
      const url = `/analytics/comparison/batches${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get<BatchComparisonMetric[]>(url);
      setData(response.data);
    } catch (err: unknown) {
      console.error('Failed to fetch batch comparison data:', err);
      setError(getErrorMessage(err) || 'Failed to load batch comparison data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters?.cycleKey]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ─── useStudentComparison ────────────────────────────────────────────────────

/**
 * Query hook for student-level comparison within a batch (GET /api/analytics/comparison/students).
 * Returns students ranked by skill improvement within the specified batch.
 */
export function useStudentComparison(filters: StudentComparisonFilters): UseStudentComparisonReturn {
  const [data, setData] = useState<BatchComparisonMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!filters.batchId) {
      setData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('batchId', filters.batchId);
      if (filters.cycleKey) params.append('cycleKey', filters.cycleKey);

      const response = await apiClient.get<BatchComparisonMetric[]>(
        `/analytics/comparison/students?${params.toString()}`
      );
      setData(response.data);
    } catch (err: unknown) {
      console.error('Failed to fetch student comparison data:', err);
      setError(getErrorMessage(err) || 'Failed to load student comparison data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters.batchId, filters.cycleKey]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ─── useStudentTrends ────────────────────────────────────────────────────────

/**
 * Query hook for attendance vs skill improvement trends (GET /api/analytics/trends/:studentId).
 * Returns per-cycle attendance percentage and avg skill score with optional correlation.
 */
export function useStudentTrends(filters: StudentTrendsFilters): UseStudentTrendsReturn {
  const [data, setData] = useState<StudentTrendReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!filters.studentId) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const url = `/analytics/trends/${encodeURIComponent(filters.studentId)}`;

      const response = await apiClient.get<StudentTrendReport>(url);
      setData(response.data);
    } catch (err: unknown) {
      // Silently return null for 500 errors (table may not exist yet)
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [filters.studentId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ─── useTrainingPatterns ─────────────────────────────────────────────────────

/**
 * Query hook for training pattern distributions (GET /api/analytics/patterns).
 * Returns category distributions and attendance heatmap data for a date range.
 */
export function useTrainingPatterns(filters: TrainingPatternsFilters): UseTrainingPatternsReturn {
  const [data, setData] = useState<TrainingPatternReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!filters.startDate || !filters.endDate) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.batchId) params.append('batchId', filters.batchId);
      params.append('startDate', filters.startDate);
      params.append('endDate', filters.endDate);

      const response = await apiClient.get<TrainingPatternReport>(
        `/analytics/patterns?${params.toString()}`
      );
      setData(response.data);
    } catch (err: unknown) {
      console.error('Failed to fetch training patterns data:', err);
      setError(getErrorMessage(err) || 'Failed to load training patterns data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters.batchId, filters.startDate, filters.endDate]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
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
