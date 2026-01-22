/**
 * Tenstreet Configuration Hook
 * Manages Tenstreet API credentials and field mappings
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface TenstreetConfig {
  clientId: string;
  password: string;
  service: string;
  mode: string;
  source: string;
  companyId: string;
  companyName: string;
  driverId: string;
  jobId: string;
  statusTag: string;
  appReferrer: string;
}

interface FieldMappings {
  personalData: any;
  customQuestions: any[];
  displayFields: any[];
}

export const useTenstreetConfiguration = () => {
  const { organization, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch credentials
  const { data: credentials, isLoading: credentialsLoading } = useQuery({
    queryKey: ['tenstreet-credentials', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;

      const { data, error } = await supabase
        .from('tenstreet_credentials')
        .select('*')
        .eq('organization_id', organization.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  // Fetch field mappings
  const { data: fieldMappings, isLoading: mappingsLoading } = useQuery({
    queryKey: ['tenstreet-field-mappings', organization?.id, user?.id],
    queryFn: async () => {
      if (!organization?.id || !user?.id) return null;

      const { data, error } = await supabase
        .from('tenstreet_field_mappings')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('is_default', true)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!organization?.id && !!user?.id,
  });

  // Save credentials mutation
  const saveCredentialsMutation = useMutation({
    mutationFn: async (config: TenstreetConfig) => {
      if (!organization?.id) throw new Error('No organization');

      const credentialData = {
        organization_id: organization.id,
        account_name: config.companyName,
        client_id: config.clientId,
        password: config.password,
        service: config.service,
        mode: config.mode,
        source: config.source,
        company_ids: [config.companyId],
        company_name: config.companyName,
        app_referrer: config.appReferrer,
        status: 'active',
      };

      if (credentials?.id) {
        const { error } = await supabase
          .from('tenstreet_credentials')
          .update(credentialData)
          .eq('id', credentials.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tenstreet_credentials')
          .insert(credentialData);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenstreet-credentials'] });
      toast({
        title: 'Success',
        description: 'Tenstreet credentials saved successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save credentials',
        variant: 'destructive',
      });
    },
  });

  // Save field mappings mutation
  const saveFieldMappingsMutation = useMutation({
    mutationFn: async (mappings: FieldMappings) => {
      if (!organization?.id || !user?.id) throw new Error('No organization or user');

      const mappingData = {
        organization_id: organization.id,
        user_id: user.id,
        mapping_name: 'Default Configuration',
        is_default: true,
        field_mappings: mappings as any,
      };

      if (fieldMappings?.id) {
        const { error } = await supabase
          .from('tenstreet_field_mappings')
          .update(mappingData)
          .eq('id', fieldMappings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tenstreet_field_mappings')
          .insert(mappingData);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenstreet-field-mappings'] });
      toast({
        title: 'Success',
        description: 'Field mappings saved successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save field mappings',
        variant: 'destructive',
      });
    },
  });

  return {
    credentials,
    fieldMappings,
    isLoading: credentialsLoading || mappingsLoading,
    saveCredentials: saveCredentialsMutation.mutate,
    saveFieldMappings: saveFieldMappingsMutation.mutate,
    isSaving: saveCredentialsMutation.isPending || saveFieldMappingsMutation.isPending,
  };
};

export type { TenstreetConfig, FieldMappings };
