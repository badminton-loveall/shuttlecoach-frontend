# Implementation Plan: Batch Name Display Fix

## Overview

Replace raw batch ID fragment display (`batchId.split('-')[1]`) with resolved human-readable batch names across four screens. The implementation follows dependency order: shared hook first, then component modifications one at a time.

## Tasks

- [x] 1. Create the useBatches hook
  - [x] 1.1 Create `src/hooks/useBatches.ts` implementing the `UseBatchesReturn` interface
    - Fetch from `GET /batches` using existing `apiClient`
    - Build `Map<string, string>` from batch ID to batch name
    - Expose `getBatchName(batchId)` that returns batch name or "Unknown batch"
    - Handle loading, error, and refetch states
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4_

  - [ ]* 1.2 Write property tests for useBatches hook
    - **Property 1: Batch Name Resolution Completeness**
    - **Property 2: Graceful Fallback for Missing Batches**
    - **Validates: Requirements 1.2, 2.1, 2.2, 2.3, 2.4**

- [x] 2. Update StudentCard component
  - [x] 2.1 Add `batchName` prop to StudentCard and render it instead of `batchId.split('-')[1]`
    - Add optional `batchName?: string` to props interface
    - Display `batchName` when provided, "Unknown batch" when batchId exists but no name, omit label when no batchId
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 2.2 Update Dashboard page to pass resolved `batchName` to each StudentCard
    - Import and call `useBatches()` in the Dashboard page
    - Pass `getBatchName(student.batchId)` as `batchName` prop to each StudentCard
    - _Requirements: 3.1_

- [x] 3. Update activityUtils for Recent Activity feed
  - [x] 3.1 Add `getBatchName` optional parameter to `generateActivityFeed`
    - Add optional parameter to function signature
    - Use it to resolve batch names in activity descriptions where batch context appears
    - Maintain backward compatibility when parameter is not provided
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 3.2 Update Dashboard to pass `getBatchName` to `generateActivityFeed`
    - Pass `getBatchName` from useBatches() hook when calling generateActivityFeed
    - _Requirements: 4.1, 4.3_

- [x] 4. Update StudentProfilePage
  - [x] 4.1 Replace batch ID fragment with resolved batch name in the Student Profile header
    - Import and call `useBatches()` hook
    - Replace `student.batchId.split('-')[1]` with `getBatchName(student.batchId)`
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 5. Update CurriculumBuilderPage batch dropdown
  - [x] 5.1 Replace local uniqueBatches construction with API-fetched batches list
    - Import and call `useBatches()` hook
    - Use `batches` array from the hook to populate dropdown options
    - Display `batch.name` as option label, `batch.id` as option value
    - Show loading state while batches are being fetched
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 5.2 Write property test for batch dropdown completeness
    - **Property 3: Batch Dropdown Completeness**
    - **Validates: Requirements 6.2, 6.3**

- [x] 6. Final checkpoint
  - Ensure all components render resolved batch names correctly
  - Ensure no remaining `batchId.split('-')[1]` patterns in modified files
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The existing `GET /batches` endpoint already returns all needed data — no API changes required
- The `useBatches` hook is the foundation — all subsequent tasks depend on task 1
- Backward compatibility is maintained in activityUtils by making the new parameter optional
