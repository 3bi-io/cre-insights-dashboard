import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FeedSyncLog {
  id: string;
  client_id: string | null;
  client_name: string;
  feed_url: string | null;
  jobs_in_feed: number;
  jobs_inserted: number;
  jobs_updated: number;
  jobs_deactivated: number;
  jobs_with_feed_data: number;
  sync_duration_ms: number | null;
  error: string | null;
  sync_type: string;
  triggered_by: string | null;
  created_at: string;
}

export interface FeedSyncSummary {
  lastSync: FeedSyncLog | null;
  totalJobsUpdated: number;
  totalJobsInserted: number;
  recentSyncs: FeedSyncLog[];
  hasRecentError: boolean;
}

export function useFeedSyncStatus() {
  return useQuery({
    queryKey: ['feed-sync-status'],
    queryFn: async (): Promise<FeedSyncSummary> => {
      // Get the most recent sync logs
      const { data, error } = await supabase
        .from('feed_sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const logs = (data || []) as FeedSyncLog[];
      const lastSync = logs[0] || null;
      
      // Calculate totals from the most recent sync cycle (same created_at minute)
      const recentSyncs = logs.filter(log => {
        if (!lastSync) return false;
        const lastTime = new Date(lastSync.created_at).getTime();
        const logTime = new Date(log.created_at).getTime();
        return Math.abs(lastTime - logTime) < 60000; // Within 1 minute
      });

      const totalJobsUpdated = recentSyncs.reduce((sum, log) => sum + log.jobs_updated, 0);
      const totalJobsInserted = recentSyncs.reduce((sum, log) => sum + log.jobs_inserted, 0);
      const hasRecentError = recentSyncs.some(log => log.error !== null);

      return {
        lastSync,
        totalJobsUpdated,
        totalJobsInserted,
        recentSyncs,
        hasRecentError,
      };
    },
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  });
}

export function useTriggerFeedSync() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sync-cdl-feeds', {
        body: { syncType: 'manual' }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['feed-sync-status'] });
      queryClient.invalidateQueries({ queryKey: ['feed-data-coverage'] });
      
      toast({
        title: 'Feed Sync Complete',
        description: `Updated ${data?.totalUpdated || 0} jobs, inserted ${data?.totalInserted || 0} new jobs`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'Failed to sync feeds',
        variant: 'destructive',
      });
    },
  });
}

export function useFeedQualityAlerts() {
  return useQuery({
    queryKey: ['feed-quality-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feed_quality_alerts')
        .select('*')
        .eq('acknowledged', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('feed_quality_alerts')
        .update({
          acknowledged: true,
          acknowledged_by: user?.id,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-quality-alerts'] });
    },
  });
}
