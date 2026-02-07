
# Client-Specific Inbound Endpoints for Hayes Clients

## Overview

This plan creates dedicated inbound edge function endpoints for each Hayes Recruiting client (Danny Herman, Pemberton, Day and Ross, Novco). These client-specific endpoints will:
- Narrow job/application matching to the specific client
- Eliminate the need for job_id prefix matching logic
- Provide cleaner, more reliable routing
- Enable client-specific UTM campaigns and tracking

---

## Current State

### Hayes Clients (Confirmed)
| Client Name | Client ID | CDL Job Cast User Code |
|-------------|-----------|------------------------|
| Danny Herman Trucking | `1d54e463-4d7f-4a05-8189-3e33d0586dea` | `danny_herman_trucking` |
| Day and Ross | `30ab5f68-258c-4e81-8217-1123c4536259` | `Day-and-Ross-1745523293` |
| Novco, Inc. | `4a9ef1df-dcc9-499c-999a-446bb9a329fc` | `Novco%2C-Inc.-1760547390` |
| Pemberton Truck Lines Inc | `67cadf11-8cce-41c6-8e19-7d2bb0be3b03` | `Pemberton-Truck-Lines-1749741664` |
| Hayes AI Recruiting | `49dce1cb-4830-440d-8835-6ce59b552012` | (direct jobs) |

### Current Endpoint Architecture
- **Generic endpoint**: `/functions/v1/cdl-jobcast-inbound` requires query parameters for client routing
- **Job ID prefix matching**: Uses 5-digit prefix to infer client (fragile, requires maintenance)
- **sync-cdl-feeds**: Hardcoded client configurations

---

## Solution Architecture

```text
+--------------------------------------------------+
|          External Partner (CDL Job Cast)         |
+--------------------------------------------------+
           |                    |
           v                    v
+---------------------+  +---------------------+
| /v1/hayes-danny-    |  | /v1/hayes-pemberton-|
|    herman-inbound   |  |    inbound          |
+----------+----------+  +----------+----------+
           |                    |
           +--------+-----------+
                    |
                    v
         +-----------------------+
         |  Shared Handler Logic |
         |  (new _shared module) |
         +-----------------------+
                    |
                    v
         +-----------------------+
         | inbound-applications  |
         +-----------------------+
```

---

## Implementation Details

### Phase 1: Create Shared Client Inbound Handler

Create a new shared module `supabase/functions/_shared/hayes-client-handler.ts` that:
- Accepts client configuration (ID, name, feed URL, UTM settings)
- Handles both job sync and application forwarding
- Returns standardized responses

```typescript
// New module structure
interface HayesClientConfig {
  clientId: string;
  clientName: string;
  clientSlug: string;  // URL-safe slug
  feedUserCode: string;
  feedBoard: string;
  utmCampaign?: string;
}

export function createClientHandler(config: HayesClientConfig) {
  return wrapHandler(async (req: Request) => {
    // Pre-configure all routing to this specific client
    // No need for job_id prefix matching
  });
}
```

### Phase 2: Create Client-Specific Edge Functions

Create 4 new edge functions (one per client):

| Function Name | Client | Endpoint Path |
|---------------|--------|---------------|
| `hayes-danny-herman-inbound` | Danny Herman Trucking | `/functions/v1/hayes-danny-herman-inbound` |
| `hayes-pemberton-inbound` | Pemberton Truck Lines | `/functions/v1/hayes-pemberton-inbound` |
| `hayes-dayross-inbound` | Day and Ross | `/functions/v1/hayes-dayross-inbound` |
| `hayes-novco-inbound` | Novco, Inc. | `/functions/v1/hayes-novco-inbound` |

Each function will be minimal, delegating to the shared handler:

```typescript
// hayes-danny-herman-inbound/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClientHandler } from '../_shared/hayes-client-handler.ts';

const handler = createClientHandler({
  clientId: '1d54e463-4d7f-4a05-8189-3e33d0586dea',
  clientName: 'Danny Herman Trucking',
  clientSlug: 'danny-herman',
  feedUserCode: 'danny_herman_trucking',
  feedBoard: 'AIRecruiter',
});

serve(handler);
```

### Phase 3: Endpoint Capabilities

Each client endpoint will support:

**Jobs Import (GET or action=jobs)**
```
GET /functions/v1/hayes-danny-herman-inbound?action=jobs
```
- Fetches jobs from client's CDL Job Cast feed
- Routes all jobs to the specific client
- Applies client-specific UTM tracking

**Application Forwarding (POST or action=apps)**
```
POST /functions/v1/hayes-danny-herman-inbound
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "555-123-4567",
  "job_id": "14204123456"
}
```
- Auto-routes to client's jobs
- Falls back to client-specific General Application
- Applies client UTM attribution

**Auto-Detection (default)**
- POST with application fields: processes as application
- GET or empty POST: processes as job sync

### Phase 4: Update Application Processor

Modify `_shared/application-processor.ts` to accept explicit `clientId` parameter that bypasses job_id prefix matching:

```typescript
export const findOrCreateJobListing = async (
  supabase: SupabaseClient,
  params: {
    // Existing params...
    clientId?: string | null;  // When provided, skips prefix inference
    forceClientMatch?: boolean; // When true, only matches within client
  }
)
```

---

## Client Endpoint Reference

After implementation, the following endpoints will be available:

### Danny Herman Trucking
```
# Job Sync
GET https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/hayes-danny-herman-inbound?action=jobs

# Application Submission
POST https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/hayes-danny-herman-inbound
```

### Pemberton Truck Lines Inc
```
# Job Sync
GET https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/hayes-pemberton-inbound?action=jobs

# Application Submission
POST https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/hayes-pemberton-inbound
```

### Day and Ross
```
# Job Sync
GET https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/hayes-dayross-inbound?action=jobs

# Application Submission
POST https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/hayes-dayross-inbound
```

### Novco, Inc.
```
# Job Sync
GET https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/hayes-novco-inbound?action=jobs

# Application Submission
POST https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/hayes-novco-inbound
```

---

## Technical Details

### Files to Create
| File | Purpose |
|------|---------|
| `supabase/functions/_shared/hayes-client-handler.ts` | Shared handler factory |
| `supabase/functions/hayes-danny-herman-inbound/index.ts` | Danny Herman endpoint |
| `supabase/functions/hayes-pemberton-inbound/index.ts` | Pemberton endpoint |
| `supabase/functions/hayes-dayross-inbound/index.ts` | Day and Ross endpoint |
| `supabase/functions/hayes-novco-inbound/index.ts` | Novco endpoint |

### Files to Modify
| File | Change |
|------|--------|
| `supabase/functions/_shared/application-processor.ts` | Add `forceClientMatch` parameter |

### Backwards Compatibility
- Existing `/cdl-jobcast-inbound` endpoint remains functional
- Job ID prefix matching continues to work as fallback
- New endpoints are additive, not replacement

---

## Implementation Sequence

1. Create shared handler module `hayes-client-handler.ts`
2. Create Danny Herman endpoint (test first)
3. Create remaining 3 client endpoints
4. Update application processor for explicit client matching
5. Test all endpoints with job sync and application submission
6. Document endpoints for CDL Job Cast integration team

---

## Benefits

1. **Simpler routing**: No job_id prefix maintenance required
2. **Cleaner URLs**: Partner-friendly endpoint names
3. **Better tracking**: Client-specific UTM campaigns automatic
4. **Easier debugging**: Logs clearly show which client endpoint was hit
5. **Scalability**: Adding new clients only requires one new minimal file
