

## Current Status

The Thank You page (`src/pages/ThankYou.tsx`) **already has** the "Complete Your Full Application" CTA button with the `ClipboardList` icon and messaging. It works correctly during the same browser session because `formData` is passed via React Router state from the short application submission.

**However, there is one gap to fix:**

The button navigates to `/apply/detailed` but does not include `app_id` in the URL query params. This means the new `get-application-prefill` edge function cannot be used if the router state is lost. The fix is simple:

## Changes

### 1. Update Thank You page navigation to include `app_id` in URL

**File:** `src/pages/ThankYou.tsx` (lines 46-52)

Change `handleContinueToFullApplication` to include `app_id` in the query string:

```typescript
const handleContinueToFullApplication = () => {
  const jobId = formData?.job_listing_id || formData?.job_id;
  const params = new URLSearchParams();
  if (jobId) params.set('job_id', jobId);
  if (applicationId) params.set('app_id', applicationId);
  const searchParams = params.toString() ? `?${params.toString()}` : '';
  navigate(`/apply/detailed${searchParams}`, {
    state: { prefill: { ...formData, applicationId } }
  });
};
```

This ensures that even if router state is lost (page refresh, link sharing), the detailed form can still fetch pre-fill data via the `get-application-prefill` edge function using the `app_id` URL parameter.

### 2. Always show the CTA (even without router state)

**File:** `src/pages/ThankYou.tsx` (line 111)

Change the condition from `{formData && (` to `{(formData || applicationId) && (` so the button also shows when only `applicationId` is available. Additionally, extract `applicationId` from URL params as a fallback:

```typescript
const searchParams = new URLSearchParams(location.search);
const applicationId = state?.applicationId || searchParams.get('app_id');
```

This way, if someone arrives at `/thank-you?app_id=xxx`, they still see the CTA.

This is a small, targeted fix — the CTA content and design are already correct.

