/**
 * useCoachStudents Hook
 * Manages student data fetching and mutations for a coach.
 * Requirements: 8.1, 9.1, 17.1
 *
 * - Fetches all students assigned to a coach from GET /coaches/{coachId}/students
 * - Handles loading, error, and empty states
 * - Provides addStudent and removeStudent mutation functions
 * - Auto-refetches after mutations for data consistency
 */

import { useState, useEffect, useCallback } from 'react';
import type { Student } from '../types';
import apiClient from '../utils/apiClient';

interface AddStudentData {
  studentId: string;
  batchId: string;
}

interface RemoveStudentData {
  studentId: string;
}

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
 * Hook for fetching and managing students assigned to a coach.
 * 
 * @param coachId - The ID of the coach
 * @returns Object with students array, loading/error states, refetch function, and mutation functions
 */
export function useCoachStudents(coachId: string) {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch students for the coach from API
   */
  const fetchStudents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get<Student[]>(
        `/coaches/${coachId}/students`
      );

      // Parse date fields for each student
      const parsedStudents = response.data.map((s) =>
        parseStudentDates(s as unknown as Record<string, unknown>)
      );

      setStudents(parsedStudents);
    } catch (err) {
      console.error(`Failed to fetch students for coach ${coachId}:`, err);
      setError('Failed to load students. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [coachId]);

  // Fetch students on mount and when coachId changes
  useEffect(() => {
    void fetchStudents();
  }, [fetchStudents]);

  /**
   * Add a student to the coach's batch
   */
  const addStudent = useCallback(
    async (data: AddStudentData): Promise<Student> => {
      try {
        const response = await apiClient.post<Student>(
          `/coaches/${coachId}/students`,
          data
        );

        const newStudent = parseStudentDates(
          response.data as unknown as Record<string, unknown>
        );

        // Refetch to ensure data consistency
        await fetchStudents();

        return newStudent;
      } catch (err) {
        console.error('Failed to add student:', err);
        throw err;
      }
    },
    [coachId, fetchStudents]
  );

  /**
   * Remove a student from the coach's students
   */
  const removeStudent = useCallback(
    async (data: RemoveStudentData): Promise<void> => {
      try {
        await apiClient.delete(
          `/coaches/${coachId}/students/${data.studentId}`
        );

        // Refetch to ensure data consistency
        await fetchStudents();
      } catch (err) {
        console.error('Failed to remove student:', err);
        throw err;
      }
    },
    [coachId, fetchStudents]
  );

  return {
    students,
    isLoading,
    error,
    refetch: fetchStudents,
    addStudent,
    removeStudent,
  };
}
