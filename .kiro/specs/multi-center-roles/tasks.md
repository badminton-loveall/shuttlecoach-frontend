# Implementation Plan: Multi-Center Roles

## Overview

This plan implements the multi-center membership system across backend (Express API) and frontend (React SPA). The approach follows a bottom-up strategy: database migration first, then backend API/middleware changes, then frontend context/component updates, and finally admin panel enhancements. Each task builds incrementally on the previous ones so there is no orphaned code.

## Tasks

- [x] 1. Database migration and new tables
  - [x] 1.1 Create migration file for `user_center_memberships` and `slug_change_requests` tables
    - Create migration SQL file at `src/migrations/` in the API project
    - Create `user_center_memberships` table with columns: id (UUID PK), user_id (FK), center_id (FK), role (VARCHAR CHECK), can_access_fees (BOOLEAN), created_at (TIMESTAMP)
    - Add UNIQUE constraint on (user_id, center_id, role)
    - Add indexes: idx_ucm_user_id, idx_ucm_center_id, idx_ucm_user_center
    - Create trigger to enforce max 20 memberships per user
    - Create `slug_change_requests` table with columns: id (UUID PK), center_id (FK), requested_slug (VARCHAR), status (CHECK PENDING/APPROVED/REJECTED), requested_by (FK), reviewed_by (FK nullable), reviewed_at (TIMESTAMP nullable), created_at (TIMESTAMP)
    - Add indexes: idx_scr_center_status, idx_scr_status
    - Populate `user_center_memberships` from existing `users` table (non-ADMIN users with non-null center_id)
    - Make `users.center_id` nullable (ALTER COLUMN DROP NOT NULL)
    - Wrap in transaction (BEGIN/COMMIT)
    - _Requirements: 1.1, 1.2, 1.4, 6.5_

  - [x] 1.2 Create TypeScript migration runner script
    - Add a `run-migration.ts` script that reads and executes the SQL migration file against the database
    - Ensure idempotent execution (check if tables already exist before creating)
    - _Requirements: 1.1_

- [x] 2. Backend types and membership service
  - [x] 2.1 Add TypeScript types for memberships and slug change requests
    - Add `UserCenterMembership` interface to `src/types/index.ts` in the API project
    - Add `SlugChangeRequest` interface to `src/types/index.ts`
    - Add `LoginResponseMultiCenter` interface
    - Add `CenterMembership` type for the login response membership array items
    - _Requirements: 1.1, 6.5, 7.4_

  - [x] 2.2 Implement membership service (`src/services/membershipService.ts`)
    - `getMembershipsByUserId(userId)`: query all memberships for a user joined with centers table (returns centerId, centerName, role, canAccessFees)
    - `getMembership(userId, centerId)`: query single membership record
    - `createMembership(userId, centerId, role, canAccessFees)`: insert with duplicate/limit error handling
    - `removeMembership(userId, centerId, role)`: delete membership record
    - `validateMembership(userId, centerId)`: check if user has any membership at center
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_

  - [x]* 2.3 Write property tests for membership service
    - **Property 1: Membership creation round-trip** — create a membership then query it back; verify user_id, center_id, role match
    - **Property 2: Duplicate membership rejection** — creating same (user, center, role) twice returns duplicate error
    - **Property 3: Membership capacity limit** — creating 21st membership for a user is rejected
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

- [x] 3. Backend auth flow updates
  - [x] 3.1 Update auth controller login to return memberships
    - Modify `src/controllers/auth.ts` login handler
    - After password verification, query `user_center_memberships` joined with `centers` for the user
    - If `centerSlug` provided: find matching membership, reject 403 if not found
    - If no slug: select membership with earliest `created_at` as active
    - Verify active center is active and not expired
    - Issue JWT with `{ id, username, centerId: activeCenterId, role: activeRole }`
    - Return `LoginResponseMultiCenter` shape: token, user, memberships array, activeCenterId, activeRole
    - Handle single-center users (same logic, just one membership)
    - _Requirements: 1.5, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x]* 3.2 Write property tests for login membership resolution
    - **Property 4: Login defaults to earliest membership** — user with N memberships logging in without slug gets earliest-created as active
    - **Property 17: Branded login membership resolution** — login with slug succeeds iff user has membership at that center's slug
    - **Property 18: Login response includes all memberships** — response contains exactly N entries matching membership records
    - **Property 19: JWT token contains active center and role** — decoded JWT has centerId, role, ~24h expiration
    - **Validates: Requirements 1.5, 7.1, 7.2, 7.3, 7.4, 7.5**

  - [x] 3.3 Update auth middleware to read `X-Center-Id` header
    - Modify `src/middleware/auth.ts`
    - After JWT decode, read `X-Center-Id` from request headers
    - If header present and differs from JWT centerId: validate membership exists via `membershipService.validateMembership`
    - On valid: overwrite `req.user.role` with membership role, set `req.user.centerId` to header value
    - On invalid: respond 403 "You do not have a membership at this center"
    - If header absent: fall back to JWT centerId
    - Extend `AuthRequest` interface with `jwtCenterId` field
    - _Requirements: 3.1, 3.3_

  - [x]* 3.4 Write property tests for middleware center validation
    - **Property 5: Membership removal revokes access** — after removing membership, API request with that center returns 403
    - **Property 7: Role resolution from membership** — resolving role for (user, center) returns exactly the stored membership role
    - **Property 9: API request center scoping** — request with X-Center-Id header scopes to that center
    - **Validates: Requirements 1.6, 2.3, 3.1, 3.3**

- [x] 4. Backend membership and slug change request endpoints
  - [x] 4.1 Create memberships route (`src/routes/memberships.ts`)
    - GET `/api/memberships/me` — returns current user's memberships array (uses `membershipService.getMembershipsByUserId`)
    - Register route in `src/routes/index.ts`
    - Protect with auth middleware
    - _Requirements: 1.1, 7.4_

  - [x] 4.2 Implement slug validation utility (`src/utils/slugValidation.ts`)
    - `validateSlug(slug: string)`: returns `{ valid: boolean; error?: string }`
    - Rules: 3–50 chars, lowercase alphanumeric + hyphens, starts/ends alphanumeric, no consecutive hyphens
    - _Requirements: 4.2, 6.2_

  - [x]* 4.3 Write property test for slug validation
    - **Property 11: Slug format validation** — validateSlug returns true iff string matches all format rules
    - **Validates: Requirements 4.2, 6.2**

  - [x] 4.4 Implement slug change request service (`src/services/slugChangeRequestService.ts`)
    - `createRequest(centerId, requestedSlug, requestedBy)`: validate slug format, check slug not in use, check no pending request for center, insert record
    - `getPendingRequests()`: query all requests with status PENDING joined with center name
    - `getPendingCount()`: count of PENDING requests
    - `approveRequest(requestId, reviewedBy)`: verify slug still available, update center slug, mark APPROVED
    - `rejectRequest(requestId, reviewedBy)`: mark REJECTED, leave center slug unchanged
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.7, 6.8, 6.9_

  - [x]* 4.5 Write property tests for slug change request service
    - **Property 12: Pending request prevents new submission** — center with PENDING request rejects new request
    - **Property 13: Slug change request creation** — valid request creates record with status PENDING
    - **Property 14: Slug change request approval** — approving updates center slug and sets status APPROVED
    - **Property 15: Slug change request rejection** — rejecting sets status REJECTED, slug unchanged
    - **Property 16: Pending request count matches badge** — count endpoint equals actual PENDING records
    - **Validates: Requirements 6.4, 6.5, 6.7, 6.9, 6.6**

  - [x] 4.6 Create slug change request routes (`src/routes/slugChangeRequests.ts`)
    - POST `/api/slug-change-requests` — HEAD_COACH submits request (auth + role check)
    - GET `/api/admin/slug-change-requests` — ADMIN lists pending requests
    - GET `/api/admin/slug-change-requests/count` — ADMIN gets pending count
    - PATCH `/api/admin/slug-change-requests/:id` — ADMIN approves/rejects (body: { action: 'approve' | 'reject' })
    - Register routes in `src/routes/index.ts`
    - _Requirements: 6.1, 6.5, 6.6, 6.7, 6.9_

  - [x] 4.7 Add admin invite and password reset endpoints
    - POST `/api/admin/centers/:id/invite-coach` — send invite email to head coach's email
    - POST `/api/admin/centers/:id/reset-coach-password` — generate reset token and send email
    - Validate head coach exists and has email; return 422 if not
    - Add to existing admin routes
    - _Requirements: 5.2, 5.3, 5.4, 5.5_

- [x] 5. Checkpoint - Backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Frontend AuthContext and apiClient updates
  - [x] 6.1 Update AuthContext to support multi-center memberships
    - Modify `src/contexts/AuthContext.tsx`
    - Add state: `memberships: CenterMembership[]`, `activeCenterId: string | null`, `activeRole: UserRole | null`, `canAccessFees: boolean`
    - Update `login()` to parse `LoginResponseMultiCenter` response — store memberships, set activeCenterId and activeRole
    - Implement `switchCenter(centerId)`: find membership, update state, persist to localStorage key `active_center_id`
    - Session restore: on mount read `active_center_id` from localStorage, validate against memberships, fallback to first
    - Expose `memberships`, `activeCenterId`, `activeRole`, `canAccessFees`, `switchCenter` in context value
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.7, 3.1, 3.5_

  - [x]* 6.2 Write property tests for AuthContext center switching logic
    - **Property 8: Center persistence and localStorage fallback** — valid stored center is used; invalid falls back to first membership
    - **Property 6: Active center fallback on removal** — removing active center selects next earliest
    - **Validates: Requirements 2.5, 2.7, 1.7**

  - [x] 6.3 Update apiClient to include `X-Center-Id` header
    - Modify `src/services/apiClient.ts` (or equivalent)
    - Add request interceptor: read `active_center_id` from localStorage, set `X-Center-Id` header
    - _Requirements: 3.3_

  - [x] 6.4 Add frontend TypeScript types for memberships and slug requests
    - Add `CenterMembership` interface to frontend `src/types/index.ts`
    - Add `SlugChangeRequest` interface
    - _Requirements: 1.1, 6.5_

- [x] 7. CenterSwitcher component and integration
  - [x] 7.1 Create CenterSwitcher component (`src/components/CenterSwitcher.tsx`)
    - Uses `useAuth()` to access `memberships`, `activeCenterId`, `switchCenter`
    - If single membership: render center name as plain text (no dropdown)
    - If multiple memberships: render dropdown with center names, active center highlighted
    - On selection: call `switchCenter(centerId)`
    - Handle network error: show toast notification, retain previous center
    - Style consistent with existing header components
    - _Requirements: 2.1, 2.2, 2.4, 2.6_

  - [x] 7.2 Integrate CenterSwitcher into TopNav/header layout
    - Place CenterSwitcher left of user avatar in existing header component
    - Conditionally render only for non-ADMIN authenticated users
    - _Requirements: 2.1_

  - [x] 7.3 Update ProtectedRoute and navigation for center-aware role resolution
    - Ensure `ProtectedRoute` reads `activeRole` from AuthContext (not legacy `role`)
    - When center changes, re-evaluate route access; redirect to Access Denied or default route if current route not permitted
    - Update sidebar/nav items to show/hide based on `activeRole`
    - _Requirements: 3.2, 3.4, 3.6_

  - [x]* 7.4 Write property test for route guard enforcement
    - **Property 10: Route guard enforcement per role** — for any role, navigating to a non-permitted route redirects to Access Denied
    - **Validates: Requirements 3.2, 3.4**

- [x] 8. Checkpoint - Frontend core complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Admin panel — slug edit and head coach actions
  - [x] 9.1 Update CenterDetailPage with editable slug field
    - Add slug field to Center Information section on `src/pages/admin/CenterDetailPage.tsx`
    - Editable for ADMIN role; read-only otherwise
    - On save: validate slug format client-side, call existing center update endpoint with new slug
    - Handle 409 (slug taken): show inline error, retain value
    - Handle format validation failure: show format requirements inline
    - Show success confirmation on save
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 9.2 Add head coach email display and invite/reset buttons to CenterDetailPage
    - Display head coach email (not user ID) in the Head Coach section
    - Add "Send Invite" button: calls POST `/api/admin/centers/:id/invite-coach`
    - Add "Send Password Reset" button: calls POST `/api/admin/centers/:id/reset-coach-password`
    - Disable both buttons when no head coach assigned
    - Show warning when head coach has no email on file
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 10. Admin panel — slug change requests page
  - [x] 10.1 Create SlugChangeRequestsPage (`src/pages/admin/SlugChangeRequestsPage.tsx`)
    - Fetch pending requests from GET `/api/admin/slug-change-requests`
    - Display list with: center name, requested slug, requested by, submission date
    - Each row has "Approve" and "Reject" buttons
    - Approve: call PATCH with `{ action: 'approve' }`, handle 409 conflict
    - Reject: call PATCH with `{ action: 'reject' }`
    - Refresh list after action
    - _Requirements: 6.6, 6.7, 6.8, 6.9_

  - [x] 10.2 Add slug requests navigation with badge to admin layout
    - Add "Slug Requests" item to admin sidebar/navigation
    - Fetch pending count from GET `/api/admin/slug-change-requests/count`
    - Display badge with count when count > 0
    - Add route in App.tsx: `/admin/slug-requests` → `SlugChangeRequestsPage`
    - _Requirements: 6.6_

- [x] 11. Center admin settings — slug change request flow
  - [x] 11.1 Add slug display and "Request Change" to center settings page
    - On `MasterDataPage` (or dedicated center settings section): show current slug as read-only
    - Add "Request Change" button
    - On click: show modal/inline form for entering new slug value
    - Validate format client-side before submission
    - Submit via POST `/api/slug-change-requests`
    - Handle errors: 409 (pending exists, slug taken), 400 (format invalid)
    - Disable "Request Change" if a pending request already exists (check on page load)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 12. Final checkpoint - Full integration verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document using fast-check
- Unit tests validate specific examples and edge cases
- Backend project path: `/Users/midhunvmanikkath/Documents/PROJECTS/LOVEALL/API/shuttlecoach-api/`
- Frontend project path: `/Users/midhunvmanikkath/Documents/PROJECTS/LOVEALL/APP/shuttlecoach/`
- The migration does NOT drop `users.center_id` or `users.role` — a follow-up migration handles that after full rollout

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "4.2", "6.4"] },
    { "id": 3, "tasks": ["2.3", "3.1", "4.3"] },
    { "id": 4, "tasks": ["3.2", "3.3", "4.4"] },
    { "id": 5, "tasks": ["3.4", "4.1", "4.5", "4.6", "4.7"] },
    { "id": 6, "tasks": ["6.1", "6.3"] },
    { "id": 7, "tasks": ["6.2", "7.1", "7.3"] },
    { "id": 8, "tasks": ["7.2", "7.4"] },
    { "id": 9, "tasks": ["9.1", "9.2"] },
    { "id": 10, "tasks": ["10.1", "10.2"] },
    { "id": 11, "tasks": ["11.1"] }
  ]
}
```
