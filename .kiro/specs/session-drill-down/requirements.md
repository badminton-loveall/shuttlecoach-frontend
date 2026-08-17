# Requirements Document

## Introduction

The Session Drill-Down feature allows coaches to interactively explore session details directly from the dashboard. Coaches can click a session card to expand it inline and view enrolled students, then click a student to open a slide-over drawer showing today's drills for that student. This is a frontend-only feature that leverages existing API endpoints and data hooks.

## Glossary

- **Dashboard**: The main coach interface showing today's sessions and attendance information
- **Session_Card**: A UI element representing a single scheduled session (batch + time slot) on the dashboard
- **Session_Panel**: The expandable inline panel that appears below a session card when clicked, displaying the student list
- **Student_Drill_Drawer**: A slide-over panel from the right edge of the viewport showing a student's drills for today
- **Batch**: A group of students training together on a fixed schedule
- **CalendarEntry**: The data model representing a session (batch, date, time, focus area, drills)
- **BatchStudentDrill**: The data model containing a student's drill assignments for a given date
- **Session_Key**: A unique identifier for a session composed as `${batchId}-${date}`
- **Curriculum_Plan**: A weekly drill assignment structure for a batch

## Requirements

### Requirement 1: Session Card Expansion

**User Story:** As a coach, I want to click a session card on the dashboard to see the students enrolled in that batch, so that I can quickly review who is in today's session without navigating away.

#### Acceptance Criteria

1. WHEN a coach clicks a Session_Card, THE Session_Panel SHALL expand below that card showing the list of students for the batch
2. WHEN a coach clicks an already-expanded Session_Card, THE Session_Panel SHALL collapse and return to the initial state
3. WHILE a Session_Panel is expanded, THE Dashboard SHALL ensure no other Session_Panel is simultaneously expanded
4. WHEN a coach clicks a different Session_Card while one is already expanded, THE Dashboard SHALL collapse the currently expanded panel and expand the newly clicked one

### Requirement 2: Student List Display

**User Story:** As a coach, I want to see the list of students in the expanded session panel with their names and skill levels, so that I can identify students at a glance.

#### Acceptance Criteria

1. WHEN a Session_Panel expands, THE Session_Panel SHALL fetch and display the students enrolled in that batch
2. WHEN students are displayed, THE Session_Panel SHALL show each student's name and skill level badge
3. WHEN a student row is clicked, THE Session_Panel SHALL visually highlight the selected student
4. WHEN the batch has no enrolled students, THE Session_Panel SHALL display an informational message: "No students enrolled in this batch yet."

### Requirement 3: Student Drill Drawer

**User Story:** As a coach, I want to click a student in the expanded list to see their drills for today, so that I can prepare for the session and know what each student should practice.

#### Acceptance Criteria

1. WHEN a coach clicks a student row in the Session_Panel, THE Student_Drill_Drawer SHALL open from the right side of the viewport
2. WHEN the Student_Drill_Drawer opens, THE Student_Drill_Drawer SHALL display the student's name, skill level, and today's drill assignments
3. WHEN drills are available, THE Student_Drill_Drawer SHALL display them grouped by focus area
4. WHEN no curriculum plan is assigned to the batch, THE Student_Drill_Drawer SHALL display: "No drills assigned for today. Please set up a curriculum plan for this batch."
5. WHEN a coach clicks the close button or the backdrop, THE Student_Drill_Drawer SHALL close and reset the selected student

### Requirement 4: State Consistency

**User Story:** As a coach, I want the drill-down interactions to behave predictably, so that I am never confused about what is expanded or selected.

#### Acceptance Criteria

1. THE Dashboard SHALL maintain at most one expanded Session_Panel at any time
2. WHILE the Student_Drill_Drawer is open, THE Dashboard SHALL keep the corresponding Session_Panel expanded
3. WHEN a coach switches to a different expanded session, THE Student_Drill_Drawer SHALL close automatically
4. WHEN the Student_Drill_Drawer closes, THE Dashboard SHALL preserve the expanded state of the current Session_Panel

### Requirement 5: Loading States

**User Story:** As a coach, I want to see loading indicators while data is being fetched, so that I know the system is responding to my actions.

#### Acceptance Criteria

1. WHILE students are being fetched for an expanded session, THE Session_Panel SHALL display a loading indicator
2. WHILE drills are being fetched for a selected student, THE Student_Drill_Drawer SHALL display a loading indicator

### Requirement 6: Error Handling

**User Story:** As a coach, I want to see clear error messages when data fails to load, so that I can retry or continue using other parts of the dashboard.

#### Acceptance Criteria

1. IF the student fetch fails, THEN THE Session_Panel SHALL display an error message with a retry option
2. IF the drill fetch fails, THEN THE Student_Drill_Drawer SHALL display an error message indicating data is temporarily unavailable
3. IF an error occurs in one Session_Panel, THEN THE Dashboard SHALL keep other session cards clickable and functional

### Requirement 7: Visual Feedback and Interaction

**User Story:** As a coach, I want session cards to provide hover and active states, so that I can tell which elements are interactive.

#### Acceptance Criteria

1. WHEN a coach hovers over a Session_Card, THE Session_Card SHALL display a pointer cursor and hover styling
2. WHEN a Session_Card is expanded, THE Session_Card SHALL show a visual indicator (chevron rotation) reflecting the expanded state
3. WHEN the Session_Panel expands or collapses, THE Dashboard SHALL animate the transition smoothly

### Requirement 8: Session Key Uniqueness

**User Story:** As a developer, I want each session to have a deterministic unique key, so that expansion state is tracked correctly even when multiple sessions exist for the same batch on different dates.

#### Acceptance Criteria

1. THE Dashboard SHALL generate the Session_Key as the concatenation of batchId and date separated by a hyphen
2. WHEN the same CalendarEntry is used to generate a Session_Key multiple times, THE Dashboard SHALL produce the same key each time
3. WHEN two CalendarEntries have different batchId or date values, THE Dashboard SHALL produce different Session_Keys
