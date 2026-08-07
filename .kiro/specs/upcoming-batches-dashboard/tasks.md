# Implementation Plan: Upcoming Batches Dashboard

## Overview

Implements the "Upcoming Batches" dashboard feature across the Express API backend and React frontend. The plan starts with the pure `computeNextSession` helper (adapted from the existing calendar engine's recurrence logic), builds out the dashboard service and API endpoint, then adds the frontend hook and widgets integrated into the existing dashboard pages.

## Tasks

- [ ] 1. Backend — computeNextSession helper
  - [ ] 1.1 Create the `computeNextSession` pure function
    - Create `src/services/dashboard.ts` in the API project
    - Extract and adapt the recurrence iteration logic from `generateSessionDates` in `src/services/calendarEngine.ts`
    - Implement the function signature: `computeNextSession(schedule: SessionSchedule, referenceDate: Date, referenceTime: string, lookaheadDays: number) => { date: string; startTime: string; endTime: string } | null`
    - Logic: check if today matches a recurrence day with a slot where `endTime > referenceTime`; if not, iterate forward day-by-day up to `lookaheadDays` checking recurrence matches
    - Respect `endType` boundaries (`on_date`, `after_count`)
    - Return the first matching session or `null`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 1.2 Write property test for computeNextSession (Property 1)
    - **Property 1: Next session computation correctness**
    - Generate random SessionSchedule objects (random slots/repeatDays, repeatEvery 1–4, various endTypes), random reference dates, random reference times
    - Assert: if a non-null result is returned, its date is within lookaheadDays from referenceDate, it matches a valid recurrence day, and no earlier valid session exists
    - Assert: if null is returned, no valid session exists within the window
    - Use `fast-check` with min 100 iterations
    - Test file: `src/services/__tests__/dashboard.computeNextSession.property.test.ts`
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [ ] 2. Backend — Dashboard service and controller
  - [ ] 2.1 Implement `getUpcomingSessions` service function
    - Add to `src/services/dashboard.ts`
    - Query `batches` table for batches assigned to the requesting coach (`head_coach_id` or `assistant_coach_id`), scoped by `center_id`
    - For each batch, fetch `session_schedules` via existing `getSchedule` from `src/services/sessionSchedules.ts`
    - Call `computeNextSession` with 14-day lookahead for each schedule
    - For batches with a valid next session, query enrolled students (`id`, `full_name`, `profile_photo`)
    - If role is `HEAD_COACH`, additionally query all batches in the center, compute next sessions within 7 days, join with `users` table for coach names, aggregate into `teamSchedule`
    - Sort `teamSchedule` by date ASC, then startTime ASC
    - Return `{ mySessions, teamSchedule? }`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 2.2 Create `getUpcomingDashboardHandler` controller
    - Create `src/controllers/dashboard.ts` in the API project
    - Extract `userId`, `role`, `centerId` from `req.user` / `req.tenantCenterId`
    - Call `getUpcomingSessions(userId, role, centerId)`
    - Return JSON response with appropriate shape
    - Handle errors: return 500 with generic error message on failure
    - _Requirements: 1.1, 1.6, 2.1, 2.3_

  - [ ] 2.3 Register the dashboard route
    - Create `src/routes/dashboard.ts` in the API project
    - Register `GET /api/dashboard/upcoming` with middleware: `authenticate` → `centerActive` → `tenantScope`
    - Wire the new route file into `src/routes/index.ts`
    - _Requirements: 1.1, 1.5, 1.6_

  - [ ]* 2.4 Write property test for tenant isolation (Property 3)
    - **Property 3: Tenant isolation**
    - Mock DB queries with multiple centers and overlapping coach IDs
    - Assert: all batches in response belong to the requesting user's `center_id`
    - Test file: `src/services/__tests__/dashboard.tenantIsolation.property.test.ts`
    - **Validates: Requirements 1.5**

  - [ ]* 2.5 Write property test for role-based teamSchedule inclusion (Property 4)
    - **Property 4: Role-based teamSchedule inclusion**
    - Generate HEAD_COACH and ASSISTANT_COACH requests
    - Assert: HEAD_COACH response includes `teamSchedule` array; ASSISTANT_COACH response does not include `teamSchedule`
    - Test file: `src/services/__tests__/dashboard.roleTeamSchedule.property.test.ts`
    - **Validates: Requirements 2.1, 2.2, 2.3**

  - [ ]* 2.6 Write property test for teamSchedule temporal bounds and ordering (Property 5)
    - **Property 5: TeamSchedule temporal bounds and ordering**
    - Generate team schedules with dates spanning >7 days
    - Assert: all entries have dates within 7 days from today; array is sorted by date ASC then startTime ASC
    - Test file: `src/services/__tests__/dashboard.teamScheduleOrder.property.test.ts`
    - **Validates: Requirements 2.4, 2.5**

- [ ] 3. Checkpoint — Backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Frontend — Hook and types
  - [ ] 4.1 Create shared TypeScript interfaces
    - Create `src/types/dashboard.ts` in the frontend project
    - Define `UpcomingSession`, `TeamScheduleEntry`, and `UpcomingDashboardResponse` interfaces matching the API response shape
    - _Requirements: 1.2, 2.2_

  - [ ] 4.2 Create `useUpcomingSessions` hook
    - Create `src/hooks/useUpcomingSessions.ts` in the frontend project
    - Call `GET /api/dashboard/upcoming` on mount using the existing API client
    - Return `{ mySessions, teamSchedule, loading, error, refetch }`
    - No caching — always fetch fresh data on mount
    - Expose `refetch()` for retry-on-error
    - _Requirements: 7.3, 7.4_

- [ ] 5. Frontend — NextSessionWidget component
  - [ ] 5.1 Create `NextSessionWidget` component
    - Create `src/components/NextSessionWidget.tsx` in the frontend project
    - Props: `{ sessions: UpcomingSession[]; loading: boolean; error: string | null; onRetry: () => void }`
    - Implement loading state: skeleton placeholder (card shape with pulsing lines)
    - Implement error state: error message with "Retry" button calling `onRetry`
    - Implement empty state: "No upcoming sessions scheduled" message
    - Implement data state: card showing batch name, formatted date (e.g., "Mon, 14 Jul 2025"), time range, and horizontal list of student avatars with names
    - If multiple sessions exist, show next chronological one prominently, list others below compactly
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 7.1_

  - [ ]* 5.2 Write unit tests for NextSessionWidget (Property 6)
    - **Property 6: NextSessionWidget renders all required fields**
    - Generate random non-empty `UpcomingSession` objects
    - Assert: rendered output contains batch name, date string, start time, end time, and for each student their full name and a profile photo element
    - Test file: `src/components/__tests__/NextSessionWidget.test.tsx`
    - **Validates: Requirements 4.2, 4.3, 5.2, 5.3**

- [ ] 6. Frontend — TeamScheduleWidget component
  - [ ] 6.1 Create `TeamScheduleWidget` component
    - Create `src/components/TeamScheduleWidget.tsx` in the frontend project
    - Props: `{ schedule: TeamScheduleEntry[] | null; loading: boolean; error: string | null; onRetry: () => void }`
    - Implement loading state: skeleton placeholder
    - Implement error state: error message with "Retry" button
    - Implement empty state: "No team sessions in the next 7 days" message
    - Implement data state: compact list/rows showing coach name, batch name, date + time, and student count badge
    - Only rendered when `schedule` is not null (HEAD_COACH only)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.2_

  - [ ]* 6.2 Write unit tests for TeamScheduleWidget (Property 7)
    - **Property 7: TeamScheduleWidget renders one entry per batch-session**
    - Generate random `teamSchedule` arrays with N entries
    - Assert: component renders exactly N entries, each displaying coach name, batch name, date/time, and student count
    - Test file: `src/components/__tests__/TeamScheduleWidget.test.tsx`
    - **Validates: Requirements 6.2, 6.3**

- [ ] 7. Frontend — Dashboard integration
  - [ ] 7.1 Integrate widgets into HeadCoachDashboard
    - Modify existing `HeadCoachDashboard.tsx` page
    - Import and wire `useUpcomingSessions` hook
    - Add `NextSessionWidget` at the top of the page (above stat cards)
    - Add `TeamScheduleWidget` below NextSessionWidget (above existing content)
    - Pass hook data and `refetch` as props
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1_

  - [ ] 7.2 Integrate widget into AssistantCoachDashboard
    - Modify existing `AssistantCoachDashboard.tsx` page
    - Import and wire `useUpcomingSessions` hook
    - Add `NextSessionWidget` at the top of the page (above stat cards)
    - No TeamScheduleWidget for assistant coaches
    - Pass hook data and `refetch` as props
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 8. Final checkpoint — Full feature complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design
- The backend (tasks 1–3) is in `/Users/midhunvmanikkath/Documents/PROJECTS/LOVEALL/API/shuttlecoach-api/`
- The frontend (tasks 4–8) is in `/Users/midhunvmanikkath/Documents/PROJECTS/LOVEALL/APP/shuttlecoach/`
- The existing calendar engine at `src/services/calendarEngine.ts` contains the `generateSessionDates` logic to adapt
- Existing session schedule service at `src/services/sessionSchedules.ts` provides `getSchedule` and `getWeekMappings`
- No database schema changes are required — all data comes from existing `batches`, `session_schedules`, `students`, and `users` tables
- `fast-check` is already available as a dev dependency for property tests

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "4.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "2.5", "2.6"] },
    { "id": 3, "tasks": ["4.2"] },
    { "id": 4, "tasks": ["5.1", "6.1"] },
    { "id": 5, "tasks": ["5.2", "6.2", "7.1", "7.2"] }
  ]
}
```
