import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSubscription?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireSubscription = true 
}) => {
  const { user, loading: authLoading, userRole, organization } = useAuth();
  const { hasActiveSubscription, loading: subLoading } = useSubscription();
  const location = useLocation();

  // Routes that don't require subscription
  const publicRoutes = ['/pricing', '/profile', '/settings', '/onboarding'];
  const isPublicRoute = publicRoutes.some(route => location.pathname.startsWith(route));

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Super admins bypass subscription checks
  if (userRole === 'super_admin') {
    return <>{children}</>;
  }

  // Check if organization needs onboarding
  if (organization && organization.subscription_status === 'inactive' && !isPublicRoute) {
    return <Navigate to="/onboarding" replace />;
  }

  // Require subscription for protected routes
  if (requireSubscription && !hasActiveSubscription && !isPublicRoute) {
    return <Navigate to="/pricing" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;