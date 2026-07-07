/**
 * Financial Calculation Utilities
 *
 * Provides functions for calculating financial summaries for coach income and expenses.
 */

import type { FeeRecord, Expense } from '../types';

/**
 * Financial summary with total calculations
 */
export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
}

/**
 * Calculate financial summary for coach
 *
 * Computes total income from fees (only PAID status), total expenses, and net balance.
 *
 * @param fees - Array of fee records
 * @param expenses - Array of expense records
 * @returns FinancialSummary with totalIncome, totalExpenses, and netBalance
 *
 * **Validates: Requirements 12.4, 16.1**
 */
export const calculateFinancialSummary = (
  fees: FeeRecord[],
  expenses: Expense[]
): FinancialSummary => {
  // Calculate total income from paid fees only
  const totalIncome = fees
    .filter((fee) => fee.status === 'PAID')
    .reduce((sum, fee) => sum + fee.amount, 0);

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  // Calculate net balance
  const netBalance = totalIncome - totalExpenses;

  return {
    totalIncome: parseFloat(totalIncome.toFixed(2)),
    totalExpenses: parseFloat(totalExpenses.toFixed(2)),
    netBalance: parseFloat(netBalance.toFixed(2)),
  };
};
