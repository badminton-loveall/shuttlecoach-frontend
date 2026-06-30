/**
 * Fee Data Utilities
 * Provides utility functions for fee record manipulation, status computation, and filtering
 * Requirements: 9.1, 9.2, 9.3, 9.4, 12.1
 */

import type { FeeRecord, FeeStatus } from '../types';

/* ============================================================================
   STATUS COMPUTATION UTILITIES
   ============================================================================ */

/**
 * Compute the effective fee status for a single fee record.
 * Automatically detects OVERDUE when the fee is PENDING and the dueDate has passed.
 * All other statuses (PAID, WAIVED, explicitly OVERDUE) are returned as-is.
 *
 * Requirement 12.1: Automatically detect overdue fees when due date has passed
 *
 * @param fee - The fee record to evaluate
 * @returns The computed FeeStatus
 */
export const computeFeeStatus = (fee: FeeRecord): FeeStatus => {
  if (!fee) {
    return 'PENDING';
  }

  // Only auto-detect OVERDUE for PENDING fees
  if (fee.status === 'PENDING') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(fee.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate < today) {
      return 'OVERDUE';
    }
  }

  return fee.status;
};

/**
 * Compute fee statuses for an array of fee records.
 * Returns new FeeRecord objects with updated status fields.
 * Does not mutate the original array.
 *
 * @param fees - Array of fee records to process
 * @returns New array of FeeRecords with computed statuses
 */
export const computeAllFeeStatuses = (fees: FeeRecord[]): FeeRecord[] => {
  if (!fees || !Array.isArray(fees)) {
    return [];
  }

  return fees.map((fee) => ({
    ...fee,
    status: computeFeeStatus(fee),
  }));
};

/* ============================================================================
   FILTERING UTILITIES
   ============================================================================ */

/**
 * Filter fee records by status.
 * Filters based on the raw status field without recomputing.
 * Use computeAllFeeStatuses first if you want to filter with auto-detected overdue status.
 *
 * @param fees - Array of fee records to filter
 * @param status - The FeeStatus to filter by
 * @returns Filtered array of fee records
 */
export const filterFeesByStatus = (fees: FeeRecord[], status: FeeStatus): FeeRecord[] => {
  if (!fees || !status) {
    return [];
  }

  return fees.filter((fee) => fee.status === status);
};

/**
 * Filter fee records by student ID.
 *
 * @param fees - Array of fee records to filter
 * @param studentId - The student ID to filter by
 * @returns Filtered array of fee records for the specified student
 */
export const filterFeesByStudent = (fees: FeeRecord[], studentId: string): FeeRecord[] => {
  if (!fees || !studentId) {
    return [];
  }

  return fees.filter((fee) => fee.studentId === studentId);
};

export default {
  computeFeeStatus,
  computeAllFeeStatuses,
  filterFeesByStatus,
  filterFeesByStudent,
};
