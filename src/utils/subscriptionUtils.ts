import type { CenterSubscription } from '../types';

/**
 * A free (₹0) subscription only counts as a "trial" when it also carries an
 * expiry — a permanent free baseline (no duration_days on the catalog item)
 * never expires and has nothing to upgrade away from.
 */
export interface TrialInfo {
  expiresAt: string;
  daysRemaining: number;
  expired: boolean;
}

export function getTrialInfo(sub: Pick<CenterSubscription, 'pricePaid' | 'expiresAt'>): TrialInfo | null {
  if (sub.pricePaid !== 0 || !sub.expiresAt) return null;

  const msRemaining = new Date(sub.expiresAt).getTime() - Date.now();
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

  return {
    expiresAt: sub.expiresAt,
    daysRemaining,
    expired: msRemaining <= 0,
  };
}

export function formatTrialLabel(trial: TrialInfo): string {
  const dateStr = new Date(trial.expiresAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  if (trial.expired) {
    return `Trial ended ${dateStr}`;
  }
  if (trial.daysRemaining <= 0) {
    return `Trial ends today`;
  }
  if (trial.daysRemaining === 1) {
    return `Trial ends tomorrow (${dateStr})`;
  }
  return `Trial ends in ${trial.daysRemaining} days (${dateStr})`;
}
