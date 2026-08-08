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
        <div className="section-stack">
          {/* Page Header */}
          <div className="page-header">
            <div>
              <h1 className="page-header-title">My Profile</h1>
              <p className="page-header-subtitle">Manage your account</p>
            </div>
          </div>

          {/* Two-column layout: Profile + Security side by side on desktop */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.5fr)', gap: '1.25rem', alignItems: 'start' }}>
            {/* Profile Info Card — compact */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', textAlign: 'center' }}>
                {user.profilePhoto ? (
                  <img
                    src={user.profilePhoto}
                    alt={`${user.name}'s profile photo`}
                    style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '50%',
                    backgroundColor: 'var(--color-primary)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 'var(--font-md)', fontWeight: 'var(--weight-bold)',
                  }}>
                    {getInitials(user.name)}
                  </div>
                )}
                <div>
                  <p style={{ margin: 0, fontSize: 'var(--font-md)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
                    {user.name}
                  </p>
                  <span style={{
                    display: 'inline-block', marginTop: '4px',
                    padding: '2px 8px', borderRadius: 'var(--radius-pill)',
                    fontSize: 'var(--font-xs)', fontWeight: 'var(--weight-semibold)',
                    backgroundColor: 'rgba(184, 225, 53, 0.15)', color: 'var(--color-primary)',
                  }}>
                    {formatRole(role)}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-default)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Username</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 'var(--weight-medium)' }}>{user.username}</span>
                </div>
                {user.email && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Email</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 'var(--weight-medium)' }}>{user.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Security - Change Password Card — compact */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ margin: '0 0 0.25rem 0', fontSize: 'var(--font-md)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
                Change Password
              </h3>
              <p style={{ margin: '0 0 1rem 0', fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
                Enter your current password and choose a new one.
              </p>

              {successMessage && (
                <div style={{ padding: '0.5rem 0.75rem', marginBottom: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#22c55e', fontSize: 'var(--font-sm)' }} role="alert">
                  {successMessage}
                </div>
              )}

              {errors.general && (
                <div style={{ padding: '0.5rem 0.75rem', marginBottom: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: 'var(--font-sm)' }} role="alert">
                  {errors.general}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label htmlFor="currentPassword" style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Current Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    className={`input-base ${errors.currentPassword ? 'input-base--error' : ''}`}
                    placeholder="••••••••"
                    value={formData.currentPassword}
                    onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                    disabled={isLoading}
                    required
                    autoComplete="current-password"
                    style={{ padding: '8px 12px', fontSize: 'var(--font-sm)' }}
                  />
                  {hasAttempted && errors.currentPassword && (
                    <span style={{ fontSize: 'var(--font-xs)', color: '#ef4444', marginTop: '2px', display: 'block' }}>{errors.currentPassword}</span>
                  )}
                </div>

                <div>
                  <label htmlFor="newPassword" style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    New Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    className={`input-base ${errors.newPassword ? 'input-base--error' : ''}`}
                    placeholder="Min 8 characters"
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    disabled={isLoading}
                    required
                    autoComplete="new-password"
                    style={{ padding: '8px 12px', fontSize: 'var(--font-sm)' }}
                  />
                  {hasAttempted && errors.newPassword && (
                    <span style={{ fontSize: 'var(--font-xs)', color: '#ef4444', marginTop: '2px', display: 'block' }}>{errors.newPassword}</span>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Confirm Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    className={`input-base ${errors.confirmPassword ? 'input-base--error' : ''}`}
                    placeholder="Re-enter new password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    disabled={isLoading}
                    required
                    autoComplete="new-password"
                    style={{ padding: '8px 12px', fontSize: 'var(--font-sm)' }}
                  />
                  {hasAttempted && errors.confirmPassword && (
                    <span style={{ fontSize: 'var(--font-xs)', color: '#ef4444', marginTop: '2px', display: 'block' }}>{errors.confirmPassword}</span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  aria-busy={isLoading}
                  style={{
                    marginTop: '0.25rem', padding: '10px 24px', width: 'fit-content',
                    fontSize: 'var(--font-sm)', fontWeight: 'var(--weight-semibold)',
                    backgroundColor: isLoading ? 'var(--surface-hover)' : 'var(--color-primary)',
                    color: isLoading ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    border: 'none', borderRadius: 'var(--radius-pill)',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s', fontFamily: 'var(--font-body)',
                  }}
                >
                  {isLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
