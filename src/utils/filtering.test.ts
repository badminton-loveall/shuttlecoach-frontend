/**
 * Filtering and Sorting Utilities Tests
 * Unit tests for filtering students, payments, and sorting transactions
 * Requirements: 8.4, 13.4, 16.4, 16.5, 16.6
 */

import { describe, it, expect } from 'vitest';
import {
  filterStudents,
  filterPayments,
  sortTransactions,
  getFilteredAndSortedPayments,
  getUniqueBatchIds,
  getUniqueSkillLevels,
  getUniquePaymentMethods,
  getUniqueExpenseTypes,
} from './filtering';
import type { Student, FeeRecord, Expense } from '../types';

/* ============================================================================
   TEST DATA
   ============================================================================ */

const mockStudents: Student[] = [
  {
    id: 'student-001',
    fullName: 'Arjun Verma',
    dateOfBirth: new Date('2012-05-15'),
    age: 13,
    gender: 'Male',
    contactPhone: '9876543210',
    email: 'arjun.v@email.com',
    guardianName: 'Rajesh Verma',
    guardianPhone: '9876543200',
    baidNumber: 'BAID-2026-001',
    batchId: 'batch-001',
    assignedCoachId: 'coach-001',
    height: 155,
    weight: 48,
    bmi: 20.0,
    bloodGroup: 'O+',
    emergencyContact: '9876543200',
    strengths: ['Quick footwork', 'Backhand shot'],
    weaknesses: ['Service consistency'],
    coachFeedback: 'Good fundamentals',
    skillLevel: 'Beginner',
    createdAt: new Date('2026-01-05T09:00:00Z'),
    updatedAt: new Date('2026-01-15T10:30:00Z'),
  },
  {
    id: 'student-002',
    fullName: 'Neha Sharma',
    dateOfBirth: new Date('2010-08-22'),
    age: 15,
    gender: 'Female',
    contactPhone: '9876543211',
    email: 'neha.s@email.com',
    guardianName: 'Priya Sharma',
    guardianPhone: '9876543201',
    baidNumber: 'BAID-2026-002',
    batchId: 'batch-001',
    assignedCoachId: 'coach-001',
    height: 162,
    weight: 55,
    bmi: 20.9,
    bloodGroup: 'B+',
    emergencyContact: '9876543201',
    strengths: ['Court positioning', 'Drop shots'],
    weaknesses: ['Power in smash'],
    coachFeedback: 'Excellent court sense',
    skillLevel: 'Intermediate',
    createdAt: new Date('2026-01-06T09:00:00Z'),
    updatedAt: new Date('2026-01-14T14:00:00Z'),
  },
  {
    id: 'student-003',
    fullName: 'Rohan Kapoor',
    dateOfBirth: new Date('2008-03-10'),
    age: 17,
    gender: 'Male',
    contactPhone: '9876543212',
    email: 'rohan.k@email.com',
    baidNumber: 'BAID-2026-003',
    batchId: 'batch-002',
    assignedCoachId: 'coach-002',
    height: 175,
    weight: 68,
    bmi: 22.2,
    bloodGroup: 'A+',
    emergencyContact: '9876543212',
    strengths: ['Rally play', 'Stamina', 'Attacking shots'],
    weaknesses: ['Defensive positioning'],
    coachFeedback: 'Strong attacker',
    skillLevel: 'Advanced',
    createdAt: new Date('2026-01-07T09:00:00Z'),
    updatedAt: new Date('2026-01-13T11:45:00Z'),
  },
  {
    id: 'student-004',
    fullName: 'Sapna Reddy',
    dateOfBirth: new Date('2009-07-30'),
    age: 16,
    gender: 'Female',
    contactPhone: '9876543219',
    email: 'sapna.r@email.com',
    baidNumber: 'BAID-2026-008',
    batchId: 'batch-002',
    assignedCoachId: 'coach-002',
    height: 165,
    weight: 58,
    bmi: 21.3,
    bloodGroup: 'O+',
    emergencyContact: '9876543206',
    strengths: ['Control', 'Precision shots'],
    weaknesses: ['Baseline clearing'],
    coachFeedback: 'Excellent shot selection',
    skillLevel: 'Advanced',
    createdAt: new Date('2026-01-14T09:00:00Z'),
    updatedAt: new Date('2026-01-15T14:40:00Z'),
  },
];

const mockFeeRecords: FeeRecord[] = [
  {
    id: 'fee-001',
    studentId: 'student-001',
    amount: 5000,
    monthYear: '2026-01',
    dueDate: new Date('2026-01-10'),
    paidDate: new Date('2026-01-08'),
    status: 'PAID',
    paymentMethod: 'UPI',
    transactionRef: 'TXN-001',
    createdAt: new Date('2026-01-05'),
    updatedAt: new Date('2026-01-08'),
  },
  {
    id: 'fee-002',
    studentId: 'student-002',
    amount: 5000,
    monthYear: '2026-01',
    dueDate: new Date('2026-01-10'),
    paidDate: new Date('2026-01-15'),
    status: 'PAID',
    paymentMethod: 'BANK_TRANSFER',
    transactionRef: 'TXN-002',
    createdAt: new Date('2026-01-05'),
    updatedAt: new Date('2026-01-15'),
  },
  {
    id: 'fee-003',
    studentId: 'student-003',
    amount: 5000,
    monthYear: '2026-02',
    dueDate: new Date('2026-02-10'),
    status: 'PENDING',
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-02-01'),
  },
];

const mockExpenses: Expense[] = [
  {
    id: 'expense-001',
    coachId: 'coach-001',
    type: 'SHUTTLE',
    amount: 500,
    date: new Date('2026-01-05'),
    description: 'Shuttle purchase for batch training',
    createdAt: new Date('2026-01-05'),
    updatedAt: new Date('2026-01-05'),
    createdBy: 'coach-001',
  },
  {
    id: 'expense-002',
    coachId: 'coach-001',
    type: 'SUPPLIES',
    amount: 300,
    date: new Date('2026-01-10'),
    description: 'Racket strings and grips',
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date('2026-01-10'),
    createdBy: 'coach-001',
  },
  {
    id: 'expense-003',
    coachId: 'coach-001',
    type: 'TRAVEL',
    amount: 200,
    date: new Date('2026-01-20'),
    description: 'Travel to tournament venue',
    createdAt: new Date('2026-01-20'),
    updatedAt: new Date('2026-01-20'),
    createdBy: 'coach-001',
  },
];

/* ============================================================================
   FILTER STUDENTS TESTS
   ============================================================================ */

describe('filterStudents', () => {
  it('should return all students when no filters specified', () => {
    const result = filterStudents(mockStudents, {});
    expect(result.length).toBe(4);
  });

  it('should filter students by batch', () => {
    const result = filterStudents(mockStudents, { batch: 'batch-001' });
    expect(result.length).toBe(2);
    expect(result.every((s) => s.batchId === 'batch-001')).toBe(true);
  });

  it('should filter students by skill level', () => {
    const result = filterStudents(mockStudents, { skillLevel: 'Advanced' });
    expect(result.length).toBe(2);
    expect(result.every((s) => s.skillLevel === 'Advanced')).toBe(true);
  });

  it('should filter students by search text in name', () => {
    const result = filterStudents(mockStudents, { search: 'Arjun' });
    expect(result.length).toBe(1);
    expect(result[0].fullName).toBe('Arjun Verma');
  });

  it('should filter students by search text in BAID', () => {
    const result = filterStudents(mockStudents, { search: 'BAID-2026-001' });
    expect(result.length).toBe(1);
    expect(result[0].baidNumber).toBe('BAID-2026-001');
  });

  it('should filter students by search text in email', () => {
    const result = filterStudents(mockStudents, { search: 'neha' });
    expect(result.length).toBe(1);
    expect(result[0].fullName).toBe('Neha Sharma');
  });

  it('should apply batch AND skill level filters (AND logic)', () => {
    const result = filterStudents(mockStudents, {
      batch: 'batch-001',
      skillLevel: 'Beginner',
    });
    expect(result.length).toBe(1);
    expect(result[0].fullName).toBe('Arjun Verma');
  });

  it('should apply batch AND search filters (AND logic)', () => {
    const result = filterStudents(mockStudents, {
      batch: 'batch-001',
      search: 'Arjun',
    });
    expect(result.length).toBe(1);
    expect(result[0].fullName).toBe('Arjun Verma');
  });

  it('should apply all three filters (batch AND skill AND search)', () => {
    const result = filterStudents(mockStudents, {
      batch: 'batch-001',
      skillLevel: 'Intermediate',
      search: 'Neha',
    });
    expect(result.length).toBe(1);
    expect(result[0].fullName).toBe('Neha Sharma');
  });

  it('should be case-insensitive for search', () => {
    const result1 = filterStudents(mockStudents, { search: 'arjun' });
    const result2 = filterStudents(mockStudents, { search: 'ARJUN' });
    const result3 = filterStudents(mockStudents, { search: 'Arjun' });
    expect(result1.length).toBe(result2.length).toBe(result3.length).toBe(1);
  });

  it('should return empty array for non-matching filters', () => {
    const result = filterStudents(mockStudents, {
      batch: 'non-existent-batch',
      skillLevel: 'Beginner',
    });
    expect(result.length).toBe(0);
  });

  it('should handle null or empty students array', () => {
    expect(filterStudents([], {})).toEqual([]);
    expect(filterStudents(null as unknown as Student[], {})).toEqual([]);
  });

  it('should ignore empty string filters', () => {
    const result = filterStudents(mockStudents, {
      batch: '',
      skillLevel: '',
      search: '',
    });
    expect(result.length).toBe(4);
  });

  it('should handle partial search match', () => {
    const result = filterStudents(mockStudents, { search: 'sap' });
    expect(result.length).toBe(1);
    expect(result[0].fullName).toBe('Sapna Reddy');
  });
});


/* ============================================================================
   FILTER PAYMENTS TESTS
   ============================================================================ */

describe('filterPayments', () => {
  it('should return all payments when no filters specified', () => {
    const result = filterPayments(mockFeeRecords, mockExpenses, {});
    expect(result.length).toBe(6); // 3 fees + 3 expenses
  });

  it('should filter by date range (fees and expenses)', () => {
    const result = filterPayments(mockFeeRecords, mockExpenses, {
      dateFrom: new Date('2026-01-08'),
      dateTo: new Date('2026-01-15'),
    });
    expect(result.length).toBeGreaterThan(0);
    result.forEach((r) => {
      const date = 'monthYear' in r ? (r.paidDate || r.createdAt) : r.date;
      expect(date.getTime()).toBeGreaterThanOrEqual(new Date('2026-01-08').getTime());
      expect(date.getTime()).toBeLessThanOrEqual(new Date('2026-01-15T23:59:59.999Z').getTime());
    });
  });

  it('should filter fees by student ID', () => {
    const result = filterPayments(mockFeeRecords, mockExpenses, {
      student: 'student-001',
    });
    // Should include fees from student-001 and all expenses
    expect(result.length).toBeGreaterThan(0);
  });

  it('should filter fees by payment method', () => {
    const result = filterPayments(mockFeeRecords, mockExpenses, {
      paymentMethod: 'UPI',
    });
    expect(result.length).toBeGreaterThan(0);
  });

  it('should filter expenses by type', () => {
    const result = filterPayments(mockFeeRecords, mockExpenses, {
      expenseType: 'SHUTTLE',
    });
    // Result includes all fees (3) + filtered expenses (1 SHUTTLE)
    expect(result.length).toBe(4);
    // Check that it contains the SHUTTLE expense
    const shuttleExpense = result.find((r) => (r as Expense).type === 'SHUTTLE');
    expect(shuttleExpense).toBeDefined();
    expect((shuttleExpense as Expense).type).toBe('SHUTTLE');
  });

  it('should apply multiple filters (AND logic)', () => {
    const result = filterPayments(mockFeeRecords, mockExpenses, {
      expenseType: 'SHUTTLE',
      dateFrom: new Date('2026-01-01'),
      dateTo: new Date('2026-01-10'),
    });
    // Result includes: fees with paidDate in range (1: fee-001 on Jan 8) + SHUTTLE expense in range (1: expense-001 on Jan 5)
    expect(result.length).toBe(2);
    // Verify SHUTTLE expense is included
    const shuttleExpense = result.find((r) => (r as Expense).type === 'SHUTTLE');
    expect(shuttleExpense).toBeDefined();
  });

  it('should handle null or empty arrays', () => {
    const result = filterPayments([], [], {});
    expect(result.length).toBe(0);
  });

  it('should handle dateFrom only', () => {
    const result = filterPayments(mockFeeRecords, mockExpenses, {
      dateFrom: new Date('2026-01-15'),
    });
    expect(result.length).toBeGreaterThan(0);
    result.forEach((r) => {
      const date = 'monthYear' in r ? (r.paidDate || r.createdAt) : r.date;
      expect(date.getTime()).toBeGreaterThanOrEqual(new Date('2026-01-15').getTime());
    });
  });

  it('should handle dateTo only', () => {
    const result = filterPayments(mockFeeRecords, mockExpenses, {
      dateTo: new Date('2026-01-10'),
    });
    expect(result.length).toBeGreaterThan(0);
    result.forEach((r) => {
      const date = 'monthYear' in r ? (r.paidDate || r.createdAt) : r.date;
      expect(date.getTime()).toBeLessThanOrEqual(new Date('2026-01-10T23:59:59.999Z').getTime());
    });
  });

  it('should return empty array for date range with no matching records', () => {
    const result = filterPayments(mockFeeRecords, mockExpenses, {
      dateFrom: new Date('2026-03-01'),
      dateTo: new Date('2026-03-31'),
    });
    expect(result.length).toBe(0);
  });

  it('should ignore empty string filters', () => {
    const result = filterPayments(mockFeeRecords, mockExpenses, {
      student: '',
      paymentMethod: '',
      expenseType: '',
    });
    expect(result.length).toBe(6);
  });
});


/* ============================================================================
   SORT TRANSACTIONS TESTS
   ============================================================================ */

describe('sortTransactions', () => {
  it('should sort transactions by date descending (most recent first)', () => {
    const transactions = [...mockFeeRecords, ...mockExpenses];
    const result = sortTransactions(transactions);

    expect(result.length).toBe(6);
    
    // Check that dates are in descending order
    for (let i = 0; i < result.length - 1; i++) {
      const currentDate = 'monthYear' in result[i] ? (result[i].paidDate || result[i].createdAt) : (result[i] as Expense).date;
      const nextDate = 'monthYear' in result[i + 1] ? (result[i + 1].paidDate || result[i + 1].createdAt) : (result[i + 1] as Expense).date;
      
      expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
    }
  });

  it('should place most recent transaction first', () => {
    const transactions = [...mockFeeRecords, ...mockExpenses];
    const result = sortTransactions(transactions);

    const firstDate = 'monthYear' in result[0] ? (result[0].paidDate || result[0].createdAt) : (result[0] as Expense).date;
    // fee-003 with createdAt 2026-02-01 is the most recent
    expect(firstDate.getTime()).toBe(new Date('2026-02-01').getTime());
  });

  it('should handle empty array', () => {
    const result = sortTransactions([]);
    expect(result.length).toBe(0);
  });

  it('should handle null or undefined', () => {
    const result = sortTransactions(null as unknown as (FeeRecord | Expense)[]);
    expect(result.length).toBe(0);
  });

  it('should maintain stable sort for same-date transactions', () => {
    const sameDate = new Date('2026-01-05');
    const transaction1: Expense = {
      id: 'exp-same-1',
      coachId: 'coach-001',
      type: 'SHUTTLE',
      amount: 100,
      date: sameDate,
      description: 'First',
      createdAt: sameDate,
      updatedAt: sameDate,
      createdBy: 'coach-001',
    };
    const transaction2: Expense = {
      id: 'exp-same-2',
      coachId: 'coach-001',
      type: 'SUPPLIES',
      amount: 200,
      date: sameDate,
      description: 'Second',
      createdAt: sameDate,
      updatedAt: sameDate,
      createdBy: 'coach-001',
    };

    const result = sortTransactions([transaction1, transaction2]);
    expect(result.length).toBe(2);
    // Both have same date, so order should be stable
    expect(result[0].id).toBe('exp-same-1');
    expect(result[1].id).toBe('exp-same-2');
  });

  it('should sort expenses correctly', () => {
    const result = sortTransactions(mockExpenses);
    expect(result.length).toBe(3);
    expect(result[0].id).toBe('expense-003'); // Most recent: Jan 20
    expect(result[1].id).toBe('expense-002'); // Middle: Jan 10
    expect(result[2].id).toBe('expense-001'); // Oldest: Jan 5
  });

  it('should sort fees correctly using paidDate when available', () => {
    const result = sortTransactions(mockFeeRecords);
    expect(result.length).toBe(3);
    // fee-002 has paidDate 2026-01-15 (most recent paid)
    // fee-001 has paidDate 2026-01-08
    // fee-003 has no paidDate, uses createdAt 2026-02-01
    // fee-003 (Feb 1) is most recent
    expect(result[0].id).toBe('fee-003'); // Feb 1 (most recent)
    expect(result[1].id).toBe('fee-002'); // Jan 15
    expect(result[2].id).toBe('fee-001'); // Jan 8
  });

  it('should sort mixed fees and expenses correctly', () => {
    const mixed = [mockExpenses[1], mockFeeRecords[0], mockExpenses[2], mockFeeRecords[1]];
    const result = sortTransactions(mixed);

    expect(result.length).toBe(4);
    const dates = result.map((r) => {
      const date = 'monthYear' in r ? (r.paidDate || r.createdAt) : (r as Expense).date;
      return date.getTime();
    });

    // Verify descending order
    for (let i = 0; i < dates.length - 1; i++) {
      expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
    }
  });
});


/* ============================================================================
   HELPER FUNCTION TESTS
   ============================================================================ */

describe('getUniqueBatchIds', () => {
  it('should return unique batch IDs', () => {
    const result = getUniqueBatchIds(mockStudents);
    expect(result.length).toBe(2);
    expect(result).toContain('batch-001');
    expect(result).toContain('batch-002');
  });

  it('should return sorted batch IDs', () => {
    const result = getUniqueBatchIds(mockStudents);
    expect(result[0]).toBe('batch-001');
    expect(result[1]).toBe('batch-002');
  });

  it('should return empty array for null or empty students', () => {
    expect(getUniqueBatchIds([])).toEqual([]);
    expect(getUniqueBatchIds(null as unknown as Student[])).toEqual([]);
  });

  it('should ignore students without batch IDs', () => {
    const studentsWithoutBatch: Student[] = [
      { ...mockStudents[0], batchId: undefined },
      { ...mockStudents[1], batchId: 'batch-002' },
    ];
    const result = getUniqueBatchIds(studentsWithoutBatch);
    expect(result.length).toBe(1);
    expect(result[0]).toBe('batch-002');
  });
});

describe('getUniqueSkillLevels', () => {
  it('should return only skill levels present in students', () => {
    const result = getUniqueSkillLevels(mockStudents);
    expect(result).toContain('Beginner');
    expect(result).toContain('Intermediate');
    expect(result).toContain('Advanced');
    expect(result).not.toContain('Professional');
  });

  it('should return all skill levels when students array is empty', () => {
    const result = getUniqueSkillLevels([]);
    expect(result.length).toBe(4);
    expect(result).toContain('Beginner');
    expect(result).toContain('Intermediate');
    expect(result).toContain('Advanced');
    expect(result).toContain('Professional');
  });

  it('should maintain skill level order', () => {
    const result = getUniqueSkillLevels(mockStudents);
    expect(result[0]).toBe('Beginner');
    expect(result[1]).toBe('Intermediate');
    expect(result[2]).toBe('Advanced');
  });

  it('should handle null students', () => {
    const result = getUniqueSkillLevels(null as unknown as Student[]);
    expect(result.length).toBe(4);
  });
});

describe('getUniquePaymentMethods', () => {
  it('should return unique payment methods', () => {
    const result = getUniquePaymentMethods(mockFeeRecords);
    expect(result).toContain('UPI');
    expect(result).toContain('BANK_TRANSFER');
  });

  it('should not include undefined payment methods', () => {
    const result = getUniquePaymentMethods(mockFeeRecords);
    // fee-003 doesn't have paymentMethod
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('should return all possible methods when array is empty', () => {
    const result = getUniquePaymentMethods([]);
    expect(result.length).toBe(3);
    expect(result).toContain('CASH');
    expect(result).toContain('UPI');
    expect(result).toContain('BANK_TRANSFER');
  });

  it('should handle null records', () => {
    const result = getUniquePaymentMethods(null as unknown as FeeRecord[]);
    expect(result.length).toBe(3);
  });
});

describe('getUniqueExpenseTypes', () => {
  it('should return unique expense types', () => {
    const result = getUniqueExpenseTypes(mockExpenses);
    expect(result).toContain('SHUTTLE');
    expect(result).toContain('SUPPLIES');
    expect(result).toContain('TRAVEL');
  });

  it('should not include OTHER if not present', () => {
    const result = getUniqueExpenseTypes(mockExpenses);
    expect(result).not.toContain('OTHER');
  });

  it('should return all possible types when array is empty', () => {
    const result = getUniqueExpenseTypes([]);
    expect(result.length).toBe(4);
    expect(result).toContain('SHUTTLE');
    expect(result).toContain('SUPPLIES');
    expect(result).toContain('TRAVEL');
    expect(result).toContain('OTHER');
  });

  it('should handle null expenses', () => {
    const result = getUniqueExpenseTypes(null as unknown as Expense[]);
    expect(result.length).toBe(4);
  });
});

describe('getFilteredAndSortedPayments', () => {
  it('should filter and sort in one operation', () => {
    const result = getFilteredAndSortedPayments(mockFeeRecords, mockExpenses, {
      dateFrom: new Date('2026-01-08'),
      dateTo: new Date('2026-01-20'),
    });

    // Check that results are sorted
    for (let i = 0; i < result.length - 1; i++) {
      const currentDate = 'monthYear' in result[i] ? (result[i].paidDate || result[i].createdAt) : (result[i] as Expense).date;
      const nextDate = 'monthYear' in result[i + 1] ? (result[i + 1].paidDate || result[i + 1].createdAt) : (result[i + 1] as Expense).date;
      
      expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
    }
  });

  it('should apply filters before sorting', () => {
    const result = getFilteredAndSortedPayments(mockFeeRecords, mockExpenses, {
      expenseType: 'TRAVEL',
    });

    // Should have all fees (3) + TRAVEL expense (1)
    expect(result.length).toBe(4);
    // Verify TRAVEL expense is included
    const travelExpense = result.find((r) => (r as Expense).type === 'TRAVEL');
    expect(travelExpense).toBeDefined();
    expect((travelExpense as Expense).id).toBe('expense-003');
  });
});
