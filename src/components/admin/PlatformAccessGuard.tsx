import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { usePlatformAccess } from '@/hooks/usePlatformAccess';
import { Lock, AlertTriangle } from 'lucide-react';
import { logger } from '@/lib/logger';

interface PlatformAccessGuardProps {
  platformName: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const PlatformAccessGuard: React.FC<PlatformAccessGuardProps> = ({
  platformName,
  children,
  fallback
}) => {
  const [hasAccess, setHasAccess] = useState<boolean>(true); // Default to true to avoid flash
  const [isLoading, setIsLoading] = useState(true);
  const { checkPlatformAccess } = usePlatformAccess();

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const access = await checkPlatformAccess(platformName);
        setHasAccess(access);
      } catch (error) {
        logger.error('Error checking platform access', error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [platformName, checkPlatformAccess]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Alert className="border-orange-200 dark:border-orange-800">
        <Lock className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <strong>Platform Access Restricted</strong>
            <p className="text-sm mt-1">
              This platform is not available for your organization. Contact your administrator for access.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};

export default PlatformAccessGuard;