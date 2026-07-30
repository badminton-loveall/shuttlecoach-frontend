/**
 * Tests for useSkillScores hook
 * Validates score fetching, recording, refetching, and error handling.
 * Requirements: 6.1, 6.2, 8.5, 8.6, 10.1, 10.2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSkillScores } from './useSkillScores';
import apiClient from '../utils/apiClient';

// Mock the apiClient module
vi.mock('../utils/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockApiResponse = {
  studentId: 'student-001',
  totalRecords: 3,
  cycles: ['Jan-Feb 2026', 'Mar-Apr 2026'],
  scores: [
    {
      id: 'score-1',
      studentId: 'student-001',
      weekNumber: 1,
      cycleKey: 'Jan-Feb 2026',
      skillId: 'bh-short-service',
      skillName: 'BH Short Service',
      category: 'service',
      score: 2,
      recordedBy: 'coach-001',
      recordedAt: '2026-01-08T10:00:00Z',
    },
    {
      id: 'score-2',
      studentId: 'student-001',
      weekNumber: 2,
      cycleKey: 'Jan-Feb 2026',
      skillId: 'bh-short-service',
      skillName: 'BH Short Service',
      category: 'service',
      score: 3,
      recordedBy: 'coach-001',
      recordedAt: '2026-01-15T10:00:00Z',
    },
    {
      id: 'score-3',
      studentId: 'student-001',
      weekNumber: 1,
      cycleKey: 'Mar-Apr 2026',
      skillId: 'cross-drop-fh',
      skillName: 'Cross Drop FH',
      category: 'forehand',
      score: 1,
      recordedBy: 'coach-001',
      recordedAt: '2026-03-05T10:00:00Z',
    },
  ],
};

describe('useSkillScores', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetching scores', () => {
    it('should fetch scores on mount with studentId', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockApiResponse });

      const { result } = renderHook(() =>
        useSkillScores({ studentId: 'student-001' })
      );

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/skill-scores?studentId=student-001'
      );
      expect(result.current.scores).toHaveLength(3);
      expect(result.current.error).toBeNull();
    });

    it('should include cycleKey in fetch when provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockApiResponse });

      const { result } = renderHook(() =>
        useSkillScores({ studentId: 'student-001', cycleKey: 'Jan-Feb 2026' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/skill-scores?studentId=student-001&cycleKey=Jan-Feb+2026'
      );
    });

    it('should parse recordedAt into Date objects', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockApiResponse });

      const { result } = renderHook(() =>
        useSkillScores({ studentId: 'student-001' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.scores[0].recordedAt).toBeInstanceOf(Date);
    });

    it('should expose availableCycles from API response', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockApiResponse });

      const { result } = renderHook(() =>
        useSkillScores({ studentId: 'student-001' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.availableCycles).toEqual(['Jan-Feb 2026', 'Mar-Apr 2026']);
    });

    it('should handle empty scores response', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { studentId: 'student-001', totalRecords: 0, cycles: [], scores: [] },
      });

      const { result } = renderHook(() =>
        useSkillScores({ studentId: 'student-001' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.scores).toHaveLength(0);
      expect(result.current.availableCycles).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should set error on fetch failure', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() =>
        useSkillScores({ studentId: 'student-001' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load skill scores. Please try again.');
      expect(result.current.scores).toHaveLength(0);
    });

    it('should throw error from recordScores on failure', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockApiResponse });
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Record failed'));

      const { result } = renderHook(() =>
        useSkillScores({ studentId: 'student-001' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let recordError: Error | null = null;
      await act(async () => {
        try {
          await result.current.recordScores({
            studentId: 'student-001',
            cycleKey: 'Jan-Feb 2026',
            weekNumber: 3,
            scores: [
              { skillId: 'bh-short-service', skillName: 'BH Short Service', category: 'service', score: 2 },
            ],
          });
        } catch (err) {
          recordError = err as Error;
        }
      });

      expect(recordError).toBeDefined();
      expect(recordError?.message).toBe('Record failed');
    });
  });

  describe('recordScores mutation', () => {
    it('should call POST /api/skill-scores with data', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockApiResponse });
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { message: 'Recorded 1 skill scores for week 3', count: 1 },
      });

      const { result } = renderHook(() =>
        useSkillScores({ studentId: 'student-001' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const recordData = {
        studentId: 'student-001',
        cycleKey: 'Jan-Feb 2026',
        weekNumber: 3 as const,
        scores: [
          { skillId: 'bh-short-service', skillName: 'BH Short Service', category: 'service' as const, score: 2 as const },
        ],
      };

      await act(async () => {
        await result.current.recordScores(recordData);
      });

      expect(apiClient.post).toHaveBeenCalledWith('/skill-scores', recordData);
    });

    it('should refetch scores after successful recording', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockApiResponse });
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { message: 'Recorded 1 skill scores for week 3', count: 1 },
      });

      const { result } = renderHook(() =>
        useSkillScores({ studentId: 'student-001' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear previous call count (1 from mount)
      vi.mocked(apiClient.get).mockClear();
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockApiResponse });

      await act(async () => {
        await result.current.recordScores({
          studentId: 'student-001',
          cycleKey: 'Jan-Feb 2026',
          weekNumber: 3,
          scores: [
            { skillId: 'bh-short-service', skillName: 'BH Short Service', category: 'service', score: 3 },
          ],
        });
      });

      // Should have been called once for the refetch
      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('refetch function', () => {
    it('should refetch scores on demand', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockApiResponse });

      const { result } = renderHook(() =>
        useSkillScores({ studentId: 'student-001' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(apiClient.get).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.refetch();
      });

      expect(apiClient.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('options change', () => {
    it('should refetch when studentId changes', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockApiResponse });

      const { result, rerender } = renderHook(
        (props: { studentId: string; cycleKey?: string }) => useSkillScores(props),
        { initialProps: { studentId: 'student-001' } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      rerender({ studentId: 'student-002' });

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith(
          '/skill-scores?studentId=student-002'
        );
      });
    });

    it('should refetch when cycleKey changes', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockApiResponse });

      const { result, rerender } = renderHook(
        (props: { studentId: string; cycleKey?: string }) => useSkillScores(props),
        { initialProps: { studentId: 'student-001' } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      rerender({ studentId: 'student-001', cycleKey: 'Mar-Apr 2026' });

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith(
          '/skill-scores?studentId=student-001&cycleKey=Mar-Apr+2026'
        );
      });
    });
  });

  describe('return value shape', () => {
    it('should return all expected properties', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockApiResponse });

      const { result } = renderHook(() =>
        useSkillScores({ studentId: 'student-001' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current).toHaveProperty('scores');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('availableCycles');
      expect(result.current).toHaveProperty('recordScores');
      expect(result.current).toHaveProperty('refetch');
      expect(typeof result.current.recordScores).toBe('function');
      expect(typeof result.current.refetch).toBe('function');
    });
  });
});
