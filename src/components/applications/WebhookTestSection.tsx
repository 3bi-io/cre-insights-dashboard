
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface WebhookTestSectionProps {
  webhookUrl: string;
  jobListings: any[];
}

const WebhookTestSection = ({ webhookUrl, jobListings }: WebhookTestSectionProps) => {
  const [testData, setTestData] = useState('');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const { toast } = useToast();

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

  const generateZapierStylePayload = (jobId: string, jobTitle: string) => {
    // This mimics how Zapier might send data with numbered field names
    return {
      "301909100__job_listing_id": jobId,
      "301909100__job_title": jobTitle,
      "301909100__email": "jane.smith@example.com",
      "301909100__first_name": "Jane",
      "301909100__last_name": "Smith",
      "301909100__source": "Zapier Form"
    };
  };

  const testWebhook = async (payload: any) => {
    setIsTestingWebhook(true);
    setTestResult(null);
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      setTestResult({ success: response.ok, data: result, status: response.status });

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
      const errorResult = { success: false, error: "Network error", message: error.message };
      setTestResult(errorResult);
      toast({
        title: "Network Error",
        description: "Failed to connect to webhook endpoint",
        variant: "destructive",
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const testCustomData = async () => {
    if (!testData.trim()) {
      toast({
        title: "Error",
        description: "Please enter test data first",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = JSON.parse(testData);
      await testWebhook(payload);
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please check your JSON format",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Test Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Tests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {jobListings && jobListings.length > 0 ? (
            <div className="grid gap-2">
              {jobListings.slice(0, 3).map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {job.title || job.job_title || 'Untitled Job'}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">ID: {job.id}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testWebhook(generateSamplePayload(job.id, job.title || job.job_title))}
                      disabled={isTestingWebhook}
                    >
                      Test Normal
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testWebhook(generateZapierStylePayload(job.id, job.title || job.job_title))}
                      disabled={isTestingWebhook}
                    >
                      Test Zapier Style
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No job listings available for testing</p>
          )}
        </CardContent>
      </Card>

      {/* Custom Test Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Custom Test Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            className="w-full h-32 p-3 border rounded-lg font-mono text-sm"
            placeholder="Enter your custom JSON test data here..."
            value={testData}
            onChange={(e) => setTestData(e.target.value)}
          />
          <Button 
            onClick={testCustomData}
            disabled={isTestingWebhook}
            className="w-full"
          >
            {isTestingWebhook ? 'Testing...' : 'Test Custom Data'}
          </Button>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              )}
              Test Result
              <Badge variant={testResult.success ? "default" : "destructive"}>
                Status: {testResult.status || 'Error'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-64">
              {JSON.stringify(testResult.data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Field Mapping Help */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-500" />
            Supported Field Names
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Job Identification:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• job_listing_id, jobListingId, job_id</li>
                <li>• job_title, jobTitle, title, position</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Applicant Info:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• email, applicant_email, email_address</li>
                <li>• first_name, firstName, fname</li>
                <li>• last_name, lastName, lname</li>
                <li>• applicant_name, name, full_name</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> The webhook now supports multiple field name variations, 
              so it should work with most Zapier field mappings automatically.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebhookTestSection;
