import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuditedApplicationAccess, AUDIT_REASONS } from '@/hooks/useAuditedApplicationAccess';
import { FilterOptions } from '@/features/shared/types/feature.types';

export interface ApplicationFilters extends FilterOptions {
  job_id?: string;
  status?: string;
  cdl_license?: boolean;
  veteran_status?: boolean;
  experience_years_min?: number;
  city?: string;
  state?: string;
  organization_id?: string;
  accessReason?: string; // Audit reason for access logging
}

export function useApplications(options?: { 
  enabled?: boolean;
  filters?: ApplicationFilters;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(1);
  const [allApplications, setAllApplications] = React.useState<any[]>([]);
  
  // Use audited application access hook for FCRA/GDPR/CCPA compliance
  const {
    getApplicationList,
    createApplication: createApplicationMutation,
    updateApplication: updateApplicationMutation,
    isCreating,
    isUpdating,
    canAccessPII
  } = useAuditedApplicationAccess();

  // Query for fetching applications with audit logging
  const {
    data: queryData,
    isLoading: loading,
    error: queryError,
    refetch
  } = useQuery({
    queryKey: [`applications`, options?.filters, page],
    queryFn: async () => {
      // Use appropriate audit reason based on context
      const accessReason = options?.filters?.accessReason || AUDIT_REASONS.APPLICATION_REVIEW;
      
      const result = await getApplicationList({
        jobId: options?.filters?.job_id,
        status: options?.filters?.status,
        city: options?.filters?.city,
        state: options?.filters?.state,
        search: options?.filters?.search,
        organizationId: options?.filters?.organization_id,
        page,
        pageSize: options?.filters?.pageSize || 200,
        accessReason
      });
      
      return {
        data: result.applications,
        totalCount: result.totalCount,
        hasMore: result.applications.length >= (options?.filters?.pageSize || 200)
      };
    },
    enabled: options?.enabled !== false,
    staleTime: 2 * 60 * 1000 // 2 minutes
  });

  // Accumulate applications as pages load
  React.useEffect(() => {
    if (queryData?.data) {
      if (page === 1) {
        setAllApplications(queryData.data);
      } else {
        setAllApplications(prev => [...prev, ...queryData.data]);
      }
    }
  }, [queryData, page]);

  const applications = allApplications;
  const totalCount = queryData?.totalCount || 0;
  const hasMore = queryData?.hasMore || false;
  const error = queryError as any;
  const initialized = !loading;

  // Action functions with audit logging
  const createApplication = (data: any, accessReason?: string) => {
    createApplicationMutation({ 
      data,
      accessReason: accessReason || AUDIT_REASONS.APPLICATION_REVIEW
    });
  };

  const updateApplication = (id: string, data: any, updateReason?: string) => {
    updateApplicationMutation({
      applicationId: id,
      updates: data,
      updateReason: updateReason || AUDIT_REASONS.STATUS_UPDATE
    });
  };

  // Delete not supported - applications should be archived for audit trail
  const deleteApplication = () => {
    toast({
      title: 'Operation Not Supported',
      description: 'Applications cannot be permanently deleted. Please update status to "rejected" or archive instead.',
      variant: 'destructive'
    });
  };

  const reviewApplication = (
    id: string, 
    status: 'reviewed' | 'interviewing' | 'hired' | 'rejected', 
    notes?: string
  ) => {
    // Use appropriate audit reason based on status change
    const updateReason = status === 'hired' 
      ? AUDIT_REASONS.OFFER_PREPARATION
      : status === 'interviewing'
      ? AUDIT_REASONS.INTERVIEW_SCHEDULING
      : AUDIT_REASONS.STATUS_UPDATE;
      
    updateApplicationMutation({
      applicationId: id,
      updates: {
        status,
        notes,
        reviewed_at: new Date().toISOString()
      },
      updateReason
    });
  };

  const getApplicationStats = async (jobId?: string) => {
    try {
      const result = await getApplicationList({
        jobId,
        accessReason: AUDIT_REASONS.APPLICATION_REVIEW
      });
      
      const stats = {
        total: result.totalCount,
        pending: result.applications.filter((app: any) => app.status === 'pending').length,
        reviewed: result.applications.filter((app: any) => app.status === 'reviewed').length,
        interviewing: result.applications.filter((app: any) => app.status === 'interviewing').length,
        hired: result.applications.filter((app: any) => app.status === 'hired').length,
        rejected: result.applications.filter((app: any) => app.status === 'rejected').length
      };
      
      return stats;
    } catch (error) {
      console.error('Error fetching application stats:', error);
      throw error;
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  const refresh = () => {
    setPage(1);
    setAllApplications([]);
    refetch();
  };

  const reset = () => {
    setPage(1);
    setAllApplications([]);
    queryClient.removeQueries({ queryKey: [`applications`] });
  };

  return {
    // Data
    applications,
    totalCount,
    hasMore,
    loading,
    error,
    initialized,
    currentPage: page,
    
    // Actions with audit logging
    createApplication,
    updateApplication,
    deleteApplication,
    reviewApplication,
    getApplicationStats,
    
    // Pagination
    loadMore,
    refresh,
    reset,
    
    // State
    isCreating,
    isUpdating,
    isDeleting: false, // Delete not supported for compliance
    
    // Permissions
    canAccessPII,
    
    // Utilities
    clearError: () => {} // Placeholder for compatibility
  };
}
