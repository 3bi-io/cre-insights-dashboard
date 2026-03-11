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

      // Check if a row already exists
      let existingQuery = supabase
        .from('organization_call_settings' as any)
        .select('id')
        .eq('organization_id', organizationId);

      if (effectiveClientId) {
        existingQuery = existingQuery.eq('client_id', effectiveClientId);
      } else {
        existingQuery = existingQuery.is('client_id', null);
      }

      const { data: existingRows, error: fetchError } = await existingQuery;
      if (fetchError) throw fetchError;

      const payload: any = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      if (existingRows && existingRows.length > 0) {
        // Update existing row by id, return saved data
        const { data: savedRow, error } = await supabase
          .from('organization_call_settings' as any)
          .update(payload as any)
          .eq('id', (existingRows[0] as any).id)
          .select()
          .maybeSingle();
        if (error) throw error;
        return savedRow as unknown as CallScheduleSettings;
      } else {
        // Insert new row
        const insertPayload: any = {
          organization_id: organizationId,
          client_id: effectiveClientId,
          ...payload,
        };

        const { data: savedRow, error } = await supabase
          .from('organization_call_settings' as any)
          .insert(insertPayload as any)
          .select()
          .maybeSingle();
        if (error) {
          // If insert fails (race condition / duplicate), fall back to update
          let fallbackQuery = supabase
            .from('organization_call_settings' as any)
            .update(payload as any)
            .eq('organization_id', organizationId);
          
          if (effectiveClientId) {
            fallbackQuery = fallbackQuery.eq('client_id', effectiveClientId);
          } else {
            fallbackQuery = fallbackQuery.is('client_id', null);
          }
          
          const { data: fallbackRow, error: fallbackError } = await fallbackQuery.select().maybeSingle();
          if (fallbackError) throw fallbackError;
          return fallbackRow as unknown as CallScheduleSettings;
        }
        return savedRow as unknown as CallScheduleSettings;
      }
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
