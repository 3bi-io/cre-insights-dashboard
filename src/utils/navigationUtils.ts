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
  if (currentPath === targetPath) return true;
  
  if (patterns) {
    return patterns.some(pattern => {
      if (pattern.endsWith('*')) {
        return currentPath.startsWith(pattern.slice(0, -1));
      }
      return currentPath === pattern;
    });
  }
  
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
 * Get role badge color classes - premium color scheme
 */
export function getRoleBadgeColor(role: string | null): string {
  switch (role) {
    case 'super_admin':
      return 'bg-amber-500/15 text-amber-500 border-amber-500/30';
    case 'admin':
      return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    case 'moderator':
      return 'bg-violet-500/15 text-violet-400 border-violet-500/30';
    case 'recruiter':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'client':
      return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    case 'candidate':
      return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
    case 'viewer':
    case 'user':
      return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
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
    case 'client':
      return 'Client';
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
 * Get role accent color for sidebar/UI elements
 */
export function getRoleAccentColor(role: string | null): string {
  switch (role) {
    case 'super_admin':
      return 'text-amber-500';
    case 'admin':
      return 'text-blue-400';
    case 'moderator':
      return 'text-violet-400';
    case 'recruiter':
      return 'text-emerald-400';
    case 'client':
      return 'text-purple-400';
    default:
      return 'text-muted-foreground';
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
