/**
 * Centralized hook for admin access control
 * Provides consistent role and permission checking across the application
 */

import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  hasRoleOrHigher, 
  isSuperAdminRole, 
  isAdminRole, 
  isModeratorOrHigher as isModeratorOrHigherUtil,
  isRecruiterOrHigher as isRecruiterOrHigherUtil 
} from '@/utils/roleUtils';
import {
  isOrganizationAdmin,
  canManageOrganization as canManageOrgUtil,
  canManageUsers as canManageUsersUtil,
  canManageJobs as canManageJobsUtil,
  canManageApplications as canManageApplicationsUtil,
  canAccessAnalytics as canAccessAnalyticsUtil,
  canAccessAITools as canAccessAIToolsUtil,
  canAccessVoiceAgents as canAccessVoiceAgentsUtil,
  canManageClients as canManageClientsUtil,
  canAccessOrgSettings as canAccessOrgSettingsUtil,
  getRoleOptions,
} from '@/utils/authHelpers';

export interface AdminAccessResult {
  // Core role checks
  isSuperAdmin: boolean;
  isOrgAdmin: boolean;
  isAdmin: boolean;
  isModeratorOrHigher: boolean;
  isRecruiterOrHigher: boolean;
  
  // Permission checks
  canManageOrganization: boolean;
  canManageUsers: boolean;
  canManageJobs: boolean;
  canManageApplications: boolean;
  canAccessAnalytics: boolean;
  canAccessAITools: boolean;
  canAccessVoiceAgents: boolean;
  canManageClients: boolean;
  canAccessOrgSettings: boolean;
  
  // Organization context
  organizationId: string | undefined;
  organizationName: string | undefined;
  
  // Current user info
  userRole: string | null;
  userId: string | undefined;
  
  // Utility functions
  hasRoleOrHigher: (requiredRole: string) => boolean;
  getRoleOptions: (includeSuperAdmin?: boolean) => Array<{
    value: string;
    label: string;
    description: string;
  }>;
}

/**
 * Hook for centralized admin access control
 * Use this instead of manually checking roles throughout the application
 */
export function useAdminAccess(): AdminAccessResult {
  const { userRole, userType, organization, user } = useAuth();
  
  return useMemo(() => {
    const isSuperAdmin = isSuperAdminRole(userRole);
    const isAdmin = isAdminRole(userRole);
    const isOrgAdmin = isOrganizationAdmin(userRole, userType);
    const isModeratorOrHigher = isModeratorOrHigherUtil(userRole);
    const isRecruiterOrHigher = isRecruiterOrHigherUtil(userRole);
    
    return {
      // Core role checks
      isSuperAdmin,
      isOrgAdmin,
      isAdmin,
      isModeratorOrHigher,
      isRecruiterOrHigher,
      
      // Permission checks - super admin always has access
      canManageOrganization: canManageOrgUtil(userRole),
      canManageUsers: canManageUsersUtil(userRole),
      canManageJobs: canManageJobsUtil(userRole),
      canManageApplications: canManageApplicationsUtil(userRole),
      canAccessAnalytics: canAccessAnalyticsUtil(userRole),
      canAccessAITools: canAccessAIToolsUtil(userRole),
      canAccessVoiceAgents: canAccessVoiceAgentsUtil(userRole),
      canManageClients: canManageClientsUtil(userRole),
      canAccessOrgSettings: canAccessOrgSettingsUtil(userRole),
      
      // Organization context
      organizationId: organization?.id,
      organizationName: organization?.name,
      
      // Current user info
      userRole,
      userId: user?.id,
      
      // Utility functions
      hasRoleOrHigher: (requiredRole: string) => hasRoleOrHigher(userRole, requiredRole),
      getRoleOptions: (includeSuperAdmin?: boolean) => getRoleOptions(includeSuperAdmin ?? isSuperAdmin),
    };
  }, [userRole, userType, organization, user]);
}

export default useAdminAccess;
