/**
 * useLeaveRequests Hook
 * Manages leave request operations with API backend.
 * Requirements: 3.1, 3.3, 3.4
 *
 * - Fetches leave requests with filtering (batchId, studentId, status)
 * - Creates new leave requests (students for self, coaches for any)
 * - Reviews (approves/rejects) leave requests
 */

import { useState, useEffect, useCallback } from 'react';
import type { LeaveRequest, LeaveRequestStatus, LeaveType } from '../types';
import apiClient from '../utils/apiClient';

export interface CreateLeaveRequestData {
  studentId: string;
  batchId: string;
  requestedDate: string; // ISO date string
  leaveType: LeaveType;
  reason?: string;
}

export interface ReviewLeaveRequestData {
  status: 'APPROVED' | 'REJECTED';
}

export interface LeaveRequestFilters {
  batchId?: string;
  studentId?: string;
  status?: LeaveRequestStatus;
}

/**
 * Hook for fetching leave requests with optional filters.
 * Requirement 3.3: coaches view pending leave requests for students in assigned batches.
 */
export function useLeaveRequests(filters?: LeaveRequestFilters) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaveRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters?.batchId) params.append('batchId', filters.batchId);
      if (filters?.studentId) params.append('studentId', filters.studentId);
      if (filters?.status) params.append('status', filters.status);

      const response = await apiClient.get<LeaveRequest[]>(
        `/leave-requests?${params.toString()}`
      );

      setLeaveRequests(response.data);
    } catch (err) {
      console.error('Failed to fetch leave requests:', err);
      setError('Failed to load leave requests. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters?.batchId, filters?.studentId, filters?.status]);

  useEffect(() => {
    void fetchLeaveRequests();
  }, [fetchLeaveRequests]);

  return {
    leaveRequests,
    loading,
    error,
    refetch: fetchLeaveRequests,
  };
}

/**
 * Hook for creating a leave request.
 * Requirement 3.1: student submits a leave request with student ID, requested date, leave type, and reason.
 */
export function useCreateLeaveRequest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLeaveRequest = useCallback(
    async (data: CreateLeaveRequestData): Promise<LeaveRequest> => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.post<LeaveRequest>('/leave-requests', data);
        return response.data;
      } catch (err) {
        const message = 'Failed to create leave request. Please try again.';
        console.error('Failed to create leave request:', err);
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    createLeaveRequest,
    loading,
    error,
  };
}

/**
 * Hook for reviewing (approving/rejecting) a leave request.
 * Requirement 3.4: coach approves or rejects a leave request, updating its status.
 */
export function useReviewLeaveRequest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reviewLeaveRequest = useCallback(
    async (id: string, data: ReviewLeaveRequestData): Promise<LeaveRequest> => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.patch<LeaveRequest>(
          `/leave-requests/${id}`,
          data
        );
        return response.data;
      } catch (err) {
        const message = 'Failed to review leave request. Please try again.';
        console.error('Failed to review leave request:', err);
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    reviewLeaveRequest,
    loading,
    error,
  };
}
