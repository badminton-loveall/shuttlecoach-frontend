/**
 * Tests for useSkillTimeline hook
 * Validates timeline fetching, data parsing, currentScore derivation, and error handling.
 * Requirements: 7.1, 10.4, 10.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSkillTimeline } from './useSkillTimeline';
import apiClient from '../utils/apiClient';

// Mock the apiClient module
vi.mock('../utils/apiClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockTimelineResponse = {
  studentId: 'student-001',
  skillId: 'bh-short-service',
  skillName: 'BH Short Service',
  category: 'service',
  timeline: [
    { cycleKey: 'Jan-Feb 2026', weekNumber: 1, score: 0, recordedAt: '2026-01-08T10:00:00Z' },
    { cycleKey: 'Jan-Feb 2026', weekNumber: 2, score: 1, recordedAt: '2026-01-15T10:00:00Z' },
    { cycleKey: 'Jan-Feb 2026', weekNumber: 3, score: 1, recordedAt: '2026-01-22T10:00:00Z' },
    { cycleKey: 'Jan-Feb 2026', weekNumber: 4, score: 2, recordedAt: '2026-01-29T10:00:00Z' },
  ],
};

describe('useSkillTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetching timeline data', () => {
    it('should fetch timeline on mount with correct params', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockTimelineResponse });
      vi.mocked(apiClient.get).mockImplementation(mockGet);

      const { result } = renderHook(() =>
        useSkillTimeline({ studentId: 'student-001', skillId: 'bh-short-service' })
      );

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGet).toHaveBeenCalledWith(
        '/skill-scores/timeline?studentId=student-001&skillId=bh-short-service'
      );
      expect(result.current.timeline).toHaveLength(4);
      expect(result.current.skillName).toBe('BH Short Service');
      expect(result.current.category).toBe('service');
    });

    it('should parse recordedAt into Date objects', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockTimelineResponse });
      vi.mocked(apiClient.get).mockImplementation(mockGet);

      const { result } = renderHook(() =>
        useSkillTimeline({ studentId: 'student-001', skillId: 'bh-short-service' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.timeline[0].recordedAt).toBeInstanceOf(Date);
      expect(result.current.timeline[0].recordedAt.toISOString()).toBe('2026-01-08T10:00:00.000Z');
    });

    it('should derive currentScore from the last timeline point', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockTimelineResponse });
      vi.mocked(apiClient.get).mockImplementation(mockGet);

      const { result } = renderHook(() =>
        useSkillTimeline({ studentId: 'student-001', skillId: 'bh-short-service' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Last point has score 2
      expect(result.current.currentScore).toBe(2);
    });

    it('should return null currentScore for empty timeline', async () => {
      const emptyResponse = {
        ...mockTimelineResponse,
        timeline: [],
      };
      const mockGet = vi.fn().mockResolvedValue({ data: emptyResponse });
      vi.mocked(apiClient.get).mockImplementation(mockGet);

      const { result } = renderHook(() =>
        useSkillTimeline({ studentId: 'student-001', skillId: 'bh-short-service' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.currentScore).toBeNull();
      expect(result.current.timeline).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should handle fetch errors gracefully', async () => {
      const mockGet = vi.fn().mockRejectedValue(new Error('Network error'));
      vi.mocked(apiClient.get).mockImplementation(mockGet);

      const { result } = renderHook(() =>
        useSkillTimeline({ studentId: 'student-001', skillId: 'bh-short-service' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load skill timeline. Please try again.');
      expect(result.current.timeline).toHaveLength(0);
    });

    it('should not fetch when studentId is empty', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockTimelineResponse });
      vi.mocked(apiClient.get).mockImplementation(mockGet);

      const { result } = renderHook(() =>
        useSkillTimeline({ studentId: '', skillId: 'bh-short-service' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGet).not.toHaveBeenCalled();
      expect(result.current.timeline).toHaveLength(0);
    });

    it('should not fetch when skillId is empty', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockTimelineResponse });
      vi.mocked(apiClient.get).mockImplementation(mockGet);

      const { result } = renderHook(() =>
        useSkillTimeline({ studentId: 'student-001', skillId: '' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGet).not.toHaveBeenCalled();
      expect(result.current.timeline).toHaveLength(0);
    });
  });

  describe('return value properties', () => {
    it('should return object with all expected properties', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockTimelineResponse });
      vi.mocked(apiClient.get).mockImplementation(mockGet);

      const { result } = renderHook(() =>
        useSkillTimeline({ studentId: 'student-001', skillId: 'bh-short-service' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current).toHaveProperty('timeline');
      expect(result.current).toHaveProperty('skillName');
      expect(result.current).toHaveProperty('category');
      expect(result.current).toHaveProperty('currentScore');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
    });
  });
});
