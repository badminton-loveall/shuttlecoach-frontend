# Requirements Document

## Introduction

This feature replaces the current single-center/single-role user model with a multi-center membership system. A user can belong to multiple centers, each with an independent role (e.g., Student at Center A, Assistant Coach at Center B). The active center is selected via a header switcher, which reloads all page content and permissions according to the per-center role. Additionally, the admin panel gains center-slug management, invite/password-reset capabilities for head coaches, and a slug-change-request approval workflow.

## Glossary

- **Super_Admin**: The platform-wide administrator (role = ADMIN) who manages all centers from the admin panel
- **Center_Admin**: The head coach of a center (role = HEAD_COACH for that center) who administers center-level settings
- **User_Center_Membership**: A record associating a user with a specific center and a specific role at that center
- **Active_Center**: The currently selected center in the header switcher, which determines the user's effective role and data scope
- **Center_Switcher**: The header UI component that displays the active center name and allows switching between centers
- **Slug_Change_Request**: A pending request from a head coach to change their center's URL slug, requiring Super_Admin approval
- **Center_ID_List**: The ordered list of center IDs derived from a user's memberships; the first value is the primary/default center

## Requirements

### Requirement 1: Multi-Center Membership Data Model

**User Story:** As a Super_Admin, I want users to belong to multiple centers with different roles at each center, so that one person can participate across centers without needing multiple accounts.

#### Acceptance Criteria

1. THE System SHALL store User_Center_Membership records associating a user ID, a center ID, and a role for that center
2. WHEN a user is added to a center, THE System SHALL create a User_Center_Membership record with the specified role
3. IF a User_Center_Membership record already exists for the same user ID, center ID, and role combination, THEN THE System SHALL reject the duplicate addition and return an error indicating the membership already exists
4. THE System SHALL allow a single user to hold different roles at different centers simultaneously, up to a maximum of 20 center memberships per user
5. WHEN a user logs in, THE System SHALL set the Active_Center to the center with the earliest-created membership in the user's Center_ID_List
6. IF a User_Center_Membership record is removed, THEN THE System SHALL revoke all permissions for that user at the specified center
7. IF the removed User_Center_Membership corresponds to the user's current Active_Center, THEN THE System SHALL reassign the Active_Center to the center with the next earliest-created membership, or leave Active_Center unset if no memberships remain

### Requirement 2: Center Switcher in Header

**User Story:** As a user belonging to multiple centers, I want to switch my active center from the application header, so that I can work in the context of different centers without logging out.

#### Acceptance Criteria

1. WHILE a user is authenticated and belongs to more than one center, THE Center_Switcher SHALL display the Active_Center name in the application header with a dropdown toggle
2. WHEN the user selects a different center from the Center_Switcher, THE System SHALL reload the entire page content scoped to the newly selected center within 2 seconds of selection
3. WHEN the user selects a different center from the Center_Switcher, THE System SHALL update the user's effective role and permissions to match the User_Center_Membership for the selected center
4. WHILE a user belongs to only one center, THE Center_Switcher SHALL display the center name without a dropdown toggle
5. THE Center_Switcher SHALL persist the selected Active_Center in localStorage across page navigations within the same session
6. IF the center switch operation fails due to a network error, THEN THE System SHALL display a transient error notification and retain the previously selected Active_Center
7. WHEN the user's session starts, THE Center_Switcher SHALL default to the center stored in localStorage if it matches a valid membership, otherwise fall back to the first center in the Center_ID_List

### Requirement 3: Per-Center Role and Permission Resolution

**User Story:** As a user with different roles across centers, I want the application permissions to change based on my selected center, so that I see only the features and data appropriate to my role at that center.

#### Acceptance Criteria

1. WHEN a center is selected via the Center_Switcher, THE System SHALL resolve the user's role from the User_Center_Membership for that center and apply it as the effective role within 1 second of selection
2. WHEN the Active_Center changes, THE System SHALL re-evaluate all route guards and navigation items based on the resolved role, hiding navigation items for routes the role cannot access and enforcing route guards before rendering protected pages
3. WHEN the Active_Center changes, THE System SHALL scope all subsequent API requests to the selected center ID until the Active_Center changes again or the session ends
4. IF a user navigates to a route not permitted by their role at the Active_Center, THEN THE System SHALL redirect the user to the Access Denied page without modifying any previously saved data
5. WHEN the user logs in, THE System SHALL default permissions to the role defined for the first center in the Center_ID_List
6. IF the Active_Center changes and the user is currently viewing a route not permitted by their new resolved role, THEN THE System SHALL redirect the user to the default permitted route for the new role
7. IF a center is selected and no User_Center_Membership record exists for the user at that center, THEN THE System SHALL display an error message indicating the membership is invalid and retain the previously Active_Center

### Requirement 4: Admin Panel — Center Slug Display and Edit

**User Story:** As a Super_Admin, I want to view and edit the center slug on the Center Detail page, so that I can manage branded login URLs without running database queries.

#### Acceptance Criteria

1. THE Admin_Center_Detail_Page SHALL display the current center slug as an editable field in the Center Information section
2. WHEN the Super_Admin edits the slug field and saves, THE System SHALL validate the slug format (lowercase alphanumeric and hyphens only, 3–50 characters, must start and end with an alphanumeric character, and must not contain consecutive hyphens)
3. WHEN the Super_Admin saves a valid slug, THE System SHALL persist the updated slug and display a success confirmation without requiring a page reload
4. IF the submitted slug is already in use by another center, THEN THE System SHALL display an error message indicating the slug is not unique and retain the submitted value in the field
5. IF the submitted slug fails format validation, THEN THE System SHALL display an error message describing the format requirements and retain the submitted value in the field
6. IF the user does not have the Super_Admin role, THEN THE Admin_Center_Detail_Page SHALL display the slug as read-only

### Requirement 5: Admin Panel — Center Admin Invite and Password Reset

**User Story:** As a Super_Admin, I want to send an invite email and password reset link to a center's head coach from the admin panel, so that I can onboard and support center admins without manual coordination.

#### Acceptance Criteria

1. THE Admin_Center_Detail_Page SHALL display the head coach's email address instead of the user ID in the Head Coach section
2. WHEN the Super_Admin clicks "Send Invite", THE System SHALL send an invite email to the head coach's registered email address
3. WHEN the Super_Admin clicks "Send Password Reset", THE System SHALL generate a password reset token and send a reset link to the head coach's email address
4. IF no head coach is assigned to the center, THEN THE System SHALL disable the invite and password reset actions
5. IF the head coach has no email address on file, THEN THE System SHALL display a warning indicating that email actions are unavailable

### Requirement 6: Slug Change Request Workflow

**User Story:** As a Center_Admin, I want to request a change to my center's URL slug, so that I can update my branded login URL when my center rebrands.

#### Acceptance Criteria

1. THE Center_Admin_Settings_Page SHALL display the current center slug as a read-only field with a "Request Change" action
2. WHEN the Center_Admin submits a slug change request, THE System SHALL validate the requested slug format (lowercase alphanumeric and hyphens, 3–50 characters) and verify the requested slug is not already in use by another center
3. IF the submitted slug fails format validation or is already in use by another center, THEN THE System SHALL reject the submission, display an error message indicating the specific failure reason (invalid format or slug already taken), and retain the entered value in the form
4. IF the Center_Admin already has a Slug_Change_Request with status PENDING, THEN THE System SHALL prevent submission of a new request and display a message indicating a pending request already exists
5. WHEN a valid slug change request is submitted and no pending request exists, THE System SHALL create a Slug_Change_Request record with status PENDING containing the requested slug value, requesting center identifier, and submission timestamp
6. WHILE the count of pending Slug_Change_Requests is greater than zero, THE Admin_Dashboard SHALL display a notification badge indicating the count of pending Slug_Change_Requests
7. WHEN the Super_Admin approves a Slug_Change_Request, THE System SHALL verify the requested slug is still not in use, update the center's slug to the requested value, mark the request as APPROVED, and notify the requesting Center_Admin of the approval
8. IF the Super_Admin attempts to approve a Slug_Change_Request but the requested slug has become in use by another center since submission, THEN THE System SHALL prevent approval and display a conflict error indicating the slug is no longer available
9. WHEN the Super_Admin rejects a Slug_Change_Request, THE System SHALL mark the request as REJECTED without changing the center slug and notify the requesting Center_Admin of the rejection

### Requirement 7: Login Flow Adaptation for Multi-Center Users

**User Story:** As a user with memberships at multiple centers, I want the login flow to resolve my default center and load its context, so that I land on the correct dashboard immediately after authentication.

#### Acceptance Criteria

1. WHEN a multi-center user logs in without a center slug in the URL, THE System SHALL set the Active_Center to the first center in the user's Center_ID_List and resolve the user's role from the corresponding User_Center_Membership
2. WHEN a multi-center user logs in via a branded URL (with center slug), IF the user has a User_Center_Membership at that center, THEN THE System SHALL set the Active_Center to the center matching the slug
3. IF a user logs in via a branded URL but has no User_Center_Membership at that center, THEN THE System SHALL reject login with an error message indicating the user does not belong to the specified center
4. WHEN login succeeds for a multi-center user, THE System SHALL include all center memberships and their associated roles in the authentication response
5. WHEN login succeeds, THE System SHALL issue a JWT token containing the Active_Center ID and the user's role at that center, with a token expiration of 24 hours
6. WHEN a single-center user logs in without a center slug in the URL, THE System SHALL set the Active_Center to their sole center and resolve permissions from their User_Center_Membership at that center
