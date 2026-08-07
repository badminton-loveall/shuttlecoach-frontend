import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../utils/apiClient';
import '../styles/pages.css';

/**
 * CenterSettingsTab Component
 * Allows HEAD_COACH and ADMIN users to view and update their center's slug.
 * Displays a branded login URL preview and handles validation/submission.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

interface CenterData {
  id: string;
  name: string;
  slug: string;
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

  const canEdit = role === 'HEAD_COACH' || role === 'ADMIN';

  const fetchCenter = useCallback(async () => {
    if (!centerId) {
      setError('No center associated with your account');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
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
    } catch {
      setError('Failed to load center data');
    } finally {
      setLoading(false);
    }
  }, [centerId]);

  useEffect(() => {
    fetchCenter();
  }, [fetchCenter]);

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setSlugValue(value);
    setFieldError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous messages
    setFieldError(null);
    setSuccessMessage(null);

    // Client-side validation
    const trimmed = slugValue.trim();
    const validation = validateSlug(trimmed);
    if (!validation.valid) {
      setFieldError(validation.error || 'Invalid slug');
      return;
    }

    // No change
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

  const loginUrl = `${window.location.origin}/login/${slugValue || '...'}`;

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <h3
        style={{
          margin: '0 0 0.25rem 0',
          fontSize: 'var(--font-lg)',
          fontWeight: 'var(--weight-semibold)',
          color: 'var(--text-primary)',
        }}
      >
        Branded Login URL
      </h3>
      <p
        style={{
          margin: '0 0 1.5rem 0',
          fontSize: 'var(--font-sm)',
          color: 'var(--text-tertiary)',
        }}
      >
        Customize the login URL for{' '}
        <strong>{center?.name}</strong>. Share this link with your coaches and students.
      </p>

      <form onSubmit={handleSubmit}>
        {/* Slug Input Field */}
        <div style={{ marginBottom: '1rem' }}>
          <label
            htmlFor="center-slug"
            style={{
              display: 'block',
              fontSize: 'var(--font-sm)',
              fontWeight: 'var(--weight-semibold)',
              color: 'var(--text-primary)',
              marginBottom: '0.5rem',
            }}
          >
            Center Slug
          </label>
          <input
            id="center-slug"
            type="text"
            value={slugValue}
            onChange={handleSlugChange}
            disabled={!canEdit || saving}
            placeholder="e.g. shuttle-stars-academy"
            maxLength={50}
            aria-describedby="slug-help slug-error"
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: 'var(--font-sm)',
              border: `1.5px solid ${fieldError ? 'var(--color-danger)' : 'var(--border-default)'}`,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: canEdit ? 'var(--surface-card)' : 'var(--surface-hover)',
              color: 'var(--text-primary)',
              fontFamily: "'Monaco', 'Courier New', monospace",
              transition: 'border-color 0.2s',
              boxSizing: 'border-box',
            }}
          />
          <p
            id="slug-help"
            style={{
              margin: '0.5rem 0 0 0',
              fontSize: 'var(--font-xs)',
              color: 'var(--text-tertiary)',
            }}
          >
            Only lowercase letters, numbers, and hyphens. 3–50 characters.
          </p>
        </div>

        {/* Inline Error */}
        {fieldError && (
          <p
            id="slug-error"
            role="alert"
            style={{
              margin: '0 0 1rem 0',
              fontSize: 'var(--font-sm)',
              color: 'var(--color-danger)',
              fontWeight: 'var(--weight-medium)',
            }}
          >
            {fieldError}
          </p>
        )}

        {/* Success Message */}
        {successMessage && (
          <p
            role="status"
            style={{
              margin: '0 0 1rem 0',
              fontSize: 'var(--font-sm)',
              color: 'var(--color-success)',
              fontWeight: 'var(--weight-medium)',
            }}
          >
            {successMessage}
          </p>
        )}

        {/* URL Preview */}
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--surface-hover)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.5rem',
            border: '1px solid var(--border-default)',
          }}
        >
          <span
            style={{
              fontSize: 'var(--font-xs)',
              color: 'var(--text-tertiary)',
              display: 'block',
              marginBottom: '0.25rem',
              fontWeight: 'var(--weight-semibold)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Login URL Preview
          </span>
          <code
            style={{
              fontSize: 'var(--font-sm)',
              color: 'var(--text-primary)',
              wordBreak: 'break-all',
            }}
          >
            {loginUrl}
          </code>
        </div>

        {/* Submit Button */}
        {canEdit && (
          <button
            type="submit"
            disabled={saving || slugValue === originalSlug}
            style={{
              padding: '10px 24px',
              fontSize: 'var(--font-sm)',
              fontWeight: 'var(--weight-semibold)',
              backgroundColor:
                saving || slugValue === originalSlug
                  ? 'var(--surface-hover)'
                  : 'var(--color-primary)',
              color:
                saving || slugValue === originalSlug
                  ? 'var(--text-tertiary)'
                  : 'var(--text-primary)',
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              cursor: saving || slugValue === originalSlug ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'var(--font-body)',
            }}
          >
            {saving ? 'Saving...' : 'Update Slug'}
          </button>
        )}

        {!canEdit && (
          <p
            style={{
              margin: '0',
              fontSize: 'var(--font-sm)',
              color: 'var(--text-tertiary)',
              fontStyle: 'italic',
            }}
          >
            Only Head Coaches and Admins can edit the center slug.
          </p>
        )}
      </form>
    </div>
  );
};

export default CenterSettingsTab;
