# Requirements Document

## Introduction

Password management for the ShuttleCoach platform, covering three flows: self-service password change for authenticated users, administrative password reset by ADMIN or HEAD_COACH roles, and email-based forgot-password recovery using time-limited reset tokens.

## Glossary

- **Password_Service**: The backend service responsible for handling password change, reset, and recovery operations.
- **Token_Store**: The database table (`password_reset_tokens`) that persists time-limited reset tokens for email-based recovery.
- **Email_Service**: The service responsible for sending transactional emails (reset links) to users.
- **Authenticated_User**: A user who has a valid JWT session.
- **Target_User**: The user whose password is being reset by an ADMIN or HEAD_COACH.
- **Reset_Token**: A cryptographically random, time-limited token used for email-based password recovery.

## Requirements

### Requirement 1: Self-Service Password Change

**User Story:** As an authenticated user, I want to change my own password by verifying my current password, so that I can maintain account security.

#### Acceptance Criteria

1. WHEN an Authenticated_User submits a password change request with a valid current password and a new password, THE Password_Service SHALL update the password hash for that user.
2. WHEN an Authenticated_User submits a password change request with an incorrect current password, THE Password_Service SHALL reject the request with a 401 status and an "Invalid current password" error message.
3. THE Password_Service SHALL require the new password to be at least 8 characters long.
4. IF the new password does not meet the minimum length requirement, THEN THE Password_Service SHALL reject the request with a 400 status and a validation error message.
5. WHEN a password change is successful, THE Password_Service SHALL return a 200 status with a success confirmation.
6. THE Password_Service SHALL allow users of all roles (ADMIN, HEAD_COACH, ASSISTANT_COACH, STUDENT) to change their own password.

### Requirement 2: Administrative Password Reset

**User Story:** As a HEAD_COACH or ADMIN, I want to reset a coach's password directly without knowing their current password, so that I can help coaches who are locked out or need credential updates.

#### Acceptance Criteria

1. WHEN a user with the HEAD_COACH role submits a password reset for a Target_User, THE Password_Service SHALL verify that the Target_User belongs to the same center as the HEAD_COACH.
2. WHEN a user with the ADMIN role submits a password reset for a Target_User, THE Password_Service SHALL allow the reset for any user regardless of center.
3. WHEN an authorized reset request includes a valid new password, THE Password_Service SHALL update the Target_User's password hash directly without requiring the Target_User's current password.
4. IF a HEAD_COACH attempts to reset the password of a user outside their center, THEN THE Password_Service SHALL reject the request with a 403 status.
5. IF a user without ADMIN or HEAD_COACH role attempts an administrative password reset, THEN THE Password_Service SHALL reject the request with a 403 status.
6. THE Password_Service SHALL enforce the same minimum 8-character length requirement on the new password provided during an administrative reset.
7. WHEN an administrative password reset is successful, THE Password_Service SHALL return the new password in the response so the admin can communicate it to the Target_User.

### Requirement 3: Email-Based Forgot Password

**User Story:** As a user who has forgotten my password, I want to request a password reset link sent to my registered email, so that I can regain access to my account without admin intervention.

#### Acceptance Criteria

1. WHEN an unauthenticated user submits a forgot-password request with a registered email address, THE Password_Service SHALL generate a Reset_Token and store it in the Token_Store.
2. WHEN a Reset_Token is generated, THE Email_Service SHALL send an email to the user's registered address containing a reset link with the token.
3. THE Password_Service SHALL set the Reset_Token expiration to 1 hour from the time of generation.
4. WHEN a user submits a new password with a valid, non-expired Reset_Token, THE Password_Service SHALL update the user's password hash and invalidate the token.
5. IF a user submits a new password with an expired Reset_Token, THEN THE Password_Service SHALL reject the request with a 400 status and a "Token expired" error message.
6. IF a user submits a new password with an invalid or already-used Reset_Token, THEN THE Password_Service SHALL reject the request with a 400 status and a "Invalid token" error message.
7. WHEN a forgot-password request is submitted with an email that does not match any user, THE Password_Service SHALL return a 200 status without sending an email, to prevent email enumeration.
8. THE Password_Service SHALL invalidate all existing Reset_Tokens for a user when a new forgot-password request is submitted for that user.
9. THE Password_Service SHALL store Reset_Tokens as hashed values in the Token_Store to prevent token theft from database access.

### Requirement 4: Password Reset Token Storage

**User Story:** As a system operator, I want reset tokens stored securely with proper expiration tracking, so that the forgot-password flow is resistant to abuse.

#### Acceptance Criteria

1. THE Token_Store SHALL contain columns for: id, user_id, token_hash, expires_at, used_at, and created_at.
2. THE Token_Store SHALL enforce a foreign key relationship between user_id and the users table.
3. WHEN a Reset_Token is used successfully, THE Password_Service SHALL record the current timestamp in the used_at column.
4. THE Password_Service SHALL treat a token as invalid if used_at is not null, regardless of expiration time.

### Requirement 5: Password Validation Rules

**User Story:** As a platform operator, I want consistent password validation across all flows, so that users always set sufficiently strong passwords.

#### Acceptance Criteria

1. THE Password_Service SHALL enforce a minimum password length of 8 characters across all password change and reset flows.
2. THE Password_Service SHALL enforce a maximum password length of 128 characters to prevent denial-of-service via bcrypt processing of extremely long inputs.
3. IF a submitted password is shorter than 8 characters or longer than 128 characters, THEN THE Password_Service SHALL reject the request with a 400 status and a descriptive validation error.
