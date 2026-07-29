import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { generateCycleKey } from '../utils/skillUtils';
import { formatAuditTimestamp } from '../utils/dateUtils';
import type { TrainingLog, Student } from '../types';
import trainingLogsData from '../data/trainingLogs.json';
import studentsData from '../data/students.json';

/**
 * TrainingLogPage
 * Allows Head Coach and assigned Assistant Coach to record weekly training session notes
 * Displays past training logs in reverse chronological order
 * 
 * Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6, 22.7, 16.3, 16.4
 */

const TrainingLogPage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const [student, setStudent] = useState<Student | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>(1);
  const [sessionNotes, setSessionNotes] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [pastLogs, setPastLogs] = useState<TrainingLog[]>([]);
  const [currentCycleKey] = useState(generateCycleKey());

  // Load student data and check permissions
  useEffect(() => {
    if (!studentId) {
      navigate('/students');
      return;
    }

    const foundStudent = studentsData.find((s) => s.id === studentId);
    if (!foundStudent) {
      navigate('/students');
      return;
    }

    // Check permission: Head Coach or assigned Assistant Coach only
    if (role === 'ASSISTANT_COACH' && foundStudent.assignedCoachId !== user?.id) {
      navigate('/access-denied');
      return;
    }

    // Convert dates from JSON strings to Date objects and null to undefined
    const studentWithDates: Student = {
      ...foundStudent,
      dateOfBirth: new Date(foundStudent.dateOfBirth),
      createdAt: new Date(foundStudent.createdAt),
      updatedAt: new Date(foundStudent.updatedAt),
      email: foundStudent.email || undefined,
      baidNumber: foundStudent.baidNumber || undefined,
      guardianName: foundStudent.guardianName || undefined,
      guardianPhone: foundStudent.guardianPhone || undefined,
      batchId: foundStudent.batchId || undefined,
      assignedCoachId: foundStudent.assignedCoachId || undefined,
      profilePhoto: foundStudent.profilePhoto || undefined,
      height: foundStudent.height || undefined,
      weight: foundStudent.weight || undefined,
      bmi: foundStudent.bmi || undefined,
      bloodGroup: foundStudent.bloodGroup || undefined,
      medicalConditions: foundStudent.medicalConditions || undefined,
      emergencyContact: foundStudent.emergencyContact || undefined,
      coachFeedback: foundStudent.coachFeedback || undefined,
    } as Student;

    setStudent(studentWithDates);
  }, [studentId, role, user, navigate]);

  // Load training logs
  useEffect(() => {
    if (!studentId) return;

    const storedLogs = localStorage.getItem('trainingLogs');
    const logsData = storedLogs ? JSON.parse(storedLogs) : trainingLogsData;

    // Filter logs for this student and sort by date (newest first)
    const studentLogs = logsData
      .filter((log: TrainingLog) => log.studentId === studentId)
      .sort((a: TrainingLog, b: TrainingLog) => {
        return new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime();
      });

    setPastLogs(studentLogs);

    // Check if there's already a log for the selected week in current cycle
    const existingLog = logsData.find(
      (log: TrainingLog) =>
        log.studentId === studentId &&
        log.cycleKey === currentCycleKey &&
        log.weekNumber === selectedWeek
    );

    if (existingLog) {
      setSessionNotes(existingLog.sessionNotes);
      setIsCompleted(existingLog.isCompleted);
    } else {
      setSessionNotes('');
      setIsCompleted(false);
    }
  }, [studentId, selectedWeek, currentCycleKey]);

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
      const timestamp = new Date();
      
      // Load existing logs
      const storedLogs = localStorage.getItem('trainingLogs');
      const existingLogs = storedLogs ? JSON.parse(storedLogs) : [...trainingLogsData];

      // Check if log already exists for this student/week/cycle
      const existingLogIndex = existingLogs.findIndex(
        (log: TrainingLog) =>
          log.studentId === studentId &&
          log.cycleKey === currentCycleKey &&
          log.weekNumber === selectedWeek
      );

      const newLog: TrainingLog = {
        id: existingLogIndex >= 0 ? existingLogs[existingLogIndex].id : `log-${Date.now()}`,
        studentId: student.id,
        weekNumber: selectedWeek,
        cycleKey: currentCycleKey,
        sessionNotes: sessionNotes.trim(),
        isCompleted: isCompleted,
        recordedBy: user.name,
        recordedAt: timestamp
      };

      let updatedLogs;
      if (existingLogIndex >= 0) {
        // Update existing log
        updatedLogs = [...existingLogs];
        updatedLogs[existingLogIndex] = newLog;
      } else {
        // Add new log
        updatedLogs = [...existingLogs, newLog];
      }

      // Save to localStorage
      localStorage.setItem('trainingLogs', JSON.stringify(updatedLogs));

      // Reload past logs
      const studentLogs = updatedLogs
        .filter((log: TrainingLog) => log.studentId === studentId)
        .sort((a: TrainingLog, b: TrainingLog) => {
          return new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime();
        });

      setPastLogs(studentLogs);
      setSaveMessage('Training log saved successfully!');
      setTimeout(() => setSaveMessage(''), 4000);
    } catch (error) {
      setSaveMessage('Error saving training log. Please try again.');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!student) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

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
          <div className="shadow-sm" style={{ backgroundColor: 'var(--surface-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', padding: 'var(--space-lg)' }}>
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
                  style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}
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
          <div className="shadow-sm" style={{ backgroundColor: 'var(--surface-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', padding: 'var(--space-lg)' }}>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
              Training History
            </h2>

            {pastLogs.length === 0 ? (
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
                {pastLogs.map((log) => (
                  <div
                    key={log.id}
                    className="hover:opacity-95 transition-colors"
                    style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)' }}
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
