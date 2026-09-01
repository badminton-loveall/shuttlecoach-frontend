import React, { useMemo, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { SkillRadarChart } from '../components/SkillRadarChart';
import { LeaveRequestForm } from '../components/LeaveRequestForm';
import { SessionCard } from '../components/SessionCard';
import { StatCard } from '../components/StatCard';
import { useStudent } from '../hooks/useStudent';
import { useAttendanceStats } from '../hooks/useAttendance';
import { useSessionCalendar, useSessionNotes } from '../hooks/useSessionSchedule';
import { useAssessments } from '../hooks/useAssessments';
import { useFees } from '../hooks/useFees';
import type { FeeStatus } from '../types';
import { computeAllFeeStatuses } from '../utils/feeUtils';
import { calculateAge } from '../utils/studentUtils';
import { formatCurrency, formatDate, formatMonthYear } from '../utils/formatters';

/**
 * StudentDashboard Page
 * Displays student dashboard with personal stats, upcoming session, coach notes,
 * fee history, and skill progress — everything sourced live from the API.
 */

// Section heading style — matches the coach dashboard's .hc-overview-title (var(--font-lg))
const sectionHeadingStyle: React.CSSProperties = {
  fontSize: 'var(--font-lg)',
  fontWeight: 'var(--weight-semibold)',
  color: 'var(--text-primary)',
};

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();

  const [showLeaveForm, setShowLeaveForm] = useState(false);

  // Resolve the logged-in student's own record (a student's users.id === students.id)
  const { student, loading: studentLoading, error: studentError } = useStudent(user?.id);
  const studentId = student?.id ?? null;

  // Personal attendance percentage
  const { stats: personalAttendanceStats, loading: attendanceLoading } =
    useAttendanceStats(studentId ? { studentId } : undefined);

  const personalAttendancePercentage = useMemo(() => {
    if (!personalAttendanceStats || personalAttendanceStats.length === 0) return null;
    const totalSessions = personalAttendanceStats.reduce((sum, s) => sum + s.totalSessions, 0);
    const totalAttended = personalAttendanceStats.reduce((sum, s) => sum + s.attended + s.late, 0);
    if (totalSessions === 0) return null;
    return Math.round((totalAttended / totalSessions) * 100);
  }, [personalAttendanceStats]);

  // Session calendar — drives the "Up Next" hero (next coaching date + drills to practice)
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const threeWeeksAhead = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 21);
    return d.toISOString().slice(0, 10);
  }, []);

  const { entries: calendarEntries, loading: calendarLoading, error: calendarError } =
    useSessionCalendar(student?.batchId ? { startDate: todayStr, endDate: threeWeeksAhead, batchId: student.batchId } : undefined);

  // Coach's notes for the student's batch — the "coach report to students" feed
  const { notes: coachNotes, loading: notesLoading } = useSessionNotes(
    student?.batchId ? { batchId: student.batchId } : undefined
  );
  const recentCoachNotes = useMemo(
    () => [...coachNotes].sort((a, b) => b.sessionDate.localeCompare(a.sessionDate)).slice(0, 5),
    [coachNotes]
  );

  // Skill assessments (self-scoped server-side for STUDENT role)
  const { assessments, loading: assessmentsLoading } = useAssessments(studentId ? { studentId } : undefined);
  const mostRecentAssessment = useMemo(() => {
    if (assessments.length === 0) return null;
    return [...assessments].sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())[0];
  }, [assessments]);

  const nextAssessmentDue = useMemo(() => {
    if (!mostRecentAssessment) return null;
    const nextDue = new Date(mostRecentAssessment.recordedAt);
    nextDue.setDate(nextDue.getDate() + 60);
    return nextDue;
  }, [mostRecentAssessment]);

  // Fees — GET /fees auto-scopes to the caller's own records for STUDENT role
  const { fees: rawFees, loading: feesLoading, error: feesError } = useFees();
  const studentFees = useMemo(() => {
    const withStatuses = computeAllFeeStatuses(rawFees);
    return withStatuses.sort((a, b) => new Date(b.monthYear).getTime() - new Date(a.monthYear).getTime());
  }, [rawFees]);

  const outstandingBalance = useMemo(() => {
    return studentFees
      .filter((fee) => fee.status === 'PENDING' || fee.status === 'OVERDUE')
      .reduce((sum, fee) => sum + fee.amount, 0);
  }, [studentFees]);

  // Next session (drives the "Up Next" hero copy)
  const nextSession = useMemo(() => {
    const sorted = [...calendarEntries].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });
    return sorted.find((e) => e.date >= todayStr) ?? null;
  }, [calendarEntries, todayStr]);

  const nextSessionCountdown = useMemo(() => {
    if (!nextSession) return null;
    const diffDays = Math.round(
      (new Date(nextSession.date + 'T00:00:00').getTime() - new Date(todayStr + 'T00:00:00').getTime()) / 86400000
    );
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `In ${diffDays} days`;
  }, [nextSession, todayStr]);

  const getStatusBadgeClasses = (status: FeeStatus): string => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'WAIVED':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div style={{ padding: 'var(--space-lg)' }}>
          <p style={{ color: 'var(--text-tertiary)' }}>Please log in to view your dashboard</p>
        </div>
      </DashboardLayout>
    );
  }

  if (studentLoading) {
    return (
      <DashboardLayout>
        <div style={{ padding: 'var(--space-lg)' }}>
          <p style={{ color: 'var(--text-tertiary)' }}>Loading student data...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout>
        <div style={{ padding: 'var(--space-lg)' }}>
          <p style={{ color: 'var(--text-tertiary)' }}>{studentError || 'Unable to load student data'}</p>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)', marginTop: 'var(--space-sm)' }}>
            Please contact your coach if this issue persists.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="section-stack">
          {/* Welcome Banner with Name and Photo */}
          <div className="bg-gradient-to-r from-primary/20 to-primary/5 dark:from-primary/30 dark:to-primary/10 shadow-md border-l-4 border-primary" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)' }}>
            <div className="flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left" style={{ gap: 'var(--space-md)' }}>
              <div className="flex-shrink-0">
                {student.profilePhoto ? (
                  <img
                    src={student.profilePhoto}
                    alt={student.fullName}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover shadow-lg"
                    style={{ border: '4px solid var(--surface-elevated)', borderColor: 'var(--surface-elevated)' }}
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center shadow-lg" style={{ border: '4px solid var(--surface-elevated)' }}>
                    <span className="text-xl sm:text-2xl font-bold text-primary">
                      {student.fullName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h1 style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--weight-bold)', lineHeight: 'var(--line-tight)', color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>
                  Welcome back, {student.fullName}!
                </h1>
                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                  Keep up the great work! Here's your training overview.
                </p>
              </div>
            </div>
          </div>

          {/* Up Next Hero — next coaching date, drills to practice, coach note at a glance */}
          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-sm)' }}>
              <h2 style={sectionHeadingStyle}>
                Up Next
              </h2>
              {nextSessionCountdown && (
                <span className="bg-primary text-slate-900 text-sm font-semibold" style={{ padding: 'var(--space-xs) var(--space-sm)', borderRadius: 'var(--radius-pill)' }}>
                  {nextSessionCountdown}
                </span>
              )}
            </div>
            <SessionCard
              entries={calendarEntries}
              loading={calendarLoading}
              error={calendarError}
              variant="student"
            />
          </div>

          {/* Personal Stat Cards — reuses the coach dashboard's StatCard for identical sizing */}
          <div className="card-grid">
            <StatCard
              title="Skill Level"
              value={student.skillLevel}
              variant="primary"
              compact
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />

            <StatCard
              title="Next Assessment"
              value={assessmentsLoading ? '...' : nextAssessmentDue ? formatDate(nextAssessmentDue) : 'Not scheduled'}
              variant="info"
              compact
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />

            <StatCard
              title="Fee Balance"
              value={feesLoading ? '...' : formatCurrency(outstandingBalance)}
              label={!feesLoading && outstandingBalance > 0 ? 'Payment due' : undefined}
              variant="warning"
              compact
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />

            <StatCard
              title="Batch & Coach"
              value={student.batchName || 'No batch assigned'}
              label={`Coach: ${student.assignedCoachName || 'Not assigned'}`}
              variant="success"
              compact
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
            />

            <StatCard
              title="Attendance"
              value={attendanceLoading ? '...' : personalAttendancePercentage !== null ? `${personalAttendancePercentage}%` : 'N/A'}
              label={personalAttendancePercentage !== null && personalAttendancePercentage < 75 ? 'Below 75% target' : undefined}
              variant={personalAttendancePercentage !== null && personalAttendancePercentage < 75 ? 'danger' : 'info'}
              compact
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              }
            />
          </div>

          {/* Coach's Notes — the coach's ongoing report to the batch */}
          <div className="shadow-md" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', backgroundColor: 'var(--surface-card)' }}>
            <h2 style={{ ...sectionHeadingStyle, marginBottom: 'var(--space-md)' }}>
              Coach's Notes
            </h2>
            {notesLoading ? (
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading notes...</p>
            ) : recentCoachNotes.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                No notes from your coach yet.
              </p>
            ) : (
              <div className="section-stack" style={{ gap: 'var(--space-sm)' }}>
                {recentCoachNotes.map((note) => (
                  <div
                    key={note.id}
                    style={{
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-md)',
                      backgroundColor: 'var(--surface-hover)',
                      borderLeft: '3px solid var(--color-primary, #B8E135)',
                    }}
                  >
                    <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-xs)' }}>
                      {formatDate(note.sessionDate)}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {note.noteText}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leave Request Section */}
          {student.batchId && (
            <div className="shadow-md" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', backgroundColor: 'var(--surface-card)' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: showLeaveForm ? 'var(--space-md)' : '0' }}>
                <h2 style={sectionHeadingStyle}>
                  Leave Request
                </h2>
                <button
                  type="button"
                  onClick={() => setShowLeaveForm((prev) => !prev)}
                  className={`btn ${showLeaveForm ? 'btn-secondary' : 'btn-primary'}`}
                >
                  {showLeaveForm ? 'Cancel' : 'Request Leave'}
                </button>
              </div>
              {showLeaveForm && (
                <LeaveRequestForm
                  studentId={student.id}
                  batchId={student.batchId}
                  onSuccess={() => setShowLeaveForm(false)}
                  onCancel={() => setShowLeaveForm(false)}
                />
              )}
            </div>
          )}

          {/* Most Recent Skill Assessment Radar Chart */}
          {mostRecentAssessment && (
            <div className="shadow-md" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', backgroundColor: 'var(--surface-card)' }}>
              <h2 style={{ ...sectionHeadingStyle, marginBottom: 'var(--space-md)' }}>
                Latest Skill Assessment
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                Recorded on {formatDate(mostRecentAssessment.recordedAt)} by {mostRecentAssessment.recordedBy}
              </p>
              <SkillRadarChart scores={mostRecentAssessment.scores} />
            </div>
          )}

          {/* Coach Feedback Section */}
          {student.coachFeedback && (
            <div className="shadow-md" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', backgroundColor: 'var(--surface-card)' }}>
              <h2 style={{ ...sectionHeadingStyle, marginBottom: 'var(--space-md)' }}>
                Coach Feedback
              </h2>
              <div style={{ backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)' }}>
                <p style={{ color: 'var(--text-primary)' }}>{student.coachFeedback}</p>
              </div>
            </div>
          )}

          {/* Strengths and Weaknesses */}
          {(student.strengths.length > 0 || student.weaknesses.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'var(--space-lg)' }}>
              {student.strengths.length > 0 && (
                <div className="shadow-md" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', backgroundColor: 'var(--surface-card)' }}>
                  <h2 style={{ ...sectionHeadingStyle, marginBottom: 'var(--space-md)' }}>
                    Strengths
                  </h2>
                  <div className="flex flex-wrap" style={{ gap: 'var(--space-xs)' }}>
                    {student.strengths.map((strength, index) => (
                      <span
                        key={index}
                        className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm font-medium"
                        style={{ padding: 'var(--space-xs) var(--space-sm)', borderRadius: 'var(--radius-pill)' }}
                      >
                        {strength}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {student.weaknesses.length > 0 && (
                <div className="shadow-md" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', backgroundColor: 'var(--surface-card)' }}>
                  <h2 style={{ ...sectionHeadingStyle, marginBottom: 'var(--space-md)' }}>
                    Areas to Improve
                  </h2>
                  <div className="flex flex-wrap" style={{ gap: 'var(--space-xs)' }}>
                    {student.weaknesses.map((weakness, index) => (
                      <span
                        key={index}
                        className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-sm font-medium"
                        style={{ padding: 'var(--space-xs) var(--space-sm)', borderRadius: 'var(--radius-pill)' }}
                      >
                        {weakness}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Outstanding Balance Card */}
          <div className="shadow-md border-l-4 border-primary" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', backgroundColor: 'var(--surface-card)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontSize: 'var(--font-label)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: 'var(--letter-label)', color: 'var(--text-secondary)' }}>
                  Outstanding Balance
                </p>
                <p style={{ fontSize: 'var(--font-display)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', marginTop: 'var(--space-sm)' }}>
                  {formatCurrency(outstandingBalance)}
                </p>
              </div>
              {outstandingBalance > 0 ? (
                <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-sm font-medium" style={{ padding: 'var(--space-xs) var(--space-sm)', borderRadius: 'var(--radius-pill)' }}>
                  Payment Due
                </div>
              ) : (
                <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm font-medium" style={{ padding: 'var(--space-xs) var(--space-sm)', borderRadius: 'var(--radius-pill)' }}>
                  All Paid
                </div>
              )}
            </div>
          </div>

          {/* Fee History Section */}
          <div>
            <h2 style={{ ...sectionHeadingStyle, marginBottom: 'var(--space-md)' }}>
              Fee History
            </h2>

            {feesLoading ? (
              <div className="shadow text-center" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-xl)', backgroundColor: 'var(--surface-card)' }}>
                <p style={{ color: 'var(--text-tertiary)' }}>Loading fee records...</p>
              </div>
            ) : feesError ? (
              <div className="shadow text-center" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-xl)', backgroundColor: 'var(--surface-card)' }}>
                <p style={{ color: 'var(--text-tertiary)' }}>{feesError}</p>
              </div>
            ) : studentFees.length === 0 ? (
              <div className="shadow text-center" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-xl)', backgroundColor: 'var(--surface-card)' }}>
                <p style={{ color: 'var(--text-tertiary)' }}>No fee records found</p>
              </div>
            ) : (
              <div className="shadow overflow-hidden" style={{ borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface-card)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead style={{ backgroundColor: 'var(--surface-hover)' }}>
                      <tr>
                        <th className="text-left text-xs font-medium uppercase tracking-wider" style={{ padding: 'var(--space-sm) var(--space-lg)', color: 'var(--text-tertiary)' }}>
                          Month/Year
                        </th>
                        <th className="text-left text-xs font-medium uppercase tracking-wider" style={{ padding: 'var(--space-sm) var(--space-lg)', color: 'var(--text-tertiary)' }}>
                          Amount
                        </th>
                        <th className="text-left text-xs font-medium uppercase tracking-wider" style={{ padding: 'var(--space-sm) var(--space-lg)', color: 'var(--text-tertiary)' }}>
                          Status
                        </th>
                        <th className="text-left text-xs font-medium uppercase tracking-wider" style={{ padding: 'var(--space-sm) var(--space-lg)', color: 'var(--text-tertiary)' }}>
                          Paid Date
                        </th>
                      </tr>
                    </thead>
                    <tbody style={{ borderTop: '1px solid var(--border-default)', backgroundColor: 'var(--surface-card)' }}>
                      {studentFees.map((fee) => (
                        <tr key={fee.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                          <td className="whitespace-nowrap text-sm font-medium" style={{ padding: 'var(--space-md) var(--space-lg)', color: 'var(--text-primary)' }}>
                            {formatMonthYear(fee.monthYear)}
                          </td>
                          <td className="whitespace-nowrap text-sm font-medium" style={{ padding: 'var(--space-md) var(--space-lg)', color: 'var(--text-primary)' }}>
                            {formatCurrency(fee.amount)}
                          </td>
                          <td className="whitespace-nowrap" style={{ padding: 'var(--space-md) var(--space-lg)' }}>
                            <span
                              className={`inline-flex text-xs font-semibold ${getStatusBadgeClasses(fee.status)}`}
                              style={{ padding: 'var(--space-xs) var(--space-sm)', borderRadius: 'var(--radius-pill)' }}
                            >
                              {fee.status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap text-sm" style={{ padding: 'var(--space-md) var(--space-lg)', color: 'var(--text-tertiary)' }}>
                            {fee.paidDate ? formatDate(fee.paidDate) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Read-only Profile Section */}
          <div className="shadow-md" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', backgroundColor: 'var(--surface-card)' }}>
            <h2 style={{ ...sectionHeadingStyle, marginBottom: 'var(--space-md)' }}>
              My Profile
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'var(--space-lg)' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>Full Name</p>
                <p className="text-base" style={{ color: 'var(--text-primary)' }}>{student.fullName}</p>
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>Age</p>
                <p className="text-base" style={{ color: 'var(--text-primary)' }}>{calculateAge(student.dateOfBirth)} years</p>
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>Gender</p>
                <p className="text-base" style={{ color: 'var(--text-primary)' }}>{student.gender}</p>
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>Contact Phone</p>
                <p className="text-base" style={{ color: 'var(--text-primary)' }}>{student.contactPhone}</p>
              </div>
              {student.email && (
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>Email</p>
                  <p className="text-base" style={{ color: 'var(--text-primary)' }}>{student.email}</p>
                </div>
              )}
              {student.baidNumber && (
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>BAID Number</p>
                  <p className="text-base" style={{ color: 'var(--text-primary)' }}>{student.baidNumber}</p>
                </div>
              )}
              {student.guardianName && (
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>Guardian Name</p>
                  <p className="text-base" style={{ color: 'var(--text-primary)' }}>{student.guardianName}</p>
                </div>
              )}
              {student.guardianPhone && (
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>Guardian Phone</p>
                  <p className="text-base" style={{ color: 'var(--text-primary)' }}>{student.guardianPhone}</p>
                </div>
              )}
              {student.bloodGroup && (
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>Blood Group</p>
                  <p className="text-base" style={{ color: 'var(--text-primary)' }}>{student.bloodGroup}</p>
                </div>
              )}
              {student.height && student.weight && (
                <>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>Height</p>
                    <p className="text-base" style={{ color: 'var(--text-primary)' }}>{student.height} cm</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>Weight</p>
                    <p className="text-base" style={{ color: 'var(--text-primary)' }}>{student.weight} kg</p>
                  </div>
                  {student.bmi && (
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>BMI</p>
                      <p className="text-base" style={{ color: 'var(--text-primary)' }}>{student.bmi}</p>
                    </div>
                  )}
                </>
              )}
              {student.emergencyContact && (
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>Emergency Contact</p>
                  <p className="text-base" style={{ color: 'var(--text-primary)' }}>{student.emergencyContact}</p>
                </div>
              )}
              {student.medicalConditions && (
                <div className="md:col-span-2">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>Medical Conditions</p>
                  <p className="text-base" style={{ color: 'var(--text-primary)' }}>{student.medicalConditions}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
