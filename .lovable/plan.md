

## Plan: Switch Trucks For You Inc to Internal Application Flow

### Problem
All 25 Trucks For You Inc job listings currently have `apply_url` set to external CDL JobCast landing pages. The platform's routing logic redirects applicants to external URLs when `apply_url` is populated, bypassing your internal application form.

### Solution
Run a single database migration to set `apply_url = NULL` for all 25 Trucks For You Inc jobs. This will cause the platform to use the internal Apply AI application flow (`/apply?job_id=...` or `/jobs/{id}`).

### Migration SQL
```sql
UPDATE job_listings
SET apply_url = NULL, updated_at = now()
WHERE client_id = 'cc4a05e9-2c87-4e71-b7f5-49d8bd709540'
  AND status = 'active';
```

### Result
After this change, the internal application links will be:
- `https://applyai.jobs/apply?job_id={uuid}` — direct apply
- `https://applyai.jobs/jobs/{uuid}` — job detail page with apply button

All 25 locations will route through your full internal application form.

### Technical Details
- Single UPDATE migration, no triggers need disabling (no bulk INSERT)
- No code changes required — the routing logic in `src/features/external-vs-internal-apply-routing` already handles NULL `apply_url` as internal

