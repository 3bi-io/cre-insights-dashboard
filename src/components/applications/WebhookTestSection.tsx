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
const WebhookTestSection = ({
  webhookUrl,
  jobListings
}: WebhookTestSectionProps) => {
  const [testData, setTestData] = useState('');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const {
    toast
  } = useToast();
  const generateSamplePayload = (jobId: string, jobTitle: string) => {
    return {
      job_listing_id: jobId,
      job_title: jobTitle,
      first_name: "John",
      last_name: "Doe",
      full_name: "John Doe",
      applicant_email: "john.doe@example.com",
      email: "john.doe@example.com",
      phone: "(555) 123-4567",
      source: "LinkedIn",
      status: "pending",
      cover_letter: "I am very interested in this position...",
      resume_url: "https://example.com/resume.pdf",
      linkedin_url: "https://www.linkedin.com/in/johndoe"
    };
  };
  const generateZapierStylePayload = (jobId: string, jobTitle: string) => {
    return {
      "301909100__job_listing_id": jobId,
      "301909100__job_title": jobTitle,
      "301909100__email": "jane.smith@example.com",
      "301909100__first_name": "Jane",
      "301909100__last_name": "Smith",
      "301909100__full_name": "Jane Smith",
      "301909100__phone": "(555) 987-6543",
      "301909100__source": "Zapier Form",
      "301909100__cover_letter": "Looking forward to hearing from you...",
      "301909100__linkedin_url": "https://www.linkedin.com/in/janesmith"
    };
  };
  const testWebhook = async (payload: any) => {
    setIsTestingWebhook(true);
    setTestResult(null);
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      setTestResult({
        success: response.ok,
        data: result,
        status: response.status
      });
      if (response.ok) {
        toast({
          title: "Success!",
          description: "Webhook test successful - application created"
        });
      } else {
        toast({
          title: "Webhook Error",
          description: result.error || "Failed to process webhook",
          variant: "destructive"
        });
      }
    } catch (error) {
      const errorResult = {
        success: false,
        error: "Network error",
        message: error.message
      };
      setTestResult(errorResult);
      toast({
        title: "Network Error",
        description: "Failed to connect to webhook endpoint",
        variant: "destructive"
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
        variant: "destructive"
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
        variant: "destructive"
      });
    }
  };
  return <div className="space-y-6">
      {/* Quick Test Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Tests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {jobListings && jobListings.length > 0 ? <div className="grid gap-2">
              {jobListings.slice(0, 3).map(job => <div key={job.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {job.title || job.job_title || 'Untitled Job'}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">ID: {job.id}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => testWebhook(generateSamplePayload(job.id, job.title || job.job_title))} disabled={isTestingWebhook}>
                      Test Enhanced
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => testWebhook(generateZapierStylePayload(job.id, job.title || job.job_title))} disabled={isTestingWebhook}>
                      Test Zapier Style
                    </Button>
                  </div>
                </div>)}
            </div> : <div className="text-center py-4">
              <p className="text-gray-500 mb-2">No job listings available for testing</p>
              <p className="text-sm text-green-600">✅ Don't worry! The webhook will create job listings automatically if they don't exist.</p>
            </div>}
        </CardContent>
      </Card>

      {/* Custom Test Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Custom Test Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea className="w-full h-32 p-3 border rounded-lg font-mono text-sm" placeholder='Enter your custom JSON test data here...' value={testData} onChange={e => setTestData(e.target.value)} />
          <Button onClick={testCustomData} disabled={isTestingWebhook} className="w-full">
            {isTestingWebhook ? 'Testing...' : 'Test Custom Data'}
          </Button>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResult && <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {testResult.success ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertTriangle className="w-5 h-5 text-red-500" />}
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
        </Card>}

      {/* Field Mapping Help */}
      
    </div>;
};
export default WebhookTestSection;