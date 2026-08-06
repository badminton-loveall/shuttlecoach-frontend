# Requirements Document

## Introduction

A dedicated settings page that allows the Head Coach to configure session schedules (training days and times) for each batch. The page wires together the existing ScheduleBuilder component, batch-related hooks, and session schedule API hooks into a cohesive settings interface accessible from the Settings/Master Data area.

## Glossary

- **Page**: The BatchSessionScheduleSettingsPage React component rendered at the `/batch-schedule` route
- **Head_Coach**: The user role with exclusive access to configure session schedules
- **Batch_Selector**: A dropdown control populated by the useBatches hook that allows the Head Coach to choose a batch
- **Schedule_Builder**: The existing ScheduleBuilder component that renders day-of-week toggles, time pickers, and recurrence configuration
- **Session_Schedule**: The schedule data (slots and recurrence) returned by the useSessionSchedule hook for a given batch
- **Toast**: A transient notification rendered via the useToast context hook to communicate success or error outcomes
- **Dashboard_Layout**: The DashboardLayout wrapper component providing TopNav and consistent page structure

## Requirements

### Requirement 1: Page Routing and Access Control

**User Story:** As a Head Coach, I want the batch schedule settings page accessible only to my role, so that unauthorized users cannot modify session schedules.

#### Acceptance Criteria

1. THE Page SHALL be rendered at the `/batch-schedule` route path.
2. THE Page SHALL be wrapped in a ProtectedRoute component with allowedRoles restricted to HEAD_COACH.
3. WHEN an unauthenticated user navigates to `/batch-schedule`, THE ProtectedRoute SHALL redirect the user to `/login`.
4. WHEN an authenticated user without HEAD_COACH role navigates to `/batch-schedule`, THE ProtectedRoute SHALL redirect the user to `/access-denied`.

### Requirement 2: Page Layout and Structure

**User Story:** As a Head Coach, I want the batch schedule settings page to match the visual style of other dashboard pages, so that the experience is consistent.

#### Acceptance Criteria

1. THE Page SHALL render inside the Dashboard_Layout component.
2. THE Page SHALL display a page heading with the text "Session Schedule".
3. THE Page SHALL follow the same spacing, padding, and typography patterns used by existing settings pages in the application.

### Requirement 3: Batch Selection

**User Story:** As a Head Coach, I want to select a batch from a dropdown, so that I can configure the schedule for a specific batch.

#### Acceptance Criteria

1. THE Page SHALL render a Batch_Selector dropdown populated with batches returned by the useBatches hook.
2. WHILE the useBatches hook is loading, THE Batch_Selector SHALL display a loading indicator or disabled state.
3. WHEN no batch is selected, THE Page SHALL display a prompt instructing the user to select a batch.
4. IF the useBatches hook returns an error, THEN THE Page SHALL display an error message indicating batches could not be loaded.

### Requirement 4: Schedule Loading

**User Story:** As a Head Coach, I want the existing schedule for a batch to load automatically when I select it, so that I can review or modify the current configuration.

#### Acceptance Criteria

1. WHEN a batch is selected in the Batch_Selector, THE Page SHALL invoke the useSessionSchedule hook with the selected batch ID.
2. WHILE the useSessionSchedule hook is loading, THE Page SHALL display a loading indicator in place of the Schedule_Builder.
3. WHEN the useSessionSchedule hook returns schedule data, THE Page SHALL pass the schedule slots as initialSlots and the recurrence pattern as initialRecurrence to the Schedule_Builder.
4. WHEN the useSessionSchedule hook returns no existing schedule for the selected batch, THE Page SHALL render the Schedule_Builder with empty initial state for new schedule creation.
5. IF the useSessionSchedule hook returns an error, THEN THE Page SHALL display an error message indicating the schedule could not be loaded.

### Requirement 5: Schedule Saving

**User Story:** As a Head Coach, I want to save the configured schedule, so that the training days and times are persisted for the selected batch.

#### Acceptance Criteria

1. WHEN the user triggers save on the Schedule_Builder, THE Page SHALL invoke the useCreateSessionSchedule hook with the selected batch ID, the configured slots, and the recurrence pattern.
2. WHILE the useCreateSessionSchedule hook is processing, THE Schedule_Builder SHALL display its saving state via the isSaving prop set to true.
3. WHEN the useCreateSessionSchedule hook completes successfully, THE Page SHALL display a success Toast with the message "Schedule saved successfully".
4. WHEN the useCreateSessionSchedule hook completes successfully, THE Page SHALL refetch the session schedule to reflect the persisted state.
5. IF the useCreateSessionSchedule hook returns an error, THEN THE Page SHALL display an error Toast with the message "Failed to save schedule. Please try again."

### Requirement 6: Schedule Builder Integration

**User Story:** As a Head Coach, I want to use the familiar schedule builder interface to configure training days and time slots, so that the interaction is intuitive.

#### Acceptance Criteria

1. THE Page SHALL render the Schedule_Builder component with readOnly set to false.
2. THE Page SHALL pass an onSave callback to the Schedule_Builder that triggers the save workflow described in Requirement 5.
3. WHEN a different batch is selected in the Batch_Selector, THE Page SHALL reset the Schedule_Builder state to reflect the newly loaded schedule data.
