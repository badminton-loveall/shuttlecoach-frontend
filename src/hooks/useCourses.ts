/**
 * useCourses Hook
 * Manages course template CRUD operations with API backend.
 * Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 10.1-10.5
 *
 * - Fetches courses from API (GET /api/courses)
 * - Creates new course templates
 * - Updates existing courses
 * - Deletes courses
 * - Fetches a single course by ID
 * - Attaches a course to a batch for a cycle
 */

import { useState, useEffect, useCallback } from 'react';
import type { Drill } from '../types';
import apiClient from '../utils/apiClient';

// ─── Interfaces ─────────────────────────────────────────────────────────────────

export interface CourseWeek {
  weekNumber: number;
  focusArea: string;
  objective: string;
  drills: Drill[];
}

export interface Course {
  id: string;
  name: string;
  coachId: string;
  weeks: CourseWeek[];
  centerId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseData {
  name: string;
  weeks: CourseWeek[];
}

export interface UpdateCourseData {
  name?: string;
  weeks?: CourseWeek[];
}

export interface AttachCourseData {
  batchId: string;
  cycleKey: string;
  confirmOverwrite?: boolean;
}

export interface AttachResponse {
  batchPlan: any;
  studentPlans: any[];
  message: string;
}

export interface UseCoursesReturn {
  courses: Course[];
  loading: boolean;
  error: string | null;
  createCourse: (data: CreateCourseData) => Promise<Course>;
  updateCourse: (id: string, data: UpdateCourseData) => Promise<Course>;
  deleteCourse: (id: string) => Promise<void>;
  getCourseById: (id: string) => Promise<Course>;
  attachCourseToBatch: (courseId: string, data: AttachCourseData) => Promise<AttachResponse>;
  refetch: () => Promise<void>;
}

// ─── Hook ───────────────────────────────────────────────────────────────────────

/**
 * Hook providing course template management operations with API backend.
 * On mount, fetches all courses for the authenticated coach.
 */
export function useCourses(): UseCoursesReturn {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all courses for the authenticated coach from GET /api/courses.
   */
  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<{ courses: Course[] }>('/courses');
      setCourses(response.data.courses);
    } catch {
      setError('Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch courses on mount
  useEffect(() => {
    void fetchCourses();
  }, [fetchCourses]);

  /**
   * Create a new course via POST /api/courses.
   */
  const createCourse = useCallback(
    async (data: CreateCourseData): Promise<Course> => {
      try {
        const response = await apiClient.post<Course>('/courses', data);
        // Refresh the course list
        await fetchCourses();
        return response.data;
      } catch (err) {
        console.error('Failed to create course:', err);
        throw err;
      }
    },
    [fetchCourses]
  );

  /**
   * Update an existing course via PUT /api/courses/:id.
   */
  const updateCourse = useCallback(
    async (id: string, data: UpdateCourseData): Promise<Course> => {
      try {
        const response = await apiClient.put<Course>(`/courses/${id}`, data);
        // Refresh the course list
        await fetchCourses();
        return response.data;
      } catch (err) {
        console.error(`Failed to update course ${id}:`, err);
        throw err;
      }
    },
    [fetchCourses]
  );

  /**
   * Delete a course via DELETE /api/courses/:id.
   */
  const deleteCourse = useCallback(
    async (id: string): Promise<void> => {
      try {
        await apiClient.delete(`/courses/${id}`);
        // Refresh the course list
        await fetchCourses();
      } catch (err) {
        console.error(`Failed to delete course ${id}:`, err);
        throw err;
      }
    },
    [fetchCourses]
  );

  /**
   * Fetch a single course by ID via GET /api/courses/:id.
   */
  const getCourseById = useCallback(async (id: string): Promise<Course> => {
    try {
      const response = await apiClient.get<Course>(`/courses/${id}`);
      return response.data;
    } catch (err) {
      console.error(`Failed to fetch course ${id}:`, err);
      throw err;
    }
  }, []);

  /**
   * Attach a course to a batch via POST /api/courses/:id/attach.
   */
  const attachCourseToBatch = useCallback(
    async (courseId: string, data: AttachCourseData): Promise<AttachResponse> => {
      try {
        const response = await apiClient.post<AttachResponse>(
          `/courses/${courseId}/attach`,
          data
        );
        return response.data;
      } catch (err) {
        console.error(`Failed to attach course ${courseId} to batch:`, err);
        throw err;
      }
    },
    []
  );

  return {
    courses,
    loading,
    error,
    createCourse,
    updateCourse,
    deleteCourse,
    getCourseById,
    attachCourseToBatch,
    refetch: fetchCourses,
  };
}
