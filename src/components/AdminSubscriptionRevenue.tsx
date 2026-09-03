import React, { useState, useEffect, useCallback } from 'react';
import type { ItemRevenue, CenterSubscription, SubscriptionStatus } from '../types';
import apiClient from '../utils/apiClient';
import { getTrialInfo, formatTrialLabel } from '../utils/subscriptionUtils';
import '../styles/pages.css';

/**
 * AdminSubscriptionRevenue Component
 * Two views: which catalog items earn the most (all-time revenue collected,
 * cancelled subscriptions included since they still generated real income),
 * and every center's subscription history with what they paid.
 */

const formatPrice = (price: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

const STATUS_BADGE_CLASS: Record<SubscriptionStatus, string> = {
  ACTIVE: 'table-badge--success',
  PENDING: 'table-badge--pending',
  EXPIRED: 'table-badge--waived',
  CANCELLED: 'table-badge--overdue',
  REJECTED: 'table-badge--overdue',
};

export const AdminSubscriptionRevenue: React.FC = () => {
  const [byItem, setByItem] = useState<ItemRevenue[]>([]);
  const [byCenter, setByCenter] = useState<CenterSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<{ byItem: ItemRevenue[]; byCenter: CenterSubscription[] }>(
        '/admin/subscription-analytics'
      );
      setByItem(response.data.byItem);
      setByCenter(response.data.byCenter);
    } catch {
      setError('Failed to load subscription analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  const totalRevenue = byItem.reduce((sum, item) => sum + item.totalRevenue, 0);

  if (loading) {
    return <div className="card p-6 text-center text-[var(--text-secondary)]">Loading analytics...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md text-sm flex items-center justify-between">
        <span>{error}</span>
        <button onClick={fetchAnalytics} className="btn btn-secondary text-xs ml-2">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card-base" style={{ padding: 'var(--space-md)' }}>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Total revenue collected, all items, all-time
        </span>
        <div className="text-bold" style={{ fontSize: 'var(--font-lg)' }}>
          {formatPrice(totalRevenue)}
        </div>
      </div>

      <div>
        <h2 className="card-title" style={{ marginBottom: 'var(--space-sm)' }}>
          Revenue by Item
        </h2>
        <div className="table-filter-section">
          <div className="table-container">
            <table className="table-styled">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Active Subscribers</th>
                  <th>Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {byItem.map((item) => (
                  <tr key={item.itemId}>
                    <td className="text-bold">{item.itemName}</td>
                    <td>
                      <span className="badge-base badge-secondary">{item.category}</span>
                    </td>
                    <td>{item.price === 0 ? 'Free' : formatPrice(item.price)}</td>
                    <td>{item.activeCount}</td>
                    <td className={item.totalRevenue > 0 ? 'text-bold' : 'text-muted'}>
                      {formatPrice(item.totalRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div>
        <h2 className="card-title" style={{ marginBottom: 'var(--space-sm)' }}>
          Subscriptions by Center
        </h2>
        {byCenter.length === 0 ? (
          <div className="table-filter-section">
            <div className="table-empty">No center has subscribed to anything yet.</div>
          </div>
        ) : (
          <div className="table-filter-section">
            <div className="table-container">
              <table className="table-styled">
                <thead>
                  <tr>
                    <th>Center</th>
                    <th>Item</th>
                    <th>Status</th>
                    <th>Price Paid</th>
                    <th>Started</th>
                    <th>Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {byCenter.map((sub) => {
                    const trial = getTrialInfo(sub);
                    return (
                      <tr key={sub.id}>
                        <td className="text-bold">{sub.centerName}</td>
                        <td>{sub.itemName}</td>
                        <td>
                          <span className={`table-badge ${STATUS_BADGE_CLASS[sub.status]}`}>{sub.status}</span>
                        </td>
                        <td>{formatPrice(sub.pricePaid)}</td>
                        <td className="text-muted">{new Date(sub.startedAt).toLocaleDateString()}</td>
                        <td>
                          {trial ? (
                            <span
                              className={`badge-base ${trial.expired ? 'badge-danger' : 'badge-warning'}`}
                              title={new Date(trial.expiresAt).toLocaleString()}
                            >
                              {formatTrialLabel(trial)}
                            </span>
                          ) : (
                            <span className="text-muted">
                              {sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString() : 'Lifetime'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSubscriptionRevenue;
