
# Fix Pemberton Job Association Issue

## Problem Summary

Applications arriving from CDL Job Cast partners use internal reference numbers (e.g., `14294J16751`) that **do not match** the `referencenumber` values in the CDL XML feed (e.g., `14294J4215`). This causes the system to create new "General Application" listings instead of associating with existing jobs.

## Current State

| Metric | Value |
|--------|-------|
| Pemberton CDL Feed Jobs | 79 (properly titled) |
| Auto-created "General Application" | 18 total |
| Visible on /jobs page | 5 (should be hidden) |
| Hidden | 13 |

## Solution: Three-Part Fix

### Part 1: Immediate Database Cleanup

Hide the visible "General Application" listings that are polluting the public job board.

```sql
UPDATE job_listings 
SET is_hidden = true, updated_at = NOW()
WHERE client_id = '67cadf11-8cce-41c6-8e19-7d2bb0be3b03'
  AND title = 'General Application'
  AND is_hidden = false;
```

**Files Modified**: None (database migration only)

### Part 2: Application Processor Enhancement

Modify `findOrCreateJobListing` to attempt city/state matching when exact job_id match fails, before creating a new listing.

**File**: `supabase/functions/_shared/application-processor.ts`

Add location-based fallback logic after the job_id exact match fails (around line 229):

```typescript
// Step 2b: Try matching by city+state within client if job_id not found
if (city && state && clientId) {
  const { data: locationMatch } = await supabase
    .from('job_listings')
    .select('id, title, job_id')
    .eq('organization_id', organizationId)
    .eq('client_id', clientId)
    .ilike('city', city)
    .ilike('state', state)
    .eq('status', 'active')
    .neq('title', 'General Application')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (locationMatch) {
    logger.info('Matched by city/state fallback', {
      originalJobId: jobId,
      matchedJobId: locationMatch.job_id,
      matchedListingId: locationMatch.id,
      city,
      state
    });
    return { id: locationMatch.id, matchType: 'location_fallback' };
  }
}
```

### Part 3: Fix CDL Feed Deactivation Error

The sync-cdl-feeds function is throwing an error when deactivating stale jobs.

**File**: `supabase/functions/sync-cdl-feeds/index.ts`

Update the deactivation logic (around line 234) to handle errors better:

```typescript
if (jobsToDeactivate.length > 0) {
  logger.info('Deactivating stale jobs', { clientName: feed.clientName, count: jobsToDeactivate.length });
  
  // Deactivate in smaller batches to avoid issues
  const BATCH_SIZE = 50;
  for (let i = 0; i < jobsToDeactivate.length; i += BATCH_SIZE) {
    const batch = jobsToDeactivate.slice(i, i + BATCH_SIZE);
    const { error: deactivateError } = await supabase
      .from('job_listings')
      .update({ 
        status: 'inactive', 
        updated_at: new Date().toISOString() 
      })
      .in('id', batch);

    if (deactivateError) {
      logger.error('Failed to deactivate jobs batch', { 
        clientName: feed.clientName,
        errorMessage: deactivateError.message,
        batchStart: i
      });
    } else {
      result.jobsDeactivated += batch.length;
    }
  }
}
```

### Part 4: Ensure New Auto-Created Jobs Are Hidden

Modify the auto-creation logic to set `is_hidden = true` for jobs created from incoming applications.

**File**: `supabase/functions/_shared/application-processor.ts`

Update the job creation insert (around line 248) to include `is_hidden`:

```typescript
const { data: newJob, error: createError } = await supabase
  .from('job_listings')
  .insert({
    title: 'General Application',  // Changed from jobTitle to be consistent
    job_id: jobId,
    organization_id: organizationId,
    client_id: clientId,
    category_id: categories[0].id,
    status: 'active',
    is_hidden: true,  // ADD THIS LINE - Hide auto-created job listings
    job_summary: `Position ${jobId} from ${source || 'application'}`,
    location: city && state ? `${city}, ${state}` : null,
    city,
    state,
    user_id: userId,
  })
  .select('id')
  .single();
```

## Files to Modify

| File | Change |
|------|--------|
| Database | Migration to hide existing "General Application" listings |
| `supabase/functions/_shared/application-processor.ts` | Add city/state fallback + set is_hidden=true on auto-create |
| `supabase/functions/sync-cdl-feeds/index.ts` | Fix deactivation error with batched updates |

## Expected Outcome

1. The 5 visible "General Application" listings will be hidden immediately
2. Future applications will attempt to match by location before creating new listings
3. Any new auto-created listings will be hidden from public view
4. CDL feed sync will properly deactivate stale jobs

## Testing Plan

1. Run the database migration to clean up existing visible listings
2. Deploy edge function changes
3. Trigger a manual CDL feed sync to verify no errors
4. Submit a test application with a Pemberton job_id and verify it matches by location
5. Confirm /jobs page only shows proper CDL feed job titles
