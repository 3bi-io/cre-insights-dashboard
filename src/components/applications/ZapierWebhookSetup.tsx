
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, CheckCircle, AlertCircle, List } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ZapierWebhookSetup = () => {
  const [testData, setTestData] = useState('');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
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

  const testWebhook = async () => {
    if (!testData.trim()) {
      toast({
        title: "Error",
        description: "Please enter test data first",
        variant: "destructive",
      });
      return;
    }

    setIsTestingWebhook(true);
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: testData,
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Webhook test successful - application created",
        });
      } else {
        toast({
          title: "Webhook Error",
          description: result.error || "Failed to process webhook",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Network Error",
        description: "Failed to connect to webhook endpoint",
        variant: "destructive",
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const generateSamplePayload = (jobId: string, jobTitle: string) => {
    return {
      job_listing_id: jobId,
      job_title: jobTitle,
      applicant_name: "John Doe",
      first_name: "John",
      last_name: "Doe",
      applicant_email: "john.doe@example.com",
      email: "john.doe@example.com",
      source: "LinkedIn",
      status: "pending"
    };
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="w-5 h-5" />
          Zapier Webhook Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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

        {/* Available Job Listings */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <List className="w-5 h-5" />
            Available Job Listings
          </h3>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const payload = generateSamplePayload(
                            job.id, 
                            job.title || job.job_title || 'Untitled Job'
                          );
                          setTestData(JSON.stringify(payload, null, 2));
                        }}
                      >
                        Use This Job
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No job listings found. Create some job listings first.</p>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Click "Use This Job" to generate test data with the correct job ID
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium">Setup Instructions</h3>
          <div className="space-y-2">
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
                  Use the URL above and send data using one of the job IDs from the list above
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium">Required Data Format</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium">Required:</span>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">job_listing_id</code>
              <span className="text-sm text-muted-foreground">(Use an ID from the list above)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Optional:</span>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                first_name, last_name, applicant_email, email, source, status
              </code>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium">Test Webhook</h3>
          <textarea
            className="w-full h-32 p-3 border rounded-lg font-mono text-sm"
            placeholder="Click 'Use This Job' button above to generate test data, or paste your own JSON data here..."
            value={testData}
            onChange={(e) => setTestData(e.target.value)}
          />
          <Button 
            onClick={testWebhook}
            disabled={isTestingWebhook}
            className="w-full"
          >
            {isTestingWebhook ? 'Testing...' : 'Test Webhook'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ZapierWebhookSetup;
