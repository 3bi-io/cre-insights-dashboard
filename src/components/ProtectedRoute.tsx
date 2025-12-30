
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
  const { user, loading: authLoading, userRole, organization } = useAuth();
  const { hasActiveSubscription, loading: subLoading } = useSubscription();

  // Wait for auth data to load - also wait for organization when subscription is required (non-super-admin)
  // This prevents race condition where subscription check runs before organization data is loaded
  const needsOrgData = requireSubscription && user && userRole !== 'super_admin' && organization === undefined;
  const isLoading = authLoading || (user && userRole === null) || (requireSubscription && subLoading) || needsOrgData;
  
  if (isLoading) {
    console.log('[PROTECTED] Still loading:', { authLoading, subLoading, user: !!user, userRole, requireSubscription, hasOrg: !!organization });
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
    return <Navigate to="/pricing" state={{ from: location.pathname }} replace />;
  }

  // Grant access
  console.log('[PROTECTED] Access granted');
  return <>{children}</>;
};

export default ProtectedRoute;
