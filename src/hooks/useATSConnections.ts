import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  atsConnectionsService, 
  type ATSConnection, 
  type ATSSystem,
  type CreateATSConnectionData,
  type UpdateATSConnectionData,
  type EffectiveConnection
} from '@/services/atsConnectionsService';
import { toast } from 'sonner';

const QUERY_KEYS = {
  atsSystems: ['ats-systems'] as const,
  allConnections: (orgId: string) => ['ats-connections', orgId] as const,
  orgConnections: (orgId: string) => ['ats-connections', orgId, 'org'] as const,
  clientConnections: (orgId: string, clientId?: string) => 
    ['ats-connections', orgId, 'client', clientId] as const,
  effectiveConnections: (orgId: string, clientId: string) => 
    ['ats-connections', orgId, 'effective', clientId] as const,
};

/**
 * Fetch all active ATS systems
 */
export function useATSSystems() {
  return useQuery<ATSSystem[]>({
    queryKey: QUERY_KEYS.atsSystems,
    queryFn: () => atsConnectionsService.getATSSystems(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Fetch all connections for an organization
 */
export function useAllATSConnections(organizationId: string | null | undefined) {
  return useQuery<ATSConnection[]>({
    queryKey: QUERY_KEYS.allConnections(organizationId || ''),
    queryFn: () => atsConnectionsService.getAllConnections(organizationId!),
    enabled: !!organizationId,
  });
}

/**
 * Fetch organization-level connections only
 */
export function useOrganizationATSConnections(organizationId: string | null | undefined) {
  return useQuery<ATSConnection[]>({
    queryKey: QUERY_KEYS.orgConnections(organizationId || ''),
    queryFn: () => atsConnectionsService.getOrganizationConnections(organizationId!),
    enabled: !!organizationId,
  });
}

/**
 * Fetch client-level connections
 */
export function useClientATSConnections(
  organizationId: string | null | undefined, 
  clientId?: string
) {
  return useQuery<ATSConnection[]>({
    queryKey: QUERY_KEYS.clientConnections(organizationId || '', clientId),
    queryFn: () => atsConnectionsService.getClientConnections(organizationId!, clientId),
    enabled: !!organizationId,
  });
}

/**
 * Fetch effective connections for a specific client
 */
export function useEffectiveATSConnections(
  organizationId: string | null | undefined,
  clientId: string | null | undefined
) {
  return useQuery<EffectiveConnection[]>({
    queryKey: QUERY_KEYS.effectiveConnections(organizationId || '', clientId || ''),
    queryFn: () => atsConnectionsService.getEffectiveConnections(organizationId!, clientId!),
    enabled: !!organizationId && !!clientId,
  });
}

/**
 * Create a new ATS connection
 */
export function useCreateATSConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateATSConnectionData) => 
      atsConnectionsService.createConnection(data),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: ['ats-connections', variables.organization_id] 
      });
      toast.success('ATS connection created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create connection: ${error.message}`);
    },
  });
}

/**
 * Update an existing ATS connection
 */
export function useUpdateATSConnection(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ connectionId, data }: { connectionId: string; data: UpdateATSConnectionData }) =>
      atsConnectionsService.updateConnection(connectionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['ats-connections', organizationId] 
      });
      toast.success('ATS connection updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update connection: ${error.message}`);
    },
  });
}

/**
 * Delete an ATS connection
 */
export function useDeleteATSConnection(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (connectionId: string) =>
      atsConnectionsService.deleteConnection(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['ats-connections', organizationId] 
      });
      toast.success('ATS connection deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete connection: ${error.message}`);
    },
  });
}

/**
 * Test an ATS connection
 */
export function useTestATSConnection() {
  return useMutation({
    mutationFn: (connectionId: string) =>
      atsConnectionsService.testConnection(connectionId),
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
 * Copy organization default to client
 */
export function useCopyConnectionToClient(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ connectionId, clientId }: { connectionId: string; clientId: string }) =>
      atsConnectionsService.copyOrgConnectionToClient(connectionId, clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['ats-connections', organizationId] 
      });
      toast.success('Connection copied to client successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to copy connection: ${error.message}`);
    },
  });
}
