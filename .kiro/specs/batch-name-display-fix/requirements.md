# Requirements Document

## Introduction

The ShuttleCoach frontend currently displays raw batch IDs (UUID fragments) instead of human-readable batch names across four screens: Dashboard student cards, Recent Activity feed, Student Profile header, and Curriculum Builder batch dropdown. This feature introduces a shared batch lookup mechanism using the existing `GET /batches` API endpoint to resolve batch IDs to their actual names across all affected components.

## Glossary

- **Batch_Lookup_Hook**: The `useBatches()` React hook that fetches batches from the API and exposes a `getBatchName()` resolver function
- **Batch_Name**: The human-readable name string stored in the database for a batch (e.g., "Morning Beginners", "Advanced Evening")
- **Batch_ID**: The UUID identifier for a batch stored on the Student record
- **StudentCard**: The card component displayed on the Dashboard showing student info including batch assignment
- **Activity_Feed**: The Recent Activity section on the Dashboard that shows student actions with batch context
- **Student_Profile_Page**: The page displaying a single student's details including their batch assignment
- **Curriculum_Builder_Page**: The page for managing curriculum with a batch selection dropdown
- **Fallback_String**: The text "Unknown batch" displayed when a batch ID cannot be resolved

## Requirements

### Requirement 1: Batch Data Fetching

**User Story:** As a coach, I want the app to load batch names from the server, so that I see real batch names instead of ID fragments.

#### Acceptance Criteria

1. WHEN the Batch_Lookup_Hook is initialized, THE Batch_Lookup_Hook SHALL fetch all batches from the `GET /batches` API endpoint
2. WHEN the API returns a successful response, THE Batch_Lookup_Hook SHALL build an internal map from Batch_ID to Batch_Name
3. WHILE the API request is in progress, THE Batch_Lookup_Hook SHALL expose a `loading` state of `true`
4. WHEN the API request completes successfully, THE Batch_Lookup_Hook SHALL set `loading` to `false` and `error` to `null`
5. IF the API request fails, THEN THE Batch_Lookup_Hook SHALL set `error` to a descriptive message and return an empty batches list

### Requirement 2: Batch Name Resolution

**User Story:** As a coach, I want batch IDs to be resolved to readable names, so that I can identify batches at a glance.

#### Acceptance Criteria

1. WHEN `getBatchName` is called with a valid Batch_ID that exists in the fetched batches, THE Batch_Lookup_Hook SHALL return the corresponding Batch_Name string
2. WHEN `getBatchName` is called with a Batch_ID that does not exist in the fetched batches, THE Batch_Lookup_Hook SHALL return the Fallback_String
3. WHEN `getBatchName` is called with `undefined` or `null`, THE Batch_Lookup_Hook SHALL return the Fallback_String
4. THE Batch_Lookup_Hook SHALL never throw an error from `getBatchName` regardless of input

### Requirement 3: Dashboard Student Cards

**User Story:** As a coach, I want student cards on the Dashboard to show real batch names, so that I can identify which batch each student belongs to.

#### Acceptance Criteria

1. WHEN a StudentCard is rendered with a `batchName` prop, THE StudentCard SHALL display the provided Batch_Name
2. WHEN a StudentCard is rendered without a `batchName` prop and the student has a Batch_ID, THE StudentCard SHALL display the Fallback_String
3. WHEN a student has no Batch_ID assigned, THE StudentCard SHALL omit the batch label entirely

### Requirement 4: Recent Activity Feed

**User Story:** As a coach, I want the activity feed to show real batch names, so that activity descriptions are meaningful.

#### Acceptance Criteria

1. WHEN generating activity descriptions and a `getBatchName` function is provided, THE Activity_Feed SHALL use it to resolve batch names in activity text
2. WHEN generating activity descriptions without a `getBatchName` function, THE Activity_Feed SHALL maintain existing behavior for backward compatibility
3. WHEN a batch name appears in an activity description, THE Activity_Feed SHALL display the resolved Batch_Name, not a UUID fragment

### Requirement 5: Student Profile Page

**User Story:** As a coach, I want the Student Profile header to show the real batch name, so that I can confirm the student's current batch assignment.

#### Acceptance Criteria

1. WHEN the Student_Profile_Page renders a student with a Batch_ID, THE Student_Profile_Page SHALL display the resolved Batch_Name from the Batch_Lookup_Hook
2. WHEN the Student_Profile_Page renders a student whose Batch_ID is not found, THE Student_Profile_Page SHALL display the Fallback_String
3. THE Student_Profile_Page SHALL not display a UUID fragment as the batch name

### Requirement 6: Curriculum Builder Batch Dropdown

**User Story:** As a coach, I want the Curriculum Builder batch dropdown to list actual batch names, so that I can select the correct batch.

#### Acceptance Criteria

1. WHEN the Curriculum_Builder_Page renders the batch dropdown, THE Curriculum_Builder_Page SHALL populate options from the API-fetched batches list
2. WHEN displaying batch options, THE Curriculum_Builder_Page SHALL show each batch's Batch_Name as the option label
3. THE Curriculum_Builder_Page SHALL display all batches returned by the API with no duplicates
4. WHILE batches are loading, THE Curriculum_Builder_Page SHALL indicate a loading state in the dropdown
