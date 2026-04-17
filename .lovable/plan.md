

## Plan: Show Job Description on Universal Apply Links (No job_listing_id)

### Problem
The current implementation only fetches `job_description` / `job_summary` when a `job_listing_id` is present. Universal apply URLs like:

`/apply?organization_id=...&client_id=1d54e463-4d7f-4a05-8189-3e33d0586dea`

resolve via Priority 2 (client_id only) and never load any job description, so the panel never renders for these allow-listed clients (Danny Herman, Pemberton, Admiral Merchants).

### Solution
When a universal client-only URL resolves AND the client is in the allow-list, pick a representative active job listing for that client and use its description/summary as the page's "About this role" content. This keeps Indeed compliance for both flows without disturbing any other clients.

### Selection rule for representative description
For Priority 2 (client_id only), if `clientId` is in `JOB_DESCRIPTION_CLIENT_IDS`:
1. Query `job_listings` for the most recently updated active listing for that client that has non-empty `job_description` or `job_summary`.
2. Use its `job_description` / `job_summary` to populate context.
3. Leave `jobListingId` and `jobTitle` as `null` (this is still a generic universal apply — we are only borrowing description text for compliance).

If no listing has description content, leave both null (panel won't render — same as today).

### Affected file
**`src/hooks/useApplyContext.ts`** — extend Priority 2 branch only:
- After fetching `clientInfo`, if the client is in the allow-list, run a follow-up query:
  ```ts
  supabase
    .from('job_listings')
    .select('job_description, job_summary')
    .eq('client_id', clientId)
    .eq('status', 'active')
    .or('job_description.not.is.null,job_summary.not.is.null')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  ```
- Set `jobDescription` / `jobSummary` on context from the result (fallback to `null`).

### What does NOT change
- `JobDescriptionPanel.tsx` — already handles missing title.
- `jobDescriptionClients.ts` allow-list — same 3 clients.
- `Apply.tsx` rendering condition — already `shouldShowJobDescription(clientId) && (jobDescription || jobSummary)`, which will now correctly evaluate true for universal links.
- Priority 1 flow (job_listing_id present) — untouched.
- Non-allow-listed clients — no extra query, no behavior change.

### Why this approach
- Zero schema changes, zero new components.
- Single targeted query, gated by allow-list, so no perf impact for other clients.
- Indeed crawler sees real description text on universal apply URLs for the 3 flagged carriers.
- Safe fallback: if no description exists, page renders exactly as it does today.

