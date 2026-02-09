
## Universal Apply URLs with Organization-Level Attribution

### Concept
Instead of requiring a `job_id`, the apply URL resolves context (branding, client name, logo) from `organization_id` and optionally `client_id`. The originating platform adds UTM parameters for attribution.

### Example URLs for Hayes Clients

| Client | Universal Apply URL |
|---|---|
| **Hayes (org-level)** | `https://ats-me.lovable.app/apply?organization_id=84214b48-7b51-45bc-ad7f-723bcf50466c` |
| **Danny Herman Trucking** | `https://ats-me.lovable.app/apply?organization_id=84214b48-7b51-45bc-ad7f-723bcf50466c&client_id=1d54e463-4d7f-4a05-8189-3e33d0586dea` |
| **Pemberton Truck Lines** | `https://ats-me.lovable.app/apply?organization_id=84214b48-7b51-45bc-ad7f-723bcf50466c&client_id=67cadf11-8cce-41c6-8e19-7d2bb0be3b03` |
| **Day and Ross** | `https://ats-me.lovable.app/apply?organization_id=84214b48-7b51-45bc-ad7f-723bcf50466c&client_id=30ab5f68-258c-4e81-8217-1123c4536259` |
| **Novco, Inc.** | `https://ats-me.lovable.app/apply?organization_id=84214b48-7b51-45bc-ad7f-723bcf50466c&client_id=4a9ef1df-dcc9-499c-999a-446bb9a329fc` |
| **Hayes AI Recruiting** | `https://ats-me.lovable.app/apply?organization_id=84214b48-7b51-45bc-ad7f-723bcf50466c&client_id=49dce1cb-4830-440d-8835-6ce59b552012` |

Platform attribution is appended by the source, e.g.:
`...&client_id=1d54e463-...&utm_source=linkedin&utm_medium=job_board`

### Changes Required

#### 1. Frontend: `src/hooks/useApplyContext.ts`
- Add `organization_id` and `client_id` URL parameter extraction
- When no `job_id` is present but `client_id` is, fetch client name and logo from `public_client_info` view
- When only `organization_id` is present, show a generic application header (no specific client branding)
- Pass `organization_id` through to the form data so it reaches the backend

#### 2. Frontend: `src/hooks/useApplicationForm.ts`
- Add `organization_id` and `client_id` to the `FormData` interface and URL parameter capture
- These values get sent to `submit-application` so the backend can resolve the correct organization without needing a job ID

#### 3. Backend: `supabase/functions/submit-application/index.ts`
- In `resolveOrganizationAndJob()`, add a new priority level that accepts `organization_id` directly (between the current org_slug and fallback priorities)
- If `client_id` is also provided, resolve the client name from it for email branding
- This ensures applications submitted via universal URLs are correctly attributed to the right organization and client

#### 4. Redeploy
- Redeploy `submit-application` edge function after changes

### Technical Details

The resolution priority in `resolveOrganizationAndJob()` becomes:
1. Source override (existing)
2. Job ID prefix inference (existing)
3. `job_listing_id` lookup (existing)
4. `org_slug` lookup (existing)
5. **NEW: Direct `organization_id` + optional `client_id`**
6. Fallback to CR England (existing)

On the frontend, `useApplyContext` gains a new branch: if no job is found but `client_id` is present, it queries `public_client_info` directly to get the client name and logo for the header display. No job title or location is shown since no specific job is targeted.
