import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import StatCard from '../components/StatCard';
import FeeAlerts from '../components/FeeAlerts';
import CoachWorkload from '../components/CoachWorkload';
import RecentActivity from '../components/RecentActivity';
import { DashboardAttendanceBlock } from '../components/attendance/DashboardAttendanceBlock';
import OnboardingChecklist from '../components/OnboardingChecklist';
import { useAuth } from '../contexts/AuthContext';
import { useStudents } from '../hooks/useStudents';
import { useFees } from '../hooks/useFees';
import { useBatches } from '../hooks/useBatches';
import { useCoaches } from '../hooks/useCoaches';
import { useAssessments } from '../hooks/useAssessments';
import { useTrainingLogs } from '../hooks/useTrainingLogs';
import { useSessionCalendar } from '../hooks/useSessionSchedule';
import { useOnboardingChecklist } from '../hooks/useOnboardingChecklist';
import { useMarketplaceSubscriptions } from '../hooks/useMarketplaceSubscriptions';
import { calculateDashboardStats } from '../utils/dashboardUtils';
import { isDueForAssessment, daysOverdue, getLastAssessment } from '../utils/reviewUtils';
import { getOverdueFeesByStudent } from '../utils/feeUtils';
import { generateActivityFeed, getCoachWorkloads } from '../utils/activityUtils';
import type { SkillAssessment, TrainingLog, User } from '../types';
import '../styles/pages.css';

/**
 * HeadCoachDashboard Page
 * Displays head coach dashboard with welcome message, stat cards, and student grid
 * Shows: total students, active marketplace subscriptions, batch count, average progress
 * Includes search and filter functionality with URL query parameter persistence
 * Pure CSS implementation using design tokens
 */

export const HeadCoachDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Live data from API
  const { students, loading: studentsLoading } = useStudents();
  const { fees, loading: feesLoading } = useFees();
  const { getBatchName, batches } = useBatches();
  const { coaches, loading: coachesLoading } = useCoaches();
  const { assessments } = useAssessments();
  const { logs: trainingLogs } = useTrainingLogs();

  // Cast coaches to User[] for compatibility with getCoachWorkloads
  const users: User[] = coaches;

  // Show loading spinner while API data loads
  if (studentsLoading || feesLoading || coachesLoading) {
    return (
      <DashboardLayout>
        <div className="hc-dashboard">
          <div className="hc-dashboard-content">
            <div className="card" style={{ padding: 'var(--space-3xl)' }}>
              <div className="animate-pulse flex flex-col" style={{ gap: 'var(--space-md)' }}>
                <div className="h-4 rounded w-3/4" style={{ backgroundColor: 'var(--border-default)' }}></div>
                <div className="h-4 rounded" style={{ backgroundColor: 'var(--border-default)' }}></div>
                <div className="h-4 rounded w-5/6" style={{ backgroundColor: 'var(--border-default)' }}></div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return <HeadCoachDashboardContent
    user={user}
    navigate={navigate}
    students={students}
    fees={fees}
    assessments={assessments}
    trainingLogs={trainingLogs}
    users={users}
    batches={batches}
    getBatchName={getBatchName}
  />;
};

// Separate content component to keep hooks at top level and avoid conditional hook issues
const HeadCoachDashboardContent: React.FC<{
  user: ReturnType<typeof useAuth>['user'];
  navigate: ReturnType<typeof useNavigate>;
  students: ReturnType<typeof useStudents>['students'];
  fees: ReturnType<typeof useFees>['fees'];
  assessments: SkillAssessment[];
  trainingLogs: TrainingLog[];
  users: User[];
  batches: ReturnType<typeof useBatches>['batches'];
  getBatchName: (batchId: string | undefined) => string;
}> = ({ user, navigate, students, fees, assessments, trainingLogs, users, batches, getBatchName }) => {
  // Onboarding checklist hook (Requirements: 5.1, 5.6, 7.1, 7.2, 7.3, 7.4, 7.5)
  const {
    checklist,
    loading: checklistLoading,
    error: checklistError,
    dismiss: dismissChecklist,
    dismissing: checklistDismissing,
  } = useOnboardingChecklist();

  const { subscriptions: marketplaceSubscriptions } = useMarketplaceSubscriptions();

  // Attendance stats and records for the widget (Requirements: 5.1, 5.2, 5.3)
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Session calendar (Requirements: 17.1, 17.2)
  const fourteenDaysAhead = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  }, []);

  const { entries: calendarEntries, loading: calendarLoading } =
    useSessionCalendar({ startDate: todayStr, endDate: fourteenDaysAhead });

  // Calculate overdue fees grouped by student
  const overdueFees = useMemo(() => getOverdueFeesByStudent(fees, students), [fees, students]);

  // Calculate coach workloads
  const coachWorkloads = useMemo(() => getCoachWorkloads(students, users, batches), [students, users, batches]);

  // Generate recent activity feed
  const recentActivities = useMemo(
    () => generateActivityFeed(assessments, trainingLogs, students, 10, getBatchName),
    [assessments, trainingLogs, students, getBatchName]
  );

  // Calculate review status for each student
  const studentReviewStatus = useMemo(() => {
    const statusMap = new Map<string, { isDue: boolean; daysOverdue: number }>();

    students.forEach((student) => {
      const lastAssessment = getLastAssessment(assessments, student.id);
      const lastAssessmentDate = lastAssessment?.recordedAt ?? null;
      const isDue = isDueForAssessment(lastAssessmentDate);
      const overdueDays = daysOverdue(lastAssessmentDate);

      statusMap.set(student.id, { isDue, daysOverdue: overdueDays });
    });

    return statusMap;
  }, [students, assessments]);

  // Get students due for review
  const studentsDueForReview = useMemo(
    () => students.filter((student) => studentReviewStatus.get(student.id)?.isDue ?? false),
    [students, studentReviewStatus]
  );

  // Calculate dashboard statistics
  const stats = useMemo(() => calculateDashboardStats(students), [students]);

  return (
    <DashboardLayout>
      <div className="hc-dashboard">
        <div className="hc-dashboard-content">
          {/* Onboarding Checklist Widget — shown only when data loaded and available */}
          {checklist && !checklistLoading && (
            <OnboardingChecklist
              checklist={checklist}
              dismiss={dismissChecklist}
              dismissing={checklistDismissing}
              error={checklistError}
            />
          )}

          {/* Welcome Section */}
          <div className="hc-welcome">
            <h1 className="hc-welcome-title">Welcome, {user?.name}!</h1>
            <p className="hc-welcome-subtitle">Here's an overview of your coaching operations</p>
          </div>

          {/* Stat Cards Grid */}
          <div className="hc-stats-grid">
            <StatCard
              title="Total Students"
              value={stats.totalStudents}
              label="Active students"
              icon={<StudentIconSvg />}
              variant="info"
              onClick={() => navigate('/students')}
            />
            <StatCard
              title="Marketplace"
              value={marketplaceSubscriptions.length}
              label="Active subscriptions"
              icon={<MarketplaceIconSvg />}
              variant="success"
              onClick={() => navigate('/master-data?tab=marketplace')}
            />
            <StatCard
              title="Batches"
              value={batches.length}
              label="Active batches"
              icon={<BatchIconSvg />}
              variant="warning"
              onClick={() => navigate('/batch-timings')}
            />
            <StatCard
              title="Due for Review"
              value={studentsDueForReview.length}
              label={`${studentsDueForReview.length} student${studentsDueForReview.length !== 1 ? 's' : ''} need assessment`}
              icon={<ReviewIconSvg />}
              variant={studentsDueForReview.length > 0 ? 'danger' : 'success'}
              onClick={() => navigate('/students')}
            />
          </div>

          {/* Dashboard Attendance Block — prominent position above overview grid */}
          <DashboardAttendanceBlock
            calendarEntries={calendarEntries}
            calendarLoading={calendarLoading}
          />

          {/* Progressive Dashboard Features - Phase 6 */}
          <div className="hc-overview">
            <div className="hc-overview-grid">
              <FeeAlerts overdueFees={overdueFees} onViewDetails={() => navigate('/fees')} />
              <CoachWorkload workloads={coachWorkloads} />
            </div>

            <div className="hc-overview-activity">
              <RecentActivity activities={recentActivities} />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Icon SVG Components
const StudentIconSvg: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const MarketplaceIconSvg: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l1.5-5h15L21 9"></path>
    <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"></path>
    <path d="M9 13a3 3 0 0 0 6 0"></path>
  </svg>
);

const BatchIconSvg: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
);

const ReviewIconSvg: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
  </svg>
);

export default HeadCoachDashboard;
