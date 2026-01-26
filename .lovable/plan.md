

# Add Email Utility to Organizations Page

## Problem
The Admin Email Utility is currently only accessible from the Super Admin Dashboard (`/admin`) under the Settings tab. The user is on `/admin/organizations` and cannot find the UI because it's on a different page.

## Solution
Add the Email Utility component directly to the Organizations management page (`/admin/organizations`) for easier access when working with organizations.

---

## Implementation

### Option A: Add to Organizations Page Header (Recommended)

Add a "Send System Email" button to the header/actions area of the Organizations management page.

**File to modify:** `src/features/admin/organizations/OrganizationsManagement.tsx` (or equivalent page component)

Changes:
1. Import `AdminEmailUtility` component
2. Add the component to the page header actions area alongside existing action buttons

### Option B: Keep Current Location + Add Navigation Hint

Keep the utility in the Super Admin Dashboard Settings tab but add a visual indicator or quick-access button on the Organizations page that links to it.

---

## Files to Modify

| File | Action |
|------|--------|
| Organizations page component | Add `AdminEmailUtility` to header actions |

---

## Expected Result

After implementation, you'll see a "Send System Email" button directly on the `/admin/organizations` page, allowing you to:
1. Send welcome emails to CR England users
2. Send password reset emails
3. All without navigating away from the Organizations management view

---

## Alternative: Navigate to Existing Location

If you prefer not to add UI changes, navigate to:
1. Click **"Dashboard"** in the sidebar (goes to `/admin`)
2. Click the **"Settings"** tab
3. Find **"Email Utilities"** card
4. Click **"Send System Email"**

