import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LaunchResult {
  creativeId: string;
  platform: string;
  status: 'launched' | 'failed' | 'skipped';
  error?: string;
}

interface LaunchResponse {
  success: boolean;
  launched: number;
  failed: number;
  skipped: number;
  details: LaunchResult[];
  message: string;
  error?: string;
}

export function useRocketLaunch() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lastResult, setLastResult] = useState<LaunchResponse | null>(null);

  const launchMutation = useMutation({
    mutationFn: async (): Promise<LaunchResponse> => {
      const { data, error } = await supabase.functions.invoke('launch-social-beacons');

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Launch failed');

      return data as LaunchResponse;
    },
    onSuccess: (data) => {
      setLastResult(data);
      queryClient.invalidateQueries({ queryKey: ['ad-creatives'] });

      toast({
        title: '🚀 Launch Complete!',
        description: data.message,
        variant: data.failed > 0 ? 'destructive' : 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Launch Failed',
        description: error instanceof Error ? error.message : 'Failed to launch creatives',
        variant: 'destructive',
      });
    },
  });

  return {
    launchAll: launchMutation.mutate,
    isLaunching: launchMutation.isPending,
    lastResult,
  };
}
