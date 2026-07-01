/**
 * useCurriculum Hook
 * Manages curriculum plan CRUD operations with API backend.
 * Requirements: 31.9, 31.10, 30.1, 30.2
 *
 * - Fetches curriculum plans from API
 * - Creates batch and individual plans
 * - Clones batch plans to students
 * - Updates individual plans
 */

import { useState, useEffect, useCallback } from 'react';
import type { CurriculumPlan, WeekPlan } from '../types';
import apiClient from '../utils/apiClient';

export interface CreateCurriculumData {
  cycleKey: string;
  batchId?: string;
  studentId?: string;
  sourceBatchPlanId?: string;
  weeks: WeekPlan[];
}

export interface UpdateCurriculumData {
  weeks?: WeekPlan[];
}

export interface CurriculumFilters {
  studentId?: string;
  cycleKey?: string;
  batchId?: string;
}

export interface CloneBatchPlanData {
  batchId: string;
}

export interface CloneBatchPlanResponse {
  createdPlans: CurriculumPlan[];
}

/**
 * Parse a curriculum plan from API response, ensuring Date fields are proper Date objects.
 */
function parseCurriculumDates(raw: Record<string, unknown>): CurriculumPlan {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt as string),
    updatedAt: new Date(raw.updatedAt as string),
  } as CurriculumPlan;
}

/**
 * Hook providing curriculum management operations with API backend.
 */
export function useCurriculum(filters?: CurriculumFilters) {
  const [plans, setPlans] = useState<CurriculumPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch curriculum plans from API
   */
  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (filters?.studentId) params.append('studentId', filters.studentId);
      if (filters?.cycleKey) params.append('cycleKey', filters.cycleKey);
      if (filters?.batchId) params.append('batchId', filters.batchId);

      const response = await apiClient.get<CurriculumPlan[]>(`/curriculum?${params.toString()}`);
      
      // Parse date fields
      const parsedPlans = response.data.map((p) =>
        parseCurriculumDates(p as unknown as Record<string, unknown>)
      );

      setPlans(parsedPlans);
    } catch (err) {
      console.error('Failed to fetch curriculum plans:', err);
      setError('Failed to load curriculum plans. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch plans on mount and when filters change
  useEffect(() => {
    void fetchPlans();
  }, [fetchPlans]);

  /**
   * Create a new curriculum plan via API.
   */
  const createPlan = useCallback(
    async (data: CreateCurriculumData): Promise<CurriculumPlan> => {
      try {
        const response = await apiClient.post<CurriculumPlan>('/curriculum', data);
        const newPlan = parseCurriculumDates(response.data as unknown as Record<string, unknown>);

        // Refresh the plans list
        await fetchPlans();

        return newPlan;
      } catch (err) {
        console.error('Failed to create curriculum plan:', err);
        throw err;
      }
    },
    [fetchPlans]
  );

  /**
   * Clone a batch plan to all students in the batch via API.
   */
  const cloneBatchPlan = useCallback(
    async (planId: string, data: CloneBatchPlanData): Promise<CurriculumPlan[]> => {
      try {
        const response = await apiClient.post<CloneBatchPlanResponse>(
          `/curriculum/${planId}/clone`,
          data
        );

        // Refresh the plans list
        await fetchPlans();

        return response.data.createdPlans;
      } catch (err) {
        console.error(`Failed to clone batch plan ${planId}:`, err);
        throw err;
      }
    },
    [fetchPlans]
  );

  /**
   * Update an existing curriculum plan via API.
   */
  const updatePlan = useCallback(
    async (id: string, data: UpdateCurriculumData): Promise<CurriculumPlan> => {
      try {
        const response = await apiClient.patch<CurriculumPlan>(`/curriculum/${id}`, data);
        const updatedPlan = parseCurriculumDates(response.data as unknown as Record<string, unknown>);

        // Refresh the plans list
        await fetchPlans();

        return updatedPlan;
      } catch (err) {
        console.error(`Failed to update curriculum plan ${id}:`, err);
        throw err;
      }
    },
    [fetchPlans]
  );

  return {
    plans,
    loading,
    error,
    createPlan,
    cloneBatchPlan,
    updatePlan,
    refetch: fetchPlans,
  };
}
