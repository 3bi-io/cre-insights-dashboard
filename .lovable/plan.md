
# Refactor /ai-analytics Page for Best User Experience

## Current State Analysis

### Issues Identified

1. **Mock Data Only**: All components use hardcoded mock data instead of real data from the database
   - Performance metrics are static (91% accuracy, 847 candidates, etc.)
   - Predictions, bias analysis, and insights are all fabricated
   - No connection to existing `useCandidateScoring` hook or analytics services

2. **Poor Loading States**: No loading indicators when data is being fetched
   - Components render immediately with mock data
   - No skeleton loaders or spinners during data fetch

3. **No Error Handling**: No error states or retry mechanisms
   - If data fetch fails, users see nothing useful
   - No error boundaries around chart components

4. **Mobile Tab Navigation Issues**: 
   - Icon-only tabs on mobile hide text completely (line 56-77 in AIAnalyticsPage.tsx)
   - Users must guess what each icon means
   - Horizontal scroll indicator is not obvious

5. **Chart Responsiveness**: 
   - Some charts have fixed heights that don't adapt well
   - Labels get cut off on smaller screens (e.g., x-axis labels in ComparativeAnalysis)

6. **Missing Date Range Selection**: 
   - No way to filter analytics by time period
   - All data shows static "last month" or similar

7. **Export Functionality is Simulated**:
   - Export just shows a toast, doesn't actually generate files
   - Scheduled reports is a placeholder

8. **Duplicate Functionality**: 
   - `AIAnalyticsDashboard.tsx` in `/components/analytics/` has real data integration
   - Feature duplication between this and `/ai-analytics` page

---

## Solution Architecture

### Phase 1: Real Data Integration

Create new hooks and services to fetch actual AI analytics data:

**New Hook**: `src/features/ai-analytics/hooks/useAIAnalyticsData.ts`
- Aggregate data from `candidate_scores`, `candidate_rankings`, and `applications` tables
- Calculate real performance metrics (accuracy based on actual predictions vs outcomes)
- Support date range filtering
- Cache with React Query (5-minute stale time)

**Data Sources**:
- `candidate_scores` table - AI scoring results
- `candidate_rankings` table - Candidate rankings per job
- `applications` table - Application outcomes for accuracy calculation
- `ai_usage_logs` (if exists) - Processing speed and usage stats

### Phase 2: Component Refactoring

#### AIAnalyticsPage.tsx
- Add date range selector in page actions
- Pass real data to child components
- Add loading and error states
- Improve tab navigation for mobile (show text on larger mobile screens)

#### AIPerformanceMetrics.tsx
- Accept data from hook instead of props
- Add loading skeleton while fetching
- Show "No data" state when no AI analysis exists
- Connect to real candidate_scores for accuracy metrics

#### PredictiveAnalytics.tsx
- Replace static arrays with hook-fetched data
- Add empty state when insufficient data for predictions
- Make forecast calculations based on actual trends

#### BiasAnalysis.tsx
- Connect to real bias metrics from AI analysis factors
- Add loading states
- Show meaningful empty state if no analysis data

#### ComparativeAnalysis.tsx
- Calculate real AI vs traditional metrics from actual data
- Add date range comparison capability

#### ModelInsights.tsx
- Pull real feature importance from stored AI analysis factors
- Show actual model version from system config
- Display real confidence distribution from candidate_scores

#### ExportAnalytics.tsx
- Implement real PDF/CSV/Excel export using jsPDF and xlsx libraries
- Generate actual reports from fetched data

### Phase 3: UX Improvements

1. **Tab Navigation Enhancement**
   - Show abbreviated text on tablet (md breakpoint)
   - Add tooltip on icon-only mobile tabs
   - Add tab indicator for current selection

2. **Quick Actions Bar**
   - Add "Refresh Data" button
   - Add "Run New Analysis" CTA when no data
   - Show last updated timestamp

3. **Empty States**
   - Helpful guidance when no AI analyses exist
   - Clear CTA to run first analysis
   - Show what data is needed

4. **Loading Experience**
   - Skeleton loaders matching card layouts
   - Progressive loading for charts
   - Staggered animation on content reveal

5. **Error Recovery**
   - Retry buttons on failed fetches
   - Graceful degradation (show partial data)
   - Clear error messages

---

## File Changes

### New Files

| File | Purpose |
|------|---------|
| `src/features/ai-analytics/hooks/useAIAnalyticsData.ts` | Main data fetching hook with React Query |
| `src/features/ai-analytics/hooks/useAIPerformanceMetrics.ts` | Performance-specific metrics calculation |
| `src/features/ai-analytics/hooks/index.ts` | Export all hooks |
| `src/features/ai-analytics/components/AnalyticsEmptyState.tsx` | Reusable empty state component |
| `src/features/ai-analytics/components/AnalyticsLoadingSkeleton.tsx` | Loading skeleton for analytics cards |
| `src/features/ai-analytics/utils/exportUtils.ts` | PDF/Excel export functionality |

### Modified Files

| File | Changes |
|------|---------|
| `AIAnalyticsPage.tsx` | Add hooks, date range, loading/error states, improved tabs |
| `AIPerformanceMetrics.tsx` | Connect to real data, add loading/empty states |
| `PredictiveAnalytics.tsx` | Accept real data, add loading/empty states |
| `BiasAnalysis.tsx` | Connect to real data, add loading states |
| `ComparativeAnalysis.tsx` | Use real comparison metrics |
| `ModelInsights.tsx` | Pull real feature importance data |
| `ExportAnalytics.tsx` | Implement real export with jsPDF/xlsx |
| `index.ts` | Export new hooks |

---

## Technical Implementation Details

### Data Hook Structure

```typescript
// useAIAnalyticsData.ts
interface AIAnalyticsData {
  performance: {
    modelAccuracy: number;
    predictionConfidence: number;
    processingSpeed: number;
    biasScore: number;
    candidatesAnalyzed: number;
    accuracyTrend: number;
  };
  predictions: {
    forecastData: ForecastPoint[];
    hiringTrends: TrendPoint[];
  };
  bias: {
    metrics: BiasMetric[];
    fairnessScore: number;
  };
  comparison: {
    traditional: MetricSet;
    aiEnhanced: MetricSet;
  };
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}
```

### Supabase Queries

Performance metrics query:
```sql
SELECT 
  AVG(confidence_level) as avg_confidence,
  COUNT(*) as total_analyzed,
  AVG(score) as avg_score
FROM candidate_scores
WHERE created_at >= :startDate
  AND organization_id = :orgId
```

### Tab Improvements

```tsx
// Improved mobile tabs with tooltips
<TabsTrigger value="performance" className="...">
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Brain className="w-4 h-4 shrink-0" />
      </TooltipTrigger>
      <TooltipContent>Performance</TooltipContent>
    </Tooltip>
  </TooltipProvider>
  <span className="hidden md:inline ml-2">Performance</span>
</TabsTrigger>
```

### Export Implementation

Using existing jsPDF and xlsx dependencies:
```typescript
// Real PDF export
import jsPDF from 'jspdf';

const exportToPDF = (data: AIAnalyticsData) => {
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text('AI Analytics Report', 20, 20);
  // ... add metrics, charts as images
  doc.save('ai-analytics-report.pdf');
};
```

---

## Benefits

- **Real Data**: Users see actual AI performance from their organization
- **Actionable Insights**: Empty states guide users to run analyses
- **Better Mobile UX**: Accessible tabs with clear navigation
- **Export Capability**: Generate real reports for stakeholders
- **Error Resilience**: Graceful handling of data fetch failures
- **Performance**: React Query caching reduces unnecessary fetches
- **Consistency**: Follows existing patterns from other analytics pages

---

## Migration Path

1. Create hooks with fallback to mock data during development
2. Update components one at a time, maintaining backwards compatibility
3. Test with organizations that have real AI analysis data
4. Remove mock data fallbacks once verified working
