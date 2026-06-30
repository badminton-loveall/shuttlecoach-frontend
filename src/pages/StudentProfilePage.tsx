import React, { useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { PersonalInfoForm } from '../components/PersonalInfoForm';
import { TrainingTab } from '../components/TrainingTab';
import { SkillRadarChart } from '../components/SkillRadarChart';
import { TrendLineChart } from '../components/TrendLineChart';
import { WeaknessTracker } from '../components/WeaknessTracker';
import { SkillHistory } from '../components/SkillHistory';
import STUDENTS_DATA from '../data/students.json';
import type { Student, SkillScores, SkillAssessment } from '../types';
import './StudentProfilePage.css';

/**
 * StudentProfilePage
 * Displays a student's profile with a 3-tab layout: Profile, Training, Progress
 * Accepts student ID as route parameter and maintains active tab state in URL
 * Requirements: 5.6 (3-tab layout), 2.5 (navigate from student card)
 */

type TabId = 'profile' | 'training' | 'progress';

interface TabConfig {
  id: TabId;
  label: string;
}

const TABS: TabConfig[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'training', label: 'Training' },
  { id: 'progress', label: 'Progress' },
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
        <div className="student-profile-page">
          <div className="profile-not-found">
            <h2>Student Not Found</h2>
            <p>The student with ID "{id}" could not be found.</p>
            <button className="back-button" onClick={handleBack}>
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const skillColor = getSkillLevelColor(student.skillLevel);

  return (
    <DashboardLayout>
      <div className="student-profile-page">
        {/* Back Navigation */}
        <button className="back-button" onClick={handleBack}>
          ← Back to Dashboard
        </button>

        {/* Student Header */}
        <div className="profile-header">
          <div className={`profile-avatar profile-avatar-${skillColor}`}>
            {student.profilePhoto ? (
              <img src={student.profilePhoto} alt={student.fullName} />
            ) : (
              <span className="profile-avatar-initials">{getInitials(student.fullName)}</span>
            )}
          </div>
          <div className="profile-header-info">
            <h1 className="profile-name">{student.fullName}</h1>
            <div className="profile-meta">
              {student.batchId && (
                <span className="profile-meta-item">
                  Batch {student.batchId.split('-')[1]}
                </span>
              )}
              <span className={`profile-skill-badge profile-skill-badge-${skillColor}`}>
                {student.skillLevel}
              </span>
              {student.baidNumber && (
                <span className="profile-baid-badge" title="BAID Registered">
                  {student.baidNumber}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="profile-tabs" role="tablist" aria-label="Student profile tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={validTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              className={`profile-tab ${validTab === tab.id ? 'profile-tab-active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        <div
          className="profile-tab-content"
          role="tabpanel"
          id={`tabpanel-${validTab}`}
          aria-labelledby={`tab-${validTab}`}
        >
          {validTab === 'profile' && <ProfileTabContent student={student} />}
          {validTab === 'training' && <TrainingTabContent student={student} />}
          {validTab === 'progress' && <ProgressTabContent student={student} />}
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
      <h2 className="tab-section-title">Progress & Assessments</h2>
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

export default StudentProfilePage;
