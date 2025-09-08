import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Settings, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ZapierWebhookSetup from '@/components/applications/ZapierWebhookSetup';
import PageLayout from '@/components/PageLayout';

const ZapierIntegrations = () => {
  const { userRole } = useAuth();

  // Check if user has proper permissions
  if (userRole !== 'super_admin' && userRole !== 'admin') {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You need admin or super admin permissions to access Zapier integrations.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <PageLayout 
      title="Zapier Integrations" 
      description="Connect your applications with Zapier workflows and automations"
    >
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Zap className="w-8 h-8 text-primary" />
              Zapier Integrations
            </h1>
            <p className="text-muted-foreground mt-1">
              Automate your application workflow with Zapier webhooks and triggers
              {userRole === 'super_admin' && (
                <span className="ml-2 text-primary font-medium">(Super Administrator View)</span>
              )}
            </p>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Settings className="w-3 h-3" />
            Integration Settings
          </Badge>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Webhook Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Active</div>
              <p className="text-xs text-muted-foreground">Ready to receive data</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Integration Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">HTTP POST</div>
              <p className="text-xs text-muted-foreground">Real-time webhook</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Data Format</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">JSON</div>
              <p className="text-xs text-muted-foreground">Structured application data</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Integration Content */}
        <ZapierWebhookSetup />

        {/* Additional Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Integration Benefits</CardTitle>
            <CardDescription>Why connect your applications with Zapier?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Automation Capabilities</h4>
                <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                  <li>Automatically send applications to your CRM</li>
                  <li>Trigger email notifications for new applications</li>
                  <li>Create tasks in project management tools</li>
                  <li>Send data to Google Sheets or databases</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Supported Platforms</h4>
                <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                  <li>Salesforce, HubSpot, and other CRMs</li>
                  <li>Gmail, Outlook, and email platforms</li>
                  <li>Slack, Microsoft Teams for notifications</li>
                  <li>Google Workspace and Microsoft 365</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default ZapierIntegrations;