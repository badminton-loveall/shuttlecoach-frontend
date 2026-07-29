/**
 * Preservation Property Tests - useStudents Hook
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 *
 * These tests capture existing correct behavior that MUST be maintained
 * after the infinite-loop fix. They MUST PASS on unfixed code.
 *
 * Preservation behaviors tested:
 * 1. No-filter default fetch: useStudents() with no filters fetches successfully
 * 2. Stable memoized filter reference: constant object fetches exactly once
 * 3. Mutation refresh (create): createStudent triggers re-fetch
 * 4. Mutation refresh (update): updateStudent triggers re-fetch
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useStudents } from './useStudents';

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

const mockStudentsResponse = {
  data: {
    students: [
      {
        id: 'student-001',
        fullName: 'Arjun Verma',
        dateOfBirth: '2012-05-15',
        createdAt: '2026-01-05T09:00:00Z',
        updatedAt: '2026-01-05T09:00:00Z',
        gender: 'Male',
        contactPhone: '9876543210',
        skillLevel: 'Intermediate',
      },
      {
        id: 'student-002',
        fullName: 'Neha Singh',
        dateOfBirth: '2011-08-22',
        createdAt: '2026-01-05T09:00:00Z',
        updatedAt: '2026-01-05T09:00:00Z',
        gender: 'Female',
        contactPhone: '9876543211',
        skillLevel: 'Advanced',
      },
    ],
    total: 2,
    page: 1,
  },
};

// Stable filter reference defined OUTSIDE of any render function
const STABLE_FILTERS = { batch: 'batch-1' } as const;

describe('useStudents - Preservation Properties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApiClient.get.mockResolvedValue(mockStudentsResponse);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Property: No-filter default fetch', () => {
    it('useStudents() with no filters fetches the default paginated list and returns students', async () => {
      /**
       * Validates: Requirements 3.1
       *
       * When useStudents() is called with no filters, it should fetch
       * the default student list from the API and return the results.
       */
      const { result } = renderHook(() => useStudents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should have called API
      expect(mockedApiClient.get).toHaveBeenCalled();
      // Should have the URL start with /students
      expect(mockedApiClient.get.mock.calls[0][0]).toContain('/students');
      // Should return students from the response
      expect(result.current.students).toHaveLength(2);
      expect(result.current.students[0].fullName).toBe('Arjun Verma');
      expect(result.current.total).toBe(2);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Property: Stable memoized filter reference', () => {
    it('useStudents(stableRef) with a constant object defined outside render fetches exactly once', async () => {
      /**
       * Validates: Requirements 3.2
       *
       * When useStudents is called with a filter object that is a stable
       * reference (defined outside the component or memoized), it should
       * only fetch once on mount and not re-fetch on subsequent renders.
       *
       * NOTE: This works on unfixed code because the same object reference
       * is passed each render (no new object is created).
       */
      const { result, rerender } = renderHook(() => useStudents(STABLE_FILTERS));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // First call - initial mount fetch
      expect(mockedApiClient.get).toHaveBeenCalledTimes(1);

      // Re-render with same stable reference - should NOT trigger new fetch
      rerender();
      rerender();

      // Wait a tick for any effects to settle
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      // Still only 1 call - stable reference means no re-fetch
      expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('Property: Mutation refresh (create)', () => {
    it('after createStudent(data) succeeds, the hook re-fetches the list', async () => {
      /**
       * Validates: Requirements 3.4
       *
       * When createStudent is called and succeeds, it should call
       * fetchStudents again to refresh the list with the latest data.
       */
      const newStudentResponse = {
        data: {
          id: 'student-new-001',
          fullName: 'New Student',
          dateOfBirth: '2010-06-15',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          gender: 'Male',
          contactPhone: '9876500000',
          skillLevel: 'Beginner',
        },
      };

      mockedApiClient.post.mockResolvedValue(newStudentResponse);

      const { result } = renderHook(() => useStudents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Record the get call count after initial fetch
      const callCountAfterMount = mockedApiClient.get.mock.calls.length;

      // Call createStudent
      await act(async () => {
        await result.current.createStudent({
          fullName: 'New Student',
          dateOfBirth: '2010-06-15',
          gender: 'Male',
          contactPhone: '9876500000',
        });
      });

      // apiClient.get should be called again (re-fetch after create)
      expect(mockedApiClient.get.mock.calls.length).toBeGreaterThan(callCountAfterMount);
    });
  });

  describe('Property: Mutation refresh (update)', () => {
    it('after updateStudent(id, data) succeeds, the hook re-fetches the list', async () => {
      /**
       * Validates: Requirements 3.4
       *
       * When updateStudent is called and succeeds, it should call
       * fetchStudents again to refresh the list with the latest data.
       */
      const updatedStudentResponse = {
        data: {
          id: 'student-001',
          fullName: 'Arjun Updated',
          dateOfBirth: '2012-05-15',
          createdAt: '2026-01-05T09:00:00Z',
          updatedAt: new Date().toISOString(),
          gender: 'Male',
          contactPhone: '9876543210',
          skillLevel: 'Intermediate',
        },
      };

      mockedApiClient.patch.mockResolvedValue(updatedStudentResponse);

      const { result } = renderHook(() => useStudents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Record the get call count after initial fetch
      const callCountAfterMount = mockedApiClient.get.mock.calls.length;

      // Call updateStudent
      await act(async () => {
        await result.current.updateStudent('student-001', {
          fullName: 'Arjun Updated',
        });
      });

      // apiClient.get should be called again (re-fetch after update)
      expect(mockedApiClient.get.mock.calls.length).toBeGreaterThan(callCountAfterMount);
    });
  });
});
