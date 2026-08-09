# Requirements Document

## Introduction

When a new center is created in ShuttleCoach, the center head receives a welcome email with login credentials and a setup checklist. The center head's dashboard displays an onboarding checklist widget that guides them through initial setup: adding coaches, adding students, setting up curriculum, creating batch templates, creating batches, and assigning students to coaches/batches. The checklist persists on the dashboard until every item has been completed at least once, tracking real completion status based on actual data in the system.

## Glossary

- **Center**: A badminton coaching facility registered in ShuttleCoach, stored in the `centers` table with a `head_coach_id` foreign key
- **Center_Head**: The user with role HEAD_COACH who is assigned as `head_coach_id` on a center and is responsible for setting up the entire organization
- **Onboarding_Checklist**: A persistent widget on the Center_Head dashboard showing six setup tasks with their completion status
- **Checklist_Item**: A single actionable task within the Onboarding_Checklist (e.g., "Add a coach")
- **Welcome_Email**: An automated email sent to the Center_Head when a center is created, containing login credentials and the setup checklist
- **Email_Service**: The existing nodemailer-based service at `src/services/emailService.ts` used for sending transactional emails
- **Checklist_API**: The API endpoint(s) that return onboarding checklist status for a center
- **Dashboard**: The HEAD_COACH landing page where the Onboarding_Checklist widget is displayed

## Requirements

### Requirement 1: Welcome Email on Center Creation

**User Story:** As a center head, I want to receive a welcome email with my login credentials and a setup guide when my center is created, so that I can immediately begin setting up my organization.

#### Acceptance Criteria

1. WHEN a new center is created with a head_coach_id assigned, THE Email_Service SHALL send a Welcome_Email to the Center_Head's email address within 60 seconds of center creation without blocking the center creation response
2. THE Welcome_Email SHALL include the Center_Head's username, a password reset link that expires after 24 hours, and the center's branded login URL
3. THE Welcome_Email SHALL include a visible list of all six onboarding tasks: adding coaches, adding students, setting up curriculum, creating batch templates, creating batches, and assigning students to coaches/batches
4. IF the Center_Head's email address is null, empty, or fails format validation, THEN THE Email_Service SHALL log a warning including the center_id and skip email delivery without failing the center creation process
5. WHEN the welcome email fails to send due to a transient error (network timeout, SMTP connection failure, or temporary service unavailability), THE Email_Service SHALL retry delivery once after a 5-second delay, and if the retry also fails, log the error including center_id and continue without blocking center creation
6. IF the password reset link in the Welcome_Email has expired before the Center_Head uses it, THEN THE System SHALL allow the Center_Head to request a new password reset link from the login page

### Requirement 2: Onboarding Checklist Data Model

**User Story:** As the system, I want to persist onboarding checklist state per center, so that the checklist status survives across sessions and reflects real completion.

#### Acceptance Criteria

1. WHEN a new center is created, THE Database SHALL create an onboarding checklist record for that center with all six items initialized to incomplete status, a null completion timestamp, and a non-dismissed state
2. THE Database SHALL store for each Checklist_Item: the item key (maximum 50 characters), a boolean completion flag, and a completion timestamp that is null while the item is incomplete
3. THE Checklist_API SHALL determine item completion by checking real data (as defined in Requirement 6) and SHALL update the stored boolean flag and completion timestamp to reflect the current live state on each retrieval
4. WHEN a Checklist_Item's real condition is met (e.g., at least one coach exists in the center), THE Checklist_API SHALL report that item as completed and record the completion timestamp as the time the condition was first detected
5. IF a Checklist_Item's real condition is no longer met (e.g., the only coach is removed from the center), THEN THE Checklist_API SHALL report that item as incomplete and clear the stored completion timestamp

### Requirement 3: Checklist Status API

**User Story:** As the frontend dashboard, I want to fetch the current onboarding checklist status for a center, so that I can render the widget with up-to-date completion states.

#### Acceptance Criteria

1. WHEN a GET request is made to the Checklist_API by an authenticated Center_Head, THE Checklist_API SHALL return all six Checklist_Items each containing the item key, a boolean completion flag, and a completion timestamp (null if incomplete), along with the checklist dismissed state, within 2 seconds
2. THE Checklist_API SHALL scope checklist data to the Center_Head's own center using center_id from the authenticated user's context
3. WHEN all six Checklist_Items are completed, THE Checklist_API SHALL include a boolean flag indicating the entire onboarding is complete
4. IF an unauthenticated request is made to the Checklist_API, THEN THE Checklist_API SHALL return a 401 status
5. IF a request is made by an authenticated user who does not have the HEAD_COACH role, THEN THE Checklist_API SHALL return a 403 status
6. IF no checklist record exists for the Center_Head's center, THEN THE Checklist_API SHALL return a response with all six items marked as incomplete with null timestamps

### Requirement 4: Manual Dismissal of Checklist

**User Story:** As a center head, I want to manually dismiss the onboarding checklist from my dashboard once I am done with setup, so that it no longer occupies screen space even if I choose not to complete every item.

#### Acceptance Criteria

1. WHEN the Center_Head clicks the dismiss action on the Onboarding_Checklist, THE System SHALL send a request to the Checklist_API to mark the checklist as dismissed for that center and remove the widget from the Dashboard within 1 second
2. WHILE the checklist is dismissed, THE Dashboard SHALL hide the Onboarding_Checklist widget
3. WHEN the checklist is marked as dismissed, THE System SHALL persist the dismissed state to the database so that the checklist remains hidden across sessions and page reloads
4. WHEN all six Checklist_Items are completed, THE Dashboard SHALL automatically hide the Onboarding_Checklist widget without requiring manual dismissal, regardless of the dismissed flag state
5. IF the dismiss request fails due to a network or server error, THEN THE Dashboard SHALL display an error message indicating the dismissal could not be saved and keep the widget visible

### Requirement 5: Onboarding Checklist Dashboard Widget

**User Story:** As a center head, I want to see an onboarding checklist on my dashboard after my center is created, so that I know exactly what steps to complete to get my organization running.

#### Acceptance Criteria

1. WHEN the Center_Head logs into the Dashboard and the onboarding is not dismissed and not fully complete, THE Dashboard SHALL display the Onboarding_Checklist widget at the top of the dashboard content area, before any other dashboard widgets
2. THE Onboarding_Checklist widget SHALL display each of the six Checklist_Items with a label, a completion indicator (checked or unchecked), and a link to the relevant page for that action
3. THE Onboarding_Checklist widget SHALL display a progress summary in the format "{n} of 6 completed" where n is the count of completed items
4. WHILE the Onboarding_Checklist is visible, THE Dashboard SHALL render the widget above other dashboard content so it is immediately visible without scrolling on viewports 768px or wider
5. WHEN the Center_Head clicks a Checklist_Item link, THE Dashboard SHALL navigate to the relevant page (e.g., "Add a coach" links to the coaches management page)
6. IF the Checklist_API request fails or times out after 10 seconds, THEN THE Dashboard SHALL hide the Onboarding_Checklist widget and not block rendering of other dashboard content

### Requirement 6: Checklist Item Completion Detection

**User Story:** As the system, I want to automatically detect when onboarding tasks are completed based on real data, so that the checklist reflects actual progress without requiring manual check-off.

#### Acceptance Criteria

1. THE Checklist_API SHALL mark "Add a coach" as complete WHEN at least one user with role ASSISTANT_COACH or HEAD_COACH (other than the Center_Head) exists in the center
2. THE Checklist_API SHALL mark "Add students" as complete WHEN at least one student record exists in the center
3. THE Checklist_API SHALL mark "Set up curriculum" as complete WHEN at least one curriculum_plan record exists in the center
4. THE Checklist_API SHALL mark "Create batch templates" as complete WHEN at least one batch template record exists in the center
5. THE Checklist_API SHALL mark "Create batches" as complete WHEN at least one batch record exists in the center
6. THE Checklist_API SHALL mark "Assign students to coaches/batches" as complete WHEN at least one student in the center has a non-null assigned_coach_id or a non-null batch_id
7. WHEN a previously completed Checklist_Item's condition is no longer met (e.g., all coaches are removed), THE Checklist_API SHALL report that item as incomplete on the next request
8. THE Checklist_API SHALL evaluate all completion conditions on each request using current data rather than cached state

### Requirement 7: Checklist Visibility Rules

**User Story:** As the system, I want the onboarding checklist to only appear for center heads of newly created centers and not for other roles, so that the experience is targeted and relevant.

#### Acceptance Criteria

1. THE Dashboard SHALL display the Onboarding_Checklist only for users with the HEAD_COACH role who are the assigned head_coach_id of the center
2. THE Dashboard SHALL hide the Onboarding_Checklist for users with role ASSISTANT_COACH, STUDENT, or ADMIN
3. WHEN all six Checklist_Items are completed, THE Dashboard SHALL hide the Onboarding_Checklist widget automatically regardless of dismissal state
4. WHEN a Center_Head has previously dismissed the checklist, THE Dashboard SHALL not display the Onboarding_Checklist even if the user navigates away and returns
5. IF a Center_Head is assigned to multiple centers, THEN THE Dashboard SHALL display the Onboarding_Checklist for the currently active center only, using that center's checklist state
