

## Fix: Universal Apply URL Routing to Correct Client Job Listing

### Problem
When a candidate applies via the universal URL with `client_id=67cadf11...` (Pemberton Truck Lines), the application gets assigned to a "General Application" listing under the "Unassigned" client (`1f3545ff...`) instead of Pemberton's actual job listings.

**Root cause:** In `submit-application/index.ts` line 779, `clientId` is hardcoded to `null`:
```text
const jobListingResult = await findOrCreateJobListing(supabase, {
  ...
  clientId: null,   // <-- BUG: should pass the resolved client_id
  ...
});
```

This means `findOrCreateJobListing` cannot scope its "General Application" fallback to Pemberton, and instead picks the first org-wide "General Application" it finds, which belongs to the "Unassigned" client.

### Additional Issue: UTM Attribution Missing
The application record shows `utm_source: null`, `utm_medium: null` even though the URL likely had UTM params. This suggests the Indeed redirect did not append UTM parameters, OR the form data is not being captured. The form data should have `utm_source=indeed` for proper attribution since traffic came from Indeed.

### Fix (2 changes)

#### 1. Pass `client_id` to `findOrCreateJobListing` (submit-application/index.ts, line 779)

Change:
```text
clientId: null,
```
To:
```text
clientId: formData.client_id && formData.client_id.trim() !== '' ? formData.client_id : null,
```

This ensures that when a universal URL provides `client_id`, the job listing resolution:
- First looks for a client-specific "General Application" listing for Pemberton
- If none exists, creates one scoped to Pemberton
- Prevents misrouting to the "Unassigned" client

#### 2. Create a Pemberton-specific "General Application" job listing

Since there is no "General Application" listing for Pemberton (`67cadf11...`), one should be created so universal URL applications land correctly. The `findOrCreateJobListing` function will auto-create one if needed (Step 5 in the fallback chain), but only after the fix above is deployed.

Alternatively, we can verify the system creates one automatically after the fix.

#### 3. Redeploy `submit-application` edge function

#### 4. Reassign the misrouted application

Update application `352a24fa...` to point to the correct Pemberton General Application listing (once created) or to the matching Greenville, NC listing (`c12eec4e...`).

### Recommended Indeed URL Format

For Indeed job postings, the apply URL should include UTM attribution:
```text
https://ats.me/apply?organization_id=84214b48-7b51-45bc-ad7f-723bcf50466c&client_id=67cadf11-8cce-41c6-8e19-7d2bb0be3b03&utm_source=indeed&utm_medium=job_board
```

### Technical Summary

| Item | Before (Broken) | After (Fixed) |
|---|---|---|
| `clientId` passed to `findOrCreateJobListing` | `null` | Resolved from `formData.client_id` |
| Application routes to | "Unassigned" General Application (`a5bdad6f`) | Pemberton-specific General Application |
| UTM attribution | Missing | Captured when included in URL |

