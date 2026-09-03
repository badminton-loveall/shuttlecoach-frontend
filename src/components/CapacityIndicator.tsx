import React, { useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';
import type { MarketplaceItem } from '../types';

/**
 * Shows a center's current headcount against its Coach/Student Capacity
 * plan, right on the Coaches/Students pages — where adding one actually
 * happens — rather than only in the Subscriptions tab. A quiet "used" count
 * under the limit; once at the limit, an upgrade banner with the paid tiers
 * that would raise it, so upgrading never requires leaving the page.
 */

const formatPrice = (price: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

interface Props {
  category: 'COACH_CAPACITY' | 'STUDENT_CAPACITY';
  count: number;
  limit: number;
  label: string;
  onUpgraded?: () => void;
}

export const CapacityIndicator: React.FC<Props> = ({ category, count, limit, label, onUpgraded }) => {
  const atLimit = count >= limit;

  const [alternatives, setAlternatives] = useState<MarketplaceItem[]>([]);
  const [isPicking, setIsPicking] = useState(false);
  const [upgradingId, setUpgradingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!atLimit) return;
    apiClient
      .get<MarketplaceItem[]>('/marketplace/items')
      .then((res) =>
        setAlternatives(
          res.data.filter((i) => i.category === category && i.capacityLimit != null && i.capacityLimit > limit)
        )
      )
      .catch(() => setAlternatives([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atLimit, category, limit]);

  if (!atLimit) {
    return (
      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
        {label}: {count}/{limit} used
      </span>
    );
  }

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
        backgroundColor: 'var(--feedback-warning-light)',
        border: '1px solid var(--color-warning-light)',
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
        <p style={{ fontWeight: 600, color: 'var(--color-warning-text)' }}>
          {label} limit reached ({count}/{limit})
        </p>
        <p className="text-sm" style={{ color: 'var(--color-warning-text)' }}>
          Upgrade your {label} Capacity plan to add more.
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
            Upgrade to Add More
          </button>
        ))}
    </div>
  );
};

export default CapacityIndicator;
