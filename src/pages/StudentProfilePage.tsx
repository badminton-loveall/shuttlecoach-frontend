import React, { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { PersonalInfoForm } from '../components/PersonalInfoForm';
import { TrainingTab } from '../components/TrainingTab';
import { SkillRadarChart } from '../components/SkillRadarChart';
import { TrendLineChart } from '../components/TrendLineChart';
import { WeaknessTracker } from '../components/WeaknessTracker';
import { SkillHistory } from '../components/SkillHistory';
import { StudentFeeTab } from '../components/StudentFeeTab';
import { SkillProgressionTracker } from '../components/SkillProgressionTracker';
import { SkillTrendChart } from '../components/SkillTrendChart';
import { EditStudentModal } from '../components/EditStudentModal';
import { ArchiveConfirmDialog } from '../components/ArchiveConfirmDialog';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useStudent } from '../hooks/useStudent';
import { useAssessments } from '../hooks/useAssessments';
import { useAttendanceRecords } from '../hooks/useAttendance';
import { useStudentTrends } from '../hooks/useAnalytics';
import { deriveProgressState } from '../utils/progressState';
import { canEditStudent, canArchiveStudent, classifyError } from '../utils/studentProfileUtils';
import apiClient from '../utils/apiClient';
import type { Student, AttendanceRecord } from '../types';
import '../styles/pages.css';

/**
 * StudentProfilePage
 * Displays a student's profile with a 3-tab layout: Profile, Training, Progress
 * Accepts student ID as route parameter and maintains active tab state in URL
 * Access Control: Assistant coaches can only view students assigned to them
 * Requirements: 5.6 (3-tab layout), 2.5 (navigate from student card), 3.4, 3.5 (access control)
 */

type TabId = 'profile' | 'training' | 'progress' | 'fees' | 'attendance' | 'skill-analytics';

interface TabConfig {
  id: TabId;
  label: string;
}

const TABS: TabConfig[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'training', label: 'Training' },
  { id: 'progress', label: 'Progress' },
  { id: 'fees', label: 'Fees' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'skill-analytics', label: 'Skill Analytics' },
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
  const { student, loading, error, refetch } = useStudent(id);
  const { showToast } = useToast();

  // Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  // Handler for successful edit - refetch student data, show toast, close modal
  const handleEditSuccess = () => {
    refetch();
    showToast({ message: 'Student updated successfully', type: 'success' });
    setIsEditModalOpen(false);
  };

  // Handler for archive confirmation
  const handleArchiveConfirm = async () => {
    setIsArchiving(true);
    try {
      await apiClient.patch(`/students/${id}`, { status: 'archived' });
      showToast({ message: 'Student archived successfully', type: 'success' });
      navigate('/dashboard');
    } catch (err) {
      const classified = classifyError(err);
      showToast({ message: classified.message, type: 'error' });
      setIsArchiveDialogOpen(false);
    } finally {
      setIsArchiving(false);
    }
  };

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

  // Permission derivation for edit and archive actions
  const canEdit = canEditStudent(role || '', user?.id || '', student);
  const canArchive = canArchiveStudent(role || '');

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
              {canEdit && (
                <button className="btn btn-secondary" onClick={() => setIsEditModalOpen(true)}>
                  Edit
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => navigate(`/training-log/${student.id}`)}>
                Training Log
              </button>
              <button className="btn btn-primary" onClick={() => navigate(`/curriculum/student/${student.id}`)}>
                Manage Curriculum
              </button>
              {canArchive && (
                <button className="btn btn-secondary text-red-600 hover:text-red-700 border-red-300 hover:border-red-400" onClick={() => setIsArchiveDialogOpen(true)}>
                  Archive
                </button>
              )}
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
            {validTab === 'attendance' && <AttendanceTabContent student={student} />}
            {validTab === 'skill-analytics' && <SkillAnalyticsTabContent student={student} />}
          </div>

        </div>
      </div>

      {/* Edit Student Modal */}
      {student && (
        <EditStudentModal
          isOpen={isEditModalOpen}
          student={student}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Archive Confirmation Dialog */}
      {student && (
        <ArchiveConfirmDialog
          isOpen={isArchiveDialogOpen}
          studentName={student.fullName}
          onConfirm={handleArchiveConfirm}
          onCancel={() => setIsArchiveDialogOpen(false)}
          isLoading={isArchiving}
        />
      )}
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
 * Wired to useAssessments hook with deriveProgressState utility
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9
 */
const ProgressTabContent: React.FC<{ student: Student }> = ({ student }) => {
  const { assessments, loading, error } = useAssessments({ studentId: student.id });

  // Derive current and previous assessments from sorted data
  const { currentScores, currentAssessment, previousAssessment } = deriveProgressState(assessments);

  // Historical assessments sorted ascending (oldest first) for trend chart
  const historicalAssessments = [...assessments].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );

  if (loading) {
    return (
      <div className="progress-tab-content flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading assessments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="progress-tab-content flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (assessments.length === 0) {
    return (
      <div className="progress-tab-content flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">No assessments recorded yet for {student.fullName}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="progress-tab-content">
      <SkillProgressionTracker studentId={student.id} />
      <hr className="my-8" style={{ borderColor: 'var(--border-default)' }} />
      <h2 className="text-h3" style={{ marginBottom: 'var(--space-lg)', marginTop: 0 }}>Progress & Assessments</h2>
      <p className="progress-subtitle">
        Skill progress for <strong>{student.fullName}</strong> — {student.skillLevel}
      </p>
      <SkillRadarChart scores={currentScores} />
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

/**
 * Attendance Tab - displays attendance history for the student
 * Uses useAttendanceRecords hook filtered by studentId
 * Requirements: 13.5
 */
const AttendanceTabContent: React.FC<{ student: Student }> = ({ student }) => {
  const { records, loading, error } = useAttendanceRecords({ studentId: student.id });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading attendance history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No attendance records found for {student.fullName}.
          </p>
        </div>
      </div>
    );
  }

  // Sort records by date descending (most recent first)
  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()
  );

  // Compute summary stats
  const totalSessions = records.length;
  const presentCount = records.filter((r: AttendanceRecord) => r.status === 'PRESENT').length;
  const lateCount = records.filter((r: AttendanceRecord) => r.status === 'LATE').length;
  const absentCount = records.filter((r: AttendanceRecord) => r.status === 'ABSENT').length;
  const attendancePercentage = totalSessions > 0
    ? ((presentCount + lateCount) / totalSessions * 100).toFixed(1)
    : '0.0';

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-100 mb-4">Attendance History</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg bg-gray-700/50 p-4 text-center">
          <p className="text-2xl font-bold text-gray-100">{totalSessions}</p>
          <p className="text-xs text-gray-400">Total Sessions</p>
        </div>
        <div className="rounded-lg bg-green-900/30 p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{presentCount}</p>
          <p className="text-xs text-gray-400">Present</p>
        </div>
        <div className="rounded-lg bg-yellow-900/30 p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{lateCount}</p>
          <p className="text-xs text-gray-400">Late</p>
        </div>
        <div className="rounded-lg bg-red-900/30 p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{absentCount}</p>
          <p className="text-xs text-gray-400">Absent</p>
        </div>
      </div>

      {/* Attendance Percentage */}
      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm text-gray-400">Attendance Rate:</span>
        <span className={`text-lg font-semibold ${
          Number(attendancePercentage) >= 75 ? 'text-green-400' : 'text-red-400'
        }`}>
          {attendancePercentage}%
        </span>
        {Number(attendancePercentage) < 75 && (
          <span className="text-xs text-red-400 bg-red-900/30 px-2 py-0.5 rounded">Below 75%</span>
        )}
      </div>

      {/* Records Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase text-gray-400 border-b border-gray-700">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Leave Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {sortedRecords.map((record: AttendanceRecord) => (
              <tr key={record.id} className="hover:bg-gray-700/30">
                <td className="px-4 py-3 text-gray-200">
                  {new Date(record.sessionDate).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    record.status === 'PRESENT'
                      ? 'bg-green-900/40 text-green-400'
                      : record.status === 'LATE'
                        ? 'bg-yellow-900/40 text-yellow-400'
                        : 'bg-red-900/40 text-red-400'
                  }`}>
                    {record.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400">
                  {record.leaveType
                    ? record.leaveType.replace('_', ' ')
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * Skill Analytics Tab - displays training effectiveness trends using SkillTrendChart
 * Uses useStudentTrends hook to fetch attendance vs skill improvement data
 * Requirements: 13.6
 */
const SkillAnalyticsTabContent: React.FC<{ student: Student }> = ({ student }) => {
  const { data: trendReport, loading, error } = useStudentTrends({ studentId: student.id });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading skill analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-100 mb-4">Skill Improvement Analytics</h2>
      <p className="text-sm text-gray-400 mb-6">
        Tracks the relationship between attendance consistency and skill progression for{' '}
        <span className="text-gray-200 font-medium">{student.fullName}</span> across training cycles.
      </p>
      <SkillTrendChart report={trendReport} />
    </div>
  );
};

export default StudentProfilePage;
