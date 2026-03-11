import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface CallScheduleSettings {
  id: string;
  organization_id: string;
  client_id: string | null;
  business_hours_start: string;
  business_hours_end: string;
  business_hours_timezone: string;
  business_days: number[];
  auto_follow_up_enabled: boolean;
  max_attempts: number;
  follow_up_delay_hours: number;
}

const DEFAULTS: Omit<CallScheduleSettings, 'id' | 'organization_id' | 'client_id'> = {
  business_hours_start: '09:00:00',
  business_hours_end: '16:30:00',
  business_hours_timezone: 'America/Chicago',
  business_days: [1, 2, 3, 4, 5],
  auto_follow_up_enabled: false,
  max_attempts: 3,
  follow_up_delay_hours: 24,
};

export function useCallScheduleSettings(clientId?: string | null) {
  const { organization } = useAuth();
  const organizationId = organization?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const effectiveClientId = clientId || null;
  const queryKey = ['call-schedule-settings', organizationId, effectiveClientId];

  const { data: settings, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!organizationId) return null;

      let query = supabase
        .from('organization_call_settings' as any)
        .select('*')
        .eq('organization_id', organizationId);

      if (effectiveClientId) {
        query = query.eq('client_id', effectiveClientId);
      } else {
        query = query.is('client_id', null);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      return data
        ? (data as unknown as CallScheduleSettings)
        : { ...DEFAULTS, organization_id: organizationId, client_id: effectiveClientId } as CallScheduleSettings;
    },
    enabled: !!organizationId,
  });

  // Fetch list of client IDs that have custom overrides
  const { data: clientOverrides } = useQuery({
    queryKey: ['call-schedule-client-overrides', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('organization_call_settings' as any)
        .select('client_id')
        .eq('organization_id', organizationId)
        .not('client_id', 'is', null);

      if (error) throw error;
      return ((data as any[]) || []).map((r: any) => r.client_id as string);
    },
    enabled: !!organizationId,
  });

  const { mutate: updateSettings, isPending: isUpdating } = useMutation({
    mutationFn: async (updates: Partial<Omit<CallScheduleSettings, 'id' | 'organization_id' | 'client_id'>>) => {
      if (!organizationId) throw new Error('No organization');

      const { data, error } = await supabase.rpc('upsert_call_schedule_settings', {
        p_organization_id: organizationId,
        p_client_id: effectiveClientId,
        p_business_hours_start: updates.business_hours_start ?? null,
        p_business_hours_end: updates.business_hours_end ?? null,
        p_business_hours_timezone: updates.business_hours_timezone ?? null,
        p_business_days: updates.business_days ?? null,
        p_auto_follow_up_enabled: updates.auto_follow_up_enabled ?? null,
        p_max_attempts: updates.max_attempts ?? null,
        p_follow_up_delay_hours: updates.follow_up_delay_hours ?? null,
      });

      if (error) throw error;
      if (!data) throw new Error('Update failed — settings were not saved');
      return data as unknown as CallScheduleSettings;
    },
    onMutate: async (updates) => {
      // Cancel in-flight fetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey });

      const previousSettings = queryClient.getQueryData(queryKey);

      // Optimistically update the cache with the new values
      queryClient.setQueryData(queryKey, (old: any) => ({
        ...(old || { ...DEFAULTS, organization_id: organizationId, client_id: effectiveClientId }),
        ...updates,
      }));

      return { previousSettings };
    },
    onSuccess: (savedRow) => {
      // Confirm cache with server-returned data
      if (savedRow) {
        queryClient.setQueryData(queryKey, savedRow);
      }
      toast({ title: 'Schedule settings saved' });
    },
    onError: (error: Error, _variables, context) => {
      // Rollback to previous state
      if (context?.previousSettings) {
        queryClient.setQueryData(queryKey, context.previousSettings);
      }
      toast({ title: 'Failed to save settings', description: error.message, variant: 'destructive' });
    },
    onSettled: () => {
      // Always refetch for eventual consistency
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['call-schedule-client-overrides', organizationId] });
    },
  });

  return {
    settings: settings ?? { ...DEFAULTS, client_id: effectiveClientId } as CallScheduleSettings,
    isLoading,
    updateSettings,
    isUpdating,
    clientOverrides: clientOverrides || [],
  };
}
