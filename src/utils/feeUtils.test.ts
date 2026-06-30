/**
 * Fee Utils Tests
 * Unit tests for fee utility functions
 * Requirements: 9.1, 9.2, 9.3, 9.4, 12.1
 */

import { describe, it, expect } from 'vitest';
import { computeFeeStatus, computeAllFeeStatuses, filterFeesByStatus, filterFeesByStudent } from './feeUtils';
import type { FeeRecord } from '../types';

/* ============================================================================
   TEST HELPERS
   ============================================================================ */

const pastDate = new Date('2025-01-15T00:00:00.000Z');
const futureDate = new Date('2027-12-15T00:00:00.000Z');

const createFeeRecord = (overrides: Partial<FeeRecord> = {}): FeeRecord => ({
  id: 'fee-test-001',
  studentId: 'student-001',
  amount: 3000,
  monthYear: '2026-01',
  dueDate: futureDate,
  status: 'PENDING',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

/* ============================================================================
   TEST DATA
   ============================================================================ */

const mockFees: FeeRecord[] = [
  createFeeRecord({
    id: 'fee-001',
    studentId: 'student-001',
    status: 'PAID',
    dueDate: pastDate,
    paidDate: new Date('2025-01-10T00:00:00.000Z'),
    paymentMethod: 'UPI',
    transactionRef: 'UPI-12345',
  }),
  createFeeRecord({
    id: 'fee-002',
    studentId: 'student-001',
    status: 'PENDING',
    dueDate: futureDate,
  }),
  createFeeRecord({
    id: 'fee-003',
    studentId: 'student-002',
    status: 'PENDING',
    dueDate: pastDate,
  }),
  createFeeRecord({
    id: 'fee-004',
    studentId: 'student-002',
    status: 'OVERDUE',
    dueDate: pastDate,
  }),
  createFeeRecord({
    id: 'fee-005',
    studentId: 'student-003',
    status: 'WAIVED',
    dueDate: pastDate,
    notes: 'Scholarship recipient',
  }),
  createFeeRecord({
    id: 'fee-006',
    studentId: 'student-003',
    status: 'PENDING',
    dueDate: futureDate,
  }),
];

/* ============================================================================
   computeFeeStatus TESTS
   ============================================================================ */

describe('computeFeeStatus', () => {
  it('should return OVERDUE for PENDING fee with past due date', () => {
    const fee = createFeeRecord({ status: 'PENDING', dueDate: pastDate });
    expect(computeFeeStatus(fee)).toBe('OVERDUE');
  });

  it('should return PENDING for PENDING fee with future due date', () => {
    const fee = createFeeRecord({ status: 'PENDING', dueDate: futureDate });
    expect(computeFeeStatus(fee)).toBe('PENDING');
  });

  it('should return PAID as-is regardless of due date', () => {
    const fee = createFeeRecord({ status: 'PAID', dueDate: pastDate });
    expect(computeFeeStatus(fee)).toBe('PAID');
  });

  it('should return WAIVED as-is regardless of due date', () => {
    const fee = createFeeRecord({ status: 'WAIVED', dueDate: pastDate });
    expect(computeFeeStatus(fee)).toBe('WAIVED');
  });

  it('should return OVERDUE as-is for explicitly OVERDUE fee', () => {
    const fee = createFeeRecord({ status: 'OVERDUE', dueDate: pastDate });
    expect(computeFeeStatus(fee)).toBe('OVERDUE');
  });

  it('should handle null fee gracefully', () => {
    expect(computeFeeStatus(null as unknown as FeeRecord)).toBe('PENDING');
  });

  it('should return PENDING for PENDING fee with dueDate equal to today', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fee = createFeeRecord({ status: 'PENDING', dueDate: today });
    expect(computeFeeStatus(fee)).toBe('PENDING');
  });
});

/* ============================================================================
   computeAllFeeStatuses TESTS
   ============================================================================ */

describe('computeAllFeeStatuses', () => {
  it('should process an array of fees and update statuses', () => {
    const fees = [
      createFeeRecord({ id: 'fee-a', status: 'PENDING', dueDate: pastDate }),
      createFeeRecord({ id: 'fee-b', status: 'PENDING', dueDate: futureDate }),
      createFeeRecord({ id: 'fee-c', status: 'PAID', dueDate: pastDate }),
    ];

    const result = computeAllFeeStatuses(fees);

    expect(result[0].status).toBe('OVERDUE');
    expect(result[1].status).toBe('PENDING');
    expect(result[2].status).toBe('PAID');
  });

  it('should not mutate the original array', () => {
    const fees = [createFeeRecord({ status: 'PENDING', dueDate: pastDate })];
    const result = computeAllFeeStatuses(fees);

    expect(result).not.toBe(fees);
    expect(fees[0].status).toBe('PENDING');
    expect(result[0].status).toBe('OVERDUE');
  });

  it('should return empty array for null input', () => {
    expect(computeAllFeeStatuses(null as unknown as FeeRecord[])).toEqual([]);
  });

  it('should return empty array for empty input', () => {
    expect(computeAllFeeStatuses([])).toEqual([]);
  });
});

/* ============================================================================
   filterFeesByStatus TESTS
   ============================================================================ */

describe('filterFeesByStatus', () => {
  it('should filter fees by PAID status', () => {
    const result = filterFeesByStatus(mockFees, 'PAID');
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('fee-001');
  });

  it('should filter fees by PENDING status', () => {
    const result = filterFeesByStatus(mockFees, 'PENDING');
    expect(result.length).toBe(3);
    expect(result.every((f) => f.status === 'PENDING')).toBe(true);
  });

  it('should filter fees by OVERDUE status', () => {
    const result = filterFeesByStatus(mockFees, 'OVERDUE');
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('fee-004');
  });

  it('should filter fees by WAIVED status', () => {
    const result = filterFeesByStatus(mockFees, 'WAIVED');
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('fee-005');
  });

  it('should return empty array for null fees', () => {
    expect(filterFeesByStatus(null as unknown as FeeRecord[], 'PAID')).toEqual([]);
  });

  it('should return empty array for null status', () => {
    expect(filterFeesByStatus(mockFees, null as unknown as 'PAID')).toEqual([]);
  });

  it('should return empty array when no fees match', () => {
    const paidOnly = [createFeeRecord({ status: 'PAID' })];
    expect(filterFeesByStatus(paidOnly, 'WAIVED')).toEqual([]);
  });
});

/* ============================================================================
   filterFeesByStudent TESTS
   ============================================================================ */

describe('filterFeesByStudent', () => {
  it('should filter fees for a specific student', () => {
    const result = filterFeesByStudent(mockFees, 'student-001');
    expect(result.length).toBe(2);
    expect(result.every((f) => f.studentId === 'student-001')).toBe(true);
  });

  it('should return empty array for non-existent student', () => {
    const result = filterFeesByStudent(mockFees, 'student-999');
    expect(result.length).toBe(0);
  });

  it('should return empty array for null fees', () => {
    expect(filterFeesByStudent(null as unknown as FeeRecord[], 'student-001')).toEqual([]);
  });

  it('should return empty array for null studentId', () => {
    expect(filterFeesByStudent(mockFees, null as unknown as string)).toEqual([]);
  });

  it('should return empty array for empty studentId', () => {
    expect(filterFeesByStudent(mockFees, '')).toEqual([]);
  });
});
