# Design Document: Student Training Tab Redesign

## Overview

The redesigned Training Tab replaces the current training-logs/curriculum layout with a drill skills matrix, per-drill training history, batch curriculum drill list, and restyled strengths/weaknesses/feedback sections. It lives as a single component (`TrainingTab`) rendered inside `StudentProfilePage.tsx` via the existing `TrainingTabContent` wrapper. All styling uses CSS variables from `design-system.css` — no Tailwind dark-mode classes.

## Architecture

### High-Level Data Flow

```
StudentProfilePage
  └─ TrainingTabContent
       └─ TrainingTab (redesigned)
            ├─ useBatchStudentsDrills(batchId, date) → curriculum drills
            ├─ useSkillScores(studentId)             → current scores + history
            ├─ useTrainingLogs(studentId)            → training dates per drill
            └─ Local state: strengths, weaknesses, feedback
```

All three API hooks are called on mount. The component composes four visual sections stacked vertically:

1. **Drill Skills Matrix** — table grid with drills × score columns (0–4)
2. **Training History** — expandable per-drill date list (inline below selected row)
3. **Curriculum Drills** — grouped drill list from batch course plan
4. **Strengths / Weaknesses / Coach Feedback** — tag-based sections (restyled)

### Styling Approach

All styling uses CSS variables from `src/styles/design-system.css`. No Tailwind dark-mode utility classes.

| Design Aspect | Token |
|--------------|-------|
| Card backgrounds | `var(--surface-card)`, `var(--surface-hover)` |
| Text colors | `var(--text-primary)`, `var(--text-secondary)`, `var(--text-tertiary)` |
| Borders | `var(--border-default)`, `var(--border-strong)` |
| Spacing | `var(--space-xs)` through `var(--space-3xl)` |
| Border radius | `var(--radius-sm)`, `var(--radius-md)` |
| Typography | `var(--font-xs)` through `var(--font-lg)`, weight tokens |
| Shadows | `var(--shadow-card)`, `var(--shadow-focus)` |
| Focus ring | `var(--shadow-focus)` with `var(--border-focus)` |
| Transitions | `var(--transition-fast)`, `var(--transition-base)` |
| Active/selected score cell | `var(--color-primary)` background |
| Error states | `var(--color-danger)`, `var(--feedback-danger-light)` |
| Success indicator | `var(--color-success)` |

The project forces light mode globally (bottom of design-system.css). No `prefers-color-scheme: dark` media queries are needed.

## Components and Interfaces

### TrainingTab (refactored)

**File:** `src/components/TrainingTab.tsx`  
**CSS:** `src/components/TrainingTab.css` (rewritten with design-system tokens)

```tsx
interface TrainingTabProps {
  student: Student;
  onUpdateStrengths?: (strengths: string[]) => void;
  onUpdateWeaknesses?: (weaknesses: string[]) => void;
  onUpdateFeedback?: (feedback: string) => void;
}
```

The component is the single entry point. Internal sections are rendered inline or as local helper components within the same file.

#### Internal Sections

| Section | Responsibility |
|---------|---------------|
| `DrillSkillsMatrix` | Renders the drills × score grid, handles tap-to-set, keyboard nav |
| `TrainingHistoryPanel` | Expands below a selected drill row showing training dates |
| `CurriculumDrillsList` | Groups drills by focus area from batch course plan |
| `StrengthsSection` | Tag list with add/remove (coach) or read-only (student) |
| `WeaknessesSection` | Tag list with add/remove (coach) or read-only (student) |
| `FeedbackSection` | Textarea (coach) or read-only text (student) |

### Drill Skills Matrix

#### Layout

```
┌──────────────────────────────────────────────────────────┐
│  Drill Name        │  0  │  1  │  2  │  3  │  4  │ Status │
├────────────────────┼─────┼─────┼─────┼─────┼─────┼────────┤
│  Clear (FH)        │     │  ●  │     │     │     │   ✓    │
│  ▼ Training History│                                       │
│     2025-01-15, 2025-01-08, 2024-12-20                    │
├────────────────────┼─────┼─────┼─────┼─────┼─────┼────────┤
│  Drop Shot         │     │     │  ●  │     │     │        │
└──────────────────────────────────────────────────────────┘
```

- Each row = one curriculum drill
- Each cell in columns 0–4 = a tappable score indicator
- `●` (filled circle) indicates the current score
- Status column shows saving/saved/error indicator
- Expanding a row reveals Training History inline

#### Tap-to-Set Flow (Optimistic UI)

```
User taps cell (drill=X, score=Y)
  ├─ 1. Immediately set drillScoreMap[X] = Y (optimistic)
  ├─ 2. Set savingState[X] = 'saving'
  ├─ 3. Call recordScores({ studentId, cycleKey, scores: [{ skillId: X, score: Y }] })
  │     ├─ Success → set savingState[X] = 'saved', clear after 2s
  │     └─ Failure → revert drillScoreMap[X] to previous value
  │                   set savingState[X] = 'error'
  └─ 4. Show toast/inline error on failure
```

#### Keyboard Navigation

The matrix uses `role="grid"` with `role="row"` and `role="gridcell"`. A `focusedCell` state tracks `{ row: number, col: number }`.

| Key | Action |
|-----|--------|
| ArrowRight | Move focus to next column (wrap at 4) |
| ArrowLeft | Move focus to previous column (wrap at 0) |
| ArrowDown | Move focus to next row |
| ArrowUp | Move focus to previous row |
| Enter / Space | Toggle score for focused cell (coach only) |
| Escape | Collapse training history if expanded |

Focus is managed via `useRef` on the grid container with `onKeyDown` handler and programmatic `element.focus()`.

#### ARIA Attributes

```tsx
<div role="grid" aria-label="Drill Skills Matrix">
  <div role="row">
    <div role="columnheader">Drill</div>
    <div role="columnheader">0 - Don't Know</div>
    {/* ... columns 1–4 ... */}
  </div>
  <div role="row" aria-label="Clear (FH)">
    <div role="rowheader">Clear (FH)</div>
    <div
      role="gridcell"
      aria-label="Clear (FH), score 0, Don't Know"
      aria-selected={score === 0}
      tabIndex={isFocused ? 0 : -1}
    />
  </div>
</div>
```

### Training History Panel

When a drill row is selected (tap on drill name or chevron), the row expands to show training dates.

**Data Source:** `useSkillScores` — each `WeeklySkillScore` has a `recordedAt` date and skill information. The component filters scores matching the selected drill's skill ID.

**Sorting:** Dates are sorted descending (most recent first): `dates.sort((a, b) => b.getTime() - a.getTime())`

**Empty State:** "No training sessions recorded for this drill."

### Curriculum Drills Section

**Data Source:** Same `useBatchStudentsDrills` response. The `drills` array contains `{ name, focusArea }` entries.

**Grouping Logic:**

```tsx
const groupedDrills = useMemo(() => {
  const groups: Record<string, string[]> = {};
  for (const drill of curriculumDrills) {
    if (!groups[drill.focusArea]) {
      groups[drill.focusArea] = [];
    }
    groups[drill.focusArea].push(drill.name);
  }
  return groups;
}, [curriculumDrills]);
```

Each focus area becomes a section header with its drills listed underneath.

### Strengths / Weaknesses / Feedback

Carried forward from the existing implementation with only CSS changes (replacing Tailwind dark-mode classes and hardcoded colors with design-system CSS variables).

**Behavioral contract (unchanged):**
- Coach role: can add/remove tags, edit feedback textarea
- Student role: read-only display
- Parent notification via `onUpdateStrengths`, `onUpdateWeaknesses`, `onUpdateFeedback` callbacks

## Data Models

### DrillScoreMap (local derived state)

```tsx
// Derived inside TrainingTab from useSkillScores response
type DrillScoreMap = Record<string, SkillScore>; // drillName → score (0–4)
```

### SavingState (local)

```tsx
interface SavingState {
  [drillName: string]: 'saving' | 'saved' | 'error';
}
```

### FocusedCell (local)

```tsx
interface FocusedCell {
  row: number; // drill index
  col: number; // score column 0–4
}
```

### Existing Types (unchanged)

| Type | Source | Usage |
|------|--------|-------|
| `BatchStudentDrill` | `src/hooks/useBatchStudentsDrills.ts` | Curriculum drill list |
| `WeeklySkillScore` | `src/constants/skillCatalog.ts` | Score data with dates |
| `TrainingLog` | `src/types/index.ts` | Training history entries |
| `SkillScore` (0–4) | `src/types/index.ts` | Score values |
| `Student` | `src/types/index.ts` | Student model with batchId, strengths, etc. |

### API Calls

| Hook | Endpoint | Purpose |
|------|----------|---------|
| `useBatchStudentsDrills({ batchId, date })` | `GET /api/batch-students-drills` | Fetch curriculum drills for the student's batch |
| `useSkillScores({ studentId })` | `GET /api/skill-scores` | Fetch current scores and history |
| `useSkillScores.recordScores(data)` | `POST /api/skill-scores` | Persist a score change |
| `useTrainingLogs({ studentId })` | `GET /api/training-logs` | Fetch training log entries |

## Error Handling

| Error Source | Strategy |
|-------------|----------|
| `useBatchStudentsDrills` returns error | Show user-friendly message in matrix area, disable matrix interactions |
| `useSkillScores` fetch fails | Show error message in matrix, allow curriculum to render independently |
| `recordScores` POST fails | Revert optimistic score, show inline error on affected row |
| Network timeout | Same as API error — revert + message |
| Empty curriculum | Show "No curriculum drills assigned" message |
| Empty training history | Show "No training sessions recorded" per drill |
| Both APIs fail | Consolidated error card with "Retry" button calling both refetch functions |

### Loading States

| Condition | Display |
|-----------|---------|
| Scores loading | Skeleton shimmer in matrix area (`var(--surface-hover)` background) |
| Drills loading | Spinner in curriculum section |
| Both loading | Both loading indicators independently |

### Retry

```tsx
const handleRetry = () => {
  refetchScores();
  refetchDrills();
};
```

## Testing Strategy

### Unit Tests (example-based)

- Matrix renders correct number of rows from mocked drill data
- Matrix renders 5 score columns (0–4)
- Loading skeletons appear when hooks return `loading: true`
- Error messages render when hooks return errors
- Empty states render when data is empty
- Retry button calls both refetch functions
- Saving indicator appears during in-flight requests

### Property Tests (universal properties — 100+ iterations)

Each property below tests a universal invariant across randomly generated inputs. See Correctness Properties section for full definitions.

### Integration Tests

- Verify `useSkillScores` is called with correct `studentId` when drill is selected for history (Req 3.4)

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Score highlighting matches stored value

*For any* drill in the matrix with a stored SkillScore value S (0–4), exactly one cell in that drill's row SHALL be highlighted, and it SHALL be the cell corresponding to score S.

**Validates: Requirements 1.3**

### Property 2: Matrix displays only curriculum drills

*For any* set of curriculum drills returned by `useBatchStudentsDrills`, the Drill Skills Matrix SHALL render exactly those drills as rows — no more, no fewer — matching by drill name.

**Validates: Requirements 1.4**

### Property 3: Tap produces optimistic UI update

*For any* drill D and score value Y (0–4) tapped by a Coach_User, the highlighted cell for drill D SHALL immediately change to column Y before the API response returns.

**Validates: Requirements 2.1**

### Property 4: Tap invokes API with correct parameters

*For any* drill D and score value Y tapped by a Coach_User, the `recordScores` function SHALL be invoked with the student's ID, drill D's skill ID, and score Y as arguments.

**Validates: Requirements 2.2**

### Property 5: Failed save reverts to previous score

*For any* drill D with previous score X, when a Coach_User taps score Y and the API call fails, the highlighted cell SHALL revert from Y back to X and an error notification SHALL be displayed.

**Validates: Requirements 2.5**

### Property 6: Student role renders all sections read-only

*For any* Student_User viewing the Training Tab, zero interactive score cells, zero tag input fields, and zero editable textareas SHALL be present in the DOM.

**Validates: Requirements 2.6, 5.5**

### Property 7: Training history dates sorted descending

*For any* drill with N training dates (N > 1), the displayed dates SHALL be in strictly descending chronological order (most recent first).

**Validates: Requirements 3.2**

### Property 8: Selected drill shows matching history dates

*For any* drill D selected in the matrix, the Training History panel SHALL display exactly the set of dates where drill D was trained, and no dates from other drills.

**Validates: Requirements 3.1**

### Property 9: Curriculum drills grouped by focus area

*For any* set of curriculum drills with K distinct focus areas, the Curriculum section SHALL render exactly K group headers, and each drill SHALL appear under its correct focus area group.

**Validates: Requirements 4.2**

### Property 10: Tag add/remove updates list and notifies parent

*For any* non-empty, non-duplicate tag string T added to strengths or weaknesses by a Coach_User, the displayed tag list SHALL include T and the corresponding parent callback SHALL be invoked with the updated array containing T. Conversely, removing T SHALL exclude it from both the display and the callback array.

**Validates: Requirements 5.2, 5.3**

### Property 11: Feedback edit propagates to parent

*For any* string S typed into the coach feedback textarea, the `onUpdateFeedback` callback SHALL be invoked with value S.

**Validates: Requirements 5.4**

### Property 12: Keyboard arrow navigation moves focus correctly

*For any* focused cell at position (row R, col C) in the matrix, pressing ArrowRight SHALL move focus to (R, min(C+1, 4)), ArrowLeft to (R, max(C-1, 0)), ArrowDown to (min(R+1, maxRow), C), and ArrowUp to (max(R-1, 0), C).

**Validates: Requirements 8.1**

### Property 13: ARIA labels contain drill name and score value

*For any* cell in the Drill Skills Matrix for drill D at score column S, the cell's `aria-label` attribute SHALL contain both the drill name D and the score descriptor for S.

**Validates: Requirements 8.3**

### Property 14: Enter/Space activates score selection

*For any* focused cell at position (R, C) when the user is a Coach_User, pressing Enter or Space SHALL trigger the same score-setting behavior as a click/tap on that cell.

**Validates: Requirements 8.4**
