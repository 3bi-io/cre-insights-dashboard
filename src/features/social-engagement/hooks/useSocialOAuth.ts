import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { SocialPlatform } from './useSocialConnections';

interface UseOAuthOptions {
  organizationId?: string;
}

export function useSocialOAuth({ organizationId }: UseOAuthOptions = {}) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState<SocialPlatform | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle OAuth callback results from URL
  useEffect(() => {
    const connected = searchParams.get('connected');
    const oauthError = searchParams.get('error');
    const pages = searchParams.get('pages');

    if (connected) {
      toast({
        title: `${connected.charAt(0).toUpperCase() + connected.slice(1)} connected!`,
        description: pages 
          ? `Successfully connected. ${pages} pages/accounts available.`
          : 'Your account has been successfully connected.',
      });
      queryClient.invalidateQueries({ queryKey: ['social-connections'] });
      
      // Clean up URL params
      searchParams.delete('connected');
      searchParams.delete('pages');
      setSearchParams(searchParams, { replace: true });
    }

    if (oauthError) {
      const errorMessages: Record<string, string> = {
        'missing_params': 'OAuth callback missing required parameters.',
        'invalid_state': 'Invalid OAuth state. Please try again.',
        'state_expired': 'OAuth session expired. Please try again.',
        'token_exchange_failed': 'Failed to exchange authorization code for token.',
        'save_failed': 'Failed to save connection. Please try again.',
        'no_pages_found': 'No pages or accounts found. Make sure you have a business account.',
        'callback_error': 'An error occurred during OAuth callback.',
      };

      toast({
        title: 'Connection failed',
        description: errorMessages[oauthError] || oauthError,
        variant: 'destructive',
      });

      // Clean up URL params
      searchParams.delete('error');
      searchParams.delete('error_description');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, toast, queryClient]);

  const initiateOAuth = useCallback(async (platform: SocialPlatform) => {
    if (!organizationId) {
      setError('No organization selected');
      return;
    }

    setIsConnecting(true);
    setConnectingPlatform(platform);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('social-oauth-init', {
        body: {
          platform,
          organizationId,
        },
      });

      if (fnError) throw fnError;

      if (data?.authUrl) {
        // Redirect to OAuth provider
        window.location.href = data.authUrl;
      } else {
        throw new Error('No authorization URL returned');
      }
    } catch (err) {
      console.error('OAuth init error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initiate OAuth');
      toast({
        title: 'Connection failed',
        description: err instanceof Error ? err.message : 'Failed to initiate OAuth',
        variant: 'destructive',
      });
      setIsConnecting(false);
      setConnectingPlatform(null);
    }
  }, [organizationId, toast]);

  const disconnectPlatform = useCallback(async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('social_platform_connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;

      toast({
        title: 'Disconnected',
        description: 'The social media account has been disconnected.',
      });
      
      queryClient.invalidateQueries({ queryKey: ['social-connections'] });
    } catch (err) {
      console.error('Disconnect error:', err);
      toast({
        title: 'Failed to disconnect',
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  }, [toast, queryClient]);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    initiateOAuth,
    disconnectPlatform,
    isConnecting,
    connectingPlatform,
    error,
    resetError,
  };
}
