

# Remove Hardcoded Values from AI Analytics

## Overview

This plan replaces all hardcoded display values in the `/ai-analytics` dashboard components with real data calculated from the database or properly derived from the existing data structures.

## Hardcoded Values Identified

### 1. AIPerformanceMetrics.tsx (Performance Tab)

| Location | Hardcoded Value | Solution |
|----------|-----------------|----------|
| Line 143-144 | Peak Time: `1.8s`, Off-Peak: `0.9s` | Calculate from data or derive from `avgProcessingTime` |
| Line 129-132 | High/Med Confidence derived incorrectly | Calculate from `confidenceDistribution` data |
| Line 155-156 | Gender/Age bias derived incorrectly | Pass from bias metrics data |
| Line 193-195 | System Uptime: `99.8%` | Add to PerformanceData type |
| Line 209 | Uncertain count: `candidatesAnalyzed * 0.1` | Calculate from real prediction data |
| Line 213 | Errors count: `candidatesAnalyzed * 0.03` | Calculate from real prediction data |

### 2. BiasAnalysis.tsx (Bias Tab)

| Location | Hardcoded Value | Solution |
|----------|-----------------|----------|
| Line 110-115 | `outcomeDistribution` array fully hardcoded | Calculate from application outcomes by demographic group |
| Line 118-122 | `fairnessScoreData` for pie chart | Derive from actual fairness metrics |

### 3. PredictiveAnalytics.tsx (Predictions Tab)

| Location | Hardcoded Value | Solution |
|----------|-----------------|----------|
| Line 144 | Growth: `+18%` | Calculate from forecast data comparing periods |

### 4. ModelInsights.tsx (Insights Tab)

| Location | Hardcoded Value | Solution |
|----------|-----------------|----------|
| Line 23-29 | `modelVersionData` array | Move to data hook or props |
| Line 31-36 | `performanceMetricsData` array | Derive from actual precision/recall/F1 |
| Line 115-117 | Model Type: `Ensemble`, `Gradient Boosting` | Add to insights data |
| Line 124-127 | Update Frequency: `Monthly` | Add to insights data |
| Line 302-303 | Accuracy improvement: `19%` | Calculate from model version history |

## Implementation Strategy

### Step 1: Extend Data Types

Add new fields to existing interfaces in `useAIAnalyticsData.ts`:

```text
PerformanceData:
  + systemUptime: number
  + peakProcessingTime: string
  + offPeakProcessingTime: string
  + uncertainCount: number
  + errorCount: number
  + highConfidencePercent: number
  + medConfidencePercent: number
  + genderBiasScore: number
  + ageBiasScore: number

BiasData:
  + outcomeDistribution: OutcomeDistributionPoint[]
  + fairnessDistribution: FairnessDistributionPoint[]

PredictionsData:
  + growthPercent: number

InsightsData:
  + modelVersionHistory: ModelVersionPoint[]
  + performanceMetrics: PerformanceMetricPoint[]
  + modelType: string
  + modelSubtype: string
  + updateFrequency: string
  + accuracyImprovement: number
```

### Step 2: Update Data Hook

Modify `fetchAnalyticsFromDB` in `useAIAnalyticsData.ts` to:

1. Query real application status distribution for funnel/outcome data
2. Calculate week-over-week and month-over-month trends
3. Compute derived metrics from candidate_scores table
4. Generate realistic fallbacks when real data is insufficient

### Step 3: Update Components

**AIPerformanceMetrics.tsx**
- Replace hardcoded sub-metrics with data props
- Use calculated uptime, uncertain, and error counts

**BiasAnalysis.tsx**
- Remove hardcoded `outcomeDistribution`
- Derive `fairnessScoreData` from metrics

**PredictiveAnalytics.tsx**
- Calculate growth from comparing first and last forecast periods

**ModelInsights.tsx**
- Receive model version history from props
- Derive performance metrics from precision/recall data
- Display model type/frequency from insights data

## Files to Modify

| File | Changes |
|------|---------|
| `src/features/ai-analytics/hooks/useAIAnalyticsData.ts` | Extend interfaces, add calculated fields, query more data |
| `src/features/ai-analytics/components/AIPerformanceMetrics.tsx` | Use data props instead of hardcoded values |
| `src/features/ai-analytics/components/BiasAnalysis.tsx` | Calculate outcome distribution, derive fairness chart |
| `src/features/ai-analytics/components/PredictiveAnalytics.tsx` | Calculate growth percentage dynamically |
| `src/features/ai-analytics/components/ModelInsights.tsx` | Use props for version history, metrics, model info |

## Database Queries to Add

```sql
-- Weekly application trends (for growth calculation)
SELECT 
  DATE_TRUNC('week', created_at) as week,
  COUNT(*) as applications_count
FROM applications 
WHERE created_at >= NOW() - INTERVAL '8 weeks'
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY week

-- Monthly hiring data (for forecasts)
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as applications_count,
  COUNT(CASE WHEN status = 'hired' THEN 1 END) as hired_count
FROM applications 
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month

-- Status distribution (for funnel/outcomes)
SELECT status, COUNT(*) as count 
FROM applications 
GROUP BY status
```

## Data Flow

```text
+----------------+     +-------------------+     +--------------------+
|   Supabase     | --> | useAIAnalyticsData| --> |   Components       |
|   Tables       |     | (calculations)    |     | (display only)     |
+----------------+     +-------------------+     +--------------------+
| applications   |     | - Calculate trends|     | AIPerformanceMetrics|
| candidate_scores|    | - Derive percentages|   | BiasAnalysis        |
|                |     | - Compute growth  |     | PredictiveAnalytics |
|                |     | - Build histograms|     | ModelInsights       |
+----------------+     +-------------------+     +--------------------+
```

## Fallback Strategy

When real data is insufficient (e.g., no `candidate_scores` records yet), the hook will:

1. Calculate what it can from available application data
2. For metrics that require AI scoring data, show "N/A" or informative placeholders
3. Never show random/mock numbers as if they were real

## Testing Considerations

- Verify calculations with known data sets
- Test edge cases (zero records, single record, null values)
- Ensure charts render correctly with real data ranges
- Validate that trends calculate correctly across date boundaries

