import { supabase } from '@/integrations/supabase/client';
import type { AnalyticsMetaSpendMetrics, DateRange } from '../types';

export const metaAnalyticsService = {
  /**
   * Calculate date range based on preset
   */
  getDateRange(range: DateRange): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();

    switch (range) {
      case 'last_7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'last_30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case 'last_90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case 'last_365d':
        startDate.setDate(endDate.getDate() - 365);
        break;
    }

    return { startDate, endDate };
  },

  /**
   * Fetch and analyze Meta spend metrics
   */
  async fetchMetrics(
    dateRange: DateRange = 'last_30d',
    organizationId?: string
  ): Promise<AnalyticsMetaSpendMetrics> {
    const { startDate, endDate } = this.getDateRange(dateRange);

    // Fetch Meta spend data
    let spendQuery = supabase
      .from('meta_daily_spend')
      .select('*')
      .gte('date_start', startDate.toISOString().split('T')[0])
      .lte('date_start', endDate.toISOString().split('T')[0]);

    if (organizationId) {
      spendQuery = spendQuery.eq('organization_id', organizationId);
    }

    const { data: spendData, error: spendError } = await spendQuery;
    if (spendError) throw spendError;

    // Fetch lead generation data
    let leadsQuery = supabase
      .from('applications')
      .select(`
        *,
        job_listings!inner(organization_id)
      `)
      .or('source.eq.Meta,source.eq.Facebook,source.eq.Instagram')
      .gte('applied_at', startDate.toISOString())
      .lte('applied_at', endDate.toISOString());

    if (organizationId) {
      leadsQuery = leadsQuery.eq('job_listings.organization_id', organizationId);
    }

    const { data: leadsData, error: leadsError } = await leadsQuery;
    if (leadsError) throw leadsError;

    // Calculate metrics
    const totalSpend = (spendData || []).reduce((sum, item) => sum + Number(item.spend || 0), 0);
    const totalImpressions = (spendData || []).reduce((sum, item) => sum + Number(item.impressions || 0), 0);
    const totalClicks = (spendData || []).reduce((sum, item) => sum + Number(item.clicks || 0), 0);
    const totalLeads = leadsData?.length || 0;
    const costPerLead = totalLeads > 0 ? totalSpend / totalLeads : 0;
    const conversionRate = totalClicks > 0 ? (totalLeads / totalClicks) * 100 : 0;

    return {
      totalSpend,
      totalImpressions,
      totalClicks,
      totalLeads,
      costPerLead,
      conversionRate,
      insights: [],
      recommendations: []
    };
  },

  /**
   * Generate AI insights for Meta spend (placeholder - would use OpenAI)
   */
  async generateInsights(metrics: AnalyticsMetaSpendMetrics): Promise<{
    insights: string[];
    recommendations: string[];
  }> {
    // This would call OpenAI in a real implementation
    // For now, return rule-based insights
    const insights: string[] = [];
    const recommendations: string[] = [];

    if (metrics.costPerLead > 100) {
      insights.push('Cost per lead is higher than industry average');
      recommendations.push('Consider refining audience targeting to reduce cost per lead');
    }

    if (metrics.conversionRate < 2) {
      insights.push('Conversion rate is below optimal levels');
      recommendations.push('Review ad creative and landing page experience');
    }

    if (metrics.totalClicks > 0 && metrics.conversionRate > 5) {
      insights.push('Strong conversion performance detected');
      recommendations.push('Consider increasing budget to scale successful campaigns');
    }

    return { insights, recommendations };
  }
};
