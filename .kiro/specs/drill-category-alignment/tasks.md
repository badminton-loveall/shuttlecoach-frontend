# Implementation Plan: Drill Category Alignment

## Overview

Replace the drill data and category system with the coach-defined 5-category taxonomy (Service, Service Return, Forehand, Round Head, Backhand) containing 54 specific drills. Update DrillLibrary to use local JSON data with a static category dropdown.

## Tasks

- [x] 1. Create drill categories constant and drills.json data file
  - [x] 1.1 Create `src/constants/drillCategories.ts` with the `DrillCategory` type and `DRILL_CATEGORIES` array defining the 5 categories: Service, Service Return, Forehand (FH), Round Head, Backhand (BH)
    - Export `DrillCategory` type, `DRILL_CATEGORIES` array, and `DRILL_CATEGORY_LABELS` record
    - _Requirements: 2.1_
  - [x] 1.2 Create `src/data/drills.json` with all 54 drills organized by the 5 categories
    - Use ID format `drill-{prefix}-{nn}` (svc, sr, fh, rh, bh)
    - Include name, description, and category for each drill
    - Structure as `{ "drills": [...] }` for API compatibility
    - Service (5): BH Short Service, BH Flick Service, FH Short Service, FH Long Service, FH Flick Service
    - Service Return (6): Service return STR Keep, Service return Cross Keep, Service return STR Push, Service return Cross Push, Service return STR Lift, Service return Cross Lift
    - Forehand FH (19): Cross Drop FH, Straight Drop FH, Straight Smash FH, Cross Smash FH, Straight Drive FH, Cross Drive FH, Reverse Slice Straight FH, Forward Slice Straight FH, Forward Slice Cross FH, Straight Defence FH, Cross defense FH, Straight Keep FH, Cross Keep FH, Lift Straight FH, Lift Cross FH, Toss Straight FH, Toss Cross FH, Dribble keep I/O FH, Dribble keep I/O FH
    - Round Head (9): Cross Drop Round head, Straight Drop Round head, Straight Smash Round head, Cross Smash Round head, Straight Drive Round head, Cross Drive Round head, Reverse Slice Straight Round head, Forward Slice Straight Round head, Reverse Slice Cross Round head
    - Backhand BH (14): Straight Defence BH, Cross defense BH, Straight Keep BH, Cross Keep BH, Lift Straight BH, Lift Cross BH, Toss Straight BH, Toss Cross BH, Dribble keep I/O BH, Dribble keep I/O BH, Back hand Straight Toss, Back hand Straight Drop, Back hand Cross Drop, Back hand Cross Toss
    - _Requirements: 1.1, 1.3, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 4.1, 4.2_

- [x] 2. Update DrillLibrary component to use local data and static categories
  - [x] 2.1 Refactor `src/components/DrillLibrary.tsx` to import drills from `src/data/drills.json` and categories from `src/constants/drillCategories.ts`
    - Remove API fetch logic (useState for loading/error, useEffect, apiClient import)
    - Import drills data directly: `import drillsData from '../data/drills.json'`
    - Import `DRILL_CATEGORIES` from constants
    - Replace dynamic `categories` derivation with the static `DRILL_CATEGORIES` array
    - Keep search filtering and drag-and-drop functionality unchanged
    - _Requirements: 1.2, 3.1, 3.2, 3.3, 5.2_

- [x] 3. Checkpoint
  - Ensure the app compiles without errors, the DrillLibrary renders the 5 categories in the dropdown, and filtering works correctly. Ask the user if questions arise.

- [ ]* 4. Write unit tests for drill data integrity
  - Test drills.json has 54 entries total
  - Test each category has the correct count (5, 6, 19, 9, 14)
  - Test all drill IDs are unique
  - Test all drill categories are valid members of DRILL_CATEGORIES
  - Test all drills have non-empty name and description
  - **Property 1: Category Validity** — every drill has a valid category
  - **Property 3: Drill ID Uniqueness** — all IDs are distinct
  - **Property 4: Drill Completeness** — all fields are non-empty
  - _Requirements: 2.2, 4.1, 4.2, 4.3_

## Task Dependency Graph

```json
{
  "waves": [
    { "tasks": ["1"] },
    { "tasks": ["2"] },
    { "tasks": ["3"] },
    { "tasks": ["4"] }
  ]
}
```

## Notes

- Tasks marked with `*` are optional and can be skipped for faster delivery
- The Drill interface in `src/types/index.ts` already uses `category: string` — no type change needed
- Existing curriculum plans store drill objects inline in JSONB, so they render independently of the drill library data
- The drills.json structure (`{ "drills": [...] }`) mirrors an API response shape for easy future migration
