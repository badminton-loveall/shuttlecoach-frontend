/**
 * useDrills Hook
 * Fetches drills from the backend API (GET /api/drills).
 * Replaces static drills.json import in DrillLibrary.
 * Requirements: 2.1, 2.2
 */

import { useState, useEffect, useCallback } from 'react';
import type { Drill } from '../types';
import apiClient from '../utils/apiClient';

export interface UseDrillsOptions {
  /** Optional category filter passed as query param */
  category?: string;
  /** Optional search query passed as query param */
  search?: string;
  /** Change this value to trigger a refetch */
  refreshTrigger?: number;
  /** When true, each drill is annotated with isAssignable based on whether
   *  its pack (if any) is currently enabled for this center. Used only by
   *  assignment pickers — does not filter which drills are returned. */
  annotatePackStatus?: boolean;
}

export interface UseDrillsReturn {
  drills: Drill[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook that fetches drills from GET /api/drills.
 * Supports optional category and search filters, plus a refreshTrigger for external refetch.
 */
export function useDrills(options?: UseDrillsOptions): UseDrillsReturn {
  const [drills, setDrills] = useState<Drill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDrills = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string> = {};
      if (options?.category) params.category = options.category;
      if (options?.search) params.search = options.search;
      if (options?.annotatePackStatus) params.annotatePackStatus = 'true';

      const response = await apiClient.get('/drills', { params });
      setDrills(response.data.drills);
    } catch {
      setError('Failed to load drills. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [options?.category, options?.search, options?.annotatePackStatus]);

  useEffect(() => {
    void fetchDrills();
  }, [fetchDrills, options?.refreshTrigger]);

  return {
    drills,
    loading,
    error,
    refetch: fetchDrills,
  };
}
