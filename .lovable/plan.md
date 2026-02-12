
## Fix Client Routing for Indeed and ZipRecruiter Applications

### Problem
Danny Herman and Pemberton are both live on Indeed and ZipRecruiter, but inbound applications are not being routed to the correct client. Two issues exist:

1. **ZipRecruiter webhook** (`ziprecruiter-webhook/index.ts`) does a naive job lookup (`id` or `external_id` match only) with no organization or client routing. If the `job_id` from ZipRecruiter doesn't exactly match a `job_listings.id`, the application gets `job_listing_id = null` and is orphaned.

2. **Indeed XML feed** (`universal-xml-feed/index.ts`) generates apply URLs as `https://ats.me/jobs/{id}` without `client_id` or `organization_id` parameters. If Indeed redirects candidates to the apply page, client context is lost.

### Fix 1: ZipRecruiter Webhook - Add Client-Aware Routing

**File:** `supabase/functions/ziprecruiter-webhook/index.ts`

Replace the naive job lookup (lines 247-259) with the shared `findOrCreateJobListing` function from `application-processor.ts`. This already handles:
- Job ID prefix-based org/client inference (e.g., prefix `14204` maps to Danny Herman, prefix `14086` maps to Pemberton)
- Fallback to General Application per client
- Auto-creation of missing job listings

Changes:
- Import `findOrCreateJobListing`, `getOrganizationFromJobId`, `getClientIdFromJobId` from `_shared/application-processor.ts`
- Replace the simple `or(id.eq, external_id.eq)` lookup with `findOrCreateJobListing` call that passes the inferred `organizationId` and `clientId`
- Pass the resolved `job_listing_id` to the insert statement

### Fix 2: Indeed XML Feed - Include Client Context in Apply URLs

**File:** `supabase/functions/universal-xml-feed/index.ts`

Update the `generateIndeedXML` function (line 305) to build an apply URL that includes `organization_id` and `client_id` when available:

```
// Before:
const jobUrl = `https://ats.me/jobs/${job.id}`;

// After:
let applyUrl = job.apply_url || `https://ats.me/apply?job_listing_id=${job.id}`;
if (!job.apply_url) {
  if (job.organization_id) applyUrl += `&organization_id=${job.organization_id}`;
  if (job.client_id) applyUrl += `&client_id=${job.client_id}`;
}
```

This ensures that when Indeed redirects a candidate to the apply page, the `submit-application` function receives the full client context.

### Fix 3: Apply URL Consistency Across All Feed Formats

Apply the same `client_id`/`organization_id` enrichment to the Talent.com, CareerJet, and other feed generators that include `apply_url` fields, so all platforms route correctly.

### Technical Details

| Change | File | Impact |
|--------|------|--------|
| ZipRecruiter client routing | `supabase/functions/ziprecruiter-webhook/index.ts` | Applications from ZR get correct `client_id` via job_id prefix inference |
| Indeed apply URL enrichment | `supabase/functions/universal-xml-feed/index.ts` | Indeed redirects carry `client_id` and `organization_id` |
| Other feed formats | `supabase/functions/universal-xml-feed/index.ts` | All feed platforms route correctly |

### Deployment
- Redeploy `ziprecruiter-webhook` and `universal-xml-feed` edge functions
- No database changes required -- the `application-processor.ts` already has the prefix mappings for both Danny Herman (`14204`, `13979`, `13980`) and Pemberton (`14086`, `14230`, `14294`)
