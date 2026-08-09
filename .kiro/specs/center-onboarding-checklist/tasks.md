# Implementation Plan: Center Onboarding Checklist

## Overview

This plan implements the Center Onboarding Checklist feature across database, backend API, email service, and frontend React SPA. The approach is bottom-up: database migration first, then backend service/controller/routes, welcome email service, center creation hook, and finally the frontend hook and widget. Completion detection is live (evaluated on each GET request via a single optimized query), and the welcome email fires asynchronously after center creation.

## Tasks

- [x] 1. Database migration
  - [x] 1.1 Create migration file `019_center_onboarding_checklists.sql`
    - Create file at `src/migrations/019_center_onboarding_checklists.sql` in the API project
    - Create `center_onboarding_checklists` table with columns: id (UUID PK DEFAULT gen_random_uuid()), center_id (UUID NOT NULL UNIQUE FK → centers.id ON DELETE CASCADE), items (JSONB NOT NULL DEFAULT '[]'), dismissed_at (TIMESTAMPTZ NULL), created_at (TIMESTAMPTZ NOT NULL DEFAULT NOW()), updated_at (TIMESTAMPTZ NOT NULL DEFAULT NOW())
    - Add UNIQUE index on center_id
    - Initialize default JSONB items array with six items: add_coach, add_students, setup_curriculum, create_batch_templates, create_batches, assign_students — all with completed=false and completedAt=null
    - Wrap in transaction (BEGIN/COMMIT)
    - _Requirements: 2.1, 2.2_

- [x] 2. Backend onboarding checklist service
  - [x] 2.1 Implement `src/services/onboardingChecklistService.ts`
    - Export `evaluateChecklistItems(centerId: string, headCoachId: string)`: run the single optimized query (six COUNT subqueries) and return completion state for all six items
    - Export `getOrCreateChecklist(centerId: string)`: retrieve existing checklist row or return default empty state (six incomplete items)
    - Export `reconcileItems(stored: ChecklistItem[], live: ChecklistItem[])`: merge live boolean state with stored timestamps — preserve first-detection timestamp if live=true and already complete, clear timestamp if live=false
    - Export `dismissChecklist(centerId: string)`: set dismissed_at = NOW() and updated_at = NOW() on the checklist row
    - Export `computeAllComplete(items: ChecklistItem[]): boolean`: return true only if all six items are completed
    - Export `computeProgressCount(items: ChecklistItem[]): number`: count items where completed=true
    - Use the existing `query` function from `../../config/database`
    - _Requirements: 2.3, 2.4, 2.5, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

  - [ ]* 2.2 Write property test for completion detection (Property 3)
    - **Property 3: Completion detection maps counts to booleans**
    - For any set of six non-negative integer counts, the corresponding item's completed flag SHALL equal (count >= 1)
    - Use fast-check to generate arbitrary non-negative integers for each of the six counts
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**

  - [ ]* 2.3 Write property test for reconciliation logic (Property 4)
    - **Property 4: Reconciliation preserves first-detection timestamps**
    - For any pair of (live completion state, stored completion state with optional timestamp), verify: live=true + stored.completed=false → new timestamp; live=true + stored.completed=true → preserve existing; live=false → clear timestamp
    - Use fast-check to generate boolean pairs and optional Date values
    - **Validates: Requirements 2.3, 2.4, 2.5, 6.7**

  - [ ]* 2.4 Write property test for allComplete flag (Property 5)
    - **Property 5: allComplete flag is logical AND of all items**
    - For any array of six checklist items with arbitrary completion states, allComplete SHALL be true iff every item has completed=true
    - **Validates: Requirements 3.3**

  - [ ]* 2.5 Write property test for progress count (Property 6)
    - **Property 6: Progress count equals completed item count**
    - For any array of six items with arbitrary completion states, progress count SHALL equal items.filter(i => i.completed).length
    - **Validates: Requirements 5.3**

- [x] 3. Backend controller and routes
  - [x] 3.1 Implement controller `src/controllers/onboardingChecklist.ts`
    - `getChecklistStatus`: authenticate, authorize HEAD_COACH role, extract center_id and head_coach_id from auth context, call evaluateChecklistItems, call getOrCreateChecklist, reconcileItems, update stored items in DB, return OnboardingChecklistResponse with items array, allComplete flag, and dismissedAt
    - `dismissChecklist`: authenticate, authorize HEAD_COACH role, extract center_id, call dismissChecklist service, return DismissResponse with success and dismissedAt
    - Return 401 for unauthenticated, 403 for non-HEAD_COACH, 500 for DB errors
    - If no checklist row exists, return default state (six incomplete items, not dismissed)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.3_

  - [x] 3.2 Create route file `src/routes/onboardingChecklist.ts`
    - Set up Router with authenticate middleware
    - GET /api/onboarding-checklist → authorize HEAD_COACH → getChecklistStatus
    - POST /api/onboarding-checklist/dismiss → authorize HEAD_COACH → dismissChecklist
    - _Requirements: 3.1, 3.5, 4.1_

  - [x] 3.3 Register routes in `src/routes/index.ts`
    - Import onboardingChecklistRoutes from './onboardingChecklist'
    - Add `router.use('/onboarding-checklist', onboardingChecklistRoutes)`
    - _Requirements: 3.1_

- [x] 4. Welcome email service
  - [x] 4.1 Implement `src/services/welcomeEmailService.ts`
    - Export `sendCenterWelcomeEmail({ centerName, headCoachEmail, userName, resetLink, loginUrl })`: validate email (not null/empty/whitespace, contains @ with domain), render HTML template listing all six onboarding tasks, send via existing nodemailer transporter
    - Email template includes: greeting with userName, password reset link (button + plain text), branded login URL, visible list of six onboarding steps
    - On invalid email: log warning with center_id, return without throwing
    - On transient SMTP failure: retry once after 5-second delay; if retry fails, log error with center_id and return without throwing
    - Use the same transporter configuration from emailService.ts
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 4.2 Write property test for email template rendering (Property 1)
    - **Property 1: Email template contains all required fields**
    - For any valid username, resetUrl, and loginUrl strings, the rendered HTML SHALL contain all three as substrings
    - Use fast-check to generate arbitrary non-empty strings
    - **Validates: Requirements 1.2**

  - [ ]* 4.3 Write property test for invalid email handling (Property 2)
    - **Property 2: Invalid email addresses prevent delivery**
    - For any email that is null, empty, whitespace-only, or lacks @ with domain, the function SHALL skip delivery and return without throwing
    - Use fast-check to generate invalid email variants
    - **Validates: Requirements 1.4**

- [x] 5. Checkpoint - Backend services complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Center creation hook
  - [x] 6.1 Modify `src/controllers/admin/centers.ts` createCenter function
    - After successful center INSERT, insert a row into `center_onboarding_checklists` with the new center_id and default items JSONB
    - If center has a head_coach_id assigned, fire async welcome email using `setImmediate` / `process.nextTick` (non-blocking)
    - Look up head coach's email and username from users table
    - Generate password reset link and center login URL (using center slug if available)
    - Call `sendCenterWelcomeEmail` asynchronously — never block the center creation response
    - Handle edge case: if head_coach_id is null at creation time, skip email (checklist row still created)
    - _Requirements: 1.1, 1.4, 1.5, 2.1_

- [x] 7. Frontend hook
  - [x] 7.1 Create `src/hooks/useOnboardingChecklist.ts`
    - Custom hook using useState + useEffect + existing apiClient pattern
    - Fetch `GET /api/onboarding-checklist` on mount
    - Expose: `checklist` (OnboardingChecklistResponse | null), `loading` (boolean), `error` (string | null), `dismiss()` async function, `dismissing` (boolean)
    - On API error or timeout (10s via AbortController): set checklist to null (widget hides gracefully)
    - `dismiss()`: POST /api/onboarding-checklist/dismiss, update local state on success, set error on failure
    - _Requirements: 3.1, 4.1, 4.5, 5.6_

- [x] 8. Frontend widget component
  - [x] 8.1 Create `src/components/OnboardingChecklist.tsx`
    - Render a card at the top of dashboard content area
    - Show progress: "{n} of 6 completed" using computeProgressCount
    - List six items with check/uncheck icon (✓ or ○), label text, and navigation link
    - Each item links to its relevant page: /coaches, /students, /curriculum, /batches, /batches, /students
    - Dismiss button ("Got it" or "Dismiss") at bottom of card
    - On dismiss click: call dismiss() from hook, show error toast if it fails
    - If allComplete is true or dismissedAt is set: do not render the widget
    - Accessible: proper ARIA roles, keyboard navigation for links and dismiss button
    - Responsive: full width on mobile, card layout on desktop
    - Create associated `src/components/OnboardingChecklist.css` for styling
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 4.1, 4.2, 4.4, 4.5_

- [x] 9. Dashboard integration
  - [x] 9.1 Modify `src/pages/HeadCoachDashboard.tsx`
    - Import and use useOnboardingChecklist hook
    - Conditionally render `<OnboardingChecklist />` above existing dashboard content
    - Only show for HEAD_COACH role users (check from AuthContext)
    - Pass checklist data, loading state, dismiss function to widget
    - If checklist is null (API failed) or loading: don't render widget, don't block dashboard
    - _Requirements: 5.1, 5.6, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 10. Checkpoint - Full feature integration
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document using fast-check + Vitest
- Backend project path: `/Users/midhunvmanikkath/Documents/PROJECTS/LOVEALL/API/shuttlecoach-api/`
- Frontend project path: `/Users/midhunvmanikkath/Documents/PROJECTS/LOVEALL/APP/shuttlecoach/`
- The existing `emailService.ts` transporter config is reused by the welcome email service
- The center creation hook modifies the existing `createCenter` controller — avoid breaking existing tests
- The single optimized completion detection query (six COUNT subqueries) keeps latency under 2s requirement
- The reconciliation function is a pure function suitable for property-based testing

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "4.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "2.5", "4.2", "4.3", "3.1"] },
    { "id": 3, "tasks": ["3.2"] },
    { "id": 4, "tasks": ["3.3", "6.1"] },
    { "id": 5, "tasks": ["7.1"] },
    { "id": 6, "tasks": ["8.1"] },
    { "id": 7, "tasks": ["9.1"] }
  ]
}
```
