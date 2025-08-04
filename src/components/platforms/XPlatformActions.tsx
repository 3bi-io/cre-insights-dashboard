import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, TrendingUp, BarChart3, Zap, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

interface Platform {
  id: string;
  name: string;
  logo_url: string | null;
  api_endpoint: string | null;
  created_at: string;
}

interface XPlatformActionsProps {
  platform: Platform;
  onRefresh: () => void;
}

const XPlatformActions: React.FC<XPlatformActionsProps> = ({ platform, onRefresh }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const isXPlatform = platform.name.toLowerCase().includes('x') || 
                     platform.name.toLowerCase().includes('twitter');

  const handleTestConnection = async () => {
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

  const handleGetMetrics = async () => {
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('x-platform-integration', {
        body: { action: 'get_metrics' }
      });

      if (response.error) throw response.error;

      toast({
        title: "Metrics Retrieved",
        description: "Successfully fetched your X account metrics",
      });
    } catch (error) {
      console.error('Failed to get metrics:', error);
      toast({
        title: "Metrics Failed",
        description: "Unable to retrieve X metrics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isXPlatform) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <img 
            src="/lovable-uploads/4eb0ffa4-7d5c-437d-bf75-d16a985e6189.png" 
            alt="X" 
            className="w-5 h-5"
          />
          X Platform Actions
        </CardTitle>
        <CardDescription>
          Connect and manage your X (Twitter) advertising platform integration for job promotion and recruitment marketing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-sm font-medium">Campaigns</div>
            <div className="text-2xl font-bold text-blue-600">0</div>
          </div>
          
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <BarChart3 className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <div className="text-sm font-medium">Impressions</div>
            <div className="text-2xl font-bold text-green-600">0</div>
          </div>
          
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <Zap className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <div className="text-sm font-medium">Engagements</div>
            <div className="text-2xl font-bold text-purple-600">0</div>
          </div>

          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-orange-600" />
            <div className="text-sm font-medium">Status</div>
            <div className="text-xs text-orange-600">Not Connected</div>
          </div>
        </div>

        {/* Enhanced Integration Alert */}
        <Alert>
          <img 
            src="/lovable-uploads/4eb0ffa4-7d5c-437d-bf75-d16a985e6189.png" 
            alt="X" 
            className="w-4 h-4"
          />
          <AlertDescription>
            <strong>Enhanced Integration Available:</strong> X platform integration includes job promotion, 
            candidate engagement tracking, and recruitment marketing analytics. Connect your X Ads account to get started.
          </AlertDescription>
        </Alert>

        {/* Connection Actions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Test X API Connection</p>
              <p className="text-sm text-muted-foreground">
                Verify your X API credentials and connection status
              </p>
            </div>
            <Button 
              onClick={handleTestConnection}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test Connection'}
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Fetch X Metrics</p>
              <p className="text-sm text-muted-foreground">
                Retrieve campaign performance and engagement metrics
              </p>
            </div>
            <Button 
              onClick={handleGetMetrics}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Get Metrics'}
            </Button>
          </div>
        </div>

        {/* Setup Instructions */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">X Integration Setup:</p>
              <div className="text-sm space-y-1">
                <p>1. Create an X Developer account and app</p>
                <p>2. Generate API keys and access tokens</p>
                <p>3. Configure authentication in platform settings</p>
                <p>4. Enable recruitment marketing campaigns</p>
              </div>
            </div>
          </AlertDescription>
        </Alert>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">API Connection</span>
              <Badge variant={platform.api_endpoint ? 'default' : 'secondary'}>
                {platform.api_endpoint ? 'Connected' : 'Not Setup'}
              </Badge>
            </div>
            <Button 
              onClick={handleTestConnection}
              disabled={isLoading || !platform.api_endpoint}
              variant="outline" 
              size="sm"
              className="w-full"
            >
              <Zap className="w-4 h-4 mr-2" />
              {isLoading ? 'Testing...' : 'Test Connection'}
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Analytics</span>
              <Badge variant="outline">
                <TrendingUp className="w-3 h-3 mr-1" />
                Live Data
              </Badge>
            </div>
            <Button 
              onClick={handleGetMetrics}
              disabled={isLoading || !platform.api_endpoint}
              variant="outline" 
              size="sm"
              className="w-full"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              {isLoading ? 'Loading...' : 'Get Metrics'}
            </Button>
          </div>
        </div>

        {!platform.api_endpoint && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-200">Setup Required</p>
              <p className="text-amber-700 dark:text-amber-300">
                Configure your X API credentials to enable these features.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default XPlatformActions;