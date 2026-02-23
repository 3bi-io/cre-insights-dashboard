import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface CallScheduleSettings {
  id: string;
  organization_id: string;
  business_hours_start: string;
  business_hours_end: string;
  business_hours_timezone: string;
  business_days: number[];
  auto_follow_up_enabled: boolean;
  max_attempts: number;
  follow_up_delay_hours: number;
}

const DEFAULTS: Omit<CallScheduleSettings, 'id' | 'organization_id'> = {
  business_hours_start: '09:00:00',
  business_hours_end: '16:30:00',
  business_hours_timezone: 'America/Chicago',
  business_days: [1, 2, 3, 4, 5],
  auto_follow_up_enabled: false,
  max_attempts: 3,
  follow_up_delay_hours: 24,
};

export function useCallScheduleSettings() {
  const { organization } = useAuth();
  const organizationId = organization?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['call-schedule-settings', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      const { data, error } = await supabase
        .from('organization_call_settings' as any)
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (error) throw error;
      return data ? (data as unknown as CallScheduleSettings) : { ...DEFAULTS, organization_id: organizationId } as CallScheduleSettings;
    },
    enabled: !!organizationId,
  });

  const { mutate: updateSettings, isPending: isUpdating } = useMutation({
    mutationFn: async (updates: Partial<Omit<CallScheduleSettings, 'id' | 'organization_id'>>) => {
      if (!organizationId) throw new Error('No organization');
      const { error } = await supabase
        .from('organization_call_settings' as any)
        .upsert({
          organization_id: organizationId,
          ...updates,
          updated_at: new Date().toISOString(),
        } as any, { onConflict: 'organization_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-schedule-settings', organizationId] });
      toast({ title: 'Schedule settings saved' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to save settings', description: error.message, variant: 'destructive' });
    },
  });

  return { settings: settings ?? DEFAULTS as CallScheduleSettings, isLoading, updateSettings, isUpdating };
}
