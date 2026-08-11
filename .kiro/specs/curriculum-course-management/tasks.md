# Implementation Plan: Curriculum Course Management

## Overview

Implement reusable course templates that coaches create, edit, and attach to batches. This spans a database migration (new `courses` table + `batches.curriculum_id` column), backend CRUD + attach API routes, a frontend `useCourses` hook, a new `CourseManagementPage`, updates to the existing `CurriculumBuilderPage`, auto-clone logic on student enrollment, and property-based tests validating correctness properties.

## Tasks

- [ ] 1. Database migration and schema setup
  - [ ] 1.1 Create migration `023_courses_table.sql`
    - Create the `courses` table with columns: id (UUID PK), name (VARCHAR(200) NOT NULL), coach_id (UUID FK → users.id), weeks (JSONB NOT NULL DEFAULT '[]'), center_id (UUID FK → centers.id), created_at, updated_at
    - Add UNIQUE constraint on (name, coach_id)
    - Create indexes on coach_id and center_id
    - Add `curriculum_id` column (UUID, nullable, FK → courses.id, ON DELETE SET NULL) to the `batches` table
    - File: `shuttlecoach-api/src/migrations/023_courses_table.sql`
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 2. Backend API — courses CRUD routes and controller
  - [ ] 2.1 Create `src/controllers/courses.ts` with CRUD handlers
    - Implement `createCourse` — validate name (required, ≤200 chars) and weeks (1–52), enforce unique name per coach, persist to DB, return 201
    - Implement `getCourses` — list all courses for authenticated coach, sorted by updated_at DESC
    - Implement `getCourseById` — fetch single course with ownership check, return 403/404 as needed
    - Implement `updateCourse` — validate payload, ownership check, re-number weeks sequentially, persist
    - Implement `deleteCourse` — ownership check, hard delete course record (no cascade to curriculum_plans)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.4, 2.5, 3.1, 3.3, 4.1, 4.3, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [ ] 2.2 Create `src/routes/courses.ts` and register in route index
    - Define routes: POST /, GET /, GET /:id, PUT /:id, DELETE /:id, POST /:id/attach
    - Apply JWT auth middleware to all routes
    - Register the router in `src/routes/index.ts` under `/api/courses`
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ] 2.3 Implement `attachCourseToBatch` handler in courses controller
    - Validate courseId ownership + batchId existence
    - Check for existing batch plan for the cycle; return 409 conflict if exists and `confirmOverwrite` is false
    - Update `batches.curriculum_id` to the course id
    - Create batch-level `curriculum_plan` from course weeks
    - Fetch all students in the batch and clone individual plans with `source_batch_plan_id`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2_

  - [ ] 2.4 Add auto-clone hook to student enrollment flow
    - In the existing student creation / batch-assignment logic, after a student is added to a batch, check if `batch.curriculum_id` is set and a batch plan exists for the current cycle
    - If yes, auto-create an individual `curriculum_plan` for the new student cloned from the batch plan
    - _Requirements: 6.3, 6.4_

- [ ] 3. Checkpoint — Backend API complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Frontend — useCourses hook
  - [ ] 4.1 Create `src/hooks/useCourses.ts`
    - Define `Course`, `CourseWeek`, `CreateCourseData`, `UpdateCourseData`, `AttachCourseData`, `AttachResponse` TypeScript interfaces
    - Implement hook returning: courses, loading, error, createCourse, updateCourse, deleteCourse, getCourseById, attachCourseToBatch, refetch
    - Use existing `apiClient` (axios) for HTTP calls to `/api/courses`
    - Manage local state with useState + useEffect for initial fetch
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 5. Frontend — CourseManagementPage
  - [ ] 5.1 Create `src/pages/CourseManagementPage.tsx`
    - Left panel: reuse existing `DrillLibrary` component for drag-source drills
    - Right panel: course editor with dynamic week tabs (Add Week / Remove Week)
    - Header: course list selector dropdown + "New Course" button
    - Footer: Save button + unsaved changes indicator
    - Wire up to `useCourses` hook for all CRUD operations
    - Show confirmation dialog before course deletion
    - Display validation errors inline (name required, 1–52 weeks)
    - _Requirements: 1.1, 1.2, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 4.1, 4.2, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ] 5.2 Add route for CourseManagementPage in `src/App.tsx`
    - Add `/courses` route wrapped in `ProtectedRoute` (HEAD_COACH, ASSISTANT_COACH)
    - Add navigation link in sidebar/topnav
    - _Requirements: 8.1_

- [ ] 6. Frontend — CurriculumBuilderPage update
  - [ ] 6.1 Update `src/pages/CurriculumBuilderPage.tsx` with course dropdown
    - Add course selection dropdown between batch selector and week editor
    - Fetch courses via `useCourses` hook
    - When a course is selected, populate the week editor from the course's week structure
    - Retain existing manual workflow when no course is selected
    - Wire "Attach" action to `attachCourseToBatch` which calls POST /api/courses/:id/attach
    - Show confirmation dialog if 409 conflict returned (existing plan for cycle)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 9.1, 9.2, 9.3_

- [ ] 7. Checkpoint — Full feature wired end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 8. Property-based tests (fast-check) — Backend
  - [ ]* 8.1 Write property test: Course creation and read round-trip
    - **Property 1: Course Creation and Read Round-Trip**
    - Generate random valid course payloads (non-empty name, 1–52 weeks); create via controller, fetch by id, assert structural equivalence
    - **Validates: Requirements 1.1, 1.3, 7.3, 10.1, 10.3**

  - [ ]* 8.2 Write property test: Week count validation boundary
    - **Property 2: Course Week Count Validation**
    - For random N outside [1,52] assert 400 rejection; for N in [1,52] assert success
    - **Validates: Requirements 1.2, 1.5, 2.4**

  - [ ]* 8.3 Write property test: Course update round-trip
    - **Property 3: Course Update Round-Trip**
    - Generate random valid updates, apply via PUT, refetch, assert fields match
    - **Validates: Requirements 2.1, 10.4**

  - [ ]* 8.4 Write property test: Week re-numbering after removal
    - **Property 4: Week Re-numbering After Removal**
    - Generate course with N weeks (N≥2), remove random position P, verify sequential numbering 1..N-1
    - **Validates: Requirements 2.5**

  - [ ]* 8.5 Write property test: Listing completeness and ordering
    - **Property 5: Course Listing Completeness and Ordering**
    - Create K random courses, list, assert count=K and descending updatedAt order
    - **Validates: Requirements 3.1, 3.3, 10.2**

  - [ ]* 8.6 Write property test: Deletion does not cascade
    - **Property 6: Deletion Does Not Cascade to Curriculum Plans**
    - Attach course to batch, delete course, verify curriculum_plans still exist
    - **Validates: Requirements 4.3**

  - [ ]* 8.7 Write property test: Attach clones weeks to batch plan
    - **Property 7: Attach Course Clones Weeks to Batch Plan**
    - Attach course with W weeks, verify batch plan weeks === course weeks
    - **Validates: Requirements 5.3**

  - [ ]* 8.8 Write property test: Batch-to-student plan cloning
    - **Property 8: Batch-to-Student Plan Cloning**
    - Attach course to batch with N students, verify exactly N plans created with correct source reference
    - **Validates: Requirements 6.1, 6.2**

  - [ ]* 8.9 Write property test: Auto-create plan on student enrollment
    - **Property 9: Auto-Create Plan on Student Enrollment**
    - Add student to batch with active course, verify individual plan created
    - **Validates: Requirements 6.3**

  - [ ]* 8.10 Write property test: Individual plan isolation
    - **Property 10: Individual Plan Isolation After Cloning**
    - Clone plans, edit one, verify others unchanged
    - **Validates: Requirements 6.4**

  - [ ]* 8.11 Write property test: Unique course name per coach
    - **Property 11: Unique Course Name Per Coach**
    - Create course, attempt duplicate name for same coach, assert 409
    - **Validates: Requirements 7.4**

  - [ ]* 8.12 Write property test: Ownership authorization
    - **Property 12: Ownership Authorization for Mutations**
    - Create course as coach A, attempt update/delete as coach B, assert 403 and unchanged
    - **Validates: Requirements 10.6**

- [ ] 9. Final checkpoint — All tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Backend uses Jest + fast-check; frontend uses Vitest
- Migration file follows existing numbering convention (023_)
- The auto-clone hook (task 2.4) modifies existing student assignment logic — review carefully

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.2"] },
    { "id": 2, "tasks": ["2.3", "2.4"] },
    { "id": 3, "tasks": ["4.1"] },
    { "id": 4, "tasks": ["5.1", "5.2", "6.1"] },
    { "id": 5, "tasks": ["8.1", "8.2", "8.3", "8.4", "8.5"] },
    { "id": 6, "tasks": ["8.6", "8.7", "8.8", "8.9", "8.10", "8.11", "8.12"] }
  ]
}
```
