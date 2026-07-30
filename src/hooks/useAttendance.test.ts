/**
 * Tests for useAttendance hooks
 * Validates attendance record fetching, marking, stats, and error handling.
 * Requirements: 1.1, 4.1, 4.2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMarkAttendance, useAttendanceRecords, useAttendanceStats } from './useAttendance';
import apiClient from '../utils/apiClient';

// Mock the apiClient module
vi.mock('../utils/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockRecords = [
  {
    id: 'rec-001',
    studentId: 'student-001',
    batchId: 'batch-001',
    sessionDate: '2026-01-15',
    status: 'PRESENT',
    markedBy: 'coach-001',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 'rec-002',
    studentId: 'student-002',
    batchId: 'batch-001',
    sessionDate: '2026-01-15',
    status: 'ABSENT',
    leaveType: 'SICK_LEAVE',
    markedBy: 'coach-001',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-01-15T08:00:00Z',
  },
];

const mockStats = [
  {
    studentId: 'student-001',
    studentName: 'John Doe',
    totalSessions: 20,
    attended: 18,
    late: 1,
    absent: 1,
    attendancePercentage: 95.0,
  },
  {
    studentId: 'student-002',
    studentName: 'Jane Smith',
    totalSessions: 20,
    attended: 14,
    late: 2,
    absent: 4,
    attendancePercentage: 80.0,
  },
];

describe('useMarkAttendance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start with no loading and no error', () => {
    const { result } = renderHook(() => useMarkAttendance());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should mark attendance successfully', async () => {
    const mockResponse = { success: true, recordCount: 2 };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

    const { result } = renderHook(() => useMarkAttendance());

    let response;
    await act(async () => {
      response = await result.current.markAttendance({
        batchId: 'batch-001',
        sessionDate: '2026-01-15',
        records: [
          { studentId: 'student-001', status: 'PRESENT' },
          { studentId: 'student-002', status: 'ABSENT', leaveType: 'SICK_LEAVE' },
        ],
      });
    });

    expect(apiClient.post).toHaveBeenCalledWith('/attendance', {
      batchId: 'batch-001',
      sessionDate: '2026-01-15',
      records: [
        { studentId: 'student-001', status: 'PRESENT' },
        { studentId: 'student-002', status: 'ABSENT', leaveType: 'SICK_LEAVE' },
      ],
    });
    expect(response).toEqual(mockResponse);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should set error on failure', async () => {
    const mockError = {
      response: { data: { message: 'Date is more than 7 days in the past' } },
    };
    vi.mocked(apiClient.post).mockRejectedValue(mockError);

    const { result } = renderHook(() => useMarkAttendance());

    await act(async () => {
      try {
        await result.current.markAttendance({
          batchId: 'batch-001',
          sessionDate: '2025-01-01',
          records: [{ studentId: 'student-001', status: 'PRESENT' }],
        });
      } catch {
        // Expected to throw
      }
    });

    expect(result.current.error).toBe('Date is more than 7 days in the past');
    expect(result.current.loading).toBe(false);
  });

  it('should reset error state', async () => {
    const mockError = {
      response: { data: { message: 'Some error' } },
    };
    vi.mocked(apiClient.post).mockRejectedValue(mockError);

    const { result } = renderHook(() => useMarkAttendance());

    await act(async () => {
      try {
        await result.current.markAttendance({
          batchId: 'batch-001',
          sessionDate: '2026-01-15',
          records: [{ studentId: 'student-001', status: 'PRESENT' }],
        });
      } catch {
        // Expected
      }
    });

    expect(result.current.error).toBe('Some error');

    act(() => {
      result.current.reset();
    });

    expect(result.current.error).toBeNull();
  });
});

describe('useAttendanceRecords', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch records on mount', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockRecords });

    const { result } = renderHook(() =>
      useAttendanceRecords({ batchId: 'batch-001' })
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.records).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it('should pass filters as query parameters', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });

    renderHook(() =>
      useAttendanceRecords({
        batchId: 'batch-001',
        studentId: 'student-001',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      })
    );

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(
        '/attendance?batchId=batch-001&studentId=student-001&startDate=2026-01-01&endDate=2026-01-31'
      );
    });
  });

  it('should handle fetch errors gracefully', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() =>
      useAttendanceRecords({ batchId: 'batch-001' })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load attendance records. Please try again.');
    expect(result.current.records).toHaveLength(0);
  });

  it('should refetch records on demand', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockRecords });

    const { result } = renderHook(() =>
      useAttendanceRecords({ batchId: 'batch-001' })
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

describe('useAttendanceStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch stats on mount', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockStats });

    const { result } = renderHook(() =>
      useAttendanceStats({ batchId: 'batch-001' })
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toHaveLength(2);
    expect(result.current.stats[0].attendancePercentage).toBe(95.0);
    expect(result.current.error).toBeNull();
  });

  it('should pass filters as query parameters', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });

    renderHook(() =>
      useAttendanceStats({
        batchId: 'batch-001',
        startDate: '2026-01-01',
        endDate: '2026-06-30',
      })
    );

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(
        '/attendance/stats?batchId=batch-001&startDate=2026-01-01&endDate=2026-06-30'
      );
    });
  });

  it('should handle fetch errors gracefully', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(() =>
      useAttendanceStats({ batchId: 'batch-001' })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load attendance statistics. Please try again.');
    expect(result.current.stats).toHaveLength(0);
  });

  it('should refetch stats on demand', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockStats });

    const { result } = renderHook(() =>
      useAttendanceStats({ batchId: 'batch-001' })
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
