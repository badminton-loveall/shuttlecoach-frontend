/**
 * useStudentDrillRecords Hook
 * Fetches a student's durable drill training ledger — every drill ever assigned across
 * every enrollment they've had — optionally scoped to a single enrollment.
 */

import { useState, useEffect, useCallback } from 'react';
import type { StudentDrillRecord } from '../types';
import apiClient from '../utils/apiClient';

export interface UpdateDrillRecordData {
  status: 'scheduled' | 'trained' | 'skipped';
  level?: number | null;
  coachNotes?: string | null;
}

export interface UseStudentDrillRecordsReturn {
  records: StudentDrillRecord[];
  loading: boolean;
  error: string | null;
  updateRecord: (id: string, data: UpdateDrillRecordData) => Promise<StudentDrillRecord>;
  refetch: () => Promise<void>;
}

export function useStudentDrillRecords(
  studentId: string | undefined,
  enrollmentId?: string
): UseStudentDrillRecordsReturn {
  const [records, setRecords] = useState<StudentDrillRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    if (!studentId) {
      setRecords([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const params = enrollmentId ? { enrollmentId } : undefined;
      const response = await apiClient.get<StudentDrillRecord[]>(`/students/${studentId}/drill-records`, { params });
      setRecords(response.data);
    } catch (err) {
      console.error('Failed to fetch drill records:', err);
      setError('Failed to load drill records. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [studentId, enrollmentId]);

  useEffect(() => {
    void fetchRecords();
  }, [fetchRecords]);

  const updateRecord = useCallback(
    async (id: string, data: UpdateDrillRecordData): Promise<StudentDrillRecord> => {
      if (!studentId) throw new Error('studentId is required');
      const response = await apiClient.patch<StudentDrillRecord>(`/students/${studentId}/drill-records/${id}`, data);
      await fetchRecords();
      return response.data;
    },
    [studentId, fetchRecords]
  );

  return { records, loading, error, updateRecord, refetch: fetchRecords };
}
