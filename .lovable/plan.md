
# Fix: Remove CR England as Default Fallback and Enforce Client-Level Routing

## Problem Summary

Cody Forbes applied via `/embed/apply` but his application landed on **CR England's General Application** (job `100a59c2`) with source "Company Website" instead of the Hayes embed job (`4c3cfad9`). This happened because:

1. **Source detection failed** -- his submission was tagged "Company Website" instead of "Embed Form", so the embed job override didn't trigger
2. **The fallback is CR England** -- when organization resolution fails, the `submit-application` edge function falls back to CR England (line 628-643), which is an Org, not a Client
3. **CR England should never receive direct applications** -- it's an organization entity, and applications should only associate with clients

## Root Causes

### 1. CR England hardcoded as fallback (Critical)
In `supabase/functions/submit-application/index.ts` (lines 628-643), the `resolveOrganizationAndJob` function falls back to `slug: 'cr-england'` when no context is found. This means any unresolved application silently goes to CR England.

### 2. Embed Form source not always detected
The embed form override (`source === 'Embed Form'`) is the **only** mechanism routing `/embed/apply` submissions to the Hayes job. If the `source` field isn't passed or is overridden (e.g., by UTM params), the routing breaks entirely.

### 3. No validation that applications associate with clients
There's no server-side check ensuring every application resolves to a valid client, not just an organization.

## Proposed Changes

### Step 1: Fix `resolveOrganizationAndJob` fallback (Edge Function)
- Remove the CR England hardcoded fallback
- Replace with a rejection -- if no organization/client can be resolved, return an error instead of silently misrouting
- Log a clear warning when fallback would have been triggered

### Step 2: Make embed routing more resilient (Edge Function)
- Instead of relying solely on `source === 'Embed Form'`, also check the `Referer` header for `/embed/apply` path
- This provides a secondary detection mechanism if the explicit source field is missing

### Step 3: Reassign Cody Forbes' application (Data Fix)
- Update application `e947d090-36a4-4777-9d22-db8aeb5eb2d6` to point to job `4c3cfad9-4641-4830-ad97-11589e8f8cd4` and source `Embed Form`
- Queue the outbound call using the Hayes embed agent

### Step 4: Audit other misrouted applications (Data Fix)
- Query for any other applications on CR England's "General Application" listings that may have been misrouted
- Identify candidates that should have gone to Hayes or other clients

## Technical Details

### Edge Function Changes (`supabase/functions/submit-application/index.ts`)

**Fallback removal (lines 628-643):**
```typescript
// BEFORE: Silent fallback to CR England
const { data: crEnglandOrg } = await supabase
  .from('organizations').select('id, name').eq('slug', 'cr-england').single();
return { organizationId: crEnglandOrg?.id || '', ... };

// AFTER: Reject unresolvable submissions
logger.error('Unable to resolve organization for application', { 
  jobListingId, orgSlug, detectedSource, organizationIdDirect 
});
throw new Error('Unable to determine organization for this application. Please include a valid job or organization reference.');
```

**Embed detection hardening (in `detectIntegrationSource`):**
```typescript
// Add referer-path check as secondary embed detection
const refererPath = req.headers.get('referer') || '';
if (refererPath.includes('/embed/apply')) {
  return 'Embed Form';
}
```

### Data Operations
- Reassign Cody Forbes' application to the correct job listing
- Queue outbound call via Hayes embed agent

### Files Modified
- `supabase/functions/submit-application/index.ts` -- Remove CR England fallback, harden embed detection
