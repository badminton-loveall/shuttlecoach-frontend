# Drill & Curriculum Management Bugfix Design

## Overview

The drill/curriculum management system has critical data source inconsistencies: the `DrillLibrary` component reads from a static `drills.json` file instead of the live `/api/drills` endpoint, the `CurriculumBuilderPage` persists batch plans to `localStorage` instead of the backend `/api/curriculum` endpoint, and curriculum assignment does not propagate drill data to calendar views. This fix unifies all components onto the existing API endpoints, ensuring data consistency across browsers, devices, and component views, and adds a progress-reset confirmation warning when reassigning curricula.

## Glossary

- **Bug_Condition (C)**: The set of user interactions where data is read from or written to an incorrect data source (static JSON / localStorage) instead of the live API, OR where curriculum assignment fails to propagate to calendar views, OR where curriculum reassignment occurs without a progress-reset warning.
- **Property (P)**: The desired behavior where all drill and curriculum data flows through the backend API, calendar views reflect assigned curriculum drills, and reassignment triggers a confirmation warning.
- **Preservation**: Existing drag-and-drop, search/filter, diff indicators, archived read-only, and center-independent behavior that must remain unchanged by the fix.
- **DrillLibrary**: The component in `src/components/DrillLibrary.tsx` that displays available drills for drag-and-drop into curriculum week planners. Currently imports from static `src/data/drills.json`.
- **CurriculumBuilderPage**: The page in `src/pages/CurriculumBuilderPage.tsx` for creating/editing batch curriculum plans. Currently persists to `localStorage`.
- **IndividualCurriculumPage**: The page in `src/pages/IndividualCurriculumPage.tsx` for per-student curriculum editing. Already uses the `useCurriculum` API hook.
- **DrillsTab**: The component in `src/components/DrillsTab.tsx` for CRUD drill management. Already uses `apiClient` to communicate with `/api/drills`.
- **useCurriculum**: The hook in `src/hooks/useCurriculum.ts` providing API-backed curriculum CRUD.
- **SessionCalendarPage**: The page displaying session calendar entries via `useSessionCalendar` hook fetching from `/api/session-calendar`.

## Bug Details

### Bug Condition

The bug manifests when a coach creates/edits/deletes drills (via DrillsTab/API) and expects them reflected in the Curriculum Builder's drill library, OR saves a batch curriculum plan and expects it persisted to the backend, OR assigns a curriculum to a student and expects calendar views to reflect the assigned drills.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type UserAction
  OUTPUT: boolean

  LET drillLibraryReadsStaticJSON = DrillLibrary.dataSource == 'src/data/drills.json'
  LET curriculumBuilderWritesToLocalStorage = CurriculumBuilderPage.persistTarget == 'localStorage'
  LET curriculumBuilderReadsFromLocalStorage = CurriculumBuilderPage.dataSource == 'localStorage'
  LET calendarMissingCurriculumDrills = SessionCalendarPage.entries[].drills NOT populated from assigned curriculum
  LET reassignmentMissingWarning = (input.action == 'reassignCurriculum' AND student.hasExistingProgress AND NOT confirmationShown)

  RETURN (input.context == 'DrillLibrary' AND drillLibraryReadsStaticJSON)
         OR (input.context == 'CurriculumBuilderPage' AND (curriculumBuilderWritesToLocalStorage OR curriculumBuilderReadsFromLocalStorage))
         OR (input.context == 'SessionCalendarPage' AND calendarMissingCurriculumDrills)
         OR reassignmentMissingWarning
END FUNCTION
```

### Examples

- **Drill sync**: Coach creates "FH Cross Smash" drill via DrillsTab → API saves it → DrillLibrary in Curriculum Builder still shows old static list without the new drill.
- **Curriculum persistence**: Coach builds a full 8-week plan for "Morning Batch", clicks Save → plan saved to localStorage only → opening another browser shows empty plan.
- **Cross-page inconsistency**: Coach saves batch plan in CurriculumBuilderPage → navigates to a student's IndividualCurriculumPage → page fetches from API → shows no plan because batch plan was never sent to API.
- **Calendar gap**: Coach assigns curriculum to student → student calendar shows sessions but with empty `drills[]` arrays because calendar API doesn't join curriculum drill data.
- **Silent reassignment**: Coach reassigns a new curriculum to a student at week 5 progress → no warning displayed → progress resets silently.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Drag-and-drop of drills from DrillLibrary onto week planners must continue to work exactly as before
- Search and category filter functionality in DrillLibrary must continue to work
- Individual curriculum plan editing (add/remove drills, change focus area) must not affect the master batch plan or other students' plans
- Archived curriculum plans must remain read-only and prevent editing
- Diff indicators on IndividualCurriculumPage showing weeks modified from the batch plan must continue to work
- SessionCalendarPage must continue to display calendar entries with session times and batch info
- Drills and curricula must continue to be center-independent (coaches manage them globally)

**Scope:**
All inputs that do NOT involve: (a) data sourcing of drills in DrillLibrary, (b) persistence of batch curriculum plans in CurriculumBuilderPage, (c) calendar drill population from assigned curriculum, or (d) curriculum reassignment without warning — should be completely unaffected by this fix. This includes:
- UI layout and styling of all components
- Week tab navigation in curriculum editors
- Batch selection dropdowns and cycle selectors
- Authentication and role-based access controls
- Existing IndividualCurriculumPage API integration (already correct)

## Hypothesized Root Cause

Based on the bug analysis, the root causes are:

1. **DrillLibrary uses static import instead of API**: `DrillLibrary.tsx` line 3 imports `drillsData from '../data/drills.json'` and uses it directly as the drill source. It should instead call `GET /api/drills` (the same endpoint DrillsTab uses via `apiClient`).

2. **CurriculumBuilderPage uses localStorage for persistence**: `CurriculumBuilderPage.tsx` reads from `localStorage.getItem('curriculumPlans')` and writes via `localStorage.setItem(...)`. It should use the `useCurriculum` hook (same as IndividualCurriculumPage) to call `POST /api/curriculum` for creation and `POST /api/curriculum/:id/clone` for generating individual student plans.

3. **Calendar API doesn't join curriculum drills**: The `/api/session-calendar` endpoint returns `CalendarEntry` objects with a `drills: string[]` field, but this is not populated with the actual drill names from the student's assigned curriculum plan for that week. The API needs to join `curriculum_plans.weeks[weekNumber].drills` data when building calendar entries.

4. **No progress-reset confirmation on reassignment**: When a coach assigns or reassigns a curriculum via the student profile, there is no check for existing progress (training logs at week > 1) and no confirmation dialog warning about the reset.

## Correctness Properties

Property 1: Bug Condition - DrillLibrary Data Source Consistency

_For any_ action where a drill is created, updated, or deleted via the DrillsTab (API), the DrillLibrary component within CurriculumBuilderPage and IndividualCurriculumPage SHALL reflect the current API state by fetching drills from `GET /api/drills`, displaying newly created drills and hiding deleted/archived drills.

**Validates: Requirements 2.1, 2.2**

Property 2: Bug Condition - Curriculum Builder API Persistence

_For any_ action where a coach saves a batch curriculum plan in CurriculumBuilderPage, the system SHALL persist the plan via `POST /api/curriculum` to the backend database and clone individual plans to batch students via `POST /api/curriculum/:id/clone`, making the plan accessible from any browser or device.

**Validates: Requirements 2.3, 2.4, 2.5**

Property 3: Bug Condition - Calendar Drill Propagation

_For any_ student who has an assigned curriculum plan for the current cycle, the SessionCalendarPage SHALL display the curriculum's scheduled drills and focus area in the calendar entries for that student's sessions.

**Validates: Requirements 2.6, 2.7**

Property 4: Bug Condition - Curriculum Reassignment Warning

_For any_ action where a coach changes or reassigns a curriculum for a student who already has training log progress beyond week 1, the system SHALL display a confirmation warning indicating progress will reset to week 1, day 1, and require explicit confirmation before proceeding.

**Validates: Requirements 2.8**

Property 5: Preservation - Drag-and-Drop and UI Interactions

_For any_ input that involves drag-and-drop of drills onto week planners, search/filter operations, week tab navigation, or editing of individual curriculum plans, the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing UI interactions.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/components/DrillLibrary.tsx`

**Specific Changes**:
1. **Remove static JSON import**: Remove `import drillsData from '../data/drills.json'` and the line `const drills: Drill[] = drillsData.drills as Drill[]`
2. **Add API data fetching**: Use `apiClient.get('/drills')` or create a `useDrills` hook to fetch drills from the backend API on mount and expose loading/error states
3. **Add loading and error states**: Display a loading skeleton while fetching and an error message with retry on failure
4. **Accept optional props for refresh trigger**: Allow parent components to trigger a refetch (e.g., after a drill is created in another view)

---

**File**: `src/pages/CurriculumBuilderPage.tsx`

**Specific Changes**:
1. **Replace localStorage reads**: Remove all `localStorage.getItem('curriculumPlans')` calls and replace with the `useCurriculum` hook filtered by `batchId` and `cycleKey`
2. **Replace localStorage writes**: Remove `localStorage.setItem('curriculumPlans', ...)` in `handleSaveBatchPlan` and replace with:
   - `createPlan({ cycleKey, batchId, weeks })` to persist the batch plan via API
   - `cloneBatchPlan(batchPlanId, { batchId })` to generate individual student plans server-side
3. **Remove static data imports**: Remove `import curriculumData from '../data/curriculum.json'` and `import studentsData from '../data/students.json'`
4. **Add loading/error states**: Display loading indicator while curriculum data is fetched from API
5. **Use useBatches for student list**: Rely on batch information from API rather than static student data

---

**File**: Backend `/api/session-calendar` endpoint (API project)

**Specific Changes**:
1. **Join curriculum data**: When building calendar entries for a student/batch, query `curriculum_plans` for the matching `batch_id`/`student_id` + `cycle_key`, then populate `drills[]` and `focusArea` from the plan's `weeks[weekNumber]` data
2. **Map week number to session date**: Use the curriculum week mapping or calculate which week a given session date falls into relative to the cycle start

---

**File**: Student profile / curriculum assignment component

**Specific Changes**:
1. **Check for existing progress**: Before reassigning curriculum, query training logs for the student in the current cycle where `week_number > 1` or `is_completed = true`
2. **Show confirmation dialog**: If progress exists, display a warning modal explaining that progress will reset to week 1, day 1
3. **Require explicit confirmation**: Only proceed with the reassignment if the coach confirms

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write unit tests that verify the data sources used by DrillLibrary and CurriculumBuilderPage, and integration tests that verify calendar entries include curriculum drills. Run these tests on the UNFIXED code to observe failures.

**Test Cases**:
1. **DrillLibrary Static Source Test**: Render DrillLibrary and assert it makes an API call to `/api/drills` — will fail on unfixed code because it reads from static JSON
2. **CurriculumBuilder localStorage Test**: Simulate saving a batch plan and assert an API call to `POST /api/curriculum` was made — will fail on unfixed code because it writes to localStorage
3. **Calendar Drill Population Test**: Fetch session calendar for a student with an assigned curriculum and assert `drills[]` is populated — will fail on unfixed code because API doesn't join curriculum data
4. **Reassignment Warning Test**: Simulate reassigning curriculum for a student with progress and assert a confirmation dialog is shown — will fail on unfixed code because no warning exists

**Expected Counterexamples**:
- DrillLibrary renders drills without making any network request (proves static JSON usage)
- CurriculumBuilderPage save handler calls `localStorage.setItem` rather than `apiClient.post`
- Calendar entries return `drills: []` for students with assigned curricula
- Curriculum reassignment proceeds without any confirmation dialog

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  IF input.context == 'DrillLibrary' THEN
    result := renderDrillLibrary()
    ASSERT result.apiCallMade('/api/drills') == true
    ASSERT result.displayedDrills == apiDrills (not static JSON)
  END IF
  
  IF input.context == 'CurriculumBuilderPage' THEN
    result := saveBatchPlan(input.plan)
    ASSERT result.apiCallMade('POST /api/curriculum') == true
    ASSERT localStorage.getItem('curriculumPlans') == null (not used)
  END IF
  
  IF input.context == 'SessionCalendarPage' THEN
    result := fetchCalendar(input.studentId, input.dateRange)
    ASSERT result.entries[].drills.length > 0 WHERE curriculum assigned
  END IF
  
  IF input.action == 'reassignCurriculum' AND student.hasProgress THEN
    result := reassignCurriculum(input)
    ASSERT result.confirmationDialogShown == true
  END IF
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalBehavior(input) = fixedBehavior(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain (different drill lists, different week configurations, various filter combinations)
- It catches edge cases that manual unit tests might miss (empty drill lists, boundary week numbers, archived plans)
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for drag-and-drop, filtering, archived plan blocking, and diff indicators, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Drag-and-Drop Preservation**: Verify dragging a drill from DrillLibrary onto a week planner adds it to the week's drill list (same as before)
2. **Search/Filter Preservation**: Verify filtering drills by category and searching by name produces correct results (same filtering logic)
3. **Individual Plan Independence**: Verify editing an individual plan does not modify the batch plan or other students' plans
4. **Archived Plan Read-Only**: Verify that archived plans cannot be edited (save is blocked, inputs are disabled)
5. **Diff Indicator Preservation**: Verify that weeks modified from the batch plan show diff badges correctly

### Unit Tests

- Test that DrillLibrary calls `GET /api/drills` and renders the returned drills
- Test that DrillLibrary shows loading state while fetching
- Test that DrillLibrary shows error state and retry button on failure
- Test that CurriculumBuilderPage calls `POST /api/curriculum` on save
- Test that CurriculumBuilderPage calls `POST /api/curriculum/:id/clone` after creating batch plan
- Test that reassignment confirmation dialog appears when student has progress
- Test that reassignment proceeds normally when student has no progress

### Property-Based Tests

- Generate random drill lists from API responses and verify DrillLibrary correctly renders, filters, and enables drag-and-drop for all of them
- Generate random week plan configurations and verify CurriculumBuilderPage correctly serializes them for API submission
- Generate random combinations of batch plans and individual plans and verify diff indicators are correctly computed
- Generate random calendar date ranges with assigned curricula and verify drills are populated in entries

### Integration Tests

- Test full flow: create drill via DrillsTab → verify it appears in DrillLibrary within CurriculumBuilder
- Test full flow: build batch plan in CurriculumBuilder → save → verify it appears in IndividualCurriculumPage for batch students
- Test full flow: assign curriculum to student → verify calendar shows drills for that student's sessions
- Test full flow: reassign curriculum for student with week 3 progress → verify warning appears → confirm → verify reset
