/**
 * useStudentEnrollments Hook
 * Manages a student's enrollment history (batch time template + curriculum + coach +
 * start date + fee), fetched from the per-student enrollment API.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { StudentEnrollment } from '../types';
import apiClient from '../utils/apiClient';

export interface CreateEnrollmentData {
  batchTimeTemplateId?: string | null;
  curriculumId?: string | null;
  coachId?: string | null;
  startDate: string;
  monthlyFee?: number | null;
}

export interface UseStudentEnrollmentsReturn {
  enrollments: StudentEnrollment[];
  activeEnrollment: StudentEnrollment | null;
  history: StudentEnrollment[];
  loading: boolean;
  error: string | null;
  createEnrollment: (data: CreateEnrollmentData) => Promise<StudentEnrollment>;
  refetch: () => Promise<void>;
}

export function useStudentEnrollments(studentId: string | undefined): UseStudentEnrollmentsReturn {
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnrollments = useCallback(async () => {
    if (!studentId) {
      setEnrollments([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get<StudentEnrollment[]>(`/students/${studentId}/enrollments`);
      setEnrollments(response.data);
    } catch (err) {
      console.error('Failed to fetch enrollments:', err);
      setError('Failed to load enrollment history. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    void fetchEnrollments();
  }, [fetchEnrollments]);

  const createEnrollment = useCallback(
    async (data: CreateEnrollmentData): Promise<StudentEnrollment> => {
      if (!studentId) throw new Error('studentId is required');
      const response = await apiClient.post<StudentEnrollment>(`/students/${studentId}/enrollments`, data);
      await fetchEnrollments();
      return response.data;
    },
    [studentId, fetchEnrollments]
  );

  const activeEnrollment = useMemo(
    () => enrollments.find((e) => e.status === 'active') ?? null,
    [enrollments]
  );

  const history = useMemo(
    () => enrollments.filter((e) => e.status !== 'active'),
    [enrollments]
  );

  return {
    enrollments,
    activeEnrollment,
    history,
    loading,
    error,
    createEnrollment,
    refetch: fetchEnrollments,
  };
}
