import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../utils/apiClient';
import DashboardLayout from '../components/DashboardLayout';
import '../styles/pages.css';

/**
 * ProfilePage Component
 * Unified "My Profile" page combining user profile info with password change.
 * Replaces the standalone /change-password route in navigation.
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

export const ProfilePage: React.FC = () => {
  const { user, role, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState<FormState>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [hasAttempted, setHasAttempted] = useState(false);

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

  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSuccessMessage('');

    if (hasAttempted && errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatRole = (r: string): string => {
    return r.replace(/_/g, ' ');
  };

  if (!isAuthenticated || !user || !role) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="profile-page">
          {/* Section 1: Profile Info */}
          <div className="profile-page__card">
            <div className="profile-page__header">
              <h1 className="profile-page__title">My Profile</h1>
            </div>

            <div className="profile-page__info">
              {/* Avatar */}
              <div className="profile-page__avatar-section">
                {user.profilePhoto ? (
                  <img
                    src={user.profilePhoto}
                    alt={`${user.name}'s profile photo`}
                    className="profile-page__avatar-img"
                  />
                ) : (
                  <div className="profile-page__avatar-fallback">
                    {getInitials(user.name)}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="profile-page__details">
                <div className="profile-page__detail-row">
                  <span className="profile-page__detail-label">Name</span>
                  <span className="profile-page__detail-value">{user.name}</span>
                </div>
                <div className="profile-page__detail-row">
                  <span className="profile-page__detail-label">Username</span>
                  <span className="profile-page__detail-value">{user.username}</span>
                </div>
                {user.email && (
                  <div className="profile-page__detail-row">
                    <span className="profile-page__detail-label">Email</span>
                    <span className="profile-page__detail-value">{user.email}</span>
                  </div>
                )}
                <div className="profile-page__detail-row">
                  <span className="profile-page__detail-label">Role</span>
                  <span className="profile-page__role-badge">{formatRole(role)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="profile-page__divider" />

          {/* Section 2: Change Password */}
          <div className="profile-page__card">
            <div className="profile-page__header">
              <h2 className="profile-page__section-title">Security</h2>
              <p className="profile-page__subtitle">
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

            {/* Password Form */}
            <form onSubmit={handleSubmit} className="profile-page__form" noValidate>
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

              <div className="profile-page__form-group">
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

              <div className="profile-page__form-group">
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

              <div className="profile-page__form-group">
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
                {isLoading ? 'Changing Password...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
