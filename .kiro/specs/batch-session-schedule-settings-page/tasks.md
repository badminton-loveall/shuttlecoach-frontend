# Implementation Plan: Batch Session Schedule Settings Page

## Overview

Create a settings page that wires the existing `ScheduleBuilder` component, `useBatches`, `useSessionSchedule`, and `useCreateSessionSchedule` hooks into a cohesive batch schedule configuration interface for the Head Coach. This is a page-level composition task — all building blocks exist.

## Tasks

- [ ] 1. Create BatchSchedulePage component
  - [ ] 1.1 Create `src/pages/BatchSchedulePage.tsx` with batch selector dropdown, schedule loading, ScheduleBuilder integration, and save workflow
    - Import and use `useBatches()` to populate the batch selector dropdown
    - Import and use `useSessionSchedule(selectedBatchId)` to load schedule data when a batch is selected
    - Import and use `useCreateSessionSchedule()` for the save mutation
    - Import and use `useToast()` for success/error toast notifications
    - Wrap content in `DashboardLayout` with page heading "Session Schedule"
    - Render `ScheduleBuilder` with `key={selectedBatchId}`, `initialSlots`, `initialRecurrence`, `onSave`, `readOnly={false}`, and `isSaving` props
    - Handle loading states, error states, and empty batch selection prompt
    - Show success toast "Schedule saved successfully" on save; error toast "Failed to save schedule. Please try again." on failure
    - Refetch schedule after successful save
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3_

  - [ ]* 1.2 Write property tests for BatchSchedulePage
    - **Property 1: Batch dropdown completeness** — For any array of batches returned by useBatches, every batch appears as a selectable option
    - **Property 4: Save payload correctness** — For any selected batch ID, slots, and recurrence produced by ScheduleBuilder, createSchedule is invoked with the exact batchId, slots, and recurrence
    - **Validates: Requirements 3.1, 5.1**

- [ ] 2. Add route and navigation
  - [ ] 2.1 Register `/batch-schedule` route in `src/App.tsx` wrapped in `ProtectedRoute` with `allowedRoles={['HEAD_COACH']}`
    - Import `BatchSchedulePage` from `./pages/BatchSchedulePage`
    - Add the route alongside existing Head Coach routes (near `/curriculum` route)
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 2.2 Write unit tests for route protection and page rendering
    - Verify unauthenticated users are redirected to `/login`
    - Verify non-HEAD_COACH users are redirected to `/access-denied`
    - Verify HEAD_COACH users can access the page
    - _Requirements: 1.2, 1.3, 1.4_

- [ ] 3. Final checkpoint
  - Ensure the app compiles without errors, the page renders at `/batch-schedule`, and all tests pass. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- All building blocks (hooks, ScheduleBuilder, DashboardLayout, ProtectedRoute) already exist — this is pure composition
- The `key={selectedBatchId}` prop on ScheduleBuilder is critical for resetting state on batch switch
- Test framework is Vitest + Testing Library (already configured in the project)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["2.2"] }
  ]
}
```
