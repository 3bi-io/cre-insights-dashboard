import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

/**
 * Indeed integration service
 * Handles communication with the indeed-integration edge function
 */

export interface IndeedAnalyticsParams {
  employerId: string;
  startDate: string;
  endDate: string;
  jobId?: string;
}

export interface IndeedJobLocation {
  city: string;
  state: string;
  country?: string;
  postalCode?: string;
}

export interface IndeedJobSalary {
  min?: number;
  max?: number;
  type?: 'yearly' | 'monthly' | 'weekly' | 'daily' | 'hourly';
}

export interface IndeedJobData {
  title: string;
  description: string;
  company: string;
  location: IndeedJobLocation;
  salary?: IndeedJobSalary;
  jobType?: 'fulltime' | 'parttime' | 'contract' | 'temporary' | 'internship';
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive';
  applyUrl?: string;
  category?: string;
}

export interface IndeedAnalyticsResult {
  success: boolean;
  message?: string;
  recordsProcessed?: number;
  source?: 'indeed_api' | 'simulated';
  error?: string;
}

export interface IndeedStatsResult {
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

export interface IndeedJobResult {
  success: boolean;
  message?: string;
  jobId?: string;
  jobData?: any;
  warning?: string;
  error?: string;
}

export class IndeedService {
  /**
   * Sync analytics data from Indeed
   */
  static async syncAnalytics(params: IndeedAnalyticsParams): Promise<IndeedAnalyticsResult> {
    try {
      logger.debug('IndeedService: Syncing analytics', { context: 'IndeedService' });
      
      const { data, error } = await supabase.functions.invoke('indeed-integration', {
        body: {
          action: 'sync_analytics',
          ...params,
        },
      });

      if (error) {
        logger.error('IndeedService: Sync analytics error', error, { context: 'IndeedService' });
        return { success: false, error: error.message };
      }

      return data as IndeedAnalyticsResult;
    } catch (error: any) {
      logger.error('IndeedService: Unexpected error', error, { context: 'IndeedService' });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get aggregated stats for an employer
   */
  static async getStats(employerId: string): Promise<IndeedStatsResult> {
    try {
      logger.debug('IndeedService: Getting stats', { context: 'IndeedService' });
      
      const { data, error } = await supabase.functions.invoke('indeed-integration', {
        body: {
          action: 'get_stats',
          employerId,
        },
      });

      if (error) {
        logger.error('IndeedService: Get stats error', error, { context: 'IndeedService' });
        return { success: false, error: error.message };
      }

      return data as IndeedStatsResult;
    } catch (error: any) {
      logger.error('IndeedService: Unexpected error', error, { context: 'IndeedService' });
      return { success: false, error: error.message };
    }
  }

  /**
   * Post a job to Indeed
   */
  static async postJob(jobData: IndeedJobData): Promise<IndeedJobResult> {
    try {
      logger.debug('IndeedService: Posting job', { context: 'IndeedService' });
      
      const { data, error } = await supabase.functions.invoke('indeed-integration', {
        body: {
          action: 'post_job',
          jobData,
        },
      });

      if (error) {
        logger.error('IndeedService: Post job error', error, { context: 'IndeedService' });
        return { success: false, error: error.message };
      }

      return data as IndeedJobResult;
    } catch (error: any) {
      logger.error('IndeedService: Unexpected error', error, { context: 'IndeedService' });
      return { success: false, error: error.message };
    }
  }

  /**
   * Update an existing job on Indeed
   */
  static async updateJob(jobId: string, jobData: Partial<IndeedJobData>): Promise<IndeedJobResult> {
    try {
      logger.debug('IndeedService: Updating job', { context: 'IndeedService' });
      
      const { data, error } = await supabase.functions.invoke('indeed-integration', {
        body: {
          action: 'update_job',
          jobId,
          jobData,
        },
      });

      if (error) {
        logger.error('IndeedService: Update job error', error, { context: 'IndeedService' });
        return { success: false, error: error.message };
      }

      return data as IndeedJobResult;
    } catch (error: any) {
      logger.error('IndeedService: Unexpected error', error, { context: 'IndeedService' });
      return { success: false, error: error.message };
    }
  }

  /**
   * Pause a job on Indeed
   */
  static async pauseJob(jobId: string): Promise<IndeedJobResult> {
    try {
      logger.debug('IndeedService: Pausing job', { context: 'IndeedService' });
      
      const { data, error } = await supabase.functions.invoke('indeed-integration', {
        body: {
          action: 'pause_job',
          jobId,
        },
      });

      if (error) {
        logger.error('IndeedService: Pause job error', error, { context: 'IndeedService' });
        return { success: false, error: error.message };
      }

      return data as IndeedJobResult;
    } catch (error: any) {
      logger.error('IndeedService: Unexpected error', error, { context: 'IndeedService' });
      return { success: false, error: error.message };
    }
  }

  /**
   * Resume a paused job on Indeed
   */
  static async resumeJob(jobId: string): Promise<IndeedJobResult> {
    try {
      logger.debug('IndeedService: Resuming job', { context: 'IndeedService' });
      
      const { data, error } = await supabase.functions.invoke('indeed-integration', {
        body: {
          action: 'resume_job',
          jobId,
        },
      });

      if (error) {
        logger.error('IndeedService: Resume job error', error, { context: 'IndeedService' });
        return { success: false, error: error.message };
      }

      return data as IndeedJobResult;
    } catch (error: any) {
      logger.error('IndeedService: Unexpected error', error, { context: 'IndeedService' });
      return { success: false, error: error.message };
    }
  }
}
