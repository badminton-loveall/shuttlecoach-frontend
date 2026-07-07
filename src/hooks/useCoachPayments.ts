/**
 * useCoachPayments Hook
 * Manages coach payment records including student fees income and coach expenses.
 * Requirements: 12.1, 13.1, 14.1, 15.1
 *
 * - Fetches fees (income from student fees) from API
 * - Fetches expenses for coach from API
 * - Creates, updates, and deletes expense records
 * - Handles loading and error states for both income and expenses
 * - Provides refetch functionality for data updates
 */

import { useState, useEffect, useCallback } from 'react';
import type { FeeRecord, Expense, ExpenseType } from '../types';
import apiClient from '../utils/apiClient';

export interface CreateExpenseData {
  type: ExpenseType;
  amount: number;
  date: string | Date;
  description: string;
}

export interface UpdateExpenseData {
  type?: ExpenseType;
  amount?: number;
  date?: string | Date;
  description?: string;
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
 * Parse an expense record from API response, ensuring Date fields are proper Date objects.
 */
function parseExpenseDates(raw: Record<string, unknown>): Expense {
  return {
    ...raw,
    date: new Date(raw.date as string),
    createdAt: new Date(raw.createdAt as string),
    updatedAt: new Date(raw.updatedAt as string),
  } as Expense;
}

/**
 * Hook providing coach payment management operations with API backend.
 * Manages both income (student fees) and expenses for a coach.
 */
export function useCoachPayments(coachId: string) {
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch fees (income) from API for the coach
   */
  const fetchFees = useCallback(async () => {
    try {
      const response = await apiClient.get<FeeRecord[]>(`/coaches/${coachId}/fees`);
      
      // Parse date fields
      const parsedFees = response.data.map((f) =>
        parseFeeDates(f as unknown as Record<string, unknown>)
      );

      setFees(parsedFees);
    } catch (err) {
      console.error(`Failed to fetch fees for coach ${coachId}:`, err);
      setError('Failed to load income records. Please try again.');
      throw err;
    }
  }, [coachId]);

  /**
   * Fetch expenses from API for the coach
   */
  const fetchExpenses = useCallback(async () => {
    try {
      const response = await apiClient.get<Expense[]>(`/coaches/${coachId}/expenses`);
      
      // Parse date fields
      const parsedExpenses = response.data.map((e) =>
        parseExpenseDates(e as unknown as Record<string, unknown>)
      );

      setExpenses(parsedExpenses);
    } catch (err) {
      console.error(`Failed to fetch expenses for coach ${coachId}:`, err);
      setError('Failed to load expense records. Please try again.');
      throw err;
    }
  }, [coachId]);

  /**
   * Fetch both fees and expenses, with combined error handling
   */
  const fetchAllPaymentData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch both fees and expenses in parallel
      await Promise.all([fetchFees(), fetchExpenses()]);
    } catch (err) {
      console.error('Failed to fetch payment data:', err);
      setError('Failed to load payment data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchFees, fetchExpenses]);

  // Fetch payment data on mount and when coachId changes
  useEffect(() => {
    void fetchAllPaymentData();
  }, [fetchAllPaymentData]);

  /**
   * Create a new expense record via API
   */
  const addExpense = useCallback(
    async (data: CreateExpenseData): Promise<Expense> => {
      try {
        // Convert Date to ISO string if needed
        const payload = {
          ...data,
          date: data.date instanceof Date ? data.date.toISOString() : data.date,
        };

        const response = await apiClient.post<Expense>(
          `/coaches/${coachId}/expenses`,
          payload
        );
        const newExpense = parseExpenseDates(response.data as unknown as Record<string, unknown>);

        // Refresh expenses list
        await fetchExpenses();

        return newExpense;
      } catch (err) {
        console.error('Failed to add expense:', err);
        throw err;
      }
    },
    [coachId, fetchExpenses]
  );

  /**
   * Update an existing expense record via API
   */
  const updateExpense = useCallback(
    async (expenseId: string, data: UpdateExpenseData): Promise<Expense> => {
      try {
        // Convert Date to ISO string if needed
        const payload = {
          ...data,
          ...(data.date && {
            date: data.date instanceof Date ? data.date.toISOString() : data.date,
          }),
        };

        const response = await apiClient.patch<Expense>(
          `/coaches/${coachId}/expenses/${expenseId}`,
          payload
        );
        const updatedExpense = parseExpenseDates(
          response.data as unknown as Record<string, unknown>
        );

        // Refresh expenses list
        await fetchExpenses();

        return updatedExpense;
      } catch (err) {
        console.error(`Failed to update expense ${expenseId}:`, err);
        throw err;
      }
    },
    [coachId, fetchExpenses]
  );

  /**
   * Delete an expense record via API
   */
  const deleteExpense = useCallback(
    async (expenseId: string): Promise<void> => {
      try {
        await apiClient.delete(`/coaches/${coachId}/expenses/${expenseId}`);

        // Refresh expenses list
        await fetchExpenses();
      } catch (err) {
        console.error(`Failed to delete expense ${expenseId}:`, err);
        throw err;
      }
    },
    [coachId, fetchExpenses]
  );

  /**
   * Refetch all payment data (manual refresh)
   */
  const refetch = useCallback(async () => {
    try {
      setError(null);
      await fetchAllPaymentData();
    } catch (err) {
      // Error already handled in fetchAllPaymentData
      console.error('Refetch failed:', err);
    }
  }, [fetchAllPaymentData]);

  return {
    fees,
    expenses,
    isLoading,
    error,
    refetch,
    addExpense,
    updateExpense,
    deleteExpense,
  };
}
