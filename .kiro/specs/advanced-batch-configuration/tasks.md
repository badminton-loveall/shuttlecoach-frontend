# Implementation Plan

## Overview

This plan fixes the incomplete Edit/Add Batch modal in BatchesTab.tsx by replacing the minimal 2-field form (Name, Schedule) with a comprehensive advanced configuration modal containing all batch management fields. The fix follows the bug condition methodology: first exploring the bug, then preserving existing behavior, then implementing and validating.

## Tasks

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Advanced Configuration Modal Fields Missing
  - **IMPORTANT**: Write this property-based test BEFORE implementing the fix
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to the concrete failing cases: opening Add Batch modal and Edit Batch modal
  - Test that when isBugCondition(input) is true (action = "ADD_BATCH" or "EDIT_BATCH"), the modal contains ALL required fields:
    - Name (text input)
    - Schedule (text input)
    - Coach Assignment (dropdown populated with HEAD_COACH and ASSISTANT_COACH users)
    - Capacity (number input)
    - Skill Level (select with Beginner/Intermediate/Advanced/Professional options)
    - Monthly Fee (number input)
    - Days of Week (multi-select checkboxes for Mon-Sun)
    - Start Time (time input)
    - End Time (time input)
    - Description (textarea)
  - For Edit actions, assert all fields are pre-populated with current batch values including assigned coach
  - Assert coach dropdown is populated via API fetch from /coaches endpoint
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists: modal only shows Name and Schedule)
  - Document counterexamples found (e.g., "Add Batch modal renders only 2 fields instead of 10+", "Coach dropdown does not exist in DOM")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Modal Batch Behaviors Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (interactions where isBugCondition returns false):
    - Observe: Delete batch flow shows confirmation dialog and archives on confirm
    - Observe: Batches table renders Name, Schedule, Coach, Actions columns with correct data
    - Observe: ASSISTANT_COACH users do not see Add/Edit/Delete buttons
    - Observe: Successful create/update shows success message and refreshes list
    - Observe: API validation errors display field-level error messages
    - Observe: Empty name submission triggers validation error
  - Write property-based tests capturing observed behavior patterns:
    - For all non-modal interactions, component behavior is identical
    - Delete confirmation dialog renders and archives batch on confirm
    - Table displays correct columns and data formatting
    - Role-based access hides action buttons for ASSISTANT_COACH
    - Success messages appear and list refreshes after mutations
    - API errors propagate to field-level display
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3. Fix for Advanced Batch Configuration Modal

  - [x] 3.1 Expand BatchFormData and BatchRecord interfaces
    - Add to BatchFormData: assignedCoachId (string | null), capacity (number | ''), skillLevel ('' | 'Beginner' | 'Intermediate' | 'Advanced' | 'Professional'), monthlyFee (number | ''), daysOfWeek (string[]), startTime (string), endTime (string), description (string)
    - Add to BatchRecord: capacity?, skill_level?, monthly_fee?, days_of_week?, start_time?, end_time?, description?, assigned_coach_id?, coach_name?
    - Add to FormErrors: optional error fields for each new input
    - _Bug_Condition: isBugCondition(input) where input.action = "ADD_BATCH" OR input.action = "EDIT_BATCH"_
    - _Expected_Behavior: Modal presents all batch configuration fields per design_
    - _Preservation: Existing type contracts for delete, table, role-based access unchanged_
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 3.2 Add coach list state and fetchCoaches effect
    - Add coaches state: { id: string; name: string; role: string }[]
    - Add useEffect to fetch coaches from apiClient.get('/coaches') on mount
    - Map response to coach list for dropdown population
    - Handle loading/error states for coach fetch gracefully
    - _Bug_Condition: isBugCondition(input) — coach dropdown must be populated_
    - _Expected_Behavior: Coach dropdown includes HEAD_COACH and ASSISTANT_COACH users_
    - _Preservation: No impact on non-modal behaviors_
    - _Requirements: 2.3_

  - [x] 3.3 Update handleAddClick and handleEditClick
    - handleAddClick: Initialize all new fields to defaults (assignedCoachId: null, capacity: '', skillLevel: '', monthlyFee: '', daysOfWeek: [], startTime: '', endTime: '', description: '')
    - handleEditClick: Pre-populate all fields from batch record (map assigned_coach_id → assignedCoachId, skill_level → skillLevel, monthly_fee → monthlyFee, days_of_week → daysOfWeek, start_time → startTime, end_time → endTime)
    - _Bug_Condition: isBugCondition(input) — Add/Edit modal must show all fields_
    - _Expected_Behavior: Add shows empty defaults, Edit pre-populates from batch data_
    - _Preservation: Delete flow, table rendering unaffected_
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 3.4 Expand modal size and add form fields with sections
    - Change modal size from small to medium/large to accommodate fields
    - Organize fields into sections: Basic Info (Name, Description), Assignment (Coach dropdown), Configuration (Capacity, Skill Level, Monthly Fee), Schedule (Days of Week checkboxes, Start Time, End Time, Schedule text)
    - Coach Assignment: select dropdown with coaches grouped/labeled by role
    - Capacity: number input (min 0)
    - Skill Level: select with Beginner/Intermediate/Advanced/Professional options
    - Monthly Fee: number input (min 0)
    - Days of Week: checkbox group for Mon-Sun
    - Start Time / End Time: time inputs
    - Description: textarea
    - _Bug_Condition: isBugCondition(input) — modal must render all fields_
    - _Expected_Behavior: All 10+ fields rendered in organized sections_
    - _Preservation: Modal open/close behavior, overlay, escape-to-close unchanged_
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.5 Update handleSubmit and validateForm
    - handleSubmit: Include all new fields in API payload with snake_case mapping (assignedCoachId → assigned_coach_id, skillLevel → skill_level, monthlyFee → monthly_fee, daysOfWeek → days_of_week, startTime → start_time, endTime → end_time)
    - validateForm: Keep name-required validation. Add: capacity non-negative if provided, monthly fee non-negative if provided, end time after start time if both provided
    - _Bug_Condition: isBugCondition(input) — form submission must send complete payload_
    - _Expected_Behavior: API receives all fields, validation catches invalid inputs_
    - _Preservation: Existing name-required validation unchanged, success/error message patterns unchanged_
    - _Requirements: 2.5, 3.3, 3.5, 3.6_

  - [x] 3.6 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Advanced Configuration Modal Fields Present
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior (all fields present, pre-populated for edits, coach dropdown populated)
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.7 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Modal Batch Behaviors Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm delete flow, table display, role-based access, success/error messages all unchanged
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 4. Checkpoint - Ensure all tests pass
  - Run full test suite to confirm all property-based tests and unit tests pass
  - Verify bug condition test (Property 1) passes — advanced modal renders all fields
  - Verify preservation test (Property 2) passes — non-modal behaviors unchanged
  - Ensure no TypeScript compilation errors in BatchesTab.tsx
  - Ask the user if questions arise

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": ["1", "2"],
      "description": "Write exploration and preservation tests BEFORE implementing the fix"
    },
    {
      "wave": 2,
      "tasks": ["3.1"],
      "description": "Expand TypeScript interfaces to support new form fields"
    },
    {
      "wave": 3,
      "tasks": ["3.2", "3.3"],
      "description": "Add coach fetch logic and update modal open handlers"
    },
    {
      "wave": 4,
      "tasks": ["3.4"],
      "description": "Expand modal UI with all form fields organized into sections"
    },
    {
      "wave": 5,
      "tasks": ["3.5"],
      "description": "Update form submission payload and validation logic"
    },
    {
      "wave": 6,
      "tasks": ["3.6", "3.7"],
      "description": "Verify bug condition test passes and preservation tests still pass"
    },
    {
      "wave": 7,
      "tasks": ["4"],
      "description": "Final checkpoint — ensure all tests pass"
    }
  ]
}
```

## Notes

- All changes are scoped to `src/components/BatchesTab.tsx` for the implementation
- Tests should be written in a co-located test file (e.g., `src/components/BatchesTab.test.tsx`)
- The coach list API endpoint is `/coaches` — ensure the API is available before running integration tests
- Property-based tests use fast-check for generating random batch configurations
- The bug is deterministic: opening any Add/Edit modal always shows only 2 fields
