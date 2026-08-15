/**
 * Property-Based Test: Back Navigation Preserves Wizard State
 *
 * Feature: batch-setup-wizard, Property 1: Back navigation preserves wizard state
 *
 * **Validates: Requirements 1.4**
 *
 * For any wizard state with data entered across one or more steps,
 * navigating backward (goBack) and then forward (goNext) SHALL produce
 * a wizard state identical to the original state for all step data fields.
 *
 * For states at currentStep 0, goBack is a no-op — state is preserved.
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { WizardProvider, useWizard, INITIAL_WIZARD_STATE } from '../WizardContext';
import type { WizardState } from '../WizardContext';
import React from 'react';

// ─── Arbitraries (Generators) ────────────────────────────────────────────────

/** Valid duration options as defined in the wizard */
const DURATION_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4] as const;

/** Skill level options */
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Professional', ''] as const;

/** Generate a valid time string in HH:mm format */
const arbTimeString = (): fc.Arbitrary<string> =>
  fc.tuple(
    fc.integer({ min: 0, max: 23 }),
    fc.integer({ min: 0, max: 59 })
  ).map(([h, m]) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);

/** Generate a non-empty trimmed string (for required name fields) */
const arbNonEmptyName = (): fc.Arbitrary<string> =>
  fc.string({ minLength: 1, maxLength: 30 })
    .filter((s) => s.trim().length > 0);

/** Generate valid days of week array (at least 1 day) */
const arbDaysOfWeek = (): fc.Arbitrary<number[]> =>
  fc.uniqueArray(fc.integer({ min: 0, max: 6 }), { minLength: 1, maxLength: 7 });

/**
 * Generate a valid schedule that passes Step 0 validation.
 * Uses the "existing template" path (templateId set, isNewTemplate = false).
 */
const arbValidScheduleExisting = (): fc.Arbitrary<WizardState['schedule']> =>
  fc.record({
    templateId: fc.string({ minLength: 1, maxLength: 20 }).map((s) => `tmpl-${s.replace(/[^a-z0-9]/gi, 'x')}`),
    templateName: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: null }),
    daysOfWeek: fc.uniqueArray(fc.integer({ min: 0, max: 6 }), { minLength: 0, maxLength: 7 }),
    startTime: fc.oneof(arbTimeString(), fc.constant('')),
    duration: fc.oneof(fc.constantFrom(...DURATION_OPTIONS), fc.constant(0)),
    isNewTemplate: fc.constant(false),
  });

/**
 * Generate a valid schedule that passes Step 0 validation.
 * Uses the "new template" path (isNewTemplate = true, all fields filled).
 */
const arbValidScheduleNew = (): fc.Arbitrary<WizardState['schedule']> =>
  fc.record({
    templateId: fc.constant(null),
    templateName: arbNonEmptyName(),
    daysOfWeek: arbDaysOfWeek(),
    startTime: arbTimeString(),
    duration: fc.constantFrom(...DURATION_OPTIONS),
    isNewTemplate: fc.constant(true),
  });

/** Generate a valid schedule (either existing template or new template) */
const arbValidSchedule = (): fc.Arbitrary<WizardState['schedule']> =>
  fc.oneof(arbValidScheduleExisting(), arbValidScheduleNew());

/** Generate random curriculum data */
const arbCurriculum = (): fc.Arbitrary<WizardState['curriculum']> =>
  fc.record({
    courseId: fc.option(
      fc.string({ minLength: 1, maxLength: 20 }).map((s) => `course-${s.replace(/[^a-z0-9]/gi, 'x')}`),
      { nil: null }
    ),
    courseName: fc.option(fc.string({ minLength: 1, maxLength: 40 }), { nil: null }),
    weekCount: fc.option(fc.integer({ min: 1, max: 12 }), { nil: null }),
  });

/** Generate random coach data */
const arbCoach = (): fc.Arbitrary<WizardState['coach']> =>
  fc.record({
    coachId: fc.option(
      fc.string({ minLength: 1, maxLength: 20 }).map((s) => `coach-${s.replace(/[^a-z0-9]/gi, 'x')}`),
      { nil: null }
    ),
    coachName: fc.option(fc.string({ minLength: 1, maxLength: 40 }), { nil: null }),
    coachRole: fc.option(fc.constantFrom('HEAD_COACH', 'ASSISTANT_COACH'), { nil: null }),
  });

/** Generate random details data */
const arbDetails = (): fc.Arbitrary<WizardState['details']> =>
  fc.record({
    name: fc.string({ minLength: 0, maxLength: 40 }),
    skillLevel: fc.constantFrom(...SKILL_LEVELS) as fc.Arbitrary<WizardState['details']['skillLevel']>,
    capacity: fc.oneof(
      fc.integer({ min: 1, max: 50 }),
      fc.constant('' as const)
    ) as fc.Arbitrary<number | ''>,
  });

/**
 * Generate a full valid wizard state at a specific step (1, 2, or 3).
 * Step 0 schedule is always valid so that goBack+goNext works at step > 0.
 */
const arbWizardStateAtStep = (step: number): fc.Arbitrary<WizardState> =>
  fc.record({
    mode: fc.constantFrom('create' as const, 'edit' as const),
    batchId: fc.option(fc.string({ minLength: 1, maxLength: 10 }).map((s) => `batch-${s}`), { nil: undefined }),
    currentStep: fc.constant(step),
    completedSteps: fc.constant(new Set<number>(Array.from({ length: step }, (_, i) => i))),
    schedule: arbValidSchedule(),
    curriculum: arbCurriculum(),
    coach: arbCoach(),
    details: arbDetails(),
  });

/**
 * Generate a wizard state at step 0 (goBack is a no-op here).
 * Schedule can be valid or invalid — doesn't matter for the no-op test.
 */
const arbWizardStateAtStepZero = (): fc.Arbitrary<WizardState> =>
  fc.record({
    mode: fc.constantFrom('create' as const, 'edit' as const),
    batchId: fc.option(fc.string({ minLength: 1, maxLength: 10 }).map((s) => `batch-${s}`), { nil: undefined }),
    currentStep: fc.constant(0),
    completedSteps: fc.constant(new Set<number>()),
    schedule: fc.oneof(arbValidSchedule(), fc.constant(INITIAL_WIZARD_STATE.schedule)),
    curriculum: arbCurriculum(),
    coach: arbCoach(),
    details: arbDetails(),
  });

// ─── Helper ──────────────────────────────────────────────────────────────────

function createWrapper(initialState: WizardState) {
  return ({ children }: { children: React.ReactNode }) => (
    <WizardProvider initialState={initialState}>{children}</WizardProvider>
  );
}

// ─── Property Tests ──────────────────────────────────────────────────────────

describe('Feature: batch-setup-wizard, Property 1: Back navigation preserves wizard state', () => {
  /**
   * **Validates: Requirements 1.4**
   *
   * For states at currentStep > 0, goBack() then goNext() must preserve
   * all step data fields (schedule, curriculum, coach, details).
   */
  it('goBack then goNext preserves all step data at step 1', () => {
    fc.assert(
      fc.property(
        arbWizardStateAtStep(1),
        (wizardState) => {
          const { result } = renderHook(() => useWizard(), {
            wrapper: createWrapper(wizardState),
          });

          // Capture state before navigation
          const before = result.current.state;

          // Navigate back then forward
          act(() => { result.current.goBack(); });
          act(() => { result.current.goNext(); });

          const after = result.current.state;

          // All data fields must be unchanged
          expect(after.schedule).toEqual(before.schedule);
          expect(after.curriculum).toEqual(before.curriculum);
          expect(after.coach).toEqual(before.coach);
          expect(after.details).toEqual(before.details);
          expect(after.currentStep).toBe(before.currentStep);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('goBack then goNext preserves all step data at step 2', () => {
    fc.assert(
      fc.property(
        arbWizardStateAtStep(2),
        (wizardState) => {
          const { result } = renderHook(() => useWizard(), {
            wrapper: createWrapper(wizardState),
          });

          const before = result.current.state;

          act(() => { result.current.goBack(); });
          act(() => { result.current.goNext(); });

          const after = result.current.state;

          // All data fields must be unchanged
          expect(after.schedule).toEqual(before.schedule);
          expect(after.curriculum).toEqual(before.curriculum);
          expect(after.coach).toEqual(before.coach);
          expect(after.details).toEqual(before.details);
          expect(after.currentStep).toBe(before.currentStep);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('goBack then goNext preserves all step data at step 3', () => {
    fc.assert(
      fc.property(
        arbWizardStateAtStep(3),
        (wizardState) => {
          const { result } = renderHook(() => useWizard(), {
            wrapper: createWrapper(wizardState),
          });

          const before = result.current.state;

          act(() => { result.current.goBack(); });
          act(() => { result.current.goNext(); });

          const after = result.current.state;

          // All data fields must be unchanged
          expect(after.schedule).toEqual(before.schedule);
          expect(after.curriculum).toEqual(before.curriculum);
          expect(after.coach).toEqual(before.coach);
          expect(after.details).toEqual(before.details);
          expect(after.currentStep).toBe(before.currentStep);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * At step 0, goBack is a no-op. The state must remain completely unchanged.
   */
  it('goBack at step 0 is a no-op — state is preserved', () => {
    fc.assert(
      fc.property(
        arbWizardStateAtStepZero(),
        (wizardState) => {
          const { result } = renderHook(() => useWizard(), {
            wrapper: createWrapper(wizardState),
          });

          const before = result.current.state;

          act(() => { result.current.goBack(); });

          const after = result.current.state;

          // Entire state must remain unchanged
          expect(after.schedule).toEqual(before.schedule);
          expect(after.curriculum).toEqual(before.curriculum);
          expect(after.coach).toEqual(before.coach);
          expect(after.details).toEqual(before.details);
          expect(after.currentStep).toBe(0);
          expect(after.mode).toBe(before.mode);
        }
      ),
      { numRuns: 100 }
    );
  });
});
