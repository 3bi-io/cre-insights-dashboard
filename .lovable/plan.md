

# Remove Organization Information from Apply Context

## Overview

Update the apply pages to show only the **client name** (e.g., "Pemberton Truck Lines Inc") without revealing the organization association (e.g., "Hayes Recruiting - Pemberton Truck Lines Inc"). This keeps the client-organization relationship private.

## Current Behavior

When a job has a client associated:
- **Displays**: "Hayes Recruiting - Pemberton Truck Lines Inc"
- **Shows**: Organization logo
- **Exposes**: The relationship between Hayes Recruiting and the client

## Target Behavior

When a job has a client associated:
- **Display**: "Pemberton Truck Lines Inc" (client name only)
- **Hide**: Organization logo (to not reveal org branding)
- **Private**: Organization association is not shown

---

## Implementation Plan

### Step 1: Update useApplyContext Hook

**File**: `src/hooks/useApplyContext.ts`

Change the display logic to show only the client name instead of the branded organization name:

```typescript
// Before: Uses getDisplayCompanyName which shows "Hayes Recruiting - ClientName"
const displayName = getDisplayCompanyName({
  clients: client,
  organizations: org,
});

// After: Show only client name, hiding org association
const displayName = client?.name || null;
```

Also remove the organization logo from context when a client is present:

```typescript
setContext({
  jobTitle: jobListing.title,
  organizationName: client?.name || null,  // Client name only
  organizationSlug: null,                   // Don't expose org slug
  location: jobListing.city && jobListing.state 
    ? `${jobListing.city}, ${jobListing.state}` 
    : null,
  logoUrl: null,                            // Don't show org logo
  jobListingId: jobListing.id,
  source: utmSource,
  isLoading: false,
});
```

### Step 2: Remove org_slug URL Parameter Handling

**File**: `src/hooks/useApplyContext.ts`

Remove the fallback logic that fetches organization info from `org_slug` parameter (lines 97-118), as this exposes organization data:

```typescript
// REMOVE this block entirely
if (orgSlug) {
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug, logo_url')
    .eq('slug', orgSlug)
    .maybeSingle();
  // ...
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useApplyContext.ts` | Show only client name, remove org logo, remove org_slug fallback |

---

## Expected Result

**Before** (current):
```
[Hayes Recruiting Logo]
CDL A Truck Driver - Regional Southeast Runs
[Building] Hayes Recruiting - Pemberton Truck Lines Inc  [Pin] Franklin, TN
```

**After** (private):
```
CDL A Truck Driver - Regional Southeast Runs
[Building] Pemberton Truck Lines Inc  [Pin] Franklin, TN
```

**Fallback** (no client):
```
Driver Application
Fill out the form below to apply for driving positions
```

---

## Technical Notes

- The `getDisplayCompanyName` import can be removed from `useApplyContext.ts` as it won't be used
- The `ApplicationHeader` component requires no changes - it already handles null values gracefully
- URL parameters for `org_slug` will still be parsed but won't fetch/display organization info
- This change affects both `/apply` and `/apply/detailed` pages since they share `useApplyContext`

