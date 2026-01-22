/**
 * Tenstreet Notifications Hook
 * Tracks pending screenings, completed screenings, and active bulk operations
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';

interface TenstreetNotificationCounts {
  pendingScreenings: number;
  completedScreenings: number;
  failedScreenings: number;
  activeBulkOperations: number;
  totalNotifications: number;
}

export function useTenstreetNotifications() {
  const { data: counts, isLoading } = useQuery({
    queryKey: queryKeys.tenstreet.notifications(),
    queryFn: async () => {
      // Get screening counts
      const { data: screenings, error: screeningsError } = await supabase
        .from('tenstreet_xchange_requests')
        .select('status')
        .order('request_date', { ascending: false });

      if (screeningsError) throw screeningsError;

      // Get bulk operation counts
      const { data: bulkOps, error: bulkOpsError } = await supabase
        .from('tenstreet_bulk_operations')
        .select('status')
        .eq('status', 'in_progress');

      if (bulkOpsError) throw bulkOpsError;

      const pendingScreenings = screenings?.filter(
        s => s.status === 'pending' || s.status === 'in_progress'
      ).length || 0;

      const completedScreenings = screenings?.filter(
        s => s.status === 'completed'
      ).length || 0;

      const failedScreenings = screenings?.filter(
        s => s.status === 'failed'
      ).length || 0;

      const activeBulkOperations = bulkOps?.length || 0;

      const totalNotifications = pendingScreenings + failedScreenings + activeBulkOperations;

      return {
        pendingScreenings,
        completedScreenings,
        failedScreenings,
        activeBulkOperations,
        totalNotifications
      } as TenstreetNotificationCounts;
    },
    refetchInterval: 30000,
    refetchIntervalInBackground: true
  });

  return {
    counts: counts || {
      pendingScreenings: 0,
      completedScreenings: 0,
      failedScreenings: 0,
      activeBulkOperations: 0,
      totalNotifications: 0
    },
    isLoading
  };
}

export type { TenstreetNotificationCounts };
