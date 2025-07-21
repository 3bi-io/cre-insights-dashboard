import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const CR_ENGLAND_ACCOUNT_ID = '435031743763874';

interface CostPerLeadData {
  totalSpend: number;
  totalLeads: number;
  costPerLead: number;
  metaSpend: number;
  metaLeads: number;
  metaCostPerLead: number;
}

export const useCostPerLead = (dateRange?: string) => {
  return useQuery({
    queryKey: ['cost-per-lead', dateRange],
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

      // Get Meta data for CR England account specifically
      let metaQuery = supabase
        .from('meta_daily_spend')
        .select('spend, impressions, clicks')
        .eq('account_id', CR_ENGLAND_ACCOUNT_ID);
      
      if (dateFilter) {
        metaQuery = metaQuery.gte('date_start', dateFilter);
      }

      const { data: metaData, error: metaError } = await metaQuery;
      if (metaError) throw metaError;

      // Get Meta applications
      let metaAppsQuery = supabase
        .from('applications')
        .select('id, source, applied_at')
        .or('source.eq.fb,source.eq.ig,source.eq.meta,source.eq.facebook,source.eq.instagram');
      
      if (dateFilter) {
        metaAppsQuery = metaAppsQuery.gte('applied_at', dateFilter);
      }

      const { data: metaApplicationsData, error: metaAppsError } = await metaAppsQuery;
      if (metaAppsError) throw metaAppsError;

      // Get all applications for total calculation
      let allAppsQuery = supabase.from('applications').select('id, applied_at');
      if (dateFilter) {
        allAppsQuery = allAppsQuery.gte('applied_at', dateFilter);
      }

      const { data: allApplicationsData, error: allAppsError } = await allAppsQuery;
      if (allAppsError) throw allAppsError;

      // Get total spend from all platforms
      let allSpendQuery = supabase
        .from('daily_spend')
        .select('amount, date');
      
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

      console.log('Cost per lead calculation:', result);
      return result;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};