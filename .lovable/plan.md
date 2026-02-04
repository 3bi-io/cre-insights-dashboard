

# Update /jobs Page for Organization Privacy

## Overview

Update the `/jobs` page and related components to hide organization information, displaying only **client name, job title, and location** - consistent with the apply pages refactor.

## Current State - Organization Exposure Points

| File | Exposure | What's Shown |
|------|----------|--------------|
| `src/utils/jobDisplayUtils.ts` | `getDisplayCompanyName()` | "Hayes Recruiting - ClientName" or "CR England - ClientName" |
| `src/components/public/PublicJobCard.tsx` | Uses `getDisplayCompanyName()` | Org-prefixed client names |
| `src/pages/public/JobDetailsPage.tsx` | Uses `getDisplayCompanyName()` | Org-prefixed client names, org slug in apply URL |
| `src/components/public/RelatedJobs.tsx` | Uses `getDisplayCompanyName()` | Org-prefixed client names |
| `src/pages/public/JobsPage.tsx` | Structured data schema | `hiringOrganization` uses org name fallback |
| `src/hooks/usePaginatedPublicJobs.tsx` | Fetches `public_organization_info` | Org data attached to jobs |
| `src/hooks/useJobDetails.tsx` | Fetches `public_organization_info` | Org data attached to job |

---

## Implementation Plan

### Step 1: Update `getDisplayCompanyName` Utility

**File**: `src/utils/jobDisplayUtils.ts`

Change the function to return only the client name, without the organization prefix:

```typescript
export const getDisplayCompanyName = (job: {
  clients?: { name?: string | null } | null;
  client?: string | null;
}): string => {
  const clientName = job.clients?.name || job.client;
  
  // Return client name only, no org prefix
  if (!clientName || clientName === 'Unassigned') {
    return 'Company';  // Generic fallback instead of org name
  }
  
  return clientName;
};
```

### Step 2: Update PublicJobCard Component

**File**: `src/components/public/PublicJobCard.tsx`

- Remove `org_slug` from the apply URL (line 58)
- Already uses `getDisplayCompanyName()` which will be updated

```typescript
// Before
const applyUrl = `/apply?job_id=${job.id}&org_slug=${job.organizations?.slug || 'default'}`;

// After
const applyUrl = `/apply?job_id=${job.id}`;
```

### Step 3: Update JobDetailsPage

**File**: `src/pages/public/JobDetailsPage.tsx`

- Remove `org_slug` from the apply URL (line 92)
- Update structured data to use client name instead of org name fallback (line 143)

```typescript
// Apply URL - remove org_slug
const applyUrl = `/apply?job_id=${job.id}`;

// Structured data - use client name
hiringOrganization: companyName,
hiringOrganizationLogo: job.clients?.logo_url,
```

### Step 4: Update JobsPage Structured Data

**File**: `src/pages/public/JobsPage.tsx`

Update the ItemList schema to use client name instead of organization name:

```typescript
// Before
"name": (job.clients?.name && job.clients.name !== 'Unassigned') 
  ? job.clients.name 
  : (job.organizations?.name || "Company")

// After
"name": (job.clients?.name && job.clients.name !== 'Unassigned') 
  ? job.clients.name 
  : "Company"
```

### Step 5: Update RelatedJobs Component

**File**: `src/components/public/RelatedJobs.tsx`

- Remove organization fetch via `public_organization_info` view (lines 114-127)
- Already uses `getDisplayCompanyName()` which will be updated

```typescript
// REMOVE this block - no longer needed
// Fetch organization names via public view
const orgIds = [...new Set(allJobs.map(j => j.organization_id).filter(Boolean))];
// ...

// Simplify return to just use client data
return allJobs as RelatedJob[];
```

### Step 6: Update usePaginatedPublicJobs Hook

**File**: `src/hooks/usePaginatedPublicJobs.tsx`

- Remove `public_organization_info` fetch (lines 94-98)
- Remove organization from the job data (line 118)
- Keep client fetch for displaying client name

```typescript
// Remove organization fetch, keep only client
const [clientResult] = await Promise.all([
  supabase
    .from('public_client_info')
    .select('id, name, logo_url')
    .in('id', clientIds)
]);

// Attach only client info (no organizations)
const jobsWithClients = data
  .map(job => {
    const client = job.client_id ? clientMap.get(job.client_id) : null;
    return {
      ...job,
      clients: client,
      voiceAgent: { global: true }
    };
  })
  .filter(job => job.client_id); // Filter out jobs without clients (acme fallback)
```

### Step 7: Update useJobDetails Hook

**File**: `src/hooks/useJobDetails.tsx`

- Remove `public_organization_info` fetch (lines 69-77)
- Remove organizations from return type

```typescript
// REMOVE the organization fetch block entirely
// let organizations = null;
// if (data.organization_id) { ... }

// Return without organizations
return { ...data, voiceAgent } as unknown as JobDetails;
```

Also update the `JobDetails` interface to remove organizations:

```typescript
interface JobDetails {
  // ... keep other fields
  // REMOVE: organizations: { ... } | null;
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/utils/jobDisplayUtils.ts` | Return client name only, remove org prefix logic |
| `src/components/public/PublicJobCard.tsx` | Remove `org_slug` from apply URL |
| `src/pages/public/JobDetailsPage.tsx` | Remove `org_slug` from URL, update structured data |
| `src/pages/public/JobsPage.tsx` | Update structured data schema |
| `src/components/public/RelatedJobs.tsx` | Remove org fetch and org-related logic |
| `src/hooks/usePaginatedPublicJobs.tsx` | Remove org fetch, keep only client data |
| `src/hooks/useJobDetails.tsx` | Remove org fetch and org from interface |

---

## Expected Result

**Before** (current):
```
CDL A Truck Driver - Regional Southeast Runs
[Logo] Hayes Recruiting - Pemberton Truck Lines Inc
Franklin, TN
[Apply Now] → /apply?job_id=xxx&org_slug=hayes-recruiting-solutions
```

**After** (private):
```
CDL A Truck Driver - Regional Southeast Runs
[Logo] Pemberton Truck Lines Inc
Franklin, TN
[Apply Now] → /apply?job_id=xxx
```

---

## Technical Notes

- Client logos will still be displayed (from `public_client_info` view)
- Organization data is still fetched internally for filtering (exclude acme) but not exposed
- All `org_slug` URL parameters are removed from public-facing links
- Structured data (SEO) will use client name for `hiringOrganization`
- Jobs without valid clients will show "Company" as a generic fallback
- The global voice agent is still available for all jobs

