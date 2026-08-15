import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { SkillLevel } from '../../types';

/* eslint-disable react-refresh/only-export-components */

/**
 * WizardContext
 * Manages state for the Batch Setup Wizard (create & edit modes).
 * Provides step validation, navigation gating, and payload construction.
 * Requirements: 1.3, 1.4, 1.6, 2.5
 */

// ─── State Interfaces ────────────────────────────────────────────────────────

export interface WizardState {
  mode: 'create' | 'edit';
  batchId?: string;
  currentStep: number; // 0-3
  completedSteps: Set<number>;

  schedule: {
    templateId: string | null;
    templateName: string | null;
    daysOfWeek: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
    startTime: string; // "HH:mm"
    duration: number; // hours: 1, 1.5, 2, 2.5, 3, 3.5, 4
    isNewTemplate: boolean;
  };

  curriculum: {
    courseId: string | null;
    courseName: string | null;
    weekCount: number | null;
  };

  coach: {
    coachId: string | null;
    coachName: string | null;
    coachRole: string | null;
  };

  details: {
    name: string;
    skillLevel: SkillLevel | '';
    capacity: number | '';
  };
}

export interface BatchSubmitPayload {
  name: string;
  template_id?: string;
  curriculum_id?: string;
  assigned_coach_id?: string;
  skill_level?: string;
  capacity?: number;
  newTemplate?: {
    name: string;
    days_of_week: number[];
    start_time: string;
    duration: number;
  };
}

export interface WizardContextValue {
  state: WizardState;
  updateSchedule: (data: Partial<WizardState['schedule']>) => void;
  updateCurriculum: (data: Partial<WizardState['curriculum']>) => void;
  updateCoach: (data: Partial<WizardState['coach']>) => void;
  updateDetails: (data: Partial<WizardState['details']>) => void;
  goToStep: (step: number) => void;
  goNext: () => void;
  goBack: () => void;
  canGoNext: () => boolean;
  canGoToStep: (step: number) => boolean;
  isStepValid: (step: number) => boolean;
  reset: () => void;
  getSubmitPayload: () => BatchSubmitPayload;
}

// ─── Initial State ───────────────────────────────────────────────────────────

export const INITIAL_WIZARD_STATE: WizardState = {
  mode: 'create',
  currentStep: 0,
  completedSteps: new Set<number>(),
  schedule: {
    templateId: null,
    templateName: null,
    daysOfWeek: [],
    startTime: '',
    duration: 0,
    isNewTemplate: false,
  },
  curriculum: {
    courseId: null,
    courseName: null,
    weekCount: null,
  },
  coach: {
    coachId: null,
    coachName: null,
    coachRole: null,
  },
  details: {
    name: '',
    skillLevel: '',
    capacity: '',
  },
};

// ─── Step Validation ─────────────────────────────────────────────────────────

/**
 * Validates a specific step based on the current wizard state.
 * - Step 0 (Schedule): valid if templateId is set OR (isNewTemplate AND daysOfWeek.length > 0 AND startTime AND duration > 0 AND templateName is non-empty)
 * - Step 1 (Curriculum): always valid (optional)
 * - Step 2 (Coach): always valid (optional)
 * - Step 3 (Details): valid if name is non-empty after trim
 */
export function validateStep(step: number, state: WizardState): boolean {
  switch (step) {
    case 0: {
      const { templateId, isNewTemplate, daysOfWeek, startTime, duration, templateName } = state.schedule;
      if (templateId && !isNewTemplate) {
        return true;
      }
      if (isNewTemplate) {
        return (
          daysOfWeek.length > 0 &&
          startTime.trim().length > 0 &&
          duration > 0 &&
          (templateName ?? '').trim().length > 0
        );
      }
      return false;
    }
    case 1:
      return true; // Curriculum is optional
    case 2:
      return true; // Coach is optional
    case 3:
      return state.details.name.trim().length > 0;
    default:
      return false;
  }
}

// ─── Context Creation ────────────────────────────────────────────────────────

const WizardContext = createContext<WizardContextValue | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────

interface WizardProviderProps {
  children: React.ReactNode;
  initialState?: WizardState;
}

export const WizardProvider: React.FC<WizardProviderProps> = ({ children, initialState }) => {
  const [state, setState] = useState<WizardState>(initialState ?? INITIAL_WIZARD_STATE);

  const updateSchedule = useCallback((data: Partial<WizardState['schedule']>) => {
    setState((prev) => ({
      ...prev,
      schedule: { ...prev.schedule, ...data },
    }));
  }, []);

  const updateCurriculum = useCallback((data: Partial<WizardState['curriculum']>) => {
    setState((prev) => ({
      ...prev,
      curriculum: { ...prev.curriculum, ...data },
    }));
  }, []);

  const updateCoach = useCallback((data: Partial<WizardState['coach']>) => {
    setState((prev) => ({
      ...prev,
      coach: { ...prev.coach, ...data },
    }));
  }, []);

  const updateDetails = useCallback((data: Partial<WizardState['details']>) => {
    setState((prev) => ({
      ...prev,
      details: { ...prev.details, ...data },
    }));
  }, []);

  const isStepValid = useCallback(
    (step: number): boolean => validateStep(step, state),
    [state]
  );

  const canGoToStep = useCallback(
    (step: number): boolean => {
      // Can always go to step 0
      if (step <= 0) return true;
      // All steps 0..step-1 must be valid
      for (let i = 0; i < step; i++) {
        if (!validateStep(i, state)) {
          return false;
        }
      }
      return true;
    },
    [state]
  );

  const canGoNext = useCallback((): boolean => {
    if (state.currentStep >= 3) return false;
    return validateStep(state.currentStep, state);
  }, [state]);

  const goToStep = useCallback(
    (step: number) => {
      if (step < 0 || step > 3) return;
      if (!canGoToStep(step)) return;
      setState((prev) => {
        const newCompleted = new Set(prev.completedSteps);
        // Mark current step as completed if valid
        if (validateStep(prev.currentStep, prev)) {
          newCompleted.add(prev.currentStep);
        }
        return { ...prev, currentStep: step, completedSteps: newCompleted };
      });
    },
    [canGoToStep]
  );

  const goNext = useCallback(() => {
    if (state.currentStep >= 3) return;
    if (!validateStep(state.currentStep, state)) return;
    setState((prev) => {
      const newCompleted = new Set(prev.completedSteps);
      newCompleted.add(prev.currentStep);
      return { ...prev, currentStep: prev.currentStep + 1, completedSteps: newCompleted };
    });
  }, [state]);

  const goBack = useCallback(() => {
    if (state.currentStep <= 0) return;
    setState((prev) => ({
      ...prev,
      currentStep: prev.currentStep - 1,
    }));
  }, [state.currentStep]);

  const reset = useCallback(() => {
    setState(initialState ?? INITIAL_WIZARD_STATE);
  }, [initialState]);

  const getSubmitPayload = useCallback((): BatchSubmitPayload => {
    const payload: BatchSubmitPayload = {
      name: state.details.name.trim(),
    };

    // Schedule: existing template or new template
    if (state.schedule.isNewTemplate) {
      payload.newTemplate = {
        name: (state.schedule.templateName ?? '').trim(),
        days_of_week: state.schedule.daysOfWeek,
        start_time: state.schedule.startTime,
        duration: state.schedule.duration,
      };
    } else if (state.schedule.templateId) {
      payload.template_id = state.schedule.templateId;
    }

    // Curriculum (optional)
    if (state.curriculum.courseId) {
      payload.curriculum_id = state.curriculum.courseId;
    }

    // Coach (optional)
    if (state.coach.coachId) {
      payload.assigned_coach_id = state.coach.coachId;
    }

    // Details
    if (state.details.skillLevel) {
      payload.skill_level = state.details.skillLevel;
    }

    if (state.details.capacity !== '' && state.details.capacity > 0) {
      payload.capacity = state.details.capacity;
    }

    return payload;
  }, [state]);

  const value: WizardContextValue = useMemo(
    () => ({
      state,
      updateSchedule,
      updateCurriculum,
      updateCoach,
      updateDetails,
      goToStep,
      goNext,
      goBack,
      canGoNext,
      canGoToStep,
      isStepValid,
      reset,
      getSubmitPayload,
    }),
    [
      state,
      updateSchedule,
      updateCurriculum,
      updateCoach,
      updateDetails,
      goToStep,
      goNext,
      goBack,
      canGoNext,
      canGoToStep,
      isStepValid,
      reset,
      getSubmitPayload,
    ]
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
};

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * useWizard hook
 * Provides access to the wizard context from any child component.
 * Must be used within a WizardProvider.
 */
export const useWizard = (): WizardContextValue => {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
};

export default WizardContext;
