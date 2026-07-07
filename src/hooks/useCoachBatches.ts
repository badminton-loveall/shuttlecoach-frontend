/**
 * useCoachBatches Hook
 * Manages coach batch assignments with API backend.
 * Requirements: 5.1, 6.1, 13.1, 20.1
 *
 * - Fetches batches assigned to a coach from GET /coaches/{coachId}/batches
 * - Assigns batches to coach via POST /coaches/{coachId}/batches
 * - Unassigns batches from coach via DELETE /coaches/{coachId}/batches/{batchId}
 */

import { useState, useEffect, useCallback } from 'react';
import type { Batch } from '../types';
import apiClient from '../utils/apiClient';

export interface AssignBatchData {
  batchId: string;
}

export interface AssignBatchResponse {
  success: boolean;
  batch?: Batch;
}

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
 * Hook providing batch management operations for a specific coach.
 * Fetches batches assigned to the coach and supports assignment/unassignment operations.
 */
export function useCoachBatches(coachId: string) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch batches assigned to the coach from API
   */
  const fetchBatches = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get<Batch[]>(`/coaches/${coachId}/batches`);

      // Parse date fields
      const parsedBatches = response.data.map((b) =>
        parseBatchDates(b as unknown as Record<string, unknown>)
      );

      setBatches(parsedBatches);
    } catch (err) {
      console.error(`Failed to fetch batches for coach ${coachId}:`, err);
      setError('Failed to load batches. Please try again.');
      setBatches([]);
    } finally {
      setIsLoading(false);
    }
  }, [coachId]);

  // Fetch batches on mount or when coachId changes
  useEffect(() => {
    void fetchBatches();
  }, [fetchBatches]);

  /**
   * Assign a batch to the coach via API
   */
  const assignBatch = useCallback(
    async (batchId: string): Promise<Batch> => {
      try {
        const response = await apiClient.post<AssignBatchResponse>(
          `/coaches/${coachId}/batches`,
          { batchId }
        );

        const newBatch = response.data.batch
          ? parseBatchDates(response.data.batch as unknown as Record<string, unknown>)
          : ({ id: batchId } as Batch);

        // Refresh the batches list
        await fetchBatches();

        return newBatch;
      } catch (err) {
        console.error(`Failed to assign batch ${batchId} to coach ${coachId}:`, err);
        throw err;
      }
    },
    [coachId, fetchBatches]
  );

  /**
   * Unassign a batch from the coach via API
   */
  const unassignBatch = useCallback(
    async (batchId: string): Promise<boolean> => {
      try {
        const response = await apiClient.delete<AssignBatchResponse>(
          `/coaches/${coachId}/batches/${batchId}`
        );

        // Refresh the batches list
        await fetchBatches();

        return response.data.success;
      } catch (err) {
        console.error(`Failed to unassign batch ${batchId} from coach ${coachId}:`, err);
        throw err;
      }
    },
    [coachId, fetchBatches]
  );

  return {
    batches,
    isLoading,
    error,
    assignBatch,
    unassignBatch,
    refetch: fetchBatches,
  };
}
