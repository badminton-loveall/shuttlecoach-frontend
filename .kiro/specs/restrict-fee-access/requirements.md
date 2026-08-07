# Requirements Document

## Introduction

This feature converts the fees functionality into a togglable module controlled at the center level. The HEAD_COACH (center admin) can grant or revoke fee access to individual coaches (HEAD_COACH or ASSISTANT_COACH) within their center. ADMIN and HEAD_COACH roles always retain implicit fee access. ASSISTANT_COACH users receive fee access only when explicitly granted by the HEAD_COACH. The system enforces this permission across the API, frontend routing, and navigation visibility.

## Glossary

- **Fee_Module**: The subsystem responsible for managing student fee records, now governed by a per-user permission toggle that determines which coaches can access fee data.
- **Fee_Permission_Service**: The backend service layer that evaluates whether a given user has fee access based on their role and the `can_access_fees` flag stored in the database.
- **Permission_Management_API**: The set of API endpoints that allow a HEAD_COACH to view and toggle fee access for coaches in their center.
- **Permission_Toggle_UI**: The frontend interface within the coaches management area where the HEAD_COACH can grant or revoke fee access per coach.
- **HEAD_COACH**: The primary coach and center administrator role with full access to student management, fee records, center operations, and permission management. HEAD_COACH always has implicit fee access.
- **ASSISTANT_COACH**: A coaching staff role with limited privileges. ASSISTANT_COACH users receive fee access only when explicitly granted by the HEAD_COACH.
- **ADMIN**: The platform administrator role with access to all center data and operations. ADMIN always has implicit fee access.
- **STUDENT**: A student enrolled at a center who can view only their own fee records. Students are not affected by the fee access toggle.
- **can_access_fees**: A boolean column on the users table indicating whether a coach has been granted fee access by the HEAD_COACH. This flag is only evaluated for ASSISTANT_COACH users.
- **ProtectedRoute**: The React component that checks the authenticated user's role and permissions before rendering child components.

## Requirements

### Requirement 1: Add Fee Access Permission Column to Users Table

**User Story:** As a platform developer, I want a per-user fee access flag in the database, so that the system can store and evaluate fee access permissions at the individual coach level.

#### Acceptance Criteria

1. THE Fee_Module SHALL store a `can_access_fees` boolean column on the users table with a default value of `false`.
2. THE Fee_Module SHALL treat the `can_access_fees` column as relevant only for users with the ASSISTANT_COACH role.
3. WHEN a new ASSISTANT_COACH user is created, THE Fee_Module SHALL set `can_access_fees` to `false` by default.

### Requirement 2: Implicit Fee Access for ADMIN and HEAD_COACH

**User Story:** As a center admin, I want ADMIN and HEAD_COACH users to always have fee access regardless of the toggle value, so that administrative roles are never locked out of fee management.

#### Acceptance Criteria

1. THE Fee_Permission_Service SHALL grant fee access to any user with the ADMIN role without evaluating the `can_access_fees` flag.
2. THE Fee_Permission_Service SHALL grant fee access to any user with the HEAD_COACH role without evaluating the `can_access_fees` flag.
3. WHEN a HEAD_COACH user requests fee data, THE Fee_Module SHALL serve the request regardless of the `can_access_fees` column value.

### Requirement 3: Conditional Fee Access for ASSISTANT_COACH

**User Story:** As a center admin, I want assistant coaches to access fee data only when I have explicitly granted them permission, so that I maintain control over who can view financial information.

#### Acceptance Criteria

1. WHEN an ASSISTANT_COACH user with `can_access_fees` set to `true` sends a request to a fee endpoint, THE Fee_Module SHALL serve the request.
2. WHEN an ASSISTANT_COACH user with `can_access_fees` set to `false` sends a request to a fee endpoint, THE Fee_Module SHALL respond with HTTP 403 Forbidden.
3. THE Fee_Permission_Service SHALL evaluate the `can_access_fees` flag for every fee-related API request made by an ASSISTANT_COACH user.

### Requirement 4: HEAD_COACH Can Toggle Fee Access for Coaches in Their Center

**User Story:** As a center admin, I want to grant or revoke fee access for individual coaches in my center, so that I can control who manages financial data on a per-person basis.

#### Acceptance Criteria

1. WHEN a HEAD_COACH sends a PATCH request to toggle fee access for a coach in the same center, THE Permission_Management_API SHALL update the `can_access_fees` flag for the target user.
2. THE Permission_Management_API SHALL restrict fee access toggling to coaches (HEAD_COACH or ASSISTANT_COACH) within the same center as the requesting HEAD_COACH.
3. IF a HEAD_COACH attempts to toggle fee access for a user in a different center, THEN THE Permission_Management_API SHALL respond with HTTP 403 Forbidden.
4. IF a HEAD_COACH attempts to toggle fee access for a non-existent user, THEN THE Permission_Management_API SHALL respond with HTTP 404 Not Found.
5. THE Permission_Management_API SHALL authorize the toggle endpoint for the HEAD_COACH role only.

### Requirement 5: List Coaches with Fee Access Status

**User Story:** As a center admin, I want to view all coaches in my center along with their fee access status, so that I can see at a glance who has fee permissions.

#### Acceptance Criteria

1. WHEN a HEAD_COACH sends a GET request to list coaches with fee permissions, THE Permission_Management_API SHALL return all coaches in the same center with their current `can_access_fees` value.
2. THE Permission_Management_API SHALL include the coach name, role, and `can_access_fees` flag in each response item.
3. THE Permission_Management_API SHALL scope the response to only coaches belonging to the requesting HEAD_COACH's center.

### Requirement 6: API Fee Endpoint Authorization with Permission Check

**User Story:** As a platform developer, I want all fee API endpoints to check the fee access permission before serving data, so that unauthorized coaches cannot access fee information.

#### Acceptance Criteria

1. WHEN a user sends a request to any fee endpoint, THE Fee_Module SHALL verify that the user has fee access before processing the request.
2. THE Fee_Module SHALL allow ADMIN and HEAD_COACH users to access all fee endpoints without permission checks on `can_access_fees`.
3. THE Fee_Module SHALL allow STUDENT users to access the fee listing endpoint (limited to their own records) without permission checks on `can_access_fees`.
4. IF an ASSISTANT_COACH user without fee access sends a request to any fee endpoint, THEN THE Fee_Module SHALL respond with HTTP 403 Forbidden and a descriptive error message.

### Requirement 7: Frontend Fee Route Access Based on Permission

**User Story:** As a center admin, I want the fees page to be accessible only to coaches with fee permission, so that the UI enforces the same access rules as the API.

#### Acceptance Criteria

1. WHILE a user is authenticated with the ASSISTANT_COACH role and has `can_access_fees` set to `true`, THE ProtectedRoute SHALL allow navigation to the `/fees` path.
2. WHILE a user is authenticated with the ASSISTANT_COACH role and has `can_access_fees` set to `false`, THE ProtectedRoute SHALL redirect the user to the access-denied page when navigating to `/fees`.
3. WHILE a user is authenticated with the HEAD_COACH or ADMIN role, THE ProtectedRoute SHALL allow navigation to the `/fees` path.

### Requirement 8: Frontend Fee Navigation Visibility Based on Permission

**User Story:** As a center admin, I want the fees menu item to be visible only to coaches who have fee access, so that coaches without permission do not see navigation options they cannot use.

#### Acceptance Criteria

1. WHILE a user is authenticated with the HEAD_COACH or ADMIN role, THE Fee_Module SHALL display the fees navigation link in the sidebar.
2. WHILE a user is authenticated with the ASSISTANT_COACH role and has `can_access_fees` set to `true`, THE Fee_Module SHALL display the fees navigation link in the sidebar.
3. WHILE a user is authenticated with the ASSISTANT_COACH role and has `can_access_fees` set to `false`, THE Fee_Module SHALL hide the fees navigation link from the sidebar.

### Requirement 9: Permission Toggle UI for HEAD_COACH

**User Story:** As a center admin, I want a user interface to manage fee access for my coaches, so that I can grant or revoke permissions without database intervention.

#### Acceptance Criteria

1. THE Permission_Toggle_UI SHALL display a list of all coaches in the HEAD_COACH's center with a toggle control for fee access.
2. WHEN the HEAD_COACH toggles fee access for a coach, THE Permission_Toggle_UI SHALL send the update to the Permission_Management_API and reflect the new state upon success.
3. IF the Permission_Management_API returns an error during toggle, THEN THE Permission_Toggle_UI SHALL display an error message and revert the toggle to the previous state.
4. THE Permission_Toggle_UI SHALL be accessible from the coaches management section of the application.

### Requirement 10: HEAD_COACH Participation in Coaches List

**User Story:** As a center admin who also coaches, I want to appear in the coaches list for my center, so that I can be assigned to batches and students like any other coach.

#### Acceptance Criteria

1. THE Fee_Module SHALL include the HEAD_COACH in the coaches list for their center when the HEAD_COACH has a user record associated with that center.
2. THE Fee_Module SHALL display the HEAD_COACH with their actual role label in the coaches list.
3. THE Permission_Toggle_UI SHALL show the HEAD_COACH in the coaches list but SHALL display the fee access toggle as always-on and non-editable for the HEAD_COACH role.
