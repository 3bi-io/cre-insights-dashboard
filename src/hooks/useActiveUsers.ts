import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ActiveUsersData {
  count: number;
  sessions: {
    session_id: string;
    visitor_id: string;
    device_type: string;
    page_count: number;
    last_activity: string;
  }[];
  lastUpdated: Date;
}

/**
 * Hook to track active users in real-time
 * Polls every 30 seconds and considers users active if they had activity in the last 5 minutes
 */
export const useActiveUsers = (pollInterval = 30000) => {
  const [data, setData] = useState<ActiveUsersData>({
    count: 0,
    sessions: [],
    lastUpdated: new Date(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchActiveUsers = useCallback(async () => {
    try {
      // Active = session ended_at within last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data: sessions, error: sessionsError } = await supabase
        .from('visitor_sessions')
        .select('session_id, visitor_id, device_type, page_count, ended_at')
        .gte('ended_at', fiveMinutesAgo)
        .order('ended_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      const activeSessions = (sessions || []).map(s => ({
        session_id: s.session_id,
        visitor_id: s.visitor_id,
        device_type: s.device_type || 'unknown',
        page_count: s.page_count || 1,
        last_activity: s.ended_at,
      }));

      setData({
        count: activeSessions.length,
        sessions: activeSessions,
        lastUpdated: new Date(),
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching active users:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch active users'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchActiveUsers();

    // Set up polling interval
    const intervalId = setInterval(fetchActiveUsers, pollInterval);

    // Set up real-time subscription for instant updates on new page views
    const channel = supabase
      .channel('active-users-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'visitor_sessions',
        },
        () => {
          // Refresh data when any session changes
          fetchActiveUsers();
        }
      )
      .subscribe();

    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(channel);
    };
  }, [fetchActiveUsers, pollInterval]);

  return {
    ...data,
    isLoading,
    error,
    refresh: fetchActiveUsers,
  };
};
