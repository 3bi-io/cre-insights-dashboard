
## Integration Plan: James Burg Trucking Company

### Overview
Add James Burg Trucking Company (client ID: `b2a29507-32a6-4f5e-85d6-a7e6ffac3c52`) to the Hayes Recruiting Solutions system with job ID prefix `14496`. This involves three coordinated file modifications following the established Hayes client pattern.

### Key Information
- **Organization**: Hayes Recruiting Solutions (`84214b48-7b51-45bc-ad7f-723bcf50466c`)
- **Client ID**: `b2a29507-32a6-4f5e-85d6-a7e6ffac3c52`
- **Job ID Prefix**: `14496`
- **Client Slug**: `james-burg` (for URLs and UTM tracking)
- **Feed Status**: Placeholder URL ready when CDL Job Cast provides the full user code

### Files to Modify

#### 1. **supabase/functions/_shared/application-processor.ts**
**Lines 13-52** - Add prefix mappings for James Burg

**Change 1**: Add to `JOB_ID_PREFIX_ORG_MAP` (line 31)
- Entry: `'14496': HAYES_ORG_ID` with comment "James Burg Trucking Company"

**Change 2**: Add to `HAYES_JOB_ID_CLIENT_MAP` (line 52)
- Entry: `'14496': 'b2a29507-32a6-4f5e-85d6-a7e6ffac3c52'` (James Burg client ID)

**Purpose**: Routes inbound applications with the `14496` job prefix to James Burg Trucking Company and resolves the client ID automatically.

#### 2. **supabase/functions/_shared/hayes-client-handler.ts**
**Lines 398-427** - Add James Burg configuration to `HAYES_CLIENT_CONFIGS`

**New Entry** (after Novco entry):
```
'james-burg': {
  clientId: 'b2a29507-32a6-4f5e-85d6-a7e6ffac3c52',
  clientName: 'James Burg Trucking Company',
  clientSlug: 'james-burg',
  feedUserCode: '[PLACEHOLDER: Get from CDL Job Cast]',
  feedBoard: 'AIRecruiter',
}
```

**Purpose**: Provides the configuration factory for the dedicated Hayes endpoint to use.

#### 3. **supabase/functions/hayes-jamesburg-inbound/index.ts** (NEW FILE)
Create a new dedicated endpoint following the exact pattern of `hayes-danny-herman-inbound.ts`, `hayes-pemberton-inbound.ts`, etc.

**Template**:
```typescript
/**
 * Hayes James Burg Trucking Inbound Endpoint
 * 
 * Client-specific endpoint for James Burg Trucking Company:
 * - Job sync: GET /functions/v1/hayes-jamesburg-inbound?action=jobs
 * - Application: POST /functions/v1/hayes-jamesburg-inbound
 * 
 * All jobs and applications are automatically routed to James Burg Trucking Company
 * with client-specific UTM tracking (utm_campaign=james-burg).
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClientHandler, HAYES_CLIENT_CONFIGS } from '../_shared/hayes-client-handler.ts';

const handler = createClientHandler(HAYES_CLIENT_CONFIGS['james-burg']);

serve(handler);
```

**Purpose**: Provides a dedicated inbound endpoint at `/functions/v1/hayes-jamesburg-inbound` exclusively for James Burg traffic, matching the architecture for other Hayes clients.

#### 4. **supabase/functions/sync-cdl-feeds/index.ts** (OPTIONAL - Ready for Later)
**Lines 16-37** - Will add to `CDL_FEEDS` array once the feed URL is confirmed

**When Feed URL Available**, add entry:
```javascript
{
  clientId: 'b2a29507-32a6-4f5e-85d6-a7e6ffac3c52',
  clientName: 'James Burg Trucking Company',
  feedUrl: '[PLACEHOLDER: https://cdljobcast.com/client/recruiting/getfeeds?user=...]'
}
```

This enables the 5-minute automated job sync once the feed becomes active.

### Implementation Sequence

1. **Update application-processor.ts** - Add prefix mappings (enables application routing immediately)
2. **Update hayes-client-handler.ts** - Add configuration (prepares handler factory)
3. **Create hayes-jamesburg-inbound/index.ts** - New edge function (enables dedicated endpoint)
4. **Update sync-cdl-feeds/index.ts** - Add feed configuration (when URL is available)

### Expected Outcomes

**Immediately After Changes 1-3**:
- Inbound applications with job prefix `14496` automatically route to James Burg Trucking Company (`client_id: b2a29507-32a6-4f5e-85d6-a7e6ffac3c52`)
- Dedicated endpoint available at: `https://functions.supabase.co/functions/v1/hayes-jamesburg-inbound`
- Applications POST to endpoint with `utm_campaign=james-burg` attribution
- Manual job creation and direct application submissions work correctly

**After Feed URL Added (Change 4)**:
- Automated 5-minute job sync from CDL Job Cast begins
- Jobs appear in Hayes dashboard with James Burg attribution
- Applications from the feed are automatically routed to James Burg

### Technical Notes

- **No Database Migration Required**: All changes are configuration-driven; the client already exists in the database
- **Backward Compatible**: Existing prefix mappings unchanged; James Burg is a pure addition
- **Edge Function Auto-Deployment**: The new file will auto-deploy when committed; no manual deployment needed
- **Consistent Pattern**: Follows identical architecture as existing Hayes clients (Danny Herman, Pemberton, Novco, Day and Ross)
- **UTM Tracking**: Applications get `utm_campaign=james-burg` for proper attribution tracking

### Testing Checklist (After Implementation)

1. Test application routing by submitting application with job ID `14496*`
2. Verify application appears in Hayes dashboard under James Burg Trucking
3. Confirm UTM parameters (`utm_source=cdl_jobcast`, `utm_campaign=james-burg`) are captured
4. Verify dedicated endpoint is accessible
5. Test with actual feed URL once CDL Job Cast confirms it

