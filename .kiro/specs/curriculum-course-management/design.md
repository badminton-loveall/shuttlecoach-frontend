# Design Document: Curriculum Course Management

## Overview

This design defines the architecture for reusable course templates that coaches create, edit, and attach to batches. It introduces a new `courses` table, a new `CourseManagementPage`, REST API endpoints, and auto-clone logic that generates individual student curriculum plans when a course is attached to a batch or when a student is enrolled in a batch with an active course.

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│  Frontend (React / Vite / TypeScript)                              │
│                                                                    │
│  ┌──────────────────────┐    ┌──────────────────────────────────┐ │
│  │ CourseManagementPage  │    │  CurriculumBuilderPage (updated) │ │
│  │  - Course CRUD UI     │    │  - Course dropdown selector      │ │
│  │  - DrillLibrary       │    │  - Attach course to batch        │ │
│  │  - Dynamic week tabs  │    │  - Existing manual workflow      │ │
│  └──────────┬───────────┘    └──────────────┬───────────────────┘ │
│             │                                │                     │
│  ┌──────────▼────────────────────────────────▼───────────────────┐│
│  │            useCourses Hook (new)                               ││
│  │  - CRUD operations via apiClient                              ││
│  │  - Local state + refetch                                      ││
│  └──────────────────────────┬────────────────────────────────────┘│
└─────────────────────────────┼─────────────────────────────────────┘
                              │ HTTP (apiClient → axios)
┌─────────────────────────────▼─────────────────────────────────────┐
│  Backend (Express / TypeScript / PostgreSQL)                       │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  routes/courses.ts                                           │ │
│  │  POST   /api/courses         → create                        │ │
│  │  GET    /api/courses         → list (by coach)               │ │
│  │  GET    /api/courses/:id     → get single                    │ │
│  │  PUT    /api/courses/:id     → update                        │ │
│  │  DELETE /api/courses/:id     → delete                        │ │
│  │  POST   /api/courses/:id/attach → attach to batch & clone    │ │
│  └──────────────────────┬───────────────────────────────────────┘ │
│                          │                                         │
│  ┌──────────────────────▼───────────────────────────────────────┐ │
│  │  controllers/courses.ts                                      │ │
│  │  - Validation logic (1–52 weeks, name required, ownership)   │ │
│  │  - JSONB serialization                                       │ │
│  │  - Clone-to-students orchestration                           │ │
│  └──────────────────────┬───────────────────────────────────────┘ │
│                          │                                         │
│  ┌──────────────────────▼───────────────────────────────────────┐ │
│  │  PostgreSQL (Supabase)                                       │ │
│  │  - courses (new table)                                       │ │
│  │  - batches.curriculum_id (new column)                        │ │
│  │  - curriculum_plans (existing, used for cloned plans)        │ │
│  └──────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Database Layer

#### New Table: `courses`

```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  coach_id UUID NOT NULL REFERENCES users(id),
  weeks JSONB NOT NULL DEFAULT '[]'::jsonb,
  center_id UUID REFERENCES centers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, coach_id)
);

CREATE INDEX idx_courses_coach_id ON courses(coach_id);
CREATE INDEX idx_courses_center_id ON courses(center_id);
```

#### Schema Change: `batches` table

```sql
ALTER TABLE batches
  ADD COLUMN curriculum_id UUID REFERENCES courses(id) ON DELETE SET NULL;
```

#### JSONB Structure for `courses.weeks`

```json
[
  {
    "weekNumber": 1,
    "focusArea": "Foundation — Grip and Basic Footwork",
    "objective": "Establish proper grip habits and develop basic court coverage",
    "drills": [
      {
        "id": "drill-uuid-001",
        "name": "Four-Corner Footwork",
        "description": "Move to all four corners with proper form",
        "category": "Footwork"
      }
    ]
  }
]
```

### 2. Backend API Layer

#### Route File: `src/routes/courses.ts`

Mounts on `/api/courses` with JWT authentication middleware.

#### Controller: `src/controllers/courses.ts`

| Handler | Route | Description |
|---------|-------|-------------|
| `createCourse` | POST /api/courses | Validates name + weeks (1–52), persists, returns created record |
| `getCourses` | GET /api/courses | Lists all courses for authenticated coach, sorted by updated_at DESC |
| `getCourseById` | GET /api/courses/:id | Returns single course with full structure after ownership check |
| `updateCourse` | PUT /api/courses/:id | Updates name/weeks after ownership check, re-numbers weeks |
| `deleteCourse` | DELETE /api/courses/:id | Deletes course after ownership check; does not cascade to curriculum_plans |
| `attachCourseToBatch` | POST /api/courses/:id/attach | Attaches course to batch, creates batch plan + individual student plans |

### 3. Frontend Layer

#### New Hook: `src/hooks/useCourses.ts`

```typescript
export interface Course {
  id: string;
  name: string;
  coachId: string;
  weeks: CourseWeek[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseWeek {
  weekNumber: number;
  focusArea: string;
  objective: string;
  drills: Drill[];
}

export interface UseCoursesReturn {
  courses: Course[];
  loading: boolean;
  error: string | null;
  createCourse: (data: CreateCourseData) => Promise<Course>;
  updateCourse: (id: string, data: UpdateCourseData) => Promise<Course>;
  deleteCourse: (id: string) => Promise<void>;
  getCourseById: (id: string) => Promise<Course>;
  attachCourseToBatch: (courseId: string, batchId: string, cycleKey: string) => Promise<AttachResponse>;
  refetch: () => Promise<void>;
}
```

#### New Page: `src/pages/CourseManagementPage.tsx`

- Left panel: `DrillLibrary` component (reused)
- Right panel: Course editor with dynamic week tabs
- Header: Course list selector + "New Course" button
- Footer: Save button + unsaved changes indicator
- "Add Week" / "Remove Week" buttons for flexible week count

#### Updated Page: `src/pages/CurriculumBuilderPage.tsx`

- New course selection dropdown between batch selector and week editor
- When a course is selected, populates weeks from the course template
- Existing manual workflow remains fully functional when no course is selected

### 4. Auto-Clone Logic

#### On Course Attach (`POST /api/courses/:id/attach`)

```typescript
// Pseudocode for attach handler
async function attachCourseToBatch(courseId, batchId, cycleKey):
  // 1. Fetch course
  course = await getCourse(courseId)
  
  // 2. Check for existing batch plan for this cycle
  existingPlan = await findBatchPlan(batchId, cycleKey)
  if (existingPlan && !req.body.confirmOverwrite):
    return 409 { conflict: true, existingPlanId: existingPlan.id }
  
  // 3. Update batch.curriculum_id
  await updateBatch(batchId, { curriculum_id: courseId })
  
  // 4. Create batch-level curriculum_plan from course weeks
  batchPlan = await createCurriculumPlan({
    cycleKey, batchId, weeks: course.weeks
  })
  
  // 5. Fetch all students in batch
  students = await getStudentsByBatch(batchId)
  
  // 6. Clone individual plans for each student
  studentPlans = await Promise.all(
    students.map(s => createCurriculumPlan({
      cycleKey, studentId: s.id,
      sourceBatchPlanId: batchPlan.id,
      weeks: course.weeks
    }))
  )
  
  return { batchPlan, studentPlans }
```

#### On Student Enrollment (existing `POST /api/students` or batch assignment update)

```typescript
// Added to student creation/batch-assignment logic
async function onStudentAddedToBatch(studentId, batchId):
  // Check if batch has active course for current cycle
  batch = await getBatch(batchId)
  if (!batch.curriculum_id) return  // No course attached
  
  currentCycle = generateCycleKey()
  batchPlan = await findBatchPlan(batchId, currentCycle)
  if (!batchPlan) return  // No active plan for current cycle
  
  // Auto-create individual plan
  await createCurriculumPlan({
    cycleKey: currentCycle,
    studentId,
    sourceBatchPlanId: batchPlan.id,
    weeks: batchPlan.weeks
  })
```

## Interfaces

### API Request/Response Contracts

#### POST /api/courses

**Request:**
```typescript
{
  name: string;           // Required, non-empty
  weeks: CourseWeek[];    // Required, 1–52 items
}
```

**Response (201):**
```typescript
{
  id: string;
  name: string;
  coachId: string;
  weeks: CourseWeek[];
  createdAt: string;
  updatedAt: string;
}
```

**Error (400):**
```typescript
{ error: "Course name is required" }
{ error: "Course must have between 1 and 52 weeks" }
```

**Error (409):**
```typescript
{ error: "A course with this name already exists" }
```

#### GET /api/courses

**Response (200):**
```typescript
{
  courses: Course[];  // Sorted by updatedAt DESC
}
```

#### GET /api/courses/:id

**Response (200):** Single `Course` object  
**Error (404):** `{ error: "Course not found" }`  
**Error (403):** `{ error: "Not authorized to access this course" }`

#### PUT /api/courses/:id

**Request:**
```typescript
{
  name?: string;          // Optional update
  weeks?: CourseWeek[];   // Optional update, 1–52 items
}
```

**Response (200):** Updated `Course` object  
**Error (403/404):** Same as GET

#### DELETE /api/courses/:id

**Response (200):** `{ message: "Course deleted" }`  
**Error (403/404):** Same as GET

#### POST /api/courses/:id/attach

**Request:**
```typescript
{
  batchId: string;
  cycleKey: string;
  confirmOverwrite?: boolean;  // Set true to overwrite existing plan
}
```

**Response (201):**
```typescript
{
  batchPlan: CurriculumPlan;
  studentPlans: CurriculumPlan[];
  message: string;
}
```

**Error (409):**
```typescript
{
  conflict: true;
  existingPlanId: string;
  message: "Batch already has a plan for this cycle. Set confirmOverwrite=true to replace."
}
```

## Data Models

### Course (TypeScript)

```typescript
export interface Course {
  id: string;
  name: string;
  coachId: string;
  weeks: CourseWeek[];
  centerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseWeek {
  weekNumber: number;       // 1-based, sequential
  focusArea: string;
  objective: string;
  drills: Drill[];          // Ordered array
}
```

### Extended Batch (update to existing type)

```typescript
export interface Batch {
  id: string;
  name: string;
  schedule: string;
  assignedCoachId?: string;
  curriculumId?: string;    // NEW: FK to courses.id
  studentCount: number;
  createdAt: Date;
}
```

### CreateCourseData / UpdateCourseData

```typescript
export interface CreateCourseData {
  name: string;
  weeks: CourseWeek[];
}

export interface UpdateCourseData {
  name?: string;
  weeks?: CourseWeek[];
}

export interface AttachCourseData {
  batchId: string;
  cycleKey: string;
  confirmOverwrite?: boolean;
}

export interface AttachResponse {
  batchPlan: CurriculumPlan;
  studentPlans: CurriculumPlan[];
  message: string;
}
```

## Error Handling

| Scenario | HTTP Status | Error Message | UI Behavior |
|----------|-------------|---------------|-------------|
| Missing course name | 400 | "Course name is required" | Inline form error |
| Zero weeks or >52 weeks | 400 | "Course must have between 1 and 52 weeks" | Inline form error |
| Duplicate course name (same coach) | 409 | "A course with this name already exists" | Toast notification |
| Course not found | 404 | "Course not found" | Redirect to course list |
| Not course owner (update/delete) | 403 | "Not authorized to access this course" | Toast notification |
| Batch already has plan for cycle | 409 | Conflict response with existing plan ID | Confirmation dialog |
| No students in batch (on attach) | 200 | Returns batchPlan with empty studentPlans | Info message |
| Network/server error | 500 | "An error occurred..." | Toast with retry option |

## Validation Rules

### Course Name
- Required, non-empty after trimming
- Maximum 200 characters
- Unique per coach (database constraint)

### Course Weeks
- Minimum 1 week, maximum 52 weeks
- Each week must have `weekNumber`, `focusArea`, `objective`, and `drills` array
- Week numbers must be sequential starting from 1
- Drills array can be empty (coach may fill in later)

### Week Re-numbering
- When a week is removed, remaining weeks are re-numbered 1..N
- Server-side enforced on PUT to prevent gaps

### Ownership
- All mutating operations (PUT, DELETE, attach) require authenticated coach to be the course creator
- GET /courses only returns courses where `coach_id` matches authenticated user

## Testing Strategy

### Unit Tests (Vitest - Frontend)
- Course form validation (name required, week count 1–52)
- Week re-numbering utility function
- useCourses hook state management with mocked API
- CourseManagementPage renders course list, editor, and DrillLibrary
- CurriculumBuilderPage course dropdown populates correctly

### Unit Tests (Jest - Backend)
- Controller validation logic (missing name, invalid week count, ownership checks)
- Week re-numbering on removal
- Attach endpoint conflict detection

### Property-Based Tests (fast-check)
- Course creation/read round-trip with random valid payloads
- Week count validation boundary (1–52 accepted, outside rejected)
- Update round-trip with random modifications
- Week re-numbering invariant after random removal
- Listing completeness and ordering invariant
- Clone fidelity (batch plan weeks === course weeks)
- Student plan cloning count and source reference
- Individual plan isolation after edit
- Unique name constraint enforcement
- Ownership authorization rejection

### Integration Tests
- Full attach flow: create course → attach to batch → verify batch plan + student plans
- Student enrollment auto-clone trigger
- Deletion does not cascade to existing plans

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Course Creation and Read Round-Trip

*For any* valid course payload (non-empty name and 1–52 weeks with valid week structures), creating the course via POST and then fetching it via GET by the returned id SHALL produce a course object whose name and weeks structure are equivalent to the original input.

**Validates: Requirements 1.1, 1.3, 3.2, 7.3, 10.1, 10.3**

### Property 2: Course Week Count Validation

*For any* integer N, if N < 1 or N > 52, submitting a course with N weeks SHALL be rejected with a 400 error; if 1 ≤ N ≤ 52, the submission SHALL succeed.

**Validates: Requirements 1.2, 1.5, 2.4**

### Property 3: Course Update Round-Trip

*For any* existing course and any valid update payload (non-empty name and/or 1–52 weeks), applying the update via PUT and then fetching the course SHALL produce a course whose updated fields match the submitted values.

**Validates: Requirements 2.1, 10.4**

### Property 4: Week Re-numbering After Removal

*For any* course with N weeks (N ≥ 2) and any position P (1 ≤ P ≤ N), removing the week at position P SHALL result in a course with N-1 weeks numbered sequentially from 1 to N-1, preserving the relative order of all non-removed weeks.

**Validates: Requirements 2.5**

### Property 5: Course Listing Completeness and Ordering

*For any* coach who has created K courses, the GET /courses endpoint SHALL return exactly K courses, and the list SHALL be sorted such that for every consecutive pair (course_i, course_i+1), course_i.updatedAt ≥ course_i+1.updatedAt.

**Validates: Requirements 3.1, 3.3, 10.2**

### Property 6: Deletion Does Not Cascade to Curriculum Plans

*For any* course that has been attached to a batch (generating curriculum_plans), deleting that course SHALL leave all previously created curriculum_plan records intact and retrievable.

**Validates: Requirements 4.3**

### Property 7: Attach Course Clones Weeks to Batch Plan

*For any* course with W weeks and any batch, attaching the course SHALL produce a batch-level curriculum_plan whose weeks array is structurally equivalent to the course's weeks array.

**Validates: Requirements 5.3**

### Property 8: Batch-to-Student Plan Cloning

*For any* batch with N enrolled students, attaching a course SHALL create exactly N individual curriculum_plan records, each with weeks equivalent to the batch plan's weeks and each with source_batch_plan_id equal to the batch plan's id.

**Validates: Requirements 6.1, 6.2**

### Property 9: Auto-Create Plan on Student Enrollment

*For any* batch that has an active course attached for the current cycle, adding a new student to that batch SHALL result in an individual curriculum_plan for that student with weeks equivalent to the batch plan's weeks.

**Validates: Requirements 6.3**

### Property 10: Individual Plan Isolation After Cloning

*For any* set of cloned student plans derived from a batch plan, editing one student's plan (modifying any week's focusArea, objective, or drills) SHALL NOT alter the batch plan or any other student's plan.

**Validates: Requirements 6.4**

### Property 11: Unique Course Name Per Coach

*For any* coach and any course name that already exists for that coach, attempting to create a second course with the same name SHALL be rejected with a 409 error.

**Validates: Requirements 7.4**

### Property 12: Ownership Authorization for Mutations

*For any* course owned by coach A, any attempt by a different coach B to update or delete that course SHALL be rejected with a 403 error, and the course SHALL remain unchanged.

**Validates: Requirements 10.6**
