/**
 * useStudent Hook
 * Fetches a single student by ID from the API.
 * Requirements: 2.2
 *
 * - Calls GET /students/:id directly via apiClient
 * - Returns { student, loading, error, refetch } state
 * - Re-fetches when the ID changes
 * - Parses date fields into proper Date objects
 */

import { useState, useEffect, useCallback } from 'react';
import type { Student } from '../types';
import apiClient from '../utils/apiClient';

/**
 * Parse a student record from API response, ensuring Date fields are proper Date objects.
 */
function parseStudentDates(raw: Record<string, unknown>): Student {
  return {
    ...raw,
    dateOfBirth: new Date(raw.dateOfBirth as string),
    createdAt: new Date(raw.createdAt as string),
    updatedAt: new Date(raw.updatedAt as string),
  } as Student;
}

/**
 * Hook for fetching a single student by ID.
 * Uses GET /students/:id endpoint directly, avoiding pagination issues.
 */
export function useStudent(id: string | undefined) {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudent = useCallback(async () => {
    if (!id) {
      setStudent(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get<Student>(`/students/${id}`);
      setStudent(parseStudentDates(response.data as unknown as Record<string, unknown>));
    } catch (err) {
      console.error(`Failed to fetch student ${id}:`, err);
      setError('Failed to load student. Please try again.');
      setStudent(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchStudent();
  }, [fetchStudent]);

  return { student, loading, error, refetch: fetchStudent };
}
