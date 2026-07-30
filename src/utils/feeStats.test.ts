/**
 * Tests for computeFeeStats utility function
 */

import { describe, it, expect } from 'vitest';
import { computeFeeStats } from './feeStats';
import type { FeeRecord } from '../types';

function makeFee(overrides: Partial<FeeRecord> = {}): FeeRecord {
  return {
    id: 'fee-1',
    studentId: 'student-1',
    amount: 1000,
    monthYear: '2026-01',
    dueDate: new Date('2026-01-10'),
    status: 'PENDING',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('computeFeeStats', () => {
  it('should return zeros for an empty array', () => {
    const result = computeFeeStats([]);
    expect(result).toEqual({
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueCount: 0,
    });
  });

  it('should compute totalAmount as sum of all fee amounts', () => {
    const fees: FeeRecord[] = [
      makeFee({ id: '1', amount: 1000, status: 'PAID' }),
      makeFee({ id: '2', amount: 2000, status: 'PENDING' }),
      makeFee({ id: '3', amount: 3000, status: 'OVERDUE' }),
      makeFee({ id: '4', amount: 500, status: 'WAIVED' }),
    ];
    const result = computeFeeStats(fees);
    expect(result.totalAmount).toBe(6500);
  });

  it('should compute paidAmount as sum of PAID fees only', () => {
    const fees: FeeRecord[] = [
      makeFee({ id: '1', amount: 1000, status: 'PAID' }),
      makeFee({ id: '2', amount: 2000, status: 'PAID' }),
      makeFee({ id: '3', amount: 3000, status: 'PENDING' }),
    ];
    const result = computeFeeStats(fees);
    expect(result.paidAmount).toBe(3000);
  });

  it('should compute pendingAmount as sum of PENDING and OVERDUE fees', () => {
    const fees: FeeRecord[] = [
      makeFee({ id: '1', amount: 1000, status: 'PENDING' }),
      makeFee({ id: '2', amount: 2000, status: 'OVERDUE' }),
      makeFee({ id: '3', amount: 3000, status: 'PAID' }),
      makeFee({ id: '4', amount: 500, status: 'WAIVED' }),
    ];
    const result = computeFeeStats(fees);
    expect(result.pendingAmount).toBe(3000);
  });

  it('should compute overdueCount as count of OVERDUE fees', () => {
    const fees: FeeRecord[] = [
      makeFee({ id: '1', amount: 1000, status: 'OVERDUE' }),
      makeFee({ id: '2', amount: 2000, status: 'OVERDUE' }),
      makeFee({ id: '3', amount: 3000, status: 'PENDING' }),
      makeFee({ id: '4', amount: 500, status: 'PAID' }),
    ];
    const result = computeFeeStats(fees);
    expect(result.overdueCount).toBe(2);
  });

  it('should handle all fees being PAID', () => {
    const fees: FeeRecord[] = [
      makeFee({ id: '1', amount: 1000, status: 'PAID' }),
      makeFee({ id: '2', amount: 2000, status: 'PAID' }),
    ];
    const result = computeFeeStats(fees);
    expect(result.totalAmount).toBe(3000);
    expect(result.paidAmount).toBe(3000);
    expect(result.pendingAmount).toBe(0);
    expect(result.overdueCount).toBe(0);
  });

  it('should handle all fees being OVERDUE', () => {
    const fees: FeeRecord[] = [
      makeFee({ id: '1', amount: 1500, status: 'OVERDUE' }),
      makeFee({ id: '2', amount: 2500, status: 'OVERDUE' }),
    ];
    const result = computeFeeStats(fees);
    expect(result.totalAmount).toBe(4000);
    expect(result.paidAmount).toBe(0);
    expect(result.pendingAmount).toBe(4000);
    expect(result.overdueCount).toBe(2);
  });

  it('should not count WAIVED fees in paidAmount or pendingAmount', () => {
    const fees: FeeRecord[] = [
      makeFee({ id: '1', amount: 5000, status: 'WAIVED' }),
    ];
    const result = computeFeeStats(fees);
    expect(result.totalAmount).toBe(5000);
    expect(result.paidAmount).toBe(0);
    expect(result.pendingAmount).toBe(0);
    expect(result.overdueCount).toBe(0);
  });

  it('should handle a single fee record', () => {
    const fees: FeeRecord[] = [
      makeFee({ id: '1', amount: 3000, status: 'PENDING' }),
    ];
    const result = computeFeeStats(fees);
    expect(result.totalAmount).toBe(3000);
    expect(result.paidAmount).toBe(0);
    expect(result.pendingAmount).toBe(3000);
    expect(result.overdueCount).toBe(0);
  });
});
