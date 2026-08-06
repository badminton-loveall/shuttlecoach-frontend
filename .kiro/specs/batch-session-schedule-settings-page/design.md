# Design Document

## Overview

This feature introduces a single new page component (`BatchSchedulePage`) that wires together existing hooks and components to provide a batch session schedule configuration interface for the Head Coach. No new API endpoints, shared components, or state management patterns are needed — it is purely a composition page.

## Architecture

**Architecture Pattern:** Page-level composition — the page acts as a thin orchestration layer connecting a batch selector dropdown, the existing `ScheduleBuilder` component, and session schedule CRUD hooks.

```
┌─────────────────────────────────────────────────┐
│ App.tsx (Route: /batch-schedule)                │
│  └─ ProtectedRoute [HEAD_COACH]                 │
│      └─ BatchSchedulePage                       │
│          ├─ DashboardLayout                     │
│          │   ├─ Page Heading                    │
│          │   ├─ Batch Selector Dropdown         │
│          │   └─ ScheduleBuilder                 │
│          ├─ useBatches()                        │
│          ├─ useSessionSchedule(batchId)         │
│          ├─ useCreateSessionSchedule()          │
│          └─ useToast()                          │
└─────────────────────────────────────────────────┘
```

## Components and Interfaces

### BatchSchedulePage (`src/pages/BatchSchedulePage.tsx`)

A single page component responsible for:
1. Rendering the batch selector dropdown
2. Loading the schedule for the selected batch
3. Passing schedule data to the ScheduleBuilder
4. Handling the save workflow with toast notifications

**State:**
- `selectedBatchId: string | undefined` — currently selected batch ID from the dropdown

**Derived data (from hooks):**
- Batch list from `useBatches()`
- Schedule data from `useSessionSchedule(selectedBatchId)`
- Save mutation from `useCreateSessionSchedule()`

## Hook Usage Interfaces

```typescript
// From useBatches()
const { batches, loading: batchesLoading, error: batchesError } = useBatches();

// From useSessionSchedule(batchId)
const { schedule, loading: scheduleLoading, error: scheduleError, refetch } = useSessionSchedule(selectedBatchId);

// From useCreateSessionSchedule()
const { createSchedule, loading: saving } = useCreateSessionSchedule();

// From useToast()
const { showToast } = useToast();
```

### Save Handler Signature

```typescript
const handleSave = async (slots: SessionSlot[], recurrence: RecurrencePattern): Promise<void> => {
  if (!selectedBatchId) return;
  try {
    await createSchedule({ batchId: selectedBatchId, slots, recurrence });
    showToast({ message: 'Schedule saved successfully', type: 'success' });
    refetch();
  } catch {
    showToast({ message: 'Failed to save schedule. Please try again.', type: 'error' });
  }
};
```

## Data Models

All data models are existing and unchanged:

```typescript
interface Batch {
  id: string;
  name: string;
  level: string;
  createdAt: Date;
}

interface SessionSlot {
  dayOfWeek: DayOfWeek;
  startTime: string; // "HH:MM" 24-hour format
  endTime: string;   // "HH:MM" 24-hour format
}

interface RecurrencePattern {
  repeatEvery: number;
  repeatUnit: 'week';
  repeatDays: DayOfWeek[];
  endType: EndType;
  endDate?: string;
  occurrenceCount?: number;
}

interface SessionSchedule {
  id: string;
  batchId: string;
  slots: SessionSlot[];
  recurrence: RecurrencePattern;
  cycleStartDate?: string;
  createdAt: string;
}
```

## Component Integration

### ScheduleBuilder Props Mapping

```typescript
<ScheduleBuilder
  key={selectedBatchId}                         // Forces remount on batch change
  initialSlots={schedule?.slots ?? []}
  initialRecurrence={schedule?.recurrence}
  onSave={handleSave}
  readOnly={false}
  isSaving={saving}
/>
```

The `key` prop set to `selectedBatchId` ensures the ScheduleBuilder fully resets its internal state when the user switches batches. This is the idiomatic React pattern for resetting uncontrolled component state.

### Route Registration in App.tsx

```typescript
import BatchSchedulePage from './pages/BatchSchedulePage';

// Inside <Routes>
<Route
  path="/batch-schedule"
  element={
    <ProtectedRoute allowedRoles={['HEAD_COACH']}>
      <BatchSchedulePage />
    </ProtectedRoute>
  }
/>
```

## Error Handling

| Scenario | Behavior |
|----------|----------|
| `useBatches` returns error | Display inline error message; hide dropdown |
| `useSessionSchedule` returns error | Display inline error message in schedule area |
| `useCreateSessionSchedule` throws | Show error toast: "Failed to save schedule. Please try again." |
| No batch selected | Show instructional prompt; hide ScheduleBuilder |
| Schedule hook returns null/empty | Render ScheduleBuilder with empty initial state |

## Page Layout Structure

```typescript
<DashboardLayout>
  <div className="page-container">
    <div className="section-stack">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-header-title">Session Schedule</h1>
        <p className="page-header-subtitle">Configure training days and times for each batch</p>
      </div>

      {/* Batch Selector */}
      <div className="card">
        <select ...>{/* batch options */}</select>
      </div>

      {/* Schedule Builder Area */}
      <div className="card">
        {/* Loading / Error / ScheduleBuilder */}
      </div>
    </div>
  </div>
</DashboardLayout>
```

## Testing Strategy

- **Unit tests (example-based):** Verify rendering states (loading, error, empty selection), toast messages on save success/failure, and redirect behavior for unauthorized users.
- **Property tests:** Verify that batch dropdown completeness, save payload construction, and schedule data flow hold across arbitrary inputs.
- **Framework:** Vitest + Testing Library (existing project setup).
- **Test file:** `src/pages/BatchSchedulePage.test.tsx` (colocated per project convention).

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Batch dropdown completeness

*For any* array of batches returned by the `useBatches` hook, every batch in the array SHALL appear as a selectable option in the Batch Selector dropdown.

**Validates: Requirements 3.1**

### Property 2: Schedule hook receives selected batch ID

*For any* batch selected from the dropdown, the `useSessionSchedule` hook SHALL be invoked with that exact batch ID as its argument.

**Validates: Requirements 4.1**

### Property 3: Schedule data flows to ScheduleBuilder

*For any* schedule data returned by `useSessionSchedule`, the ScheduleBuilder component SHALL receive `schedule.slots` as `initialSlots` and `schedule.recurrence` as `initialRecurrence`.

**Validates: Requirements 4.3**

### Property 4: Save payload correctness

*For any* selected batch ID, slots array, and recurrence pattern produced by the ScheduleBuilder, triggering save SHALL invoke `createSchedule` with an object containing that exact `batchId`, `slots`, and `recurrence`.

**Validates: Requirements 5.1**

### Property 5: Batch switch resets ScheduleBuilder state

*For any* two distinct batches with different schedules, switching the batch selection SHALL cause the ScheduleBuilder to re-render with the newly selected batch's schedule data (or empty state if no schedule exists).

**Validates: Requirements 6.3**
