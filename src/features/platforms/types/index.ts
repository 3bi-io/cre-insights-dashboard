// Platform type definitions

export interface Platform {
  id: string;
  name: string;
  logo_url: string | null;
  api_endpoint: string | null;
  created_at: string;
  organization_id?: string;
  user_id?: string;
}

export interface PlatformConfig {
  name: string;
  logo: string;
  status: string;
  description: string;
  created: string;
  category?: 'paid' | 'free' | 'trucking';
}

export interface MetaAccount {
  id: string;
  account_id: string;
  account_name: string | null;
  currency: string | null;
  timezone_name: string | null;
  organization_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface MetaCampaign {
  id: string;
  campaign_id: string;
  campaign_name: string | null;
  account_id: string;
  status: string | null;
  objective: string | null;
  user_id: string;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MetaAdSet {
  id: string;
  adset_id: string;
  adset_name: string | null;
  campaign_id: string;
  account_id: string;
  status: string | null;
  daily_budget: number | null;
  lifetime_budget: number | null;
  targeting: string | null;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpm: number;
  cpc: number;
  reach: number;
  frequency: number;
  user_id: string;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MetaAd {
  id: string;
  ad_id: string;
  ad_name: string | null;
  adset_id: string;
  campaign_id: string;
  account_id: string;
  status: string | null;
  creative_id: string | null;
  preview_url: string | null;
  user_id: string;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MetaDailySpend {
  id: string;
  account_id: string;
  campaign_id: string | null;
  adset_id: string | null;
  ad_id: string | null;
  date_start: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpm: number;
  cpc: number;
  reach: number;
  frequency: number;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export type DateRangeOption = 
  | 'last_7d' 
  | 'last_14d' 
  | 'last_30d' 
  | 'last_60d' 
  | 'last_90d' 
  | 'this_month' 
  | 'last_month';

export interface MetaActionParams {
  action: string;
  accountId?: string;
  campaignId?: string;
  datePreset?: string;
  sinceDays?: number;
}

export interface MetaActionResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
  details?: any;
}

export interface PlatformActionProps {
  platform: {
    id: string;
    name: string;
    api_endpoint: string;
  };
  onRefresh: () => void;
}

export interface PlatformError extends Error {
  code?: string;
  details?: any;
}
