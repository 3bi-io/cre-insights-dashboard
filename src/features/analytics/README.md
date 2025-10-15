# Analytics Feature Module

Centralized analytics and metrics functionality for the recruitment platform.

## Structure

```
src/features/analytics/
├── types/              # Analytics type definitions
│   └── index.ts        # Metrics, chart data, filter types
├── services/           # Data fetching and processing
│   ├── analyticsService.ts       # Core analytics queries
│   ├── metaAnalyticsService.ts   # Meta-specific analytics
│   └── index.ts
├── hooks/              # React Query hooks
│   ├── useSpendTrendData.ts
│   ├── usePlatformPerformanceData.ts
│   ├── useMonthlyBudgetData.ts
│   ├── useJobVolumeData.ts
│   ├── useMetaSpendAnalytics.ts
│   ├── useCategoryBreakdown.ts
│   ├── useDashboardMetrics.ts
│   └── index.ts
├── utils/              # Formatting and transformation utilities
│   ├── chartFormatters.ts
│   └── index.ts
└── README.md
```

## Key Features

### 1. **Centralized Analytics Services**
- Unified data fetching from Supabase
- Organization-scoped queries
- Consistent error handling

### 2. **React Query Integration**
- Automatic caching (5-minute stale time)
- Background refetching
- Optimistic updates

### 3. **Chart Data Processing**
- Spend trends over time
- Platform performance comparison
- Monthly budget tracking
- Job volume analytics
- Category breakdowns

### 4. **Meta Analytics**
- Date range calculations
- Cost per lead tracking
- Conversion rate analysis
- AI-powered insights (placeholder for OpenAI integration)

### 5. **Formatting Utilities**
- Currency formatting
- Number abbreviation (K, M)
- Percentage formatting
- Date/month formatting

## Usage

```typescript
import { 
  useSpendTrendData,
  usePlatformPerformanceData,
  useMetaSpendAnalytics,
  formatCurrency,
  formatNumber
} from '@/features/analytics';

function AnalyticsDashboard() {
  const { data: spendTrend, isLoading } = useSpendTrendData();
  const { data: platformPerf } = usePlatformPerformanceData();
  const { metrics } = useMetaSpendAnalytics('last_30d');

  return (
    <div>
      <h2>Total Spend: {formatCurrency(metrics?.totalSpend || 0)}</h2>
      <p>Leads: {formatNumber(metrics?.totalLeads || 0)}</p>
    </div>
  );
}
```

## Type Safety

All analytics data structures are fully typed:
- `SpendTrendData` - Time-series spend and application data
- `PlatformPerformanceData` - Platform comparison metrics
- `MonthlyBudgetData` - Budget vs actual spend
- `MetaSpendMetrics` - Meta advertising metrics
- `CategoryData` - Applicant categorization

## Benefits

✅ **Centralized** - All analytics logic in one place  
✅ **Type-safe** - Full TypeScript coverage  
✅ **Reusable** - Shared across dashboard, reports, charts  
✅ **Cached** - React Query handles caching and refetching  
✅ **Organization-scoped** - Multi-tenant support built-in  
✅ **Maintainable** - Clear separation of concerns

## Future Enhancements

- [ ] Add real-time analytics with Supabase subscriptions
- [ ] Implement custom date range selection
- [ ] Add export functionality (CSV, PDF)
- [ ] Integrate OpenAI for deeper insights
- [ ] Add predictive analytics
- [ ] Create analytics dashboard builder
- [ ] Add comparison views (period over period)
