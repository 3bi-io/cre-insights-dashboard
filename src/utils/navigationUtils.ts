/**
 * Shared navigation utility functions
 * Consolidates duplicated logic across navigation components
 */

/**
 * Check if a path is currently active
 */
export function isActivePath(
  currentPath: string,
  targetPath: string,
  patterns?: string[]
): boolean {
  // Exact match
  if (currentPath === targetPath) return true;
  
  // Check additional patterns
  if (patterns) {
    return patterns.some(pattern => {
      if (pattern.endsWith('*')) {
        return currentPath.startsWith(pattern.slice(0, -1));
      }
      return currentPath === pattern;
    });
  }
  
  // Check if current path starts with target (for nested routes)
  if (targetPath !== '/' && currentPath.startsWith(targetPath + '/')) {
    return true;
  }
  
  return false;
}

/**
 * Get user initials from email or name
 */
export function getUserInitials(
  email?: string | null,
  firstName?: string | null,
  lastName?: string | null
): string {
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  if (firstName) {
    return firstName.charAt(0).toUpperCase();
  }
  if (email) {
    return email.charAt(0).toUpperCase();
  }
  return 'U';
}

/**
 * Get display name from user data
 */
export function getDisplayName(
  firstName?: string | null,
  lastName?: string | null,
  email?: string | null
): string {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  if (firstName) {
    return firstName;
  }
  if (email) {
    return email.split('@')[0];
  }
  return 'User';
}

/**
 * Get role badge color classes
 */
export function getRoleBadgeColor(role: string | null): string {
  switch (role) {
    case 'super_admin':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'admin':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'moderator':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    case 'recruiter':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    case 'candidate':
      return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
    case 'viewer':
    case 'user':
      return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    default:
      return 'bg-muted text-muted-foreground border-muted';
  }
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: string | null): string {
  switch (role) {
    case 'super_admin':
      return 'Super Admin';
    case 'admin':
      return 'Admin';
    case 'moderator':
      return 'Moderator';
    case 'recruiter':
      return 'Recruiter';
    case 'viewer':
      return 'Viewer';
    case 'user':
      return 'User';
    case 'candidate':
      return 'Candidate';
    default:
      return 'User';
  }
}

/**
 * Format navigation label for display
 */
export function formatNavLabel(label: string): string {
  return label
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}
