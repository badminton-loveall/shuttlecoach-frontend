/**
 * useDrillSets Hook
 * Manages the requesting coach's own Drill Sets: list/create/update/delete,
 * manage categories within a set, add/remove drills under a category,
 * and submit a set for admin review.
 */

import { useState, useEffect, useCallback } from 'react';
import type { DrillSet, DrillSetCategory, SetStatus } from '../types';
import apiClient from '../utils/apiClient';

export interface UseDrillSetsOptions {
  status?: SetStatus;
}

export interface CreateSetInput {
  name: string;
  description?: string;
  sport?: string;
}

export interface UseDrillSetsReturn {
  sets: DrillSet[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createSet: (input: CreateSetInput) => Promise<DrillSet>;
  updateSet: (id: string, input: Partial<CreateSetInput>) => Promise<DrillSet>;
  deleteSet: (id: string) => Promise<void>;
  getSetDetail: (id: string) => Promise<DrillSet & { categories: DrillSetCategory[] }>;
  createSetCategory: (setId: string, name: string) => Promise<DrillSetCategory>;
  updateSetCategory: (setId: string, categoryId: string, name: string) => Promise<void>;
  deleteSetCategory: (setId: string, categoryId: string) => Promise<void>;
  addDrillToSetCategory: (setId: string, categoryId: string, drillId: string) => Promise<void>;
  removeDrillFromSetCategory: (setId: string, categoryId: string, drillId: string) => Promise<void>;
  submitSet: (id: string) => Promise<DrillSet>;
}

export function useDrillSets(options?: UseDrillSetsOptions): UseDrillSetsReturn {
  const [sets, setSets] = useState<DrillSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {};
      if (options?.status) params.status = options.status;
      const response = await apiClient.get('/drill-sets', { params });
      setSets(response.data.sets);
    } catch {
      setError('Failed to load drill sets. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [options?.status]);

  useEffect(() => {
    void fetchSets();
  }, [fetchSets]);

  const createSet = useCallback(async (input: CreateSetInput): Promise<DrillSet> => {
    const response = await apiClient.post('/drill-sets', input);
    await fetchSets();
    return response.data;
  }, [fetchSets]);

  const updateSet = useCallback(async (id: string, input: Partial<CreateSetInput>): Promise<DrillSet> => {
    const response = await apiClient.patch(`/drill-sets/${id}`, input);
    await fetchSets();
    return response.data;
  }, [fetchSets]);

  const deleteSet = useCallback(async (id: string): Promise<void> => {
    await apiClient.delete(`/drill-sets/${id}`);
    await fetchSets();
  }, [fetchSets]);

  const getSetDetail = useCallback(async (id: string): Promise<DrillSet & { categories: DrillSetCategory[] }> => {
    const response = await apiClient.get(`/drill-sets/${id}`);
    return response.data;
  }, []);

  const createSetCategory = useCallback(async (setId: string, name: string): Promise<DrillSetCategory> => {
    const response = await apiClient.post(`/drill-sets/${setId}/categories`, { name });
    return response.data;
  }, []);

  const updateSetCategory = useCallback(async (setId: string, categoryId: string, name: string): Promise<void> => {
    await apiClient.patch(`/drill-sets/${setId}/categories/${categoryId}`, { name });
  }, []);

  const deleteSetCategory = useCallback(async (setId: string, categoryId: string): Promise<void> => {
    await apiClient.delete(`/drill-sets/${setId}/categories/${categoryId}`);
  }, []);

  const addDrillToSetCategory = useCallback(async (setId: string, categoryId: string, drillId: string): Promise<void> => {
    await apiClient.post(`/drill-sets/${setId}/categories/${categoryId}/drills`, { drillId });
  }, []);

  const removeDrillFromSetCategory = useCallback(async (setId: string, categoryId: string, drillId: string): Promise<void> => {
    await apiClient.delete(`/drill-sets/${setId}/categories/${categoryId}/drills/${drillId}`);
  }, []);

  const submitSet = useCallback(async (id: string): Promise<DrillSet> => {
    const response = await apiClient.post(`/drill-sets/${id}/submit`);
    await fetchSets();
    return response.data;
  }, [fetchSets]);

  return {
    sets,
    loading,
    error,
    refetch: fetchSets,
    createSet,
    updateSet,
    deleteSet,
    getSetDetail,
    createSetCategory,
    updateSetCategory,
    deleteSetCategory,
    addDrillToSetCategory,
    removeDrillFromSetCategory,
    submitSet,
  };
}
