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
  const location = useLocation();
  const { user, loading: authLoading, userRole } = useAuth();
  const { hasActiveSubscription, loading: subLoading } = useSubscription();

  // Wait for auth data to load - only wait for subscription if it's required
  const isLoading = authLoading || (user && userRole === null) || (requireSubscription && subLoading);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Super admins bypass all checks
  if (userRole === 'super_admin') {
    return <>{children}</>;
  }

  // If subscription required and user lacks active subscription, redirect to pricing
  if (requireSubscription && !hasActiveSubscription) {
    return <Navigate to="/pricing" state={{ from: location.pathname }} replace />;
  }

  // Grant access
  return <>{children}</>;
};

export default ProtectedRoute;