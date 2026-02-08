
# Add Week-Over-Week Trend Indicators to Applications Overview

## Overview

Add trend indicators to the status and category cards in the Applications Overview section. Each card will show a small arrow (up/down/neutral) with percentage change comparing this week's count to last week's count.

## Technical Approach

### 1. Extend the `useApplicationStats` Hook

The current hook only fetches aggregate counts. We need to extend it to also calculate week-over-week trends by:

1. Adding `created_at` to the query fields (available in the applications table)
2. Calculating "this week" vs "last week" counts for each status and category
3. Computing percentage change: `((current - previous) / previous) * 100`

**New Return Type:**
```typescript
interface ApplicationStats {
  total: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  // NEW: Trend data
  statusTrends: Record<string, { current: number; previous: number; percentChange: number }>;
  categoryTrends: Record<string, { current: number; previous: number; percentChange: number }>;
}
```

**Date Calculation:**
- This week: applications created in the last 7 days
- Last week: applications created 8-14 days ago
- Percentage change handles zero-division (shows 0% or "New" indicator)

### 2. Update `ApplicationsOverview` Component Props

Add new optional props to receive trend data:

```typescript
interface ApplicationsOverviewProps {
  // ... existing props
  statusTrends?: Record<string, { current: number; previous: number; percentChange: number }>;
  categoryTrends?: Record<string, { current: number; previous: number; percentChange: number }>;
}
```

### 3. Add Trend Indicator UI to Cards

For each status and category card, display a small trend badge below the count:

```
┌─────────────────┐
│       12        │  ← Main count
│    Pending      │  ← Status label
│   ↑ +25% WoW    │  ← NEW: Trend indicator
└─────────────────┘
```

**Visual Design (following existing patterns from `EnhancedMetricsCard`):**
- Green arrow up + positive % for growth
- Red arrow down + negative % for decline  
- Gray dash + 0% for no change
- "New" badge if previous week was 0 and current > 0

### 4. Wire Up Data Flow

In `ApplicationsPage.tsx`, pass the new trend props from `globalStats`:

```typescript
<ApplicationsOverview 
  statusCounts={statusCounts} 
  categoryCounts={categoryCounts}
  totalCount={globalTotalCount}
  statusTrends={globalStats?.statusTrends}      // NEW
  categoryTrends={globalStats?.categoryTrends}  // NEW
  // ... other props
/>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/features/applications/hooks/useApplicationStats.ts` | Add `created_at` to query, calculate week-over-week trends for status and category |
| `src/components/applications/ApplicationsOverview.tsx` | Add trend props, render TrendingUp/TrendingDown icons with percentage |
| `src/features/applications/pages/ApplicationsPage.tsx` | Pass trend data from globalStats to ApplicationsOverview |

---

## Implementation Details

### Hook Changes (useApplicationStats.ts)

```typescript
// Add to query
created_at

// Add interface
interface TrendData {
  current: number;
  previous: number;
  percentChange: number;
}

// Calculate date boundaries
const now = new Date();
const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

// For each application, bucket into thisWeek/lastWeek
// Then calculate trends per status/category
```

### Component Changes (ApplicationsOverview.tsx)

Import icons:
```typescript
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
```

Add helper function:
```typescript
const getTrendDisplay = (trend?: TrendData) => {
  if (!trend) return null;
  const { percentChange } = trend;
  
  if (percentChange > 0) {
    return (
      <div className="flex items-center gap-1 text-green-600 text-xs">
        <TrendingUp className="w-3 h-3" />
        <span>+{percentChange.toFixed(0)}%</span>
      </div>
    );
  }
  // ... similar for negative and zero
};
```

Render in card:
```typescript
<div className="text-2xl font-bold">{statusCounts?.[status] || 0}</div>
<div className="text-sm text-muted-foreground capitalize">{status}</div>
{getTrendDisplay(statusTrends?.[status])}  // NEW LINE
```

---

## Expected Result

| Status Card | Display |
|-------------|---------|
| Pending: 5 (was 3 last week) | `5 Pending ↑+67%` |
| Reviewed: 2 (was 2 last week) | `2 Reviewed — 0%` |
| Hired: 1 (was 0 last week) | `1 Hired ✨ New` |
| Rejected: 0 (was 1 last week) | `0 Rejected ↓-100%` |

Category cards will follow the same pattern (D, SC, SR, N/A).
