# Implementation Plan: Student Training Tab Redesign

## Overview

Redesign the Training Tab by replacing the current training-logs/curriculum layout with a drill skills matrix (tap-to-set scoring), per-drill training history, grouped curriculum drill list, and restyled strengths/weaknesses/feedback sections. All styling uses CSS variables from `design-system.css`. Implementation uses React/TypeScript within the existing component structure.

## Tasks

- [x] 1. Create TrainingTab.css with design system tokens
  - [x] 1.1 Rewrite TrainingTab.css replacing all Tailwind dark-mode classes and hardcoded colors with design-system.css variable tokens
    - Replace all `var(--slate-*)` fallbacks and `prefers-color-scheme` media queries with proper design-system tokens (`--surface-card`, `--text-primary`, `--border-default`, `--space-*`, `--radius-*`, `--shadow-*`, `--font-*`)
    - Add new class rules for `.drill-skills-matrix`, `.score-cell`, `.score-cell--active`, `.score-cell--saving`, `.training-history-panel`, `.curriculum-drills-list`, `.focus-area-group`
    - Add focus ring styles using `var(--shadow-focus)` and `var(--border-focus)`
    - Add skeleton shimmer animation for loading states
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 2. Create DrillSkillsMatrix component
  - [x] 2.1 Create `src/components/DrillSkillsMatrix.tsx` with grid layout, score cells, and tap-to-set logic
    - Render a `role="grid"` container with drill rows and 5 score columns (0–4)
    - Each score cell is tappable (coach) or read-only (student) with `aria-selected` indicating current score
    - Implement optimistic UI: immediately highlight tapped cell, call `recordScores`, revert on failure
    - Track `savingState` per drill row (`saving` | `saved` | `error`)
    - Show inline error on API failure, clear `saved` indicator after 2s
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 2.2 Add keyboard navigation and ARIA attributes to DrillSkillsMatrix
    - Implement `FocusedCell` state with `onKeyDown` handler for ArrowUp/Down/Left/Right, Enter, Space, Escape
    - Use roving `tabIndex` (0 for focused cell, -1 for others)
    - Add `role="columnheader"`, `role="rowheader"`, `role="gridcell"` with `aria-label` containing drill name + score descriptor
    - Enter/Space triggers score selection for coach role
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 2.3 Write property tests for DrillSkillsMatrix
    - **Property 1: Score highlighting matches stored value**
    - **Property 2: Matrix displays only curriculum drills**
    - **Property 3: Tap produces optimistic UI update**
    - **Property 12: Keyboard arrow navigation moves focus correctly**
    - **Property 13: ARIA labels contain drill name and score value**
    - **Property 14: Enter/Space activates score selection**
    - **Validates: Requirements 1.3, 1.4, 2.1, 8.1, 8.3, 8.4**

- [x] 3. Create TrainingHistoryPanel component
  - [x] 3.1 Create `src/components/TrainingHistoryPanel.tsx` with expandable per-drill date list
    - Accept selected drill ID and skill scores data as props
    - Filter scores by selected drill's skill ID and extract `recordedAt` dates
    - Sort dates descending (most recent first)
    - Render date list inline below the selected drill row
    - Show "No training sessions recorded for this drill." when empty
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 3.2 Write property tests for TrainingHistoryPanel
    - **Property 7: Training history dates sorted descending**
    - **Property 8: Selected drill shows matching history dates**
    - **Validates: Requirements 3.1, 3.2**

- [x] 4. Create CurriculumDrillsList component
  - [x] 4.1 Create `src/components/CurriculumDrillsList.tsx` with grouped drill list by focus area
    - Accept curriculum drills array as prop
    - Group drills by `focusArea` using `useMemo`
    - Render each focus area as a section header with its drills listed below
    - Show "No curriculum drills assigned" when empty
    - Show "No curriculum is available" when student has no batch
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 4.2 Write property tests for CurriculumDrillsList
    - **Property 9: Curriculum drills grouped by focus area**
    - **Validates: Requirements 4.2**

- [x] 5. Checkpoint - Verify components compile and render independently
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Restyle strengths/weaknesses/feedback sections
  - [x] 6.1 Update the strengths, weaknesses, and feedback JSX in TrainingTab.tsx to use CSS classes styled with design-system tokens
    - Replace inline Tailwind dark-mode classes with semantic CSS classes from TrainingTab.css
    - Ensure tag-add buttons, tag-remove buttons, textarea, and empty states all use design-system variables
    - Keep behavioral logic unchanged (add/remove tags, feedback propagation, coach vs student role)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2_

  - [ ]* 6.2 Write property tests for strengths/weaknesses/feedback
    - **Property 6: Student role renders all sections read-only**
    - **Property 10: Tag add/remove updates list and notifies parent**
    - **Property 11: Feedback edit propagates to parent**
    - **Validates: Requirements 2.6, 5.2, 5.3, 5.4, 5.5**

- [x] 7. Wire everything into TrainingTab and TrainingTabContent
  - [x] 7.1 Refactor `src/components/TrainingTab.tsx` to compose the new sections
    - Remove old training-logs and curriculum display code
    - Import and render DrillSkillsMatrix, TrainingHistoryPanel, CurriculumDrillsList
    - Call `useBatchStudentsDrills({ batchId: student.batchId, date })` and `useSkillScores({ studentId: student.id })` at the top level
    - Pass curriculum drills to both DrillSkillsMatrix and CurriculumDrillsList
    - Manage `selectedDrillId` state to drive TrainingHistoryPanel expand/collapse
    - Implement loading skeletons (scores) and spinners (curriculum) per design
    - Implement consolidated error state with retry button calling both refetch functions
    - _Requirements: 1.1, 7.1, 7.2, 7.3, 7.4_

  - [x] 7.2 Verify TrainingTabContent wrapper in StudentProfilePage.tsx still passes `student` prop correctly
    - Confirm `<TrainingTabContent student={student} />` renders the refactored TrainingTab without changes needed
    - _Requirements: 1.1_

- [x] 8. Final checkpoint - Ensure all tests pass and components integrate correctly
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The project uses TypeScript with React (Vite build), CSS modules with design-system.css tokens
- Existing hooks (`useBatchStudentsDrills`, `useSkillScores`, `useTrainingLogs`) are already implemented — no new API work needed
- The app forces light mode globally; no dark-mode media queries needed in new CSS

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "4.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.2", "4.2", "6.1"] },
    { "id": 3, "tasks": ["6.2", "7.1"] },
    { "id": 4, "tasks": ["7.2"] }
  ]
}
```
