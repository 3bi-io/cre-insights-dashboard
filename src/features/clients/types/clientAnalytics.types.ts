// Client Analytics Types

export type DateRange = '7d' | '30d' | '90d' | 'all';

export interface PipelineStage {
  stage: string;
  count: number;
  percentage: number;
}

export interface SourceBreakdown {
  source: string;
  count: number;
  percentage: number;
}

export interface ATSDeliveryStats {
  total: number;
  sent: number;
  success: number;
  error: number;
  pending: number;
  successRate: number;
}

export interface SLAMetrics {
  avgResponseHours: number;
  medianResponseHours: number;
  within24h: number;
  within48h: number;
  over48h: number;
  totalWithResponse: number;
}

export interface DailyTrend {
  date: string;
  applications: number;
  deliveries: number;
}

export interface ReadinessDistribution {
  range: string;
  count: number;
  min: number;
  max: number;
}

export interface ClientAnalyticsData {
  clientId: string;
  clientName: string;
  pipeline: PipelineStage[];
  sources: SourceBreakdown[];
  atsDelivery: ATSDeliveryStats;
  sla: SLAMetrics;
  trends: DailyTrend[];
  readinessDistribution: ReadinessDistribution[];
  totalApplications: number;
  avgReadinessScore: number;
}

export interface PortfolioClientRow {
  id: string;
  name: string;
  logoUrl: string | null;
  city: string | null;
  state: string | null;
  status: string;
  jobCount: number;
  activeJobCount: number;
  applicationCount: number;
  recentApplications: number;
  atsDeliveryRate: number;
  avgReadinessScore: number;
  avgSlaHours: number;
  topSource: string;
  sparklineData: number[];
}

export interface PortfolioSummary {
  totalApplications: number;
  totalClients: number;
  activeClients: number;
  totalJobs: number;
  overallDeliveryRate: number;
  avgReadinessScore: number;
  avgSlaHours: number;
  activeJobs: number;
}

export type LeaderboardSortField = 'applicationCount' | 'atsDeliveryRate' | 'avgReadinessScore' | 'avgSlaHours' | 'recentApplications';
