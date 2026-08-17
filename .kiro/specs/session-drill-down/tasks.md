# Implementation Plan: Session Drill-Down

## Overview

This plan implements the Session Drill-Down feature, enabling coaches to click session cards on the dashboard to expand an inline student list, and then click a student to view their drills in a slide-over drawer. The implementation builds on existing hooks (`useBatchStudents`, `useBatchStudentsDrills`) and components (`SessionCard`, `DashboardAttendanceBlock`) by adding new state management, UI components, and wiring them into the dashboard.

## Tasks

- [x] 1. Create the useSessionDrillDown hook
  - [x] 1.1 Create `src/hooks/useSessionDrillDown.ts` with state management for expansion/drawer
    - Implement `SessionDrillDownState` interface with `expandedSessionKey`, `selectedStudent`, `drawerOpen`
    - Implement `handleSessionClick` — toggles expansion, closes drawer on switch
    - Implement `handleStudentClick` — sets selected student, opens drawer
    - Implement `closeDrawer` — closes drawer, preserves expanded session
    - Implement `collapseAll` — resets all state
    - Export `getSessionKey` utility function (`${batchId}-${date}`)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.1, 4.2, 4.3, 4.4, 8.1, 8.2, 8.3_

  - [ ]* 1.2 Write property tests for useSessionDrillDown hook
    - **Property 1: Session Toggle Behavior** — clicking expanded session collapses it; clicking new session expands it
    - **Property 2: Single Expansion Invariant** — at most one session expanded at any time
    - **Property 3: Drawer-Session State Consistency** — drawerOpen implies expandedSessionKey and selectedStudent are non-null
    - **Property 4: Session Key Determinism** — same entry always produces same key
    - **Property 5: Session Key Uniqueness** — different batchId/date produce different keys
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 4.1, 4.2, 4.3, 4.4, 8.1, 8.2, 8.3**

- [x] 2. Create the SessionDrillDown expandable panel component
  - [x] 2.1 Create `src/components/SessionDrillDown.tsx` and `src/components/SessionDrillDown.css`
    - Accept `session`, `isExpanded`, `onCollapse`, `onStudentClick` props
    - Fetch students using `useBatchStudents(session.batchId)` when expanded
    - Render animated slide-down panel with student list (name + skill level badge)
    - Handle loading state with skeleton rows
    - Handle error state with retry button
    - Handle empty state ("No students enrolled in this batch yet.")
    - Highlight selected student row
    - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 5.1, 6.1, 6.3_

  - [ ]* 2.2 Write unit tests for SessionDrillDown component
    - Test student list renders correctly with mock data
    - Test loading state shows skeleton
    - Test error state shows retry button
    - Test empty batch shows informational message
    - Test student click callback fires with correct student
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 5.1, 6.1_

- [x] 3. Create the StudentDrillDrawer slide-over component
  - [x] 3.1 Create `src/components/StudentDrillDrawer.tsx` and `src/components/StudentDrillDrawer.css`
    - Accept `isOpen`, `onClose`, `student`, `batchId`, `sessionDate` props
    - Fetch drills using `useBatchStudentsDrills({ batchId, date: sessionDate })`
    - Filter drills for the selected student from the batch response
    - Render slide-over drawer from right side with backdrop
    - Display student header (name, skill level)
    - Display drills grouped by focus area
    - Show "No drills assigned for today" message when drills array is empty
    - Handle loading and error states
    - Close on backdrop click or close button
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 5.2, 6.2_

  - [ ]* 3.2 Write unit tests for StudentDrillDrawer component
    - Test drill list renders grouped by focus area
    - Test empty drills shows curriculum plan message
    - Test loading indicator displays during fetch
    - Test close button and backdrop dismiss drawer
    - **Property 7: Drill Grouping by Focus Area** — drills of same focus area appear together
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 5.2, 6.2**

- [x] 4. Checkpoint - Ensure core components work in isolation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Enhance SessionCard for clickable drill-down interaction
  - [x] 5.1 Update `src/components/SessionCard.tsx` to support click interaction
    - Add `onSessionClick` optional callback prop to `SessionCardProps`
    - Add `expandedBatchId` optional prop for visual active state
    - Add cursor pointer and hover styling to session entries when `onSessionClick` is provided
    - Add chevron icon that rotates when session is expanded
    - Emit click with `CalendarEntry` on session entry click
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ]* 5.2 Write unit tests for enhanced SessionCard
    - Test hover state applies cursor pointer when onSessionClick is provided
    - Test chevron rotates when expandedBatchId matches
    - Test click handler fires with correct CalendarEntry
    - _Requirements: 7.1, 7.2_

- [x] 6. Wire session drill-down into DashboardAttendanceBlock
  - [x] 6.1 Integrate `useSessionDrillDown` and new components into `src/components/attendance/DashboardAttendanceBlock.tsx`
    - Import and use `useSessionDrillDown` hook
    - Pass `handleSessionClick` to SessionCard's `onSessionClick` prop
    - Render `SessionDrillDown` panel below the active session card when expanded
    - Render `StudentDrillDrawer` at the block level for the selected student
    - Pass `expandedBatchId` to SessionCard for active visual state
    - Ensure attendance marking flow still works independently alongside drill-down
    - _Requirements: 1.1, 1.3, 4.1, 4.2, 4.3, 4.4_

- [x] 7. Add smooth expand/collapse animation
  - [x] 7.1 Add CSS animation for SessionDrillDown expand/collapse in `src/components/SessionDrillDown.css`
    - Implement `max-height` + `overflow: hidden` transition for panel expand/collapse
    - Add entrance animation for panel content
    - Keep animations under 300ms for responsiveness
    - _Requirements: 7.3_

- [x] 8. Final checkpoint - Ensure all tests pass and feature is fully wired
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The existing `BatchStudentList` component in `src/components/BatchStudentList.tsx` is used for a different context (accordion-style with drills inline) — the new `SessionDrillDown` component renders a simpler student list optimized for the dashboard drill-down flow
- The `StudentDrillDrawer` filters drills for the selected student from the `useBatchStudentsDrills` response which returns all students in the batch

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "3.1"] },
    { "id": 1, "tasks": ["1.2", "2.1", "3.2"] },
    { "id": 2, "tasks": ["2.2", "5.1"] },
    { "id": 3, "tasks": ["5.2", "6.1"] },
    { "id": 4, "tasks": ["7.1"] }
  ]
}
```
