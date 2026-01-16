import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const LOADING_TIMEOUT_MS = 15000; // 15 seconds max loading time

/**
 * ProtectedRoute - ensures user is authenticated
 * Simply checks authentication - all features are available to authenticated users
 * Includes timeout protection to prevent infinite loading states
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading: authLoading, userRole } = useAuth();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Wait for auth data to load
  const isLoading = authLoading || (user && userRole === null);

  // Add timeout protection to prevent infinite loading
  useEffect(() => {
    if (!isLoading) {
      setLoadingTimeout(false);
      return;
    }

    const timer = setTimeout(() => {
      if (isLoading) {
        logger.error('Loading timeout reached after 15 seconds', {}, { context: 'PROTECTED_ROUTE' });
        setLoadingTimeout(true);
      }
    }, LOADING_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [isLoading]);

  // If loading timed out, redirect to auth
  if (loadingTimeout) {
    logger.error('Redirecting to /auth due to loading timeout', {}, { context: 'PROTECTED_ROUTE' });
    return <Navigate to="/auth" replace />;
  }
  
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

  return <>{children}</>;
};

export default ProtectedRoute;
