import React from 'react';
import { useWizard } from './WizardContext';
import './StepActions.css';

/**
 * StepActions Component
 * Renders the Back / Next / Cancel / Submit button bar at the bottom of the wizard.
 * Uses project btn classes from design-system.css.
 * Requirements: 1.3, 1.4, 1.7
 */

interface StepActionsProps {
  onCancel: () => void;
  onSubmit: () => void;
  isLastStep: boolean;
  isSubmitting: boolean;
}

export const StepActions: React.FC<StepActionsProps> = ({
  onCancel,
  onSubmit,
  isLastStep,
  isSubmitting,
}) => {
  const { state, goBack, goNext, canGoNext } = useWizard();
  const { currentStep, mode } = state;

  const submitLabel = mode === 'edit' ? 'Save Changes' : 'Create Batch';

  const handleNext = () => {
    if (isLastStep) {
      onSubmit();
    } else {
      goNext();
    }
  };

  return (
    <div className="step-actions">
      <div className="step-actions__left">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
      <div className="step-actions__right">
        {currentStep > 0 && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={goBack}
            disabled={isSubmitting}
          >
            Back
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleNext}
          disabled={(!isLastStep && !canGoNext()) || isSubmitting}
        >
          {isSubmitting ? 'Saving…' : isLastStep ? submitLabel : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default StepActions;
