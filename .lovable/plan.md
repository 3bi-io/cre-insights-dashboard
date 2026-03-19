

# Client-Level Application Field Configuration

## Overview
Allow admins to configure which fields appear on the detailed application form (`/apply/detailed`) on a per-client basis. Clients (non-admin users) cannot access or modify this configuration. When a driver opens the detailed application for a client's job, only the fields that client's admin has enabled will be shown.

## Database Changes

**New table: `client_application_fields`**
- `id` (uuid, PK)
- `client_id` (uuid, FK → clients, NOT NULL)
- `organization_id` (uuid, FK → organizations, NOT NULL)
- `field_key` (text, NOT NULL) — matches the `DetailedFormData` field names (e.g., `ssn`, `militaryService`, `employers`, `accidentHistory`)
- `enabled` (boolean, default true)
- `required` (boolean, default false)
- Unique constraint on `(client_id, field_key)`
- RLS: Only admin/super_admin in the same org can SELECT/INSERT/UPDATE/DELETE

**Seed with a DB function or default behavior**: If no rows exist for a client, all fields are shown (backward compatible). Admins can then selectively disable fields.

## Admin UI — Field Configuration Panel

**New component**: `ClientApplicationFieldsConfig` in `src/features/clients/components/`
- Accessible from the client edit dialog or a dedicated tab on the Clients page
- Shows a checklist of all detailed application field groups:
  - **Personal**: prefix, middleName, suffix, ssn, governmentId, dateOfBirth
  - **Contact**: secondaryPhone, preferredContactMethod, emergencyContact fields
  - **CDL**: cdlEndorsements, cdlExpirationDate, cdlState, drivingExperienceYears
  - **Experience**: employers (work history), accidentHistory, violationHistory, educationLevel
  - **Background**: militaryService fields, convictedFelony, workAuthorization
  - **Work Preferences**: canWorkWeekends, canWorkNights, willingToRelocate, salaryExpectations
  - **Medical**: medicalCardExpiration, hazmatEndorsement, passportCard, twicCard, dotPhysicalDate
- Each field group has toggles for "Visible" and "Required"
- Only users with admin/super_admin role see this config

**Hook**: `useClientApplicationFields` — CRUD operations against `client_application_fields`

## Applicant-Facing Changes

**Hook**: `useClientFieldConfig` (public/anonymous-safe)
- Takes `client_id` from `useApplyContext()`
- Fetches enabled fields via a SECURITY DEFINER function `get_client_application_fields(p_client_id uuid)` that returns the field config without requiring auth
- Returns a map of `{ [fieldKey]: { enabled, required } }`

**Form sections update**: Each detailed section component (`DetailedPersonalSection`, `DetailedExperienceSection`, etc.) receives a `fieldConfig` prop and conditionally renders fields based on `enabled` status. Required fields respect the `required` flag from config.

**`DetailedApplicationForm.tsx`**: Passes `fieldConfig` down to all step sections. Also updates `validateStep` in the hook to only validate fields that are both enabled and required.

## Security
- RLS on `client_application_fields` restricts write access to admin/super_admin within the same organization
- Public read access goes through a SECURITY DEFINER function only returning `field_key`, `enabled`, `required` — no org internals leaked
- Clients (non-admin users) have no write access

## Files to Create/Edit
1. **DB migration** — Create `client_application_fields` table, RLS policies, and `get_client_application_fields()` function
2. **`src/features/clients/components/ClientApplicationFieldsConfig.tsx`** — Admin toggle UI
3. **`src/features/clients/hooks/useClientApplicationFields.ts`** — Admin CRUD hook
4. **`src/hooks/useClientFieldConfig.ts`** — Public hook for applicant-facing form
5. **`src/components/apply/detailed/DetailedPersonalSection.tsx`** — Add field visibility checks
6. **`src/components/apply/detailed/DetailedContactSection.tsx`** — Add field visibility checks
7. **`src/components/apply/detailed/DetailedCDLSection.tsx`** — Add field visibility checks
8. **`src/components/apply/detailed/DetailedExperienceSection.tsx`** — Add field visibility checks
9. **`src/components/apply/detailed/DetailedBackgroundSection.tsx`** — Add field visibility checks
10. **`src/components/apply/detailed/DetailedApplicationForm.tsx`** — Fetch and pass field config
11. **`src/hooks/useDetailedApplicationForm.ts`** — Update validation to respect field config
12. **Client edit dialog or Clients page** — Add entry point to field config panel

