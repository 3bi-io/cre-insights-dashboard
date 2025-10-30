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
  const { user, loading: authLoading, userRole } = useAuth();
  const { hasActiveSubscription, loading: subLoading } = useSubscription();

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

  // Super admins bypass all checks
  if (userRole === 'super_admin') {
    return <>{children}</>;
  }

  // If subscription required and user lacks active subscription, redirect to pricing
  if (requireSubscription && !hasActiveSubscription) {
    return <Navigate to="/pricing" state={{ from: useLocation().pathname }} replace />;
  }

  // Grant access
  return <>{children}</>;
};

export default ProtectedRoute;