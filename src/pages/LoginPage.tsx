import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';

/**
 * LoginPage Component
 * Full-screen badminton imagery with a floating login modal on the right.
 * Clean single-user login form without demo credentials.
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
  const { login, isAuthenticated, role } = useAuth();

  const [formData, setFormData] = useState<FormState>({
    username: '',
    password: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Background image slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
      await login(formData.username, formData.password);
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
            <h1 style={styles.brandName}>LoveAll</h1>
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
};

export default LoginPage;
