# Implementation Plan

## Overview

Fix the drill/curriculum management system's data source inconsistencies: DrillLibrary reads from static JSON instead of the API, CurriculumBuilderPage persists to localStorage instead of the backend, calendar views don't populate drills from assigned curricula, and curriculum reassignment lacks a progress-reset warning. This plan follows the exploratory bugfix workflow: write tests to confirm the bug, write preservation tests to protect existing behavior, implement the fix, then validate.

## Tasks

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Data Source Inconsistency and Missing Propagation
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to the concrete failing cases:
    - DrillLibrary reads from static JSON instead of API
    - CurriculumBuilderPage persists to localStorage instead of API
    - Calendar entries have empty drills[] for students with assigned curricula
    - Curriculum reassignment proceeds without confirmation when student has progress
  - Test that DrillLibrary makes an API call to `GET /api/drills` (from Bug Condition: `drillLibraryReadsStaticJSON = DrillLibrary.dataSource == 'src/data/drills.json'`)
  - Test that CurriculumBuilderPage save calls `POST /api/curriculum` (from Bug Condition: `curriculumBuilderWritesToLocalStorage = CurriculumBuilderPage.persistTarget == 'localStorage'`)
  - Test that SessionCalendarPage entries include populated `drills[]` from assigned curriculum (from Bug Condition: `calendarMissingCurriculumDrills`)
  - Test that reassigning curriculum for student with progress shows confirmation dialog (from Bug Condition: `reassignmentMissingWarning`)
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests FAIL (this is correct - it proves the bug exists)
  - Document counterexamples found:
    - "DrillLibrary renders drills without any network request (static JSON import)"
    - "CurriculumBuilderPage.handleSaveBatchPlan calls localStorage.setItem instead of apiClient.post"
    - "Calendar entries return drills: [] for students with assigned curricula"
    - "Curriculum reassignment proceeds without confirmation dialog"
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Drag-and-Drop, Filter, Archived, and Diff Indicators
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: DrillLibrary drag-and-drop adds drill to week planner's drill list on unfixed code
  - Observe: DrillLibrary search/filter by name and category produces correct filtered results on unfixed code
  - Observe: Editing an individual plan does not modify the batch plan or other students' plans on unfixed code
  - Observe: Archived curriculum plans block editing (save disabled, inputs disabled) on unfixed code
  - Observe: IndividualCurriculumPage shows diff indicators for weeks modified from batch plan on unfixed code
  - Observe: SessionCalendarPage displays calendar entries with session times and batch info on unfixed code
  - Observe: Drills and curricula are center-independent (coaches manage globally) on unfixed code
  - Write property-based tests:
    - For all drill items rendered in DrillLibrary, dragging onto a week planner adds the drill to that week's list
    - For all search queries and category filters, the filtered drill list matches expected name/description/category criteria
    - For all individual plan edits (add/remove drill, change focus), the batch plan and sibling plans remain unchanged
    - For all archived plans, save actions are blocked and inputs are disabled
    - For all weeks where individual plan differs from batch plan, diff indicators are displayed
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 3. Fix DrillLibrary to use API instead of static JSON

  - [ ] 3.1 Replace static JSON import with API fetch in DrillLibrary
    - Remove `import drillsData from '../data/drills.json'` from `src/components/DrillLibrary.tsx`
    - Remove `const drills: Drill[] = drillsData.drills as Drill[]` usage
    - Add API data fetching using `apiClient.get('/drills')` or create a `useDrills` hook
    - Add loading skeleton state while fetching drills
    - Add error state with retry button on fetch failure
    - Accept optional `refreshTrigger` prop to allow parent components to trigger refetch
    - _Bug_Condition: isBugCondition(input) where input.context == 'DrillLibrary' AND DrillLibrary.dataSource == 'src/data/drills.json'_
    - _Expected_Behavior: DrillLibrary fetches from GET /api/drills and displays current API state_
    - _Preservation: Drag-and-drop, search/filter, category selection must continue to work_
    - _Requirements: 2.1, 2.2, 3.1, 3.2_

- [ ] 4. Fix CurriculumBuilderPage to use API instead of localStorage

  - [ ] 4.1 Replace localStorage persistence with API calls in CurriculumBuilderPage
    - Remove all `localStorage.getItem('curriculumPlans')` reads
    - Remove all `localStorage.setItem('curriculumPlans', ...)` writes
    - Remove `import curriculumData from '../data/curriculum.json'` and `import studentsData from '../data/students.json'`
    - Integrate `useCurriculum` hook filtered by `batchId` and `cycleKey` for data loading
    - Replace `handleSaveBatchPlan` to call `createPlan({ cycleKey, batchId, weeks })` via API
    - After batch plan creation, call `cloneBatchPlan(batchPlanId, { batchId })` to generate individual student plans server-side
    - Use `useBatches` hook for student list instead of static data
    - Add loading/error states for API data fetching
    - _Bug_Condition: isBugCondition(input) where input.context == 'CurriculumBuilderPage' AND (persistTarget == 'localStorage' OR dataSource == 'localStorage')_
    - _Expected_Behavior: Plan persisted via POST /api/curriculum, individual plans cloned via POST /api/curriculum/:id/clone, accessible from any browser/device_
    - _Preservation: Week tab navigation, batch selection dropdowns, cycle selectors must continue to work_
    - _Requirements: 2.3, 2.4, 2.5_

- [ ] 5. Fix calendar API to join curriculum drill data

  - [ ] 5.1 Update backend `/api/session-calendar` to populate drills from assigned curriculum
    - In the API project, modify the session-calendar endpoint to query `curriculum_plans` for matching `batch_id`/`student_id` + `cycle_key`
    - Populate `drills[]` and `focusArea` from the plan's `weeks[weekNumber]` data when building calendar entries
    - Map week number to session date using curriculum week mapping or cycle start date calculation
    - Ensure calendar entries for students without assigned curricula continue to work (empty drills is acceptable)
    - _Bug_Condition: isBugCondition(input) where input.context == 'SessionCalendarPage' AND calendarMissingCurriculumDrills_
    - _Expected_Behavior: Calendar entries include populated drills[] and focusArea from assigned curriculum plan_
    - _Preservation: SessionCalendarPage continues to display session times and batch info_
    - _Requirements: 2.6, 2.7, 3.6_

- [ ] 6. Add curriculum reassignment progress-reset warning

  - [ ] 6.1 Implement confirmation dialog on curriculum reassignment
    - Before reassigning curriculum, query training logs for the student in current cycle where `week_number > 1` or `is_completed = true`
    - If progress exists, display a confirmation warning modal explaining progress will reset to week 1, day 1
    - Require explicit confirmation (confirm button) before proceeding with reassignment
    - If no progress exists, proceed with reassignment without warning
    - _Bug_Condition: isBugCondition(input) where input.action == 'reassignCurriculum' AND student.hasExistingProgress AND NOT confirmationShown_
    - _Expected_Behavior: Confirmation warning displayed, explicit confirmation required before proceeding_
    - _Preservation: Normal curriculum assignment (no existing progress) proceeds without warning_
    - _Requirements: 2.8_

- [ ] 7. Verify bug condition exploration test now passes

  - [ ] 7.1 Re-run bug condition exploration test
    - **Property 1: Expected Behavior** - Data Source Consistency and Propagation
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied:
      - DrillLibrary fetches from API and displays current drills
      - CurriculumBuilderPage persists via API and data is accessible cross-device
      - Calendar entries include populated drills from assigned curriculum
      - Reassignment shows confirmation when student has progress
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [ ] 7.2 Verify preservation tests still pass
    - **Property 2: Preservation** - Drag-and-Drop, Filter, Archived, and Diff Indicators
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all preservation tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 8. Checkpoint - Ensure all tests pass
  - Run full test suite to confirm no regressions
  - Verify bug condition exploration tests pass (confirms fix works)
  - Verify preservation property tests pass (confirms no regressions)
  - Ensure all tests pass, ask the user if questions arise.


## Notes

- Bug condition exploration tests (task 1) MUST be written and run BEFORE implementing any fix
- Preservation tests (task 2) MUST be written and run BEFORE implementing any fix
- Tasks 3-6 are the actual implementation (can be done in any order)
- Task 7 re-runs the same tests from tasks 1 and 2 to verify the fix works and doesn't regress
- Task 5 requires changes in the API project at `/Users/midhunvmanikkath/Documents/PROJECTS/LOVEALL/API/shuttlecoach-api`
- All other tasks are in the frontend app at `/Users/midhunvmanikkath/Documents/PROJECTS/LOVEALL/APP/shuttlecoach`

## Task Dependency Graph

```json
{
  "waves": [
    ["1", "2"],
    ["3", "4", "5", "6"],
    ["7"],
    ["8"]
  ]
}
```
