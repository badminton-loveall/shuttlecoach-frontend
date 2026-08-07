# Implementation Plan: Multi-Center Admin System

## Overview

This plan implements multi-tenancy for the ShuttleCoach platform by adding a `centers` table, extending auth with an ADMIN role, injecting tenant-scoping middleware, building admin API routes, creating the frontend admin interface, and migrating existing data to a default center. Tasks are ordered so each step builds on the previous, with no orphaned code.

## Tasks

- [x] 1. Database migration and schema changes
  - [x] 1.1 Create the database migration SQL file
    - Create `src/migrations/add-multi-center.sql` with all schema changes in a single transaction
    - Create `centers` table with all columns (id, name, location, contact_phone, contact_email, logo_url, is_active, head_coach_id, plan_type, subscription_expires_at, created_at, updated_at)
    - Add `center_id` UUID FK column to all 12 tenant-scoped tables (users, batches, students, skill_assessments, fee_records, curriculum_plans, training_logs, attendance, leave_requests, session_schedules, session_notes, drills)
    - Insert default center, backfill all existing rows, set NOT NULL constraints (except users.center_id which stays nullable for ADMIN)
    - Add ADMIN to user_role enum
    - Add indexes on center_id for all tenant tables
    - Include post-migration verification checks
    - _Requirements: 2.1, 4.1, 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 1.2 Create a migration runner utility
    - Create `src/scripts/run-migration.ts` that connects to DB and executes the migration SQL within a transaction
    - Log progress and verify zero NULL center_id rows post-migration
    - _Requirements: 5.4, 5.5_

- [x] 2. Backend types and auth extension
  - [x] 2.1 Extend backend types with ADMIN role and Center interface
    - Update `src/types/index.ts` to add ADMIN to UserRole
    - Add `Center` interface with all fields from design
    - Update `AuthRequest` interface to include optional `centerId`
    - _Requirements: 1.1, 2.1_

  - [x] 2.2 Update JWT token generation and verification
    - Modify `src/utils/auth.ts` to include `centerId` in token payload for non-ADMIN users
    - Ensure ADMIN tokens omit `centerId`
    - Update `verifyToken` to return `centerId` when present
    - _Requirements: 1.2, 1.3_

  - [ ]* 2.3 Write property test for JWT payload correctness
    - **Property 1: JWT payload reflects role-based center scoping**
    - Use fast-check to generate arbitrary users with various roles and center_ids
    - Verify ADMIN tokens never contain centerId, non-ADMIN tokens always contain centerId matching DB
    - **Validates: Requirements 1.2, 1.3**

  - [x] 2.4 Update login handler to check center active status
    - Modify `src/controllers/auth.ts` login to query center status for non-ADMIN users
    - Return 403 with "Center is currently inactive" if center is inactive or subscription expired
    - _Requirements: 6.1, 6.2, 6.5_

- [x] 3. Checkpoint - Ensure auth changes compile and tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Tenant scoping middleware
  - [x] 4.1 Create tenantScope middleware
    - Create `src/middleware/tenantScope.ts`
    - For non-ADMIN: extract centerId from JWT, attach to `req.tenantCenterId`, reject with 403 if missing
    - For ADMIN: optionally read `center_id` query param, set `req.tenantCenterId` accordingly
    - Export `TenantRequest` interface extending `AuthRequest`
    - _Requirements: 4.2, 4.3, 4.4, 8.1, 8.2, 8.3, 8.4_

  - [ ]* 4.2 Write property test for tenant scoping middleware
    - **Property 2: Tenant scoping middleware injects center_id for non-ADMIN users**
    - **Property 3: ADMIN users receive unscoped or optionally-scoped access**
    - Generate arbitrary role/centerId combinations, verify middleware behavior
    - **Validates: Requirements 4.2, 4.3, 8.2, 1.4, 4.4, 8.3, 8.4**

  - [x] 4.3 Create centerActiveCheck middleware
    - Create `src/middleware/centerActive.ts`
    - Skip for ADMIN users
    - Query centers table to verify is_active and subscription_expires_at
    - Reject with 403 "Center is currently inactive" if inactive or expired
    - _Requirements: 6.1, 6.2, 6.3, 6.5_

  - [x] 4.4 Wire tenantScope and centerActiveCheck into existing routes
    - Update `src/routes/index.ts` to apply `tenantScope` middleware after `authenticate` on all existing resource routes (students, batches, fees, curriculum, training-logs, coaches, drills, attendance, leave-requests, session-schedules, session-notes, assessments, skill-scores, analytics)
    - Apply `centerActiveCheck` after authenticate for non-admin routes
    - _Requirements: 8.1, 8.5, 10.2_

  - [x] 4.5 Write property test for cross-center access rejection
    - **Property 4: Cross-center resource access is rejected**
    - Generate requests where user's centerId differs from resource centerId
    - Verify 403 response in all cases
    - **Validates: Requirements 4.5**

- [x] 5. Checkpoint - Ensure middleware integration compiles and tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Admin API routes and controllers
  - [x] 6.1 Create admin routes and center CRUD controller
    - Create `src/routes/admin.ts` with routes: GET /centers, POST /centers, PATCH /centers/:id, GET /centers/:id/stats
    - Create `src/controllers/admin/centers.ts` with handlers for list, create, update, stats
    - Apply `authorize('ADMIN')` on all admin routes
    - Enforce center name uniqueness (return 409 on duplicate)
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

  - [ ]* 6.2 Write property tests for center CRUD
    - **Property 5: Non-ADMIN users cannot perform center CRUD operations**
    - **Property 6: Center creation returns a valid record**
    - **Property 7: Center update modifies only specified fields**
    - **Property 8: Center name uniqueness is enforced**
    - **Validates: Requirements 2.4, 2.2, 2.3, 2.5**

  - [x] 6.3 Implement head coach assignment endpoint
    - Create `src/controllers/admin/coachAssignment.ts`
    - POST `/api/admin/centers/:id/assign-coach` — validate coach not already assigned to another active center, update both centers.head_coach_id and users.center_id
    - POST `/api/admin/centers/:id/unassign-coach` — clear head_coach_id and user's center_id
    - _Requirements: 3.1, 3.2, 3.4_

  - [ ]* 6.4 Write property test for head coach assignment
    - **Property 9: Head coach assignment maintains consistency**
    - Generate assignment/reassignment/conflict scenarios
    - Verify both tables updated atomically and conflicts rejected
    - **Validates: Requirements 3.1, 3.2, 3.4**

  - [x] 6.5 Implement center activation/deactivation endpoint
    - POST `/api/admin/centers/:id/activate` — toggle is_active, update subscription fields
    - _Requirements: 6.1, 6.3_

  - [ ]* 6.6 Write property test for inactive center login blocking
    - **Property 10: Inactive or expired center blocks non-ADMIN login**
    - Generate active/inactive/expired center states and various user roles
    - Verify login behavior matches requirements
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.5**

  - [x] 6.7 Implement admin dashboard aggregate endpoint
    - Create `src/controllers/admin/dashboard.ts`
    - GET `/api/admin/dashboard` — return total active centers, total students, total coaches, total revenue, plus per-center breakdowns
    - Use database-level aggregation grouped by center_id
    - _Requirements: 7.1, 7.2, 7.4_

  - [ ]* 6.8 Write property test for dashboard aggregation consistency
    - **Property 11: Dashboard aggregate totals equal sum of per-center values**
    - Generate multi-center datasets, verify sum consistency
    - **Validates: Requirements 7.1, 7.2**

  - [x] 6.9 Register admin routes in the main router
    - Update `src/routes/index.ts` to mount admin routes under `/admin` prefix with authenticate + authorize('ADMIN')
    - _Requirements: 8.1, 9.4_

  - [ ]* 6.10 Write property test for admin route access control
    - **Property 12: Admin routes reject non-ADMIN access**
    - Generate requests with non-ADMIN roles to admin endpoints
    - Verify 403 in all cases
    - **Validates: Requirements 9.4, 9.5**

- [x] 7. Checkpoint - Ensure all API changes compile and tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Update existing controllers to use tenant scoping
  - [x] 8.1 Update student and batch controllers to use req.tenantCenterId
    - Add `WHERE center_id = req.tenantCenterId` to all queries in students and batches controllers
    - Include center_id in INSERT statements for new records
    - _Requirements: 4.2, 4.3, 10.1_

  - [x] 8.2 Update fee, curriculum, and training-log controllers
    - Add center_id filtering to fee_records, curriculum_plans, training_logs queries
    - Include center_id in INSERT statements
    - _Requirements: 4.2, 4.3, 10.1_

  - [x] 8.3 Update remaining controllers (attendance, leave-requests, session-schedules, session-notes, drills, coaches, analytics)
    - Add center_id filtering and insertion to all remaining tenant-scoped controllers
    - _Requirements: 4.2, 4.3, 10.1, 10.4_

- [x] 9. Frontend types and auth context updates
  - [x] 9.1 Extend frontend types with ADMIN role and Center type
    - Update `src/types/index.ts` to add `'ADMIN'` to `UserRole` union
    - Add `Center` interface
    - Add `centerId` to `AuthContext`
    - _Requirements: 1.1, 9.1_

  - [x] 9.2 Update AuthContext to decode centerId from JWT
    - Modify `src/contexts/AuthContext.tsx` to extract and store `centerId` from token
    - On login, redirect ADMIN to `/admin/dashboard`
    - _Requirements: 1.2, 1.3, 9.1_

- [x] 10. Frontend admin pages and routing
  - [x] 10.1 Create AdminLayout component
    - Create `src/layouts/AdminLayout.tsx` with sidebar navigation (Dashboard, Centers, Settings)
    - Style consistently with existing coach layout
    - _Requirements: 9.2_

  - [x] 10.2 Create AdminDashboardPage
    - Create `src/pages/admin/AdminDashboardPage.tsx`
    - Fetch and display aggregate stats (total centers, students, coaches, revenue)
    - Show per-center summary cards
    - Center click navigates to detail view
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 10.3 Create CentersListPage
    - Create `src/pages/admin/CentersListPage.tsx`
    - List all centers with status badges (active/inactive), head coach assignment
    - Display "unassigned" label for centers without a head coach
    - Include "Create Center" button
    - _Requirements: 3.3, 9.3_

  - [x] 10.4 Create CreateCenterPage and CenterDetailPage
    - Create `src/pages/admin/CreateCenterPage.tsx` with form for center creation
    - Create `src/pages/admin/CenterDetailPage.tsx` showing center stats, coach assignment, activation toggle
    - _Requirements: 2.2, 2.3, 7.3_

  - [x] 10.5 Add admin routes to App.tsx
    - Add `/admin/dashboard`, `/admin/centers`, `/admin/centers/new`, `/admin/centers/:id` routes
    - Wrap all admin routes with `<ProtectedRoute allowedRoles={['ADMIN']}>`
    - Ensure non-ADMIN access redirects to `/access-denied`
    - _Requirements: 9.1, 9.4, 9.5_

- [x] 11. Backward compatibility verification
  - [x] 11.1 Verify existing route paths and role restrictions are unchanged
    - Review all existing routes in App.tsx remain at same paths with same role restrictions
    - Confirm tenantScope middleware is transparent (attaches centerId without changing controller interfaces)
    - _Requirements: 10.2, 10.3_

  - [ ]* 11.2 Write integration tests for backward compatibility
    - Test HEAD_COACH login scopes data to assigned center
    - Test existing route paths respond correctly
    - Test no additional user action required after migration
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document using fast-check
- Unit tests validate specific examples and edge cases
- The migration (task 1.1) must run as a single atomic transaction
- `users.center_id` stays nullable because ADMIN users are platform-wide
- Existing route paths and controller interfaces remain unchanged for backward compatibility (Requirement 10)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.4"] },
    { "id": 3, "tasks": ["2.3", "4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3"] },
    { "id": 5, "tasks": ["4.4", "4.5"] },
    { "id": 6, "tasks": ["6.1", "6.3", "6.5", "6.7"] },
    { "id": 7, "tasks": ["6.2", "6.4", "6.6", "6.8", "6.9"] },
    { "id": 8, "tasks": ["6.10", "8.1", "9.1"] },
    { "id": 9, "tasks": ["8.2", "8.3", "9.2"] },
    { "id": 10, "tasks": ["10.1"] },
    { "id": 11, "tasks": ["10.2", "10.3"] },
    { "id": 12, "tasks": ["10.4", "10.5"] },
    { "id": 13, "tasks": ["11.1", "11.2"] }
  ]
}
```
