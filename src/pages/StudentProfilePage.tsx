import React, { useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { PersonalInfoForm } from '../components/PersonalInfoForm';
import { TrainingTab } from '../components/TrainingTab';
import { SkillRadarChart } from '../components/SkillRadarChart';
import { TrendLineChart } from '../components/TrendLineChart';
import { WeaknessTracker } from '../components/WeaknessTracker';
import { SkillHistory } from '../components/SkillHistory';
import { StudentFeeTab } from '../components/StudentFeeTab';
import { useAuth } from '../contexts/AuthContext';
import STUDENTS_DATA from '../data/students.json';
import type { Student, SkillScores, SkillAssessment } from '../types';
import '../styles/pages.css';

/**
 * StudentProfilePage
 * Displays a student's profile with a 3-tab layout: Profile, Training, Progress
 * Accepts student ID as route parameter and maintains active tab state in URL
 * Access Control: Assistant coaches can only view students assigned to them
 * Requirements: 5.6 (3-tab layout), 2.5 (navigate from student card), 3.4, 3.5 (access control)
 */

type TabId = 'profile' | 'training' | 'progress' | 'fees';

interface TabConfig {
  id: TabId;
  label: string;
}

const TABS: TabConfig[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'training', label: 'Training' },
  { id: 'progress', label: 'Progress' },
  { id: 'fees', label: 'Fees' },
];

const DEFAULT_TAB: TabId = 'profile';

// Parse student data from JSON
const parseStudents = (data: unknown): Student[] => {
  const studentArray = data as Array<Record<string, unknown>>;
  return studentArray.map((s) => ({
    ...(s as unknown as Student),
    dateOfBirth: new Date(s.dateOfBirth as string),
    createdAt: new Date(s.createdAt as string),
    updatedAt: new Date(s.updatedAt as string),
  }));
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getSkillLevelColor = (skillLevel: string): string => {
  switch (skillLevel) {
    case 'Beginner':
      return 'blue';
    case 'Intermediate':
      return 'orange';
    case 'Advanced':
      return 'purple';
    case 'Professional':
      return 'green';
    default:
      return 'blue';
  }
};

export const StudentProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get active tab from URL, default to 'profile'
  const activeTab = (searchParams.get('tab') as TabId) || DEFAULT_TAB;

  // Validate tab value
  const validTab = TABS.some((t) => t.id === activeTab) ? activeTab : DEFAULT_TAB;

  // Load and find student by ID
  const students = useMemo(() => parseStudents(STUDENTS_DATA), []);
  const student = useMemo(() => students.find((s) => s.id === id), [students, id]);

  // Handle tab change - update URL query parameter for deep linking
  const handleTabChange = (tabId: TabId) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tabId);
    setSearchParams(newParams, { replace: true });
  };

  // Handle back navigation
  const handleBack = () => {
    navigate('/dashboard');
  };

  // Student not found
  if (!student) {
    return (
      <DashboardLayout>
        <div className="hc-dashboard">
          <div className="hc-dashboard-content">
            <div className="sp-empty-state">
              <h2 className="text-h3">Student Not Found</h2>
              <p className="text-small">The student with ID "{id}" could not be found.</p>
              <button className="btn btn-secondary" onClick={handleBack}>← Back to Dashboard</button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Access Control: Assistant coaches can only view students assigned to them
  const hasAccess = role === 'HEAD_COACH' || student.assignedCoachId === user?.id;

  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="hc-dashboard">
          <div className="hc-dashboard-content">
            <div className="sp-empty-state">
              <h2 className="text-h3">Access Denied</h2>
              <p className="text-small">You do not have permission to view this student's profile.</p>
              <p className="text-small">This student is not assigned to you. Please contact the Head Coach if you believe this is an error.</p>
              <button className="btn btn-secondary" onClick={handleBack}>← Back to Dashboard</button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const skillColor = getSkillLevelColor(student.skillLevel);

  return (
    <DashboardLayout>
      <div className="hc-dashboard">
        <div className="hc-dashboard-content">

          {/* Back Navigation */}
          <button className="btn btn-secondary sp-back-btn" onClick={handleBack}>
            ← Back to Dashboard
          </button>

          {/* Student Header */}
          <div className="sp-header card">
            <div className={`sp-avatar sp-avatar--${skillColor}`}>
              {student.profilePhoto ? (
                <img src={student.profilePhoto} alt={student.fullName} />
              ) : (
                <span>{getInitials(student.fullName)}</span>
              )}
            </div>
            <div className="sp-header-info">
              <h1 className="sp-student-name">{student.fullName}</h1>
              <div className="sp-header-meta">
                {student.batchId && (
                  <span className="text-small">Batch {student.batchId.split('-')[1]}</span>
                )}
                <span className={`badge badge-${skillColor === 'blue' ? 'info' : skillColor === 'orange' ? 'warning' : skillColor === 'green' ? 'success' : 'primary'}`}>
                  {student.skillLevel}
                </span>
                {student.baidNumber && (
                  <span className="badge badge-secondary" title="BAID Registered">
                    {student.baidNumber}
                  </span>
                )}
              </div>
            </div>
            <div className="sp-header-actions">
              <button className="btn btn-secondary" onClick={() => navigate(`/training-log/${student.id}`)}>
                Training Log
              </button>
              <button className="btn btn-primary" onClick={() => navigate(`/curriculum/student/${student.id}`)}>
                Manage Curriculum
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="sp-tab-nav" role="tablist" aria-label="Student profile tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={validTab === tab.id}
                aria-controls={`tabpanel-${tab.id}`}
                className={`sp-tab${validTab === tab.id ? ' sp-tab--active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Tab Content */}
          <div
            className="card sp-tab-content"
            role="tabpanel"
            id={`tabpanel-${validTab}`}
            aria-labelledby={`tab-${validTab}`}
          >
            {validTab === 'profile' && <ProfileTabContent student={student} />}
            {validTab === 'training' && <TrainingTabContent student={student} />}
            {validTab === 'progress' && <ProgressTabContent student={student} />}
            {validTab === 'fees' && <FeesTabContent student={student} />}
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

/**
 * Profile Tab - displays comprehensive personal information form
 * Uses PersonalInfoForm component for read/edit display of student data
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
const ProfileTabContent: React.FC<{ student: Student }> = ({ student }) => (
  <PersonalInfoForm student={student} />
);

/**
 * Training Tab - displays strengths, weaknesses, and coach feedback
 * Coaches can add/remove tags and edit feedback; students see read-only view
 * Requirements: 5.8, 5.9
 */
const TrainingTabContent: React.FC<{ student: Student }> = ({ student }) => (
  <TrainingTab student={student} />
);

/**
 * Progress Tab - skill assessment radar chart and progress tracking
 * Displays a 6-axis radar chart with category averages for the current cycle.
 * Requirements: 8.1, 8.3, 8.4, 8.5, 8.6
 */
const ProgressTabContent: React.FC<{ student: Student }> = ({ student }) => {
  // Assessment data will be loaded from persistence in a future task.
  // For now, use null/empty to render charts with empty state.
  const scores: SkillScores | null = null;
  const historicalAssessments: SkillAssessment[] = [];

  // Current and previous assessments for weakness tracking
  const currentAssessment: SkillAssessment | null =
    historicalAssessments.length > 0
      ? historicalAssessments[historicalAssessments.length - 1]
      : null;
  const previousAssessment: SkillAssessment | null =
    historicalAssessments.length > 1
      ? historicalAssessments[historicalAssessments.length - 2]
      : null;

  return (
    <div className="progress-tab-content">
      <h2 className="text-lg font-semibold text-slate-900 mb-5 m-0">Progress & Assessments</h2>
      <p className="progress-subtitle">
        Skill progress for <strong>{student.fullName}</strong> — {student.skillLevel}
      </p>
      <SkillRadarChart scores={scores} />
      <TrendLineChart assessments={historicalAssessments} />
      <WeaknessTracker
        currentAssessment={currentAssessment}
        previousAssessment={previousAssessment}
      />
      <SkillHistory assessments={historicalAssessments} />
    </div>
  );
};

/**
 * Fees Tab - manage student fees, payments, and payment status
 * Displays fee records, statistics, and allows creating/editing/deleting fees
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */
const FeesTabContent: React.FC<{ student: Student }> = ({ student }) => (
  <StudentFeeTab student={student} />
);

export default StudentProfilePage;
