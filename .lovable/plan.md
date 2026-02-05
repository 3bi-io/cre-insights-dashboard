

# Plan: Fix Embed Apply Header Props

## Problem
The `/embed/apply` page calls `useApplyContext()` correctly to fetch client name, logo, and job location, but **does not pass these values to `ApplicationHeader`**. This causes the embedded form to show a generic "Driver Application" header instead of the client-branded header.

## Root Cause
In `src/pages/EmbedApply.tsx`, line 92:
```tsx
<ApplicationHeader />  // No props passed!
```

Meanwhile `/apply` correctly passes all props (lines 65-72 of `Apply.tsx`).

## Solution
Pass the context values from `useApplyContext()` to the `ApplicationHeader` component in `EmbedApply.tsx`.

## Changes Required

### File: `src/pages/EmbedApply.tsx`

**Current code (line 92):**
```tsx
<ApplicationHeader />
```

**Updated code:**
```tsx
<ApplicationHeader 
  jobTitle={jobTitle}
  clientName={clientName}
  clientLogoUrl={clientLogoUrl}
  location={location}
  source={source}
  isLoading={contextLoading}
/>
```

Additionally, the `useApplyContext` hook needs to expose `location` and `source`, which are already available but not destructured. Update line 26:

**Current:**
```tsx
const { clientName, clientLogoUrl, jobTitle, isLoading: contextLoading } = useApplyContext();
```

**Updated:**
```tsx
const { clientName, clientLogoUrl, jobTitle, location, source, isLoading: contextLoading } = useApplyContext();
```

## Verification
After implementation, navigate to:
```
https://ats.me/embed/apply?job_id=965484d2-b778-4d8e-8424-ee7d97a92cc8
```

You should see:
- ✅ Client logo (if available)
- ✅ Job title 
- ✅ Client name
- ✅ Location (city, state)
- ✅ Source badge (if utm_source provided)

This will be consistent with the behavior of `/apply?job_id=...`.

