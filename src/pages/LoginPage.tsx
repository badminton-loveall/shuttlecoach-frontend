import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getCenterPublicInfo } from '../services/api';
import type { UserRole, CenterPublicInfo } from '../types';
import { Logo } from '../marketing/components/brand/Logo';
import { Crest } from '../marketing/components/brand/Crest';
import { CourtLines } from '../marketing/components/brand/CourtLines';
import { ShuttleCourt } from '../marketing/components/brand/ShuttleCourt';
import { Field } from '../marketing/components/ui/Field';
import { Button } from '../marketing/components/ui/Button';
import { ThemeToggle } from '../marketing/components/layout/ThemeToggle';

/**
 * LoginPage Component
 * LoveAll design system: a court-green panel with a to-scale badminton court
 * beside an ivory sign-in form, under the same logo as the marketing header.
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
  generalAction?: string;
}

/**
 * Maps the backend's login error codes to a concrete next step, shown as a
 * second line under the error message — "incorrect password" alone doesn't
 * tell someone whether to retype it or go reset it.
 */
const LOGIN_ERROR_ACTIONS: Record<string, string> = {
  USER_NOT_FOUND: 'Double-check the email or username, or ask your coach/admin to confirm your account exists.',
  PASSWORD_MISMATCH: 'Re-check your password, or use "Forgot Password?" below to reset it.',
};

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
      // error.message on a raw AxiosError is a generic string like "Request
      // failed with status code 401" — the backend's actual reason (e.g.
      // "Incorrect password") and errorCode are in the JSON response body,
      // not the exception message, so they have to be read from there.
      const axiosError = error as { response?: { data?: { error?: string; errorCode?: string } } };
      const errorCode = axiosError.response?.data?.errorCode;
      setErrors({
        general: axiosError.response?.data?.error ?? 'Login failed. Please try again.',
        generalAction: errorCode ? LOGIN_ERROR_ACTIONS[errorCode] : undefined,
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
      <div className="marketing-scope flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas text-fg">
        <Crest size={56} className="animate-pulse text-fg" />
        <p className="text-[15px] text-fg-muted">Loading...</p>
      </div>
    );
  }

  // Center not found error state
  if (centerSlug && centerError) {
    return (
      <div className="marketing-scope relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4 text-fg">
        <CourtLines className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[920px] -translate-x-1/2 -translate-y-1/2 text-rule" />
        <div className="relative w-full max-w-md rounded-lg border border-rule-strong bg-surface p-8 text-center shadow-soft-1 md:p-10">
          <Crest size={56} className="mx-auto text-fg" />
          <h1 className="mt-6 text-h3 text-fg">Center not found</h1>
          <p className="mt-3 text-fg-muted">
            The center you are looking for does not exist or is no longer available.
          </p>
          <Button to="/login" className="mt-8 w-full">
            Go to login page
          </Button>
        </div>
      </div>
    );
  }

  // Determine branding: use center info if available, otherwise default
  const brandName = centerInfo?.name ?? 'LoveAll';
  const brandLogoUrl = centerInfo?.logoUrl ?? null;

  return (
    <div className="marketing-scope grid min-h-screen bg-canvas text-fg lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Court panel (desktop) */}
      <aside
        data-surface="court"
        aria-hidden="true"
        className="relative hidden overflow-hidden bg-court text-on-court lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16"
      >
        <ShuttleCourt className="pointer-events-none absolute bottom-10 right-10 top-10 h-[calc(100%-5rem)] w-auto text-on-court/20 xl:right-16" />
        <div className="relative max-w-sm">
          <p className="eyebrow text-on-court-muted">— Love all —</p>
          <div className="mt-6 font-display text-[40px] leading-[1.1] tracking-[-0.015em] xl:text-h1">
            Every great match begins at <em className="italic">Love all.</em>
          </div>
          <p className="mt-5 text-lead text-on-court-muted">
            Players, batches, training plans, assessments, attendance and fees — all on one court.
          </p>
        </div>
        <div className="relative flex items-end gap-5">
          <div className="rounded-md border border-on-court/30 bg-court-deep/70 px-5 py-3 text-center">
            <div className="numerals text-[34px] leading-none">0 – 0</div>
            <p className="eyebrow mt-2 text-[10px] text-on-court-muted">Serve to begin</p>
          </div>
          <p className="max-w-[14rem] pb-1 text-[14px] text-on-court-muted">
            Now live for badminton. More racket sports coming soon.
          </p>
        </div>
      </aside>

      {/* Sign-in column */}
      <div className="relative flex min-h-screen flex-col overflow-hidden">
        <CourtLines className="pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[790px] -translate-x-1/2 -translate-y-1/2 text-rule lg:hidden" />

        <header className="relative flex h-16 items-center justify-between border-b border-rule px-4 sm:px-8">
          <Link to="/" aria-label="LoveAll, home" className="rounded-sm">
            <Logo size="sm" />
          </Link>
          <ThemeToggle />
        </header>

        <main className="relative flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
          <div className="w-full max-w-[420px]">
            {centerInfo ? (
              <div className="flex flex-col items-center text-center">
                {brandLogoUrl ? (
                  <img
                    src={brandLogoUrl}
                    alt={`${brandName} logo`}
                    className="size-20 rounded-md border border-rule bg-surface object-contain p-1.5"
                  />
                ) : (
                  <Crest size={64} className="text-fg" />
                )}
                <p className="eyebrow mt-5 text-accent-ink">— Academy sign in —</p>
                <h1 className="mt-3 text-[32px] leading-[1.15] text-fg">{brandName}</h1>
              </div>
            ) : (
              <div>
                <p className="eyebrow text-accent-ink">— Sign in —</p>
                <h1 className="mt-3 text-[34px] leading-[1.15] tracking-[-0.01em] text-fg sm:text-h1">
                  Welcome back to the court
                </h1>
                <p className="mt-3 text-fg-muted">
                  Coaches, students and parents: use the login your academy shared with you.
                </p>
              </div>
            )}

            <div className="rule-double mt-8 pt-8">
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                {errors.general && (
                  <div
                    role="alert"
                    className="flex flex-col gap-1 rounded-md border border-danger/40 bg-danger-bg px-4 py-3 text-[14px] font-medium text-danger"
                  >
                    <span>{errors.general}</span>
                    {errors.generalAction && (
                      <span className="text-[13px] font-normal text-fg-muted">{errors.generalAction}</span>
                    )}
                  </div>
                )}

                <Field
                  label="Email"
                  name="email"
                  type="email"
                  placeholder="you@academy.com"
                  value={formData.email}
                  onChange={(value) => handleInputChange('email', value)}
                  error={hasAttempted ? errors.email : undefined}
                  disabled={isLoading}
                  autoComplete="email"
                />

                <div className="flex flex-col gap-1.5">
                  <Field
                    label="Password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(value) => handleInputChange('password', value)}
                    error={hasAttempted ? errors.password : undefined}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <Link
                    to="/forgot-password"
                    className="self-end rounded-sm text-[14px] font-medium text-fg-muted underline decoration-accent decoration-1 underline-offset-4 hover:text-primary"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="mt-1 w-full border-lime bg-lime text-ink hover:border-lime hover:bg-lime hover:brightness-95"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </div>

            <p className="mt-8 border-t border-rule pt-6 text-center text-[15px] text-fg-muted">
              {centerInfo ? (
                <span className="inline-flex items-center gap-2">
                  <Crest size={20} className="text-fg-subtle" />
                  Powered by LoveAll
                </span>
              ) : (
                <>
                  New academy?{' '}
                  <Button to="/contact" variant="tertiary">
                    Request a demo
                  </Button>
                </>
              )}
            </p>
          </div>
        </main>

        <footer className="relative px-4 pb-6 text-center text-[13px] text-fg-subtle sm:px-8">
          © {new Date().getFullYear()} LoveAll · Made for the love of the game.
        </footer>
      </div>
    </div>
  );
};

export default LoginPage;
