import React from 'react';
import { useWizard } from './WizardContext';
import { useCoaches } from '../../hooks/useCoaches';
import './CoachStep.css';

/**
 * CoachStep Component
 * Step 3 of the Batch Setup Wizard — Coach assignment (optional).
 * Displays available coaches as selectable cards with name and role.
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

export const CoachStep: React.FC = () => {
  const { state, updateCoach } = useWizard();
  const { coaches, loading, error, refetch } = useCoaches();

  const selectedCoachId = state.coach.coachId;

  const handleSelectCoach = (coach: { id: string; name: string; role: string }) => {
    if (selectedCoachId === coach.id) {
      // Deselect
      updateCoach({ coachId: null, coachName: null, coachRole: null });
    } else {
      // Select
      updateCoach({ coachId: coach.id, coachName: coach.name, coachRole: coach.role });
    }
  };

  const formatRole = (role: string): string => {
    switch (role) {
      case 'HEAD_COACH':
        return 'Head Coach';
      case 'ASSISTANT_COACH':
        return 'Assistant Coach';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="coach-step">
        <p className="coach-step__loading">Loading coaches…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="coach-step">
        <div className="coach-step__error">
          <p>{error}</p>
          <button type="button" className="btn btn-secondary" onClick={refetch}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="coach-step">
      <p className="coach-step__hint">
        This step is optional — you can assign a coach later.
      </p>

      <div className="coach-step__grid">
        {coaches.map((coach) => {
          const isSelected = selectedCoachId === coach.id;
          return (
            <button
              key={coach.id}
              type="button"
              className={`coach-card ${isSelected ? 'coach-card--selected' : ''}`}
              onClick={() => handleSelectCoach(coach)}
              aria-pressed={isSelected}
            >
              <span className="coach-card__name">{coach.name}</span>
              <span
                className={`coach-card__role coach-card__role--${coach.role.toLowerCase()}`}
              >
                {formatRole(coach.role)}
              </span>
            </button>
          );
        })}
      </div>

      {selectedCoachId && state.coach.coachName && (
        <p className="coach-step__confirmation">
          Selected: {state.coach.coachName} ({formatRole(state.coach.coachRole ?? '')})
        </p>
      )}
    </div>
  );
};

export default CoachStep;
