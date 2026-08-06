# Requirements Document

## Introduction

This document specifies requirements for adding a Multi-Center Admin system to the ShuttleCoach platform. The feature introduces an ADMIN role that manages multiple coaching centers, each operating as an independent tenant with its own HEAD_COACH, ASSISTANT_COACHes, students, batches, and all associated data. Existing single-center data must be migrated to a default center for backward compatibility.

## Glossary

- **Platform**: The ShuttleCoach application comprising the React SPA frontend and Express/PostgreSQL API backend
- **Admin**: A user with the ADMIN role who manages multiple coaching centers across the platform
- **Center**: A coaching center entity representing a physical training location with its own staff, students, and data
- **Head_Coach**: A user with the HEAD_COACH role assigned to manage a single center
- **Assistant_Coach**: A user with the ASSISTANT_COACH role working within a single center
- **Tenant**: A logical data boundary scoped to a single center; all center data is isolated within its tenant
- **Center_ID**: A UUID foreign key column added to tenant-scoped tables to enforce data isolation
- **Default_Center**: The center automatically created during migration to hold all pre-existing data
- **Subscription**: The activation status and plan tier associated with a center
- **JWT_Token**: The JSON Web Token used for authentication, extended to include center_id for tenant context
- **Auth_Middleware**: The Express middleware responsible for authentication and authorization, extended to enforce tenant scoping

## Requirements

### Requirement 1: ADMIN Role Addition

**User Story:** As a platform owner, I want an ADMIN role that sits above all centers, so that I can manage the entire multi-center operation from a single account.

#### Acceptance Criteria

1. THE Platform SHALL support a fourth user role value of ADMIN in the user_role enum
2. WHEN an ADMIN user authenticates, THE Platform SHALL issue a JWT_Token that identifies the user as ADMIN without a center_id scope
3. WHEN a HEAD_COACH, ASSISTANT_COACH, or STUDENT authenticates, THE Platform SHALL issue a JWT_Token that includes the user's associated center_id
4. THE Auth_Middleware SHALL grant ADMIN users access to all platform routes without center_id scoping restrictions

### Requirement 2: Center Entity Management

**User Story:** As an Admin, I want to create and manage coaching centers, so that each physical location operates as an independent unit.

#### Acceptance Criteria

1. THE Platform SHALL store each Center with the following attributes: id (UUID), name (VARCHAR 100), location (VARCHAR 200), contact_phone (VARCHAR 20), contact_email (VARCHAR 100), logo_url (TEXT), is_active (BOOLEAN), created_at (TIMESTAMP), and updated_at (TIMESTAMP)
2. WHEN an ADMIN submits a create-center request with valid data, THE Platform SHALL create a new Center record and return its id
3. WHEN an ADMIN submits an update-center request, THE Platform SHALL update the specified Center attributes
4. WHEN a non-ADMIN user attempts to create or update a Center, THE Platform SHALL reject the request with a 403 status code
5. THE Platform SHALL enforce uniqueness on Center name

### Requirement 3: Head Coach Assignment

**User Story:** As an Admin, I want to assign a HEAD_COACH to each center, so that each center has a responsible manager.

#### Acceptance Criteria

1. WHEN an ADMIN assigns a HEAD_COACH to a Center, THE Platform SHALL update the Center record with the head_coach_id and update the user's center_id
2. WHEN an ADMIN attempts to assign a HEAD_COACH who is already assigned to another active Center, THE Platform SHALL reject the request with a conflict error
3. WHEN a Center has no HEAD_COACH assigned, THE Platform SHALL display the Center as "unassigned" in the Admin dashboard
4. THE Platform SHALL allow an ADMIN to reassign a HEAD_COACH from one Center to another by first unassigning from the current Center

### Requirement 4: Multi-Tenant Data Isolation

**User Story:** As a platform owner, I want all existing data tables scoped by center, so that each center's data is completely isolated from other centers.

#### Acceptance Criteria

1. THE Platform SHALL add a center_id (UUID, NOT NULL, FK to centers.id) column to the following tables: users, batches, students, skill_assessments, fee_records, curriculum_plans, training_logs
2. THE Auth_Middleware SHALL extract center_id from the authenticated user's JWT_Token and inject it into all database queries for tenant-scoped tables
3. WHEN a non-ADMIN user performs a query, THE Platform SHALL filter results by the user's center_id automatically
4. WHEN an ADMIN user performs a query, THE Platform SHALL return results across all centers unless a specific center_id filter is provided
5. IF a request references a resource belonging to a different center_id than the authenticated user, THEN THE Platform SHALL reject the request with a 403 status code

### Requirement 5: Data Migration to Default Center

**User Story:** As a platform owner, I want all existing data migrated to a default center, so that the system remains functional after the multi-tenancy upgrade.

#### Acceptance Criteria

1. WHEN the migration runs, THE Platform SHALL create a Default_Center record with the name "Default Center" and is_active set to true
2. WHEN the migration runs, THE Platform SHALL set center_id on all existing rows in tenant-scoped tables to the Default_Center's id
3. WHEN the migration runs, THE Platform SHALL assign the existing HEAD_COACH user (if exactly one exists) as the Default_Center's head_coach_id
4. THE Platform SHALL execute the migration as a single database transaction to ensure atomicity
5. AFTER migration completes, THE Platform SHALL verify that zero rows exist with a NULL center_id in tenant-scoped tables

### Requirement 6: Center Subscription and Activation Management

**User Story:** As an Admin, I want to activate or deactivate centers and manage their subscription status, so that I can control which centers are operational.

#### Acceptance Criteria

1. WHEN an ADMIN sets a Center's is_active to false, THE Platform SHALL prevent all non-ADMIN logins for users associated with that Center
2. WHEN a user associated with an inactive Center attempts to authenticate, THE Platform SHALL return a 403 status with the message "Center is currently inactive"
3. WHEN an ADMIN reactivates a Center by setting is_active to true, THE Platform SHALL restore login access for all users associated with that Center
4. THE Platform SHALL store subscription metadata on each Center including plan_type (VARCHAR 50) and subscription_expires_at (TIMESTAMP)
5. WHILE a Center's subscription_expires_at is in the past, THE Platform SHALL treat that Center as inactive

### Requirement 7: Admin Aggregate Dashboard

**User Story:** As an Admin, I want to view aggregate statistics across all centers, so that I can monitor overall platform health.

#### Acceptance Criteria

1. WHEN an ADMIN requests the dashboard view, THE Platform SHALL display the total number of active centers, total students, total coaches, and total revenue across all centers
2. WHEN an ADMIN requests the dashboard view, THE Platform SHALL display per-center summary cards showing center name, student count, coach count, and monthly revenue
3. WHEN an ADMIN selects a specific Center from the dashboard, THE Platform SHALL navigate to a detail view showing that Center's full statistics
4. THE Platform SHALL compute aggregate statistics using database-level aggregation queries grouped by center_id

### Requirement 8: Center-Scoped API Routes

**User Story:** As a developer, I want all existing API routes to respect center scoping, so that the multi-tenant architecture is enforced at the API layer.

#### Acceptance Criteria

1. THE Platform SHALL add a tenant-scoping middleware that runs after authentication and before route handlers on all tenant-scoped routes
2. WHEN the tenant-scoping middleware processes a request from a non-ADMIN user, THE Platform SHALL attach the user's center_id to the request context for use in database queries
3. WHEN the tenant-scoping middleware processes a request from an ADMIN user with a center_id query parameter, THE Platform SHALL use that parameter for scoping
4. WHEN the tenant-scoping middleware processes a request from an ADMIN user without a center_id parameter, THE Platform SHALL allow unscoped access to all center data
5. IF a route handler produces a database query without center_id filtering for a non-ADMIN user, THEN THE Platform SHALL reject the query at the data access layer

### Requirement 9: Frontend Role-Based Navigation for Admin

**User Story:** As an Admin, I want a dedicated admin interface with navigation to center management, so that I can perform administrative tasks efficiently.

#### Acceptance Criteria

1. WHEN an ADMIN user authenticates, THE Platform SHALL redirect to the /admin/dashboard route
2. THE Platform SHALL render an Admin navigation layout with links to: Dashboard, Centers, and Settings
3. WHEN an ADMIN navigates to /admin/centers, THE Platform SHALL display a list of all centers with their status and head coach assignment
4. THE Platform SHALL protect all /admin/* routes with a ProtectedRoute component that allows only the ADMIN role
5. WHEN a non-ADMIN user navigates to an /admin/* route, THE Platform SHALL redirect to the /access-denied page

### Requirement 10: Backward Compatibility for Existing Roles

**User Story:** As an existing HEAD_COACH or ASSISTANT_COACH, I want my workflows to remain unchanged after the multi-tenancy upgrade, so that my daily operations are not disrupted.

#### Acceptance Criteria

1. AFTER migration, WHEN a HEAD_COACH authenticates, THE Platform SHALL scope all data access to the user's assigned center_id transparently
2. AFTER migration, THE Platform SHALL preserve all existing route paths (/dashboard, /students, /fees, /curriculum, etc.) and their role restrictions unchanged
3. THE Platform SHALL not require any existing HEAD_COACH or ASSISTANT_COACH user to take additional action after the migration to continue using the platform
4. WHEN an existing HEAD_COACH accesses the /coaches route, THE Platform SHALL display only coaches belonging to the same center_id
