import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../utils/apiClient';
import type { Center } from '../../types';
import './CenterDetailPage.css';

/**
 * CenterDetailPage
 * Shows center info, stats, coach assignment, and activation toggle.
 * Supports inline editing of center fields.
 *
 * Requirements: 2.2, 2.3, 7.3
 */

interface CenterStats {
  studentCount: number;
  coachCount: number;
  revenue: number;
}

export const CenterDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [center, setCenter] = useState<Center | null>(null);
  const [stats, setStats] = useState<CenterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Center>>({});
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Center owner actions state (resend invite / reset password)
  const [isInviting, setIsInviting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [ownerActionSuccess, setOwnerActionSuccess] = useState<string | null>(null);
  const [ownerActionError, setOwnerActionError] = useState<string | null>(null);

  // Activation state
  const [isToggling, setIsToggling] = useState(false);




  const fetchCenter = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);

      // Fetch centers list and find by ID
      const centersResponse = await apiClient.get<Center[]>('/admin/centers');
      const centers = Array.isArray(centersResponse.data) ? centersResponse.data : [];
      const found = centers.find((c) => c.id === id);

      if (!found) {
        setError('Center not found');
        return;
      }

      setCenter(found);

      // Fetch center stats
      try {
        const statsResponse = await apiClient.get<CenterStats>(
          `/admin/centers/${id}/stats`
        );
        setStats(statsResponse.data);
      } catch {
        // Stats may fail if endpoint not ready; show center info anyway
        setStats({ studentCount: 0, coachCount: 0, revenue: 0 });
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load center details';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchCenter();
  }, [fetchCenter]);



  // Start editing
  const handleEditStart = () => {
    if (!center) return;
    setEditForm({
      name: center.name,
      location: center.location,
      contactPhone: center.contactPhone || '',
      contactEmail: center.contactEmail || '',
      logoUrl: center.logoUrl || '',
      planType: center.planType || 'basic',
    });
    setEditError(null);
    setIsEditing(true);
  };

  // Cancel editing
  const handleEditCancel = () => {
    setIsEditing(false);
    setEditForm({});
    setEditError(null);
  };

  // Save edits
  const handleEditSave = async () => {
    if (!id || !center) return;

    if (!editForm.name?.trim()) {
      setEditError('Center name is required');
      return;
    }

    try {
      setIsSaving(true);
      setEditError(null);

      const payload: Partial<Center> = {
        name: editForm.name?.trim(),
        location: editForm.location?.trim() || undefined,
        contactPhone: editForm.contactPhone?.trim() || undefined,
        contactEmail: editForm.contactEmail?.trim() || undefined,
        logoUrl: editForm.logoUrl?.trim() || undefined,
        planType: editForm.planType || undefined,
      };

      await apiClient.patch(`/admin/centers/${id}`, payload);
      setIsEditing(false);
      // Refresh data
      await fetchCenter();
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { data?: { error?: string } } }).response?.data?.error
      ) {
        setEditError(
          (err as { response: { data: { error: string } } }).response.data.error
        );
      } else {
        setEditError('Failed to update center');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Resend invite email to center owner
  const handleResendInvite = async () => {
    if (!id) return;
    try {
      setIsInviting(true);
      setOwnerActionError(null);
      setOwnerActionSuccess(null);
      await apiClient.post(`/admin/centers/${id}/invite-coach`);
      setOwnerActionSuccess('Invite email sent successfully');
      setTimeout(() => setOwnerActionSuccess(null), 5000);
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { data?: { error?: string } } }).response?.data?.error
      ) {
        setOwnerActionError(
          (err as { response: { data: { error: string } } }).response.data.error
        );
      } else {
        setOwnerActionError('Failed to send invite email');
      }
    } finally {
      setIsInviting(false);
    }
  };

  // Send password reset to center owner
  const handleSendPasswordReset = async () => {
    if (!id) return;
    try {
      setIsResetting(true);
      setOwnerActionError(null);
      setOwnerActionSuccess(null);
      await apiClient.post(`/admin/centers/${id}/reset-coach-password`);
      setOwnerActionSuccess('Password reset email sent successfully');
      setTimeout(() => setOwnerActionSuccess(null), 5000);
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { data?: { error?: string } } }).response?.data?.error
      ) {
        setOwnerActionError(
          (err as { response: { data: { error: string } } }).response.data.error
        );
      } else {
        setOwnerActionError('Failed to send password reset email');
      }
    } finally {
      setIsResetting(false);
    }
  };

  // Toggle activation
  const handleToggleActive = async () => {
    if (!id || !center) return;

    try {
      setIsToggling(true);
      await apiClient.post(`/admin/centers/${id}/activate`, {
        isActive: !center.isActive,
      });
      await fetchCenter();
    } catch {
      // Silent fail — UI will reflect unchanged state
    } finally {
      setIsToggling(false);
    }
  };

  const formatRevenue = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Loading state
  if (loading) {
    return (
      <div className="center-detail-page">
        <div className="center-detail-page__loading">
          <div className="center-detail-page__loading-spinner" />
          <p>Loading center details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !center) {
    return (
      <div className="center-detail-page">
        <div className="center-detail-page__error">
          <p>{error || 'Center not found'}</p>
          <button
            className="center-detail-page__back-btn"
            onClick={() => navigate('/admin/centers')}
          >
            Back to Centers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="center-detail-page">
      {/* Header */}
      <div className="center-detail-page__header">
        <div className="center-detail-page__header-left">
          <button
            className="center-detail-page__back-link"
            onClick={() => navigate('/admin/centers')}
            aria-label="Back to centers list"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Centers
          </button>
          <h1 className="center-detail-page__title">{center.name}</h1>
          <span
            className={`center-detail-page__badge ${
              center.isActive
                ? 'center-detail-page__badge--active'
                : 'center-detail-page__badge--inactive'
            }`}
          >
            {center.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="center-detail-page__header-actions">
          {!isEditing && (
            <button
              className="center-detail-page__edit-btn"
              onClick={handleEditStart}
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="center-detail-page__stats-grid">
          <div className="center-detail-page__stat-card">
            <span className="center-detail-page__stat-value">{stats.studentCount}</span>
            <span className="center-detail-page__stat-label">Students</span>
          </div>
          <div className="center-detail-page__stat-card">
            <span className="center-detail-page__stat-value">{stats.coachCount}</span>
            <span className="center-detail-page__stat-label">Coaches</span>
          </div>
          <div className="center-detail-page__stat-card">
            <span className="center-detail-page__stat-value">{formatRevenue(stats.revenue)}</span>
            <span className="center-detail-page__stat-label">Revenue</span>
          </div>
        </div>
      )}

      {/* Center Info / Edit Form */}
      <div className="center-detail-page__section">
        <h2 className="center-detail-page__section-title">Center Information</h2>

        {editError && (
          <div className="center-detail-page__inline-error">
            <p>{editError}</p>
          </div>
        )}

        {isEditing ? (
          <div className="center-detail-page__edit-form">
            <div className="center-detail-page__field">
              <label className="center-detail-page__label" htmlFor="edit-name">
                Name
              </label>
              <input
                id="edit-name"
                className="center-detail-page__input"
                type="text"
                value={editForm.name || ''}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                maxLength={100}
              />
            </div>
            <div className="center-detail-page__field">
              <label className="center-detail-page__label" htmlFor="edit-location">
                Location
              </label>
              <input
                id="edit-location"
                className="center-detail-page__input"
                type="text"
                value={editForm.location || ''}
                onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                maxLength={200}
              />
            </div>
            <div className="center-detail-page__field">
              <label className="center-detail-page__label" htmlFor="edit-phone">
                Phone
              </label>
              <input
                id="edit-phone"
                className="center-detail-page__input"
                type="tel"
                value={editForm.contactPhone || ''}
                onChange={(e) => setEditForm((f) => ({ ...f, contactPhone: e.target.value }))}
                maxLength={20}
              />
            </div>
            <div className="center-detail-page__field">
              <label className="center-detail-page__label" htmlFor="edit-email">
                Email
              </label>
              <input
                id="edit-email"
                className="center-detail-page__input"
                type="email"
                value={editForm.contactEmail || ''}
                onChange={(e) => setEditForm((f) => ({ ...f, contactEmail: e.target.value }))}
                maxLength={100}
              />
            </div>
            <div className="center-detail-page__field">
              <label className="center-detail-page__label" htmlFor="edit-logo">
                Logo URL
              </label>
              <input
                id="edit-logo"
                className="center-detail-page__input"
                type="url"
                value={editForm.logoUrl || ''}
                onChange={(e) => setEditForm((f) => ({ ...f, logoUrl: e.target.value }))}
              />
            </div>
            <div className="center-detail-page__field">
              <label className="center-detail-page__label" htmlFor="edit-plan">
                Plan Type
              </label>
              <select
                id="edit-plan"
                className="center-detail-page__select"
                value={editForm.planType || 'basic'}
                onChange={(e) => setEditForm((f) => ({ ...f, planType: e.target.value }))}
              >
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            <div className="center-detail-page__edit-actions">
              <button
                className="center-detail-page__cancel-btn"
                onClick={handleEditCancel}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                className="center-detail-page__save-btn"
                onClick={handleEditSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="center-detail-page__info-grid">
            <div className="center-detail-page__info-item">
              <span className="center-detail-page__info-label">Location</span>
              <span className="center-detail-page__info-value">
                {center.location || '—'}
              </span>
            </div>
            <div className="center-detail-page__info-item">
              <span className="center-detail-page__info-label">Phone</span>
              <span className="center-detail-page__info-value">
                {center.contactPhone || '—'}
              </span>
            </div>
            <div className="center-detail-page__info-item">
              <span className="center-detail-page__info-label">Email</span>
              <span className="center-detail-page__info-value">
                {center.contactEmail || '—'}
              </span>
            </div>
            <div className="center-detail-page__info-item">
              <span className="center-detail-page__info-label">Plan</span>
              <span className="center-detail-page__info-value center-detail-page__info-value--capitalize">
                {center.planType || 'basic'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Coach Assignment Section */}

      {/* Center Owner Actions — Resend Invite / Password Reset */}
      {center.contactEmail && (
        <div className="center-detail-page__section">
          <h2 className="center-detail-page__section-title">Center Owner</h2>

          {ownerActionError && (
            <div className="center-detail-page__inline-error">
              <p>{ownerActionError}</p>
            </div>
          )}

          {ownerActionSuccess && (
            <div className="center-detail-page__inline-success">
              <p>{ownerActionSuccess}</p>
            </div>
          )}

          <p className="center-detail-page__owner-email">
            {center.contactEmail}
          </p>
          <div className="center-detail-page__owner-actions">
            <button
              className="center-detail-page__invite-btn"
              onClick={handleResendInvite}
              disabled={isInviting}
            >
              {isInviting ? 'Sending...' : 'Resend Invite'}
            </button>
            <button
              className="center-detail-page__reset-btn"
              onClick={handleSendPasswordReset}
              disabled={isResetting}
            >
              {isResetting ? 'Sending...' : 'Send Password Reset'}
            </button>
          </div>
        </div>
      )}

      {/* Activation Section */}
      <div className="center-detail-page__section">
        <h2 className="center-detail-page__section-title">Activation</h2>
        <div className="center-detail-page__activation">
          <div className="center-detail-page__activation-info">
            <p className="center-detail-page__activation-status">
              This center is currently{' '}
              <strong>{center.isActive ? 'active' : 'inactive'}</strong>.
            </p>
            <p className="center-detail-page__activation-hint">
              {center.isActive
                ? 'Deactivating will prevent all non-admin users from logging in.'
                : 'Activating will restore login access for all users.'}
            </p>
          </div>
          <button
            className={`center-detail-page__toggle-btn ${
              center.isActive
                ? 'center-detail-page__toggle-btn--deactivate'
                : 'center-detail-page__toggle-btn--activate'
            }`}
            onClick={handleToggleActive}
            disabled={isToggling}
          >
            {isToggling
              ? 'Updating...'
              : center.isActive
                ? 'Deactivate'
                : 'Activate'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CenterDetailPage;
