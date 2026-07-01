/**
 * useFees Hook
 * Manages fee record CRUD operations with API backend.
 * Requirements: 31.7, 31.8, 30.1, 30.2
 *
 * - Fetches fees from API with filtering
 * - Creates new fee records
 * - Marks fees as paid with payment details
 * - Waives fees with reason
 * - Server auto-detects overdue status
 */

import { useState, useEffect, useCallback } from 'react';
import type { FeeRecord, FeeStatus } from '../types';
import apiClient from '../utils/apiClient';

export interface CreateFeeData {
  studentId: string;
  amount: number;
  monthYear: string;
  dueDate: string | Date;
  notes?: string;
}

export interface MarkPaidData {
  paidDate: string | Date;
  paymentMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER';
  transactionRef?: string;
  notes?: string;
}

export interface WaiveFeeData {
  reason: string;
}

export interface FeeFilters {
  studentId?: string;
  status?: FeeStatus;
  monthYear?: string;
}

/**
 * Parse a fee record from API response, ensuring Date fields are proper Date objects.
 */
function parseFeeDates(raw: Record<string, unknown>): FeeRecord {
  return {
    ...raw,
    dueDate: new Date(raw.dueDate as string),
    paidDate: raw.paidDate ? new Date(raw.paidDate as string) : undefined,
    createdAt: new Date(raw.createdAt as string),
    updatedAt: new Date(raw.updatedAt as string),
  } as FeeRecord;
}

/**
 * Hook providing fee management operations with API backend.
 */
export function useFees(filters?: FeeFilters) {
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch fees from API
   */
  const fetchFees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (filters?.studentId) params.append('studentId', filters.studentId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.monthYear) params.append('monthYear', filters.monthYear);

      const response = await apiClient.get<FeeRecord[]>(`/fees?${params.toString()}`);
      
      // Parse date fields
      const parsedFees = response.data.map((f) =>
        parseFeeDates(f as unknown as Record<string, unknown>)
      );

      setFees(parsedFees);
    } catch (err) {
      console.error('Failed to fetch fees:', err);
      setError('Failed to load fees. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch fees on mount and when filters change
  useEffect(() => {
    void fetchFees();
  }, [fetchFees]);

  /**
   * Create a new fee record via API.
   */
  const createFee = useCallback(
    async (data: CreateFeeData): Promise<FeeRecord> => {
      try {
        // Convert Date to ISO string if needed
        const payload = {
          ...data,
          dueDate: data.dueDate instanceof Date ? data.dueDate.toISOString() : data.dueDate,
        };

        const response = await apiClient.post<FeeRecord>('/fees', payload);
        const newFee = parseFeeDates(response.data as unknown as Record<string, unknown>);

        // Refresh the fees list
        await fetchFees();

        return newFee;
      } catch (err) {
        console.error('Failed to create fee:', err);
        throw err;
      }
    },
    [fetchFees]
  );

  /**
   * Mark a fee as paid via API.
   */
  const markFeeAsPaid = useCallback(
    async (id: string, data: MarkPaidData): Promise<FeeRecord> => {
      try {
        // Convert Date to ISO string if needed
        const payload = {
          ...data,
          paidDate: data.paidDate instanceof Date ? data.paidDate.toISOString() : data.paidDate,
        };

        const response = await apiClient.patch<FeeRecord>(`/fees/${id}/pay`, payload);
        const updatedFee = parseFeeDates(response.data as unknown as Record<string, unknown>);

        // Refresh the fees list
        await fetchFees();

        return updatedFee;
      } catch (err) {
        console.error(`Failed to mark fee ${id} as paid:`, err);
        throw err;
      }
    },
    [fetchFees]
  );

  /**
   * Waive a fee via API.
   */
  const waiveFee = useCallback(
    async (id: string, data: WaiveFeeData): Promise<FeeRecord> => {
      try {
        const response = await apiClient.patch<FeeRecord>(`/fees/${id}/waive`, data);
        const updatedFee = parseFeeDates(response.data as unknown as Record<string, unknown>);

        // Refresh the fees list
        await fetchFees();

        return updatedFee;
      } catch (err) {
        console.error(`Failed to waive fee ${id}:`, err);
        throw err;
      }
    },
    [fetchFees]
  );

  return {
    fees,
    loading,
    error,
    createFee,
    markFeeAsPaid,
    waiveFee,
    refetch: fetchFees,
  };
}
