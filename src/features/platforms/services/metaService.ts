import { supabase } from '@/integrations/supabase/client';
import { MetaActionParams, MetaActionResult } from '../types';

/**
 * Central service for Meta API operations
 */
export class MetaService {
  /**
   * Invokes a Meta integration action via edge function
   */
  static async invokeAction(params: MetaActionParams): Promise<MetaActionResult> {
    try {
      const { data, error } = await supabase.functions.invoke('meta-integration', {
        body: params
      });

      if (error) {
        console.error('MetaService: Function error', error);
        return {
          success: false,
          error: error.message || 'Unknown error occurred',
          details: error
        };
      }

      return {
        success: true,
        message: data?.message || 'Action completed successfully',
        data
      };
    } catch (error: any) {
      console.error('MetaService: Unexpected error', error);
      return {
        success: false,
        error: error.message || 'Unexpected error occurred',
        details: error
      };
    }
  }

  /**
   * Syncs Meta accounts
   */
  static async syncAccounts(accountId: string, datePreset?: string, sinceDays?: number) {
    return this.invokeAction({
      action: 'sync_accounts',
      accountId,
      datePreset,
      sinceDays
    });
  }

  /**
   * Syncs Meta campaigns
   */
  static async syncCampaigns(accountId: string, datePreset?: string, sinceDays?: number) {
    return this.invokeAction({
      action: 'sync_campaigns',
      accountId,
      datePreset,
      sinceDays
    });
  }

  /**
   * Syncs Meta ad sets
   */
  static async syncAdSets(accountId: string, datePreset?: string, sinceDays?: number) {
    return this.invokeAction({
      action: 'sync_adsets',
      accountId,
      datePreset,
      sinceDays
    });
  }

  /**
   * Syncs Meta ads
   */
  static async syncAds(accountId: string, datePreset?: string, sinceDays?: number) {
    return this.invokeAction({
      action: 'sync_ads',
      accountId,
      datePreset,
      sinceDays
    });
  }

  /**
   * Syncs Meta insights/spend data
   */
  static async syncInsights(accountId: string, datePreset?: string, sinceDays?: number) {
    return this.invokeAction({
      action: 'sync_insights',
      accountId,
      datePreset,
      sinceDays
    });
  }

  /**
   * Syncs Meta leads
   */
  static async syncLeads(organizationId: string, sinceDays: number) {
    return this.invokeAction({
      action: 'sync_leads',
      sinceDays
    });
  }
}
