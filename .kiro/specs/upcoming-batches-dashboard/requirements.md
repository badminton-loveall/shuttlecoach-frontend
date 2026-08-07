# Requirements Document

## Introduction

This feature adds an "Upcoming Batches" dashboard section to the existing HeadCoachDashboard and AssistantCoachDashboard pages. It provides coaches with immediate visibility into their next scheduled session — including batch name, timing, and enrolled students — without navigating away from the main dashboard. For HEAD_COACHes, it additionally surfaces a compact "Team Schedule" overview showing upcoming sessions for all assistant coaches within the center.

## Glossary

- **Dashboard_API**: The backend endpoint (`GET /api/dashboard/upcoming`) that computes and returns upcoming session data for the requesting user
- **Calendar_Engine**: The existing `calendarEngine.ts` service that generates calendar entries from session schedules and recurrence patterns
- **Next_Session_Widget**: The frontend component displayed on the dashboard showing the coach's immediately upcoming session details
- **Team_Schedule_Widget**: The frontend component displayed on the HEAD_COACH dashboard showing a compact list of all assistant coaches' upcoming sessions within the same center
- **Session_Schedule**: A database record containing JSONB slot definitions (dayOfWeek, startTime, endTime) and recurrence patterns for a batch
- **Batch**: A student grouping with an assigned coach, schedule, and enrolled students
- **Center**: The multi-tenant organizational unit scoping all data (center_id)

## Requirements

### Requirement 1: Dashboard API — Next Session for Requesting Coach

**User Story:** As a coach (HEAD_COACH or ASSISTANT_COACH), I want a single API call to retrieve my next upcoming session details, so that the dashboard can display them immediately on login.

#### Acceptance Criteria

1. WHEN an authenticated coach sends a GET request to `/api/dashboard/upcoming`, THE Dashboard_API SHALL return the next upcoming session for all batches assigned to the requesting coach
2. THE Dashboard_API SHALL include the batch name, session date (YYYY-MM-DD), start time, and end time in each returned session object
3. THE Dashboard_API SHALL include a list of enrolled students (id, full_name, profile_photo) for each batch in the response
4. WHEN no upcoming sessions exist within the next 14 days, THE Dashboard_API SHALL return an empty sessions array
5. THE Dashboard_API SHALL scope all queries by the requesting user's center_id
6. WHEN the requesting user is not authenticated, THE Dashboard_API SHALL return a 401 status code

### Requirement 2: Dashboard API — Team Schedule for HEAD_COACH

**User Story:** As a HEAD_COACH, I want to see the upcoming sessions for all assistant coaches in my center, so that I can monitor the full center's schedule at a glance.

#### Acceptance Criteria

1. WHEN an authenticated HEAD_COACH sends a GET request to `/api/dashboard/upcoming`, THE Dashboard_API SHALL additionally return a `teamSchedule` array containing upcoming sessions for all coaches within the same center
2. THE Dashboard_API SHALL include the coach name, batch name, next session date, start time, end time, and student count for each entry in the teamSchedule array
3. WHEN an ASSISTANT_COACH sends a GET request to `/api/dashboard/upcoming`, THE Dashboard_API SHALL omit the teamSchedule field from the response
4. THE Dashboard_API SHALL sort the teamSchedule entries by session date ascending, then by start time ascending
5. THE Dashboard_API SHALL limit the teamSchedule to sessions within the next 7 days

### Requirement 3: Next Session Computation

**User Story:** As a coach, I want the system to correctly compute my next session from the recurrence schedule, so that I always see the accurate upcoming date and time.

#### Acceptance Criteria

1. THE Calendar_Engine SHALL compute the next occurrence by evaluating session_schedule slots against recurrence patterns (repeatDays, repeatEvery, endType)
2. WHEN today has a session that has not yet ended (current time < endTime), THE Calendar_Engine SHALL include today's session as the next session
3. WHEN today has no remaining sessions, THE Calendar_Engine SHALL return the next chronologically scheduled session within the 14-day lookahead window
4. IF a batch has no session_schedule record, THEN THE Dashboard_API SHALL exclude that batch from the response
5. IF a batch's recurrence has ended (past endDate or exceeded occurrenceCount), THEN THE Dashboard_API SHALL exclude that batch from the response

### Requirement 4: Assistant Coach Dashboard — Next Session Widget

**User Story:** As an ASSISTANT_COACH, I want to see my next session prominently at the top of my dashboard, so that I can quickly know when and who I am coaching next.

#### Acceptance Criteria

1. WHEN the AssistantCoachDashboard loads, THE Next_Session_Widget SHALL be displayed prominently at the top of the page, above stat cards
2. THE Next_Session_Widget SHALL display the batch name, session date (formatted as a readable date), start time, and end time
3. THE Next_Session_Widget SHALL display a list of enrolled students showing each student's full name and profile photo
4. WHEN no upcoming session exists within the next 14 days, THE Next_Session_Widget SHALL display a message stating "No upcoming sessions scheduled"
5. WHILE the API request is in progress, THE Next_Session_Widget SHALL display a loading skeleton placeholder

### Requirement 5: Head Coach Dashboard — Own Next Session

**User Story:** As a HEAD_COACH, I want to see my own next session at the top of my dashboard, so that I have the same at-a-glance view as assistant coaches.

#### Acceptance Criteria

1. WHEN the HeadCoachDashboard loads, THE Next_Session_Widget SHALL be displayed prominently at the top of the page, above stat cards
2. THE Next_Session_Widget SHALL display the batch name, session date, start time, and end time for the HEAD_COACH's own next session
3. THE Next_Session_Widget SHALL display the enrolled students list for that batch
4. WHEN no upcoming session exists within the next 14 days, THE Next_Session_Widget SHALL display a message stating "No upcoming sessions scheduled"

### Requirement 6: Head Coach Dashboard — Team Schedule Widget

**User Story:** As a HEAD_COACH, I want a compact overview of all my assistant coaches' upcoming sessions, so that I can monitor the center's activity without checking each coach individually.

#### Acceptance Criteria

1. WHEN the HeadCoachDashboard loads, THE Team_Schedule_Widget SHALL be displayed below the HEAD_COACH's own next session section
2. THE Team_Schedule_Widget SHALL display each assistant coach's name, batch name, next session date and time, and student count in a compact card or row format
3. WHEN an assistant coach has multiple batches, THE Team_Schedule_Widget SHALL display one entry per batch-session
4. WHEN no team sessions exist within the next 7 days, THE Team_Schedule_Widget SHALL display a message stating "No team sessions in the next 7 days"
5. WHILE the API request is in progress, THE Team_Schedule_Widget SHALL display a loading skeleton placeholder
6. THE Team_Schedule_Widget SHALL sort entries by session date ascending, then start time ascending

### Requirement 7: Data Freshness and Error Handling

**User Story:** As a coach, I want the dashboard to handle errors gracefully and show current data, so that I can trust the information displayed.

#### Acceptance Criteria

1. IF the Dashboard_API returns an error (non-2xx status), THEN THE Next_Session_Widget SHALL display an error message with a retry option
2. IF the Dashboard_API returns an error (non-2xx status), THEN THE Team_Schedule_Widget SHALL display an error message with a retry option
3. THE Next_Session_Widget SHALL fetch fresh data on each dashboard page load (no stale cache across navigations)
4. WHEN the user clicks the retry button after an error, THE Next_Session_Widget SHALL re-fetch the data from the Dashboard_API
