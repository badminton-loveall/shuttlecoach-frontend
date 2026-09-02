import React, { useState, useEffect, useCallback } from 'react';
import type { DrillSet, DrillSetCategory, SetStatus } from '../types';
import apiClient from '../utils/apiClient';
import '../styles/pages.css';

/**
 * AdminSetReview Component
 * Lets a Platform_Admin review coach-submitted Drill Sets: view the full
 * category/drill breakdown, then approve (publish) or reject (with a reason).
 */

const STATUS_BADGE_CLASS: Record<SetStatus, string> = {
  draft: 'table-badge--waived',
  pending_review: 'table-badge--pending',
  published: 'table-badge--success',
  rejected: 'table-badge--overdue',
};

const STATUS_LABEL: Record<SetStatus, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  published: 'Published',
  rejected: 'Rejected',
};

export const AdminSetReview: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<SetStatus>('pending_review');
  const [sets, setSets] = useState<DrillSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reviewing, setReviewing] = useState<DrillSet | null>(null);
  const [reviewCategories, setReviewCategories] = useState<DrillSetCategory[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchSets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/admin/drill-sets', {
        params: { status: statusFilter },
      });
      setSets(response.data.sets);
    } catch {
      setError('Failed to load set submissions.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchSets();
  }, [fetchSets]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleOpenReview = async (set: DrillSet) => {
    setReviewing(set);
    setShowRejectForm(false);
    setRejectReason('');
    setReviewLoading(true);
    try {
      const response = await apiClient.get(`/admin/drill-sets/${set.id}`);
      setReviewCategories(response.data.categories || []);
    } catch {
      setReviewCategories([]);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleCloseReview = () => {
    setReviewing(null);
    setReviewCategories([]);
    setShowRejectForm(false);
    setRejectReason('');
  };

  const handleApprove = async () => {
    if (!reviewing) return;
    setActionLoading(true);
    try {
      await apiClient.post(`/admin/drill-sets/${reviewing.id}/approve`);
      setSuccessMessage(`"${reviewing.name}" published to the marketplace.`);
      handleCloseReview();
      await fetchSets();
    } catch {
      setError('Failed to approve set.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reviewing) return;
    setActionLoading(true);
    try {
      await apiClient.post(`/admin/drill-sets/${reviewing.id}/reject`, {
        reason: rejectReason.trim() || undefined,
      });
      setSuccessMessage(`"${reviewing.name}" rejected.`);
      handleCloseReview();
      await fetchSets();
    } catch {
      setError('Failed to reject set.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Set Reviews</h1>
        <p className="admin-page-subtitle">
          Review coach-submitted drill sets before they go live in the marketplace.
        </p>
      </div>

      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-md text-sm">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchSets} className="btn btn-secondary text-xs ml-2">Retry</button>
        </div>
      )}

      <div className="flex gap-3 items-center">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as SetStatus)}
          className="form-input text-sm"
          aria-label="Filter by status"
        >
          <option value="pending_review">Pending Review</option>
          <option value="published">Published</option>
          <option value="rejected">Rejected</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {loading ? (
        <div className="card p-6 text-center text-[var(--text-secondary)]">Loading submissions...</div>
      ) : sets.length === 0 ? (
        <div className="table-filter-section">
          <div className="table-empty">No sets with this status</div>
        </div>
      ) : (
        <div className="marketplace-grid">
          {sets.map((set) => (
            <div
              key={set.id}
              className="card-base card-hover flex flex-col gap-2"
              onClick={() => handleOpenReview(set)}
              role="button"
              tabIndex={0}
              style={{ cursor: 'pointer' }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpenReview(set); } }}
            >
              <div className="card-header" style={{ marginBottom: 'var(--space-sm)' }}>
                <span className={`table-badge ${STATUS_BADGE_CLASS[set.status]}`} style={{ marginBottom: 'var(--space-xs)', display: 'inline-block' }}>
                  {STATUS_LABEL[set.status]}
                </span>
                <h3 className="card-title">{set.name}</h3>
                <p className="card-description" style={{ marginTop: '-4px' }}>
                  by {set.coachName || 'a coach'} · {set.centerName || 'a center'}
                </p>
              </div>
              <p className="card-description" style={{ flex: 1 }}>
                {set.description || 'No description provided.'}
              </p>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {(set.drillCount ?? 0)} drill{(set.drillCount ?? 0) === 1 ? '' : 's'}
              </div>
              <div className="card-footer" style={{ marginTop: 'var(--space-sm)' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); handleOpenReview(set); }}
                  className="btn btn-secondary text-sm w-full"
                >
                  Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewing && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{reviewing.name}</h2>
              <button className="modal-close-btn" onClick={handleCloseReview}>✕</button>
            </div>
            <div className="modal-body">
              <p className="text-sm text-[var(--text-secondary)] mb-1">
                Submitted by {reviewing.coachName || 'a coach'} at {reviewing.centerName || 'a center'}
              </p>
              {reviewing.description && (
                <p className="text-sm text-[var(--text-secondary)] mb-3">{reviewing.description}</p>
              )}

              {reviewLoading ? (
                <p className="text-sm text-[var(--text-secondary)]">Loading categories and drills...</p>
              ) : reviewCategories.length > 0 ? (
                <div className="space-y-4">
                  {reviewCategories.map((category) => (
                    <div key={category.id}>
                      <h4 className="font-semibold text-sm text-[var(--text-primary)] mb-1">{category.name}</h4>
                      {category.drills && category.drills.length > 0 ? (
                        <div className="table-container">
                          <table className="table-styled">
                            <thead>
                              <tr>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              {category.drills.map((drill) => (
                                <tr key={drill.id}>
                                  <td className="text-bold">{drill.name}</td>
                                  <td>{drill.category}</td>
                                  <td className="text-muted">{drill.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-xs text-[var(--text-secondary)]">No drills</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">No categories found in this set.</p>
              )}

              {showRejectForm && (
                <div className="form-group mt-3">
                  <label htmlFor="reject-reason" className="form-label">Rejection reason (optional)</label>
                  <textarea
                    id="reject-reason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="form-input"
                    rows={3}
                    placeholder="Let the coach know why this was rejected"
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={handleCloseReview} className="btn btn-secondary">Cancel</button>
              {reviewing.status === 'pending_review' && !showRejectForm && (
                <>
                  <button onClick={() => setShowRejectForm(true)} className="btn btn-danger">
                    Reject
                  </button>
                  <button onClick={handleApprove} disabled={actionLoading} className="btn btn-primary">
                    {actionLoading ? 'Approving...' : 'Approve & Publish'}
                  </button>
                </>
              )}
              {showRejectForm && (
                <button onClick={handleReject} disabled={actionLoading} className="btn btn-danger">
                  {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSetReview;
