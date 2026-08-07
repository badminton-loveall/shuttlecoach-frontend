import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../utils/apiClient';
import '../styles/pages.css';

/**
 * ForgotPasswordPage Component
 * Public route allowing users to request a password reset email.
 * Always shows a generic success message to prevent email enumeration.
 * Requirements: 3.1, 3.7
 */

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);

  /**
   * Validate email field
   */
  const validateForm = (): boolean => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }

    setEmailError('');
    return true;
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

    try {
      await apiClient.post('/auth/forgot-password', { email });
    } catch {
      // Intentionally ignore errors — always show success message
      // to prevent email enumeration (Requirement 3.7)
    } finally {
      setIsLoading(false);
      setIsSubmitted(true);
    }
  };

  return (
    <div className="page-container forgot-password-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="forgot-password-page__card">
        {/* Header */}
        <div className="forgot-password-page__header">
          <h1 className="forgot-password-page__title">Forgot Password</h1>
          <p className="forgot-password-page__subtitle">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {isSubmitted ? (
          /* Success state — always shown regardless of whether email exists */
          <div>
            <div className="alert-base alert--success" role="alert">
              <svg className="alert-base__icon" aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" fill="currentColor"/>
              </svg>
              <div className="alert-base__content">
                <div className="alert-base__title">
                  If an account with that email exists, a password reset link has been sent.
                </div>
              </div>
            </div>

            <div className="forgot-password-page__login-link">
              <Link to="/login">Back to Sign In</Link>
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="forgot-password-page__form" noValidate>
            <div className="forgot-password-page__form-group">
              <label htmlFor="email" className="label-base label-base--required">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className={`input-base ${emailError && hasAttempted ? 'input-base--error' : ''}`}
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (hasAttempted && emailError) setEmailError('');
                }}
                disabled={isLoading}
                required
                autoComplete="email"
              />
              {hasAttempted && emailError && (
                <span className="error-text">{emailError}</span>
              )}
            </div>

            <button
              type="submit"
              className="btn-base btn--primary btn--md btn--full"
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div className="forgot-password-page__login-link">
              <Link to="/login">Back to Sign In</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
