/**
 * Hook for managing embed tokens
 * 
 * Provides CRUD operations for embed tokens used in the widget system.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EmbedToken {
  id: string;
  token: string;
  job_listing_id: string;
  organization_id: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  allowed_domains: string[] | null;
  impression_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
}

export interface CreateEmbedTokenParams {
  job_listing_id: string;
  organization_id: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  allowed_domains?: string[];
  expires_at?: string;
}

export interface UpdateEmbedTokenParams {
  id: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  allowed_domains?: string[];
  is_active?: boolean;
  expires_at?: string | null;
}

/**
 * Fetch embed tokens for a specific job listing
 */
export function useEmbedTokensForJob(jobListingId: string | undefined) {
  return useQuery({
    queryKey: ['embed-tokens', 'job', jobListingId],
    queryFn: async () => {
      if (!jobListingId) return [];
      
      // Use type assertion since embed_tokens table types may not be generated yet
      const { data, error } = await (supabase
        .from('embed_tokens' as any)
        .select('*')
        .eq('job_listing_id', jobListingId)
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      return (data || []) as EmbedToken[];
    },
    enabled: !!jobListingId,
  });
}

/**
 * Fetch all embed tokens for an organization
 */
export function useEmbedTokensForOrganization(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['embed-tokens', 'organization', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      // Use type assertion since embed_tokens table types may not be generated yet
      const { data, error } = await (supabase
        .from('embed_tokens' as any)
        .select(`
          *,
          job_listings (
            id,
            title,
            city,
            state
          )
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });
}

/**
 * Create a new embed token
 */
export function useCreateEmbedToken() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: CreateEmbedTokenParams) => {
      const insertData = {
        job_listing_id: params.job_listing_id,
        organization_id: params.organization_id,
        utm_source: params.utm_source || 'widget',
        utm_medium: params.utm_medium || 'embed',
        utm_campaign: params.utm_campaign || null,
        allowed_domains: params.allowed_domains || [],
        expires_at: params.expires_at || null,
      };
      
      // Use type assertion since embed_tokens table types may not be generated yet
      const { data, error } = await (supabase
        .from('embed_tokens' as any)
        .insert(insertData as any)
        .select()
        .single() as any);

      if (error) throw error;
      return data as EmbedToken;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['embed-tokens'] });
      toast({
        title: 'Embed token created',
        description: 'Your new embed widget code is ready to use.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create token',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update an existing embed token
 */
export function useUpdateEmbedToken() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: UpdateEmbedTokenParams) => {
      const { id, ...updates } = params;
      
      // Use type assertion since embed_tokens table types may not be generated yet
      const { data, error } = await (supabase
        .from('embed_tokens' as any)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single() as any);

      if (error) throw error;
      return data as EmbedToken;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['embed-tokens'] });
      toast({
        title: 'Token updated',
        description: 'Embed token settings have been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update token',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete an embed token
 */
export function useDeleteEmbedToken() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (tokenId: string) => {
      // Use type assertion since embed_tokens table types may not be generated yet
      const { error } = await (supabase
        .from('embed_tokens' as any)
        .delete()
        .eq('id', tokenId) as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['embed-tokens'] });
      toast({
        title: 'Token deleted',
        description: 'The embed token has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete token',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Toggle token active state
 */
export function useToggleEmbedTokenActive() {
  const updateToken = useUpdateEmbedToken();

  return {
    mutate: (token: EmbedToken) => {
      updateToken.mutate({
        id: token.id,
        is_active: !token.is_active,
      });
    },
    isPending: updateToken.isPending,
  };
}

/**
 * Generate the widget embed code for a token
 */
export function generateWidgetCode(token: string, containerId: string = 'apply-widget'): string {
  return `<!-- ATS.me Application Widget -->
<div id="${containerId}"></div>
<script 
  src="https://ats.me/widget.js" 
  data-token="${token}"
  data-container="${containerId}"
  async
></script>`;
}

/**
 * Generate the widget embed code with custom options
 */
export function generateWidgetCodeWithOptions(
  token: string, 
  options: {
    containerId?: string;
    minHeight?: number;
  } = {}
): string {
  const containerId = options.containerId || 'apply-widget';
  const minHeightAttr = options.minHeight ? `\n  data-min-height="${options.minHeight}"` : '';
  
  return `<!-- ATS.me Application Widget -->
<div id="${containerId}"></div>
<script 
  src="https://ats.me/widget.js" 
  data-token="${token}"
  data-container="${containerId}"${minHeightAttr}
  async
></script>`;
}
