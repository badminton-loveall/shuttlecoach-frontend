import React from 'react';
import { useStudentEnrollments } from '../hooks/useStudentEnrollments';
import type { Student } from '../types';
import '../styles/pages.css';

interface EnrollmentSectionProps {
  student: Student;
}

const formatDate = (value?: string): string => {
  if (!value) return '—';
  const d = new Date(`${value}T00:00:00`);
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
};

/**
 * Past enrollments for this student. The current enrollment is summarized in the Enrollment
 * Details card up in Personal Information, and changing it is done via the Edit Student modal —
 * this section only shows what came before.
 */
export const EnrollmentSection: React.FC<EnrollmentSectionProps> = ({ student }) => {
  const { history, loading } = useStudentEnrollments(student.id);

  if (loading) {
    return (
      <div className="card" style={{ padding: 'var(--space-lg)' }}>
        <p className="text-small" style={{ color: 'var(--text-tertiary)' }}>Loading enrollment history...</p>
      </div>
    );
  }

  if (history.length === 0) return null;

  return (
    <div style={{ marginTop: 'var(--space-2xl)', paddingTop: 'var(--space-xl)', borderTop: '1px solid var(--border-default)' }}>
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
  );
};

export default EnrollmentSection;
