# Requirements Document

## Introduction

This feature introduces enrollment duration management to ShuttleCoach. Currently, students are enrolled indefinitely with no end date or duration tracking. This feature adds the ability to specify an enrollment period (1 month, 2 months, quarter, half year, yearly, or indefinite) when enrolling a student. The system computes an enrollment end date, displays enrollment status indicators, constrains the session calendar to the enrollment period, and supports renewal/extension of enrollments.

## Glossary

- **Enrollment_System**: The subsystem responsible for creating, tracking, and managing student enrollments including duration, start date, end date, and status.
- **Enrollment_Duration**: A predefined time period selected during enrollment. Valid values: 1_month, 2_months, 3_months, 6_months, 12_months, indefinite.
- **Enrollment_Start_Date**: The date from which the enrollment is considered active. Defaults to the current date.
- **Enrollment_End_Date**: The computed date on which the enrollment expires. Calculated as Enrollment_Start_Date plus Enrollment_Duration. Null for indefinite enrollments.
- **Enrollment_Status**: The lifecycle state of an enrollment. Values: active (within duration), expiring_soon (within 7 days of end date), expired (past end date).
- **Session_Calendar**: The calendar view that displays scheduled training sessions for a student's batch.
- **Coach**: A user with HEAD_COACH or ASSISTANT_COACH role who enrolls and manages students.
- **Student**: A person enrolled in the coaching program within a batch.

## Requirements

### Requirement 1: Enrollment Duration Selection

**User Story:** As a Coach, I want to select an enrollment duration when enrolling a student, so that the student's enrollment has a defined time period.

#### Acceptance Criteria

1. WHEN a Coach opens the enrollment form, THE Enrollment_System SHALL display a duration selection field with options: 1 Month, 2 Months, 3 Months (Quarter), 6 Months (Half Year), 1 Year, and Indefinite, with the start date field hidden initially.
2. THE Enrollment_System SHALL default the duration selection to Indefinite.
3. WHEN the Coach selects a duration other than Indefinite, THE Enrollment_System SHALL immediately display an enrollment start date field defaulting to the current date.
4. WHEN the Coach selects Indefinite as the duration (or switches back from a finite duration), THE Enrollment_System SHALL immediately hide the enrollment start date field and set no end date.

### Requirement 2: Enrollment End Date Computation

**User Story:** As a Coach, I want the system to automatically calculate the enrollment end date, so that I do not need to manually compute expiration dates.

#### Acceptance Criteria

1. WHEN a Coach selects a finite duration and a start date, THE Enrollment_System SHALL compute the enrollment end date by adding the selected duration to the start date.
2. THE Enrollment_System SHALL compute end dates using calendar month addition (e.g., January 15 + 1 month = February 15).
3. IF the computed end date falls on a non-existent calendar day, THEN THE Enrollment_System SHALL use the last valid day of the target month (e.g., January 31 + 1 month = February 28).
4. WHEN the enrollment is saved, THE Enrollment_System SHALL persist the enrollment_start_date, enrollment_duration, and enrollment_end_date fields in the student record.
5. WHEN the Coach selects Indefinite, THE Enrollment_System SHALL store a null enrollment_end_date.

### Requirement 3: Enrollment Status Display

**User Story:** As a Coach, I want to see the enrollment status of each student at a glance, so that I can identify students whose enrollments are expiring or have expired.

#### Acceptance Criteria

1. THE Enrollment_System SHALL display an enrollment status badge on each student record in the student list view.
2. WHILE a student's enrollment_end_date is more than 7 days in the future, THE Enrollment_System SHALL display the status as "Active" with a green indicator.
3. WHILE a student's enrollment_end_date is within 7 days from the current date, THE Enrollment_System SHALL display the status as "Expiring Soon" with an amber indicator.
4. WHILE the current date is past a student's enrollment_end_date, THE Enrollment_System SHALL display the status as "Expired" with a red indicator.
5. WHILE a student's enrollment_duration is Indefinite, THE Enrollment_System SHALL always display the status as "Active" with a green indicator, regardless of any other computed status.
6. WHEN a Coach views the student detail page, THE Enrollment_System SHALL display the enrollment start date, duration, end date, and remaining days.

### Requirement 4: Session Calendar Enrollment Boundary

**User Story:** As a Coach, I want the session calendar to respect enrollment periods, so that schedules are generated only within the student's active enrollment window.

#### Acceptance Criteria

1. WHEN generating calendar entries for a student with a finite enrollment, THE Session_Calendar SHALL limit displayed sessions to dates between the enrollment_start_date and enrollment_end_date (inclusive).
2. WHEN generating calendar entries for a student with an indefinite enrollment, THE Session_Calendar SHALL display sessions without date boundary restrictions.
3. WHILE viewing the session calendar for a student with a finite enrollment, THE Session_Calendar SHALL visually indicate the enrollment start and end boundaries.
4. IF a session date falls outside the student's enrollment period, THEN THE Session_Calendar SHALL exclude that session from the student's view.

### Requirement 5: Enrollment Renewal and Extension

**User Story:** As a Coach, I want to renew or extend a student's enrollment, so that continuing students can have their enrollment period updated without re-enrollment.

#### Acceptance Criteria

1. WHEN a Coach views a student with an expiring_soon or expired enrollment status, THE Enrollment_System SHALL display a "Renew Enrollment" action. THE Enrollment_System SHALL NOT display the renew action for students with active enrollment status that are not expiring soon.
2. WHEN a Coach initiates a renewal, THE Enrollment_System SHALL present the duration selection options (1 Month, 2 Months, 3 Months, 6 Months, 1 Year, Indefinite).
3. WHEN the Coach confirms a renewal for an active or expiring_soon enrollment, THE Enrollment_System SHALL compute the new end date by adding the selected duration to the current enrollment_end_date.
4. WHEN the Coach confirms a renewal for an expired enrollment, THE Enrollment_System SHALL compute the new end date by adding the selected duration to the current date.
5. WHEN a renewal is completed, THE Enrollment_System SHALL update the enrollment_end_date, enrollment_duration, and reset the enrollment status to active.
6. THE Enrollment_System SHALL maintain a record of the previous enrollment_end_date for audit purposes.

### Requirement 6: Database Schema Extension

**User Story:** As a system administrator, I want enrollment duration data stored reliably, so that enrollment tracking is persistent and queryable.

#### Acceptance Criteria

1. THE Enrollment_System SHALL add the following columns to the students table: enrollment_start_date (date, nullable), enrollment_duration (text, nullable), enrollment_end_date (date, nullable).
2. THE Enrollment_System SHALL store enrollment_duration as one of: 1_month, 2_months, 3_months, 6_months, 12_months, indefinite.
3. WHEN a student is created without enrollment duration fields, THE Enrollment_System SHALL default enrollment_duration to indefinite with null start and end dates.
4. THE Enrollment_System SHALL create an enrollment_history table to record renewals with columns: id, student_id, previous_end_date, new_end_date, new_duration, renewed_at, renewed_by.

### Requirement 7: API Endpoints

**User Story:** As a frontend application, I want API endpoints to manage enrollment duration, so that enrollment data can be created, read, and updated.

#### Acceptance Criteria

1. WHEN a POST /api/students request includes enrollment duration fields, THE Enrollment_System SHALL validate and persist the enrollment_start_date, enrollment_duration, and computed enrollment_end_date.
2. WHEN a GET /api/students request is made, THE Enrollment_System SHALL include enrollment_start_date, enrollment_duration, enrollment_end_date, and computed enrollment_status in each student response.
3. WHEN a PATCH /api/students/:id request includes enrollment duration fields, THE Enrollment_System SHALL recompute the enrollment_end_date based on the updated values.
4. WHEN a POST /api/students/:id/renew request is made with a valid duration, THE Enrollment_System SHALL compute the new end date, update the student record, and create an enrollment_history entry.
5. IF a POST /api/students/:id/renew request is made with an invalid duration value, THEN THE Enrollment_System SHALL return a 400 error with a descriptive message.
