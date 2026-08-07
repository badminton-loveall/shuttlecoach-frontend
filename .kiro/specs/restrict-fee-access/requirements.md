# Requirements Document

## Introduction

This feature restricts fee data access so that only center administrators (HEAD_COACH and ADMIN roles) can view and manage student fee details. ASSISTANT_COACH users will be completely denied access to all fee-related API endpoints and frontend pages.

## Glossary

- **Fee_System**: The subsystem responsible for managing student fee records, including creation, listing, payment marking, and waiving.
- **API_Fee_Router**: The Express router that handles all `/api/fees` HTTP endpoints and applies role-based authorization middleware.
- **Frontend_Fee_Route**: The React route at `/fees` that renders the FeesPage component, guarded by the ProtectedRoute component.
- **ASSISTANT_COACH**: A coaching staff role with limited privileges; assists with training but does not manage administrative or financial data.
- **HEAD_COACH**: The primary coach role for a center with full access to student management, fee records, and center operations.
- **ADMIN**: The platform administrator role with access to center management and all operational data.
- **ProtectedRoute**: The React component that checks the authenticated user's role against an allowedRoles list before rendering child components.

## Requirements

### Requirement 1: Remove ASSISTANT_COACH from API Fee Listing Authorization

**User Story:** As a center admin, I want assistant coaches to be blocked from querying fee records via the API, so that fee data remains confidential to authorized roles only.

#### Acceptance Criteria

1. WHEN an ASSISTANT_COACH user sends a GET request to `/api/fees`, THE API_Fee_Router SHALL respond with HTTP 403 Forbidden.
2. THE API_Fee_Router SHALL authorize the GET `/api/fees` endpoint for HEAD_COACH and ADMIN roles only.
3. WHEN an unauthenticated user sends a GET request to `/api/fees`, THE API_Fee_Router SHALL respond with HTTP 401 Unauthorized.

### Requirement 2: Remove ASSISTANT_COACH Role-Based Filtering Logic from Fee Controller

**User Story:** As a developer, I want to remove the ASSISTANT_COACH-specific query logic from the fee controller, so that the codebase does not contain dead code paths for a denied role.

#### Acceptance Criteria

1. THE Fee_System SHALL NOT contain role-based query filtering logic for the ASSISTANT_COACH role in the listFees controller.
2. THE Fee_System SHALL retain role-based query filtering for the STUDENT role to allow students to view their own fees.

### Requirement 3: Restrict Frontend Fee Route to Authorized Roles

**User Story:** As a center admin, I want the fees page to be inaccessible to assistant coaches in the UI, so that they cannot navigate to or view fee information.

#### Acceptance Criteria

1. THE Frontend_Fee_Route SHALL restrict the `/fees` path to HEAD_COACH and ADMIN roles via the ProtectedRoute allowedRoles configuration.
2. WHEN an ASSISTANT_COACH user navigates to `/fees`, THE ProtectedRoute SHALL redirect the user to the access-denied page.

### Requirement 4: Remove Fee Navigation Link for ASSISTANT_COACH

**User Story:** As a center admin, I want the fee menu item hidden from assistant coaches, so that they are not presented with navigation options they cannot access.

#### Acceptance Criteria

1. WHILE a user is authenticated with the ASSISTANT_COACH role, THE Fee_System SHALL NOT display the fees navigation link in the sidebar or menu.
2. WHILE a user is authenticated with the HEAD_COACH or ADMIN role, THE Fee_System SHALL display the fees navigation link in the sidebar or menu.
