/**
 * Generic Mutation Hook Factory
 * Creates type-safe, reusable mutation hooks with consistent error handling
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { UseMutationResponse } from '@/types/hook.types';

export interface MutationConfig<TData = unknown, TVariables = unknown> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  invalidateQueries?: string[];
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
}

/**
 * Factory function to create a custom mutation hook with toast notifications
 * @param config Mutation configuration
 * @returns Custom hook function
 */
export function createMutationHook<TData = unknown, TVariables = unknown>(
  config: MutationConfig<TData, TVariables>
) {
  return function useGenericMutation(): UseMutationResponse<TData, TVariables> {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const mutation = useMutation<TData, Error, TVariables>({
      mutationFn: config.mutationFn,
      onSuccess: (data, variables) => {
        // Invalidate related queries
        if (config.invalidateQueries) {
          config.invalidateQueries.forEach(queryKey => {
            queryClient.invalidateQueries({ queryKey: [queryKey] });
          });
        }

        // Show success toast
        if (config.successMessage) {
          toast({
            title: 'Success',
            description: config.successMessage,
          });
        }

        // Call custom success handler
        config.onSuccess?.(data, variables);
      },
      onError: (error, variables) => {
        // Show error toast
        toast({
          title: 'Error',
          description: error.message || config.errorMessage || 'An error occurred',
          variant: 'destructive',
        });

        // Call custom error handler
        config.onError?.(error, variables);
      },
    } as UseMutationOptions<TData, Error, TVariables>);

    return {
      mutate: mutation.mutate,
      mutateAsync: mutation.mutateAsync,
      isLoading: mutation.isPending,
      isSuccess: mutation.isSuccess,
      isError: mutation.isError,
      isPending: mutation.isPending,
      error: mutation.error,
      data: mutation.data,
      reset: mutation.reset,
      status: mutation.status === 'pending' ? 'loading' : mutation.status,
    };
  };
}

/**
 * Factory for standard CRUD mutations
 * Creates create, update, and delete mutations with consistent behavior
 */
export function createCRUDMutations<TData = unknown, TCreate = unknown, TUpdate = unknown>(
  entityName: string,
  service: {
    create: (data: TCreate) => Promise<TData>;
    update: (id: string, data: TUpdate) => Promise<TData>;
    delete: (id: string) => Promise<void>;
  },
  queryKeys: string[]
) {
  return function useCRUDMutations() {
    const createMutation = createMutationHook<TData, TCreate>({
      mutationFn: service.create,
      invalidateQueries: queryKeys,
      successMessage: `${entityName} created successfully`,
      errorMessage: `Failed to create ${entityName.toLowerCase()}`,
    })();

    const updateMutation = createMutationHook<TData, { id: string; data: TUpdate }>({
      mutationFn: ({ id, data }) => service.update(id, data),
      invalidateQueries: queryKeys,
      successMessage: `${entityName} updated successfully`,
      errorMessage: `Failed to update ${entityName.toLowerCase()}`,
    })();

    const deleteMutation = createMutationHook<void, string>({
      mutationFn: service.delete,
      invalidateQueries: queryKeys,
      successMessage: `${entityName} deleted successfully`,
      errorMessage: `Failed to delete ${entityName.toLowerCase()}`,
    })();

    return {
      create: createMutation.mutate,
      createAsync: createMutation.mutateAsync,
      update: updateMutation.mutate,
      updateAsync: updateMutation.mutateAsync,
      delete: deleteMutation.mutate,
      deleteAsync: deleteMutation.mutateAsync,
      isCreating: createMutation.isPending,
      isUpdating: updateMutation.isPending,
      isDeleting: deleteMutation.isPending,
      isLoading: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    };
  };
}

/**
 * Factory for optimistic update mutations
 * Automatically handles optimistic updates and rollback on error
 */
export function createOptimisticMutationHook<TData = unknown, TVariables = unknown>(
  config: MutationConfig<TData, TVariables> & {
    queryKey: string[];
    getOptimisticData: (variables: TVariables, previousData: TData) => TData;
  }
) {
  return function useOptimisticMutation(): UseMutationResponse<TData, TVariables> {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const mutation = useMutation<TData, Error, TVariables, { previousData: TData | undefined }>({
      mutationFn: config.mutationFn,
      onMutate: async (variables) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey: config.queryKey });

        // Snapshot previous value
        const previousData = queryClient.getQueryData<TData>(config.queryKey);

        // Optimistically update
        if (previousData) {
          queryClient.setQueryData<TData>(
            config.queryKey,
            config.getOptimisticData(variables, previousData)
          );
        }

        return { previousData };
      },
      onError: (error, variables, context) => {
        // Rollback on error
        if (context?.previousData) {
          queryClient.setQueryData(config.queryKey, context.previousData);
        }

        toast({
          title: 'Error',
          description: error.message || config.errorMessage || 'An error occurred',
          variant: 'destructive',
        });

        config.onError?.(error, variables);
      },
      onSuccess: (data, variables) => {
        if (config.successMessage) {
          toast({
            title: 'Success',
            description: config.successMessage,
          });
        }

        config.onSuccess?.(data, variables);
      },
      onSettled: () => {
        // Always refetch after error or success
        queryClient.invalidateQueries({ queryKey: config.queryKey });
      },
    } as UseMutationOptions<TData, Error, TVariables, { previousData: TData | undefined }>);

    return {
      mutate: mutation.mutate,
      mutateAsync: mutation.mutateAsync,
      isLoading: mutation.isPending,
      isSuccess: mutation.isSuccess,
      isError: mutation.isError,
      isPending: mutation.isPending,
      error: mutation.error,
      data: mutation.data,
      reset: mutation.reset,
      status: mutation.status === 'pending' ? 'loading' : mutation.status,
    };
  };
}
