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

const EveryTruckJobPlatformActions = () => {
  const [feedUrl, setFeedUrl] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      const baseUrl = 'https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/job-feed-xml';
      const url = `${baseUrl}?platform=everytruckjob&user_id=${user.id}`;
      setFeedUrl(url);
      checkConnectionStatus();
    }
  }, [user]);

  const checkConnectionStatus = async () => {
    setConnectionStatus('checking');
    try {
      const { data, error } = await supabase.functions.invoke('trucking-platform-integration', {
        body: { action: 'check_connection', platform: 'everytruckjob' }
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
          "Successfully connected to EveryTruckJob" : 
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
    window.open('https://www.everytruckjob.com/', '_blank');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-xl">EveryTruckJob</CardTitle>
              <p className="text-sm text-muted-foreground">Free CDL driver job platform</p>
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
                  ? "Your job feed is active and being syndicated to EveryTruckJob. CDL positions will reach experienced drivers."
                  : "Ready to syndicate your CDL driver positions to EveryTruckJob's driver network."}
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
              onClick={() => window.open('https://www.everytruckjob.com/employers', '_blank')}
              className="w-full"
            >
              Employer Portal
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">XML Feed URL for EveryTruckJob</label>
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
              Use this URL to automatically syndicate your CDL jobs to EveryTruckJob
            </p>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Platform Offline:</strong> EveryTruckJob.com is currently showing a 404 error and appears to be offline.
              This platform integration is temporarily disabled until the platform becomes available again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default EveryTruckJobPlatformActions;