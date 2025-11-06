import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignsService } from '../services/campaignsService';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type CampaignInsert = Database['public']['Tables']['campaigns']['Insert'];
type CampaignUpdate = Database['public']['Tables']['campaigns']['Update'];

export const useCampaigns = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all campaigns
  const campaignsQuery = useQuery({
    queryKey: ['campaigns'],
    queryFn: campaignsService.fetchCampaigns,
  });

  // Fetch campaign stats
  const statsQuery = useQuery({
    queryKey: ['campaigns', 'stats'],
    queryFn: campaignsService.fetchCampaignStats,
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: (campaign: Omit<CampaignInsert, 'user_id'>) => campaignsService.createCampaign(campaign),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({
        title: 'Campaign Created',
        description: 'Your campaign has been created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create campaign.',
        variant: 'destructive',
      });
    },
  });

  // Update campaign mutation
  const updateCampaignMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: CampaignUpdate }) =>
      campaignsService.updateCampaign(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({
        title: 'Campaign Updated',
        description: 'Your campaign has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update campaign.',
        variant: 'destructive',
      });
    },
  });

  // Delete campaign mutation
  const deleteCampaignMutation = useMutation({
    mutationFn: (id: string) => campaignsService.deleteCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({
        title: 'Campaign Deleted',
        description: 'Your campaign has been deleted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete campaign.',
        variant: 'destructive',
      });
    },
  });

  return {
    campaigns: campaignsQuery.data || [],
    stats: statsQuery.data,
    isLoading: campaignsQuery.isLoading || statsQuery.isLoading,
    isError: campaignsQuery.isError || statsQuery.isError,
    error: campaignsQuery.error || statsQuery.error,
    createCampaign: createCampaignMutation.mutate,
    updateCampaign: updateCampaignMutation.mutate,
    deleteCampaign: deleteCampaignMutation.mutate,
    isCreating: createCampaignMutation.isPending,
    isUpdating: updateCampaignMutation.isPending,
    isDeleting: deleteCampaignMutation.isPending,
  };
};
