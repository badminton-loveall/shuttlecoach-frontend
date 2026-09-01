/**
 * useSetMarketplace Hook
 * Browses published Drill Sets from other centers and adopts one (set +
 * categories + all its drills) into the requesting center's library.
 */

import { useState, useEffect, useCallback } from 'react';
import type { DrillSet } from '../types';
import apiClient from '../utils/apiClient';

export interface UseSetMarketplaceOptions {
  sport?: string;
  search?: string;
}

export interface UseSetMarketplaceReturn {
  sets: DrillSet[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  adoptSet: (setId: string) => Promise<DrillSet>;
}

export function useSetMarketplace(options?: UseSetMarketplaceOptions): UseSetMarketplaceReturn {
  const [sets, setSets] = useState<DrillSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {};
      if (options?.sport) params.sport = options.sport;
      if (options?.search) params.search = options.search;
      const response = await apiClient.get('/drill-sets/marketplace', { params });
      setSets(response.data.sets);
    } catch {
      setError('Failed to load the set marketplace. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [options?.sport, options?.search]);

  useEffect(() => {
    void fetchSets();
  }, [fetchSets]);

  const adoptSet = useCallback(async (setId: string): Promise<DrillSet> => {
    const response = await apiClient.post('/drill-sets/adopt', { setId });
    await fetchSets();
    return response.data;
  }, [fetchSets]);

  return {
    sets,
    loading,
    error,
    refetch: fetchSets,
    adoptSet,
  };
}
