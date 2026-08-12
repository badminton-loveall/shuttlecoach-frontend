# Implementation Plan: Student Schedule Calendar

## Overview

Replace the list-based session display in the Schedule tab with a visual monthly calendar grid. The implementation uses CSS Grid, reuses the existing `useSessionCalendar` hook, and introduces five new components under `src/components/StudentScheduleCalendar/`.

## Tasks

- [ ] 1. Set up component structure and utility functions
  - [ ] 1.1 Create calendarUtils.ts with grid computation and date helpers
    - Create `src/components/StudentScheduleCalendar/calendarUtils.ts`
    - Implement `GridDay` interface and `buildGridDays(year, month)` function that returns an array of GridDay objects (length always multiple of 7) with leading/trailing days marked `isCurrentMonth: false`
    - Implement `buildEntriesMap(entries: CalendarEntry[])` returning `Map<string, CalendarEntry[]>`
    - Implement `getMonthDateRange(year, month)` returning `{ startDate, endDate }` in YYYY-MM-DD format
    - Implement `getToday()` helper returning today's ISO date string
    - _Requirements: 1.2, 6.3_

  - [ ] 1.2 Create component interfaces and StudentScheduleCalendar.css
    - Create `src/components/StudentScheduleCalendar/StudentScheduleCalendar.css` with styles for calendar grid, day cells, month navigator, and detail panel
    - Use existing project CSS variables (`var(--space-*)`, `var(--color-*)`)
    - Include responsive styles for viewport < 600px (reduced padding/font-size)
    - Style classes: `.calendar-grid`, `.day-cell`, `.day-cell--muted`, `.day-cell--today`, `.day-cell--highlighted`, `.day-cell--selected`, `.detail-panel`, `.month-navigator`
    - _Requirements: 1.3, 1.4, 2.1, 7.1, 7.2_

- [ ] 2. Implement calendar components
  - [ ] 2.1 Implement MonthNavigator component
    - Create `src/components/StudentScheduleCalendar/MonthNavigator.tsx`
    - Accept `MonthNavigatorProps` (year, month, onPrev, onNext)
    - Render month/year label and prev/next navigation buttons
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 2.2 Implement DayCell component
    - Create `src/components/StudentScheduleCalendar/DayCell.tsx`
    - Accept `DayCellProps` (day, hasEntries, isSelected, isToday, onClick)
    - Apply conditional CSS classes for muted, today, highlighted, and selected states
    - Handle click to invoke `onClick` callback
    - _Requirements: 1.3, 1.4, 2.1, 2.3, 3.1_

  - [ ] 2.3 Implement CalendarGrid component
    - Create `src/components/StudentScheduleCalendar/CalendarGrid.tsx`
    - Accept `CalendarGridProps` (days, entriesByDate, selectedDate, onDayClick)
    - Render 7-column CSS Grid with day-of-week headers (Sun–Sat)
    - Map over `days` array rendering DayCell for each, passing computed props
    - _Requirements: 1.1, 1.2, 2.1, 2.2_

  - [ ] 2.4 Implement DetailPanel component
    - Create `src/components/StudentScheduleCalendar/DetailPanel.tsx`
    - Accept `DetailPanelProps` (entries, date, onClose)
    - Render start time, end time, focus area, and drill list for each entry
    - Include a close button and handle click-outside to close
    - Position panel to remain within viewport
    - _Requirements: 3.1, 3.2, 3.3, 3.6, 7.3_

- [ ] 3. Implement main orchestrator and integrate
  - [ ] 3.1 Implement StudentScheduleCalendar orchestrator component
    - Create `src/components/StudentScheduleCalendar/StudentScheduleCalendar.tsx`
    - Manage `CalendarState` (viewedYear, viewedMonth, selectedDate)
    - Compute date range via `getMonthDateRange` and pass to `useSessionCalendar` hook
    - Build entries map and grid days from hook response
    - Handle month navigation (prev/next with year rollover), clear selectedDate on month change
    - Handle day click: set selectedDate if entries exist, otherwise clear
    - Show loading indicator while hook is loading
    - Show "No batch assigned" message when batchId is empty
    - Show "No sessions scheduled this month" when entries are empty
    - Compose MonthNavigator, CalendarGrid, and DetailPanel
    - Create barrel export `src/components/StudentScheduleCalendar/index.ts`
    - _Requirements: 1.1, 2.1, 3.1, 3.4, 3.5, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 6.1, 6.3_

  - [ ] 3.2 Integrate StudentScheduleCalendar into ScheduleTabContent
    - Modify `StudentProfilePage.tsx` (or the ScheduleTabContent section)
    - Replace the existing list-based session display with `<StudentScheduleCalendar batchId={...} />`
    - Ensure batch dropdown change passes updated batchId to the calendar component
    - _Requirements: 6.1, 6.2, 6.4_

- [ ] 4. Checkpoint
  - Ensure the application compiles without errors and the calendar renders correctly. Ask the user if questions arise.

- [ ] 5. Add tests
  - [ ]* 5.1 Write property test for grid cell count and coverage
    - **Property 1: Grid cell count is a multiple of 7 and covers all month dates**
    - Create `src/components/StudentScheduleCalendar/StudentScheduleCalendar.property.test.ts`
    - Use fast-check to generate arbitrary year (1970–2100) and month (0–11) inputs
    - Assert `buildGridDays` returns array with length % 7 === 0 and contains exactly one GridDay with `isCurrentMonth: true` per day of the month
    - **Validates: Requirements 1.2**

  - [ ]* 5.2 Write property test for day highlight correctness
    - **Property 2: Day cell highlight if and only if entries exist**
    - Generate arbitrary CalendarEntry arrays and grid days
    - Assert a day cell is highlighted iff the entries map has ≥1 entry for that date
    - **Validates: Requirements 2.1, 2.3**

  - [ ]* 5.3 Write property test for detail panel data completeness
    - **Property 3: Detail panel renders all entry data for selected date**
    - Generate arbitrary non-empty CalendarEntry lists for a selected date
    - Assert rendered output contains startTime, endTime, focusArea, and every drill from each entry
    - **Validates: Requirements 3.2, 3.3**

  - [ ]* 5.4 Write property test for month navigation arithmetic
    - **Property 4: Month navigation changes month by exactly ±1**
    - Generate arbitrary year/month, apply prev/next
    - Assert correct month with year rollover (Jan prev → Dec of prev year, Dec next → Jan of next year)
    - **Validates: Requirements 4.2, 4.3**

  - [ ]* 5.5 Write property test for hook date params
    - **Property 5: Hook receives first and last date of viewed month**
    - Generate arbitrary year/month, call `getMonthDateRange`
    - Assert startDate is YYYY-MM-01 and endDate is last day of that month
    - **Validates: Requirements 4.4, 6.3**

  - [ ]* 5.6 Write unit tests for StudentScheduleCalendar
    - Create `src/components/StudentScheduleCalendar/StudentScheduleCalendar.test.tsx`
    - Test: renders 7 column headers (Req 1.1)
    - Test: leading/trailing days have muted class (Req 1.3)
    - Test: today's date has today-indicator class (Req 1.4)
    - Test: clicking session day opens detail panel (Req 3.1)
    - Test: clicking non-session day does not open panel (Req 3.4)
    - Test: clicking different session day updates panel (Req 3.5)
    - Test: close button closes panel (Req 3.6)
    - Test: month/year label displays correctly (Req 4.1)
    - Test: month navigation closes open detail panel (Req 4.5)
    - Test: loading indicator shown while loading (Req 5.1)
    - Test: no-batch message when batchId is empty (Req 5.2)
    - Test: empty-month message when entries is [] (Req 5.3)
    - **Validates: Requirements 1.1, 1.3, 1.4, 3.1, 3.4, 3.5, 3.6, 4.1, 4.5, 5.1, 5.2, 5.3**

- [ ] 6. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All code is TypeScript/React using existing project conventions and CSS variables

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "2.2"] },
    { "id": 2, "tasks": ["2.3", "2.4"] },
    { "id": 3, "tasks": ["3.1"] },
    { "id": 4, "tasks": ["3.2"] },
    { "id": 5, "tasks": ["5.1", "5.2", "5.4", "5.5"] },
    { "id": 6, "tasks": ["5.3", "5.6"] }
  ]
}
```
