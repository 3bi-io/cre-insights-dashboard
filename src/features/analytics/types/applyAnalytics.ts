// Apply Page Analytics Types

export interface ApplyPageMetrics {
  pageViews: number;
  uniqueVisitors: number;
  applications: number;
  conversionRate: number;
  avgTimeOnPage: number;
  bounceRate: number;
}

export interface DeviceBreakdown {
  device: string;
  count: number;
  percentage: number;
}

export interface TrafficSource {
  source: string;
  count: number;
  percentage: number;
}

export interface DailyTrend {
  date: string;
  views: number;
  applications: number;
}

export interface TopReferrer {
  referrer: string;
  count: number;
}

export interface CountryBreakdown {
  country: string;
  count: number;
  percentage: number;
}

export interface ApplyPageAnalyticsData {
  metrics: ApplyPageMetrics;
  deviceBreakdown: DeviceBreakdown[];
  trafficSources: TrafficSource[];
  dailyTrend: DailyTrend[];
  topReferrers: TopReferrer[];
  countryBreakdown: CountryBreakdown[];
}

export type DateRange = '7d' | '30d' | '90d' | 'all';
