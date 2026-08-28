import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { useStudent } from '../hooks/useStudent';
import { useStudentEnrollments } from '../hooks/useStudentEnrollments';
import { useStudentDrillRecords } from '../hooks/useStudentDrillRecords';
import type { StudentDrillRecord } from '../types';
import '../styles/pages.css';

/**
 * TrainingLogPage
 * The student's drill training record: what's in their currently assigned curriculum and
 * where they stand on it (status + skill level per drill), plus the full lifetime history of
 * every drill ever assigned across every past enrollment — independent of which batch timing,
 * curriculum, or coach was active at the time.
 */

const formatDate = (value?: string): string => {
  if (!value) return '—';
  const d = new Date(`${value}T00:00:00`);
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
};

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Scheduled',
  trained: 'Trained',
  skipped: 'Skipped',
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  scheduled: 'badge-secondary',
  trained: 'badge-success',
  skipped: 'badge-warning',
};

const DrillRecordRow: React.FC<{
  record: StudentDrillRecord;
  editable: boolean;
  onSave: (id: string, status: 'scheduled' | 'trained' | 'skipped', level: number | null, notes: string) => Promise<void>;
}> = ({ record, editable, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState(record.status);
  const [level, setLevel] = useState<number | ''>(record.level ?? '');
  const [notes, setNotes] = useState(record.coachNotes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(record.id, status, level === '' ? null : Number(level), notes);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="drill-record-row">
      <div className="drill-record-row__main">
        <span className="drill-record-row__name">{record.drillName || 'Unknown drill'}</span>
        <span className="drill-record-row__category">{record.drillCategory}</span>
      </div>
      <div className="drill-record-row__meta">
        <span className={`badge ${STATUS_BADGE_CLASS[record.status]}`}>{STATUS_LABEL[record.status]}</span>
        <span className="badge badge-secondary">{record.level != null ? `Lv ${record.level}` : '—'}</span>
        {editable && !isEditing && (
          <button className="text-action text-action--primary" onClick={() => setIsEditing(true)}>
            Update
          </button>
        )}
      </div>

      {isEditing && (
        <div className="drill-record-row__edit">
          <div className="form-group-inline">
            <label className="form-field-label">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="input">
              <option value="scheduled">Scheduled</option>
              <option value="trained">Trained</option>
              <option value="skipped">Skipped</option>
            </select>
          </div>
          <div className="form-group-inline">
            <label className="form-field-label">Level (0-4)</label>
            <select value={level} onChange={(e) => setLevel(e.target.value === '' ? '' : Number(e.target.value))} className="input">
              <option value="">—</option>
              {[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="form-group-inline" style={{ flex: 1 }}>
            <label className="form-field-label">Notes</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="input" placeholder="Optional coach notes" />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button className="btn btn-primary" disabled={saving} onClick={handleSave}>{saving ? 'Saving...' : 'Save'}</button>
            <button className="btn btn-secondary" disabled={saving} onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

const TrainingLogPage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const { student, loading: studentLoading, error: studentError } = useStudent(studentId);
  const { activeEnrollment, loading: enrollmentLoading } = useStudentEnrollments(studentId);
  const { records, loading: recordsLoading, error: recordsError, updateRecord } = useStudentDrillRecords(studentId);

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

  const loading = studentLoading || enrollmentLoading || recordsLoading;
  const error = studentError || recordsError;

  const currentCoverage = useMemo(() => {
    if (!activeEnrollment) return [];
    return records.filter((r) => r.enrollmentId === activeEnrollment.id);
  }, [records, activeEnrollment]);

  const coverageByWeek = useMemo(() => {
    const map = new Map<number, StudentDrillRecord[]>();
    for (const r of currentCoverage) {
      const list = map.get(r.weekNumber) || [];
      list.push(r);
      map.set(r.weekNumber, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [currentCoverage]);

  const lifetimeGroups = useMemo(() => {
    const map = new Map<string, StudentDrillRecord[]>();
    for (const r of records) {
      const list = map.get(r.enrollmentId) || [];
      list.push(r);
      map.set(r.enrollmentId, list);
    }
    return Array.from(map.values())
      .map((list) => ({
        list: list.sort((a, b) => a.weekNumber - b.weekNumber),
        first: list[0],
      }))
      .sort((a, b) => (b.first.enrollmentStartDate || '').localeCompare(a.first.enrollmentStartDate || ''));
  }, [records]);

  const handleSaveRecord = async (id: string, status: 'scheduled' | 'trained' | 'skipped', level: number | null, notes: string) => {
    await updateRecord(id, { status, level, coachNotes: notes || null });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-secondary">Loading training record...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !student) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-red-600 mb-2">{error || 'Student not found.'}</p>
            <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm">← Go back</button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const canEdit = role === 'HEAD_COACH' || (role === 'ASSISTANT_COACH' && student.assignedCoachId === user?.id);

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="section-stack">
          <div>
            <button
              onClick={() => navigate(`/student/${studentId}`)}
              className="btn btn-secondary btn-sm page-back-btn"
              style={{ marginBottom: 'var(--space-md)' }}
            >
              ← Back to Student Profile
            </button>
            <h1 className="page-header-title">Training Record — {student.fullName}</h1>
            <p className="page-header-subtitle">Drills assigned and trained, tracked across every curriculum and coach this student has had</p>
          </div>

          {/* Current curriculum coverage */}
          <div className="card">
            <h2 className="text-h3" style={{ marginTop: 0, marginBottom: 'var(--space-xs)' }}>Curriculum coverage</h2>
            {activeEnrollment ? (
              <p className="text-small" style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-lg)' }}>
                {activeEnrollment.curriculumName || 'No curriculum assigned'} · since {formatDate(activeEnrollment.startDate)}
              </p>
            ) : (
              <p className="text-small" style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-lg)' }}>
                No active enrollment set up for this student yet.
              </p>
            )}

            {coverageByWeek.length === 0 ? (
              <p className="text-small" style={{ color: 'var(--text-tertiary)' }}>No drills scheduled yet.</p>
            ) : (
              coverageByWeek.map(([weekNumber, weekRecords]) => (
                <div key={weekNumber} style={{ marginBottom: 'var(--space-lg)' }}>
                  <p className="text-label" style={{ marginBottom: 'var(--space-sm)' }}>
                    Week {weekNumber} · {formatDate(weekRecords[0].scheduledStart)} – {formatDate(weekRecords[0].scheduledEnd)}
                  </p>
                  <div className="drill-record-list">
                    {weekRecords.map((r) => (
                      <DrillRecordRow key={r.id} record={r} editable={canEdit} onSave={handleSaveRecord} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Lifetime drill record */}
          <div className="card">
            <h2 className="text-h3" style={{ marginTop: 0, marginBottom: 'var(--space-lg)' }}>Lifetime drill record</h2>
            {lifetimeGroups.length === 0 ? (
              <p className="text-small" style={{ color: 'var(--text-tertiary)' }}>No drill history yet.</p>
            ) : (
              lifetimeGroups.map(({ list, first }) => (
                <div key={first.enrollmentId} className="enrollment-period-group">
                  <div className="enrollment-period-group__header">
                    <span className="enrollment-period-group__title">{first.curriculumName || 'No curriculum'}</span>
                    <span className={`badge ${first.enrollmentStatus === 'active' ? 'badge-success' : 'badge-secondary'}`}>
                      {first.enrollmentStatus === 'active' ? 'Active' : 'Ended'}
                    </span>
                  </div>
                  <p className="text-small" style={{ color: 'var(--text-tertiary)', margin: '2px 0 var(--space-sm)' }}>
                    {first.coachName || 'No coach'} · since {formatDate(first.enrollmentStartDate)}
                  </p>
                  <div className="drill-record-list">
                    {list.map((r) => (
                      <DrillRecordRow key={r.id} record={r} editable={false} onSave={handleSaveRecord} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TrainingLogPage;
