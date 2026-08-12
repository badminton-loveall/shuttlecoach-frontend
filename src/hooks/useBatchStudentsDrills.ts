/**
 * useBatchStudentsDrills Hook
 * Fetches student drill data for a batch on a specific date.
 * Calls GET /api/batch-students-drills?batchId=X&date=Y
 * Requirements: 3.4, 3.5, 6.1
 */

import { useState, useEffect, useCallback } from 'react';
import apiClient from '../utils/apiClient';
import type { SkillLevel } from '../types';

export interface BatchStudentDrill {
  studentId: string;
  fullName: string;
  skillLevel: SkillLevel;
  drills: Array<{ name: string; focusArea: string }>;
}

interface UseBatchStudentsDrillsParams {
  batchId: string;
  date: string;
}

interface UseBatchStudentsDrillsReturn {
  students: BatchStudentDrill[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook that fetches student drill data for a given batch and date.
 * Skips fetching when batchId or date is empty.
 * Handles 403, 400, and network error states with user-friendly messages.
 */
export function useBatchStudentsDrills(
  params: UseBatchStudentsDrillsParams
): UseBatchStudentsDrillsReturn {
  const [students, setStudents] = useState<BatchStudentDrill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudentsDrills = useCallback(async () => {
    if (!params.batchId || !params.date) {
      setStudents([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get('/batch-students-drills', {
        params: { batchId: params.batchId, date: params.date },
      });

      setStudents(response.data.students);
    } catch (err: unknown) {
      const axiosError = err as { response?: { status?: number } };
      const status = axiosError?.response?.status;

      if (status === 403) {
        setError("You don't have access to this batch");
      } else if (status === 400) {
        setError('Invalid request');
      } else {
        setError('Student data temporarily unavailable');
      }

      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [params.batchId, params.date]);

  useEffect(() => {
    void fetchStudentsDrills();
  }, [fetchStudentsDrills]);

  return {
    students,
    loading,
    error,
    refetch: fetchStudentsDrills,
  };
}
