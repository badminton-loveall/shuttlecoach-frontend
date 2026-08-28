import React, { useState, useEffect, useMemo } from 'react';
import { useStudentEnrollments } from '../hooks/useStudentEnrollments';
import { useCourses } from '../hooks/useCourses';
import { useCoaches } from '../hooks/useCoaches';
import apiClient from '../utils/apiClient';
import type { Student } from '../types';
import '../styles/pages.css';

interface EnrollmentSectionProps {
  student: Student;
}

interface TemplateOption {
  id: string;
  name: string;
}

const formatDate = (value?: string): string => {
  if (!value) return '—';
  const d = new Date(`${value}T00:00:00`);
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
};

/** Mirrors the backend's week-block calendar math for a live preview before saving. */
const computeProjectedEndDate = (startDate: string, weekCount: number): string | null => {
  if (!startDate || weekCount <= 0) return null;
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + weekCount * 7 - 1);
  return end.toISOString().slice(0, 10);
};

export const EnrollmentSection: React.FC<EnrollmentSectionProps> = ({ student }) => {
  const { activeEnrollment, history, loading, error, createEnrollment } = useStudentEnrollments(student.id);
  const { courses } = useCourses();
  const { coaches } = useCoaches();

  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  useEffect(() => {
    apiClient
      .get('/batch-time-templates')
      .then((r) => {
        const data = r.data;
        const list: TemplateOption[] = Array.isArray(data) ? data : data.templates || [];
        setTemplates(list);
      })
      .catch(() => setTemplates([]));
  }, []);

  const [showForm, setShowForm] = useState(false);
  const [templateId, setTemplateId] = useState('');
  const [curriculumId, setCurriculumId] = useState('');
  const [coachId, setCoachId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [monthlyFee, setMonthlyFee] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  const selectedCourse = useMemo(() => courses.find((c) => c.id === curriculumId), [courses, curriculumId]);
  const previewEndDate = useMemo(
    () => (selectedCourse ? computeProjectedEndDate(startDate, selectedCourse.weeks.length) : null),
    [selectedCourse, startDate]
  );

  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => setSaveMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [saveMessage]);

  const openForm = () => {
    // Pre-fill from the current active enrollment as a starting point, if any
    setTemplateId(activeEnrollment?.batchTimeTemplateId || '');
    setCurriculumId(activeEnrollment?.curriculumId || '');
    setCoachId(activeEnrollment?.coachId || '');
    setStartDate('');
    setMonthlyFee(activeEnrollment?.monthlyFee != null ? String(activeEnrollment.monthlyFee) : '');
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!startDate) {
      setFormError('Start date is required');
      return;
    }
    setFormError('');
    setIsSaving(true);
    try {
      await createEnrollment({
        batchTimeTemplateId: templateId || null,
        curriculumId: curriculumId || null,
        coachId: coachId || null,
        startDate,
        monthlyFee: monthlyFee ? Number(monthlyFee) : null,
      });
      setSaveMessage('Enrollment saved.');
      setShowForm(false);
    } catch {
      setFormError('Failed to save enrollment. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: 'var(--space-lg)' }}>
        <p className="text-small" style={{ color: 'var(--text-tertiary)' }}>Loading enrollment...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 'var(--space-lg)' }}>
        <div>
          <h2 className="text-h3" style={{ margin: 0 }}>Enrollment</h2>
          <p className="text-small" style={{ color: 'var(--text-tertiary)', margin: '4px 0 0' }}>
            This student's own batch timing, curriculum, coach, and start date
          </p>
        </div>
        {!showForm && (
          <button onClick={openForm} className="btn btn-primary">
            {activeEnrollment ? 'Change enrollment' : 'Set up enrollment'}
          </button>
        )}
      </div>

      {error && <div className="alert-base alert-warning" style={{ marginBottom: 'var(--space-md)' }}>{error}</div>}
      {saveMessage && <div className="alert-base alert-success" style={{ marginBottom: 'var(--space-md)' }}>{saveMessage}</div>}

      {/* Current enrollment summary */}
      {activeEnrollment && !showForm && (
        <div className="enrollment-summary-card">
          <div className="enrollment-summary-card__row">
            <span className="enrollment-summary-card__label">Batch timing</span>
            <span className="enrollment-summary-card__value">{activeEnrollment.templateName || '—'}</span>
          </div>
          <div className="enrollment-summary-card__row">
            <span className="enrollment-summary-card__label">Curriculum</span>
            <span className="enrollment-summary-card__value">{activeEnrollment.curriculumName || '—'}</span>
          </div>
          <div className="enrollment-summary-card__row">
            <span className="enrollment-summary-card__label">Coach</span>
            <span className="enrollment-summary-card__value">{activeEnrollment.coachName || '—'}</span>
          </div>
          <div className="enrollment-summary-card__row">
            <span className="enrollment-summary-card__label">Start date</span>
            <span className="enrollment-summary-card__value">{formatDate(activeEnrollment.startDate)}</span>
          </div>
          <div className="enrollment-summary-card__row">
            <span className="enrollment-summary-card__label">Projected end</span>
            <span className="enrollment-summary-card__value">{formatDate(activeEnrollment.projectedEndDate)}</span>
          </div>
          {activeEnrollment.monthlyFee != null && (
            <div className="enrollment-summary-card__row">
              <span className="enrollment-summary-card__label">Monthly fee</span>
              <span className="enrollment-summary-card__value">₹{activeEnrollment.monthlyFee}</span>
            </div>
          )}
        </div>
      )}

      {!activeEnrollment && !showForm && (
        <div className="card" style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
          <p className="text-small" style={{ color: 'var(--text-tertiary)', margin: 0 }}>
            No enrollment set up yet for this student.
          </p>
        </div>
      )}

      {/* Enrollment form */}
      {showForm && (
        <div className="card" style={{ padding: 'var(--space-lg)' }}>
          <div className="enrollment-form-grid">
            <div className="form-group-inline">
              <label className="form-field-label">Batch time template</label>
              <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="input">
                <option value="">No template</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group-inline">
              <label className="form-field-label">Curriculum</label>
              <select value={curriculumId} onChange={(e) => setCurriculumId(e.target.value)} className="input">
                <option value="">No curriculum</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.weeks.length}w)</option>
                ))}
              </select>
            </div>
            <div className="form-group-inline">
              <label className="form-field-label">Coach</label>
              <select value={coachId} onChange={(e) => setCoachId(e.target.value)} className="input">
                <option value="">No coach</option>
                {coaches.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group-inline">
              <label className="form-field-label">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input"
              />
            </div>
            <div className="form-group-inline">
              <label className="form-field-label">Monthly fee</label>
              <input
                type="number"
                min="0"
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(e.target.value)}
                placeholder="e.g., 2500"
                className="input"
              />
            </div>
          </div>

          {selectedCourse && startDate && (
            <div className="enrollment-calendar-preview">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
              Auto-calculated: {selectedCourse.weeks.length} weeks · {formatDate(startDate)} – {formatDate(previewEndDate || undefined)}
            </div>
          )}

          {formError && <div className="alert-base alert-warning" style={{ marginTop: 'var(--space-md)' }}>{formError}</div>}

          <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
            <button onClick={handleSave} disabled={isSaving} className="btn btn-primary">
              {isSaving ? 'Saving...' : 'Save enrollment'}
            </button>
            <button onClick={() => setShowForm(false)} disabled={isSaving} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Enrollment history */}
      {history.length > 0 && (
        <div style={{ marginTop: 'var(--space-xl)' }}>
          <h3 className="text-label" style={{ marginBottom: 'var(--space-sm)' }}>Enrollment history</h3>
          <div className="enrollment-history-list">
            {history.map((e) => (
              <div key={e.id} className="enrollment-history-row">
                <span className="badge badge-secondary">Ended</span>
                <span className="text-small">
                  {formatDate(e.startDate)} – {formatDate(e.projectedEndDate)} · {e.curriculumName || 'No curriculum'} · {e.coachName || 'No coach'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentSection;
