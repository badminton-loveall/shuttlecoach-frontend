# Requirements Document

## Introduction

The Center Owner email in the Admin Panel Center Detail page is currently read-only. To change it, an admin must open the full Center Information edit form. This feature adds inline editing of the owner email directly inside the "Center Owner" card — a single-click interaction that saves the admin from context-switching to the full form.

Because `centers.contact_email` doubles as the owner's login credential (`users.email` / `users.username`), saving a new email must cascade atomically to both tables. The "Resend Invite" button must subsequently send to the updated address.

## Glossary

- **Admin_Panel**: The React/Vite/TypeScript SPA used by system administrators.
- **CenterDetailPage**: The admin page at `/admin/centers/:id` that displays and manages a single center.
- **Center_Owner_Card**: The "Center Owner" section within `CenterDetailPage` that shows the owner email and action buttons.
- **Inline_Email_Editor**: The new edit control (input + Save/Cancel buttons) that replaces the static email text when the admin activates edit mode.
- **PATCH_Endpoint**: The existing `PATCH /admin/centers/:id` Express handler in `src/controllers/admin/centers.ts`.
- **contact_email**: The single canonical email stored in `centers.contact_email`, used for both center contact and owner login.
- **Owner_User**: The row in `users` whose `id` matches `centers.head_coach_id` for the given center.

---

## Requirements

### Requirement 1: Inline Email Edit Entry Point

**User Story:** As an admin, I want to edit the owner email directly in the Center Owner card, so that I can change it without opening the full Center Information form.

#### Acceptance Criteria

1. WHEN the Center Owner card is rendered and `center.contactEmail` is non-empty, THE `Admin_Panel` SHALL display an edit icon or "Edit email" button adjacent to the email text.
2. WHEN the admin clicks the edit trigger, THE `Inline_Email_Editor` SHALL replace the static email text with a pre-filled email `<input>` containing the current `contact_email` value.
3. WHILE the `Inline_Email_Editor` is open, THE `Admin_Panel` SHALL display "Save" and "Cancel" action buttons alongside the input.
4. WHILE the `Inline_Email_Editor` is open, THE `Admin_Panel` SHALL disable the "Resend Invite" and "Send Password Reset" buttons.
5. WHEN the admin clicks "Cancel", THE `Admin_Panel` SHALL close the `Inline_Email_Editor` and restore the original email text without making any API call.

---

### Requirement 2: Email Format Validation

**User Story:** As an admin, I want the system to validate the email format before saving, so that invalid addresses cannot be persisted.

#### Acceptance Criteria

1. WHEN the admin clicks "Save" and the input value is not a valid RFC 5322 email address, THE `Admin_Panel` SHALL display an inline validation error message within the Center Owner card and SHALL NOT call the API.
2. WHEN the admin clicks "Save" and the input value is empty or composed entirely of whitespace, THE `Admin_Panel` SHALL display an inline validation error within the Center Owner card and SHALL NOT call the API.
3. WHEN the admin corrects the input and clicks "Save" again, THE `Admin_Panel` SHALL clear the previous validation error before attempting the save.

---

### Requirement 3: Saving the New Email — Frontend

**User Story:** As an admin, I want the save action to persist the new email and reflect it immediately in the UI, so that I have confidence the change has taken effect.

#### Acceptance Criteria

1. WHEN the admin clicks "Save" with a valid email, THE `Admin_Panel` SHALL call `PATCH /admin/centers/:id` with `{ contactEmail: "<new_email>" }`.
2. WHILE the save request is in flight, THE `Admin_Panel` SHALL show a loading indicator on the "Save" button and disable both "Save" and "Cancel".
3. WHEN the API responds with HTTP 200, THE `Admin_Panel` SHALL close the `Inline_Email_Editor` and display the new email as static text.
4. WHEN the API responds with HTTP 200, THE `Admin_Panel` SHALL re-enable the "Resend Invite" and "Send Password Reset" buttons, which SHALL now target the new email.
5. WHEN the API responds with an error (HTTP 4xx or 5xx), THE `Admin_Panel` SHALL display the error message returned by the API within the Center Owner card and SHALL keep the `Inline_Email_Editor` open.

---

### Requirement 4: API Cascade Update

**User Story:** As a system administrator, I want saving a new contact email to also update the linked owner's login credentials, so that the owner can continue to log in with their new email address.

#### Acceptance Criteria

1. WHEN `PATCH /admin/centers/:id` receives a `contactEmail` value that differs from the current `centers.contact_email`, THE `PATCH_Endpoint` SHALL update `centers.contact_email` to the new value.
2. WHEN `PATCH /admin/centers/:id` receives a `contactEmail` value and the center's `head_coach_id` is non-null, THE `PATCH_Endpoint` SHALL also update `users.email` and `users.username` for the row whose `id` equals `head_coach_id`.
3. WHEN `PATCH /admin/centers/:id` receives a `contactEmail` value and the center's `head_coach_id` is null, THE `PATCH_Endpoint` SHALL update only `centers.contact_email` and SHALL NOT attempt to update any `users` row.
4. IF the `users` table update fails after `centers.contact_email` has already been written, THEN THE `PATCH_Endpoint` SHALL roll back the `centers.contact_email` update and return HTTP 500 with a descriptive error message.
5. WHEN the cascade update completes successfully, THE `PATCH_Endpoint` SHALL return HTTP 200 with the updated center object (same response shape as today).

---

### Requirement 5: Post-Save "Resend Invite" Targets New Email

**User Story:** As an admin, I want the "Resend Invite" button to use the updated email after a successful save, so that the invite goes to the correct address.

#### Acceptance Criteria

1. WHEN the admin successfully saves a new owner email, THE `Admin_Panel` SHALL refresh or update its local center state so that `center.contactEmail` reflects the new value.
2. WHEN the admin subsequently clicks "Resend Invite", THE `Admin_Panel` SHALL trigger `POST /admin/centers/:id/invite-coach`, which already reads `contact_email` from the database — so no additional frontend change is needed beyond AC 5.1.
