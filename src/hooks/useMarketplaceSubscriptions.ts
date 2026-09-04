import { useEffect, useState } from 'react';
import apiClient from '../utils/apiClient';
import type { CenterSubscription } from '../types';

/** The center's active marketplace subscriptions, across every category. */
export function useMarketplaceSubscriptions(): { subscriptions: CenterSubscription[]; loading: boolean } {
  const [subscriptions, setSubscriptions] = useState<CenterSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<CenterSubscription[]>('/marketplace/my-subscriptions')
      .then((res) => setSubscriptions(res.data))
      .catch(() => setSubscriptions([]))
      .finally(() => setLoading(false));
  }, []);

  return { subscriptions, loading };
}
