import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../utils/apiClient';
import '../styles/pages.css';

/**
 * AdminCenterAccounting Component
 * Read-only view of one center's ledger for the admin — platform oversight,
 * not gated by that center's own Accounting Section subscription (that gate
 * is for the center's own coaches, not the platform admin).
 */

interface LedgerEntry {
  id: string;
  entryType: 'CREDIT' | 'DEBIT';
  amount: number;
  transactionDate: string;
  description: string;
  referenceType: 'FEE' | 'SALARY' | 'MANUAL' | 'SUBSCRIPTION';
}

interface LedgerSummary {
  totalCredits: number;
  totalDebits: number;
  netBalance: number;
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const formatPrice = (price: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

export const AdminCenterAccounting: React.FC<{ centerId: string }> = ({ centerId }) => {
  const [month, setMonth] = useState(getCurrentMonth());
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [summary, setSummary] = useState<LedgerSummary>({ totalCredits: 0, totalDebits: 0, netBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<{ entries: LedgerEntry[]; summary: LedgerSummary }>('/ledger', {
        params: { center_id: centerId, month },
      });
      setEntries(response.data.entries);
      setSummary(response.data.summary);
    } catch {
      setError('Failed to load this center’s accounting data.');
    } finally {
      setLoading(false);
    }
  }, [centerId, month]);

  useEffect(() => {
    void fetchLedger();
  }, [fetchLedger]);

  return (
    <div>
      <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-md)' }}>
        <input
          type="month"
          className="form-input"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={{ width: 'auto' }}
        />
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md text-sm mb-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="card p-6 text-center text-[var(--text-secondary)]">Loading...</div>
      ) : (
        <>
          <div className="hc-stats-grid" style={{ marginBottom: 'var(--space-md)' }}>
            <div className="card-base" style={{ padding: 'var(--space-md)' }}>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Credits
              </span>
              <div className="text-bold" style={{ fontSize: 'var(--font-lg)' }}>
                {formatPrice(summary.totalCredits)}
              </div>
            </div>
            <div className="card-base" style={{ padding: 'var(--space-md)' }}>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Debits
              </span>
              <div className="text-bold" style={{ fontSize: 'var(--font-lg)' }}>
                {formatPrice(summary.totalDebits)}
              </div>
            </div>
            <div className="card-base" style={{ padding: 'var(--space-md)' }}>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Net Balance
              </span>
              <div className="text-bold" style={{ fontSize: 'var(--font-lg)' }}>
                {formatPrice(summary.netBalance)}
              </div>
            </div>
          </div>

          {entries.length === 0 ? (
            <div className="table-filter-section">
              <div className="table-empty">No ledger entries for this period.</div>
            </div>
          ) : (
            <div className="table-filter-section">
              <div className="table-container">
                <table className="table-styled">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Type</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.id}>
                        <td className="text-muted">{new Date(entry.transactionDate).toLocaleDateString()}</td>
                        <td>{entry.description}</td>
                        <td>
                          <span className="badge-base badge-secondary">{entry.referenceType}</span>
                        </td>
                        <td className={entry.entryType === 'CREDIT' ? 'text-bold' : undefined}>
                          {entry.entryType === 'CREDIT' ? '+' : '-'}
                          {formatPrice(entry.amount)}
                        </td>
                      </tr>
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

export default AdminCenterAccounting;
