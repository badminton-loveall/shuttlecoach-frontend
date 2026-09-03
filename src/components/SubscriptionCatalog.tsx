import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../utils/apiClient';
import type { MarketplaceItem, CenterSubscription, MarketplaceItemCategory } from '../types';
import { getTrialInfo, formatTrialLabel } from '../utils/subscriptionUtils';
import '../styles/pages.css';

/**
 * SubscriptionCatalog Component
 * Recurring add-ons only — Accounting and capacity tiers. Drill packs are a
 * one-time purchase and live in the Marketplace tab instead, alongside the
 * rest of the drill-set browsing/adopting experience.
 * A free (₹0) item activates the instant you click Enable — no admin step.
 * A paid item creates a request that shows up in the admin's approval queue.
 * Lives as the "Subscriptions" tab under Settings, alongside Marketplace.
 */

const CATEGORY_LABEL: Record<Exclude<MarketplaceItemCategory, 'DRILL_PACK'>, string> = {
  ACCOUNTING: 'Accounting',
  STUDENT_CAPACITY: 'Student Capacity',
  COACH_CAPACITY: 'Coach Capacity',
};

const formatPrice = (price: number): string =>
  price === 0
    ? 'Free'
    : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

export const SubscriptionCatalog: React.FC = () => {
  const [catalog, setCatalog] = useState<MarketplaceItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<CenterSubscription[]>([]);
  const [requests, setRequests] = useState<CenterSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [subscribingId, setSubscribingId] = useState<string | null>(null);
  const [upgradingSub, setUpgradingSub] = useState<CenterSubscription | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catalogRes, subsRes, requestsRes] = await Promise.all([
        apiClient.get<MarketplaceItem[]>('/marketplace/items'),
        apiClient.get<CenterSubscription[]>('/marketplace/my-subscriptions'),
        apiClient.get<CenterSubscription[]>('/marketplace/my-requests'),
      ]);
      setCatalog(catalogRes.data.filter((item) => item.category !== 'DRILL_PACK'));
      setSubscriptions(subsRes.data.filter((sub) => sub.itemCategory !== 'DRILL_PACK'));
      setRequests(requestsRes.data.filter((req) => req.itemCategory !== 'DRILL_PACK'));
    } catch {
      setError('The marketplace is unavailable right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const activeItemIds = new Set(subscriptions.map((s) => s.marketplaceItemId));
  const pendingItemIds = new Set(requests.map((r) => r.marketplaceItemId));

  const handleSubscribe = async (item: MarketplaceItem) => {
    setSubscribingId(item.id);
    setError(null);
    try {
      const response = await apiClient.post<{ autoActivated: boolean }>('/marketplace/subscribe', {
        marketplaceItemId: item.id,
      });
      setSuccessMessage(
        response.data.autoActivated
          ? `"${item.name}" is active now.`
          : `Request sent for "${item.name}" — your admin will review it.`
      );
      await fetchData();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      setError(message || 'Failed to subscribe to this item.');
    } finally {
      setSubscribingId(null);
    }
  };

  const grouped = catalog.reduce<Record<string, MarketplaceItem[]>>((acc, item) => {
    (acc[item.category] ||= []).push(item);
    return acc;
  }, {});

  const paidAlternativesFor = (category?: MarketplaceItemCategory): MarketplaceItem[] =>
    catalog.filter((item) => item.category === category && item.price > 0 && item.isEnabled);

  const handleUpgrade = async (item: MarketplaceItem) => {
    await handleSubscribe(item);
    setUpgradingSub(null);
  };

  return (
    <div>
      <p className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
        Recurring add-ons available to your center — Accounting and capacity tiers. Looking for drill packs?
        They're a one-time purchase, over in the Marketplace tab.
      </p>

      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-md text-sm mb-4">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md text-sm mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="card p-6 text-center text-[var(--text-secondary)]">Loading marketplace...</div>
      ) : (
        <>
          {subscriptions.length > 0 && (
            <div className="card-base" style={{ marginBottom: 'var(--space-lg)', padding: 'var(--space-md)' }}>
              <h2 className="card-title" style={{ marginBottom: 'var(--space-sm)' }}>
                Active Subscriptions
              </h2>
              <div className="table-container">
                <table className="table-styled">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Price Paid</th>
                      <th>Started</th>
                      <th>Expires</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((sub) => {
                      const trial = getTrialInfo(sub);
                      const alternatives = trial ? paidAlternativesFor(sub.itemCategory) : [];
                      return (
                        <tr key={sub.id}>
                          <td className="text-bold">{sub.itemName || sub.marketplaceItemId}</td>
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
                            ) : sub.expiresAt ? (
                              <span style={{ color: 'var(--text-secondary)' }}>
                                {new Date(sub.expiresAt).toLocaleDateString()}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-secondary)' }}>Lifetime</span>
                            )}
                          </td>
                          <td>
                            {trial && alternatives.length > 0 && (
                              <button
                                className="btn btn-primary text-sm"
                                style={{ width: 'auto' }}
                                onClick={() => setUpgradingSub(sub)}
                              >
                                Upgrade to Paid
                              </button>
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

          {(Object.keys(grouped) as Exclude<MarketplaceItemCategory, 'DRILL_PACK'>[]).map((category) => (
            <div key={category} style={{ marginBottom: 'var(--space-lg)' }}>
              <h2 className="card-title" style={{ marginBottom: 'var(--space-sm)' }}>
                {CATEGORY_LABEL[category]}
              </h2>
              <div className="marketplace-grid">
                {grouped[category].map((item) => {
                  const isActive = activeItemIds.has(item.id);
                  const isPending = pendingItemIds.has(item.id);
                  return (
                    <div key={item.id} className="card-base flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <h3 className="card-title" style={{ marginBottom: 0, fontSize: 'var(--font-base)' }}>
                          {item.name}
                        </h3>
                        {isActive && <span className="badge-base badge-primary">Active</span>}
                        {isPending && <span className="badge-base badge-secondary">Requested</span>}
                      </div>
                      <p className="card-description" style={{ flex: 1 }}>
                        {item.description || 'No description provided.'}
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className={item.price === 0 ? 'text-bold' : 'font-semibold'}>
                            {formatPrice(item.price)}
                            {item.price > 0 && item.billingPeriod === 'MONTHLY' && (
                              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                /mo
                              </span>
                            )}
                          </span>
                          {item.billingPeriod === 'ONE_TIME' && (
                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              One-time purchase
                            </div>
                          )}
                          {item.durationDays && (
                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {item.durationDays}-day trial
                            </div>
                          )}
                        </div>
                        {!isActive && !isPending && (
                          <button
                            className="btn btn-primary text-sm"
                            style={{ width: 'auto' }}
                            onClick={() => handleSubscribe(item)}
                            disabled={subscribingId === item.id}
                          >
                            {subscribingId === item.id
                              ? 'Working...'
                              : item.price === 0
                                ? 'Enable'
                                : item.billingPeriod === 'ONE_TIME'
                                  ? 'Buy'
                                  : 'Subscribe'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {catalog.length === 0 && (
            <div className="table-filter-section">
              <div className="table-empty">Nothing available in the marketplace right now.</div>
            </div>
          )}

          <p className="text-xs" style={{ marginTop: 'var(--space-md)', color: 'var(--text-secondary)' }}>
            Free items turn on the moment you click Enable. Paid items send a request — your admin activates it
            once payment is confirmed.
          </p>
        </>
      )}

      {upgradingSub && (
        <div className="modal-overlay" onClick={() => setUpgradingSub(null)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Upgrade "{upgradingSub.itemName}"</h2>
              <button className="modal-close-btn" onClick={() => setUpgradingSub(null)} title="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-body space-y-2">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Choose a paid plan to keep this feature after the trial ends.
              </p>
              {paidAlternativesFor(upgradingSub.itemCategory).map((item) => (
                <div
                  key={item.id}
                  className="card-base flex items-center justify-between"
                  style={{ padding: 'var(--space-sm) var(--space-md)' }}
                >
                  <div>
                    <div className="text-bold">{item.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {formatPrice(item.price)}
                      {item.billingPeriod === 'MONTHLY' && '/mo'}
                    </div>
                  </div>
                  <button
                    className="btn btn-primary text-sm"
                    style={{ width: 'auto' }}
                    onClick={() => handleUpgrade(item)}
                    disabled={subscribingId === item.id}
                  >
                    {subscribingId === item.id ? 'Working...' : 'Choose'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionCatalog;
