import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Download, 
  Copy, 
  CheckCircle2,
  BookOpen,
  Code,
  Database,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ApiDocumentation = () => {
  const { toast } = useToast();
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const endpoints = {
    jobFeed: 'https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/google-jobs-xml?user_id=YOUR_USER_ID',
    applicationSubmit: 'https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/submit-application'
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedEndpoint(label);
      toast({
        title: 'Copied!',
        description: `${label} copied to clipboard`,
      });
      setTimeout(() => setCopiedEndpoint(null), 2000);
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const downloadSpec = (filename: string) => {
    const link = document.createElement('a');
    link.href = `/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Download Started',
      description: `Downloading ${filename}`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">API Documentation</h2>
        <p className="text-muted-foreground mt-2">
          XML feed specifications and API integration guides
        </p>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <BookOpen className="w-8 h-8 text-primary" />
              <Badge variant="outline">v1.0</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-lg mb-2">Job Feed Spec</CardTitle>
            <CardDescription className="mb-4">
              XML specification for incoming job listings from partners
            </CardDescription>
            <Button 
              onClick={() => downloadSpec('XML_FEED_SPECIFICATION.md')}
              variant="outline" 
              size="sm" 
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Database className="w-8 h-8 text-primary" />
              <Badge variant="outline">v1.0</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-lg mb-2">Application Feed Spec</CardTitle>
            <CardDescription className="mb-4">
              XML specification for submitting candidate applications
            </CardDescription>
            <Button 
              onClick={() => downloadSpec('APPLICATION_FEED_SPECIFICATION.md')}
              variant="outline" 
              size="sm" 
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Code className="w-8 h-8 text-primary" />
              <Badge variant="secondary">Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-lg mb-2">API Endpoints</CardTitle>
            <CardDescription className="mb-4">
              Live endpoints for integration and testing
            </CardDescription>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => {
                document.getElementById('endpoints-tab')?.click();
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Endpoints
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Documentation */}
      <Tabs defaultValue="job-feed" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="job-feed">
            <FileText className="w-4 h-4 mr-2" />
            Job Feed
          </TabsTrigger>
          <TabsTrigger value="application-feed">
            <Database className="w-4 h-4 mr-2" />
            Applications
          </TabsTrigger>
          <TabsTrigger value="endpoints" id="endpoints-tab">
            <Code className="w-4 h-4 mr-2" />
            Endpoints
          </TabsTrigger>
        </TabsList>

        {/* Job Feed Tab */}
        <TabsContent value="job-feed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Job Feed XML Specification
              </CardTitle>
              <CardDescription>
                Complete specification for submitting job listings via XML feeds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  This specification defines how external job boards and partners can submit job listings to IntelliATS
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Overview</h3>
                  <p className="text-sm text-muted-foreground">
                    The Job Feed XML specification supports structured job data including titles, locations, 
                    salaries, requirements, and route-specific information for trucking positions.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Key Features</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>XSD schema validation for data integrity</li>
                    <li>Support for multiple job types and categories</li>
                    <li>Route-specific fields for trucking industry</li>
                    <li>Salary ranges and compensation details</li>
                    <li>Client/company information and branding</li>
                    <li>Job requirements and qualifications</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Required Fields</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Badge variant="outline">job_title</Badge>
                    <Badge variant="outline">job_summary</Badge>
                    <Badge variant="outline">city / state</Badge>
                    <Badge variant="outline">job_type</Badge>
                    <Badge variant="outline">client</Badge>
                    <Badge variant="outline">apply_url</Badge>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => downloadSpec('XML_FEED_SPECIFICATION.md')}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Full Specification
                  </Button>
                  <Button 
                    onClick={() => window.open('https://developers.google.com/search/docs/appearance/structured-data/job-posting', '_blank')}
                    variant="outline"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Google Jobs Guide
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sample XML Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
{`<?xml version="1.0" encoding="UTF-8"?>
<jobs>
  <job>
    <job_id>DRIVER-2024-001</job_id>
    <job_title>OTR CDL-A Driver</job_title>
    <job_summary>Seeking experienced OTR drivers...</job_summary>
    <city>Salt Lake City</city>
    <state>UT</state>
    <job_type>Full-time</job_type>
    <salary_min>55000</salary_min>
    <salary_max>75000</salary_max>
    <experience_level>2-5 years</experience_level>
    <client>C.R. England</client>
    <apply_url>https://example.com/apply/001</apply_url>
  </job>
</jobs>`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Application Feed Tab */}
        <TabsContent value="application-feed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Application Feed XML Specification
              </CardTitle>
              <CardDescription>
                Complete specification for submitting candidate applications to the ATS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  This specification defines how to submit candidate applications including personal information, 
                  CDL credentials, experience, and background screening data
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Overview</h3>
                  <p className="text-sm text-muted-foreground">
                    The Application Feed specification supports comprehensive candidate data collection including 
                    basic info, CDL credentials, work history, background checks, and consent management.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Data Categories</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    <Badge variant="secondary">Personal Info</Badge>
                    <Badge variant="secondary">CDL Information</Badge>
                    <Badge variant="secondary">Experience</Badge>
                    <Badge variant="secondary">Background</Badge>
                    <Badge variant="secondary">Work Authorization</Badge>
                    <Badge variant="secondary">Military Service</Badge>
                    <Badge variant="secondary">Medical Certs</Badge>
                    <Badge variant="secondary">Employment History</Badge>
                    <Badge variant="secondary">Consent & Legal</Badge>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Security & Compliance</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>PII data encryption and secure handling</li>
                    <li>GDPR and CCPA compliance</li>
                    <li>Audit logging for sensitive data access</li>
                    <li>Consent tracking and management</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Required Fields</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Badge variant="outline">applicant_email</Badge>
                    <Badge variant="outline">first_name</Badge>
                    <Badge variant="outline">last_name</Badge>
                    <Badge variant="outline">job_listing_id / job_id</Badge>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => downloadSpec('APPLICATION_FEED_SPECIFICATION.md')}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Full Specification
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sample Application XML</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
{`<?xml version="1.0" encoding="UTF-8"?>
<application>
  <job_id>DRIVER-2024-001</job_id>
  <applicant_email>john.driver@example.com</applicant_email>
  <first_name>John</first_name>
  <last_name>Driver</last_name>
  <phone>+15551234567</phone>
  <city>Provo</city>
  <state>UT</state>
  <zip>84601</zip>
  <cdl>Yes</cdl>
  <cdl_class>A</cdl_class>
  <exp>5+ years</exp>
  <months>72</months>
  <can_pass_drug_test>Yes</can_pass_drug_test>
  <consent_to_sms>Yes</consent_to_sms>
  <agree_privacy_policy>Yes</agree_privacy_policy>
  <source>Company Website</source>
</application>`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Endpoints Tab */}
        <TabsContent value="endpoints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                API Endpoints
              </CardTitle>
              <CardDescription>
                Active endpoints for job feeds and application submissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Job Feed Endpoint */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Job Feed XML Endpoint</h3>
                  <Badge variant="secondary">GET</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded text-xs overflow-x-auto">
                    {endpoints.jobFeed}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(endpoints.jobFeed, 'Job Feed Endpoint')}
                  >
                    {copiedEndpoint === 'Job Feed Endpoint' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Returns all active job listings in XML format for job boards and aggregators
                </p>
              </div>

              {/* Application Submit Endpoint */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Application Submission Endpoint</h3>
                  <Badge>POST</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded text-xs overflow-x-auto">
                    {endpoints.applicationSubmit}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(endpoints.applicationSubmit, 'Application Endpoint')}
                  >
                    {copiedEndpoint === 'Application Endpoint' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Submit job applications via XML or JSON format with automatic validation
                </p>
              </div>

              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <strong>Authentication:</strong> All POST endpoints require authorization header with Supabase anon key
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Authentication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                All API requests must include an Authorization header with your Supabase anon key:
              </p>
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`Authorization: Bearer YOUR_ANON_KEY

Example cURL request:
curl -X POST https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/submit-application \\
  -H "Authorization: Bearer YOUR_ANON_KEY" \\
  -H "Content-Type: application/xml" \\
  -d @application.xml`}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApiDocumentation;
