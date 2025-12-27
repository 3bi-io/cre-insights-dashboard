// Analytics & Metrics Types

export interface SpendTrendData {
  date: string;
  spend: number;
  applications: number;
}

export interface PlatformPerformanceData {
  platform: string;
  applications: number;
  cpa: number;
  spend?: number;
}

export interface MonthlyBudgetData {
  month: string;
  budget: number;
  spent: number;
}

export interface JobVolumeData {
  date: string;
  active: number;
  inactive: number;
}

export interface AnalyticsMetaSpendMetrics {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalLeads: number;
  costPerLead: number;
  conversionRate: number;
  insights: string[];
  recommendations: string[];
}

export interface AnalyticsData {
  totalApplications: number;
  avgResponseTime: number;
  topPerformingJobs: Array<{
    title: string;
    applications: number;
  }>;
  insights: string[];
  recommendations: string[];
}

export interface MetaAnalyticsData {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalLeads: number;
  costPerLead: number;
  conversionRate: number;
  campaigns: Array<{
    name: string;
    spend: number;
    leads: number;
    cpl: number;
  }>;
  topPerformers: Array<{
    name: string;
    metric: string;
    value: number;
  }>;
  insights: string[];
  recommendations: string[];
}

export interface CategoryData {
  category: string;
  percentage: number;
  count: number;
}

export interface AIMetric {
  id: string;
  user_id: string;
  organization_id?: string;
  metric_type: string;
  date: string;
  ai_value: number;
  traditional_value: number;
  improvement_percentage: number;
  created_at: string;
}

export interface AnalyticsDashboardMetrics {
  totalSpend: number;
  totalApplications: number;
  totalJobs: number;
  totalReach: number;
  totalImpressions: number;
  costPerApplication: number;
  costPerLead: number;
}

export type DateRange = 'last_7d' | 'last_30d' | 'last_90d' | 'last_365d';

export interface AnalyticsFilters {
  dateRange?: DateRange;
  organizationId?: string;
  jobListingId?: string;
  platform?: string;
}

// Apply Page Analytics Types
export * from './applyAnalytics';
