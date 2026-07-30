/**
 * Fee statistics computation utility
 * Computes summary statistics from an array of fee records
 */

import type { FeeRecord } from '../types';

export interface FeeStats {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueCount: number;
}

/**
 * Compute summary statistics from fee records.
 *
 * - totalAmount = sum of all fee amounts
 * - paidAmount = sum of amounts where status === 'PAID'
 * - pendingAmount = sum of amounts where status is 'PENDING' or 'OVERDUE'
 * - overdueCount = count of fees where status === 'OVERDUE'
 * - Empty array returns zeros for all stats
 */
export function computeFeeStats(fees: FeeRecord[]): FeeStats {
  if (fees.length === 0) {
    return { totalAmount: 0, paidAmount: 0, pendingAmount: 0, overdueCount: 0 };
  }

  let totalAmount = 0;
  let paidAmount = 0;
  let pendingAmount = 0;
  let overdueCount = 0;

  for (const fee of fees) {
    totalAmount += fee.amount;

    if (fee.status === 'PAID') {
      paidAmount += fee.amount;
    }

    if (fee.status === 'PENDING' || fee.status === 'OVERDUE') {
      pendingAmount += fee.amount;
    }

    if (fee.status === 'OVERDUE') {
      overdueCount += 1;
    }
  }

  return { totalAmount, paidAmount, pendingAmount, overdueCount };
}
