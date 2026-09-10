import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../utils/apiClient';
import type { CoachRoyalty, CoachRoyaltyTotals } from '../../types';
import '../../styles/pages.css';

/**
 * AdminPayoutsPage
 * Coach royalties — 60% of every paid sale of a coach-authored (non-official)
 * drill pack goes to the coach who created it, 40% stays with the platform.
 * Recurring: every center that later subscribes to the same pack adds
 * another entry, so a popular pack keeps earning its creator. Payouts
 * happen offline (bank transfer, UPI, etc.) — this page is the ledger:
 * admin sees what's owed per coach and marks it paid once sent.
 */

const formatPrice = (price: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const AdminPayoutsPage: React.FC = () => {
  const [totals, setTotals] = useState<CoachRoyaltyTotals[]>([]);
  const [entries, setEntries] = useState<CoachRoyalty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [expandedCoachId, setExpandedCoachId] = useState<string | null>(null);
  const [payingCoachId, setPayingCoachId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [totalsRes, entriesRes] = await Promise.all([
        apiClient.get<{ totals: CoachRoyaltyTotals[] }>('/admin/coach-royalties/totals'),
        apiClient.get<{ entries: CoachRoyalty[] }>('/admin/coach-royalties'),
      ]);
      setTotals(totalsRes.data.totals);
      setEntries(entriesRes.data.entries);
    } catch {
      setError('Failed to load payouts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handlePayOut = async (coach: CoachRoyaltyTotals) => {
    const confirmed = window.confirm(
      `Mark ${formatPrice(coach.pendingAmount)} as paid to ${coach.coachName}? This only records that you've sent it — it doesn't move any money.`
    );
    if (!confirmed) return;
    setPayingCoachId(coach.coachUserId);
    try {
      await apiClient.post(`/admin/coach-royalties/${coach.coachUserId}/pay`, {});
      setSuccessMessage(`Marked ${formatPrice(coach.pendingAmount)} as paid to ${coach.coachName}.`);
      await fetchData();
    } catch {
      setError('Failed to record the payout.');
    } finally {
      setPayingCoachId(null);
    }
  };

  const totalPending = totals.reduce((sum, t) => sum + t.pendingAmount, 0);
  const totalPaid = totals.reduce((sum, t) => sum + t.paidAmount, 0);

  return (
    <div className="space-y-4">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Payouts</h1>
          <p className="admin-page-subtitle">
            Coach royalties — 60% of every pack sale goes to the coach who created it, recurring for as long as
            centers keep subscribing. Payouts happen offline; mark them paid here once sent.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-md text-sm">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchData} className="btn btn-secondary text-xs ml-2">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="card p-6 text-center text-[var(--text-secondary)]">Loading...</div>
      ) : (
        <>
          <div className="hc-stats-grid">
            <div className="card-base" style={{ padding: 'var(--space-md)' }}>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Owed to Coaches (unpaid)</span>
              <div className="text-bold" style={{ fontSize: 'var(--font-lg)' }}>{formatPrice(totalPending)}</div>
            </div>
            <div className="card-base" style={{ padding: 'var(--space-md)' }}>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Paid Out (all time)</span>
              <div className="text-bold" style={{ fontSize: 'var(--font-lg)' }}>{formatPrice(totalPaid)}</div>
            </div>
            <div className="card-base" style={{ padding: 'var(--space-md)' }}>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Platform Share (40%, all time)</span>
              <div className="text-bold" style={{ fontSize: 'var(--font-lg)' }}>
                {formatPrice(entries.reduce((sum, e) => sum + e.platformAmount, 0))}
              </div>
            </div>
          </div>

          {totals.length === 0 ? (
            <div className="table-filter-section">
              <div className="table-empty">No royalties yet — they show up here once a coach's pack sells.</div>
            </div>
          ) : (
            <div className="table-filter-section">
              <div className="table-container">
                <table className="table-styled">
                  <thead>
                    <tr>
                      <th>Coach</th>
                      <th>Sales</th>
                      <th>Pending</th>
                      <th>Paid</th>
                      <th>Lifetime</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {totals.map((coach) => (
                      <React.Fragment key={coach.coachUserId}>
                        <tr
                          onClick={() => setExpandedCoachId(expandedCoachId === coach.coachUserId ? null : coach.coachUserId)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td className="text-bold">{coach.coachName}</td>
                          <td>{coach.saleCount}</td>
                          <td className={coach.pendingAmount > 0 ? 'text-bold' : undefined}>
                            {formatPrice(coach.pendingAmount)}
                          </td>
                          <td className="text-muted">{formatPrice(coach.paidAmount)}</td>
                          <td className="text-muted">{formatPrice(coach.lifetimeAmount)}</td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <button
                              className="btn btn-primary text-xs"
                              disabled={coach.pendingAmount === 0 || payingCoachId === coach.coachUserId}
                              onClick={() => handlePayOut(coach)}
                            >
                              {payingCoachId === coach.coachUserId ? 'Recording...' : 'Mark Paid'}
                            </button>
                          </td>
                        </tr>
                        {expandedCoachId === coach.coachUserId && (
                          <tr>
                            <td colSpan={6} style={{ background: 'var(--surface-muted)', padding: 0 }}>
                              <div style={{ padding: 'var(--space-md)' }}>
                                {entries.filter((e) => e.coachUserId === coach.coachUserId).length === 0 ? (
                                  <p className="text-xs text-[var(--text-secondary)]">No entries.</p>
                                ) : (
                                  <table className="table-styled">
                                    <thead>
                                      <tr>
                                        <th>Date</th>
                                        <th>Pack</th>
                                        <th>Bought By</th>
                                        <th>Sale</th>
                                        <th>Coach Share</th>
                                        <th>Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {entries
                                        .filter((e) => e.coachUserId === coach.coachUserId)
                                        .map((e) => (
                                          <tr key={e.id}>
                                            <td>{formatDate(e.createdAt)}</td>
                                            <td>{e.drillSetName}</td>
                                            <td>{e.purchasingCenterName}</td>
                                            <td>{formatPrice(e.saleAmount)}</td>
                                            <td className="text-bold">{formatPrice(e.coachAmount)}</td>
                                            <td>
                                              <span className={`table-badge ${e.status === 'PAID' ? 'table-badge--success' : 'table-badge--pending'}`}>
                                                {e.status === 'PAID' ? 'Paid' : 'Pending'}
                                              </span>
                                            </td>
                                          </tr>
                                        ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminPayoutsPage;
