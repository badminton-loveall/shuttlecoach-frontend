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
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
            <h2 className="m-0 text-[24px] font-bold text-slate-900">Student Not Found</h2>
            <p className="m-0 text-sm text-slate-600">The student with ID "{id}" could not be found.</p>
            <button className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-transparent border border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-sm cursor-pointer transition-all self-start" onClick={handleBack}>
              ← Back to Dashboard
            </button>
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
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
            <h2 className="m-0 text-[24px] font-bold text-slate-900">Access Denied</h2>
            <p className="m-0 text-sm text-slate-600">You do not have permission to view this student's profile.</p>
            <p className="text-sm text-slate-600 mt-2">
              This student is not assigned to you. Please contact the Head Coach if you believe this is an error.
            </p>
            <button className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-transparent border border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-sm cursor-pointer transition-all self-start" onClick={handleBack}>
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
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex flex-col gap-6">
        {/* Back Navigation */}
        <button className="inline-flex items-center gap-1 px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-transparent border border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-lg cursor-pointer transition-all self-start mb-4" onClick={handleBack}>
          ← Back to Dashboard
        </button>

        {/* Student Header */}
        <div className="flex items-center gap-5 p-4 bg-white border border-slate-200 rounded-lg mb-8">
          <div className={`w-[72px] h-[72px] rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0 ${
            skillColor === 'blue' ? 'bg-blue-500/15 text-blue-500' :
            skillColor === 'orange' ? 'bg-orange-500/15 text-orange-500' :
            skillColor === 'purple' ? 'bg-purple-500/15 text-purple-500' :
            'bg-primary/15 text-primary'
          }`}>
            {student.profilePhoto ? (
              <img src={student.profilePhoto} alt={student.fullName} />
            ) : (
              <span>{getInitials(student.fullName)}</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-[24px] font-bold text-slate-900 leading-tight m-0">{student.fullName}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              {student.batchId && (
                <span className="text-xs text-slate-600">
                  Batch {student.batchId.split('-')[1]}
                </span>
              )}
              <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                skillColor === 'blue' ? 'bg-blue-500/15 text-blue-500' :
                skillColor === 'orange' ? 'bg-orange-500/15 text-orange-500' :
                skillColor === 'purple' ? 'bg-purple-500/15 text-purple-500' :
                'bg-primary/15 text-primary'
              }`}>
                {student.skillLevel}
              </span>
              {student.baidNumber && (
                <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-slate-700 border border-slate-300" title="BAID Registered">
                  {student.baidNumber}
                </span>
              )}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => navigate(`/training-log/${student.id}`)}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-900 font-semibold rounded-lg transition-colors border border-slate-300"
            >
              Training Log
            </button>
            <button
              onClick={() => navigate(`/curriculum/student/${student.id}`)}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-slate-900 font-semibold rounded-lg transition-colors"
            >
              Manage Curriculum
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex gap-0 border-b border-slate-300" role="tablist" aria-label="Student profile tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={validTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              className={`px-6 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 bg-transparent border-b-2 border-transparent cursor-pointer transition-all ${validTab === tab.id ? 'text-primary border-b-primary' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        <div
          className="p-6 bg-white border border-slate-200 rounded-lg min-h-[300px]"
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
