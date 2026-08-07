import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../utils/apiClient';
import type { SlugChangeRequest } from '../../types';
import './SlugChangeRequestsPage.css';

/**
 * SlugChangeRequestsPage
 * Lists all pending slug change requests for admin review.
 * Provides Approve/Reject actions with 409 conflict handling on approval.
 *
 * Requirements: 6.6, 6.7, 6.8, 6.9
 */

interface SlugChangeRequestWithCenter extends SlugChangeRequest {
  centerName: string;
}

export const SlugChangeRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<SlugChangeRequestWithCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get<SlugChangeRequestWithCenter[]>(
        '/admin/slug-change-requests'
      );
      const data = Array.isArray(response.data) ? response.data : [];
      setRequests(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load slug change requests';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      setActionLoading(requestId);
      // Clear any previous error for this row
      setRowErrors((prev) => {
        const next = { ...prev };
        delete next[requestId];
        return next;
      });

      await apiClient.patch(`/admin/slug-change-requests/${requestId}`, { action });

      // Refresh list after successful action
      await fetchRequests();
    } catch (err: unknown) {
      // Handle 409 conflict (slug taken on approval)
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { status?: number; data?: { message?: string } } }).response
          ?.status === 409
      ) {
        const conflictMessage =
          (err as { response?: { data?: { message?: string } } }).response?.data
            ?.message ||
          'Slug is no longer available — it was taken by another center.';
        setRowErrors((prev) => ({ ...prev, [requestId]: conflictMessage }));
      } else {
        const message =
          err instanceof Error ? err.message : `Failed to ${action} request`;
        setRowErrors((prev) => ({ ...prev, [requestId]: message }));
      }
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="slug-requests-page">
      {/* Page Header */}
      <div className="slug-requests-page__header">
        <div>
          <h1 className="slug-requests-page__title">Slug Change Requests</h1>
          <p className="slug-requests-page__subtitle">
            Review and manage pending slug change requests from center admins
          </p>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="slug-requests-page__loading">
          <div className="slug-requests-page__loading-spinner" />
          <p>Loading requests...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="slug-requests-page__error">
          <p>{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && requests.length === 0 && (
        <div className="slug-requests-page__empty">
          <svg
            className="slug-requests-page__empty-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2>No Pending Requests</h2>
          <p>All slug change requests have been reviewed.</p>
        </div>
      )}

      {/* Requests Table */}
      {!loading && !error && requests.length > 0 && (
        <div className="slug-requests-page__table-wrapper">
          <table className="slug-requests-page__table">
            <thead>
              <tr>
                <th>Center Name</th>
                <th>Requested Slug</th>
                <th>Requested By</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="slug-requests-page__cell-center">
                    {request.centerName}
                  </td>
                  <td>
                    <code className="slug-requests-page__cell-slug">
                      {request.requestedSlug}
                    </code>
                  </td>
                  <td>{request.requestedBy}</td>
                  <td className="slug-requests-page__cell-date">
                    {formatDate(request.createdAt)}
                  </td>
                  <td>
                    <div className="slug-requests-page__actions">
                      <button
                        className="slug-requests-page__btn slug-requests-page__btn--approve"
                        onClick={() => void handleAction(request.id, 'approve')}
                        disabled={actionLoading === request.id}
                      >
                        {actionLoading === request.id ? '...' : 'Approve'}
                      </button>
                      <button
                        className="slug-requests-page__btn slug-requests-page__btn--reject"
                        onClick={() => void handleAction(request.id, 'reject')}
                        disabled={actionLoading === request.id}
                      >
                        Reject
                      </button>
                    </div>
                    {rowErrors[request.id] && (
                      <div className="slug-requests-page__row-error">
                        {rowErrors[request.id]}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SlugChangeRequestsPage;
