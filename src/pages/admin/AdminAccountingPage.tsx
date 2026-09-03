import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../utils/apiClient';
import type { PlatformLedgerSummary } from '../../types';
import '../../styles/pages.css';

/**
 * AdminAccountingPage
 * Every real center's income (student fees, etc.) and expenses (coach
 * salaries, subscription payments, other) in one place, so admin can compare
 * centers at a glance instead of opening each one's own Accounting section.
 */

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const formatPrice = (price: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

export const AdminAccountingPage: React.FC = () => {
  const navigate = useNavigate();
  const [scope, setScope] = useState<'all-time' | 'month'>('all-time');
  const [month, setMonth] = useState(getCurrentMonth());
  const [data, setData] = useState<PlatformLedgerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<PlatformLedgerSummary>('/admin/platform-accounting', {
        params: scope === 'month' ? { month } : {},
      });
      setData(response.data);
    } catch {
      setError('Failed to load platform accounting data.');
    } finally {
      setLoading(false);
    }
  }, [scope, month]);

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  return (
    <div className="space-y-4">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Accounting</h1>
          <p className="admin-page-subtitle">
            Every center's income and expenses in one place — student fees, coach salaries, and subscription
            payments all included.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          className={`btn-base ${scope === 'all-time' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setScope('all-time')}
        >
          All Time
        </button>
        <button
          className={`btn-base ${scope === 'month' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setScope('month')}
        >
          By Month
        </button>
        {scope === 'month' && (
          <input
            type="month"
            className="form-input"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{ width: 'auto' }}
          />
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchSummary} className="btn btn-secondary text-xs ml-2">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="card p-6 text-center text-[var(--text-secondary)]">Loading...</div>
      ) : data ? (
        <>
          <div className="hc-stats-grid">
            <div className="card-base" style={{ padding: 'var(--space-md)' }}>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Total Income (all centers)
              </span>
              <div className="text-bold" style={{ fontSize: 'var(--font-lg)' }}>
                {formatPrice(data.totals.totalCredits)}
              </div>
            </div>
            <div className="card-base" style={{ padding: 'var(--space-md)' }}>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Total Expenses (all centers)
              </span>
              <div className="text-bold" style={{ fontSize: 'var(--font-lg)' }}>
                {formatPrice(data.totals.totalDebits)}
              </div>
            </div>
            <div className="card-base" style={{ padding: 'var(--space-md)' }}>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Net Across Platform
              </span>
              <div
                className="text-bold"
                style={{ fontSize: 'var(--font-lg)', color: data.totals.netBalance < 0 ? 'var(--color-danger, #c0392b)' : undefined }}
              >
                {formatPrice(data.totals.netBalance)}
              </div>
            </div>
          </div>

          {data.centers.length === 0 ? (
            <div className="table-filter-section">
              <div className="table-empty">No centers to show.</div>
            </div>
          ) : (
            <div className="table-filter-section">
              <div className="table-container">
                <table className="table-styled">
                  <thead>
                    <tr>
                      <th>Center</th>
                      <th>Income</th>
                      <th>Expenses</th>
                      <th>Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.centers.map((center) => (
                      <tr
                        key={center.centerId}
                        onClick={() => navigate(`/admin/centers/${center.centerId}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className="text-bold">{center.centerName}</td>
                        <td>{formatPrice(center.totalCredits)}</td>
                        <td>{formatPrice(center.totalDebits)}</td>
                        <td className={center.netBalance < 0 ? undefined : 'text-bold'}>
                          {formatPrice(center.netBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};

export default AdminAccountingPage;
