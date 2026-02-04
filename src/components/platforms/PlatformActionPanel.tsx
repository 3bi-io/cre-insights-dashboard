import React, { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PLATFORM_CONFIGS } from '@/features/platforms/constants/platformConfigs';

// Lazy load platform action components
const MetaPlatformActions = React.lazy(() => import('./MetaPlatformActions'));
const IndeedPlatformActions = React.lazy(() => import('./IndeedPlatformActions'));
const GoogleJobsPlatformActions = React.lazy(() => import('./GoogleJobsPlatformActions'));
const XPlatformActions = React.lazy(() => import('./XPlatformActions'));
const ZipRecruiterPlatformActions = React.lazy(() => import('./ZipRecruiterPlatformActions'));
const TalrooPlatformActions = React.lazy(() => import('./TalrooPlatformActions'));
const AdzunaPlatformActions = React.lazy(() => import('./AdzunaPlatformActions'));
const CraigslistPlatformActions = React.lazy(() => import('./CraigslistPlatformActions'));
const GlassdoorPlatformActions = React.lazy(() => import('./GlassdoorPlatformActions'));
const SimplyHiredPlatformActions = React.lazy(() => import('./SimplyHiredPlatformActions'));
const TruckDriverJobs411PlatformActions = React.lazy(() => import('./TruckDriverJobs411PlatformActions'));

interface PlatformActionPanelProps {
  platformName: string;
  onRefresh?: () => void;
}

const LoadingSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-72" />
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </CardContent>
  </Card>
);

const PlatformActionPanel: React.FC<PlatformActionPanelProps> = ({ 
  platformName, 
  onRefresh = () => {} 
}) => {
  const normalizedName = platformName.toLowerCase().trim();
  
  // Find platform config for additional context
  const platformConfig = PLATFORM_CONFIGS.find(
    p => p.name.toLowerCase() === normalizedName
  );
  
  // Create a mock platform object for components that need it
  const mockPlatform = {
    id: `platform-${normalizedName}`,
    name: platformConfig?.name || platformName,
    api_endpoint: '', // Will be determined by each component
  };

  const renderPlatformComponent = () => {
    switch (normalizedName) {
      case 'meta':
      case 'facebook':
      case 'instagram':
        return <MetaPlatformActions platform={mockPlatform} onRefresh={onRefresh} />;
      
      case 'indeed':
        return <IndeedPlatformActions />;
      
      case 'google jobs':
      case 'googlejobs':
        return <GoogleJobsPlatformActions />;
      
      case 'x':
      case 'twitter':
        return <XPlatformActions platform={{ ...mockPlatform, logo_url: null, created_at: '' }} onRefresh={onRefresh} />;
      
      case 'ziprecruiter':
        return <ZipRecruiterPlatformActions />;
      
      case 'talroo':
        return <TalrooPlatformActions />;
      
      case 'adzuna':
        return <AdzunaPlatformActions />;
      
      case 'craigslist':
        return <CraigslistPlatformActions />;
      
      case 'glassdoor':
        return <GlassdoorPlatformActions />;
      
      case 'simplyhired':
        return <SimplyHiredPlatformActions />;
      
      case 'truck driver jobs 411':
      case 'truckdriverjobs411':
        return <TruckDriverJobs411PlatformActions />;
      
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Platform Not Found</CardTitle>
              <CardDescription>
                No action panel available for "{platformName}"
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This platform may not have a dedicated action panel yet, or it uses XML/RSS feeds 
                for job distribution. Check the Overview tab for feed URLs.
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      {renderPlatformComponent()}
    </Suspense>
  );
};

export default PlatformActionPanel;
