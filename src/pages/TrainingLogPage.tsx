import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { useTrainingLogs } from '../hooks/useTrainingLogs';
import { useStudent } from '../hooks/useStudent';
import { sortTrainingLogs } from '../utils/sortTrainingLogs';
import { generateCycleKey } from '../utils/skillUtils';
import { formatAuditTimestamp } from '../utils/dateUtils';

/**
 * TrainingLogPage
 * Allows Head Coach and assigned Assistant Coach to record weekly training session notes
 * Displays past training logs in reverse chronological order
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */

const TrainingLogPage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const { student, loading: studentLoading, error: studentError } = useStudent(studentId);
  const { logs, loading: logsLoading, error: logsError, createLog } = useTrainingLogs({ studentId });

  const [selectedWeek, setSelectedWeek] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>(1);
  const [sessionNotes, setSessionNotes] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [currentCycleKey] = useState(generateCycleKey());

  // Check permission: redirect if assistant coach is not assigned
  React.useEffect(() => {
    if (!studentId) {
      navigate('/students');
      return;
    }
    if (!studentLoading && !student && !studentError) {
      navigate('/students');
    }
    if (student && role === 'ASSISTANT_COACH' && student.assignedCoachId !== user?.id) {
      navigate('/access-denied');
    }
  }, [studentId, student, studentLoading, studentError, role, user, navigate]);

  const loading = studentLoading || logsLoading;
  const error = studentError || logsError;

  const handleWeekChange = (week: number) => {
    setSelectedWeek(week as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8);
  };

  const handleSaveLog = async () => {
    if (!student || !user) {
      setSaveMessage('Error: Missing student or user information');
      return;
    }

    if (!sessionNotes.trim()) {
      setSaveMessage('Please enter session notes before saving');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    setIsSaving(true);
    setSaveMessage('');

    try {
      await createLog({
        studentId: student.id,
        weekNumber: selectedWeek,
        cycleKey: currentCycleKey,
        sessionNotes: sessionNotes.trim(),
        isCompleted,
        recordedBy: user.name,
      });

      setSaveMessage('Training log saved successfully!');
      setSessionNotes('');
      setIsCompleted(false);
      setTimeout(() => setSaveMessage(''), 4000);
    } catch (err: unknown) {
      // Show the actual API error message if available
      const apiError = err as { response?: { data?: { details?: Array<{ message: string }>, error?: string } } };
      const details = apiError?.response?.data?.details;
      if (details && Array.isArray(details) && details.length > 0) {
        setSaveMessage(details.map(d => d.message).join('. '));
      } else {
        const message = apiError?.response?.data?.error || 'Error saving training log. Please try again.';
        setSaveMessage(message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center" style={{ gap: 'var(--space-md)' }}>
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <span style={{ color: 'var(--text-secondary)' }}>Loading training logs...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center" style={{ padding: 'var(--space-2xl)' }}>
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: 'var(--color-danger-text)', marginBottom: 'var(--space-md)' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <p className="font-semibold" style={{ color: 'var(--color-danger-text)', marginBottom: 'var(--space-sm)' }}>
              {error}
            </p>
            <button
              onClick={() => navigate(-1)}
              className="text-sm hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
            >
              ← Go back
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div style={{ color: 'var(--text-secondary)' }}>Student not found.</div>
        </div>
      </DashboardLayout>
    );
  }

  // Sort logs newest first using the utility
  const sortedLogs = sortTrainingLogs(logs);

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="section-stack">
          {/* Page Header */}
          <div>
            <button
              onClick={() => navigate(`/student/${studentId}`)}
              className="flex items-center text-sm hover:opacity-80"
              style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)', gap: 'var(--space-xs)' }}
            >
              <span>←</span> Back to Student Profile
            </button>
            <h1 className="text-[36px] font-bold leading-tight" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>
              Training Log - {student.fullName}
            </h1>
            <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
              Record weekly training session notes and track progress
            </p>
          </div>

          {/* Current Cycle Info */}
          <div className="bg-primary/10 border border-primary/20" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-md)' }}>
            <div className="flex items-center" style={{ gap: 'var(--space-xs)' }}>
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                Current Cycle: {currentCycleKey}
              </span>
            </div>
          </div>

          {/* Training Log Entry Form */}
          <div className="shadow-sm" style={{ backgroundColor: 'var(--surface-card)', borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)' }}>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
              Record Training Session
            </h2>

            {/* Week Selector */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <label className="block text-sm font-semibold" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>
                Select Week (1-8)
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8" style={{ gap: 'var(--space-sm)' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((week) => (
                  <button
                    key={week}
                    onClick={() => handleWeekChange(week)}
                    className={`font-semibold transition-colors ${
                      selectedWeek === week
                        ? 'bg-primary'
                        : 'hover:opacity-80'
                    }`}
                    style={{
                      padding: 'var(--space-sm) var(--space-md)',
                      borderRadius: 'var(--radius-md)',
                      color: selectedWeek === week ? 'var(--text-primary)' : 'var(--text-secondary)',
                      backgroundColor: selectedWeek === week ? undefined : 'var(--surface-hover)',
                    }}
                  >
                    {week}
                  </button>
                ))}
              </div>
            </div>

            {/* Session Notes */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <label
                htmlFor="sessionNotes"
                className="block text-sm font-semibold"
                style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}
              >
                Session Notes
              </label>
              <textarea
                id="sessionNotes"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Describe the training session, student performance, areas of improvement, homework assigned, etc."
                rows={6}
                className="w-full focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                style={{
                  padding: 'var(--space-sm) var(--space-md)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--surface-card)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {/* Mark Completed Checkbox */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <label className="flex items-center cursor-pointer" style={{ gap: 'var(--space-sm)' }}>
                <input
                  type="checkbox"
                  checked={isCompleted}
                  onChange={(e) => setIsCompleted(e.target.checked)}
                  className="w-5 h-5 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
                  style={{ borderRadius: 'var(--radius-sm)' }}
                />
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Mark week as completed
                </span>
              </label>
            </div>

            {/* Save Button */}
            <div className="flex items-center" style={{ gap: 'var(--space-md)' }}>
              <button
                onClick={handleSaveLog}
                disabled={isSaving}
                className="bg-primary hover:bg-primary/90 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                style={{ padding: 'var(--space-sm) var(--space-lg)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
              >
                {isSaving ? 'Saving...' : 'Save Training Log'}
              </button>

              {/* Coach Info */}
              {user && (
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Recording as: <strong style={{ color: 'var(--text-primary)' }}>{user.name}</strong>
                </div>
              )}
            </div>

            {/* Save Message */}
            {saveMessage && (
              <div
                style={{
                  marginTop: 'var(--space-md)',
                  padding: 'var(--space-sm)',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${saveMessage.includes('Error') || saveMessage.includes('Please') ? 'var(--color-danger-light)' : 'var(--color-success-light)'}`,
                  backgroundColor: saveMessage.includes('Error') || saveMessage.includes('Please') ? 'var(--feedback-danger-light)' : 'var(--feedback-success-light)',
                  color: saveMessage.includes('Error') || saveMessage.includes('Please') ? 'var(--color-danger-text)' : 'var(--color-success-text)',
                }}
              >
                {saveMessage}
              </div>
            )}
          </div>

          {/* Past Training Logs */}
          <div className="shadow-sm" style={{ backgroundColor: 'var(--surface-card)', borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)' }}>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
              Training History
            </h2>

            {sortedLogs.length === 0 ? (
              <div className="text-center" style={{ padding: 'var(--space-2xl) 0' }}>
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: 'var(--border-default)', marginBottom: 'var(--space-md)' }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p style={{ color: 'var(--text-tertiary)' }}>
                  No training logs recorded yet. Start by adding your first session notes above.
                </p>
              </div>
            ) : (
              <div className="flex flex-col" style={{ gap: 'var(--space-md)' }}>
                {sortedLogs.map((log) => (
                  <div
                    key={log.id}
                    className="hover:opacity-95 transition-colors"
                    style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', backgroundColor: 'var(--surface-hover)' }}
                  >
                    {/* Log Header */}
                    <div className="flex items-start justify-between" style={{ marginBottom: 'var(--space-sm)' }}>
                      <div className="flex items-center" style={{ gap: 'var(--space-sm)' }}>
                        <span className="inline-flex items-center justify-center w-10 h-10 bg-primary/10 text-primary font-bold" style={{ borderRadius: 'var(--radius-md)' }}>
                          W{log.weekNumber}
                        </span>
                        <div>
                          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                            Week {log.weekNumber} - {log.cycleKey}
                          </h3>
                          <div className="flex items-center text-xs" style={{ marginTop: 'var(--space-xs)', color: 'var(--text-secondary)', gap: 'var(--space-xs)' }}>
                            <span>Recorded by {log.recordedBy} on {formatAuditTimestamp(log.recordedAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Completion Badge */}
                      {log.isCompleted && (
                        <span className="inline-flex items-center text-xs font-semibold" style={{ padding: 'var(--space-xs) var(--space-sm)', borderRadius: 'var(--radius-pill)', backgroundColor: 'var(--feedback-success-light)', color: 'var(--color-success-text)', gap: 'var(--space-xs)' }}>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Completed
                        </span>
                      )}
                    </div>

                    {/* Session Notes */}
                    <p className="leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>
                      {log.sessionNotes}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TrainingLogPage;
