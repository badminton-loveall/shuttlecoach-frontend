import React from 'react';
import { useWizard } from './WizardContext';
import './StepperNav.css';

/**
 * StepperNav Component
 * Displays a horizontal 4-step navigation with progress indicators.
 * Current step is highlighted, completed steps show a checkmark and are clickable.
 * Requirements: 1.1, 1.2, 1.5
 */

const WIZARD_STEPS = [
  { index: 0, label: 'Batch Timing Template' },
  { index: 1, label: 'Curriculum Preparation' },
  { index: 2, label: 'Assign Coach' },
  { index: 3, label: 'Batch Details' },
] as const;

export const StepperNav: React.FC = () => {
  const { state, goToStep } = useWizard();
  const { currentStep, completedSteps } = state;

  const handleStepClick = (stepIndex: number) => {
    if (completedSteps.has(stepIndex)) {
      goToStep(stepIndex);
    }
  };

  return (
    <nav className="stepper-nav" aria-label="Wizard progress">
      {WIZARD_STEPS.map((step, idx) => {
        const isActive = currentStep === step.index;
        const isCompleted = completedSteps.has(step.index);
        const isLast = idx === WIZARD_STEPS.length - 1;

        const stepClasses = [
          'stepper-nav__step',
          isActive && 'stepper-nav__step--active',
          isCompleted && !isActive && 'stepper-nav__step--completed',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <React.Fragment key={step.index}>
            <div className={stepClasses}>
              <button
                type="button"
                className="stepper-nav__step-button"
                onClick={() => handleStepClick(step.index)}
                disabled={!isCompleted || isActive}
                aria-current={isActive ? 'step' : undefined}
                aria-label={`Step ${step.index + 1}: ${step.label}${isCompleted ? ' (completed)' : ''}${isActive ? ' (current)' : ''}`}
              >
                <span className="stepper-nav__indicator">
                  {isCompleted && !isActive ? '✓' : step.index + 1}
                </span>
                <span className="stepper-nav__label">{step.label}</span>
              </button>
            </div>
            {!isLast && (
              <div
                className={`stepper-nav__connector${isCompleted ? ' stepper-nav__connector--completed' : ''}`}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default StepperNav;
