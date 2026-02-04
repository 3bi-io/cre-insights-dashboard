

# Fix Client Name Display in Apply Pages

## Problem Identified

During end-to-end testing, we discovered that **client names are not displaying** on the `/apply` and `/apply/detailed` pages. The header shows only the job title and location, but the client name (e.g., "Pemberton Truck Lines Inc") is missing.

**Root Cause**: The `useApplyContext` hook attempts to join `clients` directly in the Supabase query, but RLS (Row Level Security) blocks anonymous users from accessing the `clients` table. The query returns `clients: null`.

**Evidence**:
```json
// Network response from Supabase
{"id":"128f613c-...","title":"CDL A Truck Driver - Regional Southeast Runs","city":"Hendersonville","state":"TN","clients":null}
```

Meanwhile, the `public_client_info` view is accessible and contains the client name:
```json
{"id":"67cadf11-...","name":"Pemberton Truck Lines Inc","city":"Knoxville","state":"TN"}
```

---

## Solution

Update `useApplyContext` to use a two-step query pattern:

1. Fetch job listing with `client_id` (not joining clients)
2. Fetch client name from `public_client_info` view using the `client_id`

---

## Implementation

### Step 1: Update useApplyContext Hook

**File**: `src/hooks/useApplyContext.ts`

```typescript
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface ApplyContext {
  jobTitle: string | null;
  clientName: string | null;
  location: string | null;
  jobListingId: string | null;
  source: string | null;
  isLoading: boolean;
}

export const useApplyContext = (): ApplyContext => {
  const [searchParams] = useSearchParams();
  const [context, setContext] = useState<ApplyContext>({
    jobTitle: null,
    clientName: null,
    location: null,
    jobListingId: null,
    source: null,
    isLoading: true,
  });

  useEffect(() => {
    const fetchContext = async () => {
      const jobListingId = searchParams.get('job_listing_id') || 
                          searchParams.get('jobListingId') || 
                          searchParams.get('job') ||
                          searchParams.get('job_id') ||
                          searchParams.get('jobId');

      const utmSource = searchParams.get('utm_source') || 
                        searchParams.get('utmSource') || 
                        searchParams.get('source');

      if (jobListingId) {
        // Step 1: Fetch job listing (get client_id, not joining clients due to RLS)
        const { data: jobListing } = await supabase
          .from('job_listings')
          .select('id, title, city, state, client_id')
          .eq('id', jobListingId)
          .maybeSingle();

        if (jobListing) {
          let clientName: string | null = null;

          // Step 2: Fetch client name from public_client_info view
          if (jobListing.client_id) {
            const { data: clientInfo } = await supabase
              .from('public_client_info')
              .select('name')
              .eq('id', jobListing.client_id)
              .maybeSingle();
            
            clientName = clientInfo?.name || null;
          }
          
          setContext({
            jobTitle: jobListing.title,
            clientName,
            location: jobListing.city && jobListing.state 
              ? `${jobListing.city}, ${jobListing.state}` 
              : null,
            jobListingId: jobListing.id,
            source: utmSource,
            isLoading: false,
          });
          return;
        }
      }

      // No context found - generic application
      setContext({
        jobTitle: null,
        clientName: null,
        location: null,
        jobListingId: null,
        source: utmSource,
        isLoading: false,
      });
    };

    fetchContext();
  }, [searchParams]);

  return context;
};
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useApplyContext.ts` | Use two-step query: fetch job → fetch client from `public_client_info` |

---

## Expected Result

**Before** (current - broken):
```
CDL A Truck Driver - Regional Southeast Runs
📍 Hendersonville, TN
```

**After** (fixed):
```
CDL A Truck Driver - Regional Southeast Runs
🏢 Pemberton Truck Lines Inc  📍 Hendersonville, TN
```

---

## Technical Notes

- The `public_client_info` view has `security_invoker = false` allowing public access
- This pattern is consistent with how `/jobs` and `/jobs/:id` pages fetch client data
- No database changes required - only frontend code update
- Fix applies to both `/apply` and `/apply/detailed` pages since they share `useApplyContext`

