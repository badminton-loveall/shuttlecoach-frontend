import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getCenterPublicInfo } from '../services/api';
import type { UserRole, CenterPublicInfo } from '../types';

/**
 * LoginPage Component
 * Full-screen badminton imagery with a floating login modal on the right.
 * Supports center-branded login when accessed via /login/:centerSlug.
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.1, 6.2, 6.3
 */

interface FormState {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const getRedirectPath = (role: UserRole): string => {
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard';
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
  const { centerSlug } = useParams<{ centerSlug?: string }>();
  const { login, isAuthenticated, role } = useAuth();

  const [formData, setFormData] = useState<FormState>({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);

  // Center branding state
  const [centerInfo, setCenterInfo] = useState<CenterPublicInfo | null>(null);
  const [centerLoading, setCenterLoading] = useState(false);
  const [centerError, setCenterError] = useState(false);

  // Fetch center info when centerSlug is present
  useEffect(() => {
    if (!centerSlug) return;
    setCenterLoading(true);
    getCenterPublicInfo(centerSlug)
      .then((info) => {
        setCenterInfo(info);
        setCenterLoading(false);
      })
      .catch(() => {
        setCenterError(true);
        setCenterLoading(false);
      });
  }, [centerSlug]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && role) {
      const redirectPath = getRedirectPath(role);
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setHasAttempted(true);
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      await login(formData.email, formData.password, centerSlug);
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'Login failed. Please try again.',
      });
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (hasAttempted && errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Loading state while fetching center info
  if (centerSlug && centerLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading...</p>
      </div>
    );
  }

  // Center not found error state
  if (centerSlug && centerError) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorCard}>
          <h1 style={styles.errorTitle}>Center not found</h1>
          <p style={styles.errorMessage}>
            The center you are looking for does not exist or is no longer available.
          </p>
          <Link to="/login" style={styles.errorLink}>
            Go to login page
          </Link>
        </div>
      </div>
    );
  }

  // Determine branding: use center info if available, otherwise default
  const brandName = centerInfo?.name ?? 'LoveAll';
  const brandLogoUrl = centerInfo?.logoUrl ?? null;

  return (
    <div style={styles.container}>
      {/* Static background image from public folder (optimized WebP) */}
      <div
        style={{
          ...styles.bgImage,
          backgroundImage: `url(/login_bg.webp), url(/login_bg.png)`,
          opacity: 1,
        }}
      />

      {/* Dark overlay for readability */}
      <div style={styles.overlay} />

      {/* Centered login card */}
      <div style={styles.modalWrapper}>
        <div style={styles.modal}>
          {/* Brand */}
          <div style={styles.brandSection}>
            {brandLogoUrl && (
              <img
                src={brandLogoUrl}
                alt={`${brandName} logo`}
                style={styles.brandLogo}
              />
            )}
            <h1 style={styles.brandName}>{brandName}</h1>
            <p style={styles.brandTagline}>Badminton Training Management</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate style={styles.form}>
            {errors.general && (
              <div style={styles.errorBanner}>
                <span>{errors.general}</span>
              </div>
            )}

            <div style={styles.formGroup}>
              <label htmlFor="email" style={styles.label}>Email</label>
              <input
                id="email"
                type="email"
                style={{
                  ...styles.input,
                  ...(errors.email ? styles.inputError : {}),
                }}
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={isLoading}
                autoComplete="email"
              />
              {hasAttempted && errors.email && (
                <span style={styles.fieldError}>{errors.email}</span>
              )}
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="password" style={styles.label}>Password</label>
              <input
                id="password"
                type="password"
                style={{
                  ...styles.input,
                  ...(errors.password ? styles.inputError : {}),
                }}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
              />
              {hasAttempted && errors.password && (
                <span style={styles.fieldError}>{errors.password}</span>
              )}
            </div>

            <button
              type="submit"
              style={{
                ...styles.submitBtn,
                ...(isLoading ? styles.submitBtnDisabled : {}),
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>

            <div style={styles.forgotLink}>
              <Link to="/forgot-password" style={styles.link}>
                Forgot Password?
              </Link>
            </div>
          </form>

          {/* Footer */}
          <div style={styles.footer}>
            <span style={styles.footerText}>Powered by ShuttleCoach</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Inline styles for the login page (self-contained, no CSS file dependency)
const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bgImage: {
    position: 'absolute',
    inset: 0,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    transition: 'opacity 1.5s ease-in-out',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalWrapper: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    marginRight: '6vw',
    width: '100%',
    maxWidth: '480px',
  },
  modal: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    backdropFilter: 'blur(16px)',
    borderRadius: '20px',
    padding: '48px 44px',
    width: '100%',
    boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.4)',
  },
  brandSection: {
    textAlign: 'center' as const,
    marginBottom: '36px',
  },
  brandLogo: {
    width: '72px',
    height: '72px',
    objectFit: 'contain' as const,
    marginBottom: '16px',
    borderRadius: '12px',
  },
  brandName: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#1a1a1a',
    margin: '0 0 6px',
    letterSpacing: '-0.5px',
  },
  brandTagline: {
    fontSize: '15px',
    color: '#6b7280',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '22px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1f2937',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '15px',
    border: '1.5px solid #e5e7eb',
    borderRadius: '10px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    backgroundColor: '#fafafa',
    boxSizing: 'border-box' as const,
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  fieldError: {
    fontSize: '12px',
    color: '#ef4444',
    fontWeight: 500,
  },
  errorBanner: {
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    color: '#dc2626',
    fontSize: '13px',
    fontWeight: 500,
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    fontSize: '15px',
    fontWeight: 600,
    color: '#1a1a1a',
    backgroundColor: '#B8E135',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'background-color 0.2s, transform 0.1s',
    marginTop: '8px',
    boxShadow: '0 4px 12px rgba(184, 225, 53, 0.35)',
  },
  submitBtnDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  forgotLink: {
    textAlign: 'center' as const,
    marginTop: '4px',
  },
  link: {
    fontSize: '13px',
    color: '#6b8a0a',
    textDecoration: 'none',
    fontWeight: 500,
  },
  footer: {
    textAlign: 'center' as const,
    marginTop: '32px',
    paddingTop: '20px',
    borderTop: '1px solid #e5e7eb',
  },
  footerText: {
    fontSize: '12px',
    color: '#9ca3af',
    letterSpacing: '0.3px',
  },
  // Loading state styles
  loadingContainer: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e5e7eb',
    borderTopColor: '#B8E135',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    marginTop: '16px',
    fontSize: '14px',
    color: '#6b7280',
  },
  // Error state styles
  errorContainer: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  errorCard: {
    textAlign: 'center' as const,
    padding: '48px 36px',
    backgroundColor: '#fff',
    borderRadius: '16px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    maxWidth: '400px',
  },
  errorTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#1a1a1a',
    margin: '0 0 12px',
  },
  errorMessage: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 24px',
    lineHeight: 1.5,
  },
  errorLink: {
    display: 'inline-block',
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#1a1a1a',
    backgroundColor: '#B8E135',
    borderRadius: '8px',
    textDecoration: 'none',
  },
};

export default LoginPage;
