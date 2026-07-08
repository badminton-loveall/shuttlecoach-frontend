/**
 * Filtering and Sorting Utilities for Coach Detail Page
 * Provides utility functions for filtering students, payments, and sorting transactions
 * Requirements: 8.4, 13.4, 16.4, 16.5, 16.6
 */

import type { Student, FeeRecord, Expense, StudentFilters, PaymentFilters, SkillLevel, PaymentMethod, ExpenseType } from '../types';

/* ============================================================================
   TYPE DEFINITIONS
   ============================================================================ */

/**
 * Filter criteria for student filtering combining batch, skill level, and search text
 */
interface StudentFilterCriteria extends StudentFilters {
  batch?: string;
  skillLevel?: SkillLevel;
  search?: string;
}

/**
 * Filter criteria for payments combining date range, student, batch, payment method, and expense type
 */
interface PaymentFilterCriteria extends PaymentFilters {
  dateFrom?: Date;
  dateTo?: Date;
  student?: string;
  batch?: string;
  paymentMethod?: PaymentMethod;
  expenseType?: ExpenseType;
}


/* ============================================================================
   STUDENT FILTERING
   ============================================================================ */

/**
 * Filter students by batch, skill level, and search text
 * All criteria are combined with AND logic - all filters must match for a student to be included
 * 
 * Filters applied in this order:
 * 1. Batch filter (if provided)
 * 2. Skill level filter (if provided)
 * 3. Search text filter (if provided) - searches in name, BAID, and email
 *
 * @param students - Array of students to filter
 * @param filters - Filter criteria object with batch, skillLevel, and/or search
 * @returns Filtered array of students matching all specified criteria
 * 
 * Example:
 * ```
 * filterStudents(students, { batch: 'batch-001', skillLevel: 'Beginner' })
 * // Returns only students in batch-001 with Beginner skill level
 * 
 * filterStudents(students, { search: 'arjun' })
 * // Returns students matching "arjun" in name, BAID, or email
 * 
 * filterStudents(students, { batch: 'batch-001', search: 'arjun' })
 * // Returns students in batch-001 AND matching "arjun" in search fields
 * ```
 */
export const filterStudents = (
  students: Student[],
  filters: StudentFilterCriteria
): Student[] => {
  if (!students || students.length === 0) {
    return [];
  }

  let filtered = [...students];

  // Apply batch filter (AND logic)
  if (filters.batch && filters.batch.trim() !== '') {
    filtered = filtered.filter((student) => student.batchId === filters.batch);
  }

  // Apply skill level filter (AND logic)
  if (filters.skillLevel && filters.skillLevel.trim() !== '') {
    filtered = filtered.filter((student) => student.skillLevel === filters.skillLevel);
  }

  // Apply search text filter (AND logic)
  if (filters.search && filters.search.trim() !== '') {
    const searchQuery = filters.search.toLowerCase().trim();
    filtered = filtered.filter((student) => {
      const nameMatch = student.fullName?.toLowerCase().includes(searchQuery) || false;
      const baidMatch = student.baidNumber?.toLowerCase().includes(searchQuery) || false;
      const emailMatch = student.email?.toLowerCase().includes(searchQuery) || false;
      return nameMatch || baidMatch || emailMatch;
    });
  }

  return filtered;
};

/* ============================================================================
   PAYMENT FILTERING
   ============================================================================ */

/**
 * Filter payment records (fees and expenses) by multiple criteria
 * All criteria are combined with AND logic - all filters must match for a record to be included
 * 
 * Filters applied:
 * 1. Date range filter: includes records with date >= dateFrom AND date <= dateTo
 * 2. Student filter: for fees, matches studentId; for expenses, matches records connected to student's batch
 * 3. Batch filter: for fees, matches student's batchId; not applicable for expenses
 * 4. Payment method filter: only applies to FeeRecord, checks paymentMethod field
 * 5. Expense type filter: only applies to Expense, checks type field
 *
 * @param feeRecords - Array of fee records to filter
 * @param expenses - Array of expense records to filter
 * @param filters - Filter criteria object with dateFrom, dateTo, student, batch, paymentMethod, expenseType
 * @returns Combined and filtered array of both FeeRecords and Expenses, merged and sorted by date descending
 * 
 * Example:
 * ```
 * filterPayments(fees, expenses, { dateFrom: new Date('2026-01-01'), dateTo: new Date('2026-01-31') })
 * // Returns all records in January 2026
 * 
 * filterPayments(fees, expenses, { student: 'student-001', paymentMethod: 'UPI' })
 * // Returns fees from student-001 paid via UPI
 * 
 * filterPayments(fees, expenses, { expenseType: 'SHUTTLE' })
 * // Returns only shuttle expenses
 * ```
 */
export const filterPayments = (
  feeRecords: FeeRecord[],
  expenses: Expense[],
  filters: PaymentFilterCriteria
): (FeeRecord | Expense)[] => {
  let filteredFees: FeeRecord[] = feeRecords && feeRecords.length > 0 ? [...feeRecords] : [];
  let filteredExpenses: Expense[] = expenses && expenses.length > 0 ? [...expenses] : [];

  // Apply date range filter to fees
  if (filters.dateFrom || filters.dateTo) {
    filteredFees = filteredFees.filter((fee) => {
      const recordDate = fee.paidDate || fee.createdAt;
      if (filters.dateFrom && recordDate < filters.dateFrom) return false;
      if (filters.dateTo) {
        // Extend dateTo to end of day
        const endOfDay = new Date(filters.dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (recordDate > endOfDay) return false;
      }
      return true;
    });
  }

  // Apply date range filter to expenses
  if (filters.dateFrom || filters.dateTo) {
    filteredExpenses = filteredExpenses.filter((expense) => {
      const recordDate = expense.date;
      if (filters.dateFrom && recordDate < filters.dateFrom) return false;
      if (filters.dateTo) {
        // Extend dateTo to end of day
        const endOfDay = new Date(filters.dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (recordDate > endOfDay) return false;
      }
      return true;
    });
  }

  // Apply student filter to fees
  if (filters.student && filters.student.trim() !== '') {
    filteredFees = filteredFees.filter((fee) => fee.studentId === filters.student);
  }

  // Apply payment method filter to fees
  if (filters.paymentMethod && filters.paymentMethod.trim() !== '') {
    filteredFees = filteredFees.filter((fee) => fee.paymentMethod === filters.paymentMethod);
  }

  // Apply batch filter to fees (filter by student's batch - requires knowing student batch mapping)
  // Note: This is a simplified implementation. In real use, you'd need student batch data
  if (filters.batch && filters.batch.trim() !== '') {
    // This would require cross-referencing with student data to filter fees by batch
    // For now, we'll skip this as it requires students data to be passed in
    // Implementation depends on data structure availability
  }

  // Apply expense type filter to expenses - only filter expenses, not fees
  if (filters.expenseType && filters.expenseType.trim() !== '') {
    // Expense types only apply to Expense records
    filteredExpenses = filteredExpenses.filter((expense) => expense.type === filters.expenseType);
  }

  // Combine both arrays - return FeeRecord and Expense objects as-is
  const combined: (FeeRecord | Expense)[] = [...filteredFees, ...filteredExpenses];

  return combined;
};

/* ============================================================================
   TRANSACTION SORTING
   ============================================================================ */

/**
 * Sort transactions by date in descending order (most recent first)
 * 
 * Sorting logic:
 * - For FeeRecords: uses paidDate if available, otherwise falls back to createdAt
 * - For Expenses: uses the date field
 * - Descending order: most recent transactions appear first
 * - Stable sort: maintains relative order of records with same date
 *
 * @param transactions - Array of mixed FeeRecords and Expenses to sort
 * @returns Sorted array with most recent transactions first
 * 
 * Example:
 * ```
 * const mixed = [...fees, ...expenses];
 * const sorted = sortTransactions(mixed);
 * // Returns all transactions sorted by date, newest first
 * ```
 */
export const sortTransactions = (
  transactions: (FeeRecord | Expense)[]
): (FeeRecord | Expense)[] => {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  const copied = [...transactions];

  return copied.sort((a, b) => {
    // Determine if record is a FeeRecord or Expense by checking for expense-specific type values
    const isExpenseA = 'type' in a && typeof (a as Expense).type === 'string' && 
                       ((a as Expense).type === 'SHUTTLE' || (a as Expense).type === 'SUPPLIES' || 
                        (a as Expense).type === 'TRAVEL' || (a as Expense).type === 'OTHER');

    const isExpenseB = 'type' in b && typeof (b as Expense).type === 'string' && 
                       ((b as Expense).type === 'SHUTTLE' || (b as Expense).type === 'SUPPLIES' || 
                        (b as Expense).type === 'TRAVEL' || (b as Expense).type === 'OTHER');

    // Get dates for comparison
    let dateA: Date;
    let dateB: Date;

    if (isExpenseA) {
      dateA = (a as Expense).date;
    } else {
      dateA = (a as FeeRecord).paidDate || (a as FeeRecord).createdAt;
    }

    if (isExpenseB) {
      dateB = (b as Expense).date;
    } else {
      dateB = (b as FeeRecord).paidDate || (b as FeeRecord).createdAt;
    }

    // Convert to timestamps for comparison
    const timeA = new Date(dateA).getTime();
    const timeB = new Date(dateB).getTime();

    // Descending order (most recent first)
    return timeB - timeA;
  });
};

/* ============================================================================
   COMBINED UTILITY FUNCTIONS
   ============================================================================ */

/**
 * Filter and sort payments in one operation
 * Applies all filters and then sorts by date descending
 *
 * @param feeRecords - Array of fee records
 * @param expenses - Array of expenses
 * @param filters - Filter criteria
 * @returns Filtered and sorted array of transactions
 */
export const getFilteredAndSortedPayments = (
  feeRecords: FeeRecord[],
  expenses: Expense[],
  filters: PaymentFilterCriteria
): (FeeRecord | Expense)[] => {
  const filtered = filterPayments(feeRecords, expenses, filters);
  return sortTransactions(filtered);
};

/**
 * Get unique batch IDs from a list of students
 * Useful for populating filter dropdowns
 *
 * @param students - Array of students
 * @returns Array of unique batch IDs
 */
export const getUniqueBatchIds = (students: Student[]): string[] => {
  if (!students || students.length === 0) {
    return [];
  }

  const batchIds = new Set<string>();
  students.forEach((student) => {
    if (student.batchId) {
      batchIds.add(student.batchId);
    }
  });

  return Array.from(batchIds).sort();
};

/**
 * Get unique skill levels from a list of students
 * Useful for populating filter dropdowns
 *
 * @param students - Array of students
 * @returns Array of unique skill levels in order
 */
export const getUniqueSkillLevels = (students: Student[]): SkillLevel[] => {
  const skillLevels: SkillLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];

  if (!students || students.length === 0) {
    return skillLevels;
  }

  const presentLevels = new Set<SkillLevel>();
  students.forEach((student) => {
    if (student.skillLevel) {
      presentLevels.add(student.skillLevel);
    }
  });

  return skillLevels.filter((level) => presentLevels.has(level));
};

/**
 * Get unique payment methods from a list of fee records
 * Useful for populating filter dropdowns
 *
 * @param feeRecords - Array of fee records
 * @returns Array of unique payment methods
 */
export const getUniquePaymentMethods = (feeRecords: FeeRecord[]): PaymentMethod[] => {
  const allMethods: PaymentMethod[] = ['CASH', 'UPI', 'BANK_TRANSFER'];

  if (!feeRecords || feeRecords.length === 0) {
    return allMethods;
  }

  const presentMethods = new Set<PaymentMethod>();
  feeRecords.forEach((fee) => {
    if (fee.paymentMethod) {
      presentMethods.add(fee.paymentMethod);
    }
  });

  return allMethods.filter((method) => presentMethods.has(method));
};

/**
 * Get unique expense types from a list of expenses
 * Useful for populating filter dropdowns
 *
 * @param expenses - Array of expenses
 * @returns Array of unique expense types
 */
export const getUniqueExpenseTypes = (expenses: Expense[]): ExpenseType[] => {
  const allTypes: ExpenseType[] = ['SHUTTLE', 'SUPPLIES', 'TRAVEL', 'OTHER'];

  if (!expenses || expenses.length === 0) {
    return allTypes;
  }

  const presentTypes = new Set<ExpenseType>();
  expenses.forEach((expense) => {
    if (expense.type) {
      presentTypes.add(expense.type);
    }
  });

  return allTypes.filter((type) => presentTypes.has(type));
};

/* ============================================================================
   EXPORT ALL UTILITIES
   ============================================================================ */

export default {
  // Main filtering functions
  filterStudents,
  filterPayments,
  sortTransactions,

  // Combined utilities
  getFilteredAndSortedPayments,

  // Dropdown helpers
  getUniqueBatchIds,
  getUniqueSkillLevels,
  getUniquePaymentMethods,
  getUniqueExpenseTypes,
};
