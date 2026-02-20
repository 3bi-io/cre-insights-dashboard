
# Advisory: Apply Form Audit — Issues Found & Fixes Required

## Summary of Findings

After a full audit of all three apply paths (`/apply`, `/apply/detailed`, `/embed/apply`) and the job listing → apply redirect flow, here is what was found:

---

## Issue 1 — CRITICAL: Detailed Apply Form Loses Job Context

**Path:** `/apply/detailed`

**Problem:** `useDetailedApplicationForm.ts` reads the job ID from the URL using only `searchParams.get('job')` (line 231). However, every "Apply Now" button in the system — `PublicJobCard.tsx`, `JobDetailsPage.tsx`, and `StickyApplyCTA.tsx` — generates the apply URL as `/apply?job_id={job.id}` (using the parameter name `job_id`).

This means: if someone lands on `/apply/detailed?job_id=abc123`, the detailed form reads `null` for the job ID and submits with no job attribution. The application is created with no job listing linked.

**Fix needed:** Change line 231 in `useDetailedApplicationForm.ts` from:
```typescript
const jobId = searchParams.get('job');
```
to:
```typescript
const jobId = searchParams.get('job_id') || 
              searchParams.get('job_listing_id') || 
              searchParams.get('jobId') || 
              searchParams.get('job');
```

---

## Issue 2 — CRITICAL: Remaining `ats.me` URLs in DetailedApplicationForm

**Path:** `/apply/detailed`

**Problem:** `DetailedApplicationForm.tsx` lines 111–114 and 124 and 154 still hardcode `https://ats.me/` in breadcrumb schema and canonical SEO tags — these were missed in the rebrand. These are the exact lines the previous plan committed to fixing but that fix was cancelled before execution.

**Affected lines:**
```typescript
// Line 111-113 - breadcrumb schema
{ name: 'Home', url: 'https://ats.me/' },
{ name: 'Jobs', url: 'https://ats.me/jobs' },
{ name: jobTitle || 'Detailed Application', url: 'https://ats.me/apply/detailed' },

// Line 124 - SEO canonical (non-Americas path)
canonical="https://ats.me/apply/detailed"

// Line 154 - SEO canonical (main path)
canonical="https://ats.me/apply/detailed"
```

**Fix needed:** Replace all three with `https://applyai.jobs/`.

---

## Issue 3 — UX Issue: Job Card Says "View & Apply" but Goes to Job Detail, Not Apply Form

**Path:** `/jobs` (job listings grid)

**Problem:** `PublicJobCard.tsx` has an `applyUrl` variable (`/apply?job_id={job.id}`) that is defined but **never used** for the main CTA button. The "View & Apply" button instead links to `/jobs/${job.id}` (the job detail page). Users must then click a second "Apply Now" button on the job detail page.

This creates an unnecessary extra click in the conversion funnel. The `applyUrl` variable exists in the file but is dead code.

**Options:**
- Option A (current UX): Keep the two-step flow. "View & Apply" → job details → Apply Now. This is acceptable UX since it lets candidates read the full job description first.
- Option B: Rename the button to "View Details" to be honest about what it does, which reduces confusion.

**Recommendation:** Rename "View & Apply" → "View Details" to accurately describe the action. This is a simple 1-line text change.

---

## Issue 4 — UX Issue: `/embed/apply` Has No "Skip to Submit" for Mobile

**Path:** `/embed/apply`

**Problem:** The embed form (`EmbedApplicationForm.tsx`) does implement `handleSkipToSubmit` — however it only shows the skip button when `canSkipToSubmit && currentStep === 1 && !isLastStep`. The `canSkipToSubmit` prop is passed as `canProceed && activeStep === 1`, which is correct. This works as intended.

**No fix needed here** — this is functioning correctly.

---

## Issue 5 — DATA Issue: Admin Visibility for Detailed Applications (Previous Plan — Cancelled)

The previously approved plan to expand `ApplicationDetailsDialog.tsx` to show all 50+ fields from the detailed form was **cancelled** and not executed. The admin currently still shows only ~12 fields regardless of whether a Quick or Detailed form was submitted.

**Status:** Still pending. This was the main ask from the previous message and needs to be re-implemented.

---

## What Works Correctly

- `/apply` (Quick Apply): Correctly reads `job_id` from URL params → passes to `submit-application` edge function → creates application with correct job attribution. ✓
- `/embed/apply`: Correctly forces `source: 'Embed Form'`, routes to dedicated job listing via server-side override in the edge function, and shows inline thank-you. ✓
- Job listings → Job Detail → Apply: The path from `/jobs` → `/jobs/:id` → `/apply?job_id=...` works correctly end-to-end. ✓
- CORS: Previously fixed — embed form can now post to `submit-application` from any origin. ✓
- `useApplyContext`: Correctly resolves job title, client name, and logo for all three param variations (`job_id`, `job_listing_id`, `job`, `jobId`). ✓

---

## What Needs to Be Fixed

### Priority 1 — Fix Job ID Loss in Detailed Form (Critical — Data Integrity)
- **File:** `src/hooks/useDetailedApplicationForm.ts` line 231
- **Change:** Read `job_id`, `job_listing_id`, `jobId`, OR `job` — not just `job`

### Priority 2 — Fix Remaining ats.me URLs in DetailedApplicationForm (SEO)
- **File:** `src/components/apply/detailed/DetailedApplicationForm.tsx` lines 111–114, 124, 154
- **Change:** Replace `https://ats.me/` → `https://applyai.jobs/`

### Priority 3 — Rename "View & Apply" to "View Details" on Job Cards (UX)
- **File:** `src/components/public/PublicJobCard.tsx` line 161
- **Change:** Text from `"View & Apply"` → `"View Details"`

### Priority 4 — Re-implement Admin Application Data Visibility (Pending from cancelled plan)
- **Files:** `src/features/applications/components/ApplicationDetailsDialog.tsx`, `ApplicationsTable.tsx`, `ApplicationCard.tsx`
- **Change:** Expand dialog to show all 50+ detailed fields in collapsible sections; add Form Type badge

---

## Implementation Plan

All four fixes will be made together:

1. `useDetailedApplicationForm.ts` — fix job ID param lookup (1 line)
2. `DetailedApplicationForm.tsx` — fix 5 remaining `ats.me` URLs (5 lines)
3. `PublicJobCard.tsx` — rename button text (1 line)
4. `ApplicationDetailsDialog.tsx` — add all missing detailed form field sections
5. `ApplicationsTable.tsx` — add Form Type column
6. `ApplicationCard.tsx` — add Form Type badge + CDL class display
