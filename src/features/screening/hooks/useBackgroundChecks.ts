import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BackgroundCheckService, InitiateCheckParams } from '../services/BackgroundCheckService';
import { toast } from 'sonner';

/**
 * Hook to fetch all BGC providers
 */
export function useBackgroundCheckProviders() {
  return useQuery({
    queryKey: ['bgc-providers'],
    queryFn: () => BackgroundCheckService.getProviders(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to fetch organization's BGC connections
 */
export function useBackgroundCheckConnections(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['bgc-connections', organizationId],
    queryFn: () => BackgroundCheckService.getConnections(organizationId!),
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to create a new BGC connection
 */
export function useCreateBGCConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      organizationId: string;
      providerId: string;
      credentials: Record<string, string>;
      options?: {
        isDefault?: boolean;
        packageMappings?: Record<string, string>;
        webhookSecret?: string;
      };
    }) => BackgroundCheckService.createConnection(
      params.organizationId,
      params.providerId,
      params.credentials,
      params.options
    ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bgc-connections', variables.organizationId] });
      toast.success('Background check provider connected');
    },
    onError: (error: Error) => {
      toast.error(`Failed to connect provider: ${error.message}`);
    },
  });
}

/**
 * Hook to update a BGC connection
 */
export function useUpdateBGCConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      connectionId: string;
      updates: {
        credentials?: Record<string, string>;
        isEnabled?: boolean;
        isDefault?: boolean;
        packageMappings?: Record<string, string>;
        webhookSecret?: string;
      };
    }) => BackgroundCheckService.updateConnection(params.connectionId, params.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bgc-connections'] });
      toast.success('Connection updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update connection: ${error.message}`);
    },
  });
}

/**
 * Hook to delete a BGC connection
 */
export function useDeleteBGCConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (connectionId: string) => BackgroundCheckService.deleteConnection(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bgc-connections'] });
      toast.success('Connection removed');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove connection: ${error.message}`);
    },
  });
}

/**
 * Hook to initiate a background check
 */
export function useInitiateBackgroundCheck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: InitiateCheckParams) => BackgroundCheckService.initiateCheck(params),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bgc-requests', variables.applicationId] });
      toast.success('Background check initiated');
      
      if (result.candidatePortalUrl) {
        toast.info('Candidate portal link generated', {
          description: 'The candidate will receive an email with next steps.',
        });
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to initiate background check: ${error.message}`);
    },
  });
}

/**
 * Hook to get background check requests for an application
 */
export function useApplicationBackgroundChecks(applicationId: string | undefined) {
  return useQuery({
    queryKey: ['bgc-requests', applicationId],
    queryFn: () => BackgroundCheckService.getRequestsByApplication(applicationId!),
    enabled: !!applicationId,
    refetchInterval: (query) => {
      // Auto-refresh if there are pending checks
      const data = query.state.data;
      if (data?.some(r => ['pending', 'processing', 'waiting_on_candidate'].includes(r.status))) {
        return 30000; // 30 seconds
      }
      return false;
    },
  });
}

/**
 * Hook to get background check requests for an organization
 */
export function useOrganizationBackgroundChecks(
  organizationId: string | undefined,
  options?: { status?: string; limit?: number }
) {
  return useQuery({
    queryKey: ['bgc-requests', 'org', organizationId, options],
    queryFn: () => BackgroundCheckService.getRequestsByOrganization(organizationId!, options),
    enabled: !!organizationId,
  });
}

/**
 * Hook to test a BGC connection
 */
export function useTestBGCConnection() {
  return useMutation({
    mutationFn: (connectionId: string) => BackgroundCheckService.testConnection(connectionId),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    },
    onError: (error: Error) => {
      toast.error(`Connection test failed: ${error.message}`);
    },
  });
}

/**
 * Hook to get a single background check status
 */
export function useBackgroundCheckStatus(requestId: string | undefined) {
  return useQuery({
    queryKey: ['bgc-request', requestId],
    queryFn: () => BackgroundCheckService.getCheckStatus(requestId!),
    enabled: !!requestId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status && ['pending', 'processing', 'waiting_on_candidate'].includes(status)) {
        return 30000; // 30 seconds
      }
      return false;
    },
  });
}
