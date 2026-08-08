import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../utils/apiClient';
import '../styles/pages.css';

/**
 * CenterSettingsTab Component
 * - ADMIN: Can directly edit the center slug (existing behavior)
 * - HEAD_COACH: Sees slug as read-only with "Request Change" button (requirement 6.1)
 * - Others: Read-only display
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

interface CenterData {
  id: string;
  name: string;
  slug: string;
  location?: string;
  contactPhone?: string;
  contactEmail?: string;
  logoUrl?: string;
  isActive?: boolean;
  planType?: string;
  subscriptionExpiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Validates a slug string according to the rules:
 * - 3–50 characters
 * - Only lowercase letters, numbers, and hyphens
 * - Must start and end with alphanumeric
 * - No consecutive hyphens
 */
function validateSlug(slug: string): { valid: boolean; error?: string } {
  if (slug.length < 3 || slug.length > 50) {
    return { valid: false, error: 'Slug must be between 3 and 50 characters' };
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { valid: false, error: 'Slug can only contain lowercase letters, numbers, and hyphens' };
  }
  if (!/^[a-z0-9]/.test(slug) || !/[a-z0-9]$/.test(slug)) {
    return { valid: false, error: 'Slug must start and end with a letter or number' };
  }
  if (/--/.test(slug)) {
    return { valid: false, error: 'Slug cannot contain consecutive hyphens' };
  }
  return { valid: true };
}

const CenterSettingsTab: React.FC = () => {
  const { centerId, role } = useAuth();

  const [center, setCenter] = useState<CenterData | null>(null);
  const [slugValue, setSlugValue] = useState('');
  const [originalSlug, setOriginalSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Slug change request state (HEAD_COACH flow)
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestSlugValue, setRequestSlugValue] = useState('');
  const [requestFieldError, setRequestFieldError] = useState<string | null>(null);
  const [requestSuccessMessage, setRequestSuccessMessage] = useState<string | null>(null);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  const isAdmin = role === 'ADMIN';
  const isHeadCoach = role === 'HEAD_COACH';
  const canDirectEdit = isAdmin;

  const fetchCenter = useCallback(async () => {
    if (!centerId) {
      setError('No center associated with your account');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      if (isAdmin) {
        // ADMIN uses the admin endpoint
        const response = await apiClient.get('/admin/centers');
        const centers = response.data as CenterData[];
        const myCenter = centers.find((c) => c.id === centerId);

        if (myCenter) {
          setCenter(myCenter);
          setSlugValue(myCenter.slug || '');
          setOriginalSlug(myCenter.slug || '');
        } else {
          setError('Could not find your center');
        }
      } else {
        // HEAD_COACH / other roles use the memberships/my-center endpoint
        const response = await apiClient.get('/memberships/my-center');
        const data = response.data as CenterData;

        if (data) {
          setCenter(data);
          setSlugValue(data.slug || '');
          setOriginalSlug(data.slug || '');
        } else {
          setError('Could not find your center');
        }
      }
    } catch {
      setError('Failed to load center data');
    } finally {
      setLoading(false);
    }
  }, [centerId, isAdmin]);

  /**
   * Check if the center already has a pending slug change request.
   * Used to disable the "Request Change" button for HEAD_COACH.
   */
  const checkPendingRequest = useCallback(async () => {
    if (!isHeadCoach) return;
    try {
      // Attempt to check pending status via a lightweight call.
      // If the POST would return 409 "pending exists", we know there's one.
      // We use a dedicated check — try fetching center data which may include pending status,
      // or simply rely on the 409 error on submit. For better UX, we attempt a probe.
      const response = await apiClient.get('/slug-change-requests/pending');
      if (response.data && response.data.hasPending) {
        setHasPendingRequest(true);
      }
    } catch {
      // If the endpoint doesn't exist or fails, we'll rely on the 409 during submission
      // This is a graceful degradation approach
    }
  }, [isHeadCoach]);

  useEffect(() => {
    void fetchCenter();
    void checkPendingRequest();
  }, [fetchCenter, checkPendingRequest]);

  // --- ADMIN direct edit handlers ---
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setSlugValue(value);
    setFieldError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);
    setSuccessMessage(null);

    const trimmed = slugValue.trim();
    const validation = validateSlug(trimmed);
    if (!validation.valid) {
      setFieldError(validation.error || 'Invalid slug');
      return;
    }

    if (trimmed === originalSlug) {
      setFieldError('Slug is unchanged');
      return;
    }

    try {
      setSaving(true);
      await apiClient.patch(`/admin/centers/${centerId}`, { slug: trimmed });
      setOriginalSlug(trimmed);
      setSlugValue(trimmed);
      setSuccessMessage('Slug updated successfully!');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { error?: string } } };
      if (axiosErr.response?.status === 409) {
        setFieldError('This slug is already taken');
      } else if (axiosErr.response?.status === 400) {
        setFieldError(axiosErr.response.data?.error || 'Invalid slug format');
      } else {
        setFieldError('Failed to update slug. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  // --- HEAD_COACH slug change request handlers ---
  const handleRequestSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setRequestSlugValue(value);
    setRequestFieldError(null);
    setRequestSuccessMessage(null);
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestFieldError(null);
    setRequestSuccessMessage(null);

    const trimmed = requestSlugValue.trim();
    const validation = validateSlug(trimmed);
    if (!validation.valid) {
      setRequestFieldError(validation.error || 'Invalid slug format');
      return;
    }

    if (trimmed === originalSlug) {
      setRequestFieldError('New slug must be different from the current slug');
      return;
    }

    try {
      setSubmittingRequest(true);
      await apiClient.post('/slug-change-requests', { requestedSlug: trimmed });
      setRequestSuccessMessage('Slug change request submitted successfully. An admin will review it.');
      setHasPendingRequest(true);
      setShowRequestForm(false);
      setRequestSlugValue('');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { error?: string; message?: string } } };
      if (axiosErr.response?.status === 409) {
        const msg = axiosErr.response.data?.error || axiosErr.response.data?.message || '';
        if (msg.toLowerCase().includes('pending')) {
          setRequestFieldError('A pending slug change request already exists');
          setHasPendingRequest(true);
        } else {
          setRequestFieldError('This slug is already taken');
        }
      } else if (axiosErr.response?.status === 400) {
        setRequestFieldError(axiosErr.response.data?.error || axiosErr.response.data?.message || 'Invalid slug format');
      } else {
        setRequestFieldError('Failed to submit request. Please try again.');
      }
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleCancelRequest = () => {
    setShowRequestForm(false);
    setRequestSlugValue('');
    setRequestFieldError(null);
    setRequestSuccessMessage(null);
  };

  // --- Loading / Error states ---
  if (loading) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading center settings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: '2rem' }}>
        <p style={{ color: 'var(--color-danger)' }}>{error}</p>
      </div>
    );
  }

  const loginUrl = `${window.location.origin}/login/${originalSlug || '...'}`;

  // --- ADMIN direct-edit view ---
  if (canDirectEdit) {
    return (
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 0.25rem 0', fontSize: 'var(--font-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
          Branded Login URL
        </h3>
        <p style={{ margin: '0 0 1.5rem 0', fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)' }}>
          Customize the login URL for <strong>{center?.name}</strong>. Share this link with your coaches and students.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="center-slug" style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Center Slug
            </label>
            <input
              id="center-slug"
              type="text"
              value={slugValue}
              onChange={handleSlugChange}
              disabled={saving}
              placeholder="e.g. shuttle-stars-academy"
              maxLength={50}
              aria-describedby="slug-help slug-error"
              style={{
                width: '100%', padding: '8px 12px', fontSize: 'var(--font-sm)',
                border: `1.5px solid ${fieldError ? 'var(--color-danger)' : 'var(--border-default)'}`,
                borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--surface-card)',
                color: 'var(--text-primary)', fontFamily: "'Monaco', 'Courier New', monospace",
                transition: 'border-color 0.2s', boxSizing: 'border-box',
              }}
            />
            <p id="slug-help" style={{ margin: '0.5rem 0 0 0', fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
              Only lowercase letters, numbers, and hyphens. 3–50 characters.
            </p>
          </div>

          {fieldError && (
            <p id="slug-error" role="alert" style={{ margin: '0 0 1rem 0', fontSize: 'var(--font-sm)', color: 'var(--color-danger)', fontWeight: 'var(--weight-medium)' }}>
              {fieldError}
            </p>
          )}

          {successMessage && (
            <p role="status" style={{ margin: '0 0 1rem 0', fontSize: 'var(--font-sm)', color: 'var(--color-success)', fontWeight: 'var(--weight-medium)' }}>
              {successMessage}
            </p>
          )}

          <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', border: '1px solid var(--border-default)' }}>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Login URL Preview
            </span>
            <code style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
              {`${window.location.origin}/login/${slugValue || '...'}`}
            </code>
          </div>

          <button
            type="submit"
            disabled={saving || slugValue === originalSlug}
            style={{
              padding: '10px 24px', fontSize: 'var(--font-sm)', fontWeight: 'var(--weight-semibold)',
              backgroundColor: saving || slugValue === originalSlug ? 'var(--surface-hover)' : 'var(--color-primary)',
              color: saving || slugValue === originalSlug ? 'var(--text-tertiary)' : 'var(--text-primary)',
              border: 'none', borderRadius: 'var(--radius-pill)',
              cursor: saving || slugValue === originalSlug ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s', fontFamily: 'var(--font-body)',
            }}
          >
            {saving ? 'Saving...' : 'Update Slug'}
          </button>
        </form>
      </div>
    );
  }

  // --- HEAD_COACH view: full center info + slug request flow ---
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Center Information Section */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: 'var(--font-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
          Center Information
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <span style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
              Name
            </span>
            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>
              {center?.name || '—'}
            </span>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
              Location
            </span>
            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>
              {center?.location || '—'}
            </span>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
              Phone
            </span>
            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>
              {center?.contactPhone || '—'}
            </span>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
              Email
            </span>
            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>
              {center?.contactEmail || '—'}
            </span>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
              Plan
            </span>
            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
              {center?.planType || 'basic'}
            </span>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
              Status
            </span>
            <span style={{
              fontSize: 'var(--font-xs)', fontWeight: 'var(--weight-semibold)',
              padding: '2px 8px', borderRadius: 'var(--radius-pill)',
              backgroundColor: center?.isActive ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              color: center?.isActive ? '#22c55e' : '#ef4444',
            }}>
              {center?.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Branded Login URL / Slug Section */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 0.25rem 0', fontSize: 'var(--font-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
          Branded Login URL
        </h3>
        <p style={{ margin: '0 0 1.5rem 0', fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)' }}>
          Your center's branded login URL. Share this link with your coaches and students.
        </p>

      {/* Current Slug (read-only) */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          Current Slug
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <code style={{
            flex: 1, padding: '8px 12px', fontSize: 'var(--font-sm)',
            border: '1.5px solid var(--border-default)', borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--surface-hover)', color: 'var(--text-primary)',
            fontFamily: "'Monaco', 'Courier New', monospace",
          }}>
            {originalSlug || '—'}
          </code>
          {isHeadCoach && (
            <button
              type="button"
              onClick={() => setShowRequestForm(true)}
              disabled={hasPendingRequest}
              style={{
                padding: '8px 16px', fontSize: 'var(--font-sm)', fontWeight: 'var(--weight-semibold)',
                backgroundColor: hasPendingRequest ? 'var(--surface-hover)' : 'var(--color-primary)',
                color: hasPendingRequest ? 'var(--text-tertiary)' : 'var(--text-primary)',
                border: 'none', borderRadius: 'var(--radius-pill)', whiteSpace: 'nowrap',
                cursor: hasPendingRequest ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', fontFamily: 'var(--font-body)',
              }}
            >
              Request Change
            </button>
          )}
        </div>
        {hasPendingRequest && (
          <p style={{ margin: '0.5rem 0 0 0', fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
            A slug change request is already pending admin review.
          </p>
        )}
      </div>

      {/* URL Preview */}
      <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', border: '1px solid var(--border-default)' }}>
        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Login URL
        </span>
        <code style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
          {loginUrl}
        </code>
      </div>

      {/* Success message (after successful request submission) */}
      {requestSuccessMessage && !showRequestForm && (
        <p role="status" style={{ margin: '0 0 1rem 0', fontSize: 'var(--font-sm)', color: 'var(--color-success)', fontWeight: 'var(--weight-medium)' }}>
          {requestSuccessMessage}
        </p>
      )}

      {/* Inline Request Change Form */}
      {showRequestForm && isHeadCoach && (
        <div style={{ padding: '1rem', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--surface-card)', marginBottom: '1rem' }}>
          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: 'var(--font-md)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
            Request Slug Change
          </h4>
          <form onSubmit={handleRequestSubmit}>
            <div style={{ marginBottom: '0.75rem' }}>
              <label htmlFor="request-slug" style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
                New Slug
              </label>
              <input
                id="request-slug"
                type="text"
                value={requestSlugValue}
                onChange={handleRequestSlugChange}
                disabled={submittingRequest}
                placeholder="e.g. my-new-center-name"
                maxLength={50}
                aria-describedby="request-slug-help request-slug-error"
                style={{
                  width: '100%', padding: '8px 12px', fontSize: 'var(--font-sm)',
                  border: `1.5px solid ${requestFieldError ? 'var(--color-danger)' : 'var(--border-default)'}`,
                  borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--surface-card)',
                  color: 'var(--text-primary)', fontFamily: "'Monaco', 'Courier New', monospace",
                  transition: 'border-color 0.2s', boxSizing: 'border-box',
                }}
              />
              <p id="request-slug-help" style={{ margin: '0.375rem 0 0 0', fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
                Only lowercase letters, numbers, and hyphens. 3–50 characters. Must start and end with a letter or number.
              </p>
            </div>

            {requestFieldError && (
              <p id="request-slug-error" role="alert" style={{ margin: '0 0 0.75rem 0', fontSize: 'var(--font-sm)', color: 'var(--color-danger)', fontWeight: 'var(--weight-medium)' }}>
                {requestFieldError}
              </p>
            )}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="submit"
                disabled={submittingRequest || !requestSlugValue.trim()}
                style={{
                  padding: '8px 20px', fontSize: 'var(--font-sm)', fontWeight: 'var(--weight-semibold)',
                  backgroundColor: submittingRequest || !requestSlugValue.trim() ? 'var(--surface-hover)' : 'var(--color-primary)',
                  color: submittingRequest || !requestSlugValue.trim() ? 'var(--text-tertiary)' : 'var(--text-primary)',
                  border: 'none', borderRadius: 'var(--radius-pill)',
                  cursor: submittingRequest || !requestSlugValue.trim() ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s', fontFamily: 'var(--font-body)',
                }}
              >
                {submittingRequest ? 'Submitting...' : 'Submit Request'}
              </button>
              <button
                type="button"
                onClick={handleCancelRequest}
                disabled={submittingRequest}
                style={{
                  padding: '8px 20px', fontSize: 'var(--font-sm)', fontWeight: 'var(--weight-medium)',
                  backgroundColor: 'transparent', color: 'var(--text-secondary)',
                  border: '1px solid var(--border-default)', borderRadius: 'var(--radius-pill)',
                  cursor: submittingRequest ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s', fontFamily: 'var(--font-body)',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Non-editable roles info */}
      {!isHeadCoach && !isAdmin && (
        <p style={{ margin: '0', fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
          Only Head Coaches can request slug changes.
        </p>
      )}
      </div>
    </div>
  );
};

export default CenterSettingsTab;
