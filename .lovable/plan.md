

## Zapier Inbound Webhook for R.E. Garrison Applications

### What This Does
Creates a dedicated webhook endpoint that Zapier can POST application data to for R.E. Garrison driver applications. The endpoint will accept flexible field mappings (since Zapier payloads vary by source), insert the application into the database, and trigger ATS delivery — all without requiring authentication so Zapier can call it directly.

### Why Not Use the Existing Endpoint?
The existing `hayes-inbound?client=re-garrison` endpoint works but is optimized for CDL JobCast structured data. A Zapier-specific endpoint provides:
- Broader field mapping (Zapier sends data from many sources with inconsistent field names)
- Duplicate detection (prevent re-processing the same lead)
- Zapier-friendly response format
- Clear UTM attribution (`source: zapier`)

### Implementation

**1. Create `supabase/functions/hayes-garrison-zapier/index.ts`**

A new edge function that:
- Accepts POST with `no-cors` compatible responses
- Maps flexible Zapier field names (e.g., `firstName` / `first_name` / `candidate_first_name`)
- Normalizes phone numbers via existing `normalizePhone` utility
- Routes to R.E. Garrison client (`be8b645e-d480-4c22-8e75-b09a7fc1db7a`) under Hayes org
- Uses `findOrCreateJobListing` to resolve or create a General Application fallback
- Inserts the application with `source: 'zapier'`, `utm_campaign: 're-garrison'`
- Triggers `autoPostToATS` via `EdgeRuntime.waitUntil` for ATS delivery
- 24-hour duplicate detection by phone or email
- Returns `{ success: true, applicationId }` for Zapier to log

**2. Register in `supabase/config.toml`**
- Add `[functions.hayes-garrison-zapier]` with `verify_jwt = false` (Zapier cannot send JWTs)

**3. No frontend changes required**

### Webhook URL for Zapier
Once deployed, the URL will be:
```
https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/hayes-garrison-zapier
```

### Expected Zapier Payload Format
The endpoint will accept any combination of these fields:
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "555-123-4567",
  "email": "john@example.com",
  "city": "Atlanta",
  "state": "GA",
  "zip": "30301",
  "cdl": "Yes",
  "exp": "3 years",
  "job_title": "CDL-A Driver",
  "notes": "Any additional info"
}
```

### Files Changed
| File | Action |
|------|--------|
| `supabase/functions/hayes-garrison-zapier/index.ts` | Create |
| `supabase/config.toml` | Add function config |

