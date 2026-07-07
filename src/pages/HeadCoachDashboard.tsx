import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import StatCard from '../components/StatCard';
import StudentGrid from '../components/StudentGrid';
import FeeAlerts from '../components/FeeAlerts';
import CoachWorkload from '../components/CoachWorkload';
import RecentActivity from '../components/RecentActivity';
import { useAuth } from '../contexts/AuthContext';
import { calculateDashboardStats } from '../utils/dashboardUtils';
import { isDueForAssessment, daysOverdue, getLastAssessment } from '../utils/reviewUtils';
import { getOverdueFeesByStudent } from '../utils/feeUtils';
import { generateActivityFeed, getCoachWorkloads } from '../utils/activityUtils';
import STUDENTS_DATA from '../data/students.json';
import USERS_DATA from '../data/users.json';
import SKILL_ASSESSMENTS_DATA from '../data/skillAssessments.json';
import FEES_DATA from '../data/fees.json';
import TRAINING_LOGS_DATA from '../data/trainingLogs.json';
import type { Student, SkillAssessment, FeeRecord, TrainingLog, User } from '../types';
import '../styles/pages.css';

/**
 * HeadCoachDashboard Page
 * Displays head coach dashboard with welcome message, stat cards, and student grid
 * Shows: total students, BAID-registered count, batch count, average progress
 * Includes search and filter functionality with URL query parameter persistence
 * Pure CSS implementation using design tokens
 */

// Map raw JSON data to proper Student type with parsed dates
const parseStudents = (data: unknown): Student[] => {
  const studentArray = data as Array<Record<string, unknown>>;
  return studentArray.map((s) => ({
    ...(s as unknown as Student),
    dateOfBirth: new Date(s.dateOfBirth as string),
    createdAt: new Date(s.createdAt as string),
    updatedAt: new Date(s.updatedAt as string),
  }));
};

// Parse skill assessments with proper date types
const parseAssessments = (data: unknown): SkillAssessment[] => {
  const assessmentArray = data as Array<Record<string, unknown>>;
  return assessmentArray.map((a) => ({
    ...(a as unknown as SkillAssessment),
    recordedAt: new Date(a.recordedAt as string),
  }));
};

// Parse fees with proper date types
const parseFees = (data: unknown): FeeRecord[] => {
  const feeArray = data as Array<Record<string, unknown>>;
  return feeArray.map((f) => ({
    ...(f as unknown as FeeRecord),
    dueDate: new Date(f.dueDate as string),
    paidDate: f.paidDate ? new Date(f.paidDate as string) : undefined,
    createdAt: new Date(f.createdAt as string),
    updatedAt: new Date(f.updatedAt as string),
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

  // Parse and memoize students data
  const students = useMemo(() => parseStudents(STUDENTS_DATA), []);
  
  // Parse and memoize skill assessments data
  const assessments = useMemo(() => parseAssessments(SKILL_ASSESSMENTS_DATA), []);

  // Parse and memoize fees data
  const fees = useMemo(() => parseFees(FEES_DATA), []);

  // Parse and memoize training logs data
  const trainingLogs = useMemo(() => parseTrainingLogs(TRAINING_LOGS_DATA), []);

  // Parse and memoize users data
  const users = useMemo(() => parseUsers(USERS_DATA), []);

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
      
      statusMap.set(student.id, {
        isDue,
        daysOverdue: overdueDays,
      });
    });
    
    return statusMap;
  }, [students, assessments]);

  // Get students due for review
  const studentsDueForReview = useMemo(() => {
    return students.filter((student) => {
      const status = studentReviewStatus.get(student.id);
      return status?.isDue ?? false;
    });
  }, [students, studentReviewStatus]);

  // Calculate dashboard statistics (always based on full dataset)
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
          {/* Total Students */}
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            label="Active students"
            icon={<StudentIconSvg />}
            variant="info"
          />

          {/* BAID Registered */}
          <StatCard
            title="BAID Registered"
            value={`${stats.baidRegistered}/${stats.totalStudents}`}
            label={`${stats.baidPercentage}% registered`}
            icon={<BaidIconSvg />}
            variant="success"
          />

          {/* Batch Count */}
          <StatCard
            title="Batches"
            value={stats.batchCount}
            label="Active batches"
            icon={<BatchIconSvg />}
            variant="warning"
          />

          {/* Due for Review Count */}
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
            {/* Fee Alerts */}
            <FeeAlerts 
              overdueFees={overdueFees} 
              onViewDetails={() => navigate('/fees')}
            />

            {/* Coach Workload */}
            <CoachWorkload workloads={coachWorkloads} />
          </div>

          {/* Recent Activity Feed - Full Width */}
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
