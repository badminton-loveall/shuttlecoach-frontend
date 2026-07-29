import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useStudents } from './useStudents';

/**
 * Bug Condition Exploration Test - Sub-condition 1: Infinite Loop
 *
 * Validates: Requirements 1.1
 *
 * EXPECTED TO FAIL on unfixed code.
 * The `useStudents` hook uses `[filters]` as a dependency in `useCallback`.
 * When a component passes an inline object like `useStudents({ batch: 'batch-1' })`,
 * a new object reference is created every render, causing `fetchStudents` to be
 * recreated, triggering `useEffect`, updating state, re-rendering, and creating
 * an infinite loop.
 *
 * This test asserts that `apiClient.get` is called at most 2 times, which will
 * fail on unfixed code because the infinite loop causes many more calls.
 */

// Mock apiClient
vi.mock('../utils/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

import apiClient from '../utils/apiClient';

const mockedApiClient = vi.mocked(apiClient);

describe('useStudents - Bug Condition: Infinite Loop with inline filters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock a successful response
    mockedApiClient.get.mockResolvedValue({
      data: {
        students: [],
        total: 0,
        page: 1,
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should NOT call apiClient.get more than 2 times when filters object reference is unstable', async () => {
    /**
     * On unfixed code: The `[filters]` dependency in useCallback creates a new
     * fetchStudents function every render (because a new object reference is passed).
     * This triggers the useEffect, which calls fetchStudents, which updates state,
     * which re-renders, creating an infinite loop.
     *
     * We expect apiClient.get to be called at most 2 times (initial mount + possibly
     * one re-render). On buggy code, it will be called many more times.
     */
    const { result, rerender } = renderHook(
      () => useStudents({ batch: 'batch-1' }),
    );

    // Wait for initial fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Simulate a few re-renders with the same logical filter values
    // (but new object references, as would happen in a real component)
    rerender();
    rerender();
    rerender();

    // Give time for any async effects to settle
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Assert: apiClient.get should be called at most 2 times
    // On unfixed code, the infinite loop will cause many more calls
    expect(mockedApiClient.get.mock.calls.length).toBeLessThanOrEqual(2);
  });
});
