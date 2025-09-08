import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  MessageCircle, 
  Zap, 
  Key, 
  AlertCircle, 
  CheckCircle, 
  ExternalLink,
  Settings,
  RefreshCw,
  TestTube
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { usePlatforms } from '@/hooks/usePlatforms';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const IntegrationsTab = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [zapierEnabled, setZapierEnabled] = useState(false);
  const { toast } = useToast();
  const { platforms, refetch } = usePlatforms();
  const queryClient = useQueryClient();

  // Fetch existing webhook configuration
  const { data: webhookConfig } = useQuery({
    queryKey: ['webhook-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_configurations')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  // Set webhook URL from config when loaded
  React.useEffect(() => {
    if (webhookConfig?.webhook_url) {
      setWebhookUrl(webhookConfig.webhook_url);
      setZapierEnabled(webhookConfig.enabled);
    }
  }, [webhookConfig]);

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

  const handleSaveZapier = async () => {
    setIsLoading(true);
    try {
      if (webhookConfig?.id) {
        // Update existing config
        const { error } = await supabase
          .from('webhook_configurations')
          .update({ 
            webhook_url: webhookUrl, 
            enabled: zapierEnabled,
            updated_at: new Date().toISOString() 
          })
          .eq('id', webhookConfig.id);
        if (error) throw error;
      } else {
        // Create new config
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        
        const { error } = await supabase
          .from('webhook_configurations')
          .insert({ 
            webhook_url: webhookUrl,
            enabled: zapierEnabled,
            user_id: user.id
          });
        if (error) throw error;
      }
      
      queryClient.invalidateQueries({ queryKey: ['webhook-config'] });
      
      toast({
        title: "Zapier Configuration Saved",
        description: "Your webhook URL has been saved and will automatically receive new application data",
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: "Unable to save Zapier configuration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestZapier = async () => {
    if (!webhookUrl) {
      toast({
        title: "No Webhook URL",
        description: "Please enter a Zapier webhook URL first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Get a sample application to send in the test
      const { data: applications } = await supabase
        .from('applications')
        .select('*')
        .limit(1)
        .maybeSingle();

      const testPayload = applications || {
        test: true,
        timestamp: new Date().toISOString(),
        source: "Settings Integration Test",
        // Sample application structure
        id: "sample-id",
        first_name: "John",
        last_name: "Doe",
        applicant_email: "john.doe@example.com",
        phone: "+1234567890",
        status: "pending",
        applied_at: new Date().toISOString()
      };

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify(testPayload),
      });

      toast({
        title: "Test Webhook Sent",
        description: "Check your Zapier history to verify the webhook was received with application data",
      });
    } catch (error) {
      console.error('Webhook test failed:', error);
      toast({
        title: "Test Failed",
        description: "Unable to send test webhook",
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
                  <a href="/dashboard/platforms">
                    <Settings className="w-3 h-3 mr-1" />
                    Go to Platforms
                  </a>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Zapier Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-500" />
            Zapier Integration
          </CardTitle>
          <CardDescription>
            Connect with Zapier to automate workflows and trigger actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="zapier-enabled">Enable Zapier Integration</Label>
              <p className="text-sm text-muted-foreground">
                Allow this application to send data to your Zapier workflows
              </p>
            </div>
            <Switch
              id="zapier-enabled"
              checked={zapierEnabled}
              onCheckedChange={setZapierEnabled}
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <Label htmlFor="webhook-url">Zapier Webhook URL</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Enter your Zapier webhook URL to automatically receive complete application data when new applications are submitted
              </p>
              <Input
                id="webhook-url"
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                disabled={!zapierEnabled}
              />
            </div>

            {zapierEnabled && webhookUrl && (
              <div className="flex gap-2">
                <Button 
                  onClick={handleTestZapier}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  <TestTube className="w-3 h-3 mr-1" />
                  {isLoading ? 'Testing...' : 'Test Webhook'}
                </Button>
                
                <Button 
                  onClick={handleSaveZapier}
                  disabled={isLoading}
                  size="sm"
                >
                  {isLoading ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            )}
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-800 dark:text-blue-200">How to set up Zapier for application data</p>
                <ol className="text-blue-700 dark:text-blue-300 mt-1 ml-4 list-decimal space-y-1">
                  <li>Create a new Zap in Zapier</li>
                  <li>Choose "Webhooks by Zapier" as the trigger</li>
                  <li>Select "Catch Hook" as the trigger event</li>
                  <li>Copy the webhook URL and paste it above</li>
                  <li>Your webhook will receive complete application data including all fields from the applications table</li>
                </ol>
                <Button variant="outline" size="sm" className="mt-2" asChild>
                  <a href="https://zapier.com" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Open Zapier
                  </a>
                </Button>
              </div>
            </div>
          </div>
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
    </div>
  );
};

export default IntegrationsTab;