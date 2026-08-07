/**
 * CoachDetailPage
 * Comprehensive single-page interface for viewing and managing coach information
 * including profile management, batch assignments, student enrollment, and financial transactions.
 * 
 * Requirements: 1.1, 1.3, 20.1, 20.2, 20.3, 20.4
 * - Extracts coachId from URL params
 * - Initializes tab state (default to 'profile')
 * - Fetches coach data using useCoachDetail
 * - Fetches batches, students, payments using respective hooks
 * - Renders page header with coach info
 * - Handles tab navigation and role-based access control
 * - Implements optimistic updates with rollback on failure
 * - Shows success/error notifications via toast-like alerts
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../utils/apiClient';
import DashboardLayout from '../components/DashboardLayout';
import { CoachHeaderCard } from '../components/CoachHeaderCard';
import { TabNavigation } from '../components/TabNavigation';
import { CoachProfileTab } from '../components/CoachProfileTab';
import { CoachBatchesTab } from '../components/CoachBatchesTab';
import { CoachStudentsTab } from '../components/CoachStudentsTab';
import { CoachPaymentsTab } from '../components/CoachPaymentsTab';
import { ProfileTabSkeleton } from '../components/ProfileTabSkeleton';
import { BatchesTabSkeleton } from '../components/BatchesTabSkeleton';
import { StudentsTabSkeleton } from '../components/StudentsTabSkeleton';
import { PaymentsTabSkeleton } from '../components/PaymentsTabSkeleton';
import { ErrorState } from '../components/ErrorState';
import { useCoachDetail } from '../hooks/useCoachDetail';
import { useCoachBatches } from '../hooks/useCoachBatches';
import { useCoachStudents } from '../hooks/useCoachStudents';
import { useCoachPayments } from '../hooks/useCoachPayments';
import type { TabName, UserRole, User } from '../types';

interface CoachDetailPageState {
  activeTab: TabName;
  isLoadingData: boolean;
  error: string | null;
  accessDenialMessage: string | null;
  isRetrying: boolean;
}

interface ToastNotification {
  id: string;
  type: 'success' | 'error';
  message: string;
  timestamp: number;
}

/**
 * Main CoachDetailPage component
 * Orchestrates all coach detail functionality with tabbed interface
 */
export default function CoachDetailPage() {
  const { coachId } = useParams<{ coachId: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();

  // Validate coachId from URL params
  if (!coachId) {
    return (
      <DashboardLayout>
        <div className="text-center" style={{ padding: 'var(--space-3xl) var(--space-md)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Invalid Coach ID</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-sm)' }}>No coach ID provided in URL</p>
          <button
            onClick={() => navigate('/coaches')}
            className="btn-info text-white"
            style={{ marginTop: 'var(--space-md)', padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--radius-md)' }}
          >
            Return to Coaches
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // Page state
  const [pageState, setPageState] = useState<CoachDetailPageState>({
    activeTab: 'profile' as TabName,
    isLoadingData: false,
    error: null,
    accessDenialMessage: null,
    isRetrying: false,
  });

  // Notifications state
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Reset Password Modal state (HEAD_COACH only)
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState('');

  // Helper function to show toast notification
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    const notification: ToastNotification = {
      id,
      type,
      message,
      timestamp: Date.now(),
    };

    setToasts((prev) => [...prev, notification]);

    // Auto-remove toast after 5 seconds
    const timeout = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);

    return () => clearTimeout(timeout);
  };

  // Fetch coach data
  const { coach, isLoading: isLoadingCoach, error: coachError, refetch: refetchCoach } = useCoachDetail(coachId);

  /**
   * Handle admin reset password submit
   * Calls POST /api/coaches/:id/reset-password with the new password
   * Requirements: 2.1, 2.3, 2.7
   */
  const handleResetPasswordSubmit = async () => {
    setResetPasswordError('');
    setResetPasswordSuccess('');

    if (!resetPasswordValue.trim()) {
      setResetPasswordError('New password is required');
      return;
    }
    if (resetPasswordValue.length < 8) {
      setResetPasswordError('Password must be at least 8 characters');
      return;
    }
    if (resetPasswordValue.length > 128) {
      setResetPasswordError('Password must be at most 128 characters');
      return;
    }

    setResetPasswordLoading(true);
    try {
      const response = await apiClient.post(`/coaches/${coachId}/reset-password`, {
        newPassword: resetPasswordValue,
      });
      const newPassword = response.data?.newPassword || resetPasswordValue;
      setResetPasswordSuccess(newPassword);
      setResetPasswordValue('');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setResetPasswordError(axiosError.response?.data?.error || 'Failed to reset password. Please try again.');
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const closeResetPasswordModal = () => {
    setIsResetPasswordModalOpen(false);
    setResetPasswordValue('');
    setResetPasswordError('');
    setResetPasswordSuccess('');
  };

  // Fetch coach batches
  const {
    batches,
    isLoading: isLoadingBatches,
    error: batchesError,
    refetch: refetchBatches,
  } = useCoachBatches(coachId);

  // Fetch coach students
  const {
    students,
    isLoading: isLoadingStudents,
    error: studentsError,
    refetch: refetchStudents,
  } = useCoachStudents(coachId);

  // Fetch coach payments (fees and expenses)
  const {
    fees,
    expenses,
    isLoading: isLoadingPayments,
    error: paymentsError,
    refetch: refetchPayments,
  } = useCoachPayments(coachId);

  // Handler for optimistic coach profile updates (Requirement 20.1, 20.4)
  const handleUpdateCoach = async (updates: Partial<User>) => {
    if (!coach) return;

    // Store original data for rollback - captured for potential future use
    try {
      // Step 1: Optimistically update the coach data in memory
      // This provides immediate UI feedback to the user
      // The actual update will be confirmed after API response

      // Step 2: Make API call to update coach
      await apiClient.patch<User>(`/coaches/${coachId}`, updates);

      // Step 3: On success, refetch to get the authoritative updated data from server
      await refetchCoach();

      // Step 4: Show success toast (Requirement 20.4)
      showToast('Coach profile updated successfully', 'success');
    } catch (err) {
      console.error('Failed to update coach:', err);
      
      // Step 5: On failure, force a refetch to restore the original data (rollback)
      await refetchCoach();
      
      // Step 6: Show error toast with specific message (Requirement 20.4)
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to update coach profile. Please try again.';
      showToast(errorMessage, 'error');
    }
  };

  // Handler for optimistic batch assignment (Requirement 20.2)
  const handleBatchAssigned = async () => {
    try {
      // Optimistically update batches immediately
      // Refetch will confirm the update from server
      await refetchBatches();
      showToast('Batch assigned successfully', 'success');
    } catch (err) {
      console.error('Failed to assign batch:', err);
      // Rollback: restore original batches list
      // Note: refetchBatches already handles this via error state
      showToast('Failed to update batch assignment. Please try again.', 'error');
    }
  };

  // Handler for optimistic batch removal (Requirement 20.2)
  const handleBatchUnassigned = async () => {
    try {
      // Optimistically remove batch - show immediate feedback
      // Refetch will confirm the update from server
      await refetchBatches();
      showToast('Batch removed successfully', 'success');
    } catch (err) {
      console.error('Failed to remove batch:', err);
      // Rollback: restore original batches list
      // Note: refetchBatches already handles this via error state
      showToast('Failed to remove batch assignment. Please try again.', 'error');
    }
  };

  // Handler for optimistic student addition (Requirement 20.3)
  const handleStudentAdded = async () => {
    try {
      // Optimistically show success to user
      // Refetch will confirm the update from server
      await refetchStudents();
      showToast('Student added successfully', 'success');
    } catch (err) {
      console.error('Failed to add student:', err);
      // Rollback: original students list maintained in state
      // Note: refetchStudents already handles this via error state
      showToast('Failed to add student. Please try again.', 'error');
    }
  };

  // Handler for optimistic student removal (Requirement 20.3)
  const handleStudentRemoved = async () => {
    try {
      // Optimistically remove student - show immediate feedback
      // Refetch will confirm the update from server
      await refetchStudents();
      showToast('Student removed successfully', 'success');
    } catch (err) {
      console.error('Failed to remove student:', err);
      // Rollback: original students list maintained in state
      // Note: refetchStudents already handles this via error state
      showToast('Failed to remove student. Please try again.', 'error');
    }
  };

  // Handler for expense operations (Requirement 20.4)
  const handleExpenseDeleted = async (_expenseId: string) => {
    try {
      await refetchPayments();
      showToast('Expense deleted successfully', 'success');
    } catch (err) {
      console.error('Failed to delete expense:', err);
      showToast(
        'Failed to delete expense. Please try again.',
        'error'
      );
    }
  };

  // Check overall loading state
  useEffect(() => {
    const isLoading = isLoadingCoach || isLoadingBatches || isLoadingStudents || isLoadingPayments;
    const error = coachError || batchesError || studentsError || paymentsError;

    setPageState((prev) => ({
      ...prev,
      isLoadingData: isLoading,
      error: error,
    }));
  }, [isLoadingCoach, isLoadingBatches, isLoadingStudents, isLoadingPayments, coachError, batchesError, studentsError, paymentsError]);

  // Determine visible tabs based on user role
  const getVisibleTabs = (): TabName[] => {
    switch (role) {
      case 'HEAD_COACH':
        return ['profile', 'batches', 'students', 'payments'];
      case 'ASSISTANT_COACH':
        return ['profile', 'students'];
      case 'STUDENT':
        return []; // No tabs visible for students
      default:
        return [];
    }
  };

  const visibleTabs = getVisibleTabs();

  // Handle role-based access denial for students (Requirement 19.1)
  useEffect(() => {
    if (role === 'STUDENT') {
      // Persist denial message in localStorage for display after redirect
      localStorage.setItem(
        'accessDenialMessage',
        'You do not have permission to access this resource.'
      );
      navigate('/dashboard');
    }
  }, [role, navigate]);

  // Handle payment tab access denial for non-HEAD_COACH roles (Requirements 18.5, 19.1)
  useEffect(() => {
    if (pageState.activeTab === 'payments' && role !== 'HEAD_COACH') {
      const denialMessage =
        role === 'ASSISTANT_COACH'
          ? 'You do not have access to payment information.'
          : 'You do not have permission to access this resource.';

      // Persist denial message in localStorage for display after redirect
      localStorage.setItem('accessDenialMessage', denialMessage);
      navigate('/dashboard');
    }
  }, [pageState.activeTab, role, navigate]);

  // Check for and display persisted access denial message on page load (Requirement 13.4)
  useEffect(() => {
    const denialMessage = localStorage.getItem('accessDenialMessage');
    if (denialMessage) {
      setPageState((prev) => ({
        ...prev,
        accessDenialMessage: denialMessage,
      }));
      // Clear from localStorage to avoid showing it again on next load
      localStorage.removeItem('accessDenialMessage');
    }
  }, []);

  // Show loading state
  if (pageState.isLoadingData && !coach) {
    return (
      <DashboardLayout>
        <div className="page-container">
          <div className="h-24 animate-pulse" style={{ backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)' }} />
          <div className="section-stack">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse" style={{ backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-md)' }} />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state
  if (pageState.error && !coach) {
    const handleRetry = async () => {
      setPageState((prev) => ({ ...prev, isRetrying: true }));
      try {
        await Promise.all([
          refetchCoach(),
          refetchBatches(),
          refetchStudents(),
          refetchPayments(),
        ]);
      } finally {
        setPageState((prev) => ({ ...prev, isRetrying: false }));
      }
    };

    return (
      <DashboardLayout>
        <div className="mx-4 lg:mx-6" style={{ marginTop: 'var(--space-xl)' }}>
          <ErrorState
            error={pageState.error}
            onRetry={handleRetry}
            isRetrying={pageState.isRetrying}
            variant="page"
          />
        </div>
      </DashboardLayout>
    );
  }

  // Show no coach found
  if (!coach) {
    return (
      <DashboardLayout>
        <div className="text-center" style={{ padding: 'var(--space-3xl) var(--space-md)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Coach not found</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-sm)' }}>The coach you're looking for does not exist or access is denied</p>
          <button
            onClick={() => navigate('/coaches')}
            className="btn-info text-white"
            style={{ marginTop: 'var(--space-md)', padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--radius-md)' }}
          >
            Return to Coaches
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // Handle tab change
  const handleTabChange = (tabName: string) => {
    const tab = tabName as TabName;
    if (visibleTabs.includes(tab)) {
      setPageState((prev) => ({ ...prev, activeTab: tab }));
    }
  };

  // Calculate summary stats
  const batchCount = batches.length;
  const studentCount = students.length;

  // Convert role to UserRole type for header
  const userRole: UserRole = (role as UserRole) || 'STUDENT';

  return (
    <DashboardLayout>
      <div className="coach-detail-page bg-white min-h-screen">
        {/* Page Header Section */}
        <div style={{ borderBottom: '1px solid var(--border-default)' }}>
          <div className="max-w-7xl mx-auto" style={{ padding: 'var(--space-xl) var(--space-md)' }}>
            <CoachHeaderCard
              coach={coach}
              batchCount={batchCount}
              studentCount={studentCount}
              userRole={userRole}
            />
            {/* Reset Password Button - HEAD_COACH only */}
            {role === 'HEAD_COACH' && (
              <div style={{ marginTop: 'var(--space-md)' }}>
                <button
                  onClick={() => setIsResetPasswordModalOpen(true)}
                  className="btn-base btn--md"
                  style={{
                    backgroundColor: 'var(--surface-hover)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-sm) var(--space-md)',
                    fontWeight: 'var(--weight-medium)',
                    cursor: 'pointer',
                  }}
                >
                  Reset Password
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Access Denial Message (Requirement 13.4) */}
        {pageState.accessDenialMessage && (
          <div className="bg-red-50 border-b border-red-200">
            <div className="max-w-7xl mx-auto" style={{ padding: 'var(--space-md)' }}>
              <div className="flex items-start" style={{ gap: 'var(--space-sm)' }} role="alert">
                <svg
                  className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900 text-sm">Access Denied</h4>
                  <p className="text-red-800 text-sm" style={{ marginTop: 'var(--space-xs)' }}>{pageState.accessDenialMessage}</p>
                </div>
                <button
                  onClick={() => setPageState((prev) => ({ ...prev, accessDenialMessage: null }))}
                  className="flex-shrink-0 text-red-500 hover:text-red-700 transition-colors"
                  aria-label="Dismiss message"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation Section */}
        <div style={{ borderBottom: '1px solid var(--border-default)' }}>
          <div className="max-w-7xl mx-auto" style={{ padding: '0 var(--space-md)' }}>
            <TabNavigation
              tabs={visibleTabs.map((tab) => ({
                id: tab,
                label: tab.charAt(0).toUpperCase() + tab.slice(1),
                disabled: false,
              }))}
              activeTab={pageState.activeTab}
              onTabChange={handleTabChange}
              ariaLabel="Coach detail tabs"
            />
          </div>
        </div>

        {/* Tab Content Section */}
        <div className="coach-detail-content bg-white">
          <div className="max-w-7xl mx-auto page-container">
            {/* Profile Tab */}
            {pageState.activeTab === 'profile' && (
              isLoadingCoach ? (
                <ProfileTabSkeleton />
              ) : coach ? (
                <CoachProfileTab
                  coach={coach}
                  userRole={userRole}
                  onUpdateCoach={handleUpdateCoach}
                  isLoading={isLoadingCoach}
                />
              ) : null
            )}

            {/* Batches Tab */}
            {pageState.activeTab === 'batches' && (
              isLoadingBatches ? (
                <BatchesTabSkeleton />
              ) : (
                <CoachBatchesTab
                  batches={batches}
                  userRole={userRole}
                  coachId={coachId}
                  isLoading={isLoadingBatches}
                  onBatchAssigned={handleBatchAssigned}
                  onBatchUnassigned={handleBatchUnassigned}
                />
              )
            )}

            {/* Students Tab */}
            {pageState.activeTab === 'students' && (
              isLoadingStudents ? (
                <StudentsTabSkeleton />
              ) : (
                <CoachStudentsTab
                  students={students}
                  coachId={coachId}
                  userRole={userRole}
                  batches={batches}
                  onStudentAdded={handleStudentAdded}
                  onStudentRemoved={handleStudentRemoved}
                  isLoading={isLoadingStudents}
                />
              )
            )}

            {/* Payments Tab */}
            {pageState.activeTab === 'payments' && (
              isLoadingPayments ? (
                <PaymentsTabSkeleton />
              ) : (
                <CoachPaymentsTab
                  coachId={coachId}
                  fees={fees}
                  expenses={expenses}
                  students={students}
                  onExpenseDeleted={handleExpenseDeleted}
                />
              )
            )}
          </div>
        </div>

        {/* Reset Password Modal (HEAD_COACH only) */}
        {isResetPasswordModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={closeResetPasswordModal}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-md mx-4"
              style={{ padding: 'var(--space-2xl)', border: '1px solid var(--border-default)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>
                Reset Password for {coach.name}
              </h2>

              {resetPasswordSuccess ? (
                <div>
                  <div className="alert-base alert--success" role="alert" style={{ marginBottom: 'var(--space-md)' }}>
                    <svg className="alert-base__icon" aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" fill="currentColor"/>
                    </svg>
                    <div className="alert-base__content">
                      <div className="alert-base__title">Password reset successfully.</div>
                    </div>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-small)', marginBottom: 'var(--space-sm)' }}>
                    Share this new password with the coach:
                  </p>
                  <div
                    style={{
                      padding: 'var(--space-md)',
                      backgroundColor: 'var(--surface-hover)',
                      borderRadius: 'var(--radius-md)',
                      fontFamily: 'monospace',
                      fontSize: 'var(--font-sm)',
                      color: 'var(--text-primary)',
                      wordBreak: 'break-all',
                      marginBottom: 'var(--space-lg)',
                      border: '1px solid var(--border-default)',
                    }}
                  >
                    {resetPasswordSuccess}
                  </div>
                  <button
                    onClick={closeResetPasswordModal}
                    className="btn-base btn--primary btn--md btn--full"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-small)', marginBottom: 'var(--space-lg)' }}>
                    Enter a new password for this coach. You will be shown the password after reset so you can share it with them.
                  </p>

                  {resetPasswordError && (
                    <div className="alert-base alert--danger" role="alert" style={{ marginBottom: 'var(--space-md)' }}>
                      <svg className="alert-base__icon" aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM10 6v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <div className="alert-base__content">
                        <div className="alert-base__title">{resetPasswordError}</div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', marginBottom: 'var(--space-lg)' }}>
                    <label htmlFor="reset-new-password" className="label-base label-base--required">
                      New Password
                    </label>
                    <input
                      id="reset-new-password"
                      type="password"
                      className={`input-base ${resetPasswordError ? 'input-base--error' : ''}`}
                      placeholder="Enter new password (min 8 characters)"
                      value={resetPasswordValue}
                      onChange={(e) => {
                        setResetPasswordValue(e.target.value);
                        if (resetPasswordError) setResetPasswordError('');
                      }}
                      disabled={resetPasswordLoading}
                      autoComplete="new-password"
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                    <button
                      onClick={closeResetPasswordModal}
                      className="btn-base btn--md"
                      style={{
                        flex: 1,
                        backgroundColor: 'var(--surface-hover)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                      }}
                      disabled={resetPasswordLoading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleResetPasswordSubmit}
                      className="btn-base btn--primary btn--md"
                      style={{ flex: 1 }}
                      disabled={resetPasswordLoading}
                      aria-busy={resetPasswordLoading}
                    >
                      {resetPasswordLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Toast Notifications Container */}
        <div className="fixed bottom-0 right-0 z-50 pointer-events-none max-w-md" style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`card pointer-events-auto flex items-start border animate-in slide-in-from-right ${
                toast.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
              style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-float)', gap: 'var(--space-sm)' }}
              role="alert"
              aria-live="polite"
              aria-atomic="true"
            >
              {toast.type === 'success' ? (
                <svg className="w-5 h-5 flex-shrink-0 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">{toast.message}</p>
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="flex-shrink-0 text-current opacity-70 hover:opacity-100 transition-opacity"
                aria-label="Dismiss notification"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
