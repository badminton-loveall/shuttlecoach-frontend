import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../utils/apiClient';
import DashboardLayout from '../components/DashboardLayout';
import '../styles/pages.css';

/**
 * ChangePasswordPage Component
 * Allows authenticated users to change their own password.
 * Requirements: 1.1, 1.3, 1.5, 1.6
 */

interface FormState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface FormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  general?: string;
}

export const ChangePasswordPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const [formData, setFormData] = useState<FormState>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [hasAttempted, setHasAttempted] = useState(false);

  /**
   * Validate form fields
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required';
    }

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
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await apiClient.put('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      setSuccessMessage('Password changed successfully.');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setHasAttempted(false);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: { error?: string } } };
      if (axiosError.response?.status === 401) {
        setErrors({ currentPassword: 'Invalid current password' });
      } else if (axiosError.response?.data?.error) {
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
    setSuccessMessage('');

    if (hasAttempted && errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="change-password-page">
          <div className="change-password-page__card">
            {/* Header */}
            <div className="change-password-page__header">
              <h1 className="change-password-page__title">Change Password</h1>
              <p className="change-password-page__subtitle">
                Update your account password. You will need to enter your current password for verification.
              </p>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="alert-base alert--success" role="alert">
                <svg className="alert-base__icon" aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" fill="currentColor"/>
                </svg>
                <div className="alert-base__content">
                  <div className="alert-base__title">{successMessage}</div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="change-password-page__form" noValidate>
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

              {/* Current Password */}
              <div className="change-password-page__form-group">
                <label htmlFor="currentPassword" className="label-base label-base--required">
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  className={`input-base ${errors.currentPassword ? 'input-base--error' : ''}`}
                  placeholder="Enter your current password"
                  value={formData.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                  disabled={isLoading}
                  required
                  autoComplete="current-password"
                />
                {hasAttempted && errors.currentPassword && (
                  <span className="error-text">{errors.currentPassword}</span>
                )}
              </div>

              {/* New Password */}
              <div className="change-password-page__form-group">
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
              <div className="change-password-page__form-group">
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

              {/* Submit Button */}
              <button
                type="submit"
                className="btn-base btn--primary btn--md btn--full"
                disabled={isLoading}
                aria-busy={isLoading}
              >
                {isLoading ? 'Changing Password...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChangePasswordPage;
