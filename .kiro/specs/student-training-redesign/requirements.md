# Requirements Document

## Introduction

Redesign the Student Training tab to replace the current training logs/curriculum layout with a drill skills matrix, drill-specific training history, batch curriculum drill list, and retained strengths/weaknesses/feedback sections. The new layout uses inline tap-to-set skill scoring (0–4 scale) with auto-save, sources drills from the student's batch course plan via the batch-students-drills API, and reads/writes scores via the existing skill_scores API. All styling uses CSS variables from design-system.css.

## Glossary

- **Training_Tab**: The redesigned React component displayed within the student profile page that shows drill skills, training history, curriculum drills, strengths, weaknesses, and coach feedback.
- **Drill_Skills_Matrix**: A table UI showing curriculum drills as rows with skill level columns (0–4), allowing coaches to tap a cell to set the score.
- **Skill_Score**: An integer value from 0 to 4 representing a student's proficiency in a specific drill (0 = Don't Know, 1 = Beginner, 2 = Intermediate, 3 = Advanced, 4 = Pro).
- **Training_History**: A drill-specific log showing dates when a particular drill was trained by the student.
- **Curriculum_Drills**: The subset of drills assigned to a student through their batch course plan, fetched via the batch-students-drills API.
- **Skill_Scores_API**: The existing REST endpoints (GET /api/skill-scores, POST /api/skill-scores) for reading and persisting skill score data.
- **Batch_Students_Drills_API**: The existing REST endpoint (GET /api/batch-students-drills) that returns drill assignments for students in a batch.
- **Auto_Save**: Behavior where a score change is persisted to the Skill_Scores_API immediately upon user interaction without requiring a separate save action.
- **Coach_User**: A user with the HEAD_COACH or ASSISTANT_COACH role who can edit skill scores and manage student feedback.
- **Student_User**: A user with the STUDENT role who can view skill scores and feedback in read-only mode.
- **Design_System_CSS**: The project's CSS variable file (design-system.css) providing color, spacing, typography, and component tokens.

## Requirements

### Requirement 1: Drill Skills Matrix Display

**User Story:** As a coach, I want to see all curriculum drills for a student in a matrix table with skill levels, so that I can quickly assess and update the student's proficiency across all assigned drills.

#### Acceptance Criteria

1. WHEN the Training_Tab loads for a student, THE Training_Tab SHALL fetch the student's Curriculum_Drills from the Batch_Students_Drills_API and display them as rows in the Drill_Skills_Matrix.
2. THE Drill_Skills_Matrix SHALL display columns representing Skill_Score values 0, 1, 2, 3, and 4.
3. WHEN the Skill_Scores_API returns existing scores for the student, THE Drill_Skills_Matrix SHALL highlight the current Skill_Score level for each drill row.
4. THE Drill_Skills_Matrix SHALL display only drills from the student's batch curriculum, not the full 61-drill catalog.
5. IF the Batch_Students_Drills_API returns an error, THEN THE Training_Tab SHALL display a user-friendly error message in the Drill_Skills_Matrix section.
6. IF the Batch_Students_Drills_API returns an empty drill list, THEN THE Training_Tab SHALL display a message indicating no curriculum drills are assigned.

### Requirement 2: Inline Skill Score Editing

**User Story:** As a coach, I want to tap a skill level cell in the matrix to set a student's score, so that I can quickly update proficiency without navigating to a separate edit form.

#### Acceptance Criteria

1. WHEN a Coach_User taps a Skill_Score cell in the Drill_Skills_Matrix, THE Training_Tab SHALL immediately update the visual indicator to reflect the selected score.
2. WHEN a Coach_User taps a Skill_Score cell, THE Training_Tab SHALL invoke the Skill_Scores_API POST endpoint with the student ID, drill ID, and selected score to persist the change.
3. WHILE the Auto_Save request is in progress, THE Training_Tab SHALL display a subtle saving indicator for the affected drill row.
4. WHEN the Auto_Save request completes successfully, THE Training_Tab SHALL remove the saving indicator and confirm the saved state.
5. IF the Auto_Save request fails, THEN THE Training_Tab SHALL revert the visual indicator to the previous score and display an error notification.
6. WHILE the user has a Student_User role, THE Drill_Skills_Matrix SHALL display scores in read-only mode without tap interaction.

### Requirement 3: Training History Per Drill

**User Story:** As a coach, I want to see the dates when a specific drill was trained, so that I can track frequency and recency of practice for each skill.

#### Acceptance Criteria

1. WHEN a Coach_User or Student_User selects a drill in the Drill_Skills_Matrix, THE Training_Tab SHALL display a Training_History section showing dates when that drill was trained.
2. THE Training_History SHALL display dates in reverse chronological order with the most recent training date first.
3. IF no training history exists for a selected drill, THEN THE Training_Tab SHALL display a message indicating no training sessions are recorded for that drill.
4. THE Training_History SHALL source its data from the Skill_Scores_API based on the selected drill's skill ID and the student ID.

### Requirement 4: Curriculum Drills Section

**User Story:** As a coach, I want to see the full drill list from the student's batch course plan, so that I can understand what the student should be working on.

#### Acceptance Criteria

1. WHEN the Training_Tab loads, THE Training_Tab SHALL display a Curriculum section listing all drills from the student's batch course plan.
2. THE Curriculum section SHALL group drills by their focus area as returned by the Batch_Students_Drills_API.
3. IF the student is not enrolled in a batch with a course plan, THEN THE Training_Tab SHALL display a message indicating no curriculum is available.

### Requirement 5: Strengths, Weaknesses, and Feedback

**User Story:** As a coach, I want to manage a student's strengths, weaknesses, and provide written feedback, so that I can document observations alongside skill scores.

#### Acceptance Criteria

1. THE Training_Tab SHALL display existing strengths, weaknesses, and coach feedback sections below the Drill_Skills_Matrix.
2. WHEN a Coach_User adds or removes a strength tag, THE Training_Tab SHALL update the strengths list and notify the parent component.
3. WHEN a Coach_User adds or removes a weakness tag, THE Training_Tab SHALL update the weaknesses list and notify the parent component.
4. WHEN a Coach_User edits the feedback textarea, THE Training_Tab SHALL propagate the updated feedback text to the parent component.
5. WHILE the user has a Student_User role, THE Training_Tab SHALL display strengths, weaknesses, and feedback in read-only mode.

### Requirement 6: Design System Compliance

**User Story:** As a developer, I want the redesigned Training_Tab to use design system CSS variables, so that it remains visually consistent with the rest of the application.

#### Acceptance Criteria

1. THE Training_Tab SHALL use CSS variables from Design_System_CSS for all color values including background, text, border, and interactive states.
2. THE Training_Tab SHALL use Design_System_CSS spacing tokens (--space-xs through --space-3xl) for all padding, margin, and gap values.
3. THE Training_Tab SHALL use Design_System_CSS typography tokens for font sizes, weights, and line heights.
4. THE Training_Tab SHALL use Design_System_CSS border radius tokens for all rounded corners.
5. THE Training_Tab SHALL use Design_System_CSS shadow tokens for elevation and focus states.

### Requirement 7: Loading and Error States

**User Story:** As a user, I want clear feedback when data is loading or when an error occurs, so that I understand the current state of the interface.

#### Acceptance Criteria

1. WHILE the Skill_Scores_API request is in progress, THE Training_Tab SHALL display a loading skeleton or spinner in the Drill_Skills_Matrix area.
2. WHILE the Batch_Students_Drills_API request is in progress, THE Training_Tab SHALL display a loading indicator in the Curriculum section.
3. IF both API requests fail simultaneously, THEN THE Training_Tab SHALL display a consolidated error state with a retry action.
4. WHEN a user activates the retry action, THE Training_Tab SHALL re-fetch data from both the Skill_Scores_API and the Batch_Students_Drills_API.

### Requirement 8: Accessibility

**User Story:** As a user with assistive technology, I want the Drill_Skills_Matrix to be navigable and operable via keyboard and screen reader, so that I can use the training features effectively.

#### Acceptance Criteria

1. THE Drill_Skills_Matrix SHALL be navigable using keyboard arrow keys to move between cells.
2. WHEN a cell in the Drill_Skills_Matrix receives focus, THE Training_Tab SHALL display a visible focus indicator using the Design_System_CSS focus ring token.
3. THE Drill_Skills_Matrix SHALL include appropriate ARIA labels for drill names and score values on each interactive cell.
4. WHEN a Coach_User presses Enter or Space on a focused cell, THE Training_Tab SHALL toggle the score selection for that cell.
