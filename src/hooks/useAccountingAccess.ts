import { useCallback, useEffect, useState } from 'react';
import apiClient from '../utils/apiClient';
import type { CenterSubscription } from '../types';

export interface AccountingAccessInfo {
  /**
   * Whether the current center has an active Accounting Section subscription.
   * Gates the entire Finance menu — Fees, Accounts, Salaries — not just the
   * ledger page. Defaults to true (fails open) so a marketplace hiccup never
   * blocks a center that's actually subscribed; the backend still enforces
   * the real gate on every Finance route regardless of what the client shows.
   */
  hasAccess: boolean;
  /** The center's ACCOUNTING subscription row, if it has one (active or not). */
  subscription: CenterSubscription | null;
  refetch: () => void;
}

/**
 * `enabled` skips the fetch for callers that never show Finance UI (e.g. a
 * STUDENT rendering the top nav) — the endpoint is coach-only, so a student
 * session would otherwise draw a guaranteed 403 on every page.
 */
export function useAccountingAccess(enabled: boolean = true): AccountingAccessInfo {
  const [hasAccess, setHasAccess] = useState(true);
  const [subscription, setSubscription] = useState<CenterSubscription | null>(null);

  const refetch = useCallback(() => {
    if (!enabled) return;
    apiClient
      .get<CenterSubscription[]>('/marketplace/my-subscriptions')
      .then((res) => {
        const sub = res.data.find((s) => s.itemCategory === 'ACCOUNTING') ?? null;
        setSubscription(sub);
        setHasAccess(!!sub);
      })
      .catch(() => setHasAccess(true));
  }, [enabled]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { hasAccess, subscription, refetch };
}
