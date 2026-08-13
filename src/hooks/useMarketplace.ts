/**
 * useMarketplace Hook
 * Fetches marketplace drills from GET /api/drills/marketplace and
 * provides an adoptDrill function via POST /api/drills/adopt.
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { useState, useEffect, useCallback } from 'react';
import type { Drill } from '../types';
import apiClient from '../utils/apiClient';

export interface UseMarketplaceOptions {
  /** Optional category filter passed as query param */
  category?: string;
  /** Optional search query passed as query param */
  search?: string;
}

export interface UseMarketplaceReturn {
  drills: Drill[];
  loading: boolean;
  error: string | null;
  adoptDrill: (drillId: string) => Promise<Drill>;
  refetch: () => Promise<void>;
}

/**
 * Hook that fetches marketplace drills from GET /api/drills/marketplace.
 * Supports optional category and search filters.
 * Also provides an adoptDrill function that copies a global drill into the center's library.
 */
export function useMarketplace(options?: UseMarketplaceOptions): UseMarketplaceReturn {
  const [drills, setDrills] = useState<Drill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketplace = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string> = {};
      if (options?.category) params.category = options.category;
      if (options?.search) params.search = options.search;

      const response = await apiClient.get('/drills/marketplace', { params });
      setDrills(response.data.drills);
    } catch {
      setError('Failed to load marketplace drills. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [options?.category, options?.search]);

  useEffect(() => {
    void fetchMarketplace();
  }, [fetchMarketplace]);

  /**
   * Adopts a global drill into the center's library.
   * On success, refetches the marketplace list so the adopted drill disappears.
   * Returns the newly created center drill record.
   */
  const adoptDrill = useCallback(async (drillId: string): Promise<Drill> => {
    const response = await apiClient.post('/drills/adopt', { drillId });
    // Refetch marketplace so the adopted drill is excluded
    await fetchMarketplace();
    return response.data;
  }, [fetchMarketplace]);

  return {
    drills,
    loading,
    error,
    adoptDrill,
    refetch: fetchMarketplace,
  };
}
