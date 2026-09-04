/**
 * useAdminDrills Hook
 * CRUD operations for admin global drill management (GET/POST/PATCH/DELETE /api/admin/drills).
 * Requirements: 3.1, 3.6, 3.7
 */

import { useState, useEffect, useCallback } from 'react';
import type { Drill } from '../types';
import type { Sport } from '../constants/sports';
import apiClient from '../utils/apiClient';

export interface UseAdminDrillsOptions {
  /** Filter by sport */
  sport?: Sport;
  /** Filter by category */
  category?: string;
  /** Search by drill name */
  search?: string;
}

export interface CreateDrillPayload {
  name: string;
  description: string;
  category: string;
  sport: Sport;
  videoUrl?: string;
}

export type UpdateDrillPayload = Partial<CreateDrillPayload>;

export interface UseAdminDrillsReturn {
  drills: Drill[];
  loading: boolean;
  error: string | null;
  createDrill: (payload: CreateDrillPayload) => Promise<void>;
  updateDrill: (id: string, payload: UpdateDrillPayload) => Promise<void>;
  archiveDrill: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook that provides CRUD operations for admin global drills.
 * Supports filtering by sport, category, and search query.
 */
export function useAdminDrills(options?: UseAdminDrillsOptions): UseAdminDrillsReturn {
  const [drills, setDrills] = useState<Drill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDrills = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string> = {};
      if (options?.sport) params.sport = options.sport;
      if (options?.category) params.category = options.category;
      if (options?.search) params.search = options.search;

      const response = await apiClient.get('/admin/drills', { params });
      setDrills(response.data.drills);
    } catch {
      setError('Failed to load drills. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [options?.sport, options?.category, options?.search]);

  useEffect(() => {
    void fetchDrills();
  }, [fetchDrills]);

  const createDrill = useCallback(async (payload: CreateDrillPayload) => {
    try {
      setError(null);
      await apiClient.post('/admin/drills', payload);
      await fetchDrills();
    } catch {
      setError('Failed to create drill. Please try again.');
      throw new Error('Failed to create drill');
    }
  }, [fetchDrills]);

  const updateDrill = useCallback(async (id: string, payload: UpdateDrillPayload) => {
    try {
      setError(null);
      await apiClient.patch(`/admin/drills/${id}`, payload);
      await fetchDrills();
    } catch {
      setError('Failed to update drill. Please try again.');
      throw new Error('Failed to update drill');
    }
  }, [fetchDrills]);

  const archiveDrill = useCallback(async (id: string) => {
    try {
      setError(null);
      await apiClient.delete(`/admin/drills/${id}`);
      await fetchDrills();
    } catch {
      setError('Failed to archive drill. Please try again.');
      throw new Error('Failed to archive drill');
    }
  }, [fetchDrills]);

  return {
    drills,
    loading,
    error,
    createDrill,
    updateDrill,
    archiveDrill,
    refetch: fetchDrills,
  };
}
