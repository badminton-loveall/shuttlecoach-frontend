import React, { useState, useEffect, useCallback } from 'react';
import type { CenterSubscription } from '../types';
import apiClient from '../utils/apiClient';
import '../styles/pages.css';

/**
 * AdminSubscriptionRequests Component
 * The approval queue for coach self-serve requests (paid items only — a
 * free item activates itself with no request at all). Approve records the
 * offline payment and goes live immediately; Reject declines it.
 */

const formatPrice = (price: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

export const AdminSubscriptionRequests: React.FC = () => {
  const [requests, setRequests] = useState<CenterSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<CenterSubscription[]>('/admin/subscription-requests');
      setRequests(response.data);
    } catch {
      setError('Failed to load subscription requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleApprove = async (request: CenterSubscription) => {
    setActingId(request.id);
    setError(null);
    try {
      await apiClient.post(`/admin/subscription-requests/${request.id}/approve`, {});
      setSuccessMessage(`Approved "${request.itemName}" for ${request.centerName}.`);
      await fetchRequests();
    } catch {
      setError('Failed to approve this request.');
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (request: CenterSubscription) => {
    setActingId(request.id);
    setError(null);
    try {
      await apiClient.post(`/admin/subscription-requests/${request.id}/reject`, {});
      setSuccessMessage(`Rejected "${request.itemName}" for ${request.centerName}.`);
      await fetchRequests();
    } catch {
      setError('Failed to reject this request.');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div>
      <p className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
        Coach-initiated requests for paid items, awaiting your approval. Free items activate on their own and
        never appear here.
      </p>

      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-md text-sm mb-4">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md text-sm flex items-center justify-between mb-4">
          <span>{error}</span>
          <button onClick={fetchRequests} className="btn btn-secondary text-xs ml-2">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="card p-6 text-center text-[var(--text-secondary)]">Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="table-filter-section">
          <div className="table-empty">No pending requests right now.</div>
        </div>
      ) : (
        <div className="table-filter-section">
          <div className="table-container">
            <table className="table-styled">
              <thead>
                <tr>
                  <th>Center</th>
                  <th>Item</th>
                  <th>Price</th>
                  <th>Requested</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td className="text-bold">{request.centerName}</td>
                    <td>{request.itemName}</td>
                    <td>{request.itemPrice != null ? formatPrice(request.itemPrice) : '—'}</td>
                    <td className="text-muted">{new Date(request.startedAt).toLocaleDateString()}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          className="table-action-link"
                          onClick={() => handleApprove(request)}
                          disabled={actingId === request.id}
                        >
                          {actingId === request.id ? 'Working...' : 'Approve'}
                        </button>
                        <button
                          className="table-action-link table-action-link--danger"
                          onClick={() => handleReject(request)}
                          disabled={actingId === request.id}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptionRequests;
