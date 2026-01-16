import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ExternalLink, Copy, Eye, CheckCircle2, AlertCircle, Truck } from 'lucide-react';
import { logger } from '@/lib/logger';

const TruckDriverJobs411PlatformActions = () => {
  const [feedUrl, setFeedUrl] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      const baseUrl = 'https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/job-feed-xml';
      const url = `${baseUrl}?platform=truck-driver-jobs-411&user_id=${user.id}`;
      setFeedUrl(url);
      checkConnectionStatus();
    }
  }, [user]);

  const checkConnectionStatus = async () => {
    setConnectionStatus('checking');
    try {
      const { data, error } = await supabase.functions.invoke('trucking-platform-integration', {
        body: { action: 'check_connection', platform: 'truck-driver-jobs-411' }
      });

      if (error) throw error;
      
      setConnectionStatus(data.connected ? 'connected' : 'error');
    } catch (error) {
      logger.error('Connection check failed:', error);
      setConnectionStatus('error');
    }
  };

  const testConnection = async () => {
    setIsLoading(true);
    try {
      await checkConnectionStatus();
      toast({
        title: "Connection Test Complete",
        description: connectionStatus === 'connected' ? 
          "Successfully connected to Truck Driver Jobs 411" : 
          "Connection test completed. Check status above.",
      });
    } catch (error) {
      toast({
        title: "Connection Test Failed",
        description: "Unable to test connection to platform",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyFeedUrl = () => {
    navigator.clipboard.writeText(feedUrl);
    toast({
      title: "Copied!",
      description: "Feed URL copied to clipboard",
    });
  };

  const openFeed = () => {
    window.open(feedUrl, '_blank');
  };

  const openPlatformInfo = () => {
    window.open('https://www.truckdriverjobs411.com/', '_blank');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl">Truck Driver Jobs 411</CardTitle>
              <p className="text-sm text-muted-foreground">Free CDL-focused job posting platform</p>
            </div>
          </div>
          <div className="ml-auto flex items-center space-x-2">
            {connectionStatus === 'checking' && (
              <Badge variant="outline" className="animate-pulse">
                Checking...
              </Badge>
            )}
            {connectionStatus === 'connected' && (
              <Badge className="bg-green-500 hover:bg-green-600">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            )}
            {connectionStatus === 'error' && (
              <Badge variant="destructive">
                <AlertCircle className="w-3 h-3 mr-1" />
                Disconnected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {connectionStatus && (
            <Alert className={connectionStatus === 'connected' ? 'border-green-200 dark:border-green-800' : 'border-orange-200 dark:border-orange-800'}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {connectionStatus === 'connected' 
                  ? "Your job feed is active and being syndicated to Truck Driver Jobs 411. CDL jobs will reach qualified truck drivers."
                  : "Ready to syndicate CDL jobs to Truck Driver Jobs 411's network of truck drivers."}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <Button 
              onClick={testConnection} 
              disabled={isLoading}
              className="w-full"
            >
              Test Connection
            </Button>
            <Button 
              variant="outline" 
              onClick={openPlatformInfo}
              className="w-full"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Platform Info
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open('https://www.truckdriverjobs411.com/post-job', '_blank')}
              className="w-full"
            >
              Post Manually
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">XML Feed URL for Truck Driver Jobs 411</label>
            <div className="flex space-x-2">
              <Input 
                value={feedUrl} 
                readOnly 
                className="flex-1 bg-muted"
              />
              <Button size="sm" variant="outline" onClick={copyFeedUrl}>
                <Copy className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={openFeed}>
                <Eye className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use this URL to syndicate your CDL jobs to Truck Driver Jobs 411
            </p>
          </div>

          <Alert>
            <Truck className="h-4 w-4" />
            <AlertDescription>
              <strong>CDL-Optimized Integration:</strong> This platform specializes in CDL truck driver positions. 
              Jobs with CDL requirements, route types (OTR, Regional, Local), and truck specifications will perform best.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default TruckDriverJobs411PlatformActions;