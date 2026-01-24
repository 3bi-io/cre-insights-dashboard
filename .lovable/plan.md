
# Add CR England Client Mappings to Application Processor

## Problem Analysis

The "Unassigned Company" issue is caused by **Hayes applications being incorrectly routed to CR England**:

1. Applications with 5-digit job ID prefixes (13979, 14204, 14294, 14361) are Hayes Recruiting jobs
2. These are coming in as "Direct Application" source (not "CDL Job Cast")
3. Without the CDL Job Cast source header, the organization override is bypassed
4. Applications fall through to CR England as the default fallback
5. CR England has no client mapping for 5-digit prefixes, so they become "Unassigned"

**Evidence from database:**
- 14 job listings in CR England with Hayes-style job IDs (13979J17117, 14204J19726, etc.) all assigned to "Unassigned" client
- These prefixes (13979, 14204, 14294, 14361) are also used by Hayes for Danny Herman Trucking and Pemberton Truck Lines

## Solution: Multi-Organization Job ID Routing

Add job ID prefix-based organization routing to catch misrouted applications. Additionally, add CR England's actual job ID mappings for their simpler ID patterns.

### Changes Overview

1. **Add organization-level job ID prefix mapping** - Route applications by job ID prefix when source detection fails
2. **Add CR England client mappings** - Map CR England's 2-3 digit job IDs to their clients
3. **Consolidate mapping logic** - Create helper functions for both org and client resolution

---

## Implementation Details

### File: `supabase/functions/_shared/application-processor.ts`

#### Add Organization Constants and Mappings

```typescript
// Organization IDs
const HAYES_ORG_ID = '84214b48-7b51-45bc-ad7f-723bcf50466c';
const CR_ENGLAND_ORG_ID = '682af95c-e95a-4e21-8753-ddef7f8c1749';

// Job ID prefix → Organization mapping (5-digit prefixes)
// Used when source-based routing fails to catch misrouted applications
const JOB_ID_PREFIX_ORG_MAP: Record<string, string> = {
  // Hayes Recruiting clients
  '13979': HAYES_ORG_ID, // Danny Herman Trucking
  '13980': HAYES_ORG_ID, // Danny Herman Trucking
  '13934': HAYES_ORG_ID, // Day and Ross
  '13991': HAYES_ORG_ID, // Day and Ross
  '14086': HAYES_ORG_ID, // Pemberton Truck Lines Inc
  '14204': HAYES_ORG_ID, // Danny Herman Trucking
  '14230': HAYES_ORG_ID, // Pemberton Truck Lines Inc
  '14279': HAYES_ORG_ID, // Day and Ross
  '14280': HAYES_ORG_ID, // Day and Ross
  '14284': HAYES_ORG_ID, // Novco, Inc.
  '14294': HAYES_ORG_ID, // Pemberton Truck Lines Inc
  '14361': HAYES_ORG_ID, // New Hayes prefix (observed)
};

// CR England Job ID → Client ID mapping (simple 2-3 digit IDs)
const CR_ENGLAND_JOB_ID_CLIENT_MAP: Record<string, string> = {
  // Sysco
  '13': 'e2619f0a-f111-4f6e-9c23-c5c618528b4a',
  // Family Dollar
  '328': '31bfde0f-8f96-4e88-9630-cc3a44910101',
  // Dollar Tree
  '338': '853d514a-bfe7-44f8-a02a-3f0b10e9642d',
  '361': '853d514a-bfe7-44f8-a02a-3f0b10e9642d',
  '371': '853d514a-bfe7-44f8-a02a-3f0b10e9642d',
  '882': '853d514a-bfe7-44f8-a02a-3f0b10e9642d',
  // Kroger
  '911': '0f406b8c-7eb7-4d84-b0d6-1e0ee287b20c',
};
```

#### Add New Exported Functions

```typescript
/**
 * Infer organization from job_id prefix
 * Used when source-based routing fails (e.g., Direct Application)
 */
export const getOrganizationFromJobId = (jobId: string | undefined | null): string | null => {
  if (!jobId || typeof jobId !== 'string' || jobId.length < 5) {
    return null;
  }
  const prefix = jobId.substring(0, 5);
  return JOB_ID_PREFIX_ORG_MAP[prefix] || null;
};

/**
 * Get client ID from job_id for a specific organization
 * Supports both Hayes (5-digit prefix) and CR England (exact match)
 */
export const getClientIdFromJobId = (
  jobId: string | undefined | null, 
  organizationId?: string
): string | null => {
  if (!jobId || typeof jobId !== 'string') {
    return null;
  }
  
  // Hayes: 5-digit prefix mapping
  if (organizationId === HAYES_ORG_ID && jobId.length >= 5) {
    const prefix = jobId.substring(0, 5);
    return HAYES_JOB_ID_CLIENT_MAP[prefix] || null;
  }
  
  // CR England: Exact job ID match
  if (organizationId === CR_ENGLAND_ORG_ID) {
    return CR_ENGLAND_JOB_ID_CLIENT_MAP[jobId] || null;
  }
  
  // Legacy: Try Hayes prefix matching without org context
  if (jobId.length >= 5) {
    const prefix = jobId.substring(0, 5);
    return HAYES_JOB_ID_CLIENT_MAP[prefix] || null;
  }
  
  return null;
};
```

#### Update findOrCreateJobListing Function

Modify the client inference logic to support both organizations:

```typescript
// Around line 118-126, update the client inference:
let clientId = params.clientId;
if (!clientId && jobId) {
  const inferredClientId = getClientIdFromJobId(jobId, organizationId);
  if (inferredClientId) {
    logger.info('Inferred client from job_id', { 
      jobId, 
      clientId: inferredClientId,
      organizationId 
    });
    clientId = inferredClientId;
  }
}
```

---

### File: `supabase/functions/submit-application/index.ts`

#### Import and Use Organization Inference

Add organization routing based on job ID when source-based routing fails:

```typescript
// Add import at top
import { getOrganizationFromJobId } from '../_shared/application-processor.ts';

// In resolveOrganizationAndJob function, after source override check (around line 370):
// Priority 0.5: Infer organization from job_id prefix
const jobIdFromPayload = /* extract job_id from request body or query */;
if (!foundOrg && jobIdFromPayload) {
  const inferredOrgId = getOrganizationFromJobId(jobIdFromPayload);
  if (inferredOrgId) {
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', inferredOrgId)
      .single();
    
    if (org) {
      logger.info('Resolved org from job_id prefix', { 
        jobId: jobIdFromPayload, 
        org_name: org.name 
      });
      return { 
        organizationId: org.id, 
        organizationName: org.name, 
        externalJobId: jobIdFromPayload, 
        jobTitle: null 
      };
    }
  }
}
```

---

### File: `supabase/functions/inbound-applications/index.ts`

Apply the same job ID prefix organization routing as submit-application:

```typescript
// Add same import and logic as submit-application
import { getOrganizationFromJobId } from '../_shared/application-processor.ts';

// Add job_id prefix check in organization resolution logic
```

---

## Data Cleanup (Optional Migration)

The existing misrouted job listings should be cleaned up:

```sql
-- Move Hayes job listings from CR England to Hayes
UPDATE job_listings
SET 
  organization_id = '84214b48-7b51-45bc-ad7f-723bcf50466c', -- Hayes
  client_id = CASE 
    WHEN LEFT(job_id, 5) = '13979' THEN '1d54e463-4d7f-4a05-8189-3e33d0586dea' -- Danny Herman
    WHEN LEFT(job_id, 5) = '14204' THEN '1d54e463-4d7f-4a05-8189-3e33d0586dea' -- Danny Herman
    WHEN LEFT(job_id, 5) = '14294' THEN '67cadf11-8cce-41c6-8e19-7d2bb0be3b03' -- Pemberton
    WHEN LEFT(job_id, 5) = '14361' THEN '67cadf11-8cce-41c6-8e19-7d2bb0be3b03' -- Pemberton (new)
  END
WHERE organization_id = '682af95c-e95a-4e21-8753-ddef7f8c1749' -- CR England
  AND job_id IS NOT NULL
  AND LENGTH(job_id) >= 5
  AND LEFT(job_id, 5) IN ('13979', '14204', '14294', '14361');

-- Also update applications linked to these job listings
-- (Applications reference job_listing_id so they'll follow automatically)
```

---

## Summary of Changes

| File | Changes |
|------|---------|
| `application-processor.ts` | Add `CR_ENGLAND_ORG_ID`, `JOB_ID_PREFIX_ORG_MAP`, `CR_ENGLAND_JOB_ID_CLIENT_MAP`, update `getClientIdFromJobId` to support both orgs, add `getOrganizationFromJobId` |
| `submit-application/index.ts` | Add job ID prefix-based organization routing |
| `inbound-applications/index.ts` | Add job ID prefix-based organization routing |
| Database migration (optional) | Move misrouted Hayes listings back to Hayes org |

## Testing After Implementation

1. Submit a test application with job_id `14294Jxxxxx` 
2. Verify it routes to Hayes Recruiting → Pemberton Truck Lines
3. Submit a test application with job_id `361`
4. Verify it routes to CR England → Dollar Tree
5. Check no new "Unassigned" listings are created
