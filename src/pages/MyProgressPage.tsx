import React, { useMemo } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { SkillRadarChart } from '../components/SkillRadarChart';
import { useStudent } from '../hooks/useStudent';
import { useAssessments } from '../hooks/useAssessments';
import { useStudentDrillRecords } from '../hooks/useStudentDrillRecords';
import { formatDate } from '../utils/formatters';

/**
 * MyProgressPage
 * Displays the student's own skill assessment history and drill training ledger.
 */

const DRILL_STATUS_LABEL: Record<string, string> = {
  trained: 'Trained',
  scheduled: 'Scheduled',
  skipped: 'Skipped',
};

function drillStatusBadgeClasses(status: string): string {
  switch (status) {
    case 'trained':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'scheduled':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'skipped':
      return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
  }
}

export const MyProgressPage: React.FC = () => {
  const { user } = useAuth();
  const { student, loading: studentLoading, error: studentError } = useStudent(user?.id);
  const studentId = student?.id ?? null;

  const { assessments, loading: assessmentsLoading } = useAssessments(studentId ? { studentId } : undefined);
  const sortedAssessments = useMemo(
    () => [...assessments].sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime()),
    [assessments]
  );
  const mostRecentAssessment = sortedAssessments[0] ?? null;

  const { records: drillRecords, loading: drillsLoading } = useStudentDrillRecords(studentId ?? undefined);
  const sortedDrillRecords = useMemo(() => {
    return [...drillRecords].sort((a, b) => {
      const aDate = a.trainedAt || a.scheduledStart || '';
      const bDate = b.trainedAt || b.scheduledStart || '';
      return bDate.localeCompare(aDate);
    });
  }, [drillRecords]);

  if (!user) {
    return (
      <DashboardLayout>
        <div style={{ padding: 'var(--space-lg)' }}>
          <p style={{ color: 'var(--text-tertiary)' }}>Please log in to view your progress</p>
        </div>
      </DashboardLayout>
    );
  }

  if (studentLoading) {
    return (
      <DashboardLayout>
        <div style={{ padding: 'var(--space-lg)' }}>
          <p style={{ color: 'var(--text-tertiary)' }}>Loading progress...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout>
        <div style={{ padding: 'var(--space-lg)' }}>
          <p style={{ color: 'var(--text-tertiary)' }}>{studentError || 'Unable to load your data'}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="section-stack">
          <div className="page-header">
            <div>
              <h1 className="page-header-title">My Progress</h1>
              <p className="page-header-subtitle">
                Your skill assessments and drill training history
              </p>
            </div>
          </div>

          {/* Latest Skill Assessment */}
          <div className="shadow-md" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', backgroundColor: 'var(--surface-card)' }}>
            <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
              Latest Skill Assessment
            </h2>
            {assessmentsLoading ? (
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading assessments...</p>
            ) : mostRecentAssessment ? (
              <>
                <p className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                  {mostRecentAssessment.cycleKey} · Recorded on {formatDate(mostRecentAssessment.recordedAt)} by {mostRecentAssessment.recordedBy}
                </p>
                <SkillRadarChart scores={mostRecentAssessment.scores} />
              </>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                No skill assessments recorded yet.
              </p>
            )}
          </div>

          {/* Strengths & Weaknesses */}
          {(student.strengths.length > 0 || student.weaknesses.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'var(--space-lg)' }}>
              {student.strengths.length > 0 && (
                <div className="shadow-md" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', backgroundColor: 'var(--surface-card)' }}>
                  <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
                    Strengths
                  </h2>
                  <div className="flex flex-wrap" style={{ gap: 'var(--space-xs)' }}>
                    {student.strengths.map((s, i) => (
                      <span key={i} className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm font-medium" style={{ padding: 'var(--space-xs) var(--space-sm)', borderRadius: 'var(--radius-pill)' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {student.weaknesses.length > 0 && (
                <div className="shadow-md" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', backgroundColor: 'var(--surface-card)' }}>
                  <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
                    Areas to Improve
                  </h2>
                  <div className="flex flex-wrap" style={{ gap: 'var(--space-xs)' }}>
                    {student.weaknesses.map((w, i) => (
                      <span key={i} className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-sm font-medium" style={{ padding: 'var(--space-xs) var(--space-sm)', borderRadius: 'var(--radius-pill)' }}>
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Assessment History */}
          {sortedAssessments.length > 1 && (
            <div>
              <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
                Assessment History
              </h2>
              <div className="shadow overflow-hidden" style={{ borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface-card)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead style={{ backgroundColor: 'var(--surface-hover)' }}>
                      <tr>
                        <th className="text-left text-xs font-medium uppercase tracking-wider" style={{ padding: 'var(--space-sm) var(--space-lg)', color: 'var(--text-tertiary)' }}>Cycle</th>
                        <th className="text-left text-xs font-medium uppercase tracking-wider" style={{ padding: 'var(--space-sm) var(--space-lg)', color: 'var(--text-tertiary)' }}>Recorded</th>
                        <th className="text-left text-xs font-medium uppercase tracking-wider" style={{ padding: 'var(--space-sm) var(--space-lg)', color: 'var(--text-tertiary)' }}>By</th>
                      </tr>
                    </thead>
                    <tbody style={{ borderTop: '1px solid var(--border-default)' }}>
                      {sortedAssessments.map((a) => (
                        <tr key={a.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                          <td className="text-sm font-medium" style={{ padding: 'var(--space-md) var(--space-lg)', color: 'var(--text-primary)' }}>{a.cycleKey}</td>
                          <td className="text-sm" style={{ padding: 'var(--space-md) var(--space-lg)', color: 'var(--text-secondary)' }}>{formatDate(a.recordedAt)}</td>
                          <td className="text-sm" style={{ padding: 'var(--space-md) var(--space-lg)', color: 'var(--text-secondary)' }}>{a.recordedBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Drill Training Ledger */}
          <div>
            <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
              Drill Training History
            </h2>
            {drillsLoading ? (
              <div className="shadow text-center" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-xl)', backgroundColor: 'var(--surface-card)' }}>
                <p style={{ color: 'var(--text-tertiary)' }}>Loading drill records...</p>
              </div>
            ) : sortedDrillRecords.length === 0 ? (
              <div className="shadow text-center" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-xl)', backgroundColor: 'var(--surface-card)' }}>
                <p style={{ color: 'var(--text-tertiary)' }}>No drills assigned yet.</p>
              </div>
            ) : (
              <div className="section-stack" style={{ gap: 'var(--space-sm)' }}>
                {sortedDrillRecords.map((record) => (
                  <div
                    key={record.id}
                    className="shadow-sm"
                    style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--surface-card)' }}
                  >
                    <div className="flex items-start justify-between" style={{ marginBottom: 'var(--space-xs)' }}>
                      <div>
                        <h4 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                          {record.drillName || 'Drill'}
                        </h4>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {record.drillCategory}
                          {record.weekNumber ? ` · Week ${record.weekNumber}` : ''}
                          {record.curriculumName ? ` · ${record.curriculumName}` : ''}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold ${drillStatusBadgeClasses(record.status)}`} style={{ padding: 'var(--space-xs) var(--space-sm)', borderRadius: 'var(--radius-pill)' }}>
                        {DRILL_STATUS_LABEL[record.status] || record.status}
                      </span>
                    </div>
                    <div className="flex items-center flex-wrap" style={{ gap: 'var(--space-md)', marginTop: 'var(--space-sm)' }}>
                      {record.level != null && (
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          Level: <strong style={{ color: 'var(--text-primary)' }}>{record.level}/4</strong>
                        </span>
                      )}
                      {record.trainedAt && (
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          Trained on {formatDate(record.trainedAt)}
                        </span>
                      )}
                      {record.coachName && (
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          Coach: {record.coachName}
                        </span>
                      )}
                    </div>
                    {record.coachNotes && (
                      <p className="text-sm italic" style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-sm)', paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--border-default)' }}>
                        "{record.coachNotes}"
                      </p>
                    )}
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

export default MyProgressPage;
