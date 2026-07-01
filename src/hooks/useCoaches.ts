/**
 * useCoaches Hook
 * Manages coach CRUD and assignment operations with API backend.
 * Requirements: 31.10, 30.1, 30.2
 *
 * - Fetches coaches from API (Head Coach only)
 * - Creates new assistant coach accounts
 * - Assigns/unassigns coaches to students and batches
 */

import { useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import apiClient from '../utils/apiClient';

export interface CreateCoachData {
  username: string;
  password: string;
  name: string;
  email?: string;
  profilePhoto?: string;
  specialization?: string;
}

export interface AssignCoachData {
  studentIds?: string[];
  batchId?: string;
  action: 'ASSIGN' | 'UNASSIGN';
}

export interface AssignCoachResponse {
  success: boolean;
}

/**
 * Parse a user/coach record from API response, ensuring Date fields are proper Date objects.
 */
function parseCoachDates(raw: Record<string, unknown>): User {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt as string),
    lastActive: new Date(raw.lastActive as string),
  } as User;
}

/**
 * Hook providing coach management operations with API backend.
 * Note: These endpoints are HEAD_COACH only - server enforces authorization.
 */
export function useCoaches() {
  const [coaches, setCoaches] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch coaches from API (Head Coach only)
   */
  const fetchCoaches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<User[]>('/coaches');
      
      // Parse date fields
      const parsedCoaches = response.data.map((c) =>
        parseCoachDates(c as unknown as Record<string, unknown>)
      );

      setCoaches(parsedCoaches);
    } catch (err) {
      console.error('Failed to fetch coaches:', err);
      setError('Failed to load coaches. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch coaches on mount
  useEffect(() => {
    void fetchCoaches();
  }, [fetchCoaches]);

  /**
   * Create a new assistant coach account via API (Head Coach only).
   */
  const createCoach = useCallback(
    async (data: CreateCoachData): Promise<User> => {
      try {
        const response = await apiClient.post<User>('/coaches', data);
        const newCoach = parseCoachDates(response.data as unknown as Record<string, unknown>);

        // Refresh the coaches list
        await fetchCoaches();

        return newCoach;
      } catch (err) {
        console.error('Failed to create coach:', err);
        throw err;
      }
    },
    [fetchCoaches]
  );

  /**
   * Assign or unassign a coach to students or a batch via API (Head Coach only).
   */
  const assignCoach = useCallback(
    async (coachId: string, data: AssignCoachData): Promise<boolean> => {
      try {
        const response = await apiClient.patch<AssignCoachResponse>(
          `/coaches/${coachId}/assign`,
          data
        );

        // Refresh the coaches list to get updated assignment counts
        await fetchCoaches();

        return response.data.success;
      } catch (err) {
        console.error(`Failed to assign coach ${coachId}:`, err);
        throw err;
      }
    },
    [fetchCoaches]
  );

  return {
    coaches,
    loading,
    error,
    createCoach,
    assignCoach,
    refetch: fetchCoaches,
  };
}
