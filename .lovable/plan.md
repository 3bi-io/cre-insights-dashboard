
# Fix Social Beacons Page Not Loading

## Problem

The `/admin/social-beacons` page is returning a 404 error. After investigation, the issue is caused by an inconsistent import pattern in the route configuration.

## Root Cause

In `AppRoutes.tsx`, the `SuperAdminSocialBeacons` component uses a different import pattern than other feature components:

```text
Current (problematic):
  SuperAdminSocialBeacons <- direct file import

Working pattern (used by SocialEngagementDashboard):
  SocialEngagementDashboard <- barrel export via index.ts
```

The direct file import expects the default export format differently than how it's configured, which can cause the lazy loading to fail.

## Solution

Update the import for `SuperAdminSocialBeacons` in `AppRoutes.tsx` to use the barrel export pattern (consistent with `SocialEngagementDashboard`).

## Technical Details

### File: `src/components/routing/AppRoutes.tsx`

**Change the import (around line 67):**

Before:
```typescript
const SuperAdminSocialBeacons = React.lazy(() => import("@/features/social-engagement/pages/SuperAdminSocialBeacons"));
```

After:
```typescript
const SuperAdminSocialBeacons = React.lazy(() => import("@/features/social-engagement").then(m => ({ default: m.SuperAdminSocialBeacons })));
```

This makes the import pattern consistent with other feature page imports and uses the barrel export from `index.ts`, which properly exports the component.

## Verification

The `index.ts` file already exports `SuperAdminSocialBeacons`:
```typescript
export * from './pages/SuperAdminSocialBeacons';
```

The component is exported as both a named export and a default export:
```typescript
export function SuperAdminSocialBeacons() { ... }
export default SuperAdminSocialBeacons;
```

## Files to Modify

| File | Change |
|------|--------|
| `src/components/routing/AppRoutes.tsx` | Update line 67 to use barrel export pattern |

## Expected Outcome

After this fix, navigating to `/admin/social-beacons` will correctly load the Social Beacons page with all its tabs (Credentials, OAuth Setup, Ad Creative, Settings, Analytics).
