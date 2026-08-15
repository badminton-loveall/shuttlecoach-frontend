import React from 'react';
import { useWizard } from './WizardContext';
import { StepperNav } from './StepperNav';
import { StepActions } from './StepActions';
import './WizardShell.css';

/**
 * WizardShell Component
 * Top-level layout for the batch setup wizard.
 * Renders: title + StepperNav + children (step content) + StepActions.
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7
 */

interface WizardShellProps {
  children: React.ReactNode;
  title: string;
  onCancel: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const WizardShell: React.FC<WizardShellProps> = ({
  children,
  title,
  onCancel,
  onSubmit,
  isSubmitting,
}) => {
  const { state } = useWizard();
  const isLastStep = state.currentStep === 3;

  return (
    <div className="wizard-shell">
      <div className="wizard-shell__header">
        <h1 className="wizard-shell__title">{title}</h1>
      </div>
      <div className="wizard-shell__card">
        <StepperNav />
        <div className="wizard-shell__content">{children}</div>
        <StepActions
          onCancel={onCancel}
          onSubmit={onSubmit}
          isLastStep={isLastStep}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
};

export default WizardShell;
