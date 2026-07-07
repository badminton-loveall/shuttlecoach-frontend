/**
 * useCoachDetail Hook
 * Fetches and manages a single coach's profile information.
 * Requirements: 1.1, 2.1, 20.1
 *
 * Features:
 * - Fetches single coach profile by ID from GET /coaches/{coachId}
 * - Handles loading and error states
 * - Returns coach data, isLoading, error, and refetch function
 * - Provides optimistic update support for inline edits
 */

import { useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import apiClient from '../utils/apiClient';

/**
 * Return type for useCoachDetail hook
 */
export interface UseCoachDetailReturn {
  coach: User | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Parse a coach record from API response, ensuring Date fields are proper Date objects.
 */
function parseCoachDates(raw: Record<string, unknown>): User {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt as string),
    lastActive: new Date(raw.lastActive as string),
  } as User;
}

/**
 * Custom hook to fetch and manage a single coach's profile data.
 * 
 * @param coachId - The unique identifier of the coach to fetch
 * @returns Object with coach data, loading state, error state, and refetch function
 * 
 * @example
 * const { coach, isLoading, error, refetch } = useCoachDetail(coachId);
 * 
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error}</div>;
 * return <div>{coach?.name}</div>;
 */
export function useCoachDetail(coachId: string): UseCoachDetailReturn {
  const [coach, setCoach] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch coach profile from API
   */
  const fetchCoachDetail = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get<User>(`/coaches/${coachId}`);
      
      // Parse date fields to ensure they are Date objects
      const parsedCoach = parseCoachDates(response.data as unknown as Record<string, unknown>);
      setCoach(parsedCoach);
    } catch (err) {
      console.error(`Failed to fetch coach detail for ${coachId}:`, err);

      // Provide user-friendly error messages based on error type
      if (err instanceof Error) {
        if (err.message.includes('404') || (err as any).response?.status === 404) {
          setError('Coach not found. Please check the URL or contact support.');
        } else if (err.message.includes('403') || (err as any).response?.status === 403) {
          setError('You do not have permission to access this coach.');
        } else if (err.message.includes('Network') || (err as any).code === 'ECONNABORTED') {
          setError('Network error. Please check your connection and try again.');
        } else if ((err as any).response?.status >= 500) {
          setError('Server error. Please try again later.');
        } else {
          setError('Failed to load coach information. Please try again.');
        }
      } else {
        setError('An unexpected error occurred while loading coach information.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [coachId]);

  /**
   * Fetch coach data on component mount or when coachId changes
   */
  useEffect(() => {
    if (coachId) {
      void fetchCoachDetail();
    }
  }, [coachId, fetchCoachDetail]);

  /**
   * Public refetch function to manually refresh coach data
   */
  const refetch = useCallback(async () => {
    await fetchCoachDetail();
  }, [fetchCoachDetail]);

  return {
    coach,
    isLoading,
    error,
    refetch,
  };
}
