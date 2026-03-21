

# One-Click Job Geo-Expansion for Super Admins

## Overview
Add a "Geo Expand" button that lets Super Admins instantly clone a job listing into state-level variants using a predefined state/metro mapping. Available at two levels:
1. **Per-job** -- in the JobTable row action dropdown and job detail view
2. **Per-client** -- in the ClientsTable row action dropdown (expands all active jobs for that client)

## How It Works

When clicked, a confirmation dialog shows:
- The job(s) to expand
- The job_type detected (OTR vs Regional) which determines the state set
- Estimated number of new listings to create
- A "Expand Now" button

The expansion logic uses the same proven pattern from the R.E. Garrison migration: clone the parent job's `job_summary`, `salary_min/max`, `salary_type`, `job_type`, `experience_level`, `category_id`, `client_id`, `organization_id`, `user_id` into state-specific variants with `title | {State Name}` and `location = "{Metro}, {ST}"`.

## State Coverage Maps (hardcoded)

```text
OTR (35 states): AZ,UT,CO,NM,TX,OK,AR,LA,MS,AL,TN,KY,GA,FL,SC,NC,VA,WV,OH,IN,IL,MO,KS,NE,IA,SD,MN,WI,MI,PA,NY,CT,NJ,DE,MD

Regional SE (12): TX,AR,LA,MS,AL,TN,KY,GA,SC,NC,VA,FL
Regional Central (11): TX,LA,AR,OK,KS,NE,IA,MN,WI,IL,MO
Regional Combined (20 unique): TX,AR,LA,MS,AL,TN,KY,GA,SC,NC,VA,FL,OK,KS,NE,IA,MN,WI,IL,MO

Reefer Corridor (20): TX,FL,GA,AZ,CO,AL,MS,LA,AR,TN,KY,NC,SC,VA,PA,NY,OH,IN,IL,CA

Team OTR (18): TX,GA,FL,TN,IL,OH,IN,PA,NC,VA,MO,AL,KY,MS,AR,LA,OK,NJ
```

Each state maps to a primary metro city (e.g., TX→Dallas, GA→Atlanta).

## Implementation

### Step 1: Edge Function `job-geo-expand`
A Supabase Edge Function that:
- Accepts `{ job_ids: string[], dry_run?: boolean }`
- For each job, reads the parent listing
- Auto-detects the best state set based on `job_type` and title keywords (OTR→35 states, Regional→20 states, Team→18 states, Reefer/BYOT→20 states)
- Skips states where a variant already exists (checks for `title LIKE parent_title || ' | %'` with same `client_id`)
- In dry_run mode, returns the count and preview
- In execute mode, batch-inserts all variants and returns the count created
- Requires super_admin auth check

### Step 2: React Component `GeoExpandDialog`
New component at `src/components/admin/GeoExpandDialog.tsx`:
- Dialog with job preview, state set selector (auto-detected but overridable), and estimated count
- Calls the edge function with dry_run first to show preview
- On confirm, calls without dry_run
- Shows success toast with count

### Step 3: Add button to JobTable dropdown
In `src/components/jobs/JobTable.tsx`, add a "Geo Expand" `DropdownMenuItem` (Super Admin only) that opens the GeoExpandDialog for that single job.

### Step 4: Add button to ClientsTable dropdown
In `src/features/clients/components/ClientsTable.tsx`, add a "Geo Expand All Jobs" `DropdownMenuItem` (Super Admin only) that fetches all active jobs for that client and opens GeoExpandDialog in batch mode.

### Step 5: Add button to JobsPage header
In `src/features/jobs/pages/JobsPage.tsx`, add a "Geo Expand" button in the page actions area (visible to super_admin only) that expands all filtered/selected jobs.

## Files Changed
- **New**: `supabase/functions/job-geo-expand/index.ts` -- edge function
- **New**: `src/components/admin/GeoExpandDialog.tsx` -- dialog component
- **Modified**: `src/components/jobs/JobTable.tsx` -- add dropdown item
- **Modified**: `src/features/clients/components/ClientsTable.tsx` -- add dropdown item
- **Modified**: `src/features/jobs/pages/JobsPage.tsx` -- add header button

## Technical Notes
- Super Admin gate uses `useAuth()` checking `userRole === 'super_admin'`
- Edge function uses service_role key for inserts (bypasses RLS)
- Deduplication: before inserting, checks existing titles with same client_id to avoid duplicates on repeated clicks
- The state/metro mapping is hardcoded in the edge function (same proven dataset from the R.E. Garrison expansion)

