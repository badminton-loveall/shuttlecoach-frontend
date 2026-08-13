/**
 * useBatchStudents Hook
 * Fetches students for a specific batch from GET /api/students?batchId=X.
 * Lightweight hook used by DashboardAttendanceBlock for attendance marking.
 * Requirements: 3.1, 3.3
 */

import { useState, useEffect, useCallback } from 'react';
import type { Student } from '../types';
import apiClient from '../utils/apiClient';

export interface UseBatchStudentsReturn {
  students: Student[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook that fetches students belonging to a specific batch.
 * Re-fetches when batchId changes. Returns empty array when batchId is undefined.
 */
export function useBatchStudents(batchId: string | undefined): UseBatchStudentsReturn {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get('/students', {
        params: { batchId: id },
      });

      // Handle both { students: [...] } and direct array response formats
      const data = response.data;
      const studentList: Student[] = Array.isArray(data) ? data : data.students ?? [];

      setStudents(studentList);
    } catch {
      setError('Failed to load students. Please try again.');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!batchId) {
      setStudents([]);
      setLoading(false);
      setError(null);
      return;
    }

    void fetchStudents(batchId);
  }, [batchId, fetchStudents]);

  return { students, loading, error };
}
