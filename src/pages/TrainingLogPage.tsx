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
          <div className="text-slate-600 dark:text-slate-400">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-12">
          <button
            onClick={() => navigate(`/student/${studentId}`)}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 mb-4 flex items-center gap-2 text-sm"
          >
            <span>←</span> Back to Student Profile
          </button>
          <h1 className="text-[36px] font-bold text-slate-900 dark:text-slate-50 mb-2 leading-tight">
            Training Log - {student.fullName}
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400">
            Record weekly training session notes and track progress
          </p>
        </div>

        {/* Current Cycle Info */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
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
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              Current Cycle: {currentCycleKey}
            </span>
          </div>
        </div>

        {/* Training Log Entry Form */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Record Training Session
          </h2>

          {/* Week Selector */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Select Week (1-8)
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((week) => (
                <button
                  key={week}
                  onClick={() => handleWeekChange(week)}
                  className={`px-4 py-3 rounded-lg font-semibold transition-colors ${
                    selectedWeek === week
                      ? 'bg-primary text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {week}
                </button>
              ))}
            </div>
          </div>

          {/* Session Notes */}
          <div className="mb-6">
            <label
              htmlFor="sessionNotes"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
            >
              Session Notes
            </label>
            <textarea
              id="sessionNotes"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="Describe the training session, student performance, areas of improvement, homework assigned, etc."
              rows={6}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>

          {/* Mark Completed Checkbox */}
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isCompleted}
                onChange={(e) => setIsCompleted(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Mark week as completed
              </span>
            </label>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleSaveLog}
              disabled={isSaving}
              className="px-6 py-3 bg-primary hover:bg-primary/90 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-slate-900 dark:text-slate-900 font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Training Log'}
            </button>

            {/* Coach Info */}
            {user && (
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Recording as: <strong className="text-slate-900 dark:text-slate-100">{user.name}</strong>
              </div>
            )}
          </div>

          {/* Save Message */}
          {saveMessage && (
            <div
              className={`mt-4 p-3 rounded-lg ${
                saveMessage.includes('Error') || saveMessage.includes('Please')
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                  : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
              }`}
            >
              {saveMessage}
            </div>
          )}
        </div>

        {/* Past Training Logs */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Training History
          </h2>

          {pastLogs.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-slate-500 dark:text-slate-400">
                No training logs recorded yet. Start by adding your first session notes above.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pastLogs.map((log) => (
                <div
                  key={log.id}
                  className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  {/* Log Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary font-bold">
                        W{log.weekNumber}
                      </span>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                          Week {log.weekNumber} - {log.cycleKey}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 dark:text-slate-400">
                          <span>Recorded by {log.recordedBy} on {formatAuditTimestamp(log.recordedAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Completion Badge */}
                    {log.isCompleted && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold">
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
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {log.sessionNotes}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TrainingLogPage;
