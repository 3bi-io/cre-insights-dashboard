import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserRole } from '@/features/admin/types';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole: UserRole | UserRole[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * RoleGuard component for protecting routes/content based on user roles
 * 
 * @param requiredRole - Single role or array of roles that can access the content
 * @param fallback - Optional custom fallback component to show when access is denied
 * @param redirectTo - Optional path to redirect to when access is denied (defaults to showing AccessDenied)
 */
const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  requiredRole,
  fallback,
  redirectTo
}) => {
  const { userRole, loading, user } = useAuth();

  // Show loading state while auth is being determined
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if user has required role
  const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  const hasAccess = userRole && requiredRoles.includes(userRole as UserRole);

  if (!hasAccess) {
    // If redirect path specified, navigate there
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }

    // If custom fallback provided, use it
    if (fallback) {
      return <>{fallback}</>;
    }

    // Default access denied UI
    return <AccessDeniedContent requiredRoles={requiredRoles} />;
  }

  return <>{children}</>;
};

// Inline AccessDenied component for role-specific messaging
const AccessDeniedContent: React.FC<{ requiredRoles: UserRole[] }> = ({ requiredRoles }) => {
  const formatRoles = (roles: UserRole[]) => {
    return roles.map(role => 
      role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    ).join(' or ');
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center space-y-4 p-8 max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Access Restricted</h2>
          <p className="text-muted-foreground">
            This page requires {formatRoles(requiredRoles)} access.
          </p>
          <p className="text-sm text-muted-foreground">
            Please contact your administrator if you believe you should have access.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleGuard;
