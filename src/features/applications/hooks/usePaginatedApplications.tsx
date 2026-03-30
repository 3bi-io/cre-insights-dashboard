import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';

interface PaginationFilters {
  organizationId?: string;
  status?: string;
  search?: string;
  jobListingId?: string;
  recruiterId?: string;
}

const PAGE_SIZE = 50;

export const usePaginatedApplications = (filters: PaginationFilters = {}) => {
  const queryClient = useQueryClient();

  // Realtime subscription for automatic updates
  useEffect(() => {
    const channelName = `applications-list-${crypto.randomUUID()}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'applications',
      }, () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useInfiniteQuery({
    queryKey: queryKeys.applications.list(filters),
    queryFn: async ({ pageParam = 0 }) => {
      const jobJoin = filters.organizationId ? 'job_listings!inner' : 'job_listings';
      let query = supabase
        .from('applications')
        .select(`
          *,
          ${jobJoin}(
            id,
            title,
            organization_id,
            category_id,
            client_id,
            job_title,
            clients(name)
          ),
          recruiters(
            id,
            first_name,
            last_name
          )
        `, { count: 'exact' })
        .order('applied_at', { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1);

      // Apply filters
      if (filters.organizationId) {
        query = query.eq('job_listings.organization_id', filters.organizationId);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.jobListingId) {
        query = query.eq('job_listing_id', filters.jobListingId);
      }

      if (filters.recruiterId) {
        query = query.eq('recruiter_id', filters.recruiterId);
      }

      if (filters.search) {
        query = query.or(
          `first_name.ilike.%${filters.search}%,` +
          `last_name.ilike.%${filters.search}%,` +
          `applicant_email.ilike.%${filters.search}%`
        );
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        nextCursor: (data?.length || 0) === PAGE_SIZE ? pageParam + PAGE_SIZE : undefined,
        totalCount: count || 0,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });
};
