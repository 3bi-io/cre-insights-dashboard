/**
 * Frontend role hierarchy utilities
 * Provides consistent role checking across navigation and components
 */

export type AppRole = 'user' | 'viewer' | 'client' | 'recruiter' | 'moderator' | 'admin' | 'super_admin';

/**
 * Role hierarchy levels - higher number = more permissions
 * viewer and user are equivalent (legacy compatibility)
 */
export const ROLE_HIERARCHY: Record<string, number> = {
  user: 1,
  viewer: 1,
  recruiter: 2,
  moderator: 3,
  admin: 4,
  super_admin: 5,
} as const;

/**
 * Check if user has the required role or higher in the hierarchy
 * @param userRole - Current user's role
 * @param requiredRole - Minimum required role
 * @returns true if user has sufficient permissions
 */
export function hasRoleOrHigher(
  userRole: string | null | undefined,
  requiredRole: string
): boolean {
  if (!userRole) return false;
  const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0;
  return userLevel >= requiredLevel;
}

/**
 * Check if user has any of the specified roles or higher
 * @param userRole - Current user's role
 * @param requiredRoles - Array of acceptable roles (checks if user has ANY of these or higher)
 * @returns true if user has sufficient permissions
 */
export function hasAnyRoleOrHigher(
  userRole: string | null | undefined,
  requiredRoles: string[]
): boolean {
  if (!userRole || requiredRoles.length === 0) return false;
  
  // Find the minimum required level among all specified roles
  const minRequiredLevel = Math.min(
    ...requiredRoles.map(role => ROLE_HIERARCHY[role] ?? 0)
  );
  
  const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
  return userLevel >= minRequiredLevel;
}

/**
 * Normalize role name for legacy compatibility
 * @param role - Role to normalize
 * @returns Normalized role name
 */
export function getEffectiveRoleName(role: string | null | undefined): string {
  if (!role) return 'user';
  // Normalize viewer -> user for legacy compatibility
  if (role === 'viewer') return 'user';
  return role;
}

/**
 * Get role priority for sorting (higher = more important)
 * @param role - Role to get priority for
 * @returns Priority number
 */
export function getRolePriority(role: string | null | undefined): number {
  if (!role) return 0;
  return ROLE_HIERARCHY[role] ?? 0;
}

/**
 * Compare two roles for sorting (descending by priority)
 * @param roleA - First role
 * @param roleB - Second role
 * @returns Comparison result for Array.sort()
 */
export function compareRoles(
  roleA: string | null | undefined,
  roleB: string | null | undefined
): number {
  return getRolePriority(roleB) - getRolePriority(roleA);
}

/**
 * Check if a role is considered an admin role (admin or super_admin)
 */
export function isAdminRole(role: string | null | undefined): boolean {
  return hasRoleOrHigher(role, 'admin');
}

/**
 * Check if a role is super_admin
 */
export function isSuperAdminRole(role: string | null | undefined): boolean {
  return role === 'super_admin';
}

/**
 * Check if a role is at least moderator level
 */
export function isModeratorOrHigher(role: string | null | undefined): boolean {
  return hasRoleOrHigher(role, 'moderator');
}

/**
 * Check if a role is at least recruiter level
 */
export function isRecruiterOrHigher(role: string | null | undefined): boolean {
  return hasRoleOrHigher(role, 'recruiter');
}
