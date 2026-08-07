import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '../utils/apiClient';
import '../styles/pages.css';

/**
 * ResetPasswordPage Component
 * Public route for resetting password using a token from URL query params.
 * Requirements: 3.4, 3.5, 3.6, 5.1
 */

interface FormState {
  newPassword: string;
  confirmPassword: string;
}

interface FormErrors {
  newPassword?: string;
  confirmPassword?: string;
  general?: string;
}

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [formData, setFormData] = useState<FormState>({
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);

  /**
   * Validate form fields
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (formData.newPassword.length > 128) {
      newErrors.newPassword = 'Password must be at most 128 characters';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setHasAttempted(true);

    if (!token) {
      setErrors({ general: 'Invalid reset link. Please request a new password reset.' });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await apiClient.post('/auth/reset-password', {
        token,
        newPassword: formData.newPassword,
      });

      setIsSuccess(true);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: { error?: string } } };
      if (axiosError.response?.data?.error) {
        setErrors({ general: axiosError.response.data.error });
      } else {
        setErrors({ general: 'An error occurred. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle input change
   */
  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (hasAttempted && errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // No token in URL
  if (!token && !hasAttempted) {
    return (
      <div className="page-container reset-password-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="reset-password-page__card">
          <div className="reset-password-page__header">
            <h1 className="reset-password-page__title">Invalid Reset Link</h1>
            <p className="reset-password-page__subtitle">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
          </div>
          <div className="reset-password-page__login-link">
            <Link to="/forgot-password">Request New Reset Link</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container reset-password-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="reset-password-page__card">
        {/* Header */}
        <div className="reset-password-page__header">
          <h1 className="reset-password-page__title">Reset Password</h1>
          <p className="reset-password-page__subtitle">
            Enter your new password below.
          </p>
        </div>

        {isSuccess ? (
          /* Success state */
          <div>
            <div className="alert-base alert--success" role="alert">
              <svg className="alert-base__icon" aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" fill="currentColor"/>
              </svg>
              <div className="alert-base__content">
                <div className="alert-base__title">
                  Your password has been reset successfully.
                </div>
              </div>
            </div>

            <div className="reset-password-page__login-link">
              <Link to="/login">Go to Sign In</Link>
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="reset-password-page__form" noValidate>
            {/* General Error */}
            {errors.general && (
              <div className="alert-base alert--danger" role="alert">
                <svg className="alert-base__icon" aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM10 6v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="alert-base__content">
                  <div className="alert-base__title">{errors.general}</div>
                </div>
              </div>
            )}

            {/* New Password */}
            <div className="reset-password-page__form-group">
              <label htmlFor="newPassword" className="label-base label-base--required">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                className={`input-base ${errors.newPassword ? 'input-base--error' : ''}`}
                placeholder="Enter new password (min 8 characters)"
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                disabled={isLoading}
                required
                autoComplete="new-password"
              />
              {hasAttempted && errors.newPassword && (
                <span className="error-text">{errors.newPassword}</span>
              )}
            </div>

            {/* Confirm New Password */}
            <div className="reset-password-page__form-group">
              <label htmlFor="confirmPassword" className="label-base label-base--required">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                className={`input-base ${errors.confirmPassword ? 'input-base--error' : ''}`}
                placeholder="Confirm your new password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                disabled={isLoading}
                required
                autoComplete="new-password"
              />
              {hasAttempted && errors.confirmPassword && (
                <span className="error-text">{errors.confirmPassword}</span>
              )}
            </div>

            <button
              type="submit"
              className="btn-base btn--primary btn--md btn--full"
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>

            <div className="reset-password-page__login-link">
              <Link to="/login">Back to Sign In</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
