

# Review All Platform Jobs & Optimize Google Jobs Integration

## Current State Assessment

### Job Inventory (813 Google-ready across 4 orgs)
| Organization | Google-Ready Jobs | Status |
|---|---|---|
| Hayes Recruiting Solutions | 421 | Active |
| Career Now Brands (Hub Group, Werner, TMC) | 299 | Active |
| Aspen Analytics (AspenView) | 53 | Active |
| CR England | 40 | Active |

All 813 jobs have titles, locations, `status=active`, `is_hidden=false` -- fully eligible for Google Jobs.

### Critical Issues Found

1. **Weekly cron logs `job_count: 0` for all orgs** -- sitemaps are being fetched successfully (421, 40, 53 jobs) but zero URLs are actually submitted to Google. This means either the `GOOGLE_SERVICE_ACCOUNT_JSON` secret is missing/invalid or the OAuth token exchange is failing silently.

2. **Career Now Brands (299 jobs) is missing from cron runs** -- only 3 orgs appear in the logs, not 4. The weekly cron's query uses `organizations!inner(name)` join which may be failing for this org, or the 1000-row default limit is truncating results before this org is reached.

3. **Legacy `serve()` imports** -- Both `google-indexing-trigger` and `google-indexing` use the deprecated `serve()` from `deno.land/std`, violating the platform's Deno.serve() standard.

4. **No database trigger wired** -- `google-indexing-trigger` exists as an edge function but no DB trigger calls it on job insert/update/delete, so real-time indexing is completely inactive.

5. **Sitemap generates correct URLs** -- `https://applyai.jobs/jobs/{id}` pointing to pages with `JobPosting` JSON-LD schema. This part is working correctly.

6. **Cron schedule is Sunday-only** -- `0 6 * * 0` means jobs added Monday-Saturday wait up to 6 days before being submitted.

---

## Plan

### Step 1: Fix the weekly cron edge function (critical)

Rewrite `google-indexing-weekly/index.ts` with these improvements:

- **Fix the 1000-row limit bug**: The org discovery query fetches individual job rows to group by org. With 813+ jobs, it may hit the Supabase default 1000-row limit. Switch to an RPC or use `.select('organization_id').limit(10000)` with pagination.
- **Better approach**: Query distinct `organization_id` values directly from `job_listings` where jobs are Google-ready, rather than fetching all rows and grouping client-side.
- **Log actual errors**: When Google API returns errors, log the error body so we can diagnose the `GOOGLE_SERVICE_ACCOUNT_JSON` issue.
- **Batch submissions with proper rate limiting**: Google Indexing API allows 200 requests/day for unverified properties. Add daily quota tracking and smart batching (submit changed/new jobs first).
- **Track last-submitted timestamps**: Add an `last_google_indexed_at` column to `job_listings` so the cron only submits new/updated jobs instead of re-submitting all 813 every week.

### Step 2: Upgrade cron schedule to twice-weekly

Update the `pg_cron` job from Sunday-only to **Sunday + Wednesday** at 6:00 AM UTC (`0 6 * * 0,3`), ensuring jobs are never more than 3-4 days stale. This stays well within Google's rate limits.

### Step 3: Migrate legacy edge functions to Deno.serve()

- **`google-indexing-trigger/index.ts`**: Replace `import { serve }` with `Deno.serve()` pattern
- **`google-indexing/index.ts`**: Replace `import { serve }` with `Deno.serve()` pattern, update `createClient` import to `npm:@supabase/supabase-js@2.50.0`

### Step 4: Enhance `google-jobs-xml` sitemap

- Add `job_description` to the query so the sitemap can optionally include richer metadata
- Add a global sitemap mode (no `organization_id` required) for submitting all jobs at once, reducing the number of internal API calls the weekly cron makes
- Include `zip` field in query for more precise `lastmod` timestamps

### Step 5: Add `last_google_indexed_at` column

Create a migration adding `last_google_indexed_at TIMESTAMPTZ` to `job_listings`. The weekly cron will update this after successful submission, enabling delta-only submissions on subsequent runs (only jobs where `updated_at > last_google_indexed_at` or `last_google_indexed_at IS NULL`).

### Step 6: Wire real-time database trigger (optional enhancement)

Create a Postgres trigger on `job_listings` for INSERT/UPDATE/DELETE that calls `google-indexing-trigger` via `pg_net`. This ensures new jobs are submitted to Google within minutes rather than waiting for the next cron run. The trigger should only fire when `status = 'active'` and `is_hidden = false`.

---

## Files Changed

| File | Action |
|---|---|
| `supabase/functions/google-indexing-weekly/index.ts` | Rewrite with delta indexing, proper org discovery, error logging |
| `supabase/functions/google-indexing-trigger/index.ts` | Migrate to `Deno.serve()` |
| `supabase/functions/google-indexing/index.ts` | Migrate to `Deno.serve()` |
| `supabase/functions/google-jobs-xml/index.ts` | Add global sitemap mode, richer query |
| New migration | Add `last_google_indexed_at` column |
| SQL insert (cron update) | Update cron schedule to `0 6 * * 0,3` |

