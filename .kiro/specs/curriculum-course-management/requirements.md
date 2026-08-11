# Requirements Document

## Introduction

Curriculum Course Management introduces reusable course templates that coaches create and manage independently of batch cycles. A course defines a variable-length sequence of weekly drill plans. Courses get attached to batches for a specific cycle, and the system automatically generates individual curriculum plans for each enrolled student, enabling per-student progress tracking and customization.

## Glossary

- **Course**: A reusable curriculum template created by a coach, containing a variable number of weeks with drills, focus areas, and objectives.
- **Course_Week**: A single week entry within a Course, holding a focus area, objective, and assigned drills.
- **Curriculum_Plan**: An individual student-level training plan cloned from a course when attached to a batch.
- **Batch**: A group of students training together on a shared schedule.
- **Drill**: A predefined training exercise from the drills table (73 existing drills).
- **Cycle**: A bi-monthly training period identified by a cycle_key (e.g., "Jan-Feb 2025").
- **CourseManagementPage**: The new UI page for creating and editing course templates.
- **CurriculumBuilderPage**: The existing UI page for attaching courses to batches and managing batch-level curriculum.
- **Coach**: A user with role HEAD_COACH or ASSISTANT_COACH who creates courses and manages batches.
- **System**: The ShuttleCoach application comprising the React frontend and Express API backend.

## Requirements

### Requirement 1: Course Creation

**User Story:** As a coach, I want to create named course templates with a variable number of weeks, so that I can reuse them across multiple batches and cycles.

#### Acceptance Criteria

1. WHEN a coach submits a new course form with a name and at least one week, THE System SHALL persist the course to the courses table and return the created course with a unique identifier.
2. THE System SHALL allow a course to contain between 1 and 52 weeks, where the coach decides the number of weeks.
3. WHEN a coach adds a week to a course, THE System SHALL store the week number, focus area, objective, and an ordered list of drill references for that week.
4. THE System SHALL associate each course with the coach who created it via the coach's user identifier.
5. IF a coach submits a course without a name or without at least one week, THEN THE System SHALL reject the submission and display a validation error message.

### Requirement 2: Course Editing

**User Story:** As a coach, I want to edit my existing course templates, so that I can refine drill assignments and weekly structure over time.

#### Acceptance Criteria

1. WHEN a coach updates a course's name, weeks, or drill assignments, THE System SHALL persist the changes and reflect them immediately in the CourseManagementPage.
2. THE System SHALL allow a coach to add weeks to or remove weeks from an existing course.
3. THE System SHALL allow a coach to reorder drills within a week of an existing course.
4. IF a coach attempts to save a course with zero weeks, THEN THE System SHALL reject the update and display a validation error message.
5. WHEN a coach removes a week from a course, THE System SHALL re-number the remaining weeks sequentially starting from 1.

### Requirement 3: Course Listing and Selection

**User Story:** As a coach, I want to view all my course templates in one place, so that I can select and manage them easily.

#### Acceptance Criteria

1. WHEN a coach navigates to the CourseManagementPage, THE System SHALL display a list of all courses created by that coach, showing name, number of weeks, and creation date.
2. WHEN a coach selects a course from the list, THE System SHALL load the full course structure including all weeks and drill assignments into the editor.
3. THE System SHALL sort the course list by most recently updated first.

### Requirement 4: Course Deletion

**User Story:** As a coach, I want to delete course templates I no longer need, so that my course list stays organized.

#### Acceptance Criteria

1. WHEN a coach confirms deletion of a course, THE System SHALL remove the course from the courses table.
2. THE System SHALL require explicit confirmation before deleting a course.
3. WHEN a course is deleted, THE System SHALL retain all existing curriculum_plans that were previously generated from that course (deletion does not cascade to instantiated plans).

### Requirement 5: Attaching a Course to a Batch

**User Story:** As a coach, I want to attach a course template to a batch for a specific cycle, so that the batch follows a structured training plan.

#### Acceptance Criteria

1. WHEN a coach selects a course and a batch on the CurriculumBuilderPage, THE System SHALL store the association between the batch and the selected course for the active cycle.
2. THE System SHALL add a course reference (curriculum_id) to the batches table linking the batch to the attached course.
3. WHEN a course is attached to a batch, THE System SHALL create a batch-level curriculum_plan by copying the course's week structure into the curriculum_plans table with the batch_id and cycle_key.
4. IF a batch already has a curriculum_plan for the selected cycle, THEN THE System SHALL prompt the coach to confirm overwriting before replacing the existing plan.

### Requirement 6: Auto-Creation of Individual Student Plans

**User Story:** As a coach, I want the system to automatically create individual curriculum plans for every student in a batch when a course is attached, so that I can track and customize progress per student without manual setup.

#### Acceptance Criteria

1. WHEN a course is attached to a batch, THE System SHALL create one curriculum_plan record for each student currently enrolled in that batch, cloning the week structure from the batch-level plan.
2. THE System SHALL set the source_batch_plan_id on each student plan to reference the batch-level plan it was cloned from.
3. WHEN a new student is added to a batch that already has an active course attached for the current cycle, THE System SHALL auto-create an individual curriculum_plan for that student by cloning the batch-level plan.
4. THE System SHALL allow individual student plans to be edited independently after creation without affecting the source batch plan or other student plans.

### Requirement 7: Courses Database Schema

**User Story:** As a developer, I want a courses table in the database, so that course templates are stored persistently and referenced by batches.

#### Acceptance Criteria

1. THE System SHALL create a courses table with columns: id (UUID, primary key), name (VARCHAR, not null), coach_id (UUID, foreign key to users.id), weeks (JSONB, not null), created_at (TIMESTAMP), and updated_at (TIMESTAMP).
2. THE System SHALL add a curriculum_id column (UUID, nullable, foreign key to courses.id) to the batches table.
3. THE System SHALL store weeks in the courses table as a JSONB array where each element contains weekNumber, focusArea, objective, and an ordered drills array with drill id, name, description, and category.
4. THE System SHALL enforce a unique constraint on the combination of name and coach_id to prevent duplicate course names per coach.

### Requirement 8: CourseManagementPage UI

**User Story:** As a coach, I want a dedicated page for managing course templates, so that course creation is separate from batch-level curriculum application.

#### Acceptance Criteria

1. THE System SHALL provide a CourseManagementPage accessible from the main navigation.
2. THE System SHALL display the drill library on the CourseManagementPage, allowing coaches to drag drills into weekly slots.
3. WHEN a coach is editing a course on the CourseManagementPage, THE System SHALL display week tabs that dynamically adjust based on the number of weeks in the course.
4. THE System SHALL provide an "Add Week" button that appends a new empty week to the course.
5. THE System SHALL provide a "Remove Week" button on each week tab that removes that week after confirmation.
6. WHILE a course has unsaved changes, THE System SHALL display a visual indicator to alert the coach of unsaved work.

### Requirement 9: Course Selection on CurriculumBuilderPage

**User Story:** As a coach, I want to select a pre-built course when working on the CurriculumBuilderPage, so that I can quickly apply a course template to a batch instead of building from scratch.

#### Acceptance Criteria

1. WHEN a coach selects a batch on the CurriculumBuilderPage, THE System SHALL display a course selection dropdown listing all available courses created by that coach.
2. WHEN a coach selects a course from the dropdown, THE System SHALL populate the week editor with the selected course's week structure.
3. THE System SHALL retain the existing manual curriculum-building workflow on the CurriculumBuilderPage for coaches who prefer not to use course templates.

### Requirement 10: API Endpoints for Course Management

**User Story:** As a developer, I want RESTful API endpoints for course CRUD operations, so that the frontend can manage courses through the backend.

#### Acceptance Criteria

1. THE System SHALL expose a POST /courses endpoint that creates a new course and returns the created record.
2. THE System SHALL expose a GET /courses endpoint that returns all courses belonging to the authenticated coach.
3. THE System SHALL expose a GET /courses/:id endpoint that returns a single course with full week and drill details.
4. THE System SHALL expose a PUT /courses/:id endpoint that updates an existing course's name and weeks structure.
5. THE System SHALL expose a DELETE /courses/:id endpoint that soft-deletes or hard-deletes a course after ownership verification.
6. THE System SHALL verify that the authenticated user owns the course before allowing update or delete operations.
