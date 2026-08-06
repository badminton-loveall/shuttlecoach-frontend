# Bugfix Requirements Document

## Introduction

The "Edit Batch" and "Add Batch" modals in the Master Data page are deficient — they only expose Name and Schedule text fields, despite the system needing comprehensive batch management. The backend API already supports coach assignment (`assignedCoachId`), and the batch table displays a Coach column that remains empty because there's no UI to set it. Users need an advanced configuration modal that provides full batch management including coach assignment, capacity, skill level, fee structure, schedule details, and description.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user clicks "Edit" on a batch THEN the system displays a minimal modal with only Name and Schedule text fields, providing no way to configure coach assignment, capacity, level, fees, or description

1.2 WHEN a user clicks "Add Batch" THEN the system displays the same minimal modal with only Name and Schedule text fields, missing all advanced configuration options

1.3 WHEN a user wants to assign a coach to a batch THEN the system provides no UI mechanism to do so, even though the API supports `assignedCoachId` and the table displays a Coach column

1.4 WHEN a user opens the Edit modal for a batch that already has a coach assigned THEN the system does not display the current coach assignment and provides no way to view or change it

1.5 WHEN a user needs to set batch capacity, skill level, fee amount, or description THEN the system provides no fields for these configuration options

### Expected Behavior (Correct)

2.1 WHEN a user clicks "Edit" on a batch THEN the system SHALL open an advanced configuration modal that includes fields for: Name, Schedule, Coach Assignment (dropdown), Capacity (max students), Skill Level (Beginner/Intermediate/Advanced/Professional), Monthly Fee amount, Days of Week selection, Timing details (start time, end time), and Description/notes

2.2 WHEN a user clicks "Add Batch" THEN the system SHALL open the same advanced configuration modal with all fields available for new batch creation

2.3 WHEN a user wants to assign a coach to a batch THEN the system SHALL provide a coach selection dropdown populated with all coaches (both HEAD_COACH and ASSISTANT_COACH roles), allowing the user to assign, change, or remove the coach

2.4 WHEN a user opens the advanced configuration modal for an existing batch THEN the system SHALL pre-populate all fields with the batch's current values, including the assigned coach if one exists

2.5 WHEN a user submits the advanced configuration modal THEN the system SHALL validate all required fields (Name is required) and send the complete batch data to the API

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user deletes a batch THEN the system SHALL CONTINUE TO show the delete confirmation dialog and archive the batch on confirmation

3.2 WHEN the batches table is displayed THEN the system SHALL CONTINUE TO show Name, Schedule, Coach, and Actions columns with correct data

3.3 WHEN a user submits the batch form with an empty name THEN the system SHALL CONTINUE TO display a validation error requiring the name field

3.4 WHEN a read-only user (ASSISTANT_COACH) views the batches tab THEN the system SHALL CONTINUE TO hide the Add Batch button and Edit/Delete action buttons

3.5 WHEN a batch is successfully created or updated THEN the system SHALL CONTINUE TO show a success message and refresh the batches list

3.6 WHEN the API returns validation errors THEN the system SHALL CONTINUE TO display field-level error messages to the user

---

## Bug Condition (Formal)

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type BatchFormAction
  OUTPUT: boolean
  
  // The bug triggers whenever the Add or Edit batch form is opened
  RETURN X.action = "EDIT_BATCH" OR X.action = "ADD_BATCH"
END FUNCTION
```

```pascal
// Property: Fix Checking - Advanced Configuration Modal
FOR ALL X WHERE isBugCondition(X) DO
  modal ← openBatchModal(X)
  ASSERT modal.hasField("name")
  ASSERT modal.hasField("schedule")
  ASSERT modal.hasField("assignedCoachId") AND modal.coachDropdown.isPopulated = true
  ASSERT modal.coachDropdown.includesRole("HEAD_COACH") = true
  ASSERT modal.coachDropdown.includesRole("ASSISTANT_COACH") = true
  ASSERT modal.hasField("capacity")
  ASSERT modal.hasField("skillLevel")
  ASSERT modal.hasField("monthlyFee")
  ASSERT modal.hasField("daysOfWeek")
  ASSERT modal.hasField("startTime")
  ASSERT modal.hasField("endTime")
  ASSERT modal.hasField("description")
  IF X.action = "EDIT_BATCH" THEN
    ASSERT modal.fields.prePopulated = true
    ASSERT modal.coachDropdown.selectedValue = X.batch.assignedCoachId
  END IF
END FOR
```

```pascal
// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT F(X) = F'(X)
END FOR
```
