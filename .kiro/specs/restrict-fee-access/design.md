# Design Document: Restrict Fee Access

## Overview

This feature introduces a per-user fee access permission system that allows the HEAD_COACH to control which coaches can view and manage fee data. The implementation spans the database (new boolean column), API middleware (permission check before fee endpoints), a management API (toggle endpoint + coaches list), and frontend changes (auth context, route protection, navigation visibility, toggle UI).

The design follows the existing patterns in the codebase: Express middleware chain for authorization, tenant scoping via `TenantRequest`, and React Context + `ProtectedRoute` for frontend access control.

### Key Design Decisions

1. **Middleware-based enforcement**: A new `requireFeeAccess` middleware is inserted into the fee route chain rather than modifying each controller. This keeps controllers unchanged and makes the permission check explicit and removable.

2. **Permission evaluated at request time**: No caching of `can_access_fees` in the JWT. The flag is read from the database on each fee request. This ensures toggling takes effect immediately without requiring re-login.

3. **Frontend uses login response**: The `can_access_fees` value is returned in the login response and stored in AuthContext. On toggle, the affected user's next page load or re-login will pick up the change. The current user's own `canAccessFees` state is updated reactively if they are the target of a toggle.

4. **HEAD_COACH always included in coaches list**: The existing `listCoaches` endpoint is modified to include HEAD_COACH users for the center, not just ASSISTANT_COACH. This enables the toggle UI to show all coaches.

## Architecture

```mermaid
flowchart TD
    subgraph Frontend
        A[AuthContext] -->|exposes canAccessFees| B[ProtectedRoute /fees]
        A --> C[Sidebar Nav visibility]
        D[CoachesPage] --> E[FeeAccessToggle Component]
    end

    subgraph API
        F[Fee Routes] --> G[requireFeeAccess middleware]
        G --> H[Fee Controllers]
        I[Coach Routes] --> J[PATCH /:id/fee-access]
        I --> K[GET / (updated)]
    end

    subgraph Database
        L[users table + can_access_fees column]
    end

    E -->|PATCH /api/coaches/:id/fee-access| J
    J --> L
    G -->|SELECT can_access_fees| L
    B -->|checks canAccessFees from context| A
```

## Components and Interfaces

### Backend Components

#### 1. Database Migration

```sql
ALTER TABLE users ADD COLUMN can_access_fees BOOLEAN NOT NULL DEFAULT false;
```

No backfill required — existing ASSISTANT_COACH users default to `false` (no access), and the flag is ignored for ADMIN/HEAD_COACH by the middleware logic.

#### 2. `requireFeeAccess` Middleware

**File**: `src/middleware/feeAccess.ts`

```typescript
import { Response, NextFunction } from 'express';
import { TenantRequest } from './tenantScope';
import { UserRole } from '../types';
import { query } from '../config/database';

/**
 * Middleware that checks if the current user has fee access.
 * - ADMIN and HEAD_COACH: always allowed
 * - STUDENT: always allowed (controller scopes to own records)
 * - ASSISTANT_COACH: allowed only if can_access_fees = true
 */
export const requireFeeAccess = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const { role, id } = req.user;

  // ADMIN and HEAD_COACH always have fee access
  if (role === UserRole.ADMIN || role === UserRole.HEAD_COACH) {
    next();
    return;
  }

  // STUDENT always allowed (controller handles scoping)
  if (role === UserRole.STUDENT) {
    next();
    return;
  }

  // ASSISTANT_COACH: check can_access_fees flag
  const result = await query(
    'SELECT can_access_fees FROM users WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0 || !result.rows[0].can_access_fees) {
    res.status(403).json({
      error: 'You do not have permission to access fee data. Contact your head coach to request access.',
    });
    return;
  }

  next();
};
```

#### 3. Toggle Fee Access Endpoint

**Route**: `PATCH /api/coaches/:id/fee-access`  
**File**: Added to `src/controllers/coaches.ts`

```typescript
/**
 * PATCH /api/coaches/:id/fee-access
 * Toggle fee access for a coach (HEAD_COACH only)
 * Body: { canAccessFees: boolean }
 */
export const toggleFeeAccess = async (
  req: TenantRequest,
  res: Response
): Promise<void> => {
  const { id: targetCoachId } = req.params;
  const { canAccessFees } = req.body;

  if (typeof canAccessFees !== 'boolean') {
    res.status(400).json({ error: 'canAccessFees must be a boolean' });
    return;
  }

  // Verify target user exists and is in the same center
  const targetResult = await query(
    'SELECT id, role, center_id, can_access_fees FROM users WHERE id = $1',
    [targetCoachId]
  );

  if (targetResult.rows.length === 0) {
    res.status(404).json({ error: 'Coach not found' });
    return;
  }

  const target = targetResult.rows[0];

  // Must be in the same center
  if (target.center_id !== req.tenantCenterId) {
    res.status(403).json({ error: 'Cannot modify coaches outside your center' });
    return;
  }

  // Must be a coach role (HEAD_COACH or ASSISTANT_COACH)
  if (target.role !== UserRole.ASSISTANT_COACH && target.role !== UserRole.HEAD_COACH) {
    res.status(400).json({ error: 'Fee access can only be toggled for coaches' });
    return;
  }

  // Update the flag
  await query(
    'UPDATE users SET can_access_fees = $1 WHERE id = $2',
    [canAccessFees, targetCoachId]
  );

  res.status(200).json({
    id: targetCoachId,
    canAccessFees,
  });
};
```

#### 4. Updated `listCoaches` Endpoint

The existing `GET /api/coaches` is modified to:
- Include `can_access_fees` in the SELECT and response
- Include HEAD_COACH users (not just ASSISTANT_COACH) by changing the role filter to `u.role IN ('HEAD_COACH', 'ASSISTANT_COACH')`

Response shape addition:
```typescript
{
  // ...existing fields...
  canAccessFees: boolean,
  role: 'HEAD_COACH' | 'ASSISTANT_COACH',
}
```

#### 5. Fee Routes Update

**File**: `src/routes/fees.ts`

Add `requireFeeAccess` to the middleware chain after `tenantScope`:

```typescript
import { requireFeeAccess } from '../middleware/feeAccess';

// All fee routes require authentication
router.use(authenticate);
router.use(centerActive);
router.use(tenantScope);
router.use(requireFeeAccess); // NEW: fee permission check
```

#### 6. Coach Routes Update

**File**: `src/routes/coaches.ts`

Add the new toggle endpoint:

```typescript
router.patch(
  '/:id/fee-access',
  authorize(UserRole.HEAD_COACH),
  toggleFeeAccess
);
```

### Frontend Components

#### 7. AuthContext Update

**File**: `src/contexts/AuthContext.tsx`

Add `canAccessFees` to the context interface and state:

```typescript
export interface AuthContext {
  // ...existing fields...
  canAccessFees: boolean;
}
```

The value is extracted from the login response (API returns `can_access_fees` in the user object or as a top-level field). For ADMIN/HEAD_COACH, this is always `true` on the client side regardless of the DB value.

Derivation logic in `AuthProvider`:
```typescript
const canAccessFees = role === 'ADMIN' || role === 'HEAD_COACH' || !!loginResponse.canAccessFees;
```

#### 8. ProtectedRoute Update

The existing `ProtectedRoute` component gains an optional `requireFeeAccess` prop:

```tsx
<ProtectedRoute allowedRoles={['HEAD_COACH', 'ASSISTANT_COACH']} requireFeeAccess>
  <FeesPage />
</ProtectedRoute>
```

When `requireFeeAccess` is true and the user's `canAccessFees` is false, redirect to `/access-denied`.

#### 9. Sidebar Navigation Update

The fees navigation link conditionally renders based on `canAccessFees` from `useAuth()`:

```tsx
{canAccessFees && <NavLink to="/fees">Fees</NavLink>}
```

#### 10. FeeAccessToggle Component

**File**: `src/components/FeeAccessToggle.tsx`

A toggle switch component used within the CoachesPage. For each coach row:
- ASSISTANT_COACH: editable toggle
- HEAD_COACH: disabled toggle shown as "always on"

Uses `PATCH /api/coaches/:id/fee-access` on toggle. On API error, reverts the toggle and shows a toast notification.

## Data Models

### Database Schema Change

```sql
-- Migration: add_can_access_fees_to_users
ALTER TABLE users ADD COLUMN can_access_fees BOOLEAN NOT NULL DEFAULT false;

-- Optional index for the permission check query
CREATE INDEX idx_users_can_access_fees ON users (id, can_access_fees) WHERE role = 'ASSISTANT_COACH';
```

### Updated User Type (Backend)

```typescript
export interface User {
  // ...existing fields...
  canAccessFees: boolean;
}
```

### API Request/Response Types

```typescript
// PATCH /api/coaches/:id/fee-access
interface ToggleFeeAccessRequest {
  canAccessFees: boolean;
}

interface ToggleFeeAccessResponse {
  id: string;
  canAccessFees: boolean;
}

// GET /api/coaches (updated response item)
interface CoachListItem {
  id: string;
  username: string;
  role: 'HEAD_COACH' | 'ASSISTANT_COACH';
  name: string;
  email: string | null;
  profilePhoto: string | null;
  specialization: string | null;
  createdAt: string;
  lastActive: string;
  assignedStudentCount: number;
  assignedBatchCount: number;
  canAccessFees: boolean;
}
```

### Frontend AuthContext State Addition

```typescript
interface AuthContextInterface {
  // ...existing fields...
  canAccessFees: boolean;
}
```

Stored in `localStorage` as `auth_can_access_fees` and restored on page reload.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Implicit fee access for privileged roles

*For any* user with role ADMIN or HEAD_COACH, regardless of their `can_access_fees` database value (true or false), the `requireFeeAccess` middleware SHALL allow the request through.

**Validates: Requirements 2.1, 2.2, 2.3, 6.2**

### Property 2: can_access_fees governs ASSISTANT_COACH access

*For any* user with role ASSISTANT_COACH, the `requireFeeAccess` middleware SHALL allow the request if and only if `can_access_fees` is `true` in the database. When `can_access_fees` is `false`, the middleware SHALL respond with HTTP 403.

**Validates: Requirements 1.2, 3.1, 3.2, 3.3, 6.1, 6.4**

### Property 3: STUDENT fee access is independent of can_access_fees

*For any* user with role STUDENT, regardless of their `can_access_fees` value, the `requireFeeAccess` middleware SHALL allow the request through (controller handles row-level scoping).

**Validates: Requirements 6.3**

### Property 4: Same-center toggle succeeds

*For any* HEAD_COACH user and any target coach (HEAD_COACH or ASSISTANT_COACH) in the same center, a PATCH request with a valid boolean `canAccessFees` body SHALL update the target's `can_access_fees` flag and return HTTP 200 with the new value.

**Validates: Requirements 4.1**

### Property 5: Cross-center toggle is rejected

*For any* HEAD_COACH user and any target coach in a different center, a PATCH request to toggle fee access SHALL respond with HTTP 403.

**Validates: Requirements 4.2, 4.3**

### Property 6: Only HEAD_COACH can toggle fee access

*For any* authenticated user with a role other than HEAD_COACH, a PATCH request to the fee-access toggle endpoint SHALL respond with HTTP 403.

**Validates: Requirements 4.5**

### Property 7: Coaches list returns all same-center coaches with required fields

*For any* HEAD_COACH user, the GET coaches endpoint SHALL return exactly the set of coaches (HEAD_COACH and ASSISTANT_COACH) belonging to their center, and each item SHALL include `name`, `role`, and `canAccessFees` fields.

**Validates: Requirements 5.1, 5.2, 5.3, 10.1, 10.2**

### Property 8: Fee access permission function correctness

*For any* user object, the `canAccessFees` permission function SHALL return `true` if and only if the user's role is ADMIN, HEAD_COACH, or (ASSISTANT_COACH with `can_access_fees === true`). In all other cases it SHALL return `false`.

**Validates: Requirements 7.1, 7.2, 7.3, 8.1, 8.2, 8.3**

## Error Handling

| Scenario | HTTP Status | Error Message |
|----------|-------------|---------------|
| ASSISTANT_COACH without fee access hits a fee endpoint | 403 | "You do not have permission to access fee data. Contact your head coach to request access." |
| HEAD_COACH toggles fee access for a user in another center | 403 | "Cannot modify coaches outside your center" |
| HEAD_COACH toggles fee access for a non-existent user | 404 | "Coach not found" |
| Non-HEAD_COACH attempts to toggle fee access | 403 | "You do not have permission to perform this action" (from existing `authorize` middleware) |
| Invalid `canAccessFees` body (not boolean) | 400 | "canAccessFees must be a boolean" |
| Toggle API fails on frontend | Toast error + toggle revert | "Failed to update fee access. Please try again." |
| ASSISTANT_COACH navigates to /fees without permission | Redirect to `/access-denied` | N/A (handled by ProtectedRoute) |

### Database Error Handling

- If the `requireFeeAccess` middleware's DB query fails, return 500 with a generic error. Log the full error server-side.
- If the toggle endpoint's UPDATE fails, return 500. The transaction is a single statement so no partial state.

## Testing Strategy

### Property-Based Tests (Vitest + fast-check)

The `requireFeeAccess` middleware and the frontend `canAccessFees` permission function are pure-logic components ideal for PBT. Each property test runs a minimum of 100 iterations.

**Backend PBT targets:**
- `requireFeeAccess` middleware logic (Properties 1, 2, 3) — mock the DB query, generate random user objects with varying roles and `can_access_fees` values
- `toggleFeeAccess` controller logic (Properties 4, 5, 6) — mock DB, generate random coach configurations across centers

**Frontend PBT target:**
- `canAccessFees` permission utility function (Property 8) — generate random user objects with varying roles and flags

**Tag format:** `Feature: restrict-fee-access, Property {number}: {property_text}`

### Unit Tests (Example-Based)

- Creating an ASSISTANT_COACH defaults `can_access_fees` to false (Req 1.3)
- Toggle UI renders toggles for each coach (Req 9.1)
- Toggle UI sends PATCH on click and updates state (Req 9.2)
- Toggle UI reverts on API error (Req 9.3)
- HEAD_COACH toggle is disabled in UI (Req 10.3)
- ProtectedRoute redirects when `canAccessFees` is false (Req 7.2)

### Integration Tests

- End-to-end fee access flow: create ASSISTANT_COACH → verify no fee access → toggle on → verify fee access → toggle off → verify 403
- Coaches list includes HEAD_COACH with correct role label
- Login response includes `canAccessFees` field

### Test Configuration

- Backend: Vitest + fast-check, run with `npm run test`
- Frontend: Vitest + Testing Library + fast-check, run with `npm run test`
- Minimum 100 iterations for all property tests
- Tests colocated with source files per project convention
