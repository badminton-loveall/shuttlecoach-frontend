# Requirements Document

## Introduction

This feature enhances the existing calendar views for both students and coaches in ShuttleCoach. The student calendar gains skill-level-based color theming for session highlights. The coach calendar is upgraded to display all batches simultaneously with color differentiation, and adds drill-down capabilities to view batch details and individual student drill assignments for any given session day.

## Glossary

- **Student_Calendar**: The `StudentScheduleCalendar` component that displays a monthly grid calendar of a student's training sessions within their assigned batch.
- **Coach_Calendar**: The `SessionCalendarPage` that displays the coach's training session calendar across batches.
- **Skill_Level**: A classification of a student's ability — one of Beginner, Intermediate, Advanced, or Professional.
- **Skill_Level_Color**: The color mapped to a Skill_Level — blue for Beginner, orange for Intermediate, purple for Advanced, green for Professional.
- **Batch**: A group of students trained together on a shared schedule.
- **Batch_Color**: A unique color assigned to each batch in the Coach_Calendar to visually distinguish batches from one another.
- **Session_Day**: A calendar date on which one or more training sessions are scheduled.
- **Drill_Schedule**: The list of drills a specific student is assigned to practice on a particular Session_Day, as determined by their curriculum.
- **Detail_Panel**: A UI panel that appears when a user clicks on a Session_Day, showing contextual information about that day's sessions.
- **Calendar_API**: The backend endpoint `/api/session-calendar` that serves calendar entry data.
- **Batch_Students_API**: A backend endpoint that returns the list of students enrolled in a batch along with their drill assignments for a specific date.

## Requirements

### Requirement 1: Skill-Level Session Highlight Color

**User Story:** As a student, I want my calendar session days to be highlighted in the color associated with my skill level, so that the calendar feels personalized and consistent with my profile.

#### Acceptance Criteria

1. WHEN the Student_Calendar renders session days, THE Student_Calendar SHALL highlight those days using the Skill_Level_Color corresponding to the student's current Skill_Level.
2. THE Student_Calendar SHALL use blue for Beginner, orange for Intermediate, purple for Advanced, and green for Professional as highlight colors.
3. WHEN a student's Skill_Level changes, THE Student_Calendar SHALL reflect the updated Skill_Level_Color on the next render without requiring a page reload.
4. THE Student_Calendar SHALL apply the Skill_Level_Color to the day cell background, the selected-day ring, and the drill badge backgrounds in the Detail_Panel.

### Requirement 2: Coach Multi-Batch Calendar View

**User Story:** As a coach, I want to see all my batches displayed on a single calendar view, so that I can get a complete picture of my training schedule without switching between batches.

#### Acceptance Criteria

1. WHEN the Coach_Calendar loads, THE Coach_Calendar SHALL fetch and display sessions from all batches assigned to the coach in a single unified view.
2. THE Coach_Calendar SHALL assign a distinct Batch_Color to each batch and use that color to highlight the corresponding session days.
3. WHEN a Session_Day has sessions from multiple batches, THE Coach_Calendar SHALL display multiple color indicators on that day cell, one for each batch with a session.
4. THE Coach_Calendar SHALL display a legend mapping each Batch_Color to its batch name, allowing the coach to identify which color represents which batch.
5. WHEN there are more than six batches, THE Coach_Calendar SHALL cycle through a predefined palette of distinguishable colors.

### Requirement 3: Coach Batch Detail on Day Click

**User Story:** As a coach, I want to click on a session day and see which batches have sessions, the time for each, and the list of students in each batch, so that I can plan and prepare for the day's training.

#### Acceptance Criteria

1. WHEN a coach clicks on a Session_Day in the Coach_Calendar, THE Detail_Panel SHALL display a list of all batches that have sessions on that date.
2. FOR EACH batch displayed in the Detail_Panel, THE Detail_Panel SHALL show the batch name, session start time, session end time, and the focus area.
3. FOR EACH batch displayed in the Detail_Panel, THE Detail_Panel SHALL show the list of enrolled students with their full name and Skill_Level_Color-coded avatar indicator.
4. THE Batch_Students_API SHALL accept a batchId and date parameter and return the list of students in that batch along with their skill level.
5. IF the Batch_Students_API returns an error, THEN THE Detail_Panel SHALL display a message indicating that student data is temporarily unavailable.

### Requirement 4: Coach Student Drill View

**User Story:** As a coach, I want to click on a student's name in the batch detail panel and see the drills that student needs to practice on that day, so that I can provide targeted coaching during the session.

#### Acceptance Criteria

1. WHEN a coach clicks on a student name in the Detail_Panel, THE Detail_Panel SHALL expand or navigate to show the Drill_Schedule for that student on the selected date.
2. THE Drill_Schedule display SHALL include each drill name and the focus area it belongs to.
3. THE Batch_Students_API SHALL return the drill assignments for each student when a date parameter is provided.
4. WHEN a student has no drills assigned for the selected date, THE Detail_Panel SHALL display a message indicating no drills are scheduled for that student.
5. THE Detail_Panel SHALL allow the coach to collapse the student drill view and return to the batch student list.

### Requirement 5: Coach Calendar Color Differentiation

**User Story:** As a coach, I want each batch to have a visually distinct color on my calendar, so that I can quickly identify which sessions belong to which batch at a glance.

#### Acceptance Criteria

1. THE Coach_Calendar SHALL assign colors from a predefined palette of at least six visually distinct colors to batches in a consistent order.
2. THE Coach_Calendar SHALL maintain the same Batch_Color assignment for a given batch across navigation between months.
3. THE Coach_Calendar SHALL ensure sufficient contrast between Batch_Color indicators and the calendar background in both light and dark themes.
4. WHEN the coach hovers over a colored indicator on a Session_Day, THE Coach_Calendar SHALL display a tooltip showing the batch name.

### Requirement 6: Backend Batch Students and Drills Endpoint

**User Story:** As the frontend application, I need an API endpoint that returns the students in a batch along with their curriculum-based drill assignments for a specific date, so that the coach calendar can display student drill details.

#### Acceptance Criteria

1. THE Batch_Students_API SHALL expose a GET endpoint at `/api/batch-students-drills` that accepts `batchId` and `date` as query parameters.
2. WHEN a valid batchId and date are provided, THE Batch_Students_API SHALL return an array of student objects containing: studentId, fullName, skillLevel, and drills (an array of drill names assigned for that date).
3. IF the batchId does not exist or the coach is not assigned to the batch, THEN THE Batch_Students_API SHALL return a 403 Forbidden response.
4. IF the date parameter is missing or invalid, THEN THE Batch_Students_API SHALL return a 400 Bad Request response with a descriptive error message.
5. THE Batch_Students_API SHALL derive drill assignments from the student's curriculum position (week number and day of week) for the requested date.
