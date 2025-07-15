import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, TrendingUp, BarChart3, Zap, AlertCircle } from 'lucide-react';
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
          <MessageCircle className="w-5 h-5 text-blue-500" />
          X Platform Actions
        </CardTitle>
        <CardDescription>
          Manage your X (Twitter) advertising campaigns and analytics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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