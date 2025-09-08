import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface OrganizationFeature {
  id: string;
  organization_id: string;
  feature_name: string;
  enabled: boolean;
  settings: any;
  created_at: string;
  updated_at: string;
}

interface FeatureUpdate {
  [featureName: string]: {
    enabled: boolean;
    settings?: any;
  };
}

export const useOrganizationFeaturesAdmin = (organizationId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const featuresQuery = useQuery({
    queryKey: ['organization-features-admin', organizationId],
    queryFn: async (): Promise<OrganizationFeature[]> => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from('organization_features')
        .select('*')
        .eq('organization_id', organizationId)
        .order('feature_name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  const updateFeaturesMutation = useMutation({
    mutationFn: async ({ orgId, features }: { orgId: string; features: FeatureUpdate }) => {
      const { error } = await supabase.rpc('update_organization_features', {
        _org_id: orgId,
        _features: features,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-features-admin'] });
      queryClient.invalidateQueries({ queryKey: ['organization-features'] });
      toast({
        title: 'Features Updated',
        description: 'Organization features have been successfully updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update features',
        variant: 'destructive',
      });
    },
  });

  // Available features with descriptions
  const availableFeatures = [
    {
      name: 'meta_integration',
      label: 'Meta Integration',
      description: 'Enable Meta/Facebook advertising integration for job postings',
      category: 'Advertising',
    },
    {
      name: 'openai_access',
      label: 'OpenAI Access',
      description: 'Access to OpenAI GPT models for AI-powered features',
      category: 'AI',
    },
    {
      name: 'anthropic_access',
      label: 'Anthropic Access',
      description: 'Access to Anthropic Claude models for AI-powered features',
      category: 'AI',
    },
    {
      name: 'tenstreet_access',
      label: 'Tenstreet Integration',
      description: 'Integration with Tenstreet ATS for application management',
      category: 'Integration',
    },
    {
      name: 'voice_agent',
      label: 'Voice Agent',
      description: 'AI voice agent for applicant screening and communication',
      category: 'AI',
    },
    {
      name: 'advanced_analytics',
      label: 'Advanced Analytics',
      description: 'Advanced reporting and analytics features',
      category: 'Analytics',
    },
  ];

  return {
    features: featuresQuery.data || [],
    availableFeatures,
    isLoading: featuresQuery.isLoading,
    error: featuresQuery.error,
    updateFeatures: updateFeaturesMutation.mutate,
    isUpdating: updateFeaturesMutation.isPending,
  };
};