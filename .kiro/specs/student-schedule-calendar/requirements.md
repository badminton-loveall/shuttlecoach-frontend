# Requirements Document

## Introduction

A visual monthly calendar grid component for the Student Profile's Schedule tab. Replaces the current list-based session display with a traditional calendar layout where each day cell is visible, session days are highlighted, and clicking a session day reveals drill details. The component reuses the existing `useSessionCalendar` hook and `CalendarEntry` data without any backend changes.

## Glossary

- **Calendar_Grid**: The visual monthly grid component displaying day cells arranged in rows of 7 columns (Sun–Sat)
- **Day_Cell**: An individual cell in the Calendar_Grid representing a single calendar date
- **Session_Day**: A Day_Cell that has one or more CalendarEntry records associated with its date
- **Detail_Panel**: A popup or inline panel that appears when a Session_Day is clicked, showing session time, focus area, and drill list
- **Month_Navigator**: UI controls (previous/next buttons and month/year label) for browsing between calendar months
- **Calendar_Entry**: A data object from the `useSessionCalendar` hook containing date, startTime, endTime, batchName, weekNumber, focusArea, and drills[]
- **Schedule_Tab**: The existing tab on StudentProfilePage that displays batch assignment and training schedule

## Requirements

### Requirement 1: Monthly Calendar Grid Rendering

**User Story:** As a coach viewing a student's profile, I want to see a visual monthly calendar grid, so that I can quickly understand the training schedule at a glance.

#### Acceptance Criteria

1. WHEN the Schedule_Tab renders with a batch assigned, THE Calendar_Grid SHALL display a 7-column grid with column headers for each day of the week (Sun through Sat)
2. THE Calendar_Grid SHALL render Day_Cells for all dates in the currently selected month, including leading days from the previous month and trailing days from the next month to complete full weeks
3. WHEN the Calendar_Grid renders, THE Calendar_Grid SHALL visually distinguish leading and trailing days from the current month's days using reduced opacity or muted styling
4. THE Calendar_Grid SHALL highlight today's date with a distinct visual indicator (border or background accent)

### Requirement 2: Session Day Highlighting

**User Story:** As a coach, I want days with scheduled training sessions to be visually distinct, so that I can identify training days without reading details.

#### Acceptance Criteria

1. WHEN Calendar_Entry records exist for a date, THE Calendar_Grid SHALL render that Day_Cell with a highlighted background color distinct from non-session days
2. WHEN multiple Calendar_Entry records exist for a single date, THE Calendar_Grid SHALL display the same highlighted style as a single-session day (no additional visual differentiation for count)
3. THE Calendar_Grid SHALL apply the highlighted style only to Day_Cells whose dates have at least one Calendar_Entry in the fetched data

### Requirement 3: Session Detail Display on Day Click

**User Story:** As a coach, I want to click on a highlighted day to see what drills the student needs to practice, so that I can review the curriculum details for that session.

#### Acceptance Criteria

1. WHEN a user clicks on a Session_Day, THE Detail_Panel SHALL appear showing session details for that date
2. THE Detail_Panel SHALL display the start time, end time, and focus area for each Calendar_Entry on the selected date
3. THE Detail_Panel SHALL display the list of drill names from the drills[] array of each Calendar_Entry on the selected date
4. WHEN a user clicks on a Day_Cell that has no Calendar_Entry records, THE Calendar_Grid SHALL not display the Detail_Panel
5. WHEN the Detail_Panel is open and the user clicks on a different Session_Day, THE Detail_Panel SHALL update to show details for the newly selected date
6. WHEN the Detail_Panel is open and the user clicks outside the Detail_Panel or on a close control, THE Detail_Panel SHALL close

### Requirement 4: Month Navigation

**User Story:** As a coach, I want to navigate between months, so that I can browse the student's future and past training schedule.

#### Acceptance Criteria

1. THE Month_Navigator SHALL display the currently viewed month and year as a label
2. WHEN a user clicks the previous-month control, THE Calendar_Grid SHALL fetch and display Calendar_Entry data for the previous month
3. WHEN a user clicks the next-month control, THE Calendar_Grid SHALL fetch and display Calendar_Entry data for the next month
4. WHEN the month changes, THE Calendar_Grid SHALL invoke the useSessionCalendar hook with updated startDate and endDate parameters matching the new month's first and last dates
5. WHEN the month changes, THE Detail_Panel SHALL close if previously open

### Requirement 5: Loading and Empty States

**User Story:** As a coach, I want clear feedback when data is loading or unavailable, so that I understand the system state.

#### Acceptance Criteria

1. WHILE Calendar_Entry data is loading, THE Calendar_Grid SHALL display a loading indicator
2. WHEN no batch is assigned to the student, THE Schedule_Tab SHALL display a message indicating no batch is assigned instead of the Calendar_Grid
3. WHEN the fetched Calendar_Entry data contains zero entries for the selected month, THE Calendar_Grid SHALL render with all Day_Cells in the non-highlighted state and display a message indicating no sessions are scheduled for that month

### Requirement 6: Data Integration with Existing Hook

**User Story:** As a developer, I want the calendar to reuse the existing useSessionCalendar hook, so that there is no data duplication or additional API endpoints.

#### Acceptance Criteria

1. THE Calendar_Grid SHALL source all session data exclusively from the useSessionCalendar hook
2. WHEN the batch assignment changes via the batch dropdown, THE Calendar_Grid SHALL refetch data using the newly selected batchId
3. THE Calendar_Grid SHALL pass the current month's first date as startDate and last date as endDate to the useSessionCalendar hook filters
4. THE Calendar_Grid SHALL not require any backend API changes; all displayed data (date, startTime, endTime, focusArea, drills[]) SHALL come from the existing CalendarEntry interface

### Requirement 7: Responsive Layout

**User Story:** As a coach using a tablet or smaller screen, I want the calendar to remain usable, so that I can view schedules on different devices.

#### Acceptance Criteria

1. THE Calendar_Grid SHALL use CSS Grid layout without external calendar library dependencies
2. WHILE the viewport width is less than 600px, THE Calendar_Grid SHALL reduce Day_Cell padding and font size to fit within the available width
3. THE Detail_Panel SHALL be positioned to remain fully visible within the viewport regardless of which Day_Cell triggered it
