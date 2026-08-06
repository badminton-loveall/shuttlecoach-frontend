# Advanced Batch Configuration Bugfix Design

## Overview

The Edit/Add Batch modals in the Master Data page currently only expose Name and Schedule text fields, leaving users without the ability to configure coach assignment, capacity, skill level, fees, schedule details, or description. The backend API already supports `assignedCoachId` and the table displays a Coach column, but the UI provides no mechanism to set it. This fix replaces the minimal modal with a comprehensive advanced configuration modal that exposes all batch management fields while preserving existing delete, validation, table display, and role-based access behaviors.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — when the Add or Edit Batch modal is opened, it only shows Name and Schedule fields instead of the full configuration form
- **Property (P)**: The desired behavior — the modal should present all batch configuration fields (Name, Schedule, Coach Assignment, Capacity, Skill Level, Monthly Fee, Days of Week, Start Time, End Time, Description) and pre-populate them for edits
- **Preservation**: Existing behaviors that must remain unchanged — delete confirmation, table display, validation errors, read-only access for ASSISTANT_COACH, success messages, and API error display
- **BatchesTab**: The component in `src/components/BatchesTab.tsx` that manages batch CRUD operations
- **BatchFormData**: The interface defining the form state — currently only `{ name, schedule }`, needs expansion
- **BatchRecord**: The interface representing a batch row from the API — has fields for `assigned_coach_id` and `coach_name` already
- **apiClient**: Axios-based HTTP client in `src/utils/apiClient.ts` that handles JWT auth and base URL configuration

## Bug Details

### Bug Condition

The bug manifests whenever a user opens the Add or Edit Batch modal. The `BatchesTab` component renders a modal with only two fields (Name and Schedule), even though the system requires comprehensive batch management including coach assignment, capacity, skill level, fee structure, timing, and description.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type BatchFormAction
  OUTPUT: boolean
  
  RETURN input.action = "EDIT_BATCH" OR input.action = "ADD_BATCH"
END FUNCTION
```

### Examples

- **Add Batch**: User clicks "Add Batch" → sees only Name and Schedule fields → cannot assign a coach, set capacity, or configure skill level/fees
- **Edit Batch**: User clicks "Edit" on a batch that has `assigned_coach_id` set → modal shows Name and Schedule only → cannot see or change the coach assignment
- **Coach Column Empty**: Table shows a "Coach" column that is always "—" because there's no UI to assign coaches
- **Edge Case**: User wants to set capacity to 0 (unlimited) or leave optional fields blank — the advanced modal should handle optional fields gracefully

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Delete batch confirmation dialog and archive behavior must continue to work exactly as before
- Batches table must continue to show Name, Schedule, Coach, and Actions columns with correct data
- Submitting the form with an empty name must continue to display a validation error
- ASSISTANT_COACH (read-only) users must continue to not see Add/Edit/Delete buttons
- Successful create/update must continue to show a success message and refresh the list
- API validation errors must continue to display field-level error messages

**Scope:**
All inputs that do NOT involve opening the batch Add/Edit modal should be completely unaffected by this fix. This includes:
- Delete batch flow (confirmation dialog, API call, refresh)
- Table rendering and column display
- Role-based visibility of action buttons
- Loading/error states for the batches list
- Success/error message display patterns

## Hypothesized Root Cause

Based on the bug description, the root cause is straightforward:

1. **Incomplete Form Interface**: `BatchFormData` is defined as `{ name: string; schedule: string }` — it lacks fields for `assignedCoachId`, `capacity`, `skillLevel`, `monthlyFee`, `daysOfWeek`, `startTime`, `endTime`, and `description`

2. **Minimal Modal Rendering**: The modal JSX only renders two `<input>` elements (name and schedule) — no coach dropdown, no capacity input, no skill level selector, etc.

3. **No Coach Data Fetching**: The component never fetches the list of coaches from `/coaches` API, so even if a dropdown existed, it would have no options to display

4. **Incomplete Payload Construction**: The `handleSubmit` function only sends `{ name, schedule }` to the API, even though the backend likely accepts additional fields

5. **No Pre-population of Extended Fields**: `handleEditClick` only populates `name` and `schedule` from the batch record, ignoring `assigned_coach_id` and other potential fields

## Correctness Properties

Property 1: Bug Condition - Advanced Configuration Modal Fields

_For any_ batch form action (Add or Edit) where isBugCondition returns true, the fixed component SHALL render a modal containing all required fields: Name (text input), Schedule (text input), Coach Assignment (dropdown populated with HEAD_COACH and ASSISTANT_COACH users), Capacity (number input), Skill Level (select with Beginner/Intermediate/Advanced/Professional options), Monthly Fee (number input), Days of Week (multi-select checkboxes), Start Time (time input), End Time (time input), and Description (textarea). For Edit actions, all fields SHALL be pre-populated with the batch's current values.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 2: Preservation - Non-Modal Behaviors

_For any_ interaction that does NOT involve opening the batch Add/Edit modal (delete flow, table display, role-based access, loading states, error handling), the fixed component SHALL produce exactly the same behavior as the original component, preserving delete confirmation dialogs, table column rendering, ASSISTANT_COACH read-only enforcement, success/error messages, and list refresh behavior.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/components/BatchesTab.tsx`

**Component**: `BatchesTab`

**Specific Changes**:

1. **Expand `BatchFormData` interface**: Add fields for `assignedCoachId` (string | null), `capacity` (number | ''), `skillLevel` (SkillLevel | ''), `monthlyFee` (number | ''), `daysOfWeek` (string[]), `startTime` (string), `endTime` (string), and `description` (string)

2. **Add coach list state and fetch**: Add `coaches` state array and a `fetchCoaches` effect that calls `apiClient.get('/coaches')` on mount. Map the response to `{ id, name, role }` objects for the dropdown

3. **Expand modal size**: Change `modal-content--small` to a medium/large modal class to accommodate additional fields. Organize fields into logical sections (Basic Info, Assignment, Schedule, Details)

4. **Add form fields to modal JSX**: Render Coach Assignment as a `<select>` dropdown with coach options grouped or labeled by role; Capacity as `<input type="number">`; Skill Level as `<select>` with the four level options; Monthly Fee as `<input type="number">`; Days of Week as a set of checkboxes (Mon–Sun); Start Time and End Time as `<input type="time">`; Description as `<textarea>`

5. **Update `handleAddClick`**: Initialize all new fields to their empty/default values when opening the Add modal

6. **Update `handleEditClick`**: Pre-populate all new fields from the batch record when opening the Edit modal. Map `assigned_coach_id` → `assignedCoachId`, and pull capacity, skill level, fee, timing, and description from the batch data

7. **Update `handleSubmit` payload**: Include all new fields in the API request payload, converting field names to snake_case as needed (e.g., `assignedCoachId` → `assigned_coach_id`, `monthlyFee` → `monthly_fee`)

8. **Update `BatchRecord` interface**: Add optional fields for `capacity`, `skill_level`, `monthly_fee`, `days_of_week`, `start_time`, `end_time`, and `description` to match what the API returns

9. **Update `FormErrors` interface**: Add optional error fields for the new inputs to support field-level validation from the API

10. **Expand `validateForm`**: Keep name-required validation. Add optional validations: capacity must be non-negative if provided, monthly fee must be non-negative if provided, end time must be after start time if both provided

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write component tests using Testing Library that render the BatchesTab, open the Add/Edit modal, and assert that advanced fields exist. Run these tests on the UNFIXED code to observe failures and confirm the deficiency.

**Test Cases**:
1. **Add Modal Fields Test**: Render BatchesTab, click "Add Batch", assert that coach dropdown, capacity, skill level, fee, days, times, and description fields are present (will fail on unfixed code)
2. **Edit Modal Pre-population Test**: Render BatchesTab with mock batch data including coach assignment, open Edit modal, assert fields are pre-populated (will fail on unfixed code)
3. **Coach Dropdown Population Test**: Render BatchesTab, open modal, assert coach dropdown contains coach options fetched from API (will fail on unfixed code)
4. **Submit Payload Test**: Fill out all fields and submit, assert API call includes all fields in payload (will fail on unfixed code)

**Expected Counterexamples**:
- Modal only contains name and schedule inputs; coach dropdown, capacity, skill level, etc. are missing from the DOM
- Possible causes: incomplete form interface, missing JSX elements, no coach fetch logic

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  modal ← openBatchModal(input)
  ASSERT modal.hasField("name")
  ASSERT modal.hasField("schedule")
  ASSERT modal.hasField("assignedCoachId") AND modal.coachDropdown.isPopulated
  ASSERT modal.hasField("capacity")
  ASSERT modal.hasField("skillLevel")
  ASSERT modal.hasField("monthlyFee")
  ASSERT modal.hasField("daysOfWeek")
  ASSERT modal.hasField("startTime")
  ASSERT modal.hasField("endTime")
  ASSERT modal.hasField("description")
  IF input.action = "EDIT_BATCH" THEN
    ASSERT modal.fields.prePopulated = true
  END IF
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT BatchesTab_original(input) = BatchesTab_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for delete flow, table rendering, and role-based access, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Delete Flow Preservation**: Verify clicking Delete still shows confirmation dialog and archives batch on confirm — unchanged by modal expansion
2. **Table Display Preservation**: Verify table still renders Name, Schedule, Coach, Actions columns with correct formatting
3. **Read-Only Preservation**: Verify ASSISTANT_COACH users still cannot see Add/Edit/Delete buttons
4. **Success Message Preservation**: Verify success messages still appear and auto-dismiss after 3 seconds

### Unit Tests

- Test that all 10 form fields render in the Add modal
- Test that all fields pre-populate correctly in the Edit modal
- Test coach dropdown fetches and displays coaches with roles
- Test form validation (name required, capacity non-negative, end time after start time)
- Test submit sends complete payload with all fields
- Test optional fields can be left empty

### Property-Based Tests

- Generate random batch configurations and verify the modal correctly pre-populates all fields when editing
- Generate random form submissions and verify the API payload includes all provided fields with correct snake_case mapping
- Generate random non-modal interactions (delete clicks, table renders) and verify behavior is identical to unfixed code

### Integration Tests

- Test full Add Batch flow: open modal → fill all fields → submit → verify success message and list refresh
- Test full Edit Batch flow: open modal → verify pre-population → modify fields → submit → verify update
- Test coach assignment end-to-end: assign coach via dropdown → verify Coach column updates in table
- Test form validation end-to-end: submit with invalid data → verify field-level errors display
