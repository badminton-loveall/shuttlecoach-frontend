# Requirements Document

## Introduction

Batch Time Templates introduce a reusable schedule-template entity that defines recurring session patterns for coaching batches. A template contains multiple session slots (day of week, start time, duration) forming a weekly pattern that repeats monthly. Templates are assigned to batches, replacing inline schedule fields, and drive the session calendar. The batch structure is extended to support a mandatory head coach, optional assistant coaches with non-overlapping student assignments, and a dedicated Settings tab for template management.

## Glossary

- **Batch_Time_Template**: A reusable entity that defines a recurring weekly session schedule pattern consisting of one or more Session_Slots
- **Session_Slot**: A single scheduled session within a template, defined by a day of week, start time, and duration
- **Batch**: A group of students that trains together under a coaching team, assigned a single Batch_Time_Template
- **Head_Coach**: The mandatory primary coach assigned to a Batch who has full management authority
- **Assistant_Coach**: An optional secondary coach assigned to a subset of students within a Batch
- **Student_Assignment**: The mapping of a student to a specific coach (Head_Coach or Assistant_Coach) within a Batch
- **Settings_Page**: The MasterDataPage UI that provides tabbed navigation for center configuration
- **Templates_Tab**: The Settings tab dedicated to managing Batch_Time_Templates
- **Batches_Tab**: The Settings tab for managing Batches, coach assignments, and student assignments

## Requirements

### Requirement 1: Batch Time Template CRUD

**User Story:** As a head coach, I want to create, view, edit, and delete batch time templates, so that I can define reusable session schedules for my batches.

#### Acceptance Criteria

1. THE Templates_Tab SHALL display a list of all non-archived Batch_Time_Templates for the current center
2. WHEN a head coach submits a valid template creation form, THE System SHALL create a new Batch_Time_Template with a name and one or more Session_Slots
3. WHEN a head coach submits a valid template edit form, THE System SHALL update the Batch_Time_Template name and Session_Slots
4. WHEN a head coach confirms deletion of a Batch_Time_Template, THE System SHALL soft-delete (archive) the template
5. IF a Batch_Time_Template is currently assigned to one or more active Batches, THEN THE System SHALL prevent deletion and display an error message indicating which batches use the template

### Requirement 2: Session Slot Definition

**User Story:** As a head coach, I want to define session slots with specific days, start times, and durations, so that the weekly schedule pattern is precise and clear.

#### Acceptance Criteria

1. THE System SHALL allow each Session_Slot to specify exactly one day of week (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
2. THE System SHALL allow each Session_Slot to specify a start time in HH:MM format (24-hour)
3. THE System SHALL allow each Session_Slot to specify a duration in whole hours (minimum 1 hour, maximum 4 hours)
4. THE System SHALL allow a Batch_Time_Template to contain between 1 and 14 Session_Slots
5. IF two Session_Slots within the same template overlap in time on the same day, THEN THE System SHALL reject the template and display a validation error

### Requirement 3: Template Assignment to Batch

**User Story:** As a head coach, I want to assign a batch time template to a batch, so that the batch automatically follows the defined recurring session schedule.

#### Acceptance Criteria

1. WHEN a head coach assigns a Batch_Time_Template to a Batch, THE System SHALL store the template reference on the Batch
2. THE System SHALL allow only one Batch_Time_Template to be assigned to a Batch at a time
3. WHEN a Batch_Time_Template is assigned to a Batch, THE System SHALL generate session calendar entries based on the template's Session_Slots
4. WHEN a head coach changes the template assigned to a Batch, THE System SHALL regenerate future session calendar entries from the new template
5. THE System SHALL allow a Batch to exist without an assigned template (template assignment is optional)

### Requirement 4: Batch Coach Structure

**User Story:** As a head coach, I want to assign a head coach and multiple assistant coaches to a batch, so that coaching responsibilities are clearly distributed.

#### Acceptance Criteria

1. THE System SHALL require exactly one Head_Coach assignment per Batch
2. THE System SHALL allow zero or more Assistant_Coach assignments per Batch
3. WHEN an Assistant_Coach is assigned to a Batch, THE System SHALL require at least one student to be assigned to that Assistant_Coach
4. THE System SHALL prevent a student from being assigned to more than one coach (Head_Coach or Assistant_Coach) within the same Batch
5. WHEN an Assistant_Coach is removed from a Batch, THE System SHALL unassign all students from that Assistant_Coach and reassign them to the Head_Coach

### Requirement 5: Student Assignment to Coaches

**User Story:** As a head coach, I want to assign specific students to assistant coaches within a batch, so that each coach has clear responsibility for their students without overlap.

#### Acceptance Criteria

1. WHEN a head coach assigns a student to an Assistant_Coach, THE System SHALL validate that the student is not already assigned to another Assistant_Coach in the same Batch
2. THE System SHALL assign students not explicitly assigned to an Assistant_Coach to the Head_Coach by default
3. WHEN a student is moved from one coach to another within the same Batch, THE System SHALL update the assignment atomically
4. THE System SHALL display the student count per coach in the Batches_Tab interface
5. IF a student is removed from a Batch, THEN THE System SHALL also remove the student's coach assignment within that Batch

### Requirement 6: Settings Page Tab Structure

**User Story:** As a head coach, I want the Settings page to have separate tabs for Templates and Batches, so that I can manage schedule patterns independently from batch configuration.

#### Acceptance Criteria

1. THE Settings_Page SHALL display a "Templates" tab in the tab navigation alongside existing tabs (Center, Batches, Drills)
2. THE Templates_Tab SHALL be accessible to users with the HEAD_COACH role with full CRUD access
3. THE Templates_Tab SHALL be accessible to users with the ASSISTANT_COACH role in read-only mode
4. WHEN the Templates_Tab is active, THE System SHALL display the list of Batch_Time_Templates with their session slot summaries
5. THE Batches_Tab SHALL display template assignment, head coach, assistant coaches, and student assignments for each batch

### Requirement 7: Batch Time Template Data Model

**User Story:** As a developer, I want a well-defined data model for batch time templates, so that the system can store and query templates efficiently.

#### Acceptance Criteria

1. THE System SHALL store each Batch_Time_Template with: id, name, center_id, is_archived, created_at, updated_at
2. THE System SHALL store each Session_Slot with: id, template_id, day_of_week, start_time, duration_hours
3. THE System SHALL store the template assignment on the Batch as a template_id foreign key
4. THE System SHALL store assistant coach assignments in a batch_coach_assignments table with: batch_id, coach_id, role (head_coach or assistant_coach)
5. THE System SHALL store student-to-coach assignments with: batch_id, student_id, assigned_coach_id
6. THE System SHALL enforce referential integrity between Batch_Time_Template, Session_Slot, and Batch records

### Requirement 8: Session Calendar Generation from Template

**User Story:** As a coach, I want the session calendar to automatically reflect the template schedule, so that I can see upcoming sessions without manual entry.

#### Acceptance Criteria

1. WHEN a Batch has an assigned Batch_Time_Template, THE System SHALL generate calendar sessions for the requested date range based on the template's Session_Slots
2. THE System SHALL generate sessions by mapping each Session_Slot to matching weekdays within the requested date range
3. WHEN the session calendar API is queried, THE System SHALL return sessions with day_of_week, start_time, and duration derived from the assigned template
4. IF a Batch has no assigned template, THEN THE System SHALL return an empty session list for that batch
5. THE System SHALL support generating sessions for a configurable date range (default: current month)
