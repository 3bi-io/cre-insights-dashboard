/**
 * Tenstreet Credentials Management Hook
 * Fetches organizations with their Tenstreet credentials for admin management
 */

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
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  const {
    data: summary,
    isLoading: summaryLoading
  } = useQuery({
    queryKey: ['tenstreet-credentials-summary'],
    queryFn: () => TenstreetCredentialsService.getSummaryStats(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  return {
    organizations,
    summary,
    isLoading: isLoading || summaryLoading,
    error,
    refetch,
  };
}
