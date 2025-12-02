import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Key, 
  AlertCircle, 
  CheckCircle, 
  Settings,
  RefreshCw,
  TestTube
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { usePlatforms } from '@/hooks/usePlatforms';
import ClientWebhookManager from '@/components/integrations/ClientWebhookManager';

const IntegrationsTab = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { platforms, refetch } = usePlatforms();

  const xPlatform = platforms?.find(p => 
    p.name.toLowerCase().includes('x') || p.name.toLowerCase().includes('twitter')
  );

  const handleTestXConnection = async () => {
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('x-platform-integration', {
        body: { action: 'test_connection' }
      });

      if (response.error) throw response.error;

      toast({
        title: "Connection Successful",
        description: "X API connection is working correctly",
      });
    } catch (error) {
      console.error('Connection test failed:', error);
      toast({
        title: "Connection Failed",
        description: "Unable to connect to X API. Check your credentials.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshMetrics = async () => {
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('x-platform-integration', {
        body: { action: 'get_metrics' }
      });

      if (response.error) throw response.error;

      toast({
        title: "Metrics Updated",
        description: "Successfully refreshed your X account metrics",
      });
    } catch (error) {
      console.error('Failed to refresh metrics:', error);
      toast({
        title: "Metrics Failed",
        description: "Unable to retrieve X metrics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* X Platform Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/4eb0ffa4-7d5c-437d-bf75-d16a985e6189.png" 
              alt="X" 
              className="w-5 h-5"
            />
            X (Twitter) Platform
          </CardTitle>
          <CardDescription>
            Manage your X advertising platform integration and API connection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                xPlatform?.api_endpoint ? 'bg-green-500' : 'bg-yellow-500'
              }`} />
              <div>
                <p className="font-medium">API Status</p>
                <p className="text-sm text-muted-foreground">
                  {xPlatform?.api_endpoint ? 'Connected' : 'Not configured'}
                </p>
              </div>
            </div>
            <Badge variant={xPlatform?.api_endpoint ? 'default' : 'secondary'}>
              {xPlatform?.api_endpoint ? 'Active' : 'Setup Required'}
            </Badge>
          </div>

          {xPlatform?.api_endpoint ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={handleTestXConnection}
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <TestTube className="w-4 h-4" />
                {isLoading ? 'Testing...' : 'Test Connection'}
              </Button>
              
              <Button 
                onClick={handleRefreshMetrics}
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {isLoading ? 'Refreshing...' : 'Refresh Metrics'}
              </Button>
            </div>
          ) : (
            <div className="flex items-start gap-2 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">Setup Required</p>
                <p className="text-amber-700 dark:text-amber-300 mb-2">
                  Configure your X publisher in the Publishers section to enable API features.
                </p>
                <Button variant="outline" size="sm" asChild className="mt-2">
                  <Link to="/dashboard/platforms">
                    <Settings className="w-3 h-3 mr-1" />
                    Go to Platforms
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Keys & Secrets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-purple-500" />
            API Keys & Secrets
          </CardTitle>
          <CardDescription>
            Manage your API credentials and integration secrets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">X API Credentials</span>
                <Badge variant="outline">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Configured
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                API key, secret, access token, and access token secret for X platform integration
              </p>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">Security Notice</p>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    API keys and secrets are stored securely in Supabase Edge Functions. 
                    They are not accessible through the client application.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* Client Webhooks */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Client Webhooks</h2>
        <p className="text-muted-foreground mb-6">
          Configure outbound webhooks to automatically send application data to your clients' systems
        </p>
        <ClientWebhookManager />
      </div>

      <Separator className="my-8" />

      {/* Tenstreet Integration */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Tenstreet Integration</h2>
          <p className="text-muted-foreground mb-4">
            Full suite of Tenstreet tools for managing applicants, analytics, and bulk operations
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Xchange Manager</CardTitle>
              <CardDescription>
                Background checks, MVR, drug tests, and verifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link to="/admin/ats-command?tab=xchange">
                  Open Xchange
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Focus Analytics</CardTitle>
              <CardDescription>
                Application metrics, trends, and source performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link to="/admin/ats-command?tab=focus">
                  View Analytics
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bulk Operations</CardTitle>
              <CardDescription>
                Import, export, and sync applicant data in bulk
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link to="/admin/ats-command?tab=bulk">
                  Manage Data
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsTab;