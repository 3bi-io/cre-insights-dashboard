/**
 * Hook for outbound call analytics and metrics
 * Migrated from src/hooks/useOutboundCallAnalytics.ts
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, eachDayOfInterval, startOfDay, endOfDay } from 'date-fns';
import { OutboundCallStatus } from '@/features/elevenlabs/types/outboundCall';
import { queryKeys } from '@/lib/queryKeys';

export interface OutboundCallMetrics {
  totalCalls: number;
  completedCalls: number;
  failedCalls: number;
  inProgressCalls: number;
  queuedCalls: number;
  completionRate: number;
  failureRate: number;
  avgDurationSeconds: number;
  totalDurationSeconds: number;
  todayCalls: number;
}

export interface DailyCallVolume {
  date: string;
  calls: number;
  completed: number;
  failed: number;
}

export interface StatusDistribution {
  status: OutboundCallStatus;
  count: number;
  color: string;
}

const STATUS_COLORS: Record<OutboundCallStatus, string> = {
  queued: 'hsl(210, 100%, 50%)',
  initiating: 'hsl(200, 100%, 50%)',
  initiated: 'hsl(190, 100%, 50%)',
  ringing: 'hsl(45, 100%, 50%)',
  in_progress: 'hsl(280, 100%, 50%)',
  completed: 'hsl(142, 76%, 36%)',
  failed: 'hsl(0, 84%, 60%)',
  no_answer: 'hsl(30, 100%, 50%)',
  busy: 'hsl(15, 100%, 50%)',
  cancelled: 'hsl(0, 0%, 50%)',
};

interface UseOutboundCallAnalyticsOptions {
  organizationId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export function useOutboundCallAnalytics(options: UseOutboundCallAnalyticsOptions = {}) {
  const { organizationId, dateRange } = options;

  const defaultDateRange = {
    start: subDays(new Date(), 29),
    end: new Date(),
  };

  const effectiveDateRange = dateRange || defaultDateRange;

  return useQuery({
    queryKey: queryKeys.analytics.outboundCalls(organizationId || '', format(effectiveDateRange.start, 'yyyy-MM-dd'), format(effectiveDateRange.end, 'yyyy-MM-dd')),
    queryFn: async () => {
      let query = supabase
        .from('outbound_calls')
        .select('*')
        .gte('created_at', startOfDay(effectiveDateRange.start).toISOString())
        .lte('created_at', endOfDay(effectiveDateRange.end).toISOString())
        .order('created_at', { ascending: false });

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data: calls, error } = await query;

      if (error) throw error;

      const allCalls = calls || [];

      // Calculate metrics
      const totalCalls = allCalls.length;
      const completedCalls = allCalls.filter(c => c.status === 'completed').length;
      const failedCalls = allCalls.filter(c => 
        ['failed', 'no_answer', 'busy'].includes(c.status as string)
      ).length;
      const inProgressCalls = allCalls.filter(c => 
        ['in_progress', 'ringing', 'initiating', 'initiated'].includes(c.status as string)
      ).length;
      const queuedCalls = allCalls.filter(c => c.status === 'queued').length;

      const completedWithDuration = allCalls.filter(c => 
        c.status === 'completed' && c.duration_seconds != null
      );
      const totalDurationSeconds = completedWithDuration.reduce(
        (sum, c) => sum + (c.duration_seconds || 0), 0
      );
      const avgDurationSeconds = completedWithDuration.length > 0
        ? Math.floor(totalDurationSeconds / completedWithDuration.length)
        : 0;

      const today = format(new Date(), 'yyyy-MM-dd');
      const todayCalls = allCalls.filter(c => 
        format(new Date(c.created_at), 'yyyy-MM-dd') === today
      ).length;

      const metrics: OutboundCallMetrics = {
        totalCalls,
        completedCalls,
        failedCalls,
        inProgressCalls,
        queuedCalls,
        completionRate: totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0,
        failureRate: totalCalls > 0 ? Math.round((failedCalls / totalCalls) * 100) : 0,
        avgDurationSeconds,
        totalDurationSeconds,
        todayCalls,
      };

      // Generate daily volume data
      const days = eachDayOfInterval({
        start: effectiveDateRange.start,
        end: effectiveDateRange.end,
      });

      const dailyVolume: DailyCallVolume[] = days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayCalls = allCalls.filter(c =>
          format(new Date(c.created_at), 'yyyy-MM-dd') === dayStr
        );

        return {
          date: format(day, 'MMM dd'),
          calls: dayCalls.length,
          completed: dayCalls.filter(c => c.status === 'completed').length,
          failed: dayCalls.filter(c => 
            ['failed', 'no_answer', 'busy'].includes(c.status as string)
          ).length,
        };
      });

      // Calculate status distribution
      const statusCounts = allCalls.reduce((acc, call) => {
        const status = call.status as OutboundCallStatus;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<OutboundCallStatus, number>);

      const statusDistribution: StatusDistribution[] = Object.entries(statusCounts)
        .map(([status, count]) => ({
          status: status as OutboundCallStatus,
          count,
          color: STATUS_COLORS[status as OutboundCallStatus] || 'hsl(0, 0%, 50%)',
        }))
        .sort((a, b) => b.count - a.count);

      return {
        metrics,
        dailyVolume,
        statusDistribution,
        calls: allCalls,
      };
    },
    staleTime: 60 * 1000, // 1 minute
  });
}
