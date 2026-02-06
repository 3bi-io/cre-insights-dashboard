

# Phase 4 & 5 UI Implementation Plan

Complete the remaining UI enhancements for the CDL Job Cast Feed Data Capture system by adding feed data visibility to the Job Details dialog, JobTable indicators, enhanced CampaignsPage stats, and a Feed Quality Dashboard card.

---

## Summary of Changes

| Component | Enhancement |
|-----------|-------------|
| JobTable.tsx | Add feed data indicator icons (Indeed Apply, Tracking, Date) |
| JobAnalyticsDialog.tsx | Add new "Feed Data" tab showing all captured metadata |
| CampaignsPage.tsx | Add feed coverage stats to the Sponsorship Mappings tab |
| DashboardContent.tsx | Add Feed Quality card showing data completeness metrics |
| New: useFeedDataCoverage.ts | Hook to query the `feed_data_coverage` view |

---

## Phase 4: Admin UI Enhancements

### 4.1 Add Feed Data Indicators to JobTable

Update `src/components/jobs/JobTable.tsx` to display small icons indicating feed data availability for each job row.

**Changes:**
- Add new icons from lucide-react: `Calendar`, `ExternalLink`, `Activity`
- Add a "Feed Data" column after the "Sponsored" column
- Display indicator icons:
  - Calendar icon (green) if `feed_date` is present
  - Indeed "I" badge (blue) if `indeed_apply_job_id` is present
  - Activity icon (purple) if `tracking_pixel_url` is present
- Use tooltips to explain each indicator on hover

**Visual Design:**
```text
| ... | Sponsored | Feed Data         | Actions |
| ... | [Switch]  | [Date][Indeed][Px] | ...     |
```

### 4.2 Add "Feed Data" Tab to JobAnalyticsDialog

Update `src/components/JobAnalyticsDialog.tsx` to include a third tab showing raw feed metadata.

**Changes:**
- Extend the Tabs component from 2 to 3 tabs
- Add new tab: "Feed Data" with `Rss` icon
- Tab content displays:
  - Feed Date (original posting date vs. system created_at)
  - Campaign Info (jobreferrer value and resolved sponsorship tier)
  - Indeed Apply Configuration (token, job ID, post URL)
  - Tracking Pixel URL (clickable link that opens in new tab)
  - Last sync timestamp
- Use Card components for visual grouping
- Show "Not Available" badges for missing data

**Interface Update:**
```typescript
// Extend JobAnalyticsDialogProps job type
interface JobAnalyticsDialogProps {
  job: {
    // ... existing fields
    feed_date?: string;
    jobreferrer?: string;
    sponsorship_tier?: string;
    indeed_apply_api_token?: string;
    indeed_apply_job_id?: string;
    indeed_apply_post_url?: string;
    tracking_pixel_url?: string;
  };
}
```

---

## Phase 4.3: Enhanced Campaign Stats

Update `src/features/campaigns/pages/CampaignsPage.tsx` and the Sponsorship Mappings tab to display feed data coverage statistics.

**Changes:**
- Create a new hook: `useFeedDataCoverage` to query the SQL view
- Add stats cards above the mappings table showing:
  - Total jobs with Indeed Apply enabled (count + percentage)
  - Total jobs with tracking pixels (count + percentage)
  - Campaign attribution coverage (jobs with jobreferrer)
  - Feed date coverage
- Use the existing QuickStatsCard or MetricsCard pattern

**New Hook Structure:**
```typescript
// src/features/campaigns/hooks/useFeedDataCoverage.ts
export function useFeedDataCoverage() {
  return useQuery({
    queryKey: ['feed-data-coverage'],
    queryFn: async () => {
      const { data } = await supabase
        .from('feed_data_coverage')
        .select('*');
      return aggregateCoverage(data);
    }
  });
}
```

---

## Phase 5.2: Feed Quality Dashboard Card

Add a new card to `src/components/dashboard/DashboardContent.tsx` displaying data completeness metrics.

**Changes:**
- Import and use the `useFeedDataCoverage` hook
- Add a new Card component in the dashboard grid showing:
  - Overall feed data quality score (weighted percentage)
  - Indeed Apply adoption rate (with progress bar)
  - Campaign attribution coverage (with progress bar)
  - Tracking pixel coverage (with progress bar)
- Use color-coded indicators (green >80%, yellow 50-80%, red <50%)
- Add a "View Details" button linking to Campaigns > Sponsorship Mappings

**Visual Layout:**
```text
+------------------------------------------+
| Feed Data Quality         [?] [Refresh]  |
|------------------------------------------|
| Overall Score: 72%    [=========---]     |
|                                          |
| Indeed Apply:  45%    [====------]       |
| Campaign Tags: 98%    [==========]       |
| Tracking:      23%    [==--------]       |
| Feed Dates:    67%    [======----]       |
|                                          |
| [View Campaign Mappings →]               |
+------------------------------------------+
```

---

## Implementation Sequence

1. **Create useFeedDataCoverage hook** - Shared foundation for stats display
2. **Update JobTable.tsx** - Add feed data indicator column
3. **Update JobAnalyticsDialog.tsx** - Add "Feed Data" tab
4. **Update CampaignsPage.tsx** - Add coverage stats to Sponsorship Mappings
5. **Update DashboardContent.tsx** - Add Feed Quality card

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/features/campaigns/hooks/useFeedDataCoverage.ts` | Create | Hook to query feed_data_coverage view |
| `src/features/campaigns/hooks/index.ts` | Modify | Export new hook |
| `src/components/jobs/JobTable.tsx` | Modify | Add Feed Data indicator column |
| `src/components/JobAnalyticsDialog.tsx` | Modify | Add Feed Data tab |
| `src/features/campaigns/pages/CampaignsPage.tsx` | Modify | Add coverage stats cards |
| `src/components/dashboard/DashboardContent.tsx` | Modify | Add Feed Quality dashboard card |

---

## Technical Details

### Feed Data Coverage Hook

The hook will aggregate data from the `feed_data_coverage` SQL view:

```typescript
interface FeedDataCoverage {
  totalJobs: number;
  jobsWithDate: number;
  jobsWithIndeedApply: number;
  jobsWithTracking: number;
  jobsWithCampaign: number;
  dateCoveragePct: number;
  indeedApplyCoveragePct: number;
  trackingCoveragePct: number;
  campaignCoveragePct: number;
  overallScore: number; // Weighted average
}
```

### JobTable Indicator Icons

Each indicator uses tooltips from the existing Tooltip component:

- `Calendar` icon with `text-green-500` when `feed_date` present
- Custom "I" badge with `text-blue-500` when `indeed_apply_job_id` present
- `Activity` icon with `text-purple-500` when `tracking_pixel_url` present

### JobAnalyticsDialog Feed Data Tab

The tab displays data in organized Card sections:

1. **Feed Information** - feed_date, jobreferrer, sponsorship_tier
2. **Indeed Apply Integration** - api_token (masked), job_id, post_url
3. **Tracking** - tracking_pixel_url with "Open" button

Missing values show a muted "Not captured" badge rather than empty space.

