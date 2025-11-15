/**
 * Audited Application Data Access Hook
 * 
 * This hook provides comprehensive PII audit logging for application data access.
 * ALL access to sensitive applicant information MUST go through these functions
 * to ensure FCRA, GDPR, and CCPA compliance.
 * 
 * CRITICAL: Every PII access requires a business justification (accessReason)
 * that is logged in the audit_logs table for compliance reporting.
 * 
 * @example
 * ```tsx
 * const { getApplication, getApplicationList, updateApplication } = useAuditedApplicationAccess();
 * 
 * // Access single application with PII
 * const app = await getApplication(id, {
 *   includePII: true,
 *   accessReason: 'Background check review for hiring decision'
 * });
 * 
 * // Access application list (no PII)
 * const apps = await getApplicationList({
 *   jobId: '123',
 *   accessReason: 'Weekly application review'
 * });
 * ```
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface ApplicationAccessOptions {
  includePII?: boolean;
  accessReason?: string;
}

export interface ApplicationListOptions {
  jobId?: string;
  status?: string;
  city?: string;
  state?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  accessReason?: string;
}

export interface ApplicationUpdateOptions {
  updateReason?: string;
}

export const useAuditedApplicationAccess = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userRole } = useAuth();

  /**
   * Get single application with optional PII access
   * PII access is automatically logged with the provided reason
   */
  const getApplication = async (
    applicationId: string,
    options: ApplicationAccessOptions = {}
  ) => {
    const {
      includePII = false,
      accessReason = includePII
        ? 'Sensitive data review for hiring decision'
        : 'Basic application review'
    } = options;

    // Authorization check on client side (server will verify again)
    if (includePII && userRole !== 'admin' && userRole !== 'super_admin') {
      throw new Error('Only administrators can access sensitive PII data');
    }

    const { data, error } = await supabase.rpc('get_application_with_audit', {
      application_id: applicationId,
      access_reason: accessReason,
      include_pii: includePII
    });

    if (error) {
      console.error('Error fetching application:', error);
      throw error;
    }

    return data;
  };

  /**
   * Get list of applications (basic data only, no PII)
   * List access is logged for audit compliance
   */
  const getApplicationList = async (options: ApplicationListOptions = {}) => {
    const {
      jobId,
      status,
      city,
      state,
      search,
      page = 1,
      pageSize = 200,
      accessReason = 'Application list review'
    } = options;

    const filters: Record<string, any> = {
      limit: pageSize,
      offset: (page - 1) * pageSize
    };

    if (jobId) filters.job_id = jobId;
    if (status) filters.status = status;
    if (city) filters.city = city;
    if (state) filters.state = state;
    if (search) filters.search = search;

    const { data, error } = await supabase.rpc('get_applications_list_with_audit', {
      filters,
      access_reason: accessReason
    });

    if (error) {
      console.error('Error fetching application list:', error);
      throw error;
    }

    return {
      applications: data,
      totalCount: data && data.length > 0 ? data[0].total_count : 0
    };
  };

  /**
   * Create application with audit logging
   * Automatically logs if PII is included in submission
   */
  const createApplicationMutation = useMutation({
    mutationFn: async ({
      data,
      accessReason = 'New application submission'
    }: {
      data: any;
      accessReason?: string;
    }) => {
      const { data: result, error } = await supabase.rpc(
        'create_application_with_audit',
        {
          application_data: data,
          created_by_reason: accessReason
        }
      );

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast({
        title: 'Application Created',
        description: 'Application has been successfully created and logged.'
      });
    },
    onError: (error: any) => {
      console.error('Application creation error:', error);
      toast({
        title: 'Creation Failed',
        description: error.message || 'Failed to create application',
        variant: 'destructive'
      });
    }
  });

  /**
   * Update application with audit logging
   * Automatically logs if PII fields are modified
   */
  const updateApplicationMutation = useMutation({
    mutationFn: async ({
      applicationId,
      updates,
      updateReason = 'Application update'
    }: {
      applicationId: string;
      updates: any;
      updateReason?: string;
    }) => {
      // Check if PII fields are being updated
      const piiFields = ['ssn', 'date_of_birth', 'government_id', 'convicted_felony', 'felony_details'];
      const hasPII = piiFields.some(field => updates.hasOwnProperty(field));

      if (hasPII && userRole !== 'admin' && userRole !== 'super_admin') {
        throw new Error('Only administrators can update sensitive PII fields');
      }

      const { data, error } = await supabase.rpc('update_application_with_audit', {
        application_id: applicationId,
        update_data: updates,
        update_reason: updateReason
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['application', variables.applicationId]
      });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast({
        title: 'Application Updated',
        description: 'Application has been updated and changes logged.'
      });
    },
    onError: (error: any) => {
      console.error('Application update error:', error);
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update application',
        variant: 'destructive'
      });
    }
  });

  return {
    // Queries
    getApplication,
    getApplicationList,

    // Mutations
    createApplication: createApplicationMutation.mutate,
    updateApplication: updateApplicationMutation.mutate,
    isCreating: createApplicationMutation.isPending,
    isUpdating: updateApplicationMutation.isPending,

    // Permissions
    canAccessPII: userRole === 'admin' || userRole === 'super_admin'
  };
};

/**
 * Audit Access Reasons - Standard justifications for PII access
 * 
 * Use these predefined reasons for consistent audit logging:
 */
export const AUDIT_REASONS = {
  // Hiring Process
  BACKGROUND_CHECK: 'Background check review for hiring decision',
  REFERENCE_CHECK: 'Reference verification for employment',
  ELIGIBILITY_VERIFY: 'Eligibility verification for position',
  OFFER_PREPARATION: 'Offer letter preparation',

  // Compliance
  COMPLIANCE_REVIEW: 'Compliance audit review',
  LEGAL_REQUEST: 'Legal department request',
  REGULATORY_REPORT: 'Regulatory reporting requirement',
  DATA_CORRECTION: 'Data correction per applicant request',

  // Operations
  STATUS_UPDATE: 'Application status update',
  RECRUITER_ASSIGNMENT: 'Recruiter assignment',
  INTERVIEW_SCHEDULING: 'Interview scheduling coordination',
  APPLICATION_REVIEW: 'General application review',

  // System
  DATA_MIGRATION: 'Data migration or system maintenance',
  QUALITY_ASSURANCE: 'Quality assurance review',
  TECHNICAL_SUPPORT: 'Technical support investigation'
} as const;
