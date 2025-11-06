import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface XchangeRequest {
  id: string;
  application_id: string;
  driver_id: string;
  request_type: string;
  provider: string | null;
  status: string;
  request_date: string;
  completion_date: string | null;
  result_data: any;
  cost_cents: number;
  reference_number: string | null;
  notes: string | null;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

interface UseXchangeRequestsOptions {
  applicationId?: string;
  driverId?: string;
  organizationId?: string;
}

export function useXchangeRequests(options: UseXchangeRequestsOptions = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { applicationId, driverId, organizationId } = options;

  // Fetch xchange requests
  const query = useQuery({
    queryKey: ['xchange-requests', applicationId, driverId, organizationId],
    queryFn: async () => {
      let query = supabase
        .from('tenstreet_xchange_requests')
        .select('*')
        .order('request_date', { ascending: false });

      if (applicationId) {
        query = query.eq('application_id', applicationId);
      }
      if (driverId) {
        query = query.eq('driver_id', driverId);
      }
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as XchangeRequest[];
    },
    enabled: !!(applicationId || driverId || organizationId)
  });

  // Create xchange request mutation
  const createRequest = useMutation({
    mutationFn: async (data: {
      application_id: string;
      driver_id: string;
      request_type: string;
      provider?: string;
      notes?: string;
      cost_cents?: number;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data: profileData } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', userData.user?.id)
        .single();

      const { data: result, error } = await supabase
        .from('tenstreet_xchange_requests')
        .insert({
          ...data,
          organization_id: profileData?.organization_id,
          created_by: userData.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Request Created',
        description: 'Verification request has been submitted successfully.'
      });
      queryClient.invalidateQueries({ queryKey: ['xchange-requests'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Create Request',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Update xchange request mutation
  const updateRequest = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<XchangeRequest> }) => {
      const { data, error } = await supabase
        .from('tenstreet_xchange_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Request Updated',
        description: 'Verification request has been updated successfully.'
      });
      queryClient.invalidateQueries({ queryKey: ['xchange-requests'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Update Request',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Cancel xchange request mutation
  const cancelRequest = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('tenstreet_xchange_requests')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Request Cancelled',
        description: 'Verification request has been cancelled.'
      });
      queryClient.invalidateQueries({ queryKey: ['xchange-requests'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Cancel Request',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Get summary statistics
  const getSummary = () => {
    const requests = query.data || [];
    return {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending' || r.status === 'in_progress').length,
      completed: requests.filter(r => r.status === 'completed').length,
      failed: requests.filter(r => r.status === 'failed').length,
      cancelled: requests.filter(r => r.status === 'cancelled').length,
      totalCost: requests.reduce((sum, r) => sum + (r.cost_cents || 0), 0)
    };
  };

  return {
    requests: query.data,
    isLoading: query.isLoading,
    error: query.error,
    summary: getSummary(),
    createRequest: createRequest.mutate,
    isCreating: createRequest.isPending,
    updateRequest: updateRequest.mutate,
    isUpdating: updateRequest.isPending,
    cancelRequest: cancelRequest.mutate,
    isCancelling: cancelRequest.isPending,
    refetch: query.refetch
  };
}
