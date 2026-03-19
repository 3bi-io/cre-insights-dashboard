

# Add "Form Type" Enrichment Badge to Application Views

## Overview
Add a visual badge to application cards and table rows indicating whether the application contains only short-form data ("Quick") or has been enriched with the full detailed form ("Detailed"). No database changes needed — we determine this client-side by checking for fields only present in the detailed form.

## Detection Logic
Create a small utility function `getFormType(application)` that returns `'Quick' | 'Detailed'` by checking if any detailed-form-specific fields are populated:
- `employment_history` (has entries)
- `ssn`
- `date_of_birth`
- `emergency_contact_name`
- `convicted_felony`
- `military_service`
- `medical_card_expiration`

If any of these have non-null/non-empty values, the application is "Detailed". Otherwise "Quick".

## UI Changes

**Badge styling:**
- **Quick**: Subtle outline badge, neutral color (e.g., `bg-muted text-muted-foreground`)
- **Detailed**: Green-tinted badge (e.g., `bg-emerald-500/20 text-emerald-400`) with a checkmark icon

**Files to edit:**

1. **`src/utils/applicationHelpers.ts`** — Add `getFormType()` utility function
2. **`src/components/applications/ApplicationCard.tsx`** — Add form type badge next to the category badge (line ~101-103 area)
3. **`src/features/applications/components/ApplicationsTableView.tsx`** — Add form type badge in the applicant cell next to the category badge
4. **`src/features/applications/components/TableColumnVisibility.tsx`** — Add optional `formType` column toggle
5. **`src/features/applications/pages/ApplicationsPage.tsx`** — Add `formType` to default column visibility state

## Scope
- Pure frontend change, no database migration needed
- ~5 files modified, 1 new utility function

