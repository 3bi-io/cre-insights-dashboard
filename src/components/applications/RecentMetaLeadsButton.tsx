import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const RecentMetaLeadsButton: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  const syncRecentLeadsMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('meta-integration', {
        body: {
          action: 'sync_leads',
          organizationId: organization?.id,
          sinceDays: 7, // Last 7 days only for recent leads
        },
      });
      if (error) throw error;
      return data as { inserted?: number; skipped?: number; errors?: number; message?: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast({
        title: 'Recent Meta leads synced',
        description: data?.message || `New leads: ${data?.inserted ?? 0}, Duplicates skipped: ${data?.skipped ?? 0}`,
      });
    },
    onError: (err: any) => {
      toast({
        title: 'Sync failed',
        description: err?.message || 'Unable to sync recent Meta leads',
        variant: 'destructive',
      });
    },
  });

  return (
    <Button
      variant="outline"
      onClick={() => syncRecentLeadsMutation.mutate()}
      disabled={syncRecentLeadsMutation.isPending}
      className="flex items-center gap-2"
    >
      {syncRecentLeadsMutation.isPending ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      {syncRecentLeadsMutation.isPending ? 'Syncing Recent Leads...' : 'Sync Recent Meta Leads'}
    </Button>
  );
};

export default RecentMetaLeadsButton;