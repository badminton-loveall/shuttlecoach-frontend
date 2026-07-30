/**
 * useBatches Hook
 * Fetches all batches and provides batch name resolution.
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4
 *
 * - Fetches all batches from GET /batches
 * - Builds Map<string, string> from batch ID to batch name
 * - Exposes getBatchName(batchId) returning name or "Unknown batch"
 * - Handles loading, error, and refetch states
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Batch } from '../types';
import apiClient from '../utils/apiClient';

export interface UseBatchesReturn {
  batches: Batch[];
  loading: boolean;
  error: string | null;
  getBatchName: (batchId: string | undefined) => string;
  refetch: () => Promise<void>;
}

const FALLBACK_NAME = 'Unknown batch';

/**
 * Parse a batch record from API response, ensuring Date fields are proper Date objects.
 */
function parseBatchDates(raw: Record<string, unknown>): Batch {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt as string),
  } as Batch;
}

/**
 * Hook providing batch data and a name resolution function.
 * Fetches all batches from the API and builds an internal lookup map.
 */
export function useBatches(): UseBatchesReturn {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all batches from API
   */
  const fetchBatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<{ batches: Record<string, unknown>[] }>('/batches');

      const parsedBatches = response.data.batches.map((b) => parseBatchDates(b));

      setBatches(parsedBatches);
    } catch (err) {
      console.error('Failed to fetch batches:', err);
      setError('Failed to load batches. Please try again.');
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch batches on mount
  useEffect(() => {
    void fetchBatches();
  }, [fetchBatches]);

  /**
   * Internal map from batch ID to batch name for O(1) lookups.
   */
  const batchMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const batch of batches) {
      map.set(batch.id, batch.name);
    }
    return map;
  }, [batches]);

  /**
   * Resolve a batch ID to its human-readable name.
   * Returns "Unknown batch" for missing, undefined, or unresolvable IDs.
   * Never throws.
   */
  const getBatchName = useCallback(
    (batchId: string | undefined): string => {
      if (!batchId) {
        return FALLBACK_NAME;
      }
      return batchMap.get(batchId) ?? FALLBACK_NAME;
    },
    [batchMap]
  );

  return {
    batches,
    loading,
    error,
    getBatchName,
    refetch: fetchBatches,
  };
}
