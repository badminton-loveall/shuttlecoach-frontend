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
import { useBatches } from '../hooks/useBatches';
import { useAssessments } from '../hooks/useAssessments';
import { useAttendanceRecords } from '../hooks/useAttendance';
import { useStudentTrends } from '../hooks/useAnalytics';
import { StudentScheduleCalendar } from '../components/StudentScheduleCalendar';
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

type TabId = 'profile' | 'schedule' | 'training' | 'progress' | 'fees' | 'attendance' | 'skill-analytics';

interface TabConfig {
  id: TabId;
  label: string;
}

const TABS: TabConfig[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'schedule', label: 'Schedule' },
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
  const { getBatchName } = useBatches();
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
                  <span className="text-small">{getBatchName(student.batchId)}</span>
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
            {validTab === 'schedule' && <ScheduleTabContent student={student} refetchStudent={refetch} />}
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
 * Schedule Tab — prominent batch assignment + training calendar
 * Shows the student's current batch with a dropdown to change it,
 * and displays the upcoming training sessions based on the batch's schedule.
 */
const ScheduleTabContent: React.FC<{ student: Student; refetchStudent: () => void }> = ({ student, refetchStudent }) => {
  const [selectedBatchId, setSelectedBatchId] = useState(student.batchId || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const { batches } = useBatches();

  const handleBatchChange = async () => {
    if (selectedBatchId === (student.batchId || '')) return;

    setIsSaving(true);
    setSaveMessage('');
    try {
      await apiClient.patch(`/students/${student.id}`, { batchId: selectedBatchId || null });
      setSaveMessage('Batch updated successfully');
      refetchStudent();
      setTimeout(() => setSaveMessage(''), 3000);
    } catch {
      setSaveMessage('Error updating batch. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-h3" style={{ marginBottom: 'var(--space-lg)', marginTop: 0 }}>Batch & Training Schedule</h2>

      {/* Batch Assignment */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)', flexWrap: 'wrap' }}>
        <div style={{ marginBottom: 0, flex: '1 1 280px' }}>
          <label htmlFor="student-batch" style={{ display: 'block', fontWeight: 600, fontSize: '0.8125rem', color: 'hsl(var(--foreground))', marginBottom: '6px' }}>Assigned Batch</label>
          <select
            id="student-batch"
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            disabled={isSaving}
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: '0.875rem',
              fontWeight: 500,
              border: '1px solid #d1d5db',
              borderRadius: 'var(--radius)',
              backgroundColor: 'transparent',
              color: 'hsl(var(--foreground))',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              paddingRight: '36px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.6 : 1,
            }}
          >
            <option value="">No batch assigned</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>{batch.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleBatchChange}
          disabled={isSaving || selectedBatchId === (student.batchId || '')}
          className="btn btn-primary"
        >
          {isSaving ? 'Saving...' : 'Update Batch'}
        </button>
        {saveMessage && (
          <span className="text-small" style={{ color: saveMessage.includes('Error') ? 'var(--color-danger, #dc2626)' : 'var(--color-success, #16a34a)' }}>
            {saveMessage}
          </span>
        )}
      </div>

      {/* Calendar component */}
      <StudentScheduleCalendar batchId={student.batchId || ''} skillLevel={student.skillLevel} />
    </div>
  );
};

/**
 * Training Tab - displays strengths, weaknesses, coach feedback with API persistence
 */
const TrainingTabContent: React.FC<{ student: Student }> = ({ student }) => {
  const handleSave = async (updates: {
    strengths?: string[];
    weaknesses?: string[];
    coachFeedback?: string;
  }) => {
    await apiClient.patch(`/students/${student.id}`, updates);
  };

  return (
    <TrainingTab
      student={student}
      onSave={handleSave}
    />
  );
};

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-xl)' }}>
        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>Loading attendance…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-xl)' }}>
        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-danger)' }}>{error}</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-xl)' }}>
        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
          No attendance records found for {student.fullName}.
        </p>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Compact summary row — inline stats, not cards */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', flexWrap: 'wrap', padding: 'var(--space-sm) 0' }}>
        <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
          Sessions: <strong style={{ color: 'var(--text-primary)' }}>{totalSessions}</strong>
        </span>
        <span style={{ fontSize: 'var(--font-sm)', color: 'var(--color-success)' }}>
          Present: <strong>{presentCount}</strong>
        </span>
        {lateCount > 0 && (
          <span style={{ fontSize: 'var(--font-sm)', color: 'var(--color-warning)' }}>
            Late: <strong>{lateCount}</strong>
          </span>
        )}
        <span style={{ fontSize: 'var(--font-sm)', color: 'var(--color-danger)' }}>
          Absent: <strong>{absentCount}</strong>
        </span>
        <span style={{
          fontSize: 'var(--font-sm)',
          fontWeight: 600,
          color: Number(attendancePercentage) >= 75 ? 'var(--color-success)' : 'var(--color-danger)',
        }}>
          Rate: {attendancePercentage}%
        </span>
      </div>

      {/* Records Table — primary focus */}
      <div style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: 'var(--surface-card)' }}>
        <table style={{ width: '100%', fontSize: 'var(--font-sm)', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-default)', backgroundColor: 'var(--surface-hover)' }}>
              <th style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'left', fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Date</th>
              <th style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'left', fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</th>
              <th style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'left', fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Leave Type</th>
            </tr>
          </thead>
          <tbody>
            {sortedRecords.map((record: AttendanceRecord) => (
              <tr key={record.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                <td style={{ padding: 'var(--space-sm) var(--space-md)', color: 'var(--text-primary)' }}>
                  {new Date(record.sessionDate).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td style={{ padding: 'var(--space-sm) var(--space-md)' }}>
                  <span style={{
                    display: 'inline-flex',
                    padding: '2px var(--space-sm)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--font-xs)',
                    fontWeight: 600,
                    backgroundColor: record.status === 'PRESENT'
                      ? 'var(--feedback-success-light)'
                      : record.status === 'LATE'
                        ? 'var(--feedback-warning-light)'
                        : 'var(--feedback-danger-light)',
                    color: record.status === 'PRESENT'
                      ? 'var(--color-success-text)'
                      : record.status === 'LATE'
                        ? 'var(--color-warning-text)'
                        : 'var(--color-danger-text)',
                  }}>
                    {record.status}
                  </span>
                </td>
                <td style={{ padding: 'var(--space-sm) var(--space-md)', color: 'var(--text-secondary)' }}>
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
