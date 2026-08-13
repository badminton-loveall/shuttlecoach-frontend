import React, { useState, useMemo } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import StatCard from '../components/StatCard';
import { useLedger } from '../hooks/useLedger';
import type { CreateLedgerEntryData } from '../hooks/useLedger';

/**
 * LedgerPage
 * Financial ledger page for Head Coach — tracks income and expenses.
 * Displays summary cards, filterable ledger table, and manual entry creation.
 */

// --- Helpers ---

const CATEGORIES = [
  'Extra Classes',
  'Coach Bonus',
  'Equipment',
  'Facility',
  'Tournament',
  'Miscellaneous',
] as const;

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getQuarterStart(): string {
  const now = new Date();
  const quarterMonth = Math.floor(now.getMonth() / 3) * 3 + 1;
  return `${now.getFullYear()}-${String(quarterMonth).padStart(2, '0')}`;
}

function getFYStart(): string {
  const now = new Date();
  // Indian financial year starts April
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-04`;
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// --- Add Entry Modal ---

interface AddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLedgerEntryData) => Promise<void>;
}

const AddEntryModal: React.FC<AddEntryModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [entryType, setEntryType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [amount, setAmount] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const resetForm = () => {
    setEntryType('CREDIT');
    setAmount('');
    setTransactionDate(new Date().toISOString().slice(0, 10));
    setDescription('');
    setCategory('');
    setFormError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const numAmount = parseFloat(amount);
    if (!description.trim()) {
      setFormError('Description is required.');
      return;
    }
    if (!numAmount || numAmount <= 0) {
      setFormError('Please enter a valid amount greater than 0.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        entry_type: entryType,
        amount: numAmount,
        transaction_date: transactionDate,
        description: description.trim(),
        category: category || undefined,
      });
      handleClose();
    } catch {
      setFormError('Failed to create entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Add Ledger Entry</h2>
          <button className="modal-close-btn" onClick={handleClose} title="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {formError && (
            <div className="form-error" style={{ marginBottom: 'var(--space-md)', color: 'var(--color-danger-text)', fontSize: 'var(--text-sm)' }}>
              {formError}
            </div>
          )}

          {/* Entry Type Toggle */}
          <div className="form-group">
            <label className="form-label">Type</label>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <button
                type="button"
                className={`btn-base ${entryType === 'CREDIT' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setEntryType('CREDIT')}
                style={{ flex: 1 }}
              >
                Credit
              </button>
              <button
                type="button"
                className={`btn-base ${entryType === 'DEBIT' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setEntryType('DEBIT')}
                style={{ flex: 1 }}
              >
                Debit
              </button>
            </div>
          </div>

          {/* Amount */}
          <div className="form-group">
            <label className="form-label" htmlFor="ledger-amount">Amount (₹)</label>
            <input
              id="ledger-amount"
              type="number"
              className="form-input"
              placeholder="0.00"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {/* Date */}
          <div className="form-group">
            <label className="form-label" htmlFor="ledger-date">Date</label>
            <input
              id="ledger-date"
              type="date"
              className="form-input"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="ledger-description">Description</label>
            <input
              id="ledger-description"
              type="text"
              className="form-input"
              placeholder="Enter description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label" htmlFor="ledger-category">Category (optional)</label>
            <select
              id="ledger-category"
              className="form-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">— None —</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="modal-actions" style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end', marginTop: 'var(--space-lg)' }}>
            <button type="button" className="btn-base btn-ghost" onClick={handleClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-base btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Add Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main Page ---

export const LedgerPage: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { entries, summary, loading, error, createEntry } = useLedger(selectedMonth);

  // Quick filter helpers
  const handleThisMonth = () => setSelectedMonth(getCurrentMonth());
  const handleThisQuarter = () => setSelectedMonth(getQuarterStart());
  const handleThisFY = () => setSelectedMonth(getFYStart());

  // Active quick filter detection
  const activeQuickFilter = useMemo(() => {
    if (selectedMonth === getCurrentMonth()) return 'month';
    if (selectedMonth === getQuarterStart()) return 'quarter';
    if (selectedMonth === getFYStart()) return 'fy';
    return null;
  }, [selectedMonth]);

  return (
    <DashboardLayout>
      <div className="hc-dashboard">
        <div className="hc-dashboard-content">
          {/* Page Header */}
          <div className="page-header">
            <div>
              <h1 className="page-header-title">Accounts</h1>
              <p className="page-header-subtitle">Financial ledger — track income and expenses</p>
            </div>
            <div className="page-header-actions">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="btn-base btn-primary"
                title="Add a manual ledger entry"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add Entry
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
              <input
                type="month"
                className="form-input"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{ width: 'auto' }}
              />
              <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                <button
                  className={`btn-base ${activeQuickFilter === 'month' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={handleThisMonth}
                >
                  This Month
                </button>
                <button
                  className={`btn-base ${activeQuickFilter === 'quarter' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={handleThisQuarter}
                >
                  This Quarter
                </button>
                <button
                  className={`btn-base ${activeQuickFilter === 'fy' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={handleThisFY}
                >
                  This FY
                </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="card" style={{ padding: 'var(--space-xl)' }}>
              <div className="animate-pulse flex flex-col" style={{ gap: 'var(--space-md)' }}>
                <div className="h-4 rounded w-3/4" style={{ backgroundColor: 'var(--border-default)' }}></div>
                <div className="h-4 rounded" style={{ backgroundColor: 'var(--border-default)' }}></div>
                <div className="h-4 rounded w-5/6" style={{ backgroundColor: 'var(--border-default)' }}></div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div style={{ backgroundColor: 'var(--feedback-danger-light)', border: '1px solid var(--color-danger-light)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
              <p style={{ color: 'var(--color-danger-text)', fontSize: 'var(--text-sm)' }}>{error}</p>
            </div>
          )}

          {/* Summary Cards */}
          {!loading && (
            <div className="hc-stats-grid">
              <StatCard
                title="Total Credits"
                value={formatINR(summary.totalCredits)}
                label="Income"
                icon={
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                }
                variant="success"
              />
              <StatCard
                title="Total Debits"
                value={formatINR(summary.totalDebits)}
                label="Expenses"
                icon={
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                  </svg>
                }
                variant="danger"
              />
              <StatCard
                title="Net Balance"
                value={formatINR(summary.netBalance)}
                label="Credits − Debits"
                icon={
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M3 12h18M3 18h18" />
                  </svg>
                }
                variant="info"
              />
              <StatCard
                title="Opening Balance"
                value={formatINR(summary.openingBalance)}
                label="Start of period"
                icon={
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                }
                variant="primary"
              />
            </div>
          )}

          {/* Ledger Table */}
          {!loading && (
            <div className="hc-overview">
              <div className="card" style={{ overflow: 'auto' }}>
                <table className="table-styled" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Type</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                      <th style={{ textAlign: 'right' }}>Running Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)' }}>
                          No ledger entries for this period.
                        </td>
                      </tr>
                    ) : (
                      entries.map((entry) => (
                        <tr key={entry.id}>
                          <td>{formatDate(entry.transactionDate)}</td>
                          <td>
                            <div>{entry.description}</div>
                            {entry.personName && (
                              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                                {entry.personName}
                              </span>
                            )}
                          </td>
                          <td>
                            <span
                              className={`badge ${entry.entryType === 'CREDIT' ? 'badge--success' : 'badge--danger'}`}
                            >
                              {entry.entryType}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 500 }}>
                            <span style={{ color: entry.entryType === 'CREDIT' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                              {entry.entryType === 'CREDIT' ? '+' : '−'}{formatINR(entry.amount)}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {formatINR(entry.runningBalance)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Add Entry Modal */}
          <AddEntryModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSubmit={createEntry}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LedgerPage;
