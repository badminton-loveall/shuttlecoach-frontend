import React, { useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';
import type { CenterSubscription, MarketplaceItem } from '../types';
import { getTrialInfo, formatTrialLabel } from '../utils/subscriptionUtils';

/**
 * Surfaces the Accounting Section's free-trial countdown (and an upgrade
 * path) right on the pages it gates — Fees and Accounts — since that's
 * where a coach actually notices it, rather than only in the Subscriptions
 * tab under Settings they may never visit.
 * Renders nothing once the subscription isn't a trial (no active
 * subscription, or it's a permanent free baseline / already paid).
 */

const formatPrice = (price: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

interface Props {
  subscription: CenterSubscription | null;
  onUpgraded?: () => void;
}

export const AccountingTrialBanner: React.FC<Props> = ({ subscription, onUpgraded }) => {
  const trial = subscription ? getTrialInfo(subscription) : null;

  const [alternatives, setAlternatives] = useState<MarketplaceItem[]>([]);
  const [isPicking, setIsPicking] = useState(false);
  const [upgradingId, setUpgradingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!trial) return;
    apiClient
      .get<MarketplaceItem[]>('/marketplace/items')
      .then((res) => setAlternatives(res.data.filter((i) => i.category === 'ACCOUNTING' && i.price > 0 && i.isEnabled)))
      .catch(() => setAlternatives([]));
    // trial.expiresAt is stable for the life of a given subscription — re-running
    // per render (trial is a freshly computed object each time) would be wasteful.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trial?.expiresAt]);

  if (!trial) return null;

  const handleUpgrade = async (item: MarketplaceItem) => {
    setUpgradingId(item.id);
    setMessage(null);
    try {
      const response = await apiClient.post<{ autoActivated: boolean }>('/marketplace/subscribe', {
        marketplaceItemId: item.id,
      });
      setMessage(
        response.data.autoActivated
          ? `"${item.name}" is active now.`
          : `Request sent for "${item.name}" — your admin will review it.`
      );
      setIsPicking(false);
      onUpgraded?.();
    } catch {
      setMessage('Failed to send the upgrade request. Please try again.');
    } finally {
      setUpgradingId(null);
    }
  };

  return (
    <div
      className="card"
      style={{
        backgroundColor: trial.expired ? 'var(--feedback-danger-light)' : 'var(--feedback-warning-light)',
        border: `1px solid ${trial.expired ? 'var(--color-danger-light)' : 'var(--color-warning-light)'}`,
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-md)',
        marginBottom: 'var(--space-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-md)',
      }}
    >
      <div>
        <p style={{ fontWeight: 600, color: trial.expired ? 'var(--color-danger-text)' : 'var(--color-warning-text)' }}>
          {trial.expired ? 'Your Accounting Section trial has ended' : 'Accounting Section — Free Trial'}
        </p>
        <p className="text-sm" style={{ color: trial.expired ? 'var(--color-danger-text)' : 'var(--color-warning-text)' }}>
          {formatTrialLabel(trial)}
          {trial.expired
            ? ' — upgrade to keep using Fees, Accounts, and Salaries.'
            : ' — upgrade any time to keep access once it ends.'}
        </p>
        {message && (
          <p className="text-xs" style={{ marginTop: 'var(--space-xs)', color: 'var(--text-secondary)' }}>
            {message}
          </p>
        )}
      </div>

      {alternatives.length > 0 &&
        (isPicking ? (
          <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', alignItems: 'center' }}>
            {alternatives.map((item) => (
              <button
                key={item.id}
                className="btn btn-primary text-sm"
                style={{ width: 'auto' }}
                onClick={() => handleUpgrade(item)}
                disabled={upgradingId === item.id}
              >
                {upgradingId === item.id ? 'Working...' : `${item.name} — ${formatPrice(item.price)}/mo`}
              </button>
            ))}
            <button className="btn btn-ghost text-sm" style={{ width: 'auto' }} onClick={() => setIsPicking(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button
            className="btn btn-primary text-sm"
            style={{ width: 'auto', flexShrink: 0 }}
            onClick={() => setIsPicking(true)}
          >
            Upgrade to Paid
          </button>
        ))}
    </div>
  );
};

export default AccountingTrialBanner;
