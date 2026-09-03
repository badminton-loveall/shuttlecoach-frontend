import { useCallback, useEffect, useState } from 'react';
import apiClient from '../utils/apiClient';

export interface CapacityStatus {
  coachLimit: number;
  coachCount: number;
  studentLimit: number;
  studentCount: number;
}

/** How many coaches/students this center has versus its Capacity plan limit. */
export function useCapacityStatus(): { status: CapacityStatus | null; refetch: () => void } {
  const [status, setStatus] = useState<CapacityStatus | null>(null);

  const refetch = useCallback(() => {
    apiClient
      .get<CapacityStatus>('/marketplace/capacity')
      .then((res) => setStatus(res.data))
      .catch(() => setStatus(null));
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { status, refetch };
}
