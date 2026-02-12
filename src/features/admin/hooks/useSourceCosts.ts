import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SourceCostConfig {
  id: string;
  organization_id: string;
  source: string;
  monthly_cost: number;
  cost_per_click: number;
  period_start: string;
  period_end: string;
  created_at: string;
  updated_at: string;
}

interface SourceROIMetrics {
  source: string;
  monthlyCost: number;
  totalApplications: number;
  qualifiedApplications: number;
  costPerApplication: number;
  costPerQualifiedApplication: number;
}

/**
 * Hook for source cost configuration CRUD and ROI metrics
 */
export const useSourceCosts = (organizationId?: string) => {
  const queryClient = useQueryClient();

  const costsQuery = useQuery({
    queryKey: ['source-costs', organizationId],
    queryFn: async () => {
      const query = supabase
        .from('source_cost_config')
        .select('*')
        .order('period_start', { ascending: false });

      if (organizationId) {
        query.eq('organization_id', organizationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as SourceCostConfig[];
    },
    enabled: true,
  });

  const upsertCost = useMutation({
    mutationFn: async (config: Omit<SourceCostConfig, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('source_cost_config')
        .upsert(config as any, { onConflict: 'id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['source-costs'] });
      toast.success('Source cost updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update cost: ${error.message}`);
    },
  });

  const deleteCost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('source_cost_config')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['source-costs'] });
      toast.success('Source cost removed');
    },
  });

  return {
    costs: costsQuery.data || [],
    isLoading: costsQuery.isLoading,
    error: costsQuery.error,
    upsertCost,
    deleteCost,
  };
};
