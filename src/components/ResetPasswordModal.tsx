import { useState } from 'react';
import apiClient from '../utils/apiClient';

interface ResetPasswordModalProps {
  /** Display name shown in the modal heading, e.g. the coach's or student's name. */
  targetName: string;
  /** API path to POST { newPassword } to, e.g. `/coaches/${id}/reset-password` or `/students/${id}/reset-password`. */
  apiPath: string;
  /**
   * Optional API path to POST (no body) to trigger a password-reset email
   * instead of setting a password directly, e.g. `/coaches/${id}/send-reset-email`
   * or `/students/${id}/send-reset-email`. When provided, the modal offers a
   * toggle between "set a password myself" and "email them a reset link".
   */
  sendEmailApiPath?: string;
  onClose: () => void;
}

type ResetMode = 'password' | 'email';

/**
 * Shared "reset this person's password" modal, usable for both coaches and
 * students. Supports two flows:
 *  - Manual: POST { newPassword } to apiPath, response echoes the new
 *    password back so the admin can share it directly.
 *  - Email: POST (no body) to sendEmailApiPath, backend emails the person a
 *    reset link; response only confirms which address it went to.
 * Originally built inline in CoachDetailPage; extracted so students get the
 * identical, already-reviewed flow instead of a second hand-rolled copy.
 */
export function ResetPasswordModal({ targetName, apiPath, sendEmailApiPath, onClose }: ResetPasswordModalProps) {
  const [mode, setMode] = useState<ResetMode>('password');

  // Manual "set a new password" flow state
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // "Send reset email" flow state
  const [emailError, setEmailError] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');

  const switchMode = (next: ResetMode) => {
    setMode(next);
    setError('');
    setEmailError('');
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!value.trim()) {
      setError('New password is required');
      return;
    }
    if (value.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (value.length > 128) {
      setError('Password must be at most 128 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post(apiPath, { newPassword: value });
      const newPassword = response.data?.newPassword || value;
      setSuccess(newPassword);
      setValue('');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!sendEmailApiPath) return;
    setEmailError('');
    setEmailSuccess('');
    setEmailLoading(true);
    try {
      const response = await apiClient.post(sendEmailApiPath);
      setEmailSuccess(response.data?.email || 'their email address');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setEmailError(axiosError.response?.data?.error || 'Failed to send the reset email. Please try again.');
    } finally {
      setEmailLoading(false);
    }
  };


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-md mx-4"
        style={{ padding: 'var(--space-2xl)', border: '1px solid var(--border-default)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tailwind's utility classes (text-lg, font-semibold) lose to this
            app's own unlayered globals.css `h2 { font-size: 36px }` default
            under CSS cascade layers, regardless of specificity — same class
            of bug fixed earlier in SkillTimeline's heading. Inline styles
            are the only override that reliably wins here. */}
        <h2
          style={{
            color: 'var(--text-primary)',
            marginTop: 0,
            marginBottom: 'var(--space-sm)',
            fontSize: 'var(--font-lg)',
            fontWeight: 'var(--weight-bold)',
            fontFamily: 'var(--font-display)',
            lineHeight: 'var(--line-snug, 1.3)',
          }}
        >
          Reset Password for {targetName}
        </h2>

        {mode === 'password' && success ? (
          <div>
            <div className="alert-base alert--success" role="alert" style={{ marginBottom: 'var(--space-md)' }}>
              <svg className="alert-base__icon" aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" fill="currentColor"/>
              </svg>
              <div className="alert-base__content">
                <div className="alert-base__title">Password reset successfully.</div>
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-small)', marginBottom: 'var(--space-sm)' }}>
              Share this new password with them:
            </p>
            <div
              style={{
                padding: 'var(--space-md)',
                backgroundColor: 'var(--surface-hover)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'monospace',
                fontSize: 'var(--font-sm)',
                color: 'var(--text-primary)',
                wordBreak: 'break-all',
                marginBottom: 'var(--space-lg)',
                border: '1px solid var(--border-default)',
              }}
            >
              {success}
            </div>
            <button onClick={onClose} className="btn-base btn--primary btn--md btn--full">
              Done
            </button>
          </div>
        ) : mode === 'email' && emailSuccess ? (
          <div>
            <div className="alert-base alert--success" role="alert" style={{ marginBottom: 'var(--space-md)' }}>
              <svg className="alert-base__icon" aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" fill="currentColor"/>
              </svg>
              <div className="alert-base__content">
                <div className="alert-base__title">Reset email sent.</div>
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-small)', marginBottom: 'var(--space-lg)' }}>
              We sent a password reset link to <strong style={{ color: 'var(--text-primary)' }}>{emailSuccess}</strong>. It will expire in 1 hour.
            </p>
            <button onClick={onClose} className="btn-base btn--primary btn--md btn--full">
              Done
            </button>
          </div>
        ) : mode === 'password' ? (
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-small)', marginBottom: 'var(--space-lg)' }}>
              Enter a new password. You will be shown the password after reset so you can share it with them.
            </p>

            {error && (
              <div className="alert-base alert--danger" role="alert" style={{ marginBottom: 'var(--space-md)' }}>
                <svg className="alert-base__icon" aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM10 6v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="alert-base__content">
                  <div className="alert-base__title">{error}</div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', marginBottom: 'var(--space-lg)' }}>
              <label htmlFor="reset-new-password" className="label-base label-base--required">
                New Password
              </label>
              <input
                id="reset-new-password"
                type="password"
                className={`input-base ${error ? 'input-base--error' : ''}`}
                placeholder="Enter new password (min 8 characters)"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  if (error) setError('');
                }}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <button
                onClick={onClose}
                className="btn-base btn--md"
                style={{
                  flex: '0 0 auto',
                  backgroundColor: 'var(--surface-hover)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="btn-base btn--primary btn--md"
                style={{ flex: 1, whiteSpace: 'nowrap' }}
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>

            {sendEmailApiPath && (
              <button
                type="button"
                onClick={() => switchMode('email')}
                disabled={loading}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-primary-dark)',
                  textDecoration: 'underline',
                  fontSize: 'var(--font-small)',
                  marginTop: 'var(--space-md)',
                  padding: 0,
                }}
              >
                Send a password reset email instead
              </button>
            )}
          </div>
        ) : (
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-small)', marginBottom: 'var(--space-lg)' }}>
              We'll email {targetName} a secure link so they can reset their own password. The link expires in 1 hour.
            </p>

            {emailError && (
              <div className="alert-base alert--danger" role="alert" style={{ marginBottom: 'var(--space-md)' }}>
                <svg className="alert-base__icon" aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM10 6v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="alert-base__content">
                  <div className="alert-base__title">{emailError}</div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <button
                onClick={onClose}
                className="btn-base btn--md"
                style={{
                  flex: '0 0 auto',
                  backgroundColor: 'var(--surface-hover)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
                disabled={emailLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                className="btn-base btn--primary btn--md"
                style={{ flex: 1, whiteSpace: 'nowrap' }}
                disabled={emailLoading}
                aria-busy={emailLoading}
              >
                {emailLoading ? 'Sending...' : 'Send Reset Email'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => switchMode('password')}
              disabled={emailLoading}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-primary-dark)',
                  textDecoration: 'underline',
                fontSize: 'var(--font-small)',
                marginTop: 'var(--space-md)',
                padding: 0,
              }}
            >
              Set a password myself instead
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
