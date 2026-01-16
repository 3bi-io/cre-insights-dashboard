import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { logger } from '@/lib/logger';
import type { Json } from '@/integrations/supabase/types';

export interface CandidateActivity {
  id: string;
  application_id: string;
  organization_id: string;
  user_id: string | null;
  activity_type: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

async function fetchApplicationActivities(applicationId: string): Promise<CandidateActivity[]> {
  const { data, error } = await supabase
    .from('candidate_activities')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching application activities', error, { applicationId, context: 'ApplicationActivities' });
    throw error;
  }

  return (data || []) as CandidateActivity[];
}

export function useApplicationActivities(applicationId: string | undefined) {
  const query = useQuery({
    queryKey: queryKeys.activities.application(applicationId || ''),
    queryFn: () => fetchApplicationActivities(applicationId!),
    enabled: !!applicationId,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  return {
    activities: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to manually log an activity for an application
 */
export function useLogActivity() {
  const logActivity = async (params: {
    applicationId: string;
    organizationId: string;
    activityType: string;
    title: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }) => {
    const { data: userData } = await supabase.auth.getUser();
    
    const { error } = await supabase.from('candidate_activities').insert([{
      application_id: params.applicationId,
      organization_id: params.organizationId,
      user_id: userData?.user?.id || null,
      activity_type: params.activityType,
      title: params.title,
      description: params.description || null,
      metadata: (params.metadata || {}) as Json,
    }]);

    if (error) {
      logger.error('Error logging activity', error, { params, context: 'ApplicationActivities' });
      throw error;
    }
  };

  return { logActivity };
}
