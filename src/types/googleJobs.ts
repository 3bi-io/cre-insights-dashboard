/**
 * Google Jobs Integration Type Definitions
 */

export interface GoogleJobsSitemapEntry {
  loc: string;
  lastmod: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export interface JobPostingSchemaInput {
  id: string;
  title: string;
  description: string;
  datePosted: string;
  validThrough?: string;
  employmentType?: string;
  hiringOrganization: string;
  hiringOrganizationUrl?: string;
  hiringOrganizationLogo?: string;
  jobLocation?: {
    city?: string;
    state?: string;
    country?: string;
    streetAddress?: string;
    postalCode?: string;
  };
  baseSalary?: {
    minValue?: number;
    maxValue?: number;
    currency: string;
    unitText: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
  };
  remoteType?: 'fully_remote' | 'hybrid' | 'on_site';
  directApply?: boolean;
  applicationUrl?: string;
}

export interface FeedValidationResult {
  isValid: boolean;
  urlCount: number;
  errors: string[];
  warnings: string[];
  sitemapPreview: string;
  urlsWithJsonLd: number;
  urlsWithoutJsonLd: number;
  validatedUrls?: ValidatedUrl[];
}

export interface ValidatedUrl {
  url: string;
  hasJsonLd: boolean;
  jobTitle?: string;
  errors: string[];
  warnings: string[];
}

export interface FeedAccessLog {
  id: string;
  organization_id: string | null;
  user_id: string | null;
  feed_type: string;
  platform: string;
  request_ip: string;
  user_agent: string;
  job_count: number;
  response_time_ms: number;
  created_at: string;
}

export interface FeedHealthStatus {
  feedAccessible: boolean;
  urlCount: number;
  lastAccessed?: string;
  avgResponseTime?: number;
  recentCrawlers: string[];
  jobsWithValidSchema: number;
  jobsWithSchemaErrors: number;
}

// Sitemap XML namespace constants
export const SITEMAP_NAMESPACE = 'http://www.sitemaps.org/schemas/sitemap/0.9';

// Employment type mappings for Google Jobs
export const EMPLOYMENT_TYPE_MAP: Record<string, string> = {
  'full-time': 'FULL_TIME',
  'full_time': 'FULL_TIME',
  'fulltime': 'FULL_TIME',
  'part-time': 'PART_TIME',
  'part_time': 'PART_TIME',
  'parttime': 'PART_TIME',
  'contract': 'CONTRACTOR',
  'contractor': 'CONTRACTOR',
  'temporary': 'TEMPORARY',
  'temp': 'TEMPORARY',
  'internship': 'INTERN',
  'intern': 'INTERN',
  'volunteer': 'VOLUNTEER',
  'per_diem': 'PER_DIEM',
  'other': 'OTHER',
};

// Salary unit text mappings
export const SALARY_UNIT_MAP: Record<string, 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'> = {
  'hourly': 'HOUR',
  'hour': 'HOUR',
  'daily': 'DAY',
  'day': 'DAY',
  'weekly': 'WEEK',
  'week': 'WEEK',
  'monthly': 'MONTH',
  'month': 'MONTH',
  'yearly': 'YEAR',
  'year': 'YEAR',
  'annual': 'YEAR',
  'annually': 'YEAR',
};
