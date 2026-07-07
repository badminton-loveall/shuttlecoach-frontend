/**
 * Tests for useCoachDetail hook
 * Validates fetching single coach profile, loading/error states, and refetch functionality.
 * Requirements: 1.1, 2.1, 20.1
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCoachDetail } from './useCoachDetail';
import apiClient from '../utils/apiClient';

// Mock the API client
vi.mock('../utils/apiClient');

const mockCoach = {
  id: 'coach-001',
  username: 'coach_arjun',
  role: 'HEAD_COACH' as const,
  name: 'Arjun Verma',
  email: 'arjun@example.com',
  profilePhoto: 'https://example.com/photo.jpg',
  specialization: 'Badminton Coaching',
  createdAt: '2026-01-15T09:00:00Z',
  lastActive: '2026-02-10T15:30:00Z',
};

describe('useCoachDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with loading state', () => {
      vi.mocked(apiClient.get).mockImplementation(
        () =>
          new Promise(() => {
            // Never resolves to keep loading state
          })
      );

      const { result } = renderHook(() => useCoachDetail('coach-001'));

      expect(result.current.coach).toBeNull();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
    });
  });

  describe('successful data fetch', () => {
    it('should fetch coach data on mount', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockCoach,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const { result } = renderHook(() => useCoachDetail('coach-001'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.coach).toEqual({
        ...mockCoach,
        createdAt: expect.any(Date),
        lastActive: expect.any(Date),
      });
      expect(result.current.error).toBeNull();
    });

    it('should parse date strings into Date objects', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockCoach,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const { result } = renderHook(() => useCoachDetail('coach-001'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.coach?.createdAt).toBeInstanceOf(Date);
      expect(result.current.coach?.lastActive).toBeInstanceOf(Date);
    });

    it('should call API with correct coachId', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockCoach,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      renderHook(() => useCoachDetail('coach-001'));

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith('/coaches/coach-001');
      });
    });
  });

  describe('error handling', () => {
    it('should handle 404 error with specific message', async () => {
      const error = new Error('Not Found');
      (error as any).response = { status: 404 };
      vi.mocked(apiClient.get).mockRejectedValue(error);

      const { result } = renderHook(() => useCoachDetail('non-existent'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.coach).toBeNull();
      expect(result.current.error).toContain('Coach not found');
    });

    it('should handle 403 error with permission message', async () => {
      const error = new Error('Forbidden');
      (error as any).response = { status: 403 };
      vi.mocked(apiClient.get).mockRejectedValue(error);

      const { result } = renderHook(() => useCoachDetail('coach-001'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.coach).toBeNull();
      expect(result.current.error).toContain('do not have permission');
    });

    it('should handle network errors', async () => {
      const error = new Error('Network Error');
      (error as any).code = 'ECONNABORTED';
      vi.mocked(apiClient.get).mockRejectedValue(error);

      const { result } = renderHook(() => useCoachDetail('coach-001'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.coach).toBeNull();
      expect(result.current.error).toContain('Network error');
    });

    it('should handle 500 server errors', async () => {
      const error = new Error('Server Error');
      (error as any).response = { status: 500 };
      vi.mocked(apiClient.get).mockRejectedValue(error);

      const { result } = renderHook(() => useCoachDetail('coach-001'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.coach).toBeNull();
      expect(result.current.error).toContain('Server error');
    });

    it('should handle generic errors with fallback message', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Unknown error'));

      const { result } = renderHook(() => useCoachDetail('coach-001'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.coach).toBeNull();
      expect(result.current.error).toContain('Failed to load');
    });

    it('should handle non-Error exceptions', async () => {
      vi.mocked(apiClient.get).mockRejectedValue('String error');

      const { result } = renderHook(() => useCoachDetail('coach-001'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.coach).toBeNull();
      expect(result.current.error).toContain('unexpected error');
    });
  });

  describe('refetch functionality', () => {
    it('should provide refetch function that refetches data', async () => {
      const mockResponse = {
        data: mockCoach,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCoachDetail('coach-001'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Clear the mock to track subsequent calls
      vi.mocked(apiClient.get).mockClear();
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      // Manually call refetch
      await result.current.refetch();

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith('/coaches/coach-001');
      });
    });

    it('should reset error state on successful refetch', async () => {
      const error = new Error('Not Found');
      (error as any).response = { status: 404 };
      vi.mocked(apiClient.get).mockRejectedValue(error);

      const { result } = renderHook(() => useCoachDetail('coach-001'));

      await waitFor(() => {
        expect(result.current.error).toContain('Coach not found');
      });

      // Mock a successful response
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockCoach,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.coach).not.toBeNull();
      });
    });
  });

  describe('coachId changes', () => {
    it('should refetch when coachId prop changes', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockCoach,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const { result, rerender } = renderHook(
        ({ coachId }: { coachId: string }) => useCoachDetail(coachId),
        { initialProps: { coachId: 'coach-001' } }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(apiClient.get).toHaveBeenCalledWith('/coaches/coach-001');

      // Change coachId
      vi.mocked(apiClient.get).mockClear();
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { ...mockCoach, id: 'coach-002', name: 'Different Coach' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      rerender({ coachId: 'coach-002' });

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith('/coaches/coach-002');
      });

      expect(result.current.coach?.id).toBe('coach-002');
    });

    it('should not fetch when coachId is empty string', () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockCoach,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const { result } = renderHook(() => useCoachDetail(''));

      // Should not make API call when coachId is empty
      expect(apiClient.get).not.toHaveBeenCalled();
      expect(result.current.coach).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('return type validation', () => {
    it('should return object with required properties', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockCoach,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const { result } = renderHook(() => useCoachDetail('coach-001'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toHaveProperty('coach');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('refetch');
    });

    it('should have refetch as a function', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockCoach,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const { result } = renderHook(() => useCoachDetail('coach-001'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.refetch).toBe('function');
    });
  });
});
