

## Fix: Show actual client name and logo on public job detail page

### Problem
The public job detail page (`/jobs/:id`) shows "Company" and a generic icon instead of the real client name and logo. This is because `useJobDetails` joins the `clients` table directly, which is blocked by RLS for unauthenticated visitors. The data comes back as `null`.

### Root cause
- `useJobDetails` query: `clients(id, name, logo_url)` — this join hits the `clients` table, which has RLS that blocks public access.
- Every other public-facing component (jobs list, apply page, clients page, related jobs) correctly uses the `public_client_info` view instead.

### Fix

**`src/hooks/useJobDetails.tsx`**
- After fetching the job listing (which returns `client_id`), make a second query to `public_client_info` to get `name` and `logo_url` — the same pattern used in `useApplyContext` and `RelatedJobs`.
- Merge the client info into the returned object so the rest of the page works unchanged.
- Remove `clients(id, name, logo_url)` from the join since it fails for public users anyway.

**No other files need changes** — `JobDetailsPage.tsx` already reads `job.clients?.name` and `job.clients?.logo_url`, so we just need to populate that object from the public view instead.

### Technical detail

```text
Current (broken for public):
  job_listings.select('*, clients(id, name, logo_url), ...')
  → clients = null due to RLS

Fixed:
  1. job_listings.select('*, job_categories(id, name)') — drop clients join
  2. public_client_info.select('id, name, logo_url').eq('id', data.client_id)
  3. Return { ...data, clients: clientInfo } 
```

Single file change, same pattern already proven in 5+ other components.

