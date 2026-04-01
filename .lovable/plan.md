

## Plan: Raw Payload Logging + Source/Platform Passthrough for hayes-garrison-zapier

### Problem
The Zapier handler hardcodes `source: 'zapier'`, `utm_source: 'zapier'`, `utm_medium: 'webhook'`, discarding any actual lead origin (Facebook, Indeed, etc.) present in the Zapier payload. There is also no way to debug what Zapier actually sent.

### Changes

#### 1. Migration: Add `raw_payload` JSONB column to `applications`
- Add `raw_payload JSONB NULL` to the `applications` table
- This stores the complete inbound payload for debugging any source

#### 2. Update `hayes-garrison-zapier/index.ts`

**Expand `mapFields`** to extract source/platform/UTM fields from the payload:
- `lead_source` / `source` / `lead_origin` / `traffic_source` → used as `source` (fallback: `'zapier'`)
- `platform` / `lead_platform` / `source_platform` → stored in `referral_source`
- `utm_source` / `utmSource` → used as `utm_source` (fallback: `'zapier'`)
- `utm_medium` / `utmMedium` → used as `utm_medium` (fallback: `'webhook'`)
- `utm_campaign` / `utmCampaign` → used as `utm_campaign` (fallback: `'re-garrison'`)
- `how_did_you_hear` / `hear_about_us` → stored in `how_did_you_hear`

**Store raw payload**: Pass `raw_payload: body` (the original JSON object) into the application insert.

**Log raw payload**: Add a `logger.info` call with the raw body keys for observability.

### Files changed
- New migration SQL — adds `raw_payload` column
- `supabase/functions/hayes-garrison-zapier/index.ts` — source passthrough + raw payload storage

### What this enables
- Zapier payloads that include `lead_source: 'facebook'` or `utm_source: 'indeed'` will flow through to the application record
- The raw payload is always preserved for debugging field mapping issues
- Hardcoded values become fallbacks only, not overwrites

