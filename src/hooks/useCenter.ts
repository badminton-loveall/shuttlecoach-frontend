/**
 * useCenter Hook
 * Fetches the logged-in coach's own center details (GET /api/memberships/my-center),
 * including the admin-controlled `marketplaceEnabled` flag used to gate the
 * Marketplace tab on the Drills page.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Center } from '../types';
import apiClient from '../utils/apiClient';

export interface UseCenterReturn {
  center: Center | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCenter(): UseCenterReturn {
  const [center, setCenter] = useState<Center | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCenter = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/memberships/my-center');
      setCenter(response.data);
    } catch {
      setError('Failed to load center data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCenter();
  }, [fetchCenter]);

  return { center, loading, error, refetch: fetchCenter };
}
