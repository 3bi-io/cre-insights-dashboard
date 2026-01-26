
# Remove "Team" Tab from Settings

## Overview

Remove the "Team" (administrators) tab from the Settings page for all organizations and user roles.

## Current State

The Settings page at `src/pages/Settings.tsx` has 9 tabs, with the "Team" tab:
- Displayed with label "Team" but uses value `administrators`
- Currently only visible to admin and super_admin roles
- Uses `AdministratorsSettingsTab` component

## Changes Required

### File: `src/pages/Settings.tsx`

1. **Remove 'administrators' from validTabs array** (line 21)
   - Change from 9 valid tabs to 8

2. **Update grid columns** (line 36)
   - Remove the conditional logic for admin users
   - Change from `sm:grid-cols-9` / `sm:grid-cols-8` to just `sm:grid-cols-8`

3. **Remove the Team TabsTrigger** (line 45)
   - Delete the conditional `{isAdmin && <TabsTrigger value="administrators"...}` line

4. **Remove the Team TabsContent** (lines 81-85)
   - Delete the conditional `{isAdmin && (<TabsContent value="administrators"...)}` block

5. **Remove unused import** (line 12)
   - Delete `import AdministratorsSettingsTab from '@/components/settings/AdministratorsSettingsTab';`

6. **Clean up isAdmin variable** (line 19)
   - Remove the `isAdmin` constant since it's no longer needed

## Result

After this change:
- The Settings page will have 8 tabs for all users
- The "Team" tab will no longer appear for any role
- The `AdministratorsSettingsTab` component file will remain in the codebase but be unused (can be deleted separately if desired)
