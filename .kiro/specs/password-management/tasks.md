# Implementation Plan: Password Management

## Overview

Implements three password management flows (self-service change, admin reset, email-based forgot/reset) across the Express API backend and React frontend. The plan starts with database migration and shared utilities, builds out the API layer with controller and routes, then adds frontend pages and admin UI integration.

## Tasks

- [x] 1. Database migration and shared utilities
  - [x] 1.1 Create the `password_reset_tokens` database migration
    - Create a SQL migration file that creates the `password_reset_tokens` table with columns: id (UUID PK), user_id (UUID FK to users), token_hash (VARCHAR(64)), expires_at (TIMESTAMPTZ), used_at (TIMESTAMPTZ nullable), created_at (TIMESTAMPTZ DEFAULT NOW())
    - Add index on `token_hash` and `user_id`
    - Run migration against Supabase
    - _Requirements: 4.1, 4.2_

  - [x] 1.2 Create password validation utility
    - Create `src/utils/passwordValidator.ts` in the API project
    - Export a Zod schema `passwordSchema` (min 8, max 128 characters)
    - Export a `validatePassword` function returning `{ valid: boolean; error?: string }`
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 1.3 Write property test for password validation (Property 1)
    - **Property 1: Password Validation Accepts Only Valid Lengths**
    - Generate random strings and assert: accepted iff length is 8–128 inclusive
    - Use `fast-check` with min 100 iterations
    - Test file: `src/utils/__tests__/password.validator.property.test.ts`
    - **Validates: Requirements 5.1, 5.2, 5.3**

  - [x] 1.4 Create token generation utility
    - Create `src/utils/tokenGenerator.ts` in the API project
    - Export `generateResetToken()` → 32-byte hex string (64 chars)
    - Export `hashToken(token: string)` → SHA-256 hex digest
    - _Requirements: 3.1, 3.9_

  - [ ]* 1.5 Write property test for token utility (Property 5)
    - **Property 5: Token Storage is Hashed**
    - For any generated token, `hashToken(token) !== token` and `hashToken(token)` is a valid 64-char hex string
    - Test file: `src/utils/__tests__/password.token.property.test.ts`
    - **Validates: Requirements 3.1, 3.9**

- [x] 2. Email service and validation schemas
  - [x] 2.1 Install Nodemailer dependency
    - Run `npm install nodemailer` and `npm install -D @types/nodemailer` in the API project
    - Add SMTP env vars to `.env.example`: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `FRONTEND_URL`
    - _Requirements: 3.2_

  - [x] 2.2 Create email service
    - Create `src/services/emailService.ts` in the API project
    - Configure Nodemailer transporter from env vars
    - Export `sendPasswordResetEmail({ to, resetLink, userName })` that sends an HTML email with the reset link
    - Handle errors gracefully (log internally, don't throw to prevent enumeration leaks)
    - _Requirements: 3.2_

  - [x] 2.3 Create Zod validation schemas for password endpoints
    - Create `src/validators/password.schemas.ts` in the API project
    - Export schemas: `changePasswordSchema`, `adminResetPasswordSchema`, `forgotPasswordSchema`, `resetPasswordSchema`
    - Reuse `passwordSchema` from `src/utils/passwordValidator.ts`
    - _Requirements: 1.3, 1.4, 2.6, 5.1, 5.2, 5.3_

- [x] 3. Password controller implementation
  - [x] 3.1 Implement `changePassword` handler
    - Create `src/controllers/password.ts` in the API project
    - Implement handler: extract user from JWT, verify current password using existing `comparePassword`, validate new password, hash with existing `hashPassword`, update DB
    - Return 200 on success, 401 on wrong current password, 400 on validation failure
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 3.2 Write property tests for self-service password change (Properties 2, 3)
    - **Property 2: Self-Service Password Change Succeeds for All Roles**
    - **Property 3: Incorrect Current Password Rejection**
    - For any role + correct current password + valid new password → success
    - For any role + incorrect current password → 401
    - Test file: `src/controllers/__tests__/password.change.property.test.ts`
    - **Validates: Requirements 1.1, 1.2, 1.6**

  - [x] 3.3 Implement `adminResetPassword` handler
    - Add to `src/controllers/password.ts`
    - Verify caller role is ADMIN or HEAD_COACH (403 otherwise)
    - If HEAD_COACH, verify target user belongs to same center (403 otherwise)
    - Validate new password, hash, update DB
    - Return 200 with `{ message, newPassword }`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 3.4 Write property test for admin reset authorization (Property 4)
    - **Property 4: Administrative Reset Authorization**
    - Generate random role/center combinations and verify authorization rules hold
    - Test file: `src/controllers/__tests__/password.admin-reset.property.test.ts`
    - **Validates: Requirements 2.1, 2.2, 2.4, 2.5**

  - [x] 3.5 Implement `forgotPassword` handler
    - Add to `src/controllers/password.ts`
    - Look up user by email; if not found, return 200 (no email sent)
    - If found: invalidate existing tokens for that user, generate new token, hash it, store in DB with 1h expiry, send email with reset link
    - Always return same 200 response shape regardless of email existence
    - _Requirements: 3.1, 3.2, 3.3, 3.7, 3.8, 3.9_

  - [ ]* 3.6 Write property tests for forgot-password (Properties 6, 7, 9)
    - **Property 6: Email Enumeration Prevention**
    - **Property 7: Token Invalidation on New Request**
    - **Property 9: Reset Email Contains Valid Link**
    - Test file: `src/controllers/__tests__/password.forgot.property.test.ts`
    - **Validates: Requirements 3.2, 3.7, 3.8**

  - [x] 3.7 Implement `resetPassword` handler
    - Add to `src/controllers/password.ts`
    - Hash submitted token, look up in DB by token_hash
    - Reject if not found (400 "Invalid token"), if used_at is set (400 "Invalid token"), if expired (400 "Token expired")
    - Validate new password, hash, update user's password, mark token as used (set used_at)
    - _Requirements: 3.4, 3.5, 3.6, 4.3, 4.4_

  - [ ]* 3.8 Write property test for token reset flow (Property 8)
    - **Property 8: Valid Token Resets Password and is Consumed**
    - For any valid token + valid password: password updated AND token marked used
    - Test file: `src/controllers/__tests__/password.reset.property.test.ts`
    - **Validates: Requirements 3.4, 4.3, 4.4**

- [x] 4. Route registration and middleware
  - [x] 4.1 Register password routes
    - Create or update route file to register:
      - `PUT /api/auth/change-password` → auth middleware + validateRequest(changePasswordSchema) + changePassword
      - `POST /api/auth/forgot-password` → validateRequest(forgotPasswordSchema) + forgotPassword
      - `POST /api/auth/reset-password` → validateRequest(resetPasswordSchema) + resetPassword
      - `POST /api/coaches/:id/reset-password` → auth middleware + validateRequest(adminResetPasswordSchema) + adminResetPassword
    - Wire into the Express app
    - _Requirements: 1.1, 2.1, 3.1, 3.4_

- [x] 5. Checkpoint - Backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Frontend - Self-service password change
  - [x] 6.1 Create ChangePasswordPage component
    - Create page at the appropriate route (`/change-password`)
    - Form with: current password, new password, confirm new password fields
    - Client-side validation: min 8 chars, passwords match
    - Submit calls `PUT /api/auth/change-password` with auth header
    - Show success/error feedback
    - _Requirements: 1.1, 1.3, 1.5, 1.6_

  - [x] 6.2 Add navigation link to change password
    - Add "Change Password" link in the user profile/settings area or navigation menu
    - Accessible to all authenticated roles
    - _Requirements: 1.6_

- [x] 7. Frontend - Forgot/Reset password flow
  - [x] 7.1 Create ForgotPasswordPage component
    - Create page at `/forgot-password` (public route)
    - Form with email input
    - Submit calls `POST /api/auth/forgot-password`
    - Always show success message regardless of response (matches backend enumeration protection)
    - Add "Forgot Password?" link on login page
    - _Requirements: 3.1, 3.7_

  - [x] 7.2 Create ResetPasswordPage component
    - Create page at `/reset-password` (public route)
    - Read `token` from URL query parameter
    - Form with: new password, confirm new password fields
    - Client-side validation: min 8 chars, passwords match
    - Submit calls `POST /api/auth/reset-password` with token + newPassword
    - Show success message with link to login on success
    - Show error messages for expired/invalid tokens
    - _Requirements: 3.4, 3.5, 3.6, 5.1_

- [x] 8. Frontend - Admin reset password UI
  - [x] 8.1 Add Reset Password button to CoachDetailPage
    - Add a "Reset Password" button visible only to HEAD_COACH users
    - On click, open a modal/dialog with a new password input field
    - Submit calls `POST /api/coaches/:id/reset-password` with auth header
    - On success, display the new password to the admin so they can share it
    - _Requirements: 2.1, 2.3, 2.7_

- [x] 9. Final checkpoint - Full feature complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design
- The backend (tasks 1–5) is in `/Users/midhunvmanikkath/Documents/PROJECTS/LOVEALL/API/shuttlecoach-api/`
- The frontend (tasks 6–8) is in `/Users/midhunvmanikkath/Documents/PROJECTS/LOVEALL/APP/shuttlecoach/`
- Existing auth utils (`hashPassword`, `comparePassword`) are in the API at `src/utils/auth.ts`
- Existing validation middleware (`validateRequest`) is at `src/middleware/validation.ts`
- `fast-check` is already available as a dev dependency for property tests

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.4", "2.1"] },
    { "id": 1, "tasks": ["1.3", "1.5", "2.2", "2.3"] },
    { "id": 2, "tasks": ["3.1", "3.3", "3.5", "3.7"] },
    { "id": 3, "tasks": ["3.2", "3.4", "3.6", "3.8", "4.1"] },
    { "id": 4, "tasks": ["6.1", "6.2", "7.1", "7.2", "8.1"] }
  ]
}
```
