import React from 'react';
import { useWizard } from './WizardContext';
import './DetailsStep.css';

/**
 * DetailsStep Component
 * Step 4 (final step): Displays a read-only summary of all prior selections
 * and form fields for batch name, skill level, and capacity.
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 8.1, 8.2
 */

// ─── Constants ───────────────────────────────────────────────────────────────

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Professional'] as const;

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDays(days: number[]): string {
  return days
    .slice()
    .sort((a, b) => a - b)
    .map((d) => DAY_LABELS[d])
    .join(', ');
}

function formatTime(time: string): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  return `${h.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function formatDuration(duration: number): string {
  if (duration === 1) return '1 hour';
  return `${duration} hours`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const DetailsStep: React.FC = () => {
  const { state, updateDetails } = useWizard();
  const { schedule, curriculum, coach, details } = state;

  // ─── Summary Data ──────────────────────────────────────────────────────

  const hasSchedule =
    schedule.daysOfWeek.length > 0 && schedule.startTime && schedule.duration > 0;

  const scheduleSummary = hasSchedule
    ? `${schedule.templateName ?? 'Custom Template'} — ${formatDays(schedule.daysOfWeek)} · ${formatTime(schedule.startTime)} · ${formatDuration(schedule.duration)}`
    : 'No template selected';

  const hasCurriculum = Boolean(curriculum.courseId && curriculum.courseName);
  const curriculumSummary = hasCurriculum
    ? `${curriculum.courseName}${curriculum.weekCount ? ` · ${curriculum.weekCount} weeks` : ''}`
    : 'None selected';

  const hasCoach = Boolean(coach.coachId && coach.coachName);
  const coachSummary = hasCoach
    ? `${coach.coachName} · ${coach.coachRole === 'HEAD_COACH' ? 'Head Coach' : 'Assistant Coach'}`
    : 'No coach assigned';

  // ─── Handlers ──────────────────────────────────────────────────────────

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateDetails({ name: e.target.value });
  };

  const handleSkillLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateDetails({ skillLevel: e.target.value as typeof details.skillLevel });
  };

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="details-step">
      {/* Summary Card */}
      <div className="details-step__summary-card">
        <h3 className="details-step__summary-title">Summary</h3>

        <div className="details-step__summary-row">
          <span className="details-step__summary-icon">📅</span>
          <div className="details-step__summary-content">
            <span className="details-step__summary-label">Schedule</span>
            <span className="details-step__summary-value">{scheduleSummary}</span>
          </div>
        </div>

        <div className="details-step__summary-row">
          <span className="details-step__summary-icon">📚</span>
          <div className="details-step__summary-content">
            <span className="details-step__summary-label">Curriculum</span>
            <span className="details-step__summary-value">{curriculumSummary}</span>
          </div>
        </div>

        <div className="details-step__summary-row">
          <span className="details-step__summary-icon">🏸</span>
          <div className="details-step__summary-content">
            <span className="details-step__summary-label">Coach</span>
            <span className="details-step__summary-value">{coachSummary}</span>
          </div>
        </div>
      </div>

      {/* Form Fields — 2-column grid layout */}
      <div className="details-step__form">
        <h3 className="details-step__form-title">Batch Details</h3>

        <div className="details-step__form-grid">
          {/* Batch Name */}
          <div className="details-step__field">
            <label className="details-step__label" htmlFor="batch-name">
              Batch Name <span className="details-step__required">*</span>
            </label>
            <input
              id="batch-name"
              className="details-step__input"
              type="text"
              placeholder="e.g. Morning Beginners"
              value={details.name}
              onChange={handleNameChange}
              required
              autoFocus
            />
            {details.name.length > 0 && details.name.trim().length === 0 && (
              <span className="details-step__error-text">
                Batch name cannot be only whitespace
              </span>
            )}
          </div>

          {/* Skill Level */}
          <div className="details-step__field">
            <label className="details-step__label" htmlFor="skill-level">
              Skill Level
            </label>
            <select
              id="skill-level"
              className="details-step__select"
              value={details.skillLevel}
              onChange={handleSkillLevelChange}
            >
              <option value="">Select skill level…</option>
              {SKILL_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsStep;
