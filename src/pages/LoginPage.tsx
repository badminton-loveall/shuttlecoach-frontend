import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';
import '../styles/pages.css';

/**
 * LoginPage Component
 * Displays login form with username/password inputs and role-based redirect
 * Validates: Required fields, invalid credentials
 * Redirects: HEAD_COACH/ASSISTANT_COACH → /dashboard, STUDENT → /student-dashboard
 */

interface FormState {
  username: string;
  password: string;
}

interface FormErrors {
  username?: string;
  password?: string;
  general?: string;
}

/**
 * Determine redirect path based on user role
 * @param role - User role after successful login
 * @returns redirect path
 */
const getRedirectPath = (role: UserRole): string => {
  switch (role) {
    case 'HEAD_COACH':
      return '/dashboard';
    case 'ASSISTANT_COACH':
      return '/dashboard';
    case 'STUDENT':
      return '/student-dashboard';
    default:
      return '/dashboard';
  }
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, role } = useAuth();

  const [formData, setFormData] = useState<FormState>({
    username: '',
    password: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && role) {
      const redirectPath = getRedirectPath(role);
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  /**
   * Validate form fields
   * @returns true if form is valid, false otherwise
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
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

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Call login from AuthContext
      await login(formData.username, formData.password);
      // Redirect happens automatically via useEffect when isAuthenticated/role changes
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'Login failed. Please try again.',
      });
      setIsLoading(false);
    }
  };

  /**
   * Handle input change
   */
  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field on new input
    if (hasAttempted && errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__container">
        <div className="login-page__card">
          {/* Header */}
          <div className="login-page__header">
            <h1 className="login-page__title">LoveAll</h1>
            <p className="login-page__subtitle">Badminton Training Management</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-page__form" noValidate>
            {/* General Error Message */}
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

            {/* Username Field */}
            <div className="login-page__form-group">
              <label htmlFor="username" className="label-base label-base--required">
                Username
              </label>
              <input
                id="username"
                type="text"
                className={`input-base ${errors.username ? 'input-base--error' : ''}`}
                placeholder="Enter your username"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                disabled={isLoading}
                required
                autoComplete="username"
              />
              {hasAttempted && errors.username && (
                <span className="error-text">{errors.username}</span>
              )}
            </div>

            {/* Password Field */}
            <div className="login-page__form-group">
              <label htmlFor="password" className="label-base label-base--required">
                Password
              </label>
              <input
                id="password"
                type="password"
                className={`input-base ${errors.password ? 'input-base--error' : ''}`}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={isLoading}
                required
                autoComplete="current-password"
              />
              {hasAttempted && errors.password && (
                <span className="error-text">{errors.password}</span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-base btn--primary btn--md btn--full"
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="login-page__spinner" aria-hidden="true"></span>
                  Logging in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="login-page__demo-credentials">
            <p className="login-page__demo-title">Demo Credentials</p>
            <div className="login-page__credential-list">
              <div className="login-page__credential-item">
                <span className="login-page__credential-role">Head Coach:</span>
                <span className="login-page__credential-value">headcoach / password123</span>
              </div>
              <div className="login-page__credential-item">
                <span className="login-page__credential-role">Assistant Coach:</span>
                <span className="login-page__credential-value">assistant1 / password123</span>
              </div>
              <div className="login-page__credential-item">
                <span className="login-page__credential-role">Student:</span>
                <span className="login-page__credential-value">aarav / password123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
