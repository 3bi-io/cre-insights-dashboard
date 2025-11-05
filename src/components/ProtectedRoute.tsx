
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

  // Wait for ALL auth data to load - including userRole
  if (authLoading || subLoading || (user && userRole === null)) {
    console.log('[PROTECTED] Still loading:', { authLoading, subLoading, user: !!user, userRole });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  console.log('[PROTECTED] Auth state:', { 
    user: !!user, 
    userRole, 
    hasActiveSubscription, 
    authLoading, 
    subLoading 
  });

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Super admins bypass all checks
  if (userRole === 'super_admin') {
    console.log('[PROTECTED] Super admin access granted');
    return <>{children}</>;
  }

  // If subscription required and user lacks active subscription, redirect to pricing
  if (requireSubscription && !hasActiveSubscription) {
    console.log('[PROTECTED] Redirecting to pricing - no active subscription');
    return <Navigate to="/pricing" state={{ from: useLocation().pathname }} replace />;
  }

  // Grant access
  console.log('[PROTECTED] Access granted');
  return <>{children}</>;
};

export default ProtectedRoute;
