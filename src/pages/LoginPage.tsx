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
  username: string;
  password: string;
}

interface FormErrors {
  username?: string;
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

// Badminton-related background images (Unsplash - free to use)
const BACKGROUND_IMAGES = [
  'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1613918431703-aa50889e3be4?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1599391398131-cd12dfc6c24e?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1920&q=80',
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { centerSlug } = useParams<{ centerSlug?: string }>();
  const { login, isAuthenticated, role } = useAuth();

  const [formData, setFormData] = useState<FormState>({
    username: '',
    password: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Center branding state
  const [centerInfo, setCenterInfo] = useState<CenterPublicInfo | null>(null);
  const [centerLoading, setCenterLoading] = useState(false);
  const [centerError, setCenterError] = useState(false);

  // Background image slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
    if (!formData.username.trim()) newErrors.username = 'Username is required';
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
      await login(formData.username, formData.password, centerSlug);
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
      {/* Full-screen background images */}
      {BACKGROUND_IMAGES.map((url, index) => (
        <div
          key={url}
          style={{
            ...styles.bgImage,
            backgroundImage: `url(${url})`,
            opacity: index === currentImageIndex ? 1 : 0,
          }}
        />
      ))}

      {/* Dark overlay for readability */}
      <div style={styles.overlay} />

      {/* Floating login modal on the right */}
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
              <label htmlFor="username" style={styles.label}>Username</label>
              <input
                id="username"
                type="text"
                style={{
                  ...styles.input,
                  ...(errors.username ? styles.inputError : {}),
                }}
                placeholder="Enter your username"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                disabled={isLoading}
                autoComplete="username"
              />
              {hasAttempted && errors.username && (
                <span style={styles.fieldError}>{errors.username}</span>
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalWrapper: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    marginRight: '5vw',
  },
  modal: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(12px)',
    borderRadius: '16px',
    padding: '40px 36px',
    width: '100%',
    maxWidth: '380px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
  },
  brandSection: {
    textAlign: 'center' as const,
    marginBottom: '32px',
  },
  brandLogo: {
    width: '64px',
    height: '64px',
    objectFit: 'contain' as const,
    marginBottom: '12px',
    borderRadius: '8px',
  },
  brandName: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#1a1a1a',
    margin: '0 0 4px',
    letterSpacing: '-0.5px',
  },
  brandTagline: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#374151',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
    backgroundColor: '#fff',
    boxSizing: 'border-box' as const,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  fieldError: {
    fontSize: '12px',
    color: '#ef4444',
  },
  errorBanner: {
    padding: '10px 14px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#dc2626',
    fontSize: '13px',
  },
  submitBtn: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#fff',
    backgroundColor: '#4f46e5',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: '4px',
  },
  submitBtnDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  forgotLink: {
    textAlign: 'center' as const,
  },
  link: {
    fontSize: '13px',
    color: '#4f46e5',
    textDecoration: 'none',
    fontWeight: 500,
  },
  footer: {
    textAlign: 'center' as const,
    marginTop: '28px',
    paddingTop: '16px',
    borderTop: '1px solid #e5e7eb',
  },
  footerText: {
    fontSize: '12px',
    color: '#9ca3af',
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
    borderTopColor: '#4f46e5',
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
    color: '#fff',
    backgroundColor: '#4f46e5',
    borderRadius: '8px',
    textDecoration: 'none',
  },
};

export default LoginPage;
