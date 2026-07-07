/**
 * Tests for useCoachPayments hook
 * Validates fetching fees and expenses, and all mutation operations.
 * Requirements: 12.1, 13.1, 14.1, 15.1
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCoachPayments } from './useCoachPayments';
import type { CreateExpenseData, UpdateExpenseData } from './useCoachPayments';
import type { FeeRecord, Expense } from '../types';
import apiClient from '../utils/apiClient';

// Mock the API client
vi.mock('../utils/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockCoachId = 'coach-001';

// Mock fee data
const mockFees: FeeRecord[] = [
  {
    id: 'fee-001',
    studentId: 'student-001',
    amount: 5000,
    monthYear: '2026-01',
    dueDate: new Date('2026-01-31'),
    paidDate: new Date('2026-01-15'),
    status: 'PAID' as const,
    paymentMethod: 'UPI',
    transactionRef: 'TXN001',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-15'),
  },
  {
    id: 'fee-002',
    studentId: 'student-002',
    amount: 5000,
    monthYear: '2026-01',
    dueDate: new Date('2026-01-31'),
    status: 'PENDING' as const,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
];

// Mock expense data
const mockExpenses: Expense[] = [
  {
    id: 'exp-001',
    coachId: mockCoachId,
    type: 'SHUTTLE' as const,
    amount: 500,
    date: new Date('2026-01-15'),
    description: 'Shuttle rental for training',
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15'),
    createdBy: 'coach-001',
  },
  {
    id: 'exp-002',
    coachId: mockCoachId,
    type: 'SUPPLIES' as const,
    amount: 1000,
    date: new Date('2026-01-10'),
    description: 'Badminton equipment',
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date('2026-01-10'),
    createdBy: 'coach-001',
  },
];

describe('useCoachPayments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization and data fetching', () => {
    it('should fetch fees and expenses on mount', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockFees });
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockExpenses });

      const { result } = renderHook(() => useCoachPayments(mockCoachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.fees).toEqual(mockFees);
      expect(result.current.expenses).toEqual(mockExpenses);
    });

    it('should parse date fields correctly', async () => {
      const feesWithStringDates = [
        {
          ...mockFees[0],
          dueDate: '2026-01-31',
          paidDate: '2026-01-15',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-15',
        },
      ];

      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: feesWithStringDates })
        .mockResolvedValueOnce({ data: mockExpenses });

      const { result } = renderHook(() => useCoachPayments(mockCoachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.fees[0].dueDate).toBeInstanceOf(Date);
      expect(result.current.fees[0].paidDate).toBeInstanceOf(Date);
      expect(result.current.fees[0].createdAt).toBeInstanceOf(Date);
      expect(result.current.fees[0].updatedAt).toBeInstanceOf(Date);
    });

    it('should set loading state to true initially', () => {
      vi.mocked(apiClient.get).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: mockFees }), 100)
          )
      );
      vi.mocked(apiClient.get).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: mockExpenses }), 100)
          )
      );

      const { result } = renderHook(() => useCoachPayments(mockCoachId));

      expect(result.current.isLoading).toBe(true);
    });

    it('should handle empty fees and expenses arrays', async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] });

      const { result } = renderHook(() => useCoachPayments(mockCoachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.fees).toEqual([]);
      expect(result.current.expenses).toEqual([]);
    });

    it('should call correct API endpoints', async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: mockFees })
        .mockResolvedValueOnce({ data: mockExpenses });

      renderHook(() => useCoachPayments(mockCoachId));

      await waitFor(() => {
        expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(
          `/coaches/${mockCoachId}/fees`
        );
        expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(
          `/coaches/${mockCoachId}/expenses`
        );
      });
    });
  });

  describe('error handling', () => {
    it('should set error when fees fetch fails', async () => {
      const error = new Error('Failed to fetch fees');
      vi.mocked(apiClient.get)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({ data: mockExpenses });

      const { result } = renderHook(() => useCoachPayments(mockCoachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.error).toContain('Failed to load');
    });

    it('should set error when expenses fetch fails', async () => {
      const error = new Error('Failed to fetch expenses');
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: mockFees })
        .mockRejectedValueOnce(error);

      const { result } = renderHook(() => useCoachPayments(mockCoachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.error).toContain('Failed to load');
    });
  });

  describe('addExpense mutation', () => {
    it('should create a new expense', async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: mockFees })
        .mockResolvedValueOnce({ data: mockExpenses });

      const { result } = renderHook(() => useCoachPayments(mockCoachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newExpenseData: CreateExpenseData = {
        type: 'TRAVEL',
        amount: 1500,
        date: new Date('2026-01-20'),
        description: 'Travel for tournament',
      };

      const newExpense: Expense = {
        id: 'exp-003',
        coachId: mockCoachId,
        ...newExpenseData,
        createdAt: new Date('2026-01-20'),
        updatedAt: new Date('2026-01-20'),
        createdBy: mockCoachId,
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: newExpense });
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockExpenses });

      let addedExpense;
      await act(async () => {
        addedExpense = await result.current.addExpense(newExpenseData);
      });

      expect(addedExpense).toBeDefined();
      expect(addedExpense?.type).toBe('TRAVEL');
      expect(addedExpense?.amount).toBe(1500);

      // Verify API calls
      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith(
        `/coaches/${mockCoachId}/expenses`,
        expect.objectContaining({
          type: 'TRAVEL',
          amount: 1500,
          description: 'Travel for tournament',
        })
      );
    });

    it('should convert Date objects to ISO strings', async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: mockFees })
        .mockResolvedValueOnce({ data: mockExpenses });

      const { result } = renderHook(() => useCoachPayments(mockCoachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newExpenseData: CreateExpenseData = {
        type: 'SHUTTLE',
        amount: 500,
        date: new Date('2026-01-25'),
        description: 'Shuttle rental',
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { ...newExpenseData, id: 'exp-new', coachId: mockCoachId, createdAt: new Date(), updatedAt: new Date(), createdBy: mockCoachId },
      });
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockExpenses });

      await act(async () => {
        await result.current.addExpense(newExpenseData);
      });

      const postCall = vi.mocked(apiClient.post).mock.calls[0];
      const payload = postCall[1];

      // Date should be converted to ISO string
      expect(typeof (payload as Record<string, unknown>).date).toBe('string');
    });

    it('should throw error when API fails', async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: mockFees })
        .mockResolvedValueOnce({ data: mockExpenses });

      const { result } = renderHook(() => useCoachPayments(mockCoachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const error = new Error('Failed to create expense');
      vi.mocked(apiClient.post).mockRejectedValueOnce(error);

      await expect(
        act(async () => {
          await result.current.addExpense({
            type: 'SHUTTLE',
            amount: 500,
            date: new Date(),
            description: 'Test',
          });
        })
      ).rejects.toThrow();
    });
  });

  describe('updateExpense mutation', () => {
    it('should update an existing expense', async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: mockFees })
        .mockResolvedValueOnce({ data: mockExpenses });

      const { result } = renderHook(() => useCoachPayments(mockCoachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const updatedExpense: Expense = {
        ...mockExpenses[0],
        amount: 750,
        description: 'Updated shuttle rental',
      };

      const updateData: UpdateExpenseData = {
        amount: 750,
        description: 'Updated shuttle rental',
      };

      vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: updatedExpense });
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockExpenses });

      let result_value;
      await act(async () => {
        result_value = await result.current.updateExpense('exp-001', updateData);
      });

      expect(result_value?.amount).toBe(750);
      expect(result_value?.description).toBe('Updated shuttle rental');

      // Verify API call
      expect(vi.mocked(apiClient.patch)).toHaveBeenCalledWith(
        `/coaches/${mockCoachId}/expenses/exp-001`,
        updateData
      );
    });

    it('should handle partial updates', async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: mockFees })
        .mockResolvedValueOnce({ data: mockExpenses });

      const { result } = renderHook(() => useCoachPayments(mockCoachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      vi.mocked(apiClient.patch).mockResolvedValueOnce({
        data: { ...mockExpenses[0], amount: 600 },
      });
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockExpenses });

      await act(async () => {
        await result.current.updateExpense('exp-001', { amount: 600 });
      });

      expect(vi.mocked(apiClient.patch)).toHaveBeenCalledWith(
        `/coaches/${mockCoachId}/expenses/exp-001`,
        { amount: 600 }
      );
    });

    it('should convert Date to ISO string when updating', async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: mockFees })
        .mockResolvedValueOnce({ data: mockExpenses });

      const { result } = renderHook(() => useCoachPayments(mockCoachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newDate = new Date('2026-02-01');
      vi.mocked(apiClient.patch).mockResolvedValueOnce({
        data: { ...mockExpenses[0], date: newDate },
      });
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockExpenses });

      await act(async () => {
        await result.current.updateExpense('exp-001', { date: newDate });
      });

      const patchCall = vi.mocked(apiClient.patch).mock.calls[0];
      const payload = patchCall[1];

      expect(typeof (payload as Record<string, unknown>).date).toBe('string');
    });

    it('should throw error when API fails', async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: mockFees })
        .mockResolvedValueOnce({ data: mockExpenses });

      const { result } = renderHook(() => useCoachPayments(mockCoachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      vi.mocked(apiClient.patch).mockRejectedValueOnce(
        new Error('Failed to update expense')
      );

      await expect(
        act(async () => {
          await result.current.updateExpense('exp-001', { amount: 600 });
        })
      ).rejects.toThrow();
    });
  });

  describe('deleteExpense mutation', () => {
    it('should delete an expense', async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: mockFees })
        .mockResolvedValueOnce({ data: mockExpenses });

      const { result } = renderHook(() => useCoachPayments(mockCoachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: { success: true } });
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockExpenses });

      await act(async () => {
        await result.current.deleteExpense('exp-001');
      });

      expect(vi.mocked(apiClient.delete)).toHaveBeenCalledWith(
        `/coaches/${mockCoachId}/expenses/exp-001`
      );
    });

    it('should call correct API endpoint for deletion', async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: mockFees })
        .mockResolvedValueOnce({ data: mockExpenses });

      const { result } = renderHook(() => useCoachPayments(mockCoachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: { success: true } });
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockExpenses.slice(1) });

      await act(async () => {
        await result.current.deleteExpense('exp-001');
      });

      expect(vi.mocked(apiClient.delete)).toHaveBeenCalledWith(
        `/coaches/${mockCoachId}/expenses/exp-001`
      );
    });

    it('should throw error when API fails', async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: mockFees })
        .mockResolvedValueOnce({ data: mockExpenses });

      const { result } = renderHook(() => useCoachPayments(mockCoachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      vi.mocked(apiClient.delete).mockRejectedValueOnce(
        new Error('Failed to delete expense')
      );

      await expect(
        act(async () => {
          await result.current.deleteExpense('exp-001');
        })
      ).rejects.toThrow();
    });
  });

  describe('refetch function', () => {
    it('should manually refetch all payment data', async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: mockFees })
        .mockResolvedValueOnce({ data: mockExpenses });

      const { result } = renderHook(() => useCoachPayments(mockCoachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: mockFees })
        .mockResolvedValueOnce({ data: mockExpenses });

      await act(async () => {
        await result.current.refetch();
      });

      // Verify refetch API calls were made
      const allGetCalls = vi.mocked(apiClient.get).mock.calls;
      expect(allGetCalls.length).toBe(4); // 2 for initial load + 2 for refetch
    });

    it('should clear error on successful refetch', async () => {
      vi.mocked(apiClient.get)
        .mockRejectedValueOnce(new Error('Failed to fetch fees'))
        .mockResolvedValueOnce({ data: mockExpenses });

      const { result } = renderHook(() => useCoachPayments(mockCoachId));

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: mockFees })
        .mockResolvedValueOnce({ data: mockExpenses });

      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('data consistency', () => {
    it('should maintain separate fees and expenses arrays', async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: mockFees })
        .mockResolvedValueOnce({ data: mockExpenses });

      const { result } = renderHook(() => useCoachPayments(mockCoachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.fees).toHaveLength(2);
      expect(result.current.expenses).toHaveLength(2);

      // Verify fees are FeeRecords
      expect(result.current.fees[0]).toHaveProperty('studentId');
      expect(result.current.fees[0]).toHaveProperty('monthYear');
      expect(result.current.fees[0]).toHaveProperty('status');

      // Verify expenses are Expense objects
      expect(result.current.expenses[0]).toHaveProperty('type');
      expect(result.current.expenses[0]).toHaveProperty('coachId');
    });

    it('should handle coachId changes', async () => {
      const coach2Id = 'coach-002';
      const coach2Expenses: Expense[] = [
        {
          id: 'exp-coach2-1',
          coachId: coach2Id,
          type: 'OTHER' as const,
          amount: 300,
          date: new Date(),
          description: 'Test',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: coach2Id,
        },
      ];

      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: mockFees })
        .mockResolvedValueOnce({ data: mockExpenses });

      const { result, rerender } = renderHook(
        ({ coachId }) => useCoachPayments(coachId),
        { initialProps: { coachId: mockCoachId } }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: coach2Expenses });

      rerender({ coachId: coach2Id });

      await waitFor(() => {
        expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(
          `/coaches/${coach2Id}/fees`
        );
        expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(
          `/coaches/${coach2Id}/expenses`
        );
      });
    });
  });
});
