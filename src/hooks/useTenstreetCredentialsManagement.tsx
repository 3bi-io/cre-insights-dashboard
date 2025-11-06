import { useQuery } from '@tanstack/react-query';
import { TenstreetCredentialsService } from '@/services/tenstreetCredentialsService';

export function useTenstreetCredentialsManagement() {
  const {
    data: organizations = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['tenstreet-credentials-management'],
    queryFn: () => TenstreetCredentialsService.fetchOrganizationsWithCredentials(),
    refetchInterval: 60000, // Refresh every minute
  });

  const {
    data: summary,
    isLoading: summaryLoading
  } = useQuery({
    queryKey: ['tenstreet-credentials-summary'],
    queryFn: () => TenstreetCredentialsService.getSummaryStats(),
    refetchInterval: 60000,
  });

  return {
    organizations,
    summary,
    isLoading: isLoading || summaryLoading,
    error,
    refetch,
  };
}
