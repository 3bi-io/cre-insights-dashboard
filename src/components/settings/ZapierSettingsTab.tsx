import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Zap, Settings as SettingsIcon, AlertTriangle, Copy, ExternalLink, List } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import WebhookTestSection from '@/components/applications/WebhookTestSection';
import QuickFixGuide from '@/components/applications/QuickFixGuide';

const ZapierSettingsTab = () => {
  const { userRole } = useAuth();
  const { toast } = useToast();
  
  const webhookUrl = `https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/zapier-webhook`;

  // Fetch available job listings to help with setup
  const { data: jobListings } = useQuery({
    queryKey: ['job-listings-for-webhook'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_listings')
        .select('id, title, job_title')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    }
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Text copied to clipboard"
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  // Check if user has proper permissions
  if (userRole !== 'super_admin' && userRole !== 'admin') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <h3 className="font-medium">Access Restricted</h3>
              <p className="text-sm text-muted-foreground">
                You need admin or super admin permissions to access Zapier integrations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Zap className="w-6 h-6 text-primary" />
            Zapier Integrations
          </h2>
          <p className="text-muted-foreground mt-1">
            Automate your application workflow with Zapier webhooks and triggers
            {userRole === 'super_admin' && (
              <span className="ml-2 text-primary font-medium">(Super Administrator View)</span>
            )}
          </p>
        </div>
        <div className="flex justify-end">
          <Badge variant="secondary" className="flex items-center gap-1">
            <SettingsIcon className="w-3 h-3" />
            Integration Settings
          </Badge>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      <div className="w-full space-y-6">
        <QuickFixGuide />

        {/* Webhook URL */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5" />
              Zapier Webhook Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Webhook URL</h3>
              <div className="flex gap-2">
                <Input value={webhookUrl} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(webhookUrl)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Use this URL as your webhook endpoint in Zapier
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Available Job Listings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="w-5 h-5" />
              Available Job Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
              {jobListings && jobListings.length > 0 ? (
                <div className="space-y-3">
                  {jobListings.map(job => (
                    <div key={job.id} className="bg-white p-3 rounded border">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">
                            {job.title || job.job_title || 'Untitled Job'}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            ID: {job.id}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-2">No job listings found.</p>
                  <p className="text-sm text-green-600">✅ Don't worry! The webhook will now create job listings automatically if they don't exist.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">1</Badge>
                <div>
                  <p className="font-medium">Create a Zap in Zapier</p>
                  <p className="text-sm text-muted-foreground">
                    Set up your trigger (e.g., new form submission, email, etc.)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">2</Badge>
                <div>
                  <p className="font-medium">Add Webhook Action</p>
                  <p className="text-sm text-muted-foreground">
                    Choose "Webhooks by Zapier" and select "POST" method
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">3</Badge>
                <div>
                  <p className="font-medium">Configure the Webhook</p>
                  <p className="text-sm text-muted-foreground">
                    Use the URL above. Just map <strong>job_title</strong> and <strong>email</strong> - that's all you need!
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">4</Badge>
                <div>
                  <p className="font-medium">Test Your Integration</p>
                  <p className="text-sm text-muted-foreground">
                    Use the testing tools below to verify your webhook works correctly
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Testing Section */}
        <WebhookTestSection webhookUrl={webhookUrl} jobListings={jobListings || []} />
      </div>

      {/* Additional Information */}
      <Card>
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
  );
};

export default ZapierSettingsTab;