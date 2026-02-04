/**
 * Centralized authentication and authorization helper utilities
 * Provides consistent role checking across the entire application
 */

import { hasRoleOrHigher, isSuperAdminRole, isAdminRole } from './roleUtils';

/**
 * Check if user is an organization admin (not super_admin)
 */
export function isOrganizationAdmin(
  userRole: string | null | undefined,
  userType: string | null | undefined
): boolean {
  return userRole === 'admin' && userType === 'organization';
}

/**
 * Check if user can manage an organization (admin or super_admin)
 */
export function canManageOrganization(userRole: string | null | undefined): boolean {
  return isAdminRole(userRole);
}

/**
 * Check if user can manage users (requires admin or higher)
 */
export function canManageUsers(userRole: string | null | undefined): boolean {
  return hasRoleOrHigher(userRole, 'admin');
}

/**
 * Check if user can manage jobs (requires recruiter or higher)
 */
export function canManageJobs(userRole: string | null | undefined): boolean {
  return hasRoleOrHigher(userRole, 'recruiter');
}

/**
 * Check if user can manage applications (requires recruiter or higher)
 */
export function canManageApplications(userRole: string | null | undefined): boolean {
  return hasRoleOrHigher(userRole, 'recruiter');
}

/**
 * Check if user can access analytics (requires moderator or higher)
 */
export function canAccessAnalytics(userRole: string | null | undefined): boolean {
  return hasRoleOrHigher(userRole, 'moderator');
}

/**
 * Check if user can access AI tools (requires moderator or higher)
 */
export function canAccessAITools(userRole: string | null | undefined): boolean {
  return hasRoleOrHigher(userRole, 'moderator');
}

/**
 * Check if user can access voice agents (requires moderator or higher)
 */
export function canAccessVoiceAgents(userRole: string | null | undefined): boolean {
  return hasRoleOrHigher(userRole, 'moderator');
}

/**
 * Check if user can manage clients (requires recruiter or higher)
 */
export function canManageClients(userRole: string | null | undefined): boolean {
  return hasRoleOrHigher(userRole, 'recruiter');
}

/**
 * Check if user can access organization settings (requires admin or higher)
 */
export function canAccessOrgSettings(userRole: string | null | undefined): boolean {
  return hasRoleOrHigher(userRole, 'admin');
}

/**
 * Check if user can access super admin features
 */
export function canAccessSuperAdminFeatures(userRole: string | null | undefined): boolean {
  return isSuperAdminRole(userRole);
}

/**
 * Get display name for a role
 */
export function getRoleDisplayName(role: string | null | undefined): string {
  if (!role) return 'User';
  
  const displayNames: Record<string, string> = {
    user: 'User',
    viewer: 'Viewer',
    recruiter: 'Recruiter',
    moderator: 'Moderator',
    admin: 'Admin',
    super_admin: 'Super Admin',
  };
  
  return displayNames[role] || role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ');
}

/**
 * Get role description for UI display
 */
export function getRoleDescription(role: string): string {
  const descriptions: Record<string, string> = {
    user: 'Basic access to view dashboard and personal data',
    viewer: 'Read-only access to organization data',
    recruiter: 'Manage applications, jobs, and clients',
    moderator: 'Manage content, analytics, and AI tools',
    admin: 'Full organization management access',
    super_admin: 'Platform-wide administration access',
  };
  
  return descriptions[role] || 'Standard access';
}

/**
 * Role options for selection dialogs
 * @param includeSuperAdmin - Whether to include super_admin option (only for super admins)
 */
export function getRoleOptions(includeSuperAdmin: boolean = false): Array<{
  value: string;
  label: string;
  description: string;
}> {
  const options = [
    { value: 'user', label: 'User', description: 'Basic access to view dashboard' },
    { value: 'recruiter', label: 'Recruiter', description: 'Manage applications, jobs, clients' },
    { value: 'moderator', label: 'Moderator', description: 'Manage content, analytics, AI tools' },
    { value: 'admin', label: 'Admin', description: 'Full organization management' },
  ];
  
  if (includeSuperAdmin) {
    options.push({ value: 'super_admin', label: 'Super Admin', description: 'Platform-wide access' });
  }
  
  return options;
}
