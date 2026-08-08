# Implementation Plan: Batch Time Templates

## Overview

This plan implements the Batch Time Templates feature across backend (Express API) and frontend (React SPA). The approach is bottom-up: database migration first, then backend API/controllers, then frontend UI components. Templates are center-scoped reusable entities containing session slots that define weekly patterns. The batch coaching structure is extended with head coach/assistant coach assignments and per-student coach mapping.

## Tasks

- [x] 1. Database migration
  - [x] 1.1 Create migration file for `batch_time_templates`, `session_slots`, and `batch_coach_assignments` tables
    - Create migration SQL file at `src/migrations/` in the API project
    - Create `batch_time_templates` table with columns: id (UUID PK), name (VARCHAR 100), center_id (FK → centers), is_archived (BOOLEAN DEFAULT false), created_at, updated_at
    - Add indexes: idx_btt_center_id, idx_btt_center_active (center_id, is_archived)
    - Create `session_slots` table with columns: id (UUID PK), template_id (FK → batch_time_templates ON DELETE CASCADE), day_of_week (VARCHAR 3 CHECK), start_time (TIME), duration_hours (INTEGER CHECK 1–4)
    - Add index: idx_ss_template_id
    - Create `batch_coach_assignments` table with columns: id (UUID PK), batch_id (FK → batches ON DELETE CASCADE), coach_id (FK → users), role (VARCHAR 20 CHECK head_coach/assistant_coach), created_at
    - Add UNIQUE constraint on (batch_id, coach_id)
    - Add partial unique index: idx_bca_one_head_per_batch ON batch_coach_assignments(batch_id) WHERE role = 'head_coach'
    - Add indexes: idx_bca_batch_id, idx_bca_coach_id
    - ALTER TABLE batches ADD COLUMN template_id UUID REFERENCES batch_time_templates(id)
    - ALTER TABLE students ADD COLUMN assigned_coach_id UUID REFERENCES users(id)
    - Wrap in transaction (BEGIN/COMMIT)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 2. Backend validation and utility functions
  - [x] 2.1 Implement validation schemas (`src/validators/batchTimeTemplate.schemas.ts`)
    - Define Zod schemas: dayOfWeek enum, timeFormat regex (HH:MM 24-hour), sessionSlotSchema, createTemplateSchema, updateTemplateSchema
    - createTemplateSchema: name (string 1–100), slots (array 1–14 of sessionSlotSchema)
    - updateTemplateSchema: name optional, slots optional
    - Export schemas for use in routes and frontend
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 2.2 Implement session slot overlap validator (`src/utils/slotOverlapValidator.ts`)
    - Export pure function `validateNoOverlap(slots: SessionSlot[]): { valid: boolean; conflicts: [number, number][] }`
    - Group slots by day_of_week, check pairwise overlap: startA < startB + durationB AND startB < startA + durationA
    - Return list of conflicting slot index pairs
    - _Requirements: 2.5_

  - [ ]* 2.3 Write property test for session slot overlap detection
    - **Property 4: Session Slot Overlap Detection**
    - For any two slots on the same day whose time ranges overlap, validateNoOverlap SHALL return valid=false with the conflicting pair
    - For any set of slots where no two slots on the same day overlap, validateNoOverlap SHALL return valid=true
    - **Validates: Requirements 2.5**

- [x] 3. Backend template CRUD controller and routes
  - [x] 3.1 Implement template controller (`src/controllers/batchTimeTemplates.ts`)
    - createTemplate: validate body with Zod, run overlap check, insert template + slots in transaction, return 201
    - listTemplates: query non-archived templates for center_id with slot counts, return 200
    - getTemplate: query template by id with joined slots, scope by center_id, return 200 or 404
    - updateTemplate: validate body, run overlap check if slots provided, update template + replace slots in transaction, return 200
    - archiveTemplate: check if template is assigned to any non-archived batch, return 409 if in use, else set is_archived=true, return 200
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 3.2 Create template routes (`src/routes/batchTimeTemplates.ts`)
    - Set up Router with authenticate, centerActive, tenantScope middleware
    - GET / — authorize HEAD_COACH, ASSISTANT_COACH → listTemplates
    - GET /:id — authorize HEAD_COACH, ASSISTANT_COACH → getTemplate
    - POST / — authorize HEAD_COACH, validateRequest(createTemplateSchema) → createTemplate
    - PATCH /:id — authorize HEAD_COACH, validateRequest(updateTemplateSchema) → updateTemplate
    - DELETE /:id — authorize HEAD_COACH → archiveTemplate
    - Register route in `src/routes/index.ts`
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 6.2, 6.3_

  - [ ]* 3.3 Write property tests for template CRUD
    - **Property 1: Template CRUD Round-Trip**
    - For any valid template name and set of non-overlapping session slots, creating a template and reading it back SHALL return the same name and equivalent slots
    - **Property 2: Archived Templates Exclusion**
    - For any archived template, listing active templates for the same center SHALL NOT include it
    - **Property 3: In-Use Template Deletion Prevention**
    - For any template assigned to a non-archived batch, archiving SHALL fail with 409
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5**

- [x] 4. Backend batch template assignment and session calendar
  - [x] 4.1 Enhance batch controller for template assignment
    - Update PATCH `/api/batches/:id` handler to accept `template_id` in request body
    - Validate template exists, is not archived, and belongs to the same center
    - Store template_id on the batch record
    - _Requirements: 3.1, 3.2, 3.5_

  - [x] 4.2 Implement session calendar generation from template
    - Enhance GET `/api/session-calendar` endpoint (or add query param support)
    - When batch has template_id: load template slots, compute sessions for requested date range by mapping each slot's day_of_week to matching dates
    - Return sessions with: date, day_of_week, start_time, duration_hours derived from slot
    - When batch has no template: return empty session list
    - Default date range: current month
    - _Requirements: 3.3, 3.4, 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 4.3 Write property tests for template assignment and calendar generation
    - **Property 5: Template Assignment Invariant**
    - For any batch, assigning template B replaces template A (last-write-wins)
    - **Property 6: Calendar Generation Correctness**
    - For any template with N slots and date range [start, end], session count for a slot with day D equals the number of occurrences of weekday D in [start, end], and each session matches slot's start_time and duration_hours
    - **Validates: Requirements 3.1, 3.2, 3.3, 8.1, 8.2, 8.3**

- [x] 5. Backend batch coach assignments
  - [x] 5.1 Implement batch coach assignments controller (`src/controllers/batchCoachAssignments.ts`)
    - listBatchCoaches: query batch_coach_assignments for batch_id joined with user info, return 200
    - assignCoach: validate batch exists, validate role (head_coach/assistant_coach), enforce one head_coach per batch, insert assignment, return 201
    - removeCoach: if removing assistant_coach, reassign all their students to head_coach, then delete assignment; if removing head_coach, reject unless batch is being archived
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

  - [x] 5.2 Create batch coach assignment routes (`src/routes/batchCoachAssignments.ts`)
    - Set up Router with authenticate, centerActive, tenantScope middleware
    - GET /api/batches/:batchId/coaches — authorize HEAD_COACH, ASSISTANT_COACH → listBatchCoaches
    - POST /api/batches/:batchId/coaches — authorize HEAD_COACH → assignCoach
    - DELETE /api/batches/:batchId/coaches/:coachId — authorize HEAD_COACH → removeCoach
    - Register route in `src/routes/index.ts`
    - _Requirements: 4.1, 4.2, 4.5_

  - [ ]* 5.3 Write property tests for coach assignments
    - **Property 7: Head Coach Uniqueness Invariant**
    - For any batch, batch_coach_assignments SHALL contain exactly one row with role='head_coach'
    - **Property 9: Coach Removal Triggers Student Reassignment**
    - Removing an assistant coach with N students SHALL reassign all N to the head coach; total student count unchanged
    - **Validates: Requirements 4.1, 4.5, 5.2**

- [x] 6. Backend student assignments
  - [x] 6.1 Implement student assignment controller (`src/controllers/studentAssignments.ts`)
    - assignStudentToCoach: validate student is in batch, validate coach is assigned to batch, validate student not already assigned to another coach, set assigned_coach_id, return 200
    - moveStudent: validate both source and target coaches are in batch, update assigned_coach_id atomically, return 200
    - listStudentAssignments: query students in batch grouped by assigned_coach_id, unassigned students default to head coach, return 200
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 6.2 Create student assignment routes (`src/routes/studentAssignments.ts`)
    - POST /api/batches/:batchId/students/assign — authorize HEAD_COACH → assignStudentToCoach
    - POST /api/batches/:batchId/students/move — authorize HEAD_COACH → moveStudent
    - GET /api/batches/:batchId/students/assignments — authorize HEAD_COACH, ASSISTANT_COACH → listStudentAssignments
    - Register route in `src/routes/index.ts`
    - _Requirements: 5.1, 5.3, 5.4_

  - [ ]* 6.3 Write property tests for student assignments
    - **Property 8: Student-Coach Assignment Uniqueness**
    - For any batch, each student SHALL be assigned to at most one coach; no student appears under multiple coaches
    - **Property 10: Student Removal Cascades Coach Assignment**
    - Removing a student from a batch SHALL clear their assigned_coach_id
    - **Validates: Requirements 4.4, 5.1, 5.3, 5.5**

- [x] 7. Checkpoint - Backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Frontend Templates Tab
  - [x] 8.1 Create TemplatesTab component (`src/components/TemplatesTab.tsx`)
    - Fetch and display list of non-archived templates for current center (GET /api/batch-time-templates)
    - Show template name, slot count, day summary (e.g., "Mon, Wed, Fri")
    - Add "Create Template" button (visible only for HEAD_COACH)
    - Add edit/delete actions per template row (visible only for HEAD_COACH)
    - Render read-only for ASSISTANT_COACH
    - Handle loading, empty, and error states matching existing BatchesTab patterns
    - _Requirements: 1.1, 6.1, 6.2, 6.3, 6.4_

  - [x] 8.2 Create TemplateFormModal component (`src/components/TemplateFormModal.tsx`)
    - Modal form for create/edit with: name input, session slot list
    - Each slot row: day picker (dropdown), start time input (HH:MM), duration select (1–4 hours), remove button
    - "Add Slot" button (disabled when at 14 slots)
    - Real-time overlap validation: highlight conflicting slots with error styling
    - Client-side Zod validation matching server schemas
    - On submit: POST (create) or PATCH (edit) to /api/batch-time-templates
    - Handle success (close modal, refresh list) and error (display server message)
    - _Requirements: 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 8.3 Integrate TemplatesTab into MasterDataPage
    - Add "Templates" tab to the existing tab navigation in MasterDataPage
    - Place alongside existing tabs (Center, Batches, Drills)
    - Pass readOnly prop based on user role (HEAD_COACH → false, ASSISTANT_COACH → true)
    - _Requirements: 6.1, 6.4_

- [x] 9. Frontend Batches Tab enhancements
  - [x] 9.1 Add template assignment dropdown to BatchesTab
    - Fetch available templates for current center
    - Show dropdown/select to assign template to batch (PATCH /api/batches/:id with template_id)
    - Display currently assigned template name
    - Allow clearing template assignment (set template_id to null)
    - Visible only for HEAD_COACH role
    - _Requirements: 3.1, 3.2, 3.5, 6.5_

  - [x] 9.2 Create CoachAssignmentPanel component (`src/components/CoachAssignmentPanel.tsx`)
    - Display head coach (required, single) with name
    - Display assistant coaches list with student count per coach
    - Add "Assign Coach" action (opens coach selection modal)
    - Add "Remove" action per assistant coach (confirms reassignment of students to head coach)
    - Display student assignment list per coach (expandable sections)
    - Add "Assign Student" and "Move Student" actions
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.3, 5.4_

  - [x] 9.3 Integrate CoachAssignmentPanel into BatchesTab
    - Add CoachAssignmentPanel as a sub-section within each batch's expanded view
    - Wire API calls: GET/POST/DELETE /api/batches/:id/coaches, GET/POST /api/batches/:id/students/assign, POST /api/batches/:id/students/move
    - Handle optimistic-free updates (wait for server confirmation)
    - Show toast messages on success/error
    - _Requirements: 4.1, 5.1, 5.4_

- [x] 10. Checkpoint - Frontend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Integration wiring and final validation
  - [x] 11.1 Wire session calendar to use template-based generation
    - Update existing session calendar frontend component to consume template-generated sessions
    - Ensure calendar displays sessions derived from template slots for batches with assigned templates
    - Handle batches without templates (show empty/placeholder state)
    - _Requirements: 8.1, 8.3, 8.4_

  - [ ]* 11.2 Write integration tests for end-to-end template workflow
    - Test full flow: create template → assign to batch → verify calendar generation
    - Test template deletion protection when assigned to active batch
    - Test coach assignment and student reassignment cascade
    - Test tenant scoping (center A cannot access center B templates)
    - _Requirements: 1.5, 3.3, 4.5, 7.6_

- [x] 12. Final checkpoint - Full integration verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document using fast-check + Vitest
- Unit tests validate specific examples and edge cases
- Backend project path: `/Users/midhunvmanikkath/Documents/PROJECTS/LOVEALL/API/shuttlecoach-api/`
- Frontend project path: `/Users/midhunvmanikkath/Documents/PROJECTS/LOVEALL/APP/shuttlecoach/`
- Existing `days_of_week`, `start_time`, `end_time`, `schedule`, and `assigned_coach_id` columns on batches remain for backward compatibility — deprecation handled in a follow-up migration
- The overlap validator is a pure function shared between frontend and backend

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.2"] },
    { "id": 2, "tasks": ["2.3", "3.1", "3.2"] },
    { "id": 3, "tasks": ["3.3", "4.1", "4.2"] },
    { "id": 4, "tasks": ["4.3", "5.1", "5.2"] },
    { "id": 5, "tasks": ["5.3", "6.1", "6.2"] },
    { "id": 6, "tasks": ["6.3", "8.1", "8.2"] },
    { "id": 7, "tasks": ["8.3", "9.1"] },
    { "id": 8, "tasks": ["9.2"] },
    { "id": 9, "tasks": ["9.3", "11.1"] },
    { "id": 10, "tasks": ["11.2"] }
  ]
}
```
