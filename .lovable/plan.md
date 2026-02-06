
# Universal CDL Job Cast Inbound Feed Endpoint with UTM Attribution

## Summary
Create a universal inbound endpoint for CDL Job Cast job listings that automatically resolves all required UTM parameters, populates apply URLs with proper attribution, and enhances the platform UI for optimal user experience. This includes retroactive updates to existing job listings and applications.

## Current Architecture Analysis

| Component | Current State |
|-----------|---------------|
| `inbound-applications` | Handles CDL Job Cast applications with source detection but no UTM capture |
| `sync-cdl-feeds` | Syncs jobs from CDL Job Cast but doesn't set proper apply_url with UTM |
| `import-jobs-from-feed` | Imports jobs but uses external CDL Job Cast URLs without UTM |
| `applications` table | Has utm_source, utm_medium, utm_campaign columns but they're empty |
| `job_listings` table | apply_url points to CDL Job Cast redirect URLs, not internal tracked URLs |

## Problem Statement

1. **No UTM attribution on job listings** - Jobs imported from CDL Job Cast have external apply_url or null
2. **No UTM capture on inbound applications** - Applications from CDL Job Cast don't populate utm_* columns
3. **Platform UI lacks visibility** - No clear source attribution in dashboard views
4. **Retroactive gap** - Existing applications and jobs lack attribution data

## Solution: Universal Inbound Feed Endpoint

### Architecture Overview

```text
CDL Job Cast Feed
       |
       v
+----------------------------------+
| /functions/v1/cdl-jobcast-inbound |
+----------------------------------+
       |
       +-- ?action=jobs    --> Import/sync job listings with UTM-tracked apply_url
       |
       +-- ?action=apps    --> Forward to inbound-applications with UTM params
       |
       +-- (default)       --> Auto-detect content type and route
```

### New Edge Function: `cdl-jobcast-inbound`

Create a unified endpoint that:
1. Accepts both job listings and applications from CDL Job Cast
2. Auto-generates internal apply_url with UTM parameters for each job
3. Extracts and forwards UTM parameters to the applications table
4. Logs all activity for analytics

### UTM Parameter Strategy

| Parameter | Value | Purpose |
|-----------|-------|---------|
| utm_source | `cdl_jobcast` | Identifies CDL Job Cast as the traffic source |
| utm_medium | `job_board` | Standard medium for job aggregators |
| utm_campaign | `{client_name}_q{quarter}_{year}` | Auto-generated campaign tracking |

### Apply URL Format

```text
https://ats.me/apply?job_id={job_listing_id}&utm_source=cdl_jobcast&utm_medium=job_board&utm_campaign={campaign}
```

## Implementation Plan

### Phase 1: Create Universal Inbound Endpoint

**New file: `supabase/functions/cdl-jobcast-inbound/index.ts`**

```text
Key responsibilities:
1. Accept GET/POST requests from CDL Job Cast
2. Parse query params: action, client_name, board
3. Route to appropriate handler:
   - jobs: Fetch and import job listings with UTM-enriched apply_url
   - applications: Parse application data, add UTM, forward to inbound-applications
4. Return success response with processing summary
```

### Phase 2: Enhance inbound-applications for UTM

**Modify: `supabase/functions/inbound-applications/index.ts`**

```text
Changes:
1. Add UTM parameter extraction from query params and body
2. Map extracted values to application record:
   - utm_source (from ?utm_source or body.utm_source)
   - utm_medium (from ?utm_medium or body.utm_medium)
   - utm_campaign (from ?utm_campaign or body.utm_campaign)
3. Default UTM values for CDL Job Cast source when not provided
```

### Phase 3: Update sync-cdl-feeds for UTM Apply URLs

**Modify: `supabase/functions/sync-cdl-feeds/index.ts`**

```text
Changes:
1. Generate internal apply_url with UTM parameters instead of using external URLs
2. Apply URL format: https://ats.me/apply?job_id={uuid}&utm_source=cdl_jobcast&utm_medium=job_board
3. Update existing jobs with new apply_url format during sync
```

### Phase 4: Retroactive Data Migration

**New migration: `migrations/xxx_retroactive_utm_attribution.sql`**

```text
1. Update applications with source = 'CDL Job Cast' to set:
   - utm_source = 'cdl_jobcast'
   - utm_medium = 'job_board'

2. Update job_listings for Hayes organization to use internal apply_url:
   - Replace CDL Job Cast redirect URLs with internal tracked URLs
```

### Phase 5: UI Enhancements

**Modify application and job listing views to display UTM attribution:**

1. Add UTM columns to admin applications table
2. Add source attribution badges in dashboard
3. Update analytics to group by UTM parameters

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/cdl-jobcast-inbound/index.ts` | **CREATE** | New universal endpoint for CDL Job Cast |
| `supabase/functions/inbound-applications/index.ts` | MODIFY | Add UTM extraction and mapping |
| `supabase/functions/sync-cdl-feeds/index.ts` | MODIFY | Generate UTM-enriched apply_url |
| `supabase/functions/import-jobs-from-feed/index.ts` | MODIFY | Add UTM apply_url generation |
| `supabase/migrations/xxx_retroactive_utm.sql` | **CREATE** | Backfill UTM data |
| `supabase/config.toml` | MODIFY | Register new cdl-jobcast-inbound function |

## Universal Endpoint Specification

### Endpoint
```text
GET/POST https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/cdl-jobcast-inbound
```

### Query Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| action | No | auto | `jobs`, `apps`, or `auto` (detect from content) |
| client_name | No | - | Client identifier for routing |
| board | No | ATSme | CDL Job Cast board name |
| user | No | * | CDL Job Cast user parameter |
| utm_source | No | cdl_jobcast | Override default source |
| utm_medium | No | job_board | Override default medium |
| utm_campaign | No | auto | Custom campaign name or auto-generate |

### Response Format
```json
{
  "success": true,
  "action": "jobs",
  "processed": 15,
  "inserted": 5,
  "updated": 10,
  "utm_attribution": {
    "source": "cdl_jobcast",
    "medium": "job_board",
    "campaign": "danny_herman_q1_2026"
  }
}
```

## Benefits

1. **Single endpoint** - One URL for all CDL Job Cast integrations
2. **Automatic UTM** - Every job and application gets proper attribution
3. **Retroactive fix** - Existing data will be updated with proper tracking
4. **Platform analytics** - Full visibility into CDL Job Cast performance
5. **Internal apply URLs** - All traffic routes through ats.me for consistent tracking

## Technical Details

### UTM Parameter Extraction (inbound-applications)

```typescript
// Extract UTM from multiple sources with priority
const utmSource = extractValue(body, ['utm_source', 'source']) 
  || url.searchParams.get('utm_source')
  || (applicationData.source === 'CDL Job Cast' ? 'cdl_jobcast' : null);

const utmMedium = extractValue(body, ['utm_medium', 'medium'])
  || url.searchParams.get('utm_medium')
  || (applicationData.source === 'CDL Job Cast' ? 'job_board' : null);

const utmCampaign = extractValue(body, ['utm_campaign', 'campaign_id', 'campaign'])
  || url.searchParams.get('utm_campaign')
  || generateCampaignName(clientName);
```

### Apply URL Generation (sync-cdl-feeds)

```typescript
const generateApplyUrl = (jobListingId: string, clientName: string): string => {
  const baseUrl = 'https://ats.me/apply';
  const params = new URLSearchParams({
    job_id: jobListingId,
    utm_source: 'cdl_jobcast',
    utm_medium: 'job_board',
    utm_campaign: `${slugify(clientName)}_recruitment_${new Date().getFullYear()}`
  });
  return `${baseUrl}?${params.toString()}`;
};
```

### Retroactive Migration

```sql
-- Update existing CDL Job Cast applications with UTM data
UPDATE applications 
SET 
  utm_source = 'cdl_jobcast',
  utm_medium = 'job_board',
  utm_campaign = 'cdl_retroactive_' || to_char(applied_at, 'YYYY_Q')
WHERE source = 'CDL Job Cast'
  AND utm_source IS NULL;

-- Update job listings with internal apply URLs
UPDATE job_listings 
SET 
  apply_url = 'https://ats.me/apply?job_id=' || id::text || 
              '&utm_source=cdl_jobcast&utm_medium=job_board',
  updated_at = now()
WHERE organization_id = '84214b48-7b51-45bc-ad7f-723bcf50466c'
  AND status = 'active'
  AND (apply_url IS NULL OR apply_url LIKE '%cdljobcast.com%');
```

## Testing Strategy

1. Test new endpoint with sample CDL Job Cast payload
2. Verify UTM parameters appear in applications table
3. Verify job listings have proper apply_url
4. Check analytics dashboards for UTM grouping
5. Validate retroactive migration doesn't affect existing data integrity

