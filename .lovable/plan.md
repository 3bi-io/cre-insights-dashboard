
# Refactor: Full Apply Form Data Visibility in Admin

## Problem Summary

The admin panel currently surfaces only a small subset of the data that applicants submit. Specifically:

- The **quick apply** form (`/apply`, `/embed/apply`) collects ~15 fields.
- The **detailed apply** form (`/apply/detailed`) collects ~50+ fields including CDL class, endorsements, SSN (last 4), DOB, employment history, military service, accident/violation history, HAZMAT/TWIC/passport, medical card expiration, felony details, work preferences, emergency contact, and more.
- The `ApplicationDetailsDialog` in the admin only displays ~12 of these fields. The remaining 35+ are silently ignored.
- The admin table/grid shows no indication of which form type was used or whether extended data exists.

---

## Root Cause

The `ApplicationDetailsDialog` was never updated to display the extended fields added in the detailed form. The data **is being saved** correctly (the `submit-application` edge function maps all fields to the `applications` table), but the admin UI just doesn't render them.

There is also a minor remaining hardcoded URL in `DetailedApplicationForm.tsx` — breadcrumb URLs still point to `https://ats.me/` (lines 111–113). This will be fixed as part of this refactor.

---

## What Will Be Changed

### 1. `ApplicationDetailsDialog.tsx` — Core Fix

Expand the details dialog to show all form data, organized into logical collapsible sections. This is the most impactful change.

New sections to add (currently missing):

**Extended Personal Information** (shown when data exists)
- Prefix / Middle Name / Suffix
- Date of Birth (formatted, not shown if null)
- SSN Last 4 (shown as `****-1234` format for privacy)
- Government ID Type + Government ID Number

**Full Contact Information** (shown when data exists)
- Full Address (address_1, address_2, city, state, zip, country)
- Secondary Phone
- Preferred Contact Method

**Emergency Contact** (shown when any field exists)
- Emergency Contact Name, Phone, Relationship

**CDL & Licensing (Extended)** (expand existing section)
- CDL Class (A / B / C)
- CDL State (issuing state)
- CDL Expiration Date
- CDL Endorsements (as badges: H, N, P, S, T, X)
- Total Driving Experience Years
- HAZMAT Endorsement status
- TWIC Card status
- Passport Card status
- Medical Card Expiration
- Last DOT Physical Date

**Accident & Violation History** (shown when data exists)
- Accident History (last 3 years)
- Violation History (last 3 years)

**Experience & Education** (shown when data exists)
- Employment History (rendered as readable text/JSON)
- Education Level

**Military Service** (shown when military_service is set)
- Military Service status
- Military Branch
- Start Date / End Date

**Background & Legal** (shown when data exists)
- Convicted Felony (yes/no)
- Felony Details
- Work Authorization

**Work Preferences** (shown when data exists)
- Can Work Weekends
- Can Work Nights
- Willing to Relocate
- Preferred Start Date
- Salary Expectations

**How Did You Hear** (shown when set)
- Source / Referral method

**Screening Fields** (expand existing section)
- `over_21` (currently mapped to `age` in display, ensure `over_21` field is checked)
- `can_pass_drug_test`
- `can_pass_physical`
- `consent_to_sms`
- `consent_to_email`
- `agree_privacy_policy`
- `background_check_consent`

All new sections will be **collapsible** (using the existing `Collapsible` pattern already present in the dialog for call history, background checks, etc.) and will only render when data actually exists, keeping the dialog clean for quick-apply submissions that only have basic data.

### 2. `ApplicationsTable.tsx` — Add Form Type Column

Add a "Form" column to the table that shows which apply form was used. The form type can be inferred from:
- `source === 'Embed Form'` → "Embed"
- Fields like `cdl_class`, `date_of_birth`, `employment_history` being populated → "Detailed"
- Otherwise → "Quick"

This will be displayed as a small colored badge.

### 3. `ApplicationsGrid.tsx` / `ApplicationCard.tsx` — Add Form Type Badge + Extended Info Preview

Add a compact "Detailed" / "Embed" / "Quick" badge to application cards so recruiters can quickly see which form type was submitted. Also show CDL class if available (e.g., "Class A CDL") as it's a key screening field.

### 4. `DetailedApplicationForm.tsx` — Fix Remaining Hardcoded URLs

Lines 111–113 still reference `https://ats.me/` in the breadcrumb schema:
```typescript
{ name: 'Home', url: 'https://ats.me/' },
{ name: 'Jobs', url: 'https://ats.me/jobs' },
{ name: jobTitle || 'Detailed Application', url: 'https://ats.me/apply/detailed' },
```
These will be updated to `https://applyai.jobs/`.

Also lines 124 and 154 have `canonical="https://ats.me/apply/detailed"` in the `<SEO>` components — both will be updated.

---

## Implementation Order

1. Fix `DetailedApplicationForm.tsx` — correct remaining `ats.me` URLs (trivial, 3 lines).
2. Expand `ApplicationDetailsDialog.tsx` — add all missing data sections as collapsibles.
3. Update `ApplicationsTable.tsx` — add Form Type column.
4. Update `ApplicationCard.tsx` — add Form Type badge and CDL class display.

---

## Technical Notes

- No database changes required — all fields are already stored in the `applications` table.
- No API changes required — `usePaginatedApplications` already fetches `*` (all columns) from applications.
- The `Application` type in `common.types.ts` already has all extended fields typed — they just aren't rendered.
- Sections in the dialog are conditionally rendered only when data exists, so the dialog stays clean for quick-apply submissions.
- The "form type" indicator is inferred client-side from field presence — no new DB column needed.
- Employment history is stored as JSON (`jsonb`) — it will be rendered as a formatted readable list when present.
- SSN display in admin is shown as `****-XXXX` (masking first digits, showing last 4 only) since only last 4 digits are collected anyway.
