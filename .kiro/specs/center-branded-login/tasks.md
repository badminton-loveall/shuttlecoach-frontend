# Implementation Plan: Center Branded Login

## Overview

Implements center-branded login pages for ShuttleCoach, adding a `slug` column to the `centers` table, a public center info API, center-scoped login validation, a branded frontend login page at `/login/:centerSlug`, and a HEAD_COACH slug management UI. The plan starts with the database migration and slug utility, builds the API layer (public endpoint + auth modification + admin update), then adds frontend components and routing.

## Tasks

- [x] 1. Database migration and slug utility
  - [x] 1.1 Create the slug utility module
    - Create `src/utils/slug.ts` in the API project
    - Export `generateSlug(name: string): string` — lowercase, replace non-alphanumeric with hyphens, collapse consecutive hyphens, trim hyphens from edges
    - Export `validateSlug(slug: string): { valid: boolean; error?: string }` — 3–50 chars, only `[a-z0-9-]`, must start/end with alphanumeric, no consecutive hyphens
    - _Requirements: 1.2, 1.3_

  - [ ]* 1.2 Write property test for slug validation (Property 1)
    - **Property 1: Slug validation correctly classifies inputs**
    - Generate random strings with `fast-check`, verify `validateSlug` returns `valid: true` iff string matches `^[a-z0-9]([a-z0-9-]*[a-z0-9])?$` with length 3–50 and no `--`
    - Test file: `src/utils/__tests__/slug.validation.property.test.ts`
    - **Validates: Requirements 1.2, 7.2**

  - [ ]* 1.3 Write property test for slug generation (Property 2)
    - **Property 2: Slug generation always produces a valid slug**
    - Generate random non-empty strings containing at least one alphanumeric character, verify `generateSlug(name)` always passes `validateSlug`
    - Test file: `src/utils/__tests__/slug.generation.property.test.ts`
    - **Validates: Requirements 1.3**

  - [x] 1.4 Create the database migration for slug column
    - Create a SQL migration file that adds `slug VARCHAR(100)` to the `centers` table
    - Backfill existing rows: `SET slug = generateSlug(name)` logic (use SQL REGEXP_REPLACE or a migration script)
    - Handle potential duplicates by appending numeric suffix
    - After backfill: `ALTER COLUMN slug SET NOT NULL`
    - Add `UNIQUE` constraint: `ADD CONSTRAINT centers_slug_unique UNIQUE (slug)`
    - Add `CHECK` constraint: `ADD CONSTRAINT centers_slug_format CHECK (slug ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$')`
    - Run migration against Supabase
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 2. Public center info API endpoint
  - [ ] 2.1 Create public centers controller
    - Create `src/controllers/public/centers.ts` in the API project
    - Implement `getCenterInfo` handler: query `SELECT name, logo_url, slug FROM centers WHERE slug = $1 AND is_active = true`
    - Return `{ name, logoUrl, slug }` on success
    - Return 404 `{ error: "Center not found" }` if slug not found or center is inactive
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 2.2 Register public center info route
    - Add `GET /api/centers/:slug/info` route with no auth middleware
    - Wire to `getCenterInfo` handler
    - _Requirements: 2.1_

  - [ ]* 2.3 Write property test for response field restriction (Property 3)
    - **Property 3: Public center info response contains only allowed fields**
    - Generate random center objects with extra fields, pass through the response shaper, verify only `name`, `logoUrl`, `slug` keys exist in output
    - Test file: `src/controllers/__tests__/centers.public.property.test.ts`
    - **Validates: Requirements 2.4**

- [ ] 3. Checkpoint - Public API complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Center-scoped login validation
  - [ ] 4.1 Modify auth controller to accept centerSlug
    - In `src/controllers/auth.ts`, extend the `login` handler to accept optional `centerSlug` in request body
    - If `centerSlug` is provided: resolve slug to center_id via DB query
    - If user role is ADMIN: skip center validation, allow login
    - If user's `center_id` does not match resolved center_id: return 403 `{ error: "You do not belong to this center" }`
    - If no `centerSlug` provided: proceed with existing flow (backward compatible)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.2_

  - [ ]* 4.2 Write property test for center-scoped login validation (Property 4)
    - **Property 4: Center-scoped login validation correctness**
    - Generate random (user, center) pairs with varying roles and center_ids, verify validation succeeds iff `role === 'ADMIN'` OR `user.center_id === center.id`
    - Test file: `src/controllers/__tests__/auth.center-scope.property.test.ts`
    - **Validates: Requirements 4.2, 4.3**

- [ ] 5. Admin center slug update
  - [ ] 5.1 Extend admin centers controller to accept slug field
    - In `src/controllers/admin/centers.ts`, add `slug` to `allowedFields` in the `updateCenter` handler
    - Before update: validate slug format via `validateSlug()`
    - Before update: check uniqueness — query if slug already exists for another center
    - Return 400 with validation error if format is invalid
    - Return 409 `{ error: "This slug is already taken" }` if slug is not unique
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 5.2 Write property test for slug management role restriction (Property 5)
    - **Property 5: Slug management role restriction**
    - Generate random users with STUDENT/ASSISTANT_COACH roles, verify slug update is always rejected with 403
    - Test file: `src/controllers/__tests__/centers.slug-update.property.test.ts`
    - **Validates: Requirements 7.6**

- [ ] 6. Checkpoint - Backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Frontend - Branded login page
  - [ ] 7.1 Add CenterPublicInfo type and API service function
    - Add `CenterPublicInfo` interface to frontend types: `{ name: string; logoUrl: string | null; slug: string }`
    - Add `getCenterPublicInfo(slug: string)` function to `src/services/api.ts` that calls `GET /api/centers/:slug/info`
    - _Requirements: 2.1, 3.1_

  - [ ] 7.2 Enhance LoginPage to support center branding
    - In `src/pages/LoginPage.tsx`, read `:centerSlug` from route params using `useParams`
    - Add states: `centerInfo`, `centerLoading`, `centerError`
    - On mount with slug param: call `getCenterPublicInfo(slug)`, set loading/error states
    - When `centerInfo` is loaded: render center name in place of "LoveAll" branding, render center logo if `logoUrl` is available
    - When `centerError` is true: render "Center not found" error page with a link to `/login`
    - While loading: show a loading indicator
    - Include `centerSlug` in login request body when present
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.1, 6.2, 6.3_

  - [ ] 7.3 Add branded login route to App.tsx
    - Add `<Route path="/login/:centerSlug" element={<LoginPage />} />` in `App.tsx`
    - Ensure it does not conflict with the existing `/login` route
    - _Requirements: 3.1, 5.1_

- [ ] 8. Frontend - Slug management settings
  - [ ] 8.1 Add slug editor to center settings page
    - In the existing center settings page, add an editable field for the center's slug
    - Display the current slug value pre-filled
    - On submit: validate client-side (lowercase, 3–50 chars, only `[a-z0-9-]`, no consecutive hyphens)
    - Submit via existing `PATCH /api/admin/centers/:id` endpoint with `{ slug: newValue }`
    - Show inline error for validation failures or "This slug is already taken" (409 response)
    - Show success feedback on successful update
    - Restrict visibility to HEAD_COACH and ADMIN roles
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 9. Final checkpoint - Full feature complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The backend (tasks 1–6) is in `/Users/midhunvmanikkath/Documents/PROJECTS/LOVEALL/API/shuttlecoach-api/`
- The frontend (tasks 7–8) is in `/Users/midhunvmanikkath/Documents/PROJECTS/LOVEALL/APP/shuttlecoach/`
- Existing auth controller is at `src/controllers/auth.ts` in the API project
- Existing admin centers controller is at `src/controllers/admin/centers.ts` in the API project
- Existing LoginPage is at `src/pages/LoginPage.tsx` in the frontend project
- `fast-check` is available as a dev dependency for property-based tests

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4"] },
    { "id": 2, "tasks": ["2.1", "4.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "4.2"] },
    { "id": 4, "tasks": ["5.1"] },
    { "id": 5, "tasks": ["5.2", "7.1"] },
    { "id": 6, "tasks": ["7.2", "7.3", "8.1"] }
  ]
}
```
