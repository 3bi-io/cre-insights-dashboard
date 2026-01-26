
# Fix Send System Email CTA - Make It Accessible

## Problem
The "Send System Email" button (provided by `AdminEmailUtility` component) is currently only accessible in two locations:
1. **Buried in Settings tab** - Super Admin Dashboard → Settings tab → Email Utilities card (bottom of page)
2. **Organizations page header** - `/admin/organizations` page

Since the user is typically on the home route (`/`), the button is not visible without navigating to specific pages and tabs.

## Solution
Add the "Send System Email" CTA to more prominent, easily accessible locations:

### Option A: Add to Admin Quick Actions (Recommended)
Add a "Send Email" quick action button to the `AdminQuickActions` component that is visible across admin pages.

### Option B: Add to Super Admin Dashboard Header
Add the `AdminEmailUtility` component directly to the main dashboard view, visible without needing to navigate to the Settings tab.

---

## Implementation Details

### 1. Add to AdminQuickActions Component

**File: `src/components/admin/AdminQuickActions.tsx`**

Add a new action that directly triggers the email dialog:

```typescript
// Add Mail icon import
import { Mail } from 'lucide-react';

// Add AdminEmailUtility import
import { AdminEmailUtility } from '@/features/admin/components/AdminEmailUtility';
```

Modify the component to include the email utility alongside navigation buttons.

### 2. Add to Super Admin Dashboard (Overview Tab)

**File: `src/features/dashboard/components/tabs/OverviewTab.tsx`**

Add a Quick Actions section that includes the `AdminEmailUtility` component for immediate access on the default Overview tab.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/admin/AdminQuickActions.tsx` | Add `AdminEmailUtility` component to quick actions grid |
| `src/features/dashboard/components/tabs/OverviewTab.tsx` | Add Email Utilities card with `AdminEmailUtility` |

---

## Expected Outcome

After implementation:
- Super admins will see the "Send System Email" button on the default Overview tab
- The button will also be available in the Quick Actions grid across admin pages
- No need to navigate to Settings tab to send system emails
