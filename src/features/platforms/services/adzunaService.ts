import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

/**
 * Adzuna integration service
 * Handles communication with the adzuna-integration edge function
 */

export interface AdzunaAnalyticsParams {
  campaignId: string;
  startDate: string;
  endDate: string;
  jobId?: string;
  organizationId?: string;
}

export interface AdzunaJobData {
  title: string;
  description: string;
  company: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  contract_type?: 'full_time' | 'part_time' | 'contract' | 'temporary';
  category?: string;
  redirect_url?: string;
}

export interface AdzunaSearchParams {
  query: string;
  location?: string;
  country?: string;
  page?: number;
  resultsPerPage?: number;
}

export interface AdzunaAnalyticsResult {
  success: boolean;
  message?: string;
  recordsProcessed?: number;
  source?: 'adzuna_api' | 'simulated';
  error?: string;
}

export interface AdzunaStatsResult {
  success: boolean;
  data?: any[];
  totals?: {
    spend: number;
    clicks: number;
    impressions: number;
    applications: number;
    ctr: number;
    cpc: number;
    cpa: number;
  };
  period?: {
    days: number;
    from: string | null;
    to: string | null;
  };
  error?: string;
}

export interface AdzunaJobResult {
  success: boolean;
  message?: string;
  jobId?: string;
  jobData?: any;
  warning?: string;
  error?: string;
}

export interface AdzunaSearchResult {
  success: boolean;
  results?: any[];
  count?: number;
  mean?: number;
  page?: number;
  error?: string;
}

export class AdzunaService {
  /**
   * Sync analytics data from Adzuna
   */
  static async syncAnalytics(params: AdzunaAnalyticsParams): Promise<AdzunaAnalyticsResult> {
    try {
      logger.debug('AdzunaService: Syncing analytics', { context: 'AdzunaService' });
      
      const { data, error } = await supabase.functions.invoke('adzuna-integration', {
        body: {
          action: 'sync_analytics',
          ...params,
        },
      });

      if (error) {
        logger.error('AdzunaService: Sync analytics error', error, { context: 'AdzunaService' });
        return { success: false, error: error.message };
      }

      return data as AdzunaAnalyticsResult;
    } catch (error: any) {
      logger.error('AdzunaService: Unexpected error', error, { context: 'AdzunaService' });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get aggregated stats for a campaign
   */
  static async getStats(campaignId: string): Promise<AdzunaStatsResult> {
    try {
      logger.debug('AdzunaService: Getting stats', { context: 'AdzunaService' });
      
      const { data, error } = await supabase.functions.invoke('adzuna-integration', {
        body: {
          action: 'get_stats',
          campaignId,
        },
      });

      if (error) {
        logger.error('AdzunaService: Get stats error', error, { context: 'AdzunaService' });
        return { success: false, error: error.message };
      }

      return data as AdzunaStatsResult;
    } catch (error: any) {
      logger.error('AdzunaService: Unexpected error', error, { context: 'AdzunaService' });
      return { success: false, error: error.message };
    }
  }

  /**
   * Post a job to Adzuna
   */
  static async postJob(jobData: AdzunaJobData): Promise<AdzunaJobResult> {
    try {
      logger.debug('AdzunaService: Posting job', { context: 'AdzunaService' });
      
      const { data, error } = await supabase.functions.invoke('adzuna-integration', {
        body: {
          action: 'post_job',
          jobData,
        },
      });

      if (error) {
        logger.error('AdzunaService: Post job error', error, { context: 'AdzunaService' });
        return { success: false, error: error.message };
      }

      return data as AdzunaJobResult;
    } catch (error: any) {
      logger.error('AdzunaService: Unexpected error', error, { context: 'AdzunaService' });
      return { success: false, error: error.message };
    }
  }

  /**
   * Search jobs on Adzuna
   */
  static async searchJobs(params: AdzunaSearchParams): Promise<AdzunaSearchResult> {
    try {
      logger.debug('AdzunaService: Searching jobs', { context: 'AdzunaService' });
      
      const { data, error } = await supabase.functions.invoke('adzuna-integration', {
        body: {
          action: 'search_jobs',
          ...params,
        },
      });

      if (error) {
        logger.error('AdzunaService: Search jobs error', error, { context: 'AdzunaService' });
        return { success: false, error: error.message };
      }

      return data as AdzunaSearchResult;
    } catch (error: any) {
      logger.error('AdzunaService: Unexpected error', error, { context: 'AdzunaService' });
      return { success: false, error: error.message };
    }
  }
}
