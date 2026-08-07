# Requirements Document

## Introduction

Center-branded login enables each coaching center in ShuttleCoach to have its own dedicated login page at `/login/:centerSlug`. The branded page displays the center's name and logo instead of generic LoveAll branding, creating a white-labeled experience for coaches and students accessing their specific center.

## Glossary

- **Center**: A badminton coaching facility registered in ShuttleCoach, stored in the `centers` table
- **Slug**: A URL-safe, unique, lowercase identifier derived from a center's name (e.g., "shuttle-stars-academy")
- **Branded_Login_Page**: The center-specific login page rendered at `/login/:centerSlug` showing the center's name and logo
- **Generic_Login_Page**: The existing login page at `/login` with default LoveAll branding
- **Center_Info_API**: The public API endpoint `GET /api/centers/:slug/info` that returns center display data
- **Login_API**: The authentication endpoint `POST /api/auth/login`
- **Center_User**: A user with role HEAD_COACH, ASSISTANT_COACH, or STUDENT who belongs to a specific center via `center_id`

## Requirements

### Requirement 1: Center Slug Column

**User Story:** As a platform operator, I want each center to have a unique URL-safe slug, so that centers can be identified in URLs for branded login pages.

#### Acceptance Criteria

1. THE Database SHALL store a `slug` column on the `centers` table that is unique and not null
2. THE Database SHALL enforce that slug values contain only lowercase letters, numbers, and hyphens
3. WHEN a center is created without a slug, THE System SHALL auto-generate a slug from the center name by lowercasing, replacing spaces with hyphens, and removing special characters
4. THE Database SHALL enforce uniqueness on the `slug` column via a unique index

### Requirement 2: Public Center Info Endpoint

**User Story:** As a frontend application, I want to fetch a center's display information by slug without authentication, so that the branded login page can render before the user logs in.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/centers/:slug/info`, THE Center_Info_API SHALL return the center's name, logo URL, and slug without requiring authentication
2. WHEN a GET request is made with a slug that does not exist, THE Center_Info_API SHALL return a 404 status with an error message
3. WHEN a GET request is made with a slug for an inactive center, THE Center_Info_API SHALL return a 404 status with an error message
4. THE Center_Info_API SHALL return only public display fields (name, logo_url, slug) and exclude sensitive data

### Requirement 3: Branded Login Page Route

**User Story:** As a center user, I want to access a login page branded with my center's name and logo, so that I have a familiar and professional entry point to the system.

#### Acceptance Criteria

1. WHEN a user navigates to `/login/:centerSlug`, THE Branded_Login_Page SHALL fetch center info from the Center_Info_API and display the center's name and logo
2. WHILE the center info is loading, THE Branded_Login_Page SHALL display a loading indicator
3. THE Branded_Login_Page SHALL display the center's name in place of the default "LoveAll" branding text
4. THE Branded_Login_Page SHALL display the center's logo in place of the default branding when a logo URL is available
5. WHEN a center has no logo URL, THE Branded_Login_Page SHALL display the center's name as the primary brand element

### Requirement 4: Center-Scoped Login Validation

**User Story:** As a center administrator, I want users logging in from my center's URL to be validated against that center, so that only authorized users can access my center's system.

#### Acceptance Criteria

1. WHEN a user submits login credentials from `/login/:centerSlug`, THE Login_API SHALL accept an optional `centerSlug` parameter in the request body
2. WHEN a `centerSlug` is provided and the authenticated user's `center_id` does not match the center identified by the slug, THE Login_API SHALL return a 403 status with the message "You do not belong to this center"
3. WHEN a `centerSlug` is provided and the authenticated user has the ADMIN role, THE Login_API SHALL allow the login regardless of center association
4. WHEN no `centerSlug` is provided, THE Login_API SHALL authenticate the user without center validation (backward-compatible behavior)

### Requirement 5: Generic Login Backward Compatibility

**User Story:** As an ADMIN user, I want the generic login page to continue working, so that I can access the system without needing a center-specific URL.

#### Acceptance Criteria

1. THE Generic_Login_Page SHALL remain accessible at `/login` with the existing LoveAll branding
2. WHEN any user logs in from the Generic_Login_Page, THE Login_API SHALL authenticate without center validation
3. WHEN an ADMIN user navigates to `/login/:centerSlug`, THE Branded_Login_Page SHALL allow login and authenticate successfully

### Requirement 6: Invalid Center Slug Handling

**User Story:** As a user, I want to see a clear error when I visit an invalid center login URL, so that I understand the page is not available.

#### Acceptance Criteria

1. WHEN the Center_Info_API returns a 404 for the given slug, THE Branded_Login_Page SHALL display a "Center not found" error page
2. THE "Center not found" error page SHALL include a link to the generic login page at `/login`
3. WHEN a center slug contains invalid characters, THE Branded_Login_Page SHALL display the "Center not found" error page

### Requirement 7: Head Coach Slug Management

**User Story:** As a HEAD_COACH, I want to set or update my center's slug from the settings page, so that I can customize the login URL for my center.

#### Acceptance Criteria

1. WHEN a HEAD_COACH accesses the center settings page, THE System SHALL display the current slug value in an editable field
2. WHEN a HEAD_COACH submits an updated slug, THE System SHALL validate that the slug contains only lowercase letters, numbers, and hyphens
3. WHEN a HEAD_COACH submits an updated slug, THE System SHALL validate that the slug is unique across all centers
4. IF a HEAD_COACH submits a slug that is already in use by another center, THEN THE System SHALL return an error message "This slug is already taken"
5. WHEN a HEAD_COACH submits a valid unique slug, THE System SHALL update the center's slug and return success
6. THE System SHALL restrict slug management to users with the HEAD_COACH or ADMIN role only
