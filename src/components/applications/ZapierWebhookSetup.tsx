
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ZapierWebhookSetup = () => {
  const [testData, setTestData] = useState('');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const { toast } = useToast();

  const webhookUrl = `https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/zapier-webhook`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Webhook URL copied to clipboard",
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

  const samplePayload = {
    job_listing_id: "your-job-listing-id",
    applicant_name: "John Doe",
    applicant_email: "john.doe@example.com",
    source: "LinkedIn",
    status: "pending"
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
                  Use the URL above and send data in the format shown below
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium">Required Data Format</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="text-sm overflow-x-auto">
              {JSON.stringify(samplePayload, null, 2)}
            </pre>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium">Required:</span>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">job_listing_id</code>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Optional:</span>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                applicant_name, applicant_email, source, status
              </code>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium">Test Webhook</h3>
          <textarea
            className="w-full h-32 p-3 border rounded-lg font-mono text-sm"
            placeholder="Paste your test JSON data here..."
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
