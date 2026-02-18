

# Push Data to hayesairecruiting.com via Public API

## Summary

Hayes AI Recruiting wants to display their clients' jobs and application data on their own website (hayesairecruiting.com), not on the ats.me dashboard. The solution is to create a **secure public API edge function** that hayesairecruiting.com can call to fetch their data, authenticated via an API key.

## Architecture

The external website (hayesairecruiting.com) makes fetch requests to a new edge function on your Supabase backend. The function validates an API key, then returns Hayes-specific data (clients, jobs, applications) in JSON format that their frontend can render however they want.

```text
hayesairecruiting.com (their site)
       |
       | fetch() with API key header
       v
[organization-api] edge function
       |
       | Validates API key against org_api_keys table
       | Queries clients, job_listings, applications
       v
Returns JSON payload
```

## What Gets Built

### 1. Database: `org_api_keys` Table

A new table to store API keys for organizations that want external API access.

```sql
CREATE TABLE public.org_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  label TEXT DEFAULT 'Default',
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE org_api_keys ENABLE ROW LEVEL SECURITY;

-- Only org admins can manage their keys
CREATE POLICY "Admins manage own org API keys" ON org_api_keys
  FOR ALL TO authenticated
  USING (
    organization_id = get_user_organization_id()
    AND (has_role(auth.uid(), 'admin') OR is_super_admin(auth.uid()))
  );
```

### 2. Edge Function: `organization-api`

A new edge function (`supabase/functions/organization-api/index.ts`) with these endpoints:

- **GET /clients** -- Returns list of clients with job counts and application counts
- **GET /jobs?client_id=...** -- Returns jobs for a specific client (or all)
- **GET /applications?client_id=...&status=...** -- Returns applications with filters
- **GET /stats** -- Returns summary KPIs (total apps, by status, by client, trends)

Authentication: `x-api-key` header validated against `org_api_keys` table.

CORS: Configured to allow requests from `hayesairecruiting.com`.

### 3. Admin UI: API Key Management

A small component on the dashboard (under Settings or a new "Integrations" tab) where Hayes admins can:
- Generate an API key
- Copy it to clipboard
- Revoke/regenerate keys
- See last used timestamp

### 4. What Hayes Gets

After deployment, Hayes receives:
1. An API key (generated from the dashboard)
2. API endpoint URLs they can call from their website
3. Example fetch code they can drop into their site

Example usage from their website:
```javascript
const response = await fetch(
  'https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/organization-api/clients',
  { headers: { 'x-api-key': 'their_api_key_here' } }
);
const data = await response.json();
// Render client cards, job listings, application stats
```

## Technical Details

### Edge Function Response Shapes

**GET /clients**
```json
{
  "clients": [
    {
      "id": "...",
      "name": "Danny Herman Trucking",
      "city": "Mountain City",
      "state": "TN",
      "active_jobs": 12,
      "total_applications": 32,
      "applications_this_month": 8
    }
  ]
}
```

**GET /jobs?client_id=xxx**
```json
{
  "jobs": [
    {
      "id": "...",
      "title": "OTR CDL-A Driver",
      "location": "Mountain City, TN",
      "status": "active",
      "application_count": 5,
      "created_at": "2026-02-01T..."
    }
  ]
}
```

**GET /applications?client_id=xxx**
```json
{
  "applications": [
    {
      "id": "...",
      "first_name": "John",
      "last_name": "Doe",
      "status": "pending",
      "applied_at": "2026-02-17T...",
      "job_title": "OTR CDL-A Driver",
      "client_name": "Danny Herman Trucking",
      "source": "Indeed"
    }
  ],
  "total": 32
}
```

**GET /stats**
```json
{
  "total_clients": 6,
  "active_jobs": 45,
  "total_applications": 57,
  "applications_by_status": { "pending": 30, "reviewed": 12, "hired": 5 },
  "applications_by_client": { "Danny Herman Trucking": 32, "Pemberton": 20 },
  "applications_this_week": 8
}
```

### Security

- No PII fields (SSN, DOB, government ID) are ever returned via this API
- API key is validated server-side on every request
- `last_used_at` is updated on each call for audit
- Keys can be revoked instantly from the dashboard
- CORS restricted to hayesairecruiting.com (plus wildcard for dev)

### Files Created/Modified

1. **New**: `supabase/functions/organization-api/index.ts` -- The API edge function
2. **New**: SQL migration for `org_api_keys` table
3. **New**: `src/components/dashboard/organization/APIKeyManager.tsx` -- UI for key management
4. **Modified**: `src/features/dashboard/config/dashboardConfig.tsx` -- Add API/Integrations tab
5. **Modified**: `supabase/config.toml` -- Add `verify_jwt = false` for the new function

