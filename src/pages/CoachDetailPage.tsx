/**
 * CoachDetailPage
 * Comprehensive single-page interface for viewing and managing coach information
 * including profile management, batch assignments, student enrollment, and financial transactions.
 * 
 * Requirements: 1.1, 1.3, 20.1
 * - Extracts coachId from URL params
 * - Initializes tab state (default to 'profile')
 * - Fetches coach data using useCoachDetail
 * - Fetches batches, students, payments using respective hooks
 * - Renders page header with coach info
 * - Handles tab navigation and role-based access control
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { CoachHeaderCard } from '../components/CoachHeaderCard';
import { TabNavigation } from '../components/TabNavigation';
import { CoachProfileTab } from '../components/CoachProfileTab';
import { CoachBatchesTab } from '../components/CoachBatchesTab';
import { CoachStudentsTab } from '../components/CoachStudentsTab';
import { CoachPaymentsTab } from '../components/CoachPaymentsTab';
import { useCoachDetail } from '../hooks/useCoachDetail';
import { useCoachBatches } from '../hooks/useCoachBatches';
import { useCoachStudents } from '../hooks/useCoachStudents';
import { useCoachPayments } from '../hooks/useCoachPayments';
import type { TabName, UserRole } from '../types';

interface CoachDetailPageState {
  activeTab: TabName;
  isLoadingData: boolean;
  error: string | null;
  accessDenialMessage: string | null;
}

/**
 * Main CoachDetailPage component
 * Orchestrates all coach detail functionality with tabbed interface
 */
export default function CoachDetailPage() {
  const { coachId } = useParams<{ coachId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth();

  // Validate coachId from URL params
  if (!coachId) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-lg font-semibold text-gray-900">Invalid Coach ID</h2>
          <p className="text-gray-600 mt-2">No coach ID provided in URL</p>
          <button
            onClick={() => navigate('/coaches')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
  });

  // Fetch coach data
  const { coach, isLoading: isLoadingCoach, error: coachError, refetch: refetchCoach } = useCoachDetail(coachId);

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
    if (pageState.activeTab === 'payments' && role !== 'HEAD_COACH' && role !== 'ADMIN') {
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
        <div className="p-6">
          <div className="h-24 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state
  if (pageState.error && !coach) {
    return (
      <DashboardLayout>
        <div className="border border-red-300 bg-red-50 rounded-lg p-4 m-6">
          <h4 className="font-semibold text-red-900">Failed to load coach details</h4>
          <p className="text-red-800 text-sm mt-1">{pageState.error}</p>
          <button
            onClick={() => {
              void refetchCoach();
              void refetchBatches();
              void refetchStudents();
              void refetchPayments();
            }}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // Show no coach found
  if (!coach) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-lg font-semibold text-gray-900">Coach not found</h2>
          <p className="text-gray-600 mt-2">The coach you're looking for does not exist or access is denied</p>
          <button
            onClick={() => navigate('/coaches')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
      <div className="coach-detail-page">
        {/* Page Header */}
        <div className="mx-4 lg:mx-6 mt-6">
          <CoachHeaderCard
            coach={coach}
            batchCount={batchCount}
            studentCount={studentCount}
            userRole={userRole}
          />
        </div>

        {/* Access Denial Message (Requirement 13.4) */}
        {pageState.accessDenialMessage && (
          <div className="mx-4 lg:mx-6 mt-4 border border-red-300 bg-red-50 rounded-lg p-4" role="alert">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h4 className="font-semibold text-red-900">Access Denied</h4>
                <p className="text-red-800 text-sm mt-1">{pageState.accessDenialMessage}</p>
              </div>
              <button
                onClick={() => setPageState((prev) => ({ ...prev, accessDenialMessage: null }))}
                className="ml-auto text-red-500 hover:text-red-700"
                aria-label="Dismiss message"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mx-4 lg:mx-6 mt-6">
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

        {/* Tab Content - Render appropriate component based on activeTab */}
        <div className="coach-detail-content mx-4 lg:mx-6 mt-6 mb-12">
          {/* Profile Tab */}
          {pageState.activeTab === 'profile' && coach && (
            <CoachProfileTab
              coach={coach}
              userRole={userRole}
              onUpdateCoach={async (updates) => {
                await refetchCoach();
              }}
              isLoading={isLoadingCoach}
            />
          )}

          {/* Batches Tab */}
          {pageState.activeTab === 'batches' && (
            <CoachBatchesTab
              batches={batches}
              userRole={userRole}
              coachId={coachId}
              isLoading={isLoadingBatches}
              onBatchAssigned={() => {
                void refetchBatches();
              }}
              onBatchUnassigned={() => {
                void refetchBatches();
              }}
            />
          )}

          {/* Students Tab */}
          {pageState.activeTab === 'students' && (
            <CoachStudentsTab
              students={students}
              coachId={coachId}
              userRole={userRole}
              batches={batches}
              onStudentAdded={() => {
                void refetchStudents();
              }}
              onStudentRemoved={() => {
                void refetchStudents();
              }}
              isLoading={isLoadingStudents}
            />
          )}

          {/* Payments Tab */}
          {pageState.activeTab === 'payments' && (
            <CoachPaymentsTab
              coachId={coachId}
              fees={fees}
              expenses={expenses}
              students={students}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
