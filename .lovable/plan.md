
# Add Job Context Display to Detailed Apply Page

## Overview

Enhance the `/apply/detailed` page to display job context (Client Name, Job Title, Location) when provided via URL parameters, matching the existing behavior on `/apply`.

## Current State

The `/apply/detailed` page has a static header:
```tsx
<header className="text-center mb-6 sm:mb-8">
  <div className="flex items-center justify-center gap-2 mb-3">
    <Truck className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
      Complete Application
    </h1>
  </div>
  <p className="text-muted-foreground text-sm sm:text-base">
    Please complete all sections...
  </p>
</header>
```

## Target State

When URL contains job context (e.g., `?job_id=a4ec115c-bbad-42cc-94d3-e3dc8ca7a4e2`), display:

- **Job Title**: CDL A Truck Driver - Regional Southeast Runs
- **Client/Company**: Hayes Recruiting - Pemberton Truck Lines Inc
- **Location**: Franklin, TN
- **Logo**: Organization logo if available

---

## Implementation Plan

### Step 1: Enhance useApplyContext Hook

**File**: `src/hooks/useApplyContext.ts`

Add client data fetching to support proper branding (e.g., "Hayes Recruiting - ClientName"):

```typescript
// Update the Supabase query to include clients
const { data: jobListing } = await supabase
  .from('job_listings')
  .select(`
    id,
    title,
    city,
    state,
    organizations (
      id,
      name,
      slug,
      logo_url
    ),
    clients (
      id,
      name
    )
  `)
  .eq('id', jobListingId)
  .maybeSingle();
```

Add a new field to the context interface:
```typescript
interface ApplyContext {
  // ... existing fields
  clientName: string | null;  // NEW
}
```

Use `getDisplayCompanyName` utility to format the company name properly.

### Step 2: Update DetailedApplicationForm Component

**File**: `src/components/apply/detailed/DetailedApplicationForm.tsx`

Replace the static header with the reusable `ApplicationHeader` component:

```tsx
import { useApplyContext } from '@/hooks/useApplyContext';
import { ApplicationHeader } from '../ApplicationHeader';

export const DetailedApplicationForm = () => {
  const {
    jobTitle,
    organizationName,
    location,
    logoUrl,
    source,
    isLoading: contextLoading
  } = useApplyContext();

  // ... rest of component

  return (
    <>
      {/* Replace static header with dynamic ApplicationHeader */}
      <ApplicationHeader
        jobTitle={jobTitle || 'Complete Application'}
        organizationName={organizationName}
        location={location}
        logoUrl={logoUrl}
        source={source}
        isLoading={contextLoading}
      />
      {/* ... rest of form */}
    </>
  );
};
```

### Step 3: Update SEO Meta Tags

Dynamically update SEO based on job context:

```tsx
const seoContent = useMemo(() => {
  const title = jobTitle 
    ? `Apply for ${jobTitle}` 
    : 'Complete Driver Application';
  const description = jobTitle && organizationName
    ? `Apply for ${jobTitle} at ${organizationName}. Complete driver application with CDL verification and employment history.`
    : 'Submit your comprehensive driver application...';
  return { title, description };
}, [jobTitle, organizationName]);
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useApplyContext.ts` | Add clients join, add clientName field, use getDisplayCompanyName for proper formatting |
| `src/components/apply/detailed/DetailedApplicationForm.tsx` | Import and use ApplicationHeader component, add useApplyContext, update SEO |

---

## Expected Result

**Before** (current):
```
[Truck Icon] Complete Application
Please complete all sections to submit your comprehensive application
```

**After** (with job context):
```
[Logo if available]
CDL A Truck Driver - Regional Southeast Runs
[Building Icon] Hayes Recruiting - Pemberton Truck Lines Inc  [Pin Icon] Franklin, TN
```

**After** (without job context - fallback):
```
[Truck Icon] Complete Application
Fill out the form below to apply for driving positions
```

---

## Technical Notes

- The `ApplicationHeader` component already handles loading states with skeleton
- Reuses existing `useApplyContext` hook - no duplication
- Proper client name formatting via `getDisplayCompanyName` utility ensures Hayes Recruiting and CR England jobs display correctly
- SEO meta tags will be dynamically updated based on job context
- URL parameters supported: `job_id`, `job_listing_id`, `jobListingId`, `job`, `jobId`, `org_slug`, `org`, `organization`, `utm_source`, `source`
