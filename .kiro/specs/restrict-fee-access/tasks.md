# Implementation Plan: Restrict Fee Access

## Overview

Implement a per-user fee access permission system controlled by the HEAD_COACH. The feature spans a database migration, API middleware, a toggle endpoint, frontend auth context changes, route protection, navigation visibility, and a toggle UI component. Implementation proceeds backend-first (DB → middleware → endpoints) then frontend (context → routes → UI).

## Tasks

- [x] 1. Database migration and backend types
  - [x] 1.1 Create database migration to add `can_access_fees` column
    - Run SQL: `ALTER TABLE users ADD COLUMN can_access_fees BOOLEAN NOT NULL DEFAULT false`
    - Create optional index: `CREATE INDEX idx_users_can_access_fees ON users (id, can_access_fees) WHERE role = 'ASSISTANT_COACH'`
    - Place migration in the project's migration directory or run directly via Supabase SQL editor
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 1.2 Update backend User type to include `canAccessFees`
    - Add `canAccessFees: boolean` to the User interface in the types file
    - Ensure the field is mapped from `can_access_fees` DB column using existing camelCase conventions
    - _Requirements: 1.1, 1.2_

- [x] 2. Implement `requireFeeAccess` middleware
  - [x] 2.1 Create `src/middleware/feeAccess.ts` with the `requireFeeAccess` middleware
    - Import `TenantRequest`, `UserRole`, and `query`
    - Allow ADMIN and HEAD_COACH unconditionally
    - Allow STUDENT unconditionally
    - For ASSISTANT_COACH: query `can_access_fees` from DB; return 403 if false or user not found
    - Return 500 with generic error message if DB query fails (log full error server-side)
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 6.1, 6.2, 6.3, 6.4_

  - [ ]* 2.2 Write property tests for `requireFeeAccess` middleware
    - **Property 1: Implicit fee access for privileged roles**
    - **Property 2: can_access_fees governs ASSISTANT_COACH access**
    - **Property 3: STUDENT fee access is independent of can_access_fees**
    - Use Vitest + fast-check, mock the DB query, generate random user objects with varying roles and `can_access_fees` values
    - Minimum 100 iterations per property
    - **Validates: Requirements 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 6.1, 6.2, 6.3, 6.4**

  - [x] 2.3 Apply `requireFeeAccess` middleware to fee routes
    - In `src/routes/fees.ts`, import `requireFeeAccess` from `../middleware/feeAccess`
    - Add `router.use(requireFeeAccess)` after `tenantScope` in the middleware chain
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 3. Checkpoint - Backend middleware verified
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement toggle endpoint and updated coaches list
  - [x] 4.1 Add `toggleFeeAccess` controller in `src/controllers/coaches.ts`
    - Accept `PATCH /api/coaches/:id/fee-access` with body `{ canAccessFees: boolean }`
    - Validate body is boolean (400 if not)
    - Verify target user exists (404 if not)
    - Verify target is in same center (403 if not)
    - Verify target is HEAD_COACH or ASSISTANT_COACH (400 if not)
    - Update `can_access_fees` in DB and return `{ id, canAccessFees }` with HTTP 200
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 4.2 Register the toggle route in `src/routes/coaches.ts`
    - Add `router.patch('/:id/fee-access', authorize(UserRole.HEAD_COACH), toggleFeeAccess)`
    - Ensure it uses existing `authenticate`, `centerActive`, `tenantScope` middleware
    - _Requirements: 4.5_

  - [x] 4.3 Update `listCoaches` to include HEAD_COACH and `canAccessFees` field
    - Modify the role filter in the SQL query to `u.role IN ('HEAD_COACH', 'ASSISTANT_COACH')`
    - Add `can_access_fees` to the SELECT clause
    - Map to `canAccessFees` in the response
    - Include `role` field in response items
    - _Requirements: 5.1, 5.2, 5.3, 10.1, 10.2_

  - [ ]* 4.4 Write property tests for toggle and coaches list
    - **Property 4: Same-center toggle succeeds**
    - **Property 5: Cross-center toggle is rejected**
    - **Property 6: Only HEAD_COACH can toggle fee access**
    - **Property 7: Coaches list returns all same-center coaches with required fields**
    - Use Vitest + fast-check, mock DB, generate random coach configurations across centers
    - Minimum 100 iterations per property
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.5, 5.1, 5.2, 5.3, 10.1, 10.2**

- [x] 5. Update login response to include `canAccessFees`
  - [x] 5.1 Modify login/auth endpoint to return `canAccessFees` in the user object
    - Include `can_access_fees` from the DB in the login response payload
    - For ADMIN/HEAD_COACH: can return `true` regardless of DB value, or return DB value (frontend handles logic)
    - _Requirements: 7.1, 7.3, 8.1_

- [x] 6. Checkpoint - Backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Frontend AuthContext and route protection
  - [x] 7.1 Update AuthContext to include `canAccessFees`
    - Add `canAccessFees: boolean` to the AuthContext interface
    - Derive value on login: `role === 'ADMIN' || role === 'HEAD_COACH' || !!loginResponse.canAccessFees`
    - Store in localStorage as `auth_can_access_fees` and restore on page reload
    - _Requirements: 7.1, 7.2, 7.3, 8.1, 8.2, 8.3_

  - [x] 7.2 Update ProtectedRoute to support `requireFeeAccess` prop
    - Add optional `requireFeeAccess?: boolean` prop to ProtectedRoute
    - When `requireFeeAccess` is true and user's `canAccessFees` is false, redirect to `/access-denied`
    - Apply `requireFeeAccess` to the `/fees` route definition
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 7.3 Update Sidebar navigation to conditionally render fees link
    - Use `canAccessFees` from `useAuth()` hook
    - Render fees NavLink only when `canAccessFees` is true
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 7.4 Write property test for `canAccessFees` permission utility
    - **Property 8: Fee access permission function correctness**
    - Generate random user objects with varying roles and `can_access_fees` flags
    - Verify: returns true if role is ADMIN, HEAD_COACH, or (ASSISTANT_COACH with can_access_fees === true); false otherwise
    - Use Vitest + fast-check, minimum 100 iterations
    - **Validates: Requirements 7.1, 7.2, 7.3, 8.1, 8.2, 8.3**

- [x] 8. Checkpoint - Frontend auth and routing verified
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Frontend FeeAccessToggle UI
  - [x] 9.1 Create `src/components/FeeAccessToggle.tsx` component
    - Render a toggle switch for each coach in the list
    - ASSISTANT_COACH: editable toggle
    - HEAD_COACH: disabled toggle shown as "always on"
    - On toggle: send `PATCH /api/coaches/:id/fee-access` with `{ canAccessFees: boolean }`
    - On API success: update local state to reflect new value
    - On API error: revert toggle to previous state, show toast error notification
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 10.3_

  - [x] 9.2 Integrate FeeAccessToggle into CoachesPage
    - Import and render FeeAccessToggle in the coaches list/table
    - Fetch coaches list using updated `GET /api/coaches` endpoint (which now includes `canAccessFees` and HEAD_COACH users)
    - Display role label for each coach
    - _Requirements: 9.4, 10.1, 10.2, 10.3_

  - [ ]* 9.3 Write unit tests for FeeAccessToggle component
    - Test toggle renders for each coach
    - Test toggle sends PATCH on click and updates state
    - Test toggle reverts on API error
    - Test HEAD_COACH toggle is disabled
    - _Requirements: 9.1, 9.2, 9.3, 10.3_

- [x] 10. Final checkpoint - All features integrated
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Backend implementation (tasks 1–6) should be completed before frontend (tasks 7–9) since the frontend depends on API responses
- The `requireFeeAccess` middleware evaluates permission at request time (no JWT caching), so toggles take effect immediately

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "5.1"] },
    { "id": 2, "tasks": ["2.1", "4.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "4.2", "4.3"] },
    { "id": 4, "tasks": ["4.4", "7.1"] },
    { "id": 5, "tasks": ["7.2", "7.3", "7.4"] },
    { "id": 6, "tasks": ["9.1"] },
    { "id": 7, "tasks": ["9.2", "9.3"] }
  ]
}
```
