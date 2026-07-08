/**
 * useOptimisticUpdate Hook
 * Provides a pattern for optimistic UI updates with automatic rollback on failure
 * 
 * Implements Requirements:
 * 20.1: Update UI immediately on user action (profile changes)
 * 20.2: Update UI immediately on batch changes
 * 20.3: Update UI immediately on student changes
 * 20.4: Update UI immediately on expense/payment changes
 * 
 * Pattern:
 * 1. Update local state immediately (optimistic)
 * 2. Make API call
 * 3. On success: confirm the update
 * 4. On failure: rollback to previous state
 * 5. Show appropriate toast notifications
 */

import { useState, useCallback } from 'react';

export interface OptimisticUpdateOptions<T> {
  // Current data before update
  currentData: T;
  // Function to compute updated data before API call
  getOptimisticData: (current: T) => T;
  // Function to make the API call
  apiCall: () => Promise<T>;
  // Callback when update succeeds
  onSuccess?: (newData: T) => void;
  // Callback when update fails (before rollback)
  onError?: (error: Error) => void;
}

export interface UseOptimisticUpdateResult<T> {
  // Currently displayed data (may be optimistic)
  displayData: T;
  // Is the update currently in progress
  isUpdating: boolean;
  // Error from the update attempt
  error: Error | null;
  // Execute an optimistic update
  executeUpdate: (
    options: Omit<OptimisticUpdateOptions<T>, 'currentData'>
  ) => Promise<void>;
  // Manually rollback to previous data
  rollback: () => void;
}

/**
 * Hook for managing optimistic updates with rollback
 * 
 * Example usage:
 * ```
 * const { displayData, isUpdating, error, executeUpdate } = useOptimisticUpdate({
 *   currentData: coach,
 * });
 * 
 * const handleUpdate = async (updates: Partial<User>) => {
 *   await executeUpdate({
 *     getOptimisticData: (current) => ({ ...current, ...updates }),
 *     apiCall: () => apiClient.patch(`/coaches/${id}`, updates),
 *     onSuccess: () => showToast('Updated'),
 *     onError: (err) => showToast(err.message, 'error'),
 *   });
 * };
 * ```
 */
export function useOptimisticUpdate<T>(initialData: T): UseOptimisticUpdateResult<T> {
  const [displayData, setDisplayData] = useState<T>(initialData);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [previousData, setPreviousData] = useState<T>(initialData);

  const executeUpdate = useCallback(
    async (options: Omit<OptimisticUpdateOptions<T>, 'currentData'>) => {
      try {
        setIsUpdating(true);
        setError(null);

        // Step 1: Compute optimistic data
        const optimisticData = options.getOptimisticData(displayData);

        // Step 2: Update display immediately (optimistic)
        setPreviousData(displayData);
        setDisplayData(optimisticData);

        // Step 3: Make API call
        const result = await options.apiCall();

        // Step 4: On success, update display with confirmed data
        setDisplayData(result);
        options.onSuccess?.(result);
      } catch (err) {
        // Step 5: On failure, rollback to previous data
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setDisplayData(previousData);
        options.onError?.(error);
      } finally {
        setIsUpdating(false);
      }
    },
    [displayData, previousData]
  );

  const rollback = useCallback(() => {
    setDisplayData(previousData);
    setError(null);
  }, [previousData]);

  return {
    displayData,
    isUpdating,
    error,
    executeUpdate,
    rollback,
  };
}
