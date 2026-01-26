
# Remove 'Job Boards' Link from Organization Admin Navigation

## Overview
Remove the "Job Boards" navigation link from the admin sidebar menu in the "Connections" group.

## Current State
The "Job Boards" link is located in `src/config/navigationConfig.ts` at line 181, inside the "Connections" group. It's conditionally rendered for moderators and above (along with "Ad Networks"):

```typescript
...(isModerator ? [
  { path: '/admin/ad-networks', label: 'Ad Networks', icon: Globe },
  { path: '/admin/job-boards', label: 'Job Boards', icon: Rss }
] : []),
```

## Implementation

### File to Modify
**`src/config/navigationConfig.ts`** (line 181)

### Change
Remove the Job Boards entry from the moderator conditional array:

**Before:**
```typescript
...(isModerator ? [
  { path: '/admin/ad-networks', label: 'Ad Networks', icon: Globe },
  { path: '/admin/job-boards', label: 'Job Boards', icon: Rss }
] : []),
```

**After:**
```typescript
...(isModerator ? [
  { path: '/admin/ad-networks', label: 'Ad Networks', icon: Globe }
] : []),
```

## Impact
- The "Job Boards" link will no longer appear in the sidebar navigation
- The `/admin/job-boards` route and `JobBoards.tsx` page will remain functional (accessible via direct URL if needed)
- No other components or routes are affected

## Notes
- The `Rss` icon import can optionally be cleaned up later if no longer used elsewhere, but keeping it won't cause issues
