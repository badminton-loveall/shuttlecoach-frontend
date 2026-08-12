# Implementation Plan: Enhanced Calendar Views

## Overview

This plan implements enhanced calendar views for both students and coaches. The student calendar gains skill-level color theming. The coach calendar aggregates all batches into a single color-coded view with drill-down capabilities (day detail panel, student list, drill accordion). A new backend endpoint supplies per-student drill data derived from curriculum position.

## Tasks

- [ ] 1. Create color utility functions and types
  - [ ] 1.1 Create `src/utils/batchColors.ts` with `assignBatchColors`, `BATCH_COLOR_PALETTE`, and `SKILL_LEVEL_CLASS_MAP`
    - Implement the 6-color palette constant
    - Implement `assignBatchColors(batchIds: string[]): Map<string, string>` using sorted-index approach
    - Export `SKILL_LEVEL_CLASS_MAP` mapping each SkillLevel to its CSS class
    - _Requirements: 2.2, 2.5, 5.1, 5.2, 1.1_

  - [ ]* 1.2 Write property test for batch color assignment (Property 1)
    - **Property 1: Batch Color Assignment Consistency and Uniqueness**
    - **Validates: Requirements 2.2, 2.5, 5.1, 5.2**
    - Create `src/utils/batchColors.property.test.ts` using fast-check
    - Test: same input produces same output across invocations
    - Test: distinct batches get distinct colors (up to 6)
    - Test: deterministic cycling for >6 batches

  - [ ]* 1.3 Write unit tests for color utilities
    - Create `src/utils/batchColors.test.ts`
    - Test `assignBatchColors` with 1, 3, 6, and 8 batches
    - Test `SKILL_LEVEL_CLASS_MAP` contains all four skill levels
    - _Requirements: 2.2, 5.1_

- [ ] 2. Add skill-level CSS classes and modify StudentScheduleCalendar
  - [ ] 2.1 Add skill-level CSS classes to `src/components/StudentScheduleCalendar/StudentScheduleCalendar.css`
    - Add `.day-cell--skill-beginner`, `.day-cell--skill-intermediate`, `.day-cell--skill-advanced`, `.day-cell--skill-professional` classes
    - Include background-color and text-color per the design spec
    - _Requirements: 1.1, 1.2, 1.4_

  - [ ] 2.2 Modify `DayCell.tsx` to accept `skillLevel` prop and apply skill-level CSS class
    - Add `skillLevel?: SkillLevel` to DayCell props
    - Replace hardcoded highlight class with `SKILL_LEVEL_CLASS_MAP[skillLevel]`
    - Default to 'Beginner' if skillLevel is undefined
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 2.3 Modify `StudentScheduleCalendar.tsx` to accept and pass `skillLevel` prop through CalendarGrid to DayCell
    - Add `skillLevel?: SkillLevel` to `StudentScheduleCalendarProps`
    - Pass prop through `CalendarGrid` to each `DayCell`
    - _Requirements: 1.1, 1.3_

  - [ ]* 2.4 Write property test for skill-level class mapping (Property 3)
    - **Property 3: Skill-Level Class Mapping Completeness**
    - **Validates: Requirements 1.1, 1.4**
    - Create `src/components/StudentScheduleCalendar/DayCell.property.test.tsx`
    - Test: for every valid SkillLevel, DayCell applies the correct CSS class

- [ ] 3. Checkpoint - Ensure student calendar changes compile and pass tests
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Backend: Create batch-students-drills endpoint
  - [ ] 4.1 Create validator schema at `src/validators/batchStudentsDrills.schemas.ts`
    - Define Zod schema for query params: `batchId` (required string), `date` (required, YYYY-MM-DD format)
    - _Requirements: 6.1, 6.4_

  - [ ] 4.2 Create controller at `src/controllers/batchStudentsDrills.ts`
    - Implement `getBatchStudentsDrills` handler
    - Query students by batchId (active status)
    - Compute week number from `session_schedules.cycle_start_date` and `recurrence.repeatEvery`
    - Look up curriculum plans (student-level then batch-level fallback)
    - Extract drills from `weeks[weekNumber - 1]`
    - Return 403 if coach not assigned to batch, 400 for invalid params
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 4.3 Create route at `src/routes/batchStudentsDrills.ts` and register in `src/routes/index.ts`
    - Define `GET /batch-students-drills` route with auth middleware and validation
    - Register route in the main router index
    - _Requirements: 6.1_

  - [ ]* 4.4 Write property test for week number computation (Property 2)
    - **Property 2: Week Number Computation Correctness**
    - **Validates: Requirements 4.3, 6.2, 6.5**
    - Create `src/__tests__/batchStudentsDrills.property.test.ts` in the API project using fast-check
    - Test: weekNumber is always in [1, 8]
    - Test: formula correctness for various cycleStartDate, repeatEvery, and targetDate combinations

  - [ ]* 4.5 Write unit tests for the batch-students-drills controller
    - Create `src/__tests__/batchStudentsDrills.test.ts` in the API project
    - Test 403 for unauthorized batch, 400 for missing/invalid date, 200 with correct response shape
    - Test empty drills array when no curriculum plan exists
    - _Requirements: 6.2, 6.3, 6.4_

- [ ] 5. Frontend: Enhance SessionCalendarPage for multi-batch coach view
  - [ ] 5.1 Modify `DayCell.tsx` to accept and render `batchColors?: BatchColorDot[]` prop
    - Add `batchColors` prop to DayCell interface
    - Render colored dot indicators when batchColors are provided
    - Add tooltip showing batch name on hover
    - _Requirements: 2.3, 5.3, 5.4_

  - [ ] 5.2 Modify `SessionCalendarPage.tsx` to fetch all batches and assign colors
    - Remove `batchId` filter from `useSessionCalendar` call
    - Group returned entries by batchId
    - Use `assignBatchColors` to map each batch to a color
    - Pass `batchColors` data to `CalendarGrid` → `DayCell`
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ]* 5.3 Write property test for batch grouping (Property 4)
    - **Property 4: Batch Grouping from Calendar Entries**
    - **Validates: Requirements 2.3, 3.1**
    - Create `src/pages/SessionCalendarPage.property.test.ts` using fast-check
    - Test: grouping produces exactly the unique batch IDs present in entries, no duplicates/omissions

- [ ] 6. Frontend: Create BatchColorLegend component
  - [ ] 6.1 Create `src/components/BatchColorLegend.tsx`
    - Accept `batches: Array<{ batchId: string; batchName: string; color: string }>` prop
    - Render horizontal list of color swatches with batch names
    - _Requirements: 2.4, 5.1_

  - [ ] 6.2 Integrate `BatchColorLegend` into `SessionCalendarPage.tsx`
    - Render legend above/below the calendar grid
    - Pass the batch-to-color mapping data
    - _Requirements: 2.4_

- [ ] 7. Frontend: Create useBatchStudentsDrills hook
  - [ ] 7.1 Create `src/hooks/useBatchStudentsDrills.ts`
    - Accept `{ batchId: string; date: string }` params
    - Call `GET /api/batch-students-drills?batchId=X&date=Y` using existing apiClient
    - Return `{ students, loading, error }` state
    - Handle 403, 400, and network error states
    - _Requirements: 3.4, 3.5, 6.1_

- [ ] 8. Checkpoint - Ensure coach calendar multi-batch view compiles and tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Frontend: Create CoachDayDetailPanel component
  - [ ] 9.1 Create `src/components/CoachDayDetailPanel.tsx`
    - Accept `date`, `batchEntries`, and `onClose` props
    - Display batch cards with batch name, start/end time, focus area, and batch color indicator
    - Show loading skeleton per-batch while student data loads
    - Display error message if API fails
    - _Requirements: 3.1, 3.2, 3.5_

  - [ ] 9.2 Create `src/components/StudentDrillAccordion.tsx`
    - Accept `student: BatchStudentDrill`, `isExpanded`, `onToggle` props
    - Render student name with skill-level-colored avatar indicator
    - When expanded, show drill names with focus areas
    - Show "No drills scheduled" when drills array is empty
    - Support collapse on second click
    - _Requirements: 4.1, 4.2, 4.4, 4.5_

  - [ ] 9.3 Create `src/components/BatchStudentList.tsx`
    - Accept `batchId`, `date`, and `batchColor` props
    - Use `useBatchStudentsDrills` hook to fetch student data
    - Render list of `StudentDrillAccordion` items
    - Show skeleton loader while loading
    - _Requirements: 3.3, 3.4, 4.1_

  - [ ]* 9.4 Write property test for rendered batch detail data completeness (Property 5)
    - **Property 5: Rendered Batch Detail Data Completeness**
    - **Validates: Requirements 3.2, 3.3, 4.2**
    - Create `src/components/CoachDayDetailPanel.property.test.tsx` using fast-check
    - Test: all N student names rendered, expanding shows all M drill names with focus areas

- [ ] 10. Frontend: Wire CoachDayDetailPanel into SessionCalendarPage
  - [ ] 10.1 Integrate day-click handler in `SessionCalendarPage.tsx` to show `CoachDayDetailPanel`
    - On day click, filter batch entries for that date
    - Show `CoachDayDetailPanel` with the filtered entries
    - Pass `onClose` handler to dismiss the panel
    - Render `BatchStudentList` inside each batch card
    - _Requirements: 3.1, 3.2, 3.3, 4.1_

  - [ ]* 10.2 Write unit tests for CoachDayDetailPanel and StudentDrillAccordion
    - Test panel shows batch cards with correct data
    - Test accordion expand/collapse behavior
    - Test "No drills scheduled" empty state
    - Test error message display on API failure
    - _Requirements: 3.1, 3.5, 4.4, 4.5_

- [ ] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The backend endpoint lives in the API project (`shuttlecoach-api`); all other tasks are in the frontend project (`shuttlecoach`)
- The existing `useSessionCalendar` hook already supports fetching without `batchId` — the coach calendar change leverages this

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "4.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.2", "4.2"] },
    { "id": 2, "tasks": ["2.3", "2.4", "4.3", "4.4", "4.5"] },
    { "id": 3, "tasks": ["5.1", "6.1", "7.1"] },
    { "id": 4, "tasks": ["5.2", "5.3", "6.2"] },
    { "id": 5, "tasks": ["9.1", "9.2"] },
    { "id": 6, "tasks": ["9.3", "9.4"] },
    { "id": 7, "tasks": ["10.1"] },
    { "id": 8, "tasks": ["10.2"] }
  ]
}
```
