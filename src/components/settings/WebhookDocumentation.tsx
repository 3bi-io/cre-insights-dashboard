import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  AlertCircle, 
  Webhook,
  Code,
  Settings,
  Send,
  Database,
  Shield,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

const WebhookDocumentation = () => {
  const { toast } = useToast();
  
  const webhookUrl = `https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/inbound-applications`;

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

  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // Set font and add content
    doc.setFontSize(18);
    doc.text('WEBHOOK CONFIGURATION GUIDE', 20, 20);
    
    doc.setFontSize(12);
    let yPos = 40;
    
    // Introduction
    doc.text('This guide explains how to configure webhooks to automatically', 20, yPos);
    doc.text('send applicant data to your application management system.', 20, yPos + 10);
    yPos += 30;
    
    // Webhook Endpoint
    doc.setFontSize(14);
    doc.text('WEBHOOK ENDPOINT', 20, yPos);
    doc.setFontSize(12);
    yPos += 15;
    doc.text(`URL: ${webhookUrl}`, 20, yPos);
    doc.text('Method: POST', 20, yPos + 10);
    doc.text('Content-Type: application/json', 20, yPos + 20);
    yPos += 40;
    
    // Setup Instructions
    doc.setFontSize(14);
    doc.text('SETUP INSTRUCTIONS', 20, yPos);
    doc.setFontSize(12);
    yPos += 15;
    
    doc.text('Step 1: Create Webhook Integration', 20, yPos);
    doc.text('• Log into your webhook provider (Make.com, n8n, etc.)', 25, yPos + 10);
    doc.text('• Create a new automation workflow', 25, yPos + 20);
    doc.text('• Set your trigger (form submission, email, etc.)', 25, yPos + 30);
    yPos += 50;
    
    doc.text('Step 2: Configure Webhook Action', 20, yPos);
    doc.text('• Add "Webhooks" or "HTTP Request" action', 25, yPos + 10);
    doc.text('• Set method to POST', 25, yPos + 20);
    doc.text('• Use the webhook URL provided above', 25, yPos + 30);
    doc.text('• Set Content-Type header to application/json', 25, yPos + 40);
    yPos += 60;
    
    doc.text('Step 3: Map Data Fields', 20, yPos);
    doc.text('Map your source data to the required fields in the payload.', 25, yPos + 10);
    yPos += 30;
    
    // Add new page for remaining content
    doc.addPage();
    yPos = 20;
    
    // Data Field Requirements
    doc.setFontSize(14);
    doc.text('DATA FIELD REQUIREMENTS', 20, yPos);
    doc.setFontSize(12);
    yPos += 15;
    
    doc.text('Required Fields:', 20, yPos);
    doc.text('• job_title: The position applying for', 25, yPos + 10);
    doc.text('• email: Valid email address', 25, yPos + 20);
    yPos += 40;
    
    doc.text('Optional Fields:', 20, yPos);
    doc.text('• first_name, last_name, phone, city, state, zip', 25, yPos + 10);
    doc.text('• age, veteran, cdl, exp, drug, consent, source', 25, yPos + 20);
    yPos += 40;
    
    doc.text('Field Value Guidelines:', 20, yPos);
    doc.text('• Boolean fields: "yes" or "no"', 25, yPos + 10);
    doc.text('• Experience: "Less than 3 months", etc.', 25, yPos + 20);
    doc.text('• Source: Any descriptive text', 25, yPos + 30);
    yPos += 50;
    
    // Sample JSON (simplified)
    doc.setFontSize(14);
    doc.text('SAMPLE JSON PAYLOAD', 20, yPos);
    doc.setFontSize(10);
    yPos += 15;
    doc.text('{', 20, yPos);
    doc.text('  "job_title": "CDL Driver",', 20, yPos + 8);
    doc.text('  "email": "john@example.com",', 20, yPos + 16);
    doc.text('  "first_name": "John",', 20, yPos + 24);
    doc.text('  "phone": "555-1234"', 20, yPos + 32);
    doc.text('}', 20, yPos + 40);
    
    // Save the PDF
    doc.save('webhook-configuration-guide.pdf');
    
    toast({
      title: "PDF Downloaded",
      description: "Webhook configuration guide downloaded successfully",
    });
  };

  const samplePayload = `{
  "job_title": "CDL Driver - Regional Routes",
  "email": "john.doe@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1-555-123-4567",
  "city": "Salt Lake City",
  "state": "UT",
  "zip": "84101",
  "age": "yes",
  "veteran": "no",
  "cdl": "yes",
  "exp": "More than 3 months",
  "drug": "yes",
  "consent": "yes",
  "source": "Company Website"
}`;

  const curlExample = `curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -d '${samplePayload}'`;

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Webhook Configuration Guide
            </CardTitle>
            <Button 
              variant="outline" 
              onClick={downloadPDF}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PDF Guide
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            This guide explains how to configure webhooks to automatically send applicant data 
            to your application management system. Follow these instructions to integrate with 
            third-party services like Make.com, n8n, or custom applications.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Prerequisites</h4>
                <p className="text-sm text-blue-800">
                  Ensure you have administrative access to your webhook provider 
                  (Make.com, n8n, etc.) and understand basic webhook concepts.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Webhook Endpoint */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="w-5 h-5" />
            Webhook Endpoint
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Endpoint URL</label>
            <div className="flex gap-2 mt-1">
              <div className="flex-1 p-3 bg-gray-50 rounded-lg border font-mono text-sm break-all">
                {webhookUrl}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToClipboard(webhookUrl)}
                className="shrink-0"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Method:</span> POST
            </div>
            <div>
              <span className="font-medium">Content-Type:</span> application/json
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Required Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Required Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Step-by-step setup */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Badge variant="outline">Step 1</Badge>
                Create Webhook Integration
              </h4>
              <div className="ml-8 space-y-2">
                <p className="text-sm text-muted-foreground">
                  • Log into your webhook provider (Make.com, n8n, etc.)
                </p>
                <p className="text-sm text-muted-foreground">
                  • Create a new automation workflow
                </p>
                <p className="text-sm text-muted-foreground">
                  • Set your trigger (form submission, email, database update, etc.)
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Badge variant="outline">Step 2</Badge>
                Configure Webhook Action
              </h4>
              <div className="ml-8 space-y-2">
                <p className="text-sm text-muted-foreground">
                  • Add "Webhooks" or "HTTP Request" action
                </p>
                <p className="text-sm text-muted-foreground">
                  • Set method to <code className="bg-gray-100 px-1 rounded">POST</code>
                </p>
                <p className="text-sm text-muted-foreground">
                  • Use the webhook URL provided above
                </p>
                <p className="text-sm text-muted-foreground">
                  • Set Content-Type header to <code className="bg-gray-100 px-1 rounded">application/json</code>
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Badge variant="outline">Step 3</Badge>
                Map Data Fields
              </h4>
              <div className="ml-8">
                <p className="text-sm text-muted-foreground mb-3">
                  Map your source data to the required fields in the webhook payload.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Field Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Required Fields */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <h4 className="font-medium">Required Fields</h4>
              </div>
              <div className="space-y-3 ml-6">
                <div className="flex items-start gap-3">
                  <code className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs font-mono">job_title</code>
                  <div className="text-sm">
                    <p className="font-medium">Job Title</p>
                    <p className="text-muted-foreground">
                      The position the applicant is applying for. If the job doesn't exist, 
                      it will be created automatically.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <code className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs font-mono">email</code>
                  <div className="text-sm">
                    <p className="font-medium">Applicant Email</p>
                    <p className="text-muted-foreground">
                      Valid email address of the applicant. Used for identification and communication.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Optional Fields */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <h4 className="font-medium">Optional Fields</h4>
              </div>
              <div className="grid grid-cols-2 gap-4 ml-6">
                <div className="space-y-2">
                  <code className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-mono">first_name</code>
                  <code className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-mono">last_name</code>
                  <code className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-mono">phone</code>
                  <code className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-mono">city</code>
                  <code className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-mono">state</code>
                  <code className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-mono">zip</code>
                </div>
                <div className="space-y-2">
                  <code className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-mono">age</code>
                  <code className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-mono">veteran</code>
                  <code className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-mono">cdl</code>
                  <code className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-mono">exp</code>
                  <code className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-mono">drug</code>
                  <code className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-mono">source</code>
                </div>
              </div>
            </div>

            <Separator />

            {/* Field Values */}
            <div>
              <h4 className="font-medium mb-3">Expected Field Values</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">Boolean fields</span> (age, veteran, cdl, drug, consent): 
                  <code className="ml-2 bg-gray-100 px-1 rounded">"yes"</code> or 
                  <code className="ml-1 bg-gray-100 px-1 rounded">"no"</code>
                </div>
                <div>
                  <span className="font-medium">Experience (exp)</span>: 
                  <code className="ml-2 bg-gray-100 px-1 rounded">"Less than 3 months"</code>, 
                  <code className="ml-1 bg-gray-100 px-1 rounded">"More than 3 months"</code>, etc.
                </div>
                <div>
                  <span className="font-medium">Source</span>: Any descriptive text 
                  (e.g., "Company Website", "Indeed", "LinkedIn")
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sample Payload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Sample JSON Payload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Example of a complete webhook payload with all available fields:
            </p>
            <div className="relative">
              <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto border">
                <code>{samplePayload}</code>
              </pre>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToClipboard(samplePayload)}
                className="absolute top-2 right-2"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Testing Your Webhook
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Test your webhook configuration using cURL or a similar tool:
            </p>
            <div className="relative">
              <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto border">
                <code>{curlExample}</code>
              </pre>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToClipboard(curlExample)}
                className="absolute top-2 right-2"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900 mb-1">Testing Tips</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Use the Applications page to verify test data appears correctly</li>
                    <li>• Check the webhook logs in your provider's dashboard</li>
                    <li>• Test with both minimal (job_title + email) and complete payloads</li>
                    <li>• Verify applicant categorization (D, SC, SR, N/A) works as expected</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Considerations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900 mb-2">Important Security Notes</h4>
                  <ul className="text-sm text-red-800 space-y-1">
                    <li>• This webhook endpoint is publicly accessible</li>
                    <li>• Only send non-sensitive applicant data</li>
                    <li>• Consider implementing authentication if handling sensitive information</li>
                    <li>• Monitor webhook usage and implement rate limiting if needed</li>
                    <li>• Regularly review webhook logs for unusual activity</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <a href="/dashboard/applications" className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                View Applications
              </a>
            </Button>
            <Button variant="outline" onClick={() => copyToClipboard(webhookUrl)}>
              <Copy className="w-4 h-4 mr-2" />
              Copy Webhook URL
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebhookDocumentation;