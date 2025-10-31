/**
 * Offline Fallback Page
 * Shown when the user is offline and the requested page is not cached
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff, RefreshCw, Home, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Offline: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <WifiOff className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">You're Offline</CardTitle>
          <CardDescription>
            It looks like you've lost your internet connection. Some features may not be available.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isOnline && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Connection restored! You can now reload the page.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Don't worry - once you're back online, everything will work normally. 
              Some cached pages may still be available offline.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleRetry} className="flex-1" disabled={!isOnline}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {isOnline ? 'Reload Page' : 'Waiting for Connection...'}
            </Button>
            <Button variant="outline" onClick={handleGoHome} className="flex-1">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-semibold text-sm mb-2">Troubleshooting Tips:</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Check your WiFi or mobile data connection</li>
              <li>Try turning airplane mode off and on</li>
              <li>Restart your router if using WiFi</li>
              <li>Check if other websites are working</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Offline;
