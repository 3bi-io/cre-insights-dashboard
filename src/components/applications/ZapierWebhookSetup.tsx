
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, CheckCircle, AlertCircle, List } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import WebhookTestSection from './WebhookTestSection';
import QuickFixGuide from './QuickFixGuide';

const ZapierWebhookSetup = () => {
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
    },
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Text copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
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
              <Input 
                value={webhookUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToClipboard(webhookUrl)}
              >
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
                {jobListings.map((job) => (
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

      {/* Field Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Data Requirements (Simplified)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium">Required Fields:</span>
            </div>
            <div className="ml-6 space-y-2">
              <p className="text-sm text-muted-foreground">
                • <code className="bg-gray-100 px-2 py-1 rounded text-xs">job_title</code> (any job title - will auto-create if needed)
              </p>
              <p className="text-sm text-muted-foreground">
                • <code className="bg-gray-100 px-2 py-1 rounded text-xs">email</code> (applicant's email address)
              </p>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Optional Fields:</span>
            </div>
            <div className="ml-6 text-sm text-muted-foreground">
              <code className="bg-gray-100 px-2 py-1 rounded text-xs mr-2">first_name</code>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs mr-2">last_name</code>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs mr-2">source</code>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">✅ Quick Fix Applied!</h4>
            <p className="text-sm text-green-700">
              The webhook now automatically creates job listings if they don't exist, 
              uses flexible field matching, and provides much better error messages to help debug any issues.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Testing Section */}
      <WebhookTestSection webhookUrl={webhookUrl} jobListings={jobListings || []} />
    </div>
  );
};

export default ZapierWebhookSetup;
