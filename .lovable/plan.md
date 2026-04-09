

# Enrich CDL JobCast Applications with Experience Data

## Problem

CDL JobCast webhooks from ZipRecruiter, Adzuna, and TheTruckersReportJobs only send basic contact fields (name, email, phone, city, state, zip, source, job_id). The experience data visible in CDL JobCast's portal (Driver Type, Driving Experience) is **not included in their outbound webhook payloads**, and CDL JobCast does not expose a public API to pull applicant details.

There is no `getapplicants`, `getapplications`, or `getleads` endpoint — only `getfeeds` for job listings. This means we cannot "source from CDL JobCast's side" because they don't provide an API for it.

## Proposed Solution: Post-Submission Experience Collection

Since CDL JobCast won't send experience data, we create a **post-inbound enrichment function** that collects missing experience fields from applicants after they are received. Two mechanisms:

### 1. Create `enrich-application` edge function

A new edge function that can be called to enrich applications missing experience data. It will:

- Accept an application ID (or batch of IDs)
- Check which fields are missing (exp, driving_experience_years, cdl_class, driver_type)
- For applications from CDL JobCast sources, mark them as needing enrichment by setting a flag
- Integrate with the existing ElevenLabs voice screening flow to collect experience during the screening call

### 2. Expand the ElevenLabs voice agent data collection

The existing voice screening system already calls applicants. Update the voice agent's data collection to explicitly ask about:
- Driving experience (years/months)
- CDL class (A, B, etc.)
- Driver type (Owner Operator, Company, Lease Purchase)

Then write those values back to the application record after the call.

### 3. Add experience collection to the inbound handler as defaults

For CDL JobCast sources specifically, set sensible defaults and flag for enrichment:

```typescript
// In hayes-client-handler.ts processApplication()
const needsEnrichment = !data.exp && !data.driving_experience_years 
  && (utmSource === 'cdl_jobcast' || ['ZipRecruiter', 'TheTruckersReportJobs', 'Adzuna'].includes(data.source));

// Add to applicationData:
needs_enrichment: needsEnrichment,
enrichment_fields: needsEnrichment ? ['exp', 'driving_experience_years', 'cdl_class', 'driver_type'] : null,
```

### 4. Backfill flag on existing records

```sql
UPDATE applications
SET needs_enrichment = true
WHERE job_listing_id IN (
  SELECT id FROM job_listings WHERE client_id = 'be8b645e-d480-4c22-8e75-b09a7fc1db7a'
)
AND driving_experience_years IS NULL
AND exp IS NULL
AND source IN ('ZipRecruiter', 'TheTruckersReportJobs', 'Adzuna');
```

## Important Context

CDL JobCast does **not** have a public API for pulling applicant details — I tested `getapplicants`, `getapplications`, and `getleads` endpoints, all return 404. The only available endpoint is `getfeeds` which returns job listings XML. To get experience data flowing from CDL JobCast directly, you would need to contact them and request they add `driver_type` and `driving_experience` fields to their webhook payload.

## Alternative: Direct contact with CDL JobCast

The fastest path to populate all experience fields is to ask CDL JobCast to include `driver_type`, `driving_experience`, and `cdl_class` in their webhook POST body. The handler code is already prepared to capture these fields when they arrive.

### Files to create/modify
- `supabase/functions/enrich-application/index.ts` — new enrichment function
- `supabase/functions/_shared/hayes-client-handler.ts` — add enrichment flag logic
- New migration — add `needs_enrichment` boolean column to applications table
- Backfill existing CDL JobCast records

