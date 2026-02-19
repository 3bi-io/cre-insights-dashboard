
## Force All Embed Form Submissions to Job ID `4c3cfad9-4641-4830-ad97-11589e8f8cd4`

### Problem
Applications from `/embed/apply` currently resolve their job listing dynamically — based on whatever `job_listing_id` or `job_id` is passed in the URL. If those parameters are missing or incorrect, the submission may land on the wrong job or fall back to a generic one.

The goal is to guarantee that **every submission where `source = 'Embed Form'`** always associates with job ID `4c3cfad9-4641-4830-ad97-11589e8f8cd4` ("CDL A Truck Driver - Regional Southeast Runs", Hayes org).

---

### Root Cause
In `supabase/functions/submit-application/index.ts`, the `findOrCreateJobListing` call uses `formData.job_listing_id` passed from the client, which comes from URL parameters. If the embed widget doesn't pass it, or passes something else, the job association can drift.

---

### Solution: Hardcode the Override in the Edge Function

In `submit-application/index.ts`, add a **source-based job listing override** immediately before the `findOrCreateJobListing` call (around line 877). When `detectedSource === 'Embed Form'` (which is already set on every embed submission), force `job_listing_id` to the correct UUID before resolving.

**Target file:** `supabase/functions/submit-application/index.ts`

**Change at lines ~793–888:**

```text
// Before findOrCreateJobListing is called (~line 877):

const EMBED_FORM_JOB_LISTING_ID = '4c3cfad9-4641-4830-ad97-11589e8f8cd4';

// Override: All Embed Form submissions must associate with the dedicated job listing
const resolvedJobListingId = detectedSource === 'Embed Form'
  ? EMBED_FORM_JOB_LISTING_ID
  : (formData.job_listing_id && formData.job_listing_id.trim() !== '' 
      ? formData.job_listing_id 
      : undefined);
```

Then pass `resolvedJobListingId` instead of `formData.job_listing_id` in:
1. `resolveOrganizationAndJob(...)` — so org, client, and job title are correctly resolved from the Hayes job
2. `findOrCreateJobListing(...)` — so the application lands on the correct job listing row
3. `checkDuplicateApplication(...)` — so duplicate detection is scoped to the correct job

---

### Technical Details

- **Target job listing:** `4c3cfad9-4641-4830-ad97-11589e8f8cd4`  
  Title: CDL A Truck Driver - Regional Southeast Runs  
  Org: Hayes (`84214b48-7b51-45bc-ad7f-723bcf50466c`)  
  Client ID: `49dce1cb-4830-440d-8835-6ce59b552012`  
  Status: active

- **Detection:** Uses the already-existing `detectedSource` variable which is set to `'Embed Form'` for all embed widget submissions (via `formData.source` passed from `useEmbedApplicationForm.ts`)

- **No frontend changes needed** — the fix is entirely in the edge function, making it server-side and authoritative regardless of what URL parameters are passed

- **Deploy required:** The edge function `submit-application` will need to be redeployed after the change
