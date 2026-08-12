# Design Document: Enhanced Calendar Views

## Overview

This design enhances two existing calendar components — the student's `StudentScheduleCalendar` and the coach's `SessionCalendarPage` — with richer color theming and drill-down capabilities. On the student side, session day highlights adopt the student's skill-level color instead of the current hardcoded lime. On the coach side, the calendar aggregates all assigned batches into a single view using a color-coded palette, and adds a day-click detail panel showing batch cards with student lists and expandable drill schedules.

A new backend API endpoint (`GET /api/batch-students-drills`) is introduced to supply per-student drill data for a given batch and date, deriving drills from `curriculum_plans` and week-number calculation.

### Key Design Decisions

1. **Skill-level colors via CSS class modifiers** — The `DayCell` component receives a `skillLevel` prop and applies a class like `day-cell--skill-beginner`. This keeps color logic in CSS (supporting dark mode via media queries) and avoids inline style coupling.

2. **Coach calendar fetches ALL batches** — The existing `useSessionCalendar` hook already accepts an optional `batchId` filter. Omitting it returns sessions for all coach batches. The coach calendar will stop passing `batchId`, receiving a merged multi-batch result.

3. **Batch color palette as a pure function** — A deterministic 6-color palette is assigned by sorting batches alphabetically by ID, then indexing `% 6`. This guarantees consistent colors across months without server-side state.

4. **New endpoint derives drills from curriculum position** — Rather than storing drill assignments per-student-per-date, the endpoint computes the curriculum week from `session_schedules.cycle_start_date` + `recurrence.repeatEvery`, then looks up `curriculum_plans.weeks[weekNumber].drills`. Individual student plans override batch plans when available.

---

## Architecture

```mermaid
flowchart TD
    subgraph Frontend (React SPA)
        A[StudentScheduleCalendar] -->|skillLevel prop| B[DayCell]
        C[SessionCalendarPage] -->|all batches| D[CoachCalendarGrid]
        D -->|day click| E[CoachDayDetailPanel]
        E -->|student click| F[StudentDrillView]
    end

    subgraph Backend (Express API)
        G[GET /api/session-calendar] -->|no batchId filter| H[calendarEngine]
        I[GET /api/batch-students-drills] --> J[batchStudentsDrillsController]
        J --> K[curriculumDrillResolver]
    end

    subgraph Database (Supabase / Postgres)
        L[(students)]
        M[(curriculum_plans)]
        N[(session_schedules)]
        O[(batches)]
    end

    C --> G
    E --> I
    J --> L
    J --> M
    J --> N
    K --> M
    K --> N
```

### Data Flow

1. **Student Calendar**: Parent page passes `skillLevel` (from student profile) into `StudentScheduleCalendar`. The component passes it to `CalendarGrid` → `DayCell`, which applies the appropriate CSS class.

2. **Coach Calendar**: On mount, `SessionCalendarPage` calls `useSessionCalendar({ startDate, endDate })` without `batchId`. The API returns entries for all coach batches. The frontend groups entries by `batchId`, assigns a palette color per batch, and renders multi-color dot indicators on each day cell.

3. **Coach Day Detail**: On day click, the panel displays batch cards from locally available `CalendarEntry[]` data (batch name, time, focus area). For each batch card, it calls `GET /api/batch-students-drills?batchId=X&date=YYYY-MM-DD` to fetch student names + drill data.

4. **Student Drill Expand**: Clicking a student row toggles an inline accordion showing drill names + focus area. No additional API call is needed — data is already in the response.

---

## Components and Interfaces

### Frontend Components

#### 1. `StudentScheduleCalendar` (Modified)

```typescript
interface StudentScheduleCalendarProps {
  batchId: string;
  skillLevel?: SkillLevel; // NEW — defaults to 'Beginner' if omitted
}
```

Changes:
- Accepts `skillLevel` prop
- Passes it through to `CalendarGrid` → `DayCell`
- `DayCell` applies `day-cell--skill-{level}` CSS class instead of `day-cell--highlighted`

#### 2. `DayCell` (Modified)

```typescript
interface DayCellProps {
  day: GridDay;
  hasEntries: boolean;
  isSelected: boolean;
  isToday: boolean;
  onClick: () => void;
  skillLevel?: SkillLevel;        // NEW — for student calendar
  batchColors?: BatchColorDot[];  // NEW — for coach calendar multi-batch view
}

interface BatchColorDot {
  batchId: string;
  batchName: string;
  color: string; // CSS color value from palette
}
```

#### 3. `CoachDayDetailPanel` (New Component)

```typescript
interface CoachDayDetailPanelProps {
  date: string;
  batchEntries: CoachBatchEntry[];
  onClose: () => void;
}

interface CoachBatchEntry {
  batchId: string;
  batchName: string;
  batchColor: string;
  startTime: string;
  endTime: string;
  focusArea: string;
}
```

#### 4. `BatchStudentList` (New Component)

```typescript
interface BatchStudentListProps {
  batchId: string;
  date: string;
  batchColor: string;
}
```

Fetches from `GET /api/batch-students-drills` on mount. Displays student cards with skill-level colored avatar indicator.

#### 5. `StudentDrillAccordion` (New Component)

```typescript
interface StudentDrillAccordionProps {
  student: BatchStudentDrill;
  isExpanded: boolean;
  onToggle: () => void;
}
```

#### 6. `BatchColorLegend` (New Component)

```typescript
interface BatchColorLegendProps {
  batches: Array<{ batchId: string; batchName: string; color: string }>;
}
```

Displays a horizontal list of color swatches with batch names.

### Frontend Hook

#### `useBatchStudentsDrills` (New Hook)

```typescript
interface UseBatchStudentsDrillsParams {
  batchId: string;
  date: string;
}

interface BatchStudentDrill {
  studentId: string;
  fullName: string;
  skillLevel: SkillLevel;
  drills: Array<{ name: string; focusArea: string }>;
}

function useBatchStudentsDrills(params: UseBatchStudentsDrillsParams): {
  students: BatchStudentDrill[];
  loading: boolean;
  error: string | null;
};
```

### Backend Controller

#### `GET /api/batch-students-drills`

```typescript
// Query params
interface BatchStudentsDrillsQuery {
  batchId: string;  // Required
  date: string;     // Required, YYYY-MM-DD format
}

// Response body (200 OK)
interface BatchStudentsDrillsResponse {
  students: Array<{
    studentId: string;
    fullName: string;
    skillLevel: SkillLevel;
    drills: Array<{ name: string; focusArea: string }>;
  }>;
}
```

### Color Utility

```typescript
// Predefined 6-color palette for coach batch colors
const BATCH_COLOR_PALETTE = [
  '#3B82F6', // blue
  '#F97316', // orange
  '#8B5CF6', // purple
  '#10B981', // emerald
  '#EF4444', // red
  '#F59E0B', // amber
] as const;

/**
 * Assigns a consistent color to each batch based on sorted batch ID order.
 * Cycles through the palette for >6 batches.
 */
function assignBatchColors(
  batchIds: string[]
): Map<string, string> {
  const sorted = [...batchIds].sort();
  const map = new Map<string, string>();
  sorted.forEach((id, index) => {
    map.set(id, BATCH_COLOR_PALETTE[index % BATCH_COLOR_PALETTE.length]);
  });
  return map;
}

// Skill-level CSS class mapping
const SKILL_LEVEL_CLASS_MAP: Record<SkillLevel, string> = {
  Beginner: 'day-cell--skill-beginner',
  Intermediate: 'day-cell--skill-intermediate',
  Advanced: 'day-cell--skill-advanced',
  Professional: 'day-cell--skill-professional',
};
```

---

## Data Models

### New API Response Type

```typescript
// GET /api/batch-students-drills response
interface BatchStudentsDrillsAPIResponse {
  students: Array<{
    studentId: string;
    fullName: string;
    skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Professional';
    drills: Array<{
      name: string;
      focusArea: string;
    }>;
  }>;
}
```

### Extended CalendarEntry (no schema change needed)

The existing `CalendarEntry` type already contains `batchId` and `batchName`, which is sufficient for the coach multi-batch view. No DB schema changes required.

### CSS Color Tokens

```css
/* Skill-level highlight colors — student calendar */
.day-cell--skill-beginner {
  background-color: rgba(59, 130, 246, 0.18);   /* blue */
  color: #1e40af;
}
.day-cell--skill-intermediate {
  background-color: rgba(249, 115, 22, 0.18);   /* orange */
  color: #9a3412;
}
.day-cell--skill-advanced {
  background-color: rgba(139, 92, 246, 0.18);   /* purple */
  color: #5b21b6;
}
.day-cell--skill-professional {
  background-color: rgba(16, 185, 129, 0.18);   /* green */
  color: #065f46;
}
```

### Drill Resolution Algorithm (Backend)

The new endpoint resolves drills for a student on a given date:

1. Look up `session_schedules` for the given `batchId` to get `cycle_start_date` and `recurrence.repeatEvery`.
2. Compute `weekNumber = floor((targetDate - cycleStartDate) / (repeatEvery * 7)) + 1`. Clamp to 1–8.
3. Look up `curriculum_plans` for the student (`student_id = X, is_archived = false`). If none found, fall back to the batch-level plan (`batch_id = X, is_archived = false`).
4. Extract `weeks[weekNumber - 1].drills` and `weeks[weekNumber - 1].focusArea` from the plan.
5. Return drill names with their focus area.

### Database Query (Pseudocode)

```sql
-- 1. Get students in the batch
SELECT id, full_name, skill_level
FROM students
WHERE batch_id = $batchId AND status = 'active';

-- 2. For each student, get individual curriculum plan (or fall back to batch plan)
SELECT weeks FROM curriculum_plans
WHERE student_id = $studentId AND is_archived = false
ORDER BY created_at DESC LIMIT 1;

-- Fallback:
SELECT weeks FROM curriculum_plans
WHERE batch_id = $batchId AND is_archived = false
ORDER BY created_at DESC LIMIT 1;

-- 3. Get session schedule for week number computation
SELECT cycle_start_date, recurrence FROM session_schedules
WHERE batch_id = $batchId;
```

---


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Batch Color Assignment Consistency and Uniqueness

*For any* set of batch IDs (1 to N), `assignBatchColors` shall return the same color for the same batch ID on every invocation, assign distinct colors for distinct batches (up to palette size of 6), and cycle deterministically for batch indices > 6.

**Validates: Requirements 2.2, 2.5, 5.1, 5.2**

### Property 2: Week Number Computation Correctness

*For any* valid `cycleStartDate`, `repeatEvery` (1 or 2), and `targetDate` that falls within 8 curriculum weeks of the cycle start, the computed `weekNumber` shall equal `floor((targetDate - cycleStartDate) / (repeatEvery * 7)) + 1` and be clamped to the range [1, 8], and the drills returned shall correspond to `curriculum_plans.weeks[weekNumber - 1].drills`.

**Validates: Requirements 4.3, 6.2, 6.5**

### Property 3: Skill-Level Class Mapping Completeness

*For any* valid `SkillLevel` value and any themed UI element (day cell background, selected ring, drill badge), the applied CSS class shall contain the correct skill-level identifier, and all themed elements shall use the same skill-level class for a given student.

**Validates: Requirements 1.1, 1.4**

### Property 4: Batch Grouping from Calendar Entries

*For any* set of `CalendarEntry` objects for a given date, grouping by `batchId` shall produce exactly the set of unique batch IDs present in the entries, preserving all entry data and producing no duplicates or omissions.

**Validates: Requirements 2.3, 3.1**

### Property 5: Rendered Batch Detail Data Completeness

*For any* `BatchStudentDrill` response containing N students each with M drills, the rendered detail panel shall display all N student names with skill-level indicators, and expanding any student shall reveal all M drill names with their associated focus areas.

**Validates: Requirements 3.2, 3.3, 4.2**

---

## Error Handling

### Frontend Error States

| Scenario | Handling |
|----------|----------|
| `useBatchStudentsDrills` API returns 403 | Display "You don't have access to this batch" message in the detail panel |
| `useBatchStudentsDrills` API returns 400 | Display "Invalid request — please try again" (should not occur in normal flow) |
| `useBatchStudentsDrills` API returns 500 or network error | Display "Student data is temporarily unavailable" with retry button |
| `useSessionCalendar` returns empty entries for coach | Show "No sessions scheduled" empty state (existing behavior) |
| `skillLevel` prop is undefined/null | Default to 'Beginner' color (blue) — graceful fallback |
| Curriculum plan not found for student or batch | Return empty drills array `[]` from API — frontend shows "No drills scheduled" |
| `cycleStartDate` is null for a batch schedule | Return empty drills array — cannot compute week number without cycle start |

### Backend Error Responses

```typescript
// 400 Bad Request — validation errors
{ error: "Missing required parameter: batchId" }
{ error: "Invalid date format. Expected YYYY-MM-DD" }
{ error: "Date must not be in the future" }

// 403 Forbidden — authorization
{ error: "You are not authorized to access this batch" }

// 500 Internal Server Error — unexpected failures
{ error: "An error occurred while fetching student drills" }
```

### Resilience Patterns

- **Graceful degradation**: If drill data fails to load, the batch card still shows batch name, time, and focus area from local `CalendarEntry` data.
- **Cache tolerance**: The coach calendar hook caches entries in `sessionStorage` with daily TTL (existing pattern). Color assignment derives from cached batch IDs.
- **Loading states**: Each `BatchStudentList` instance shows a skeleton loader independently, so one slow batch doesn't block others.

---

## Testing Strategy

### Unit Tests (Example-Based)

| Test | Validates |
|------|-----------|
| DayCell renders `day-cell--skill-beginner` when skillLevel is 'Beginner' | Req 1.2 |
| DayCell renders `day-cell--skill-professional` when skillLevel is 'Professional' | Req 1.2 |
| DayCell re-renders with new class when skillLevel prop changes | Req 1.3 |
| CoachDayDetailPanel shows error message on API failure | Req 3.5 |
| StudentDrillAccordion collapses on second click | Req 4.5 |
| StudentDrillAccordion shows "No drills scheduled" for empty array | Req 4.4 |
| Tooltip shows batch name on hover over color dot | Req 5.4 |
| API returns 403 for unauthorized batchId | Req 6.3 |
| API returns 400 for missing date param | Req 6.4 |
| API returns 400 for invalid date format (e.g., "not-a-date") | Req 6.4 |

### Property-Based Tests

| Property | Library | Min Iterations | Validates |
|----------|---------|----------------|-----------|
| Batch color assignment consistency | fast-check | 100 | Req 2.2, 2.5, 5.1, 5.2 |
| Week number computation correctness | fast-check | 100 | Req 4.3, 6.2, 6.5 |
| Skill-level class mapping completeness | fast-check | 100 | Req 1.1, 1.4 |
| Batch grouping from calendar entries | fast-check | 100 | Req 2.3, 3.1 |
| Rendered batch detail data completeness | fast-check | 100 | Req 3.2, 3.3, 4.2 |

**Property test configuration:**
- Library: `fast-check` (already compatible with Vitest test runner)
- Minimum 100 iterations per property
- Each test tagged with: `Feature: enhanced-calendar-views, Property {N}: {title}`

### Integration Tests

| Test | Validates |
|------|-----------|
| `GET /api/batch-students-drills` returns correct response shape | Req 6.1, 6.2 |
| `GET /api/session-calendar` without batchId returns all coach batches | Req 2.1 |
| Coach calendar renders color dots for multi-batch days | Req 2.3 |
| End-to-end: day click → panel → student click → drills shown | Req 3.1, 4.1 |
