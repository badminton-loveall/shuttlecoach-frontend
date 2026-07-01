/**
 * useAssessments Hook
 * Manages skill assessment CRUD operations with API backend.
 * Requirements: 31.5, 31.6, 30.1, 30.2
 *
 * - Fetches assessments from API
 * - Creates new assessment snapshots
 * - Locks past cycle snapshots on server
 */

import { useState, useEffect, useCallback } from 'react';
import type { SkillAssessment, SkillScores } from '../types';
import apiClient from '../utils/apiClient';

export interface CreateAssessmentData {
  studentId: string;
  cycleKey: string;
  scores: SkillScores;
  recordedBy: string;
}

export interface AssessmentFilters {
  studentId?: string;
  cycleKey?: string;
}

/**
 * Parse an assessment record from API response, ensuring Date fields are proper Date objects.
 */
function parseAssessmentDates(raw: Record<string, unknown>): SkillAssessment {
  return {
    ...raw,
    recordedAt: new Date(raw.recordedAt as string),
  } as SkillAssessment;
}

/**
 * Hook providing skill assessment operations with API backend.
 */
export function useAssessments(filters?: AssessmentFilters) {
  const [assessments, setAssessments] = useState<SkillAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch assessments from API
   */
  const fetchAssessments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (filters?.studentId) params.append('studentId', filters.studentId);
      if (filters?.cycleKey) params.append('cycleKey', filters.cycleKey);

      const response = await apiClient.get<SkillAssessment[]>(`/assessments?${params.toString()}`);
      
      // Parse date fields
      const parsedAssessments = response.data.map((a) =>
        parseAssessmentDates(a as unknown as Record<string, unknown>)
      );

      setAssessments(parsedAssessments);
    } catch (err) {
      console.error('Failed to fetch assessments:', err);
      setError('Failed to load assessments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch assessments on mount and when filters change
  useEffect(() => {
    void fetchAssessments();
  }, [fetchAssessments]);

  /**
   * Get a single assessment by ID.
   */
  const getAssessment = useCallback(
    async (id: string): Promise<SkillAssessment | undefined> => {
      try {
        const response = await apiClient.get<SkillAssessment>(`/assessments/${id}`);
        return parseAssessmentDates(response.data as unknown as Record<string, unknown>);
      } catch (err) {
        console.error(`Failed to fetch assessment ${id}:`, err);
        return undefined;
      }
    },
    []
  );

  /**
   * Create a new assessment snapshot via API.
   * Server validates that cycle is not locked.
   */
  const createAssessment = useCallback(
    async (data: CreateAssessmentData): Promise<SkillAssessment> => {
      try {
        const response = await apiClient.post<SkillAssessment>('/assessments', data);
        const newAssessment = parseAssessmentDates(response.data as unknown as Record<string, unknown>);

        // Refresh the assessments list
        await fetchAssessments();

        return newAssessment;
      } catch (err) {
        console.error('Failed to create assessment:', err);
        throw err;
      }
    },
    [fetchAssessments]
  );

  return {
    assessments,
    loading,
    error,
    getAssessment,
    createAssessment,
    refetch: fetchAssessments,
  };
}
