

# Best-in-Class Platform Enhancements

Four high-impact features that elevate the platform's data collection, recruiter accountability, and ATS delivery reliability.

---

## 1. ATS Readiness Score (Pre-Submission Validation)

**What it does:** Before auto-posting to Tenstreet (or any ATS), the system calculates a "readiness score" for each application. Applications missing required fields are flagged and optionally held from auto-post until enriched.

**Changes:**
- **New shared utility** `supabase/functions/_shared/ats-adapters/readiness-scorer.ts` -- defines required/recommended fields per ATS slug (e.g., Tenstreet needs first_name, last_name, phone, email, city, state, zip, cdl_class). Returns a 0-100 score and a list of missing fields.
- **Modify** `supabase/functions/_shared/ats-adapters/auto-post-engine.ts` -- before calling `adapter.sendApplication()`, run the readiness check. If score is below a configurable threshold (default 60%), log a `skipped_low_readiness` entry to `ats_sync_logs` and skip the post. Add the readiness score and missing fields to the log metadata.
- **New DB column** on `applications`: `ats_readiness_score integer` -- populated by a lightweight database trigger or by the auto-post engine before attempting delivery.
- **New type + UI component** `src/features/admin/components/ATSReadinessIndicator.tsx` -- a small badge/pill shown in application detail views indicating readiness (green/yellow/red).
- **Update** `DataQualityDashboard.tsx` to show an "ATS Readiness" summary card with the percentage of recent applications that would pass auto-post validation.

---

## 2. Recruiter SLA Tracking (First Response Time)

**What it does:** Tracks how quickly a recruiter first engages with an application after submission, enabling SLA monitoring and accountability.

**Changes:**
- **New DB column** on `applications`: `first_response_at timestamptz` -- set the first time a recruiter updates status, adds a note, sends an SMS, or initiates an outbound call.
- **New DB trigger** `set_first_response_at` on `applications` UPDATE -- if `first_response_at IS NULL` and (`status` changed from `pending` OR `recruiter_id` changed from NULL OR `notes` changed), set `first_response_at = now()`.
- **New hook** `src/features/admin/hooks/useRecruiterSLA.ts` -- queries applications grouped by recruiter, calculating avg/median/p95 response times, and percentage within SLA (e.g., < 1 hour, < 4 hours, < 24 hours).
- **New dashboard card** in the admin OverviewTab showing top-level SLA metrics: "Avg First Response: 2.3 hrs" with a breakdown by recruiter and client.

---

## 3. Closed-Loop Data Enrichment Triggers

**What it does:** When the Data Quality Dashboard detects that a source consistently fails to capture critical fields, the system automatically triggers enrichment outbound calls for those specific applications.

**Changes:**
- **New service method** `DataQualityService.getEnrichmentCandidates(source, missingFields, limit)` -- returns recent applications from a given source that are missing specific critical fields (e.g., CDL class, experience years) and haven't already had an enrichment call.
- **New DB column** on `applications`: `enrichment_status text` (values: null, 'pending', 'in_progress', 'completed') -- prevents duplicate enrichment attempts.
- **New button in DataQualityDashboard** "Trigger Enrichment" on source cards with poor scores -- calls an edge function that queues outbound calls targeting applications with missing fields for that source.
- **Modify** existing outbound call trigger logic to tag enrichment calls with `call_type = 'enrichment'` in the `outbound_calls` table metadata, distinguishing them from initial follow-up calls.

---

## 4. Enhanced Source Attribution (Cost-Per-Qualified-Application)

**What it does:** Extends the Data Quality Dashboard with cost tracking per source, enabling ROI analysis.

**Changes:**
- **New DB table** `source_cost_config` with columns: `id uuid PK`, `organization_id uuid FK`, `source text`, `monthly_cost numeric`, `cost_per_click numeric`, `period_start date`, `period_end date`, `created_at`, `updated_at`.
- **New admin UI section** in Data Quality Dashboard -- "Source ROI" tab showing cost-per-application and cost-per-qualified-application (qualified = readiness score >= 60%) for each source.
- **New hook** `src/features/admin/hooks/useSourceCosts.ts` -- CRUD operations on `source_cost_config` and computed metrics.
- **RLS policy** on `source_cost_config`: org admins can manage their own org's data, super admins can manage all.

---

## Migration Summary

A single migration adding:

```text
applications table:
  + ats_readiness_score  integer
  + first_response_at    timestamptz
  + enrichment_status    text

New table: source_cost_config
  + id                   uuid PK
  + organization_id      uuid FK -> organizations
  + source               text
  + monthly_cost         numeric
  + cost_per_click       numeric
  + period_start         date
  + period_end           date
  + created_at           timestamptz
  + updated_at           timestamptz

New trigger: set_first_response_at (on applications UPDATE)
RLS: source_cost_config (org-scoped read/write for admins, full access for super_admins)
```

## Implementation Order

1. Database migration (new columns, table, trigger, RLS)
2. ATS Readiness Scorer utility + auto-post engine integration
3. ATSReadinessIndicator component + DataQualityDashboard updates
4. Recruiter SLA hook + dashboard card
5. Enrichment service method + dashboard trigger button
6. Source cost config table + ROI tab

## Technical Notes

- The `first_response_at` trigger uses `SECURITY DEFINER` and only fires when transitioning from an "untouched" state (null recruiter_id, pending status, unchanged notes).
- The readiness scorer is a pure function with no DB dependencies -- it takes application data and ATS slug, returns a score. This keeps it testable and reusable across manual re-sends and auto-posts.
- Enrichment calls reuse the existing `trigger_application_insert_outbound_call` infrastructure but with an explicit `call_type` metadata flag to prevent routing conflicts.
- All new UI components follow existing patterns: Radix UI primitives, shadcn/ui cards, TanStack Query hooks.

