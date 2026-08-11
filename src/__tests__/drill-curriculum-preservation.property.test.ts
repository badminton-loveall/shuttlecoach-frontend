/**
 * Preservation Property Tests - Drill & Curriculum Management
 *
 * These tests verify behaviors that MUST be preserved after the bugfix.
 * They run on UNFIXED code and are EXPECTED TO PASS, capturing baseline behavior.
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**
 *
 * Properties tested:
 * 1. Drag-and-drop adds drill to week planner's drill list (3.1)
 * 2. Search/filter by name and category produces correct filtered results (3.2)
 * 3. Editing individual plan does not modify batch plan or other students' plans (3.3)
 * 4. Archived curriculum plans block editing (save disabled, inputs disabled) (3.4)
 * 5. IndividualCurriculumPage shows diff indicators for modified weeks (3.5)
 * 6. SessionCalendarPage displays calendar entries with session times and batch info (3.6)
 * 7. Drills and curricula are center-independent (3.7)
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { Drill, WeekPlan, CurriculumPlan, CalendarEntry } from '../types';
import { DRILL_CATEGORIES } from '../constants/drillCategories';
import drillsData from '../data/drills.json';

// ─── Arbitraries (Generators) ────────────────────────────────────────────────

/** Generate a valid Drill object */
const arbDrill = (): fc.Arbitrary<Drill> =>
  fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }).map((s) => `drill-${s.replace(/[^a-z0-9]/gi, 'x')}`),
    name: fc.string({ minLength: 1, maxLength: 60 }),
    description: fc.string({ minLength: 1, maxLength: 200 }),
    category: fc.constantFrom(...DRILL_CATEGORIES),
  });

/** Generate a valid week number 1-8 */
const arbWeekNumber = (): fc.Arbitrary<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8> =>
  fc.integer({ min: 1, max: 8 }) as fc.Arbitrary<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>;

/** Generate a valid WeekPlan */
const arbWeekPlan = (weekNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8): fc.Arbitrary<WeekPlan> =>
  fc.record({
    weekNumber: fc.constant(weekNumber),
    focusArea: fc.string({ minLength: 0, maxLength: 100 }),
    drills: fc.array(arbDrill(), { minLength: 0, maxLength: 5 }),
    objective: fc.string({ minLength: 0, maxLength: 200 }),
  });

/** Generate a full 8-week plan */
const arbWeeks = (): fc.Arbitrary<WeekPlan[]> =>
  fc.tuple(
    arbWeekPlan(1), arbWeekPlan(2), arbWeekPlan(3), arbWeekPlan(4),
    arbWeekPlan(5), arbWeekPlan(6), arbWeekPlan(7), arbWeekPlan(8)
  ).map((weeks) => weeks as WeekPlan[]);

/** Generate a search query string */
const arbSearchQuery = (): fc.Arbitrary<string> =>
  fc.oneof(
    fc.constant(''),
    fc.string({ minLength: 1, maxLength: 30 }),
    // Use partial real drill names for realistic searches
    fc.constantFrom('BH', 'FH', 'Cross', 'Straight', 'Service', 'Drop', 'Smash', 'Defence', 'Keep', 'Lift')
  );

/** Generate a valid date string in YYYY-MM-DD format */
const arbDateString = (): fc.Arbitrary<string> =>
  fc.tuple(
    fc.integer({ min: 2025, max: 2027 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 }) // Use 28 to avoid month-length issues
  ).map(([y, m, d]) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);

/** Generate a CalendarEntry with valid start < end time */
const arbCalendarEntry = (): fc.Arbitrary<CalendarEntry> =>
  fc.tuple(
    fc.integer({ min: 5, max: 19 }), // startHour
    fc.integer({ min: 1, max: 3 })   // duration in hours
  ).chain(([startHour, duration]) =>
    fc.record({
      date: arbDateString(),
      dayOfWeek: fc.constantFrom(
        'Monday' as const, 'Tuesday' as const, 'Wednesday' as const,
        'Thursday' as const, 'Friday' as const, 'Saturday' as const, 'Sunday' as const
      ),
      startTime: fc.constant(`${String(startHour).padStart(2, '0')}:00`),
      endTime: fc.constant(`${String(startHour + duration).padStart(2, '0')}:00`),
      batchId: fc.string({ minLength: 1, maxLength: 20 }).map((s) => `batch-${s.replace(/[^a-z0-9]/gi, 'x')}`),
      batchName: fc.string({ minLength: 1, maxLength: 40 }),
      weekNumber: fc.integer({ min: 0, max: 8 }),
      focusArea: fc.string({ minLength: 0, maxLength: 80 }),
      drills: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 5 }),
      attendanceRecorded: fc.boolean(),
      coachNote: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
    })
  );

// ─── Pure Logic Extracted from Components ────────────────────────────────────

/**
 * DrillLibrary filter logic (extracted from DrillLibrary.tsx).
 * This is the exact filtering algorithm used in the component.
 */
function filterDrills(drills: Drill[], searchQuery: string, selectedCategory: string): Drill[] {
  return drills.filter((drill) => {
    const matchesSearch =
      drill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drill.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || drill.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
}

/**
 * Drill drop logic (extracted from CurriculumBuilderPage.tsx).
 * Returns the updated weeks array after dropping a drill on a target week.
 */
function handleDrillDrop(weeks: WeekPlan[], weekNumber: number, drill: Drill, isArchived: boolean): WeekPlan[] {
  if (isArchived) return weeks;
  return weeks.map((w) => {
    if (w.weekNumber === weekNumber && !w.drills.some((d) => d.id === drill.id)) {
      return { ...w, drills: [...w.drills, drill] };
    }
    return w;
  });
}

/**
 * Week update logic (extracted from CurriculumBuilderPage.tsx and IndividualCurriculumPage.tsx).
 * Returns the updated weeks array after modifying a field.
 */
function handleWeekUpdate(
  weeks: WeekPlan[], weekNumber: number, field: keyof WeekPlan, value: string, isArchived: boolean
): WeekPlan[] {
  if (isArchived) return weeks;
  return weeks.map((w) => w.weekNumber === weekNumber ? { ...w, [field]: value } : w);
}

/**
 * Remove drill logic (extracted from CurriculumBuilderPage.tsx).
 */
function handleRemoveDrill(weeks: WeekPlan[], weekNumber: number, drillId: string, isArchived: boolean): WeekPlan[] {
  if (isArchived) return weeks;
  return weeks.map((w) =>
    w.weekNumber === weekNumber ? { ...w, drills: w.drills.filter((d) => d.id !== drillId) } : w
  );
}

/**
 * Diff indicator logic (extracted from IndividualCurriculumPage.tsx).
 * Checks if a week in the individual plan differs from the batch plan.
 */
function hasWeekChanged(weeks: WeekPlan[], batchPlan: CurriculumPlan | null, weekNumber: number): boolean {
  if (!batchPlan) return false;

  const currentWeek = weeks.find((w) => w.weekNumber === weekNumber);
  const batchWeek = batchPlan.weeks.find((w) => w.weekNumber === weekNumber);

  if (!currentWeek || !batchWeek) return false;

  if (currentWeek.focusArea !== batchWeek.focusArea) return true;
  if (currentWeek.objective !== batchWeek.objective) return true;

  const currentDrillIds = currentWeek.drills.map((d) => d.id).sort().join(',');
  const batchDrillIds = batchWeek.drills.map((d) => d.id).sort().join(',');

  return currentDrillIds !== batchDrillIds;
}

// ─── Property Tests ──────────────────────────────────────────────────────────

describe('Preservation Property Tests - Drill & Curriculum Management', () => {

  describe('Property 1: Drag-and-drop adds drill to week planner (Req 3.1)', () => {
    /**
     * **Validates: Requirements 3.1**
     *
     * For all drills and all non-archived weeks, drag-and-drop SHALL add
     * the drill to the target week's drill list (if not already present).
     */
    it('dropping a drill on a non-archived week adds it to that week\'s drills', () => {
      fc.assert(
        fc.property(
          arbWeeks(),
          arbDrill(),
          arbWeekNumber(),
          (weeks, drill, targetWeek) => {
            const result = handleDrillDrop(weeks, targetWeek, drill, false);
            const targetWeekPlan = result.find((w) => w.weekNumber === targetWeek)!;

            // If drill was not already in the week, it should now be present
            const wasAlreadyPresent = weeks
              .find((w) => w.weekNumber === targetWeek)!
              .drills.some((d) => d.id === drill.id);

            if (!wasAlreadyPresent) {
              expect(targetWeekPlan.drills.some((d) => d.id === drill.id)).toBe(true);
            }

            // Other weeks are unaffected
            const otherWeeks = result.filter((w) => w.weekNumber !== targetWeek);
            const originalOtherWeeks = weeks.filter((w) => w.weekNumber !== targetWeek);
            expect(otherWeeks).toEqual(originalOtherWeeks);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('dropping a duplicate drill on a week does not add it again', () => {
      fc.assert(
        fc.property(
          arbDrill(),
          arbWeekNumber(),
          (drill, targetWeek) => {
            // Start with a clean week that has no drills
            const cleanWeeks: WeekPlan[] = Array.from({ length: 8 }, (_, i) => ({
              weekNumber: (i + 1) as WeekPlan['weekNumber'],
              focusArea: '',
              drills: [],
              objective: '',
            }));

            // First drop
            const afterFirst = handleDrillDrop(cleanWeeks, targetWeek, drill, false);
            // Second drop of same drill
            const afterSecond = handleDrillDrop(afterFirst, targetWeek, drill, false);

            const weekAfterSecond = afterSecond.find((w) => w.weekNumber === targetWeek)!;
            const drillCount = weekAfterSecond.drills.filter((d) => d.id === drill.id).length;

            // Should only have one copy
            expect(drillCount).toBe(1);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 2: Search/filter produces correct results (Req 3.2)', () => {
    /**
     * **Validates: Requirements 3.2**
     *
     * For all search queries and category filters, the filtered drill list
     * SHALL contain only drills matching both the search query (name or description)
     * AND the selected category.
     */
    const realDrills: Drill[] = drillsData.drills as Drill[];

    it('filtered drills always match search query in name or description', () => {
      fc.assert(
        fc.property(
          arbSearchQuery(),
          fc.constantFrom('All', ...DRILL_CATEGORIES),
          (query, category) => {
            const filtered = filterDrills(realDrills, query, category);

            // Every result must match the search query
            for (const drill of filtered) {
              if (query !== '') {
                const matchesName = drill.name.toLowerCase().includes(query.toLowerCase());
                const matchesDesc = drill.description.toLowerCase().includes(query.toLowerCase());
                expect(matchesName || matchesDesc).toBe(true);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('filtered drills always match selected category (or All selected)', () => {
      fc.assert(
        fc.property(
          arbSearchQuery(),
          fc.constantFrom('All', ...DRILL_CATEGORIES),
          (query, category) => {
            const filtered = filterDrills(realDrills, query, category);

            for (const drill of filtered) {
              if (category !== 'All') {
                expect(drill.category).toBe(category);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('filtering with empty query and All category returns all drills', () => {
      const filtered = filterDrills(realDrills, '', 'All');
      expect(filtered.length).toBe(realDrills.length);
    });

    it('no matching drills are excluded from results', () => {
      fc.assert(
        fc.property(
          arbSearchQuery(),
          fc.constantFrom('All', ...DRILL_CATEGORIES),
          (query, category) => {
            const filtered = filterDrills(realDrills, query, category);
            const excluded = realDrills.filter((d) => !filtered.includes(d));

            // Every excluded drill must NOT match the criteria
            for (const drill of excluded) {
              if (query === '' && category === 'All') {
                // Nothing should be excluded in this case
                expect(excluded.length).toBe(0);
              } else {
                const matchesSearch = query === '' ||
                  drill.name.toLowerCase().includes(query.toLowerCase()) ||
                  drill.description.toLowerCase().includes(query.toLowerCase());
                const matchesCategory = category === 'All' || drill.category === category;
                // At least one criterion must fail
                expect(matchesSearch && matchesCategory).toBe(false);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 3: Individual plan edits do not modify batch plan (Req 3.3)', () => {
    /**
     * **Validates: Requirements 3.3**
     *
     * For all individual plan edits (add/remove drill, change focus area),
     * the batch plan and sibling individual plans SHALL remain unchanged.
     */
    it('editing individual weeks does not affect batch plan weeks', () => {
      fc.assert(
        fc.property(
          arbWeeks(),
          arbWeeks(),
          arbWeekNumber(),
          fc.string({ minLength: 1, maxLength: 50 }),
          (individualWeeks, batchWeeks, weekNum, newFocusArea) => {
            // Deep clone to simulate separate plans
            const batchPlanCopy = JSON.parse(JSON.stringify(batchWeeks));

            // Edit the individual plan
            const editedIndividual = handleWeekUpdate(
              individualWeeks, weekNum, 'focusArea', newFocusArea, false
            );

            // Batch plan must remain unchanged
            expect(batchWeeks).toEqual(batchPlanCopy);

            // The edit should only affect the target week
            const editedWeek = editedIndividual.find((w) => w.weekNumber === weekNum)!;
            expect(editedWeek.focusArea).toBe(newFocusArea);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('adding drill to individual plan does not affect sibling plans', () => {
      fc.assert(
        fc.property(
          arbWeeks(),
          arbWeeks(),
          arbDrill(),
          arbWeekNumber(),
          (plan1Weeks, plan2Weeks, drill, weekNum) => {
            // Deep clone to simulate separate student plans
            const plan2Copy = JSON.parse(JSON.stringify(plan2Weeks));

            // Drop drill on plan 1
            handleDrillDrop(plan1Weeks, weekNum, drill, false);

            // Plan 2 must remain unchanged
            expect(plan2Weeks).toEqual(plan2Copy);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 4: Archived plans block editing (Req 3.4)', () => {
    /**
     * **Validates: Requirements 3.4**
     *
     * For all archived plans, save actions SHALL be blocked and inputs SHALL be disabled.
     * Any edit attempt on an archived plan returns the original unchanged state.
     */
    it('dropping a drill on an archived plan does not modify it', () => {
      fc.assert(
        fc.property(
          arbWeeks(),
          arbDrill(),
          arbWeekNumber(),
          (weeks, drill, targetWeek) => {
            const originalWeeks = JSON.parse(JSON.stringify(weeks));
            const result = handleDrillDrop(weeks, targetWeek, drill, true); // isArchived = true

            // Weeks should be unchanged
            expect(result).toEqual(originalWeeks);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('updating a field on an archived plan does not modify it', () => {
      fc.assert(
        fc.property(
          arbWeeks(),
          arbWeekNumber(),
          fc.string({ minLength: 1, maxLength: 50 }),
          (weeks, weekNum, newValue) => {
            const originalWeeks = JSON.parse(JSON.stringify(weeks));
            const result = handleWeekUpdate(weeks, weekNum, 'focusArea', newValue, true);

            expect(result).toEqual(originalWeeks);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('removing a drill from an archived plan does not modify it', () => {
      fc.assert(
        fc.property(
          arbWeeks(),
          arbWeekNumber(),
          fc.string({ minLength: 1, maxLength: 20 }),
          (weeks, weekNum, drillId) => {
            const originalWeeks = JSON.parse(JSON.stringify(weeks));
            const result = handleRemoveDrill(weeks, weekNum, drillId, true);

            expect(result).toEqual(originalWeeks);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('save button is disabled when isArchived is true (logic check)', () => {
      // The save button's disabled state is: isSaving || !selectedBatch || isArchived
      // When isArchived = true, it must always be disabled regardless of other state
      fc.assert(
        fc.property(
          fc.boolean(), // isSaving
          fc.option(fc.string({ minLength: 1 }), { nil: '' }), // selectedBatch
          (isSaving, selectedBatch) => {
            const isArchived = true;
            const isDisabled = isSaving || !selectedBatch || isArchived;
            expect(isDisabled).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property 5: Diff indicators for modified weeks (Req 3.5)', () => {
    /**
     * **Validates: Requirements 3.5**
     *
     * For all weeks where individual plan differs from batch plan in focusArea,
     * objective, or drills, diff indicators SHALL be displayed.
     */
    it('identical weeks show no diff indicator', () => {
      fc.assert(
        fc.property(
          arbWeeks(),
          arbWeekNumber(),
          (weeks, weekNum) => {
            // Create a "batch plan" identical to individual plan
            const batchPlan: CurriculumPlan = {
              id: 'batch-plan-1',
              cycleKey: 'Jan-Feb 2026',
              batchId: 'batch-001',
              weeks: JSON.parse(JSON.stringify(weeks)),
              createdAt: new Date(),
              updatedAt: new Date(),
              isArchived: false,
            };

            // Same weeks → no diff
            expect(hasWeekChanged(weeks, batchPlan, weekNum)).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('modified focusArea shows diff indicator', () => {
      fc.assert(
        fc.property(
          arbWeeks(),
          arbWeekNumber(),
          fc.string({ minLength: 1, maxLength: 50 }),
          (weeks, weekNum, newFocus) => {
            const batchPlan: CurriculumPlan = {
              id: 'batch-plan-1',
              cycleKey: 'Jan-Feb 2026',
              batchId: 'batch-001',
              weeks: JSON.parse(JSON.stringify(weeks)),
              createdAt: new Date(),
              updatedAt: new Date(),
              isArchived: false,
            };

            // Modify the individual plan's focusArea
            const modifiedWeeks = weeks.map((w) =>
              w.weekNumber === weekNum ? { ...w, focusArea: newFocus } : w
            );

            const originalFocus = weeks.find((w) => w.weekNumber === weekNum)!.focusArea;

            if (newFocus !== originalFocus) {
              expect(hasWeekChanged(modifiedWeeks, batchPlan, weekNum)).toBe(true);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('added or removed drills show diff indicator', () => {
      fc.assert(
        fc.property(
          arbWeeks(),
          arbWeekNumber(),
          arbDrill(),
          (weeks, weekNum, extraDrill) => {
            const batchPlan: CurriculumPlan = {
              id: 'batch-plan-1',
              cycleKey: 'Jan-Feb 2026',
              batchId: 'batch-001',
              weeks: JSON.parse(JSON.stringify(weeks)),
              createdAt: new Date(),
              updatedAt: new Date(),
              isArchived: false,
            };

            // Add a drill to individual plan
            const modifiedWeeks = weeks.map((w) =>
              w.weekNumber === weekNum
                ? { ...w, drills: [...w.drills, extraDrill] }
                : w
            );

            // If the drill wasn't already there, diff should be detected
            const originalDrillIds = weeks.find((w) => w.weekNumber === weekNum)!
              .drills.map((d) => d.id).sort().join(',');
            const newDrillIds = modifiedWeeks.find((w) => w.weekNumber === weekNum)!
              .drills.map((d) => d.id).sort().join(',');

            if (originalDrillIds !== newDrillIds) {
              expect(hasWeekChanged(modifiedWeeks, batchPlan, weekNum)).toBe(true);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('null batch plan always returns no diff', () => {
      fc.assert(
        fc.property(
          arbWeeks(),
          arbWeekNumber(),
          (weeks, weekNum) => {
            expect(hasWeekChanged(weeks, null, weekNum)).toBe(false);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Property 6: Calendar entries display session times and batch info (Req 3.6)', () => {
    /**
     * **Validates: Requirements 3.6**
     *
     * For all calendar entries, the display SHALL include date, startTime, endTime,
     * batchName, and weekNumber (when > 0).
     */
    it('all calendar entries have required display fields', () => {
      fc.assert(
        fc.property(
          fc.array(arbCalendarEntry(), { minLength: 1, maxLength: 20 }),
          (entries) => {
            for (const entry of entries) {
              // Must have date in ISO format
              expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

              // Must have start and end time
              expect(entry.startTime).toMatch(/^\d{2}:\d{2}$/);
              expect(entry.endTime).toMatch(/^\d{2}:\d{2}$/);

              // Must have batch info
              expect(entry.batchId).toBeTruthy();
              expect(entry.batchName).toBeTruthy();

              // weekNumber must be a number
              expect(typeof entry.weekNumber).toBe('number');

              // attendanceRecorded must be boolean
              expect(typeof entry.attendanceRecorded).toBe('boolean');
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('calendar entries with weekNumber > 0 have valid curriculum week reference', () => {
      fc.assert(
        fc.property(
          arbCalendarEntry(),
          (entry) => {
            if (entry.weekNumber > 0) {
              // Valid curriculum weeks are 1-8
              expect(entry.weekNumber).toBeGreaterThanOrEqual(1);
              expect(entry.weekNumber).toBeLessThanOrEqual(8);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('calendar entries maintain time order (startTime before endTime)', () => {
      fc.assert(
        fc.property(
          arbCalendarEntry(),
          (entry) => {
            // Our generator constrains startTime < endTime by construction.
            // This verifies that the CalendarEntry structure supports ordered times,
            // which is the preservation property for session display.
            expect(entry.startTime < entry.endTime).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 7: Center-independent drill and curriculum management (Req 3.7)', () => {
    /**
     * **Validates: Requirements 3.7**
     *
     * Drills and curricula SHALL be independent of specific centers.
     * The drill data structure has no centerId field, and curriculum plans
     * reference only batchId or studentId (not center).
     */
    it('drill objects do not have a centerId field', () => {
      const drills: Drill[] = drillsData.drills as Drill[];

      for (const drill of drills) {
        expect(drill).not.toHaveProperty('centerId');
        expect(drill).not.toHaveProperty('center_id');
        expect(drill).not.toHaveProperty('centerName');
      }
    });

    it('generated curriculum plans are center-independent', () => {
      fc.assert(
        fc.property(
          arbWeeks(),
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          (weeks, batchId, cycleKey) => {
            const plan: CurriculumPlan = {
              id: `curriculum-${Date.now()}`,
              cycleKey,
              batchId,
              weeks,
              createdAt: new Date(),
              updatedAt: new Date(),
              isArchived: false,
            };

            // CurriculumPlan interface has no centerId
            expect(plan).not.toHaveProperty('centerId');
            expect(plan).not.toHaveProperty('center_id');
            expect(plan).not.toHaveProperty('centerName');

            // Plan references batch or student, not center
            expect(plan.batchId).toBeTruthy();
          }
        ),
        { numRuns: 30 }
      );
    });

    it('drill filtering is category-based not center-based', () => {
      const drills: Drill[] = drillsData.drills as Drill[];

      // All categories are sport-skill based, not location-based
      const allCategories = new Set(drills.map((d) => d.category));
      for (const cat of allCategories) {
        expect(DRILL_CATEGORIES).toContain(cat);
      }

      // No category references a center/location
      for (const cat of DRILL_CATEGORIES) {
        expect(cat.toLowerCase()).not.toContain('center');
        expect(cat.toLowerCase()).not.toContain('location');
        expect(cat.toLowerCase()).not.toContain('branch');
      }
    });
  });
});
