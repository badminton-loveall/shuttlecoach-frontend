import React from 'react';
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
import { useStudent } from '../hooks/useStudent';
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
  const validTab = TABS.some((t) => t.id === activeTab) ? activeTab : DEFAULT_TAB;

  // Fetch single student directly by ID
  const { student, loading, error } = useStudent(id);

  // Handle tab change - update URL query parameter for deep linking
  const handleTabChange = (tabId: TabId) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tabId);
    setSearchParams(newParams, { replace: true });
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="page-container">
          <div className="section-stack">
            <div className="card">
              <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <div className="h-4 w-3/4" style={{ backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-sm)' }}></div>
                <div className="h-4" style={{ backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-sm)' }}></div>
                <div className="h-4 w-5/6" style={{ backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-sm)' }}></div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Student not found
  if (!loading && !student && !error) {
    return (
      <DashboardLayout>
        <div className="page-container">
          <div className="section-stack">
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

  // Error state
  if (error && !student) {
    return (
      <DashboardLayout>
        <div className="page-container">
          <div className="section-stack">
            <div className="sp-empty-state">
              <h2 className="text-h3">Error Loading Student</h2>
              <p className="text-small">{error}</p>
              <button className="btn btn-secondary" onClick={handleBack}>← Back to Dashboard</button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // If student is still null at this point (shouldn't happen after above guards), bail out
  if (!student) {
    return null;
  }

  // Access Control: Assistant coaches can only view students assigned to them
  const hasAccess = role === 'HEAD_COACH' || student.assignedCoachId === user?.id;

  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="page-container">
          <div className="section-stack">
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
      <div className="page-container">
        <div className="section-stack">

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
 */
const ProfileTabContent: React.FC<{ student: Student }> = ({ student }) => (
  <PersonalInfoForm student={student} />
);

/**
 * Training Tab - displays strengths, weaknesses, and coach feedback
 */
const TrainingTabContent: React.FC<{ student: Student }> = ({ student }) => (
  <TrainingTab student={student} />
);

/**
 * Progress Tab - skill assessment radar chart and progress tracking
 */
const ProgressTabContent: React.FC<{ student: Student }> = ({ student }) => {
  const scores: SkillScores | null = null;
  const historicalAssessments: SkillAssessment[] = [];

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
      <h2 className="text-h3" style={{ marginBottom: 'var(--space-lg)', marginTop: 0 }}>Progress & Assessments</h2>
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
 */
const FeesTabContent: React.FC<{ student: Student }> = ({ student }) => (
  <StudentFeeTab student={student} />
);

export default StudentProfilePage;
