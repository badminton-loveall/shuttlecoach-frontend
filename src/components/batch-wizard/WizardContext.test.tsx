import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WizardProvider, useWizard, validateStep, INITIAL_WIZARD_STATE } from './WizardContext';
import type { WizardState } from './WizardContext';
import React from 'react';

/**
 * Unit tests for WizardContext — state management, validation, and navigation.
 * Requirements: 1.3, 1.4, 1.6, 2.5
 */

function createWrapper(initialState?: WizardState) {
  return ({ children }: { children: React.ReactNode }) => (
    <WizardProvider initialState={initialState}>{children}</WizardProvider>
  );
}

describe('WizardContext', () => {
  describe('validateStep', () => {
    it('Step 0: invalid with empty state', () => {
      expect(validateStep(0, INITIAL_WIZARD_STATE)).toBe(false);
    });

    it('Step 0: valid when templateId is set (existing template)', () => {
      const state: WizardState = {
        ...INITIAL_WIZARD_STATE,
        schedule: {
          ...INITIAL_WIZARD_STATE.schedule,
          templateId: 'tmpl-123',
          isNewTemplate: false,
        },
      };
      expect(validateStep(0, state)).toBe(true);
    });

    it('Step 0: valid when new template has all required fields', () => {
      const state: WizardState = {
        ...INITIAL_WIZARD_STATE,
        schedule: {
          templateId: null,
          templateName: 'Morning Session',
          daysOfWeek: [1, 3, 5],
          startTime: '06:00',
          duration: 1.5,
          isNewTemplate: true,
        },
      };
      expect(validateStep(0, state)).toBe(true);
    });

    it('Step 0: invalid when new template missing days', () => {
      const state: WizardState = {
        ...INITIAL_WIZARD_STATE,
        schedule: {
          templateId: null,
          templateName: 'Morning Session',
          daysOfWeek: [],
          startTime: '06:00',
          duration: 1.5,
          isNewTemplate: true,
        },
      };
      expect(validateStep(0, state)).toBe(false);
    });

    it('Step 0: invalid when new template missing name', () => {
      const state: WizardState = {
        ...INITIAL_WIZARD_STATE,
        schedule: {
          templateId: null,
          templateName: '  ',
          daysOfWeek: [1],
          startTime: '06:00',
          duration: 2,
          isNewTemplate: true,
        },
      };
      expect(validateStep(0, state)).toBe(false);
    });

    it('Step 1: always valid (optional)', () => {
      expect(validateStep(1, INITIAL_WIZARD_STATE)).toBe(true);
    });

    it('Step 2: always valid (optional)', () => {
      expect(validateStep(2, INITIAL_WIZARD_STATE)).toBe(true);
    });

    it('Step 3: invalid with empty name', () => {
      expect(validateStep(3, INITIAL_WIZARD_STATE)).toBe(false);
    });

    it('Step 3: invalid with whitespace-only name', () => {
      const state: WizardState = {
        ...INITIAL_WIZARD_STATE,
        details: { ...INITIAL_WIZARD_STATE.details, name: '   ' },
      };
      expect(validateStep(3, state)).toBe(false);
    });

    it('Step 3: valid with non-empty trimmed name', () => {
      const state: WizardState = {
        ...INITIAL_WIZARD_STATE,
        details: { ...INITIAL_WIZARD_STATE.details, name: 'Batch A' },
      };
      expect(validateStep(3, state)).toBe(true);
    });
  });

  describe('useWizard hook', () => {
    it('throws when used outside WizardProvider', () => {
      expect(() => {
        renderHook(() => useWizard());
      }).toThrow('useWizard must be used within a WizardProvider');
    });

    it('provides initial state', () => {
      const { result } = renderHook(() => useWizard(), { wrapper: createWrapper() });
      expect(result.current.state.mode).toBe('create');
      expect(result.current.state.currentStep).toBe(0);
    });
  });

  describe('updateSchedule', () => {
    it('merges partial schedule data', () => {
      const { result } = renderHook(() => useWizard(), { wrapper: createWrapper() });

      act(() => {
        result.current.updateSchedule({ templateId: 'tmpl-1', templateName: 'Evening' });
      });

      expect(result.current.state.schedule.templateId).toBe('tmpl-1');
      expect(result.current.state.schedule.templateName).toBe('Evening');
      // Other fields unchanged
      expect(result.current.state.schedule.daysOfWeek).toEqual([]);
    });
  });

  describe('updateCurriculum', () => {
    it('merges partial curriculum data', () => {
      const { result } = renderHook(() => useWizard(), { wrapper: createWrapper() });

      act(() => {
        result.current.updateCurriculum({ courseId: 'course-1', courseName: 'Basics' });
      });

      expect(result.current.state.curriculum.courseId).toBe('course-1');
      expect(result.current.state.curriculum.courseName).toBe('Basics');
    });
  });

  describe('updateCoach', () => {
    it('merges partial coach data', () => {
      const { result } = renderHook(() => useWizard(), { wrapper: createWrapper() });

      act(() => {
        result.current.updateCoach({ coachId: 'coach-1', coachName: 'John', coachRole: 'HEAD_COACH' });
      });

      expect(result.current.state.coach.coachId).toBe('coach-1');
      expect(result.current.state.coach.coachName).toBe('John');
      expect(result.current.state.coach.coachRole).toBe('HEAD_COACH');
    });
  });

  describe('updateDetails', () => {
    it('merges partial details data', () => {
      const { result } = renderHook(() => useWizard(), { wrapper: createWrapper() });

      act(() => {
        result.current.updateDetails({ name: 'Advanced Batch', capacity: 12 });
      });

      expect(result.current.state.details.name).toBe('Advanced Batch');
      expect(result.current.state.details.capacity).toBe(12);
    });
  });

  describe('navigation', () => {
    function createValidScheduleState(): WizardState {
      return {
        ...INITIAL_WIZARD_STATE,
        schedule: {
          templateId: 'tmpl-1',
          templateName: 'Morning',
          daysOfWeek: [1, 3, 5],
          startTime: '07:00',
          duration: 2,
          isNewTemplate: false,
        },
      };
    }

    it('goNext advances step when current step is valid', () => {
      const { result } = renderHook(() => useWizard(), {
        wrapper: createWrapper(createValidScheduleState()),
      });

      act(() => {
        result.current.goNext();
      });

      expect(result.current.state.currentStep).toBe(1);
      expect(result.current.state.completedSteps.has(0)).toBe(true);
    });

    it('goNext does NOT advance when current step is invalid', () => {
      const { result } = renderHook(() => useWizard(), { wrapper: createWrapper() });

      act(() => {
        result.current.goNext(); // Step 0 invalid — no template selected
      });

      expect(result.current.state.currentStep).toBe(0);
    });

    it('goBack decrements step without validation', () => {
      const state = { ...createValidScheduleState(), currentStep: 2 };
      const { result } = renderHook(() => useWizard(), { wrapper: createWrapper(state) });

      act(() => {
        result.current.goBack();
      });

      expect(result.current.state.currentStep).toBe(1);
    });

    it('goBack does not go below 0', () => {
      const { result } = renderHook(() => useWizard(), { wrapper: createWrapper() });

      act(() => {
        result.current.goBack();
      });

      expect(result.current.state.currentStep).toBe(0);
    });

    it('goBack preserves all step data (Requirement 1.4)', () => {
      const state: WizardState = {
        ...createValidScheduleState(),
        currentStep: 1,
        curriculum: { courseId: 'c-1', courseName: 'Advanced', weekCount: 8 },
      };
      const { result } = renderHook(() => useWizard(), { wrapper: createWrapper(state) });

      act(() => {
        result.current.goBack();
      });

      // All data preserved
      expect(result.current.state.schedule.templateId).toBe('tmpl-1');
      expect(result.current.state.curriculum.courseId).toBe('c-1');
    });

    it('canGoToStep returns true when all preceding steps valid', () => {
      const { result } = renderHook(() => useWizard(), {
        wrapper: createWrapper(createValidScheduleState()),
      });

      // Step 0 is valid, Step 1 and 2 are optional (always valid)
      expect(result.current.canGoToStep(0)).toBe(true);
      expect(result.current.canGoToStep(1)).toBe(true);
      expect(result.current.canGoToStep(2)).toBe(true);
      expect(result.current.canGoToStep(3)).toBe(true);
    });

    it('canGoToStep returns false when a preceding step is invalid', () => {
      const { result } = renderHook(() => useWizard(), { wrapper: createWrapper() });

      // Step 0 is invalid (no template)
      expect(result.current.canGoToStep(0)).toBe(true); // Can always go to step 0
      expect(result.current.canGoToStep(1)).toBe(false);
      expect(result.current.canGoToStep(2)).toBe(false);
      expect(result.current.canGoToStep(3)).toBe(false);
    });

    it('goToStep navigates when allowed', () => {
      const { result } = renderHook(() => useWizard(), {
        wrapper: createWrapper(createValidScheduleState()),
      });

      act(() => {
        result.current.goToStep(3);
      });

      expect(result.current.state.currentStep).toBe(3);
    });

    it('goToStep does NOT navigate when preceding steps invalid', () => {
      const { result } = renderHook(() => useWizard(), { wrapper: createWrapper() });

      act(() => {
        result.current.goToStep(2);
      });

      expect(result.current.state.currentStep).toBe(0); // Didn't move
    });

    it('canGoNext returns false on last step', () => {
      const state: WizardState = {
        ...createValidScheduleState(),
        currentStep: 3,
        details: { name: 'Batch X', skillLevel: 'Beginner', capacity: 10 },
      };
      const { result } = renderHook(() => useWizard(), { wrapper: createWrapper(state) });

      expect(result.current.canGoNext()).toBe(false);
    });
  });

  describe('reset', () => {
    it('resets state to initial', () => {
      const { result } = renderHook(() => useWizard(), { wrapper: createWrapper() });

      act(() => {
        result.current.updateSchedule({ templateId: 'tmpl-1' });
        result.current.updateDetails({ name: 'Test' });
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.state.schedule.templateId).toBeNull();
      expect(result.current.state.details.name).toBe('');
    });
  });

  describe('getSubmitPayload', () => {
    it('builds payload with existing template', () => {
      const state: WizardState = {
        ...INITIAL_WIZARD_STATE,
        schedule: {
          templateId: 'tmpl-abc',
          templateName: 'Morning',
          daysOfWeek: [1, 3, 5],
          startTime: '07:00',
          duration: 2,
          isNewTemplate: false,
        },
        curriculum: { courseId: 'course-xyz', courseName: 'Intermediate', weekCount: 8 },
        coach: { coachId: 'coach-1', coachName: 'Alex', coachRole: 'HEAD_COACH' },
        details: { name: '  Morning Advanced  ', skillLevel: 'Advanced', capacity: 15 },
      };

      const { result } = renderHook(() => useWizard(), { wrapper: createWrapper(state) });
      const payload = result.current.getSubmitPayload();

      expect(payload.name).toBe('Morning Advanced');
      expect(payload.template_id).toBe('tmpl-abc');
      expect(payload.curriculum_id).toBe('course-xyz');
      expect(payload.assigned_coach_id).toBe('coach-1');
      expect(payload.skill_level).toBe('Advanced');
      expect(payload.capacity).toBe(15);
      expect(payload.newTemplate).toBeUndefined();
    });

    it('builds payload with new template', () => {
      const state: WizardState = {
        ...INITIAL_WIZARD_STATE,
        schedule: {
          templateId: null,
          templateName: 'Evening Slot',
          daysOfWeek: [2, 4],
          startTime: '18:00',
          duration: 1.5,
          isNewTemplate: true,
        },
        details: { name: 'Evening Batch', skillLevel: '', capacity: '' },
      };

      const { result } = renderHook(() => useWizard(), { wrapper: createWrapper(state) });
      const payload = result.current.getSubmitPayload();

      expect(payload.name).toBe('Evening Batch');
      expect(payload.template_id).toBeUndefined();
      expect(payload.newTemplate).toEqual({
        name: 'Evening Slot',
        days_of_week: [2, 4],
        start_time: '18:00',
        duration: 1.5,
      });
      expect(payload.skill_level).toBeUndefined();
      expect(payload.capacity).toBeUndefined();
    });

    it('omits optional fields when not set', () => {
      const state: WizardState = {
        ...INITIAL_WIZARD_STATE,
        schedule: {
          templateId: 'tmpl-1',
          templateName: null,
          daysOfWeek: [],
          startTime: '',
          duration: 0,
          isNewTemplate: false,
        },
        details: { name: 'Simple Batch', skillLevel: '', capacity: '' },
      };

      const { result } = renderHook(() => useWizard(), { wrapper: createWrapper(state) });
      const payload = result.current.getSubmitPayload();

      expect(payload.name).toBe('Simple Batch');
      expect(payload.template_id).toBe('tmpl-1');
      expect(payload.curriculum_id).toBeUndefined();
      expect(payload.assigned_coach_id).toBeUndefined();
      expect(payload.skill_level).toBeUndefined();
      expect(payload.capacity).toBeUndefined();
    });
  });
});
