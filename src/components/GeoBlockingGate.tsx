/**
 * Geo-Blocking Gate Component
 * Conditionally renders children or the blocked page based on geo-check result
 */

import React, { ReactNode } from 'react';
import { useGeoBlocking } from '@/contexts/GeoBlockingContext';
import { Loader2, Globe } from 'lucide-react';

interface GeoBlockingGateProps {
  children: ReactNode;
  blockedComponent?: ReactNode;
}

// Lazy load the blocked page to avoid bundle bloat for allowed users
const RegionBlockedPage = React.lazy(() => import('@/pages/RegionBlocked'));

const GeoCheckingSpinner: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
    <div className="relative">
      <Globe className="w-12 h-12 text-muted-foreground animate-pulse" />
      <Loader2 className="w-6 h-6 text-primary absolute -bottom-1 -right-1 animate-spin" />
    </div>
    <div className="text-center">
      <p className="text-sm font-medium text-foreground">Verifying access...</p>
      <p className="text-xs text-muted-foreground mt-1">Checking your location</p>
    </div>
  </div>
);

export const GeoBlockingGate: React.FC<GeoBlockingGateProps> = ({ 
  children, 
  blockedComponent 
}) => {
  const { isChecking, isBlocked } = useGeoBlocking();

  // NEVER block rendering while checking — render children immediately
  // and only block AFTER the check confirms the user is blocked.
  // This prevents public pages from showing loading spinners.
  if (isBlocked && !isChecking) {
    return (
      <React.Suspense fallback={<GeoCheckingSpinner />}>
        {blockedComponent || <RegionBlockedPage />}
      </React.Suspense>
    );
  }

  // Render children immediately (even while checking)
  return <>{children}</>;
};

export default GeoBlockingGate;
