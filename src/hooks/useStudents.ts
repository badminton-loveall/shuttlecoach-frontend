/**
 * useStudents Hook
 * Manages student CRUD operations with API backend.
 * Requirements: 5.1, 5.7, 30.1, 30.2, 31.3, 31.4
 *
 * - Fetches students from API on mount
 * - Provides create, update, and get operations via API
 * - Auto-computes age and BMI on server
 * - Validates required fields before saving
 */

import { useState, useEffect, useCallback } from 'react';
import type { Student, Gender, SkillLevel } from '../types';
import apiClient from '../utils/apiClient';

export interface CreateStudentData {
  fullName: string;
  dateOfBirth: string | Date;
  gender: Gender;
  contactPhone: string;
  email?: string;
  guardianName?: string;
  guardianPhone?: string;
  baidNumber?: string;
  batchId?: string;
  assignedCoachId?: string;
  profilePhoto?: string;
  height?: number;
  weight?: number;
  bloodGroup?: string;
  medicalConditions?: string;
  emergencyContact?: string;
  strengths?: string[];
  weaknesses?: string[];
  coachFeedback?: string;
  skillLevel?: SkillLevel;
}

export interface UpdateStudentData extends Partial<CreateStudentData> {}

export interface StudentFilters {
  batch?: string;
  coach?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface StudentsResponse {
  students: Student[];
  total: number;
  page: number;
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
 * Hook providing student CRUD operations with API backend.
 */
export function useStudents(filters?: StudentFilters) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  /**
   * Fetch students from API
   */
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (filters?.batch) params.append('batch', filters.batch);
      if (filters?.coach) params.append('coach', filters.coach);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get<StudentsResponse>(`/students?${params.toString()}`);
      
      // Parse date fields
      const parsedStudents = response.data.students.map((s) =>
        parseStudentDates(s as unknown as Record<string, unknown>)
      );

      setStudents(parsedStudents);
      setTotal(response.data.total);
    } catch (err) {
      console.error('Failed to fetch students:', err);
      setError('Failed to load students. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch students on mount and when filters change
  useEffect(() => {
    void fetchStudents();
  }, [fetchStudents]);

  /**
   * Get a single student by ID.
   */
  const getStudent = useCallback(
    async (id: string): Promise<Student | undefined> => {
      try {
        const response = await apiClient.get<Student>(`/students/${id}`);
        return parseStudentDates(response.data as unknown as Record<string, unknown>);
      } catch (err) {
        console.error(`Failed to fetch student ${id}:`, err);
        return undefined;
      }
    },
    []
  );

  /**
   * Create a new student record via API.
   * Server handles validation, age/BMI computation, and persistence.
   */
  const createStudent = useCallback(
    async (data: CreateStudentData): Promise<Student> => {
      try {
        // Convert Date to ISO string if needed
        const payload = {
          ...data,
          dateOfBirth:
            data.dateOfBirth instanceof Date
              ? data.dateOfBirth.toISOString()
              : data.dateOfBirth,
        };

        const response = await apiClient.post<Student>('/students', payload);
        const newStudent = parseStudentDates(response.data as unknown as Record<string, unknown>);

        // Refresh the students list
        await fetchStudents();

        return newStudent;
      } catch (err) {
        console.error('Failed to create student:', err);
        throw err;
      }
    },
    [fetchStudents]
  );

  /**
   * Update an existing student record via API.
   * Server handles validation, age/BMI recomputation, and persistence.
   */
  const updateStudent = useCallback(
    async (id: string, data: UpdateStudentData): Promise<Student> => {
      try {
        // Convert Date to ISO string if needed
        const payload = {
          ...data,
          dateOfBirth:
            data.dateOfBirth instanceof Date
              ? data.dateOfBirth.toISOString()
              : data.dateOfBirth,
        };

        const response = await apiClient.patch<Student>(`/students/${id}`, payload);
        const updatedStudent = parseStudentDates(response.data as unknown as Record<string, unknown>);

        // Refresh the students list
        await fetchStudents();

        return updatedStudent;
      } catch (err) {
        console.error(`Failed to update student ${id}:`, err);
        throw err;
      }
    },
    [fetchStudents]
  );

  return {
    students,
    loading,
    error,
    total,
    getStudent,
    createStudent,
    updateStudent,
    refetch: fetchStudents,
  };
}
