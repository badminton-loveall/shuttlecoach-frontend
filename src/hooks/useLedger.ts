/**
 * useLedger Hook
 * Fetches ledger entries and summary from the API with month filtering.
 * Supports creating manual ledger entries.
 */

import { useState, useEffect, useCallback } from 'react';
import apiClient from '../utils/apiClient';

// --- Types ---

export interface LedgerEntry {
  id: string;
  entryType: 'CREDIT' | 'DEBIT';
  amount: number;
  transactionDate: string;
  description: string;
  referenceType: 'FEE' | 'SALARY' | 'MANUAL';
  personName: string | null;
  category: string | null;
  runningBalance: number;
}

export interface LedgerSummary {
  totalCredits: number;
  totalDebits: number;
  netBalance: number;
  openingBalance: number;
}

export interface LedgerResponse {
  entries: LedgerEntry[];
  summary: LedgerSummary;
}

export interface CreateLedgerEntryData {
  entry_type: 'CREDIT' | 'DEBIT';
  amount: number;
  transaction_date: string; // YYYY-MM-DD
  description: string;
  category?: string;
}

/**
 * Hook providing ledger data and manual entry creation.
 */
export function useLedger(month: string) {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [summary, setSummary] = useState<LedgerSummary>({
    totalCredits: 0,
    totalDebits: 0,
    netBalance: 0,
    openingBalance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLedger = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (month) params.append('month', month);

      const response = await apiClient.get<LedgerResponse>(`/ledger?${params.toString()}`);

      setEntries(response.data.entries);
      setSummary(response.data.summary);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr?.response?.status === 403) {
        setEntries([]);
        setSummary({ totalCredits: 0, totalDebits: 0, netBalance: 0, openingBalance: 0 });
      } else {
        console.error('Failed to fetch ledger:', err);
        setError('Failed to load ledger data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void fetchLedger();
  }, [fetchLedger]);

  const createEntry = useCallback(
    async (data: CreateLedgerEntryData): Promise<void> => {
      try {
        await apiClient.post('/ledger/entries', data);
        await fetchLedger();
      } catch (err) {
        console.error('Failed to create ledger entry:', err);
        throw err;
      }
    },
    [fetchLedger]
  );

  return {
    entries,
    summary,
    loading,
    error,
    createEntry,
    refetch: fetchLedger,
  };
}
