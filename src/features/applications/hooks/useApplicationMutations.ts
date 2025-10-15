import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { ApplicationService } from '../services';
import { ApplicationFormData, ApplicationUpdatePayload } from '../types';

/**
 * Hook for application mutations (create, update, delete)
 */
export const useApplicationMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: ApplicationFormData) => ApplicationService.createApplication(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast({
        title: 'Success',
        description: 'Application created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create application',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: ApplicationUpdatePayload }) =>
      ApplicationService.updateApplication(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast({
        title: 'Success',
        description: 'Application updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update application',
        variant: 'destructive',
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ApplicationService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive',
      });
    },
  });

  const assignRecruiterMutation = useMutation({
    mutationFn: ({ id, recruiterId }: { id: string; recruiterId: string | null }) =>
      ApplicationService.assignRecruiter(id, recruiterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign recruiter',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ApplicationService.deleteApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast({
        title: 'Success',
        description: 'Application deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete application',
        variant: 'destructive',
      });
    },
  });

  return {
    createApplication: createMutation.mutate,
    updateApplication: updateMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
    assignRecruiter: assignRecruiterMutation.mutate,
    deleteApplication: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
