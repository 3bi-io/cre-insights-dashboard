import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DateRangeOption, MetaAccount, MetaCampaign, MetaAdSet, MetaAd, MetaDailySpend } from '../types';
import { getStartDate } from '../utils/dateUtils';
import { logger } from '@/lib/logger';

/**
 * Hook to fetch Meta accounts
 */
export const useMetaAccounts = (accountId: string) => {
  return useQuery({
    queryKey: ['meta-accounts', accountId],
    queryFn: async () => {
      logger.debug('Fetching Meta accounts', { accountId, context: 'meta-data' });
      const { data, error } = await supabase
        .from('meta_ad_accounts')
        .select('*')
        .eq('account_id', accountId)
        .order('account_name');
      
      if (error) throw error;
      logger.debug('Meta accounts fetched', { count: data?.length, context: 'meta-data' });
      return data as MetaAccount[];
    },
    retry: 2,
    retryDelay: 1000,
  });
};

/**
 * Hook to fetch Meta campaigns
 */
export const useMetaCampaigns = (accountId: string, enabled = true) => {
  return useQuery({
    queryKey: ['meta-campaigns', accountId],
    queryFn: async () => {
      logger.debug('Fetching Meta campaigns', { accountId, context: 'meta-data' });
      const { data, error } = await supabase
        .from('meta_campaigns')
        .select('*')
        .eq('account_id', accountId)
        .order('campaign_name');
      
      if (error) throw error;
      logger.debug('Meta campaigns fetched', { count: data?.length, context: 'meta-data' });
      return data as MetaCampaign[];
    },
    enabled,
  });
};

/**
 * Hook to fetch Meta ad sets
 */
export const useMetaAdSets = (accountId: string, enabled = true) => {
  return useQuery({
    queryKey: ['meta-ad-sets', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meta_ad_sets')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as MetaAdSet[];
    },
    enabled,
  });
};

/**
 * Hook to fetch Meta ads
 */
export const useMetaAds = (accountId: string, enabled = true) => {
  return useQuery({
    queryKey: ['meta-ads', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meta_ads')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as MetaAd[];
    },
    enabled,
  });
};

/**
 * Hook to fetch Meta daily spend data
 */
export const useMetaSpend = (accountId: string, dateRange: DateRangeOption, enabled = true) => {
  return useQuery({
    queryKey: ['meta-spend', accountId, dateRange],
    queryFn: async () => {
      const startDate = getStartDate(dateRange);
      
      const { data, error } = await supabase
        .from('meta_daily_spend')
        .select('*')
        .eq('account_id', accountId)
        .gte('date_start', startDate)
        .order('date_start', { ascending: false });
      
      if (error) throw error;
      return data as MetaDailySpend[];
    },
    enabled,
  });
};

/**
 * Aggregated hook for all Meta data
 */
export const useMetaIntegration = (accountId: string, dateRange: DateRangeOption = 'last_30d') => {
  const accountsQuery = useMetaAccounts(accountId);
  const hasAccounts = !!accountsQuery.data?.length;
  
  const campaignsQuery = useMetaCampaigns(accountId, hasAccounts);
  const adSetsQuery = useMetaAdSets(accountId, hasAccounts);
  const adsQuery = useMetaAds(accountId, hasAccounts);
  const spendQuery = useMetaSpend(accountId, dateRange, hasAccounts);

  return {
    accounts: accountsQuery.data,
    campaigns: campaignsQuery.data,
    adSets: adSetsQuery.data,
    ads: adsQuery.data,
    spend: spendQuery.data,
    isLoading: accountsQuery.isLoading,
    isError: accountsQuery.isError,
    refetchAccounts: accountsQuery.refetch,
    refetchCampaigns: campaignsQuery.refetch,
    refetchAdSets: adSetsQuery.refetch,
    refetchAds: adsQuery.refetch,
    refetchSpend: spendQuery.refetch,
  };
};
