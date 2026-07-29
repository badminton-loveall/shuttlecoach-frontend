import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import StatCard from '../components/StatCard';
import StudentGrid from '../components/StudentGrid';
import FeeAlerts from '../components/FeeAlerts';
import CoachWorkload from '../components/CoachWorkload';
import RecentActivity from '../components/RecentActivity';
import { useAuth } from '../contexts/AuthContext';
import { useStudents } from '../hooks/useStudents';
import { useFees } from '../hooks/useFees';
import { calculateDashboardStats } from '../utils/dashboardUtils';
import { isDueForAssessment, daysOverdue, getLastAssessment } from '../utils/reviewUtils';
import { getOverdueFeesByStudent } from '../utils/feeUtils';
import { generateActivityFeed, getCoachWorkloads } from '../utils/activityUtils';
import USERS_DATA from '../data/users.json';
import SKILL_ASSESSMENTS_DATA from '../data/skillAssessments.json';
import TRAINING_LOGS_DATA from '../data/trainingLogs.json';
import type { SkillAssessment, TrainingLog, User } from '../types';
import '../styles/pages.css';

/**
 * HeadCoachDashboard Page
 * Displays head coach dashboard with welcome message, stat cards, and student grid
 * Shows: total students, BAID-registered count, batch count, average progress
 * Includes search and filter functionality with URL query parameter persistence
 * Pure CSS implementation using design tokens
 */

// Parse skill assessments with proper date types
const parseAssessments = (data: unknown): SkillAssessment[] => {
  const assessmentArray = data as Array<Record<string, unknown>>;
  return assessmentArray.map((a) => ({
    ...(a as unknown as SkillAssessment),
    recordedAt: new Date(a.recordedAt as string),
  }));
};

// Parse training logs with proper date types
const parseTrainingLogs = (data: unknown): TrainingLog[] => {
  const logArray = data as Array<Record<string, unknown>>;
  return logArray.map((l) => ({
    ...(l as unknown as TrainingLog),
    recordedAt: new Date(l.recordedAt as string),
  }));
};

// Parse users with proper date types
const parseUsers = (data: unknown): User[] => {
  const userArray = data as Array<Record<string, unknown>>;
  return userArray.map((u) => ({
    ...(u as unknown as User),
    createdAt: new Date(u.createdAt as string),
    lastActive: new Date(u.lastActive as string),
  }));
};

export const HeadCoachDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Live data from API
  const { students, loading: studentsLoading } = useStudents();
  const { fees, loading: feesLoading } = useFees();

  // Static JSON data (no API hooks yet for these)
  const assessments = useMemo(() => parseAssessments(SKILL_ASSESSMENTS_DATA), []);
  const trainingLogs = useMemo(() => parseTrainingLogs(TRAINING_LOGS_DATA), []);
  const users = useMemo(() => parseUsers(USERS_DATA), []);

  // Show loading spinner while API data loads
  if (studentsLoading || feesLoading) {
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
}> = ({ user, navigate, students, fees, assessments, trainingLogs, users }) => {
  // Calculate overdue fees grouped by student
  const overdueFees = useMemo(() => getOverdueFeesByStudent(fees, students), [fees, students]);

  // Calculate coach workloads
  const coachWorkloads = useMemo(() => getCoachWorkloads(students, users), [students, users]);

  // Generate recent activity feed
  const recentActivities = useMemo(
    () => generateActivityFeed(assessments, trainingLogs, students, 10),
    [assessments, trainingLogs, students]
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

  // Handle student card click
  const handleStudentClick = (studentId: string) => {
    navigate(`/student/${studentId}`);
  };

  return (
    <DashboardLayout>
      <div className="hc-dashboard">
        <div className="hc-dashboard-content">
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
            />
            <StatCard
              title="BAID Registered"
              value={`${stats.baidRegistered}/${stats.totalStudents}`}
              label={`${stats.baidPercentage}% registered`}
              icon={<BaidIconSvg />}
              variant="success"
            />
            <StatCard
              title="Batches"
              value={stats.batchCount}
              label="Active batches"
              icon={<BatchIconSvg />}
              variant="warning"
            />
            <StatCard
              title="Due for Review"
              value={studentsDueForReview.length}
              label={`${studentsDueForReview.length} student${studentsDueForReview.length !== 1 ? 's' : ''} need assessment`}
              icon={<ReviewIconSvg />}
              variant={studentsDueForReview.length > 0 ? 'danger' : 'success'}
            />
          </div>

          {/* Students Due for Review Section */}
          {studentsDueForReview.length > 0 && (
            <>
              <div className="hc-review-section-header">
                <h2 className="hc-review-title">
                  Students Due for Review ({studentsDueForReview.length})
                </h2>
                <p className="hc-review-subtitle">
                  Students who need bi-monthly skill assessment (60+ days since last assessment)
                </p>
              </div>

              <StudentGrid
                students={studentsDueForReview}
                onStudentClick={handleStudentClick}
                studentReviewStatus={studentReviewStatus}
              />
            </>
          )}

          {/* Progressive Dashboard Features - Phase 6 */}
          <div className="hc-overview">
            <h2 className="hc-overview-title">Dashboard Overview</h2>
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

const BaidIconSvg: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"></path>
    <path d="M10 17l-4-4m4-4l4 4"></path>
    <path d="M10 9l4 4m-4 4l-4-4"></path>
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
