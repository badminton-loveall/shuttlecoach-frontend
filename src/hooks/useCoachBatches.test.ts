/**
 * Tests for useCoachBatches hook
 * Validates batch fetching, assignment, unassignment, and error handling.
 * Requirements: 5.1, 6.1, 13.1, 20.1
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCoachBatches } from './useCoachBatches';
import apiClient from '../utils/apiClient';

// Mock the apiClient module
vi.mock('../utils/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockBatches = [
  {
    id: 'batch-001',
    name: 'Morning Basics',
    schedule: 'Mon-Wed 6AM',
    assignedCoachId: 'coach-001',
    studentCount: 12,
    createdAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 'batch-002',
    name: 'Evening Advanced',
    schedule: 'Tue-Thu 6PM',
    assignedCoachId: 'coach-001',
    studentCount: 8,
    createdAt: '2026-01-20T08:00:00Z',
  },
];

const coachId = 'coach-001';

describe('useCoachBatches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading batches', () => {
    it('should fetch batches on mount', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockBatches });
      vi.mocked(apiClient.get).mockImplementation(mockGet);

      const { result } = renderHook(() => useCoachBatches(coachId));

      // Should be loading initially
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGet).toHaveBeenCalledWith(`/coaches/${coachId}/batches`);
      expect(result.current.batches).toHaveLength(2);
      expect(result.current.batches[0].name).toBe('Morning Basics');
    });

    it('should parse date fields into Date objects', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockBatches });
      vi.mocked(apiClient.get).mockImplementation(mockGet);

      const { result } = renderHook(() => useCoachBatches(coachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const batch = result.current.batches[0];
      expect(batch.createdAt).toBeInstanceOf(Date);
    });

    it('should clear error state on successful fetch', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockBatches });
      vi.mocked(apiClient.get).mockImplementation(mockGet);

      const { result } = renderHook(() => useCoachBatches(coachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle empty batch list', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: [] });
      vi.mocked(apiClient.get).mockImplementation(mockGet);

      const { result } = renderHook(() => useCoachBatches(coachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.batches).toHaveLength(0);
      expect(result.current.error).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle fetch errors gracefully', async () => {
      const mockError = new Error('Network error');
      const mockGet = vi.fn().mockRejectedValue(mockError);
      vi.mocked(apiClient.get).mockImplementation(mockGet);

      const { result } = renderHook(() => useCoachBatches(coachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load batches. Please try again.');
      expect(result.current.batches).toHaveLength(0);
    });

    it('should set error state on failed assignment', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockBatches });
      const mockPost = vi.fn().mockRejectedValue(new Error('Assignment failed'));

      vi.mocked(apiClient.get).mockImplementation(mockGet);
      vi.mocked(apiClient.post).mockImplementation(mockPost);

      const { result } = renderHook(() => useCoachBatches(coachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let assignError: Error | null = null;
      await act(async () => {
        try {
          await result.current.assignBatch('batch-003');
        } catch (err) {
          assignError = err as Error;
        }
      });

      expect(assignError).toBeDefined();
      expect(assignError?.message).toBe('Assignment failed');
    });

    it('should set error state on failed unassignment', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockBatches });
      const mockDelete = vi.fn().mockRejectedValue(new Error('Unassignment failed'));

      vi.mocked(apiClient.get).mockImplementation(mockGet);
      vi.mocked(apiClient.delete).mockImplementation(mockDelete);

      const { result } = renderHook(() => useCoachBatches(coachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let unassignError: Error | null = null;
      await act(async () => {
        try {
          await result.current.unassignBatch('batch-001');
        } catch (err) {
          unassignError = err as Error;
        }
      });

      expect(unassignError).toBeDefined();
      expect(unassignError?.message).toBe('Unassignment failed');
    });
  });

  describe('assignBatch mutation', () => {
    it('should assign a batch to the coach', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockBatches });
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          success: true,
          batch: {
            id: 'batch-003',
            name: 'New Batch',
            schedule: 'Sat 10AM',
            assignedCoachId: coachId,
            studentCount: 5,
            createdAt: '2026-02-01T08:00:00Z',
          },
        },
      });

      vi.mocked(apiClient.get).mockImplementation(mockGet);
      vi.mocked(apiClient.post).mockImplementation(mockPost);

      const { result } = renderHook(() => useCoachBatches(coachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let assignedBatch;
      await act(async () => {
        assignedBatch = await result.current.assignBatch('batch-003');
      });

      expect(mockPost).toHaveBeenCalledWith(`/coaches/${coachId}/batches`, { batchId: 'batch-003' });
      expect(assignedBatch).toBeDefined();
      expect(assignedBatch?.id).toBe('batch-003');
      expect(assignedBatch?.name).toBe('New Batch');
    });

    it('should refetch batches after successful assignment', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockBatches });
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          success: true,
          batch: {
            id: 'batch-003',
            name: 'New Batch',
            schedule: 'Sat 10AM',
            assignedCoachId: coachId,
            studentCount: 5,
            createdAt: '2026-02-01T08:00:00Z',
          },
        },
      });

      vi.mocked(apiClient.get).mockImplementation(mockGet);
      vi.mocked(apiClient.post).mockImplementation(mockPost);

      const { result } = renderHook(() => useCoachBatches(coachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.assignBatch('batch-003');
      });

      // Should have called get twice: once on mount, once after assignment
      expect(mockGet).toHaveBeenCalledTimes(2);
    });

    it('should handle missing batch in response', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockBatches });
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          success: true,
          batch: undefined, // No batch in response
        },
      });

      vi.mocked(apiClient.get).mockImplementation(mockGet);
      vi.mocked(apiClient.post).mockImplementation(mockPost);

      const { result } = renderHook(() => useCoachBatches(coachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let assignedBatch;
      await act(async () => {
        assignedBatch = await result.current.assignBatch('batch-003');
      });

      expect(assignedBatch).toBeDefined();
      expect(assignedBatch?.id).toBe('batch-003');
    });
  });

  describe('unassignBatch mutation', () => {
    it('should unassign a batch from the coach', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockBatches });
      const mockDelete = vi.fn().mockResolvedValue({
        data: { success: true },
      });

      vi.mocked(apiClient.get).mockImplementation(mockGet);
      vi.mocked(apiClient.delete).mockImplementation(mockDelete);

      const { result } = renderHook(() => useCoachBatches(coachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success;
      await act(async () => {
        success = await result.current.unassignBatch('batch-001');
      });

      expect(mockDelete).toHaveBeenCalledWith(`/coaches/${coachId}/batches/batch-001`);
      expect(success).toBe(true);
    });

    it('should refetch batches after successful unassignment', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockBatches });
      const mockDelete = vi.fn().mockResolvedValue({
        data: { success: true },
      });

      vi.mocked(apiClient.get).mockImplementation(mockGet);
      vi.mocked(apiClient.delete).mockImplementation(mockDelete);

      const { result } = renderHook(() => useCoachBatches(coachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.unassignBatch('batch-001');
      });

      // Should have called get twice: once on mount, once after unassignment
      expect(mockGet).toHaveBeenCalledTimes(2);
    });

    it('should handle failure response', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockBatches });
      const mockDelete = vi.fn().mockResolvedValue({
        data: { success: false },
      });

      vi.mocked(apiClient.get).mockImplementation(mockGet);
      vi.mocked(apiClient.delete).mockImplementation(mockDelete);

      const { result } = renderHook(() => useCoachBatches(coachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success;
      await act(async () => {
        success = await result.current.unassignBatch('batch-001');
      });

      expect(success).toBe(false);
    });
  });

  describe('refetch function', () => {
    it('should refetch batches on demand', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockBatches });
      vi.mocked(apiClient.get).mockImplementation(mockGet);

      const { result } = renderHook(() => useCoachBatches(coachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGet).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockGet).toHaveBeenCalledTimes(2);
    });

    it('should update batches when refetch returns new data', async () => {
      const newBatches = [
        ...mockBatches,
        {
          id: 'batch-003',
          name: 'New Batch',
          schedule: 'Sat 10AM',
          assignedCoachId: coachId,
          studentCount: 5,
          createdAt: '2026-02-01T08:00:00Z',
        },
      ];

      const mockGet = vi.fn()
        .mockResolvedValueOnce({ data: mockBatches })
        .mockResolvedValueOnce({ data: newBatches });

      vi.mocked(apiClient.get).mockImplementation(mockGet);

      const { result } = renderHook(() => useCoachBatches(coachId));

      await waitFor(() => {
        expect(result.current.batches).toHaveLength(2);
      });

      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.batches).toHaveLength(3);
      });
    });
  });

  describe('changing coachId', () => {
    it('should refetch batches when coachId changes', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockBatches });
      vi.mocked(apiClient.get).mockImplementation(mockGet);

      const { result, rerender } = renderHook(
        ({ id }: { id: string }) => useCoachBatches(id),
        { initialProps: { id: 'coach-001' } }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGet).toHaveBeenCalledWith('/coaches/coach-001/batches');

      // Change coachId
      rerender({ id: 'coach-002' });

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalledWith('/coaches/coach-002/batches');
      });
    });
  });

  describe('return value properties', () => {
    it('should return object with all expected properties', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockBatches });
      vi.mocked(apiClient.get).mockImplementation(mockGet);

      const { result } = renderHook(() => useCoachBatches(coachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toHaveProperty('batches');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('assignBatch');
      expect(result.current).toHaveProperty('unassignBatch');
      expect(result.current).toHaveProperty('refetch');
    });

    it('should return batches as array', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockBatches });
      vi.mocked(apiClient.get).mockImplementation(mockGet);

      const { result } = renderHook(() => useCoachBatches(coachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(Array.isArray(result.current.batches)).toBe(true);
    });

    it('should return isLoading as boolean', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockBatches });
      vi.mocked(apiClient.get).mockImplementation(mockGet);

      const { result } = renderHook(() => useCoachBatches(coachId));

      expect(typeof result.current.isLoading).toBe('boolean');

      await waitFor(() => {
        expect(typeof result.current.isLoading).toBe('boolean');
      });
    });

    it('should return mutation functions callable', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockBatches });
      const mockPost = vi.fn().mockResolvedValue({
        data: { success: true, batch: mockBatches[0] },
      });
      const mockDelete = vi.fn().mockResolvedValue({
        data: { success: true },
      });

      vi.mocked(apiClient.get).mockImplementation(mockGet);
      vi.mocked(apiClient.post).mockImplementation(mockPost);
      vi.mocked(apiClient.delete).mockImplementation(mockDelete);

      const { result } = renderHook(() => useCoachBatches(coachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.assignBatch).toBe('function');
      expect(typeof result.current.unassignBatch).toBe('function');
      expect(typeof result.current.refetch).toBe('function');
    });
  });
});
