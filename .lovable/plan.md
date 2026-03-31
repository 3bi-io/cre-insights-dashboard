

# Add UTM Parameter Tracking to Page Views

## Problem
1. The `page_views` table has no UTM columns, so we lose utm_source/utm_medium/utm_campaign data from Instagram and Facebook traffic.
2. The `usePageTracking` hook doesn't extract UTM params from the URL.
3. The `/apply` page already reads `utm_source` via `useApplyContext`, but doesn't pass the resolved `organizationId` to the page tracking system — resulting in `organization_id = null` for all apply page views.

## Changes

### 1. Database Migration — Add UTM columns to `page_views`
```sql
ALTER TABLE public.page_views
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text;
```

### 2. Update `usePageTracking` hook (`src/hooks/usePageTracking.tsx`)
- Extract UTM parameters from `window.location.search` on each page view.
- Pass `utm_source`, `utm_medium`, `utm_campaign` into the `page_views` insert call.
- Also persist UTM params to `sessionStorage` on first landing so they carry across internal navigations within the same session.

Key changes to `trackPageView`:
```typescript
// Extract UTM params (persist first-touch to sessionStorage)
const getUtmParams = () => {
  const params = new URLSearchParams(window.location.search);
  const keys = ['utm_source', 'utm_medium', 'utm_campaign'] as const;
  const result: Record<string, string | null> = {};
  
  for (const key of keys) {
    const value = params.get(key);
    if (value) {
      sessionStorage.setItem(key, value);
      result[key] = value;
    } else {
      result[key] = sessionStorage.getItem(key);
    }
  }
  return result;
};
```

Then include in the insert:
```typescript
utm_source: utmParams.utm_source || null,
utm_medium: utmParams.utm_medium || null,
utm_campaign: utmParams.utm_campaign || null,
```

### 3. Pass organization context from Apply page to page tracking
- Add an optional `organizationId` override to `usePageTracking` so the Apply page can pass the resolved org ID from `useApplyContext`.
- In `src/pages/Apply.tsx`, update the `usePageTracking` call (or add a separate effect) that updates the page view's `organization_id` once `useApplyContext` resolves the org/client context.

Alternatively (simpler approach): modify `trackPageView` to also read `organization_id` / `client_id` from URL search params as a fallback when the auth-based `organization?.id` is null. This way, apply page views from anonymous visitors still get attributed.

### 4. Update analytics queries
- **`src/features/analytics/hooks/useApplyPageAnalytics.ts`**: Update the traffic sources and daily trend calculations to use the new `utm_source` column when available (falling back to referrer-based classification).

## Technical Details
- UTM params use first-touch attribution via `sessionStorage` — once set on landing, they persist for all page views in that session.
- The migration adds nullable text columns, so no existing data is affected.
- The `usePageTracking` hook change is backward-compatible — rows without UTM data simply have nulls.

