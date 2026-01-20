import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import { queryKeys } from '@/lib/queryKeys';

interface CostPerLeadData {
  totalSpend: number;
  totalLeads: number;
  costPerLead: number;
  metaSpend: number;
  metaLeads: number;
  metaCostPerLead: number;
}

export const useCostPerLead = (dateRange?: string) => {
  const { organization } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.analytics.costPerLead(dateRange, organization?.id),
    queryFn: async () => {
      // Calculate date filter if provided
      let dateFilter = '';
      if (dateRange) {
        const today = new Date();
        let startDate: string;
        
        switch (dateRange) {
          case 'last_7d':
            startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            break;
          case 'last_14d':
            startDate = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            break;
          case 'last_60d':
            startDate = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            break;
          case 'last_90d':
            startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            break;
          case 'this_month':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
            break;
          case 'last_month':
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            startDate = lastMonth.toISOString().split('T')[0];
            break;
          default: // last_30d
            startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        }
        dateFilter = startDate;
      }

      // Get Meta data for current organization
      let metaQuery = supabase
        .from('meta_daily_spend')
        .select('spend, impressions, clicks');
        
      if (organization?.id) {
        metaQuery = metaQuery.eq('organization_id', organization.id);
      }
      
      if (dateFilter) {
        metaQuery = metaQuery.gte('date_start', dateFilter);
      }

      const { data: metaData, error: metaError } = await metaQuery;
      if (metaError) throw metaError;

      // Get Meta applications for current organization
      let metaAppsQuery = supabase
        .from('applications')
        .select('id, source, applied_at, job_listings!inner(organization_id)')
        .or('source.eq.fb,source.eq.ig,source.eq.meta,source.eq.facebook,source.eq.instagram');
        
      if (organization?.id) {
        metaAppsQuery = metaAppsQuery.eq('job_listings.organization_id', organization.id);
      }
      
      if (dateFilter) {
        metaAppsQuery = metaAppsQuery.gte('applied_at', dateFilter);
      }

      const { data: metaApplicationsData, error: metaAppsError } = await metaAppsQuery;
      if (metaAppsError) throw metaAppsError;

      // Get all applications for total calculation (organization-scoped)
      let allAppsQuery = supabase
        .from('applications')
        .select('id, applied_at, job_listings!inner(organization_id)');
        
      if (organization?.id) {
        allAppsQuery = allAppsQuery.eq('job_listings.organization_id', organization.id);
      }
      if (dateFilter) {
        allAppsQuery = allAppsQuery.gte('applied_at', dateFilter);
      }

      const { data: allApplicationsData, error: allAppsError } = await allAppsQuery;
      if (allAppsError) throw allAppsError;

      // Get total spend from all platforms (organization-scoped)
      let allSpendQuery = supabase
        .from('daily_spend')
        .select('amount, date, job_listings!inner(organization_id)');
        
      if (organization?.id) {
        allSpendQuery = allSpendQuery.eq('job_listings.organization_id', organization.id);
      }
      
      if (dateFilter) {
        allSpendQuery = allSpendQuery.gte('date', dateFilter);
      }

      const { data: allSpendData, error: allSpendError } = await allSpendQuery;
      if (allSpendError) throw allSpendError;

      // Calculate Meta metrics using established logic from Platform Performance
      const metaSpend = metaData?.reduce((sum, record) => sum + Number(record.spend || 0), 0) || 0;
      const metaLeads = metaApplicationsData?.length || 0;
      const metaCostPerLead = metaLeads > 0 ? metaSpend / metaLeads : 0;

      // Calculate total metrics
      const totalSpendFromDaily = allSpendData?.reduce((sum, record) => sum + Number(record.amount || 0), 0) || 0;
      const totalSpend = metaSpend + totalSpendFromDaily; // Combine Meta and other platform spend
      const totalLeads = allApplicationsData?.length || 0;
      const costPerLead = totalLeads > 0 ? totalSpend / totalLeads : 0;

      const result: CostPerLeadData = {
        totalSpend,
        totalLeads,
        costPerLead,
        metaSpend,
        metaLeads,
        metaCostPerLead
      };

      logger.debug('Cost per lead calculation', { result });
      return result;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!organization?.id, // Only run when organization is available
  });
};