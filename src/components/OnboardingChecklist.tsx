import React from 'react';
import { Link } from 'react-router-dom';
import type { OnboardingChecklistResponse } from '../hooks/useOnboardingChecklist';
import './OnboardingChecklist.css';

/**
 * OnboardingChecklist Component
 * Renders a card-based onboarding checklist widget at the top of the
 * head coach dashboard. Shows progress, checklist items with navigation
 * links, and a dismiss button.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 4.1, 4.2, 4.4, 4.5
 */

interface OnboardingChecklistProps {
  checklist: OnboardingChecklistResponse;
  dismiss: () => Promise<void>;
  dismissing: boolean;
  error: string | null;
}

/**
 * Count items where completed === true.
 */
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
        <h2 className="onboarding-checklist__title">Set up your center</h2>
        <p className="onboarding-checklist__progress">
          {completedCount} of 6 completed
        </p>
      </div>

      <ul className="onboarding-checklist__items" role="list">
        {checklist.items.map((item) => (
          <li
            key={item.key}
            className={`onboarding-checklist__item ${
              item.completed ? 'onboarding-checklist__item--complete' : ''
            }`}
            role="listitem"
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
            <Link
              to={item.link}
              className="onboarding-checklist__link"
              aria-label={`Go to ${item.label}`}
            >
              {item.completed ? 'View' : 'Start'}
            </Link>
          </li>
        ))}
      </ul>

      <div className="onboarding-checklist__footer">
        <button
          className="onboarding-checklist__dismiss-btn"
          onClick={handleDismiss}
          disabled={dismissing}
          aria-label="Dismiss onboarding checklist"
          type="button"
        >
          {dismissing ? 'Dismissing…' : 'Got it'}
        </button>
        {error && (
          <p className="onboarding-checklist__error" role="alert">
            {error}
          </p>
        )}
      </div>
    </section>
  );
};

export default OnboardingChecklist;
