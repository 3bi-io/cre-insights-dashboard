
# Add Empty State to Applications Overview

## Overview

When the Applications Overview shows zero applications, we'll display a helpful empty state with guidance on how to get started. This provides better UX than showing a grid of zeros.

## Implementation

### File: `src/components/applications/ApplicationsOverview.tsx`

**Changes:**

1. **Import the shared EmptyStateMessage component** and the `Users` icon from lucide-react

2. **Add empty state condition** - Check if `displayTotal === 0` and render an empty state instead of the stats cards

3. **Empty state content:**
   - Icon: Users (representing applicants)
   - Title: "No applications yet"
   - Description: "Applications will appear here once candidates start applying to your job listings. Make sure you have active job postings to receive applications."
   - Action button: "View Job Listings" linking to `/admin/jobs`

### Visual Behavior

| Scenario | Display |
|----------|---------|
| `totalCount > 0` | Normal status and category cards |
| `totalCount === 0` | Centered empty state with icon, message, and CTA |

### Code Structure

```
ApplicationsOverview
├── Header (always visible)
│   ├── Title "Applications Overview"
│   └── AI Analytics button + Badge
│
└── Conditional Content
    ├── IF displayTotal > 0
    │   ├── Status cards grid (pending, reviewed, etc.)
    │   └── Category cards grid (D, SC, SR, N/A)
    │
    └── ELSE (empty state)
        └── EmptyStateMessage
            ├── Users icon
            ├── "No applications yet"
            ├── Guidance text
            └── "View Job Listings" button
```

## Files Changed

| File | Change |
|------|--------|
| `src/components/applications/ApplicationsOverview.tsx` | Add conditional empty state when totalCount is 0 |
