import React, { useState, useMemo } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useLeaveRequests, useReviewLeaveRequest } from '../hooks/useLeaveRequests';
import type { LeaveRequestStatus, LeaveRequest } from '../types';

/**
 * LeaveRequestsPage
 * Coach interface for reviewing and managing student leave requests.
 * Displays pending requests with approve/reject actions.
 * Requirements: 3.3, 3.4, 13.2
 */

const STATUS_LABELS: Record<LeaveRequestStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

const STATUS_STYLES: Record<LeaveRequestStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const LEAVE_TYPE_LABELS: Record<string, string> = {
  PLANNED_LEAVE: 'Planned Leave',
  SICK_LEAVE: 'Sick Leave',
};

const LeaveRequestsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<LeaveRequestStatus | ''>('PENDING');

  const filters = useMemo(
    () => (statusFilter ? { status: statusFilter as LeaveRequestStatus } : undefined),
    [statusFilter]
  );

  const { leaveRequests, loading, error, refetch } = useLeaveRequests(filters);
  const { reviewLeaveRequest, loading: reviewLoading } = useReviewLeaveRequest();

  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = async (request: LeaveRequest) => {
    setReviewingId(request.id);
    try {
      await reviewLeaveRequest(request.id, { status: 'APPROVED' });
      showToast(`Leave request approved for ${formatDate(request.requestedDate)}`, 'success');
      await refetch();
    } catch {
      showToast('Failed to approve request. Please try again.', 'error');
    } finally {
      setReviewingId(null);
    }
  };

  const handleReject = async (request: LeaveRequest) => {
    setReviewingId(request.id);
    try {
      await reviewLeaveRequest(request.id, { status: 'REJECTED' });
      showToast(`Leave request rejected for ${formatDate(request.requestedDate)}`, 'success');
      await refetch();
    } catch {
      showToast('Failed to reject request. Please try again.', 'error');
    } finally {
      setReviewingId(null);
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <DashboardLayout>
      <div className="hc-dashboard">
        <div className="hc-dashboard-content">
          {/* Toast notification */}
          {toast && (
            <div
              className={`fixed top-4 right-4 z-50 rounded-md px-4 py-3 text-sm font-medium shadow-lg transition-all ${
                toast.type === 'success'
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
              style={{ border: '1px solid var(--border-default)' }}
              role="alert"
              aria-live="polite"
            >
              {toast.message}
            </div>
          )}

          {/* Page Header */}
          <div className="page-header">
            <div>
              <h1 className="page-header-title">Leave Requests</h1>
              <p className="page-header-subtitle">
                Review and manage student leave requests
              </p>
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Filter:</span>
            <div className="filter-status-badges">
              <button
                onClick={() => setStatusFilter('')}
                className={`filter-status-badge filter-badge--paid ${statusFilter === '' ? 'active' : ''}`}
                style={statusFilter === '' ? undefined : { borderColor: 'var(--border-strong)', color: 'var(--text-secondary)' }}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`filter-status-badge filter-badge--pending ${statusFilter === 'PENDING' ? 'active' : ''}`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter('APPROVED')}
                className={`filter-status-badge filter-badge--paid ${statusFilter === 'APPROVED' ? 'active' : ''}`}
              >
                Approved
              </button>
              <button
                onClick={() => setStatusFilter('REJECTED')}
                className={`filter-status-badge filter-badge--overdue ${statusFilter === 'REJECTED' ? 'active' : ''}`}
              >
                Rejected
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div
              style={{
                backgroundColor: 'var(--surface-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-2xl)',
              }}
            >
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div
              className="rounded-md p-4 text-sm"
              style={{
                backgroundColor: 'var(--feedback-danger-light)',
                color: 'var(--color-danger)',
                border: '1px solid var(--color-danger)',
              }}
            >
              {error}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && leaveRequests.length === 0 && (
            <div
              className="text-center"
              style={{
                backgroundColor: 'var(--surface-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-2xl)',
              }}
            >
              <svg
                className="mx-auto h-12 w-12"
                style={{ color: 'var(--text-tertiary)' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="mt-3 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                {statusFilter
                  ? `No ${STATUS_LABELS[statusFilter].toLowerCase()} leave requests found.`
                  : 'No leave requests found.'}
              </p>
            </div>
          )}

          {/* Leave Requests List */}
          {!loading && !error && leaveRequests.length > 0 && (
            <div className="flex flex-col gap-3">
              {leaveRequests.map((request) => (
                <div
                  key={request.id}
                  className="transition-all"
                  style={{
                    backgroundColor: 'var(--surface-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-md)',
                    boxShadow: 'var(--shadow-card)',
                  }}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* Request Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {formatDate(request.requestedDate)}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            STATUS_STYLES[request.status]
                          }`}
                        >
                          {STATUS_LABELS[request.status]}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {LEAVE_TYPE_LABELS[request.leaveType] || request.leaveType}
                        </span>
                      </div>
                      <div className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        Student: {request.studentId.slice(0, 8)}...
                        {' | '}
                        Submitted: {formatDate(request.createdAt)}
                      </div>
                      {request.reason && (
                        <p className="mt-1 text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                          Reason: {request.reason}
                        </p>
                      )}
                    </div>

                    {/* Actions (only for pending requests) */}
                    {request.status === 'PENDING' && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleApprove(request)}
                          disabled={reviewLoading && reviewingId === request.id}
                          className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
                          aria-label={`Approve leave request for ${formatDate(request.requestedDate)}`}
                        >
                          {reviewLoading && reviewingId === request.id ? '...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(request)}
                          disabled={reviewLoading && reviewingId === request.id}
                          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                          aria-label={`Reject leave request for ${formatDate(request.requestedDate)}`}
                        >
                          {reviewLoading && reviewingId === request.id ? '...' : 'Reject'}
                        </button>
                      </div>
                    )}

                    {/* Reviewed info for non-pending */}
                    {request.status !== 'PENDING' && request.reviewedAt && (
                      <div className="text-xs shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                        Reviewed: {formatDate(request.reviewedAt)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Request Count */}
          {!loading && !error && leaveRequests.length > 0 && (
            <div className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
              Showing {leaveRequests.length} request{leaveRequests.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LeaveRequestsPage;
