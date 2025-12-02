import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import RoleGuard from './RoleGuard';
import type { UserRole } from '@/features/admin/types';

interface AdminPageLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  requiredRole?: UserRole | UserRole[];
  actions?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
  contentClassName?: string;
  showRoleBadge?: boolean;
}

const AdminPageLayout: React.FC<AdminPageLayoutProps> = ({
  children,
  title,
  description,
  requiredRole,
  actions,
  isLoading = false,
  className,
  contentClassName,
  showRoleBadge = true
}) => {
  const { userRole } = useAuth();

  const getRoleBadgeVariant = (role: string | null) => {
    switch (role) {
      case 'super_admin':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'admin':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'moderator':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const formatRoleName = (role: string | null) => {
    if (!role) return 'User';
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const content = (
    <div className={cn("flex flex-col min-h-full", className)}>
      {/* Page Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight truncate">
                  {title}
                </h1>
                {showRoleBadge && userRole && (
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs shrink-0", getRoleBadgeVariant(userRole))}
                  >
                    {formatRoleName(userRole)}
                  </Badge>
                )}
              </div>
              {description && (
                <p className="text-muted-foreground mt-1 text-sm sm:text-base max-w-2xl">
                  {description}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2 shrink-0">
                {actions}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={cn("flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6", contentClassName)}>
        {isLoading ? (
          <AdminLoadingSkeleton />
        ) : (
          children
        )}
      </main>
    </div>
  );

  // If a required role is specified, wrap with RoleGuard
  if (requiredRole) {
    return (
      <RoleGuard requiredRole={requiredRole}>
        {content}
      </RoleGuard>
    );
  }

  return content;
};

// Loading skeleton component
const AdminLoadingSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Stats row */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-card rounded-lg border p-4">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
    
    {/* Main content area */}
    <div className="bg-card rounded-lg border">
      <div className="p-4 border-b">
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full max-w-md" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default AdminPageLayout;
export { AdminLoadingSkeleton };
