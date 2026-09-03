import React from 'react';
import { Link } from 'react-router-dom';
import type { OnboardingChecklistResponse } from '../hooks/useOnboardingChecklist';
import './OnboardingChecklist.css';

/**
 * OnboardingChecklist Component
 * Renders a 4-card grid at the top of the head coach dashboard — one card
 * per setup step (Add Coach, Batch, Curriculum, Student) — with a dismiss
 * button. Cards render in whatever order/count the backend sends, so this
 * stays correct even if the step list changes again later.
 */

interface OnboardingChecklistProps {
  checklist: OnboardingChecklistResponse;
  dismiss: () => Promise<void>;
  dismissing: boolean;
  error: string | null;
}

function computeProgressCount(checklist: OnboardingChecklistResponse): number {
  return checklist.items.filter((item) => item.completed).length;
}

const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({
  checklist,
  dismiss,
  dismissing,
  error,
}) => {
  // Do not render if all items are complete or checklist has been dismissed
  if (checklist.allComplete || checklist.dismissedAt) {
    return null;
  }

  const completedCount = computeProgressCount(checklist);

  const handleDismiss = async () => {
    await dismiss();
  };

  return (
    <section
      className="onboarding-checklist"
      aria-label="Onboarding checklist"
    >
      <div className="onboarding-checklist__header">
        <div>
          <h2 className="onboarding-checklist__title">Set up your center</h2>
          <p className="onboarding-checklist__progress">
            {completedCount} of {checklist.items.length} completed
          </p>
        </div>
        <button
          className="onboarding-checklist__dismiss-btn"
          onClick={handleDismiss}
          disabled={dismissing}
          aria-label="Dismiss onboarding checklist"
          type="button"
        >
          {dismissing ? 'Dismissing…' : 'Got it'}
        </button>
      </div>

      {error && (
        <p className="onboarding-checklist__error" role="alert">
          {error}
        </p>
      )}

      <ul className="onboarding-checklist__grid" role="list">
        {checklist.items.map((item) => (
          <li key={item.key} role="listitem">
            <Link
              to={item.link}
              className={`onboarding-checklist__card ${
                item.completed ? 'onboarding-checklist__card--complete' : ''
              }`}
            >
              <span
                className={`onboarding-checklist__icon ${
                  item.completed
                    ? 'onboarding-checklist__icon--complete'
                    : 'onboarding-checklist__icon--incomplete'
                }`}
                aria-hidden="true"
              >
                {item.completed ? '✓' : '○'}
              </span>
              <span className="onboarding-checklist__label">{item.label}</span>
              <span className="onboarding-checklist__link">
                {item.completed ? 'View' : 'Start'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default OnboardingChecklist;
