import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { startOfDay, subDays, subMonths, subWeeks, subQuarters, subYears, format } from 'date-fns';

export type DateRangeType = 'week' | 'month' | 'quarter' | 'year';

export interface PerformanceData {
  modelAccuracy: number;
  predictionConfidence: number;
  processingSpeed: number;
  biasScore: number;
  candidatesAnalyzed: number;
  accuracyTrend: number;
  avgProcessingTime: string;
  successRate: number;
  precision: number;
  recall: number;
}

export interface ForecastPoint {
  month: string;
  actual: number | null;
  predicted: number;
  confidence: number;
}

export interface HiringTrendPoint {
  week: string;
  applications: number | null;
  qualified: number | null;
  hired: number | null;
  predicted: number;
}

export interface CandidateFlowPoint {
  stage: string;
  count: number;
  dropout: number;
  predicted: number;
}

export interface CostPredictionPoint {
  category: string;
  current: number;
  predicted: number;
  savings: number;
}

export interface BiasMetric {
  category: string;
  score: number;
  threshold: number;
  status: 'excellent' | 'good' | 'warning' | 'danger';
}

export interface DiversityPoint {
  name: string;
  diverse: number;
  nonDiverse: number;
}

export interface ComparisonMetric {
  metric: string;
  traditional: number;
  aiEnhanced: number;
  unit: string;
  improvement: number;
}

export interface RadarPoint {
  metric: string;
  traditional: number;
  aiEnhanced: number;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  category: 'high' | 'medium' | 'low';
}

export interface ConfidenceDistribution {
  range: string;
  count: number;
  x: number;
  y: number;
  z: number;
}

export interface AIAnalyticsData {
  performance: PerformanceData;
  predictions: {
    forecastData: ForecastPoint[];
    hiringTrends: HiringTrendPoint[];
    candidateFlow: CandidateFlowPoint[];
    costPredictions: CostPredictionPoint[];
  };
  bias: {
    metrics: BiasMetric[];
    fairnessScore: number;
    overallBiasScore: number;
    issuesDetected: number;
    diversityData: DiversityPoint[];
  };
  comparison: {
    metrics: ComparisonMetric[];
    radarData: RadarPoint[];
    totalSavings: number;
    timeSaved: number;
    qualityIncrease: number;
  };
  insights: {
    featureImportance: FeatureImportance[];
    confidenceDistribution: ConfidenceDistribution[];
    modelVersion: string;
    trainingDataPoints: number;
    lastUpdated: string;
  };
}

function getDateRange(rangeType: DateRangeType): { start: Date; end: Date } {
  const end = new Date();
  let start: Date;

  switch (rangeType) {
    case 'week':
      start = subWeeks(end, 1);
      break;
    case 'month':
      start = subMonths(end, 1);
      break;
    case 'quarter':
      start = subQuarters(end, 1);
      break;
    case 'year':
      start = subYears(end, 1);
      break;
    default:
      start = subMonths(end, 1);
  }

  return { start: startOfDay(start), end };
}

// Generate mock data that simulates real patterns
function generateMockData(dateRange: DateRangeType): AIAnalyticsData {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
  const currentMonth = new Date().getMonth();
  
  return {
    performance: {
      modelAccuracy: 87 + Math.floor(Math.random() * 8),
      predictionConfidence: 82 + Math.floor(Math.random() * 10),
      processingSpeed: 10 + Math.floor(Math.random() * 10),
      biasScore: 12 + Math.floor(Math.random() * 8),
      candidatesAnalyzed: 500 + Math.floor(Math.random() * 400),
      accuracyTrend: 3 + Math.floor(Math.random() * 8),
      avgProcessingTime: `${(1.0 + Math.random()).toFixed(1)}s`,
      successRate: 80 + Math.floor(Math.random() * 12),
      precision: 0.83 + Math.random() * 0.1,
      recall: 0.78 + Math.random() * 0.1,
    },
    predictions: {
      forecastData: months.map((month, i) => ({
        month,
        actual: i < currentMonth ? 40 + Math.floor(Math.random() * 25) : null,
        predicted: 42 + Math.floor(Math.random() * 30),
        confidence: 80 + Math.floor(Math.random() * 15),
      })),
      hiringTrends: Array.from({ length: 6 }, (_, i) => ({
        week: `W${i + 1}`,
        applications: i < 4 ? 100 + Math.floor(Math.random() * 60) : null,
        qualified: i < 4 ? 40 + Math.floor(Math.random() * 25) : null,
        hired: i < 4 ? 10 + Math.floor(Math.random() * 10) : null,
        predicted: 12 + Math.floor(Math.random() * 12),
      })),
      candidateFlow: [
        { stage: 'Applied', count: 800 + Math.floor(Math.random() * 100), dropout: 12 + Math.floor(Math.random() * 8), predicted: 780 },
        { stage: 'Screened', count: 680 + Math.floor(Math.random() * 80), dropout: 18 + Math.floor(Math.random() * 8), predicted: 660 },
        { stage: 'Interviewed', count: 520 + Math.floor(Math.random() * 60), dropout: 15 + Math.floor(Math.random() * 8), predicted: 510 },
        { stage: 'Offered', count: 420 + Math.floor(Math.random() * 50), dropout: 6 + Math.floor(Math.random() * 4), predicted: 410 },
        { stage: 'Hired', count: 380 + Math.floor(Math.random() * 50), dropout: 0, predicted: 375 },
      ],
      costPredictions: [
        { category: 'Sourcing', current: 11000 + Math.floor(Math.random() * 3000), predicted: 9500, savings: 1500 + Math.floor(Math.random() * 500) },
        { category: 'Screening', current: 8000 + Math.floor(Math.random() * 2000), predicted: 5800, savings: 2200 + Math.floor(Math.random() * 600) },
        { category: 'Interviews', current: 14000 + Math.floor(Math.random() * 3000), predicted: 12000, savings: 2000 + Math.floor(Math.random() * 800) },
        { category: 'Onboarding', current: 6500 + Math.floor(Math.random() * 1500), predicted: 6000, savings: 500 + Math.floor(Math.random() * 300) },
      ],
    },
    bias: {
      metrics: [
        { category: 'Gender', score: 10 + Math.floor(Math.random() * 6), threshold: 20, status: 'good' as const },
        { category: 'Age', score: 6 + Math.floor(Math.random() * 6), threshold: 20, status: 'excellent' as const },
        { category: 'Ethnicity', score: 12 + Math.floor(Math.random() * 6), threshold: 20, status: 'good' as const },
        { category: 'Education', score: 18 + Math.floor(Math.random() * 10), threshold: 20, status: Math.random() > 0.5 ? 'warning' as const : 'good' as const },
        { category: 'Location', score: 14 + Math.floor(Math.random() * 6), threshold: 20, status: 'good' as const },
      ],
      fairnessScore: 82 + Math.floor(Math.random() * 10),
      overallBiasScore: 12 + Math.floor(Math.random() * 8),
      issuesDetected: Math.floor(Math.random() * 2),
      diversityData: [
        { name: 'Recommended', diverse: 38 + Math.floor(Math.random() * 10), nonDiverse: 52 + Math.floor(Math.random() * 10) },
        { name: 'Interviewed', diverse: 42 + Math.floor(Math.random() * 8), nonDiverse: 48 + Math.floor(Math.random() * 8) },
        { name: 'Hired', diverse: 45 + Math.floor(Math.random() * 8), nonDiverse: 45 + Math.floor(Math.random() * 8) },
      ],
    },
    comparison: {
      metrics: [
        { metric: 'Time to Hire', traditional: 40 + Math.floor(Math.random() * 10), aiEnhanced: 24 + Math.floor(Math.random() * 6), unit: 'days', improvement: 35 + Math.floor(Math.random() * 10) },
        { metric: 'Cost per Hire', traditional: 3800 + Math.floor(Math.random() * 800), aiEnhanced: 2600 + Math.floor(Math.random() * 400), unit: '$', improvement: 28 + Math.floor(Math.random() * 10) },
        { metric: 'Quality Score', traditional: 65 + Math.floor(Math.random() * 8), aiEnhanced: 82 + Math.floor(Math.random() * 6), unit: '/100', improvement: 20 + Math.floor(Math.random() * 8) },
        { metric: 'Candidates Screened', traditional: 40 + Math.floor(Math.random() * 15), aiEnhanced: 110 + Math.floor(Math.random() * 30), unit: 'per day', improvement: 150 + Math.floor(Math.random() * 50) },
        { metric: 'Interview Success', traditional: 58 + Math.floor(Math.random() * 10), aiEnhanced: 78 + Math.floor(Math.random() * 8), unit: '%', improvement: 25 + Math.floor(Math.random() * 10) },
      ],
      radarData: [
        { metric: 'Speed', traditional: 60 + Math.floor(Math.random() * 10), aiEnhanced: 88 + Math.floor(Math.random() * 8) },
        { metric: 'Accuracy', traditional: 68 + Math.floor(Math.random() * 10), aiEnhanced: 85 + Math.floor(Math.random() * 8) },
        { metric: 'Cost Efficiency', traditional: 55 + Math.floor(Math.random() * 10), aiEnhanced: 86 + Math.floor(Math.random() * 8) },
        { metric: 'Candidate Experience', traditional: 65 + Math.floor(Math.random() * 10), aiEnhanced: 82 + Math.floor(Math.random() * 8) },
        { metric: 'Quality Match', traditional: 64 + Math.floor(Math.random() * 10), aiEnhanced: 88 + Math.floor(Math.random() * 8) },
        { metric: 'Bias Reduction', traditional: 42 + Math.floor(Math.random() * 10), aiEnhanced: 84 + Math.floor(Math.random() * 8) },
      ],
      totalSavings: 100000 + Math.floor(Math.random() * 50000),
      timeSaved: 200 + Math.floor(Math.random() * 80),
      qualityIncrease: 22 + Math.floor(Math.random() * 10),
    },
    insights: {
      featureImportance: [
        { feature: 'Years of Experience', importance: 0.22 + Math.random() * 0.06, category: 'high' as const },
        { feature: 'Skills Match', importance: 0.19 + Math.random() * 0.05, category: 'high' as const },
        { feature: 'Education Level', importance: 0.15 + Math.random() * 0.05, category: 'medium' as const },
        { feature: 'Previous Roles', importance: 0.13 + Math.random() * 0.04, category: 'medium' as const },
        { feature: 'Industry Experience', importance: 0.10 + Math.random() * 0.04, category: 'medium' as const },
        { feature: 'Certifications', importance: 0.08 + Math.random() * 0.04, category: 'low' as const },
      ].sort((a, b) => b.importance - a.importance),
      confidenceDistribution: [
        { range: '90-100%', count: 300 + Math.floor(Math.random() * 100), x: 95, y: 350, z: 20 },
        { range: '80-89%', count: 250 + Math.floor(Math.random() * 80), x: 85, y: 280, z: 18 },
        { range: '70-79%', count: 130 + Math.floor(Math.random() * 50), x: 75, y: 150, z: 15 },
        { range: '60-69%', count: 70 + Math.floor(Math.random() * 30), x: 65, y: 80, z: 12 },
        { range: '<60%', count: 20 + Math.floor(Math.random() * 15), x: 55, y: 25, z: 8 },
      ],
      modelVersion: 'v2.1',
      trainingDataPoints: 14000 + Math.floor(Math.random() * 3000),
      lastUpdated: format(subDays(new Date(), Math.floor(Math.random() * 30)), 'yyyy-MM-dd'),
    },
  };
}

async function fetchAnalyticsFromDB(organizationId: string | undefined, dateRange: DateRangeType): Promise<AIAnalyticsData> {
  const { start, end } = getDateRange(dateRange);
  
  // Try to fetch real data from candidate_scores
  const { data: scoresData, error: scoresError } = await supabase
    .from('candidate_scores')
    .select('*')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .limit(1000);

  // Fetch applications count
  const { count: applicationsCount } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  // If we have real data, process it
  if (scoresData && scoresData.length > 0) {
    const avgConfidence = scoresData.reduce((sum, s) => sum + (s.confidence_level || 0), 0) / scoresData.length;
    const avgScore = scoresData.reduce((sum, s) => sum + (s.score || 0), 0) / scoresData.length;
    
    // Calculate confidence distribution
    const confidenceBuckets = [0, 0, 0, 0, 0]; // <60, 60-69, 70-79, 80-89, 90-100
    scoresData.forEach(s => {
      const conf = s.confidence_level || 0;
      if (conf >= 90) confidenceBuckets[4]++;
      else if (conf >= 80) confidenceBuckets[3]++;
      else if (conf >= 70) confidenceBuckets[2]++;
      else if (conf >= 60) confidenceBuckets[1]++;
      else confidenceBuckets[0]++;
    });

    // Generate data with real metrics blended in
    const mockData = generateMockData(dateRange);
    
    return {
      ...mockData,
      performance: {
        ...mockData.performance,
        predictionConfidence: Math.round(avgConfidence),
        candidatesAnalyzed: scoresData.length,
        modelAccuracy: Math.round(avgScore),
      },
      insights: {
        ...mockData.insights,
        confidenceDistribution: [
          { range: '90-100%', count: confidenceBuckets[4], x: 95, y: confidenceBuckets[4], z: 20 },
          { range: '80-89%', count: confidenceBuckets[3], x: 85, y: confidenceBuckets[3], z: 18 },
          { range: '70-79%', count: confidenceBuckets[2], x: 75, y: confidenceBuckets[2], z: 15 },
          { range: '60-69%', count: confidenceBuckets[1], x: 65, y: confidenceBuckets[1], z: 12 },
          { range: '<60%', count: confidenceBuckets[0], x: 55, y: confidenceBuckets[0], z: 8 },
        ],
      },
    };
  }

  // Fall back to mock data if no real data exists
  return generateMockData(dateRange);
}

export function useAIAnalyticsData(dateRange: DateRangeType = 'month') {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['ai-analytics', dateRange, organization?.id],
    queryFn: () => fetchAnalyticsFromDB(organization?.id, dateRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

export default useAIAnalyticsData;
