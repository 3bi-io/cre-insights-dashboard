import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Check, AlertCircle, Webhook, Send, Code, Book } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const WebhookManagement = () => {
  const { userRole, organization } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [testPayload, setTestPayload] = useState('');
  const [testing, setTesting] = useState(false);

  const webhookUrl = 'https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/inbound-applications';
  const organizationId = organization?.id || '84214b48-7b51-45bc-ad7f-723bcf50466c';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Webhook URL copied to clipboard",
    });
  };

  const testWebhook = async () => {
    setTesting(true);
    try {
      const payload = testPayload || JSON.stringify({
        first_name: "Test",
        last_name: "Applicant",
        email: "test@example.com",
        phone: "555-123-4567",
        city: "Phoenix",
        state: "AZ",
        cdl: "Yes",
        exp: "2 years",
        source: "Test Webhook",
        organization_id: organizationId
      }, null, 2);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: payload
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Webhook Test Successful",
          description: `Application created: ${data.application_id}`,
        });
      } else {
        toast({
          title: "Webhook Test Failed",
          description: data.error || 'Unknown error',
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to test webhook',
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const examplePayloadMinimal = {
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    phone: "555-123-4567",
    organization_id: organizationId
  };

  const examplePayloadFull = {
    // Required fields
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    phone: "555-123-4567",
    
    // Location
    city: "Phoenix",
    state: "AZ",
    zip: "85001",
    address_1: "123 Main St",
    country: "US",
    
    // Job details
    job_id: "14204J281",
    job_title: "CDL-A Solo Truck Driver",
    
    // CDL & Experience
    cdl: "Yes",
    cdl_class: "A",
    cdl_state: "AZ",
    cdl_endorsements: ["Hazmat", "Tanker"],
    exp: "5 years",
    
    // Demographics
    age: "Yes",
    veteran: "Yes",
    education_level: "High School",
    work_authorization: "US Citizen",
    
    // Screening
    consent: "Yes",
    drug: "Yes",
    privacy: "Yes",
    convicted_felony: "No",
    
    // Source tracking
    source: "CDL Job Cast",
    campaign_id: "campaign_123",
    ad_id: "ad_456",
    
    // Organization
    organization_id: organizationId,
    
    // Additional
    notes: "Experienced driver looking for long-haul opportunities",
    status: "pending"
  };

  const curlExample = `curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(examplePayloadMinimal, null, 2)}'`;

  if (userRole !== 'super_admin' && userRole !== 'admin') {
    return (
      <PageLayout title="Access Denied" description="Admin privileges required">
        <div className="container mx-auto px-4 py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need administrator permissions to access webhook management.
            </AlertDescription>
          </Alert>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Webhook Management" 
      description="Configure and test inbound application webhooks"
    >
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Webhook URL Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Webhook Endpoint
            </CardTitle>
            <CardDescription>
              Use this URL to receive applications from external sources
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <div className="flex gap-2">
                <Input 
                  value={webhookUrl} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => copyToClipboard(webhookUrl)}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Organization ID:</strong> {organizationId}
                <br />
                Include this in your webhook payload to route applications correctly
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Badge variant="outline">Method: POST</Badge>
              <Badge variant="outline">Content-Type: application/json</Badge>
              <Badge variant="outline">No Authentication Required</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Documentation Tabs */}
        <Tabs defaultValue="examples" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="examples">
              <Code className="h-4 w-4 mr-2" />
              Examples
            </TabsTrigger>
            <TabsTrigger value="fields">
              <Book className="h-4 w-4 mr-2" />
              Field Reference
            </TabsTrigger>
            <TabsTrigger value="test">
              <Send className="h-4 w-4 mr-2" />
              Test Webhook
            </TabsTrigger>
          </TabsList>

          {/* Examples Tab */}
          <TabsContent value="examples" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Minimal Example</CardTitle>
                <CardDescription>Required fields only</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{JSON.stringify(examplePayloadMinimal, null, 2)}</code>
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Full Example</CardTitle>
                <CardDescription>All supported fields</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{JSON.stringify(examplePayloadFull, null, 2)}</code>
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>cURL Example</CardTitle>
                <CardDescription>Test from command line</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{curlExample}</code>
                </pre>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="mt-4"
                  onClick={() => copyToClipboard(curlExample)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy cURL Command
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Field Reference Tab */}
          <TabsContent value="fields">
            <Card>
              <CardHeader>
                <CardTitle>Supported Fields</CardTitle>
                <CardDescription>Complete field reference with alternative names</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Required Fields */}
                  <div>
                    <h3 className="font-semibold mb-3 text-lg">Required Fields</h3>
                    <div className="space-y-2 text-sm">
                      <div className="border-l-4 border-destructive pl-3">
                        <strong>email</strong> - Applicant email address
                        <br />
                        <span className="text-muted-foreground">Alternatives: applicant_email, emailAddress</span>
                      </div>
                      <div className="border-l-4 border-destructive pl-3">
                        <strong>first_name</strong> - Applicant first name
                        <br />
                        <span className="text-muted-foreground">Alternatives: firstName, fname, full_name, name</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h3 className="font-semibold mb-3 text-lg">Contact Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="border-l-4 border-primary pl-3">
                        <strong>last_name</strong> - Last name
                        <br />
                        <span className="text-muted-foreground">Alternatives: lastName, lname</span>
                      </div>
                      <div className="border-l-4 border-primary pl-3">
                        <strong>phone</strong> - Phone number (will be normalized)
                        <br />
                        <span className="text-muted-foreground">Alternatives: phone_number, phoneNumber, mobile</span>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <h3 className="font-semibold mb-3 text-lg">Location</h3>
                    <div className="space-y-2 text-sm">
                      <div className="border-l-4 border-primary pl-3">
                        <strong>city, state, zip</strong> - Location information
                      </div>
                      <div className="border-l-4 border-primary pl-3">
                        <strong>address_1, address_2</strong> - Street address
                      </div>
                      <div className="border-l-4 border-primary pl-3">
                        <strong>country</strong> - Country code (default: US)
                      </div>
                    </div>
                  </div>

                  {/* CDL & Experience */}
                  <div>
                    <h3 className="font-semibold mb-3 text-lg">CDL & Experience</h3>
                    <div className="space-y-2 text-sm">
                      <div className="border-l-4 border-primary pl-3">
                        <strong>cdl</strong> - Has CDL license
                        <br />
                        <span className="text-muted-foreground">Alternatives: cdl_license, has_cdl</span>
                      </div>
                      <div className="border-l-4 border-primary pl-3">
                        <strong>cdl_class</strong> - CDL class (A, B, C)
                      </div>
                      <div className="border-l-4 border-primary pl-3">
                        <strong>cdl_endorsements</strong> - Array of endorsements
                      </div>
                      <div className="border-l-4 border-primary pl-3">
                        <strong>exp</strong> - Years of experience
                        <br />
                        <span className="text-muted-foreground">Alternatives: experience, years_experience</span>
                      </div>
                    </div>
                  </div>

                  {/* Job Details */}
                  <div>
                    <h3 className="font-semibold mb-3 text-lg">Job Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="border-l-4 border-primary pl-3">
                        <strong>job_listing_id</strong> - Internal job listing ID
                      </div>
                      <div className="border-l-4 border-primary pl-3">
                        <strong>job_id</strong> - External job reference number
                        <br />
                        <span className="text-muted-foreground">Alternatives: reference_number, referenceNumber</span>
                      </div>
                      <div className="border-l-4 border-primary pl-3">
                        <strong>job_title</strong> - Position title
                      </div>
                    </div>
                  </div>

                  {/* Tracking */}
                  <div>
                    <h3 className="font-semibold mb-3 text-lg">Source Tracking</h3>
                    <div className="space-y-2 text-sm">
                      <div className="border-l-4 border-primary pl-3">
                        <strong>source</strong> - Application source (default: CDL Job Cast)
                      </div>
                      <div className="border-l-4 border-primary pl-3">
                        <strong>campaign_id, ad_id, adset_id</strong> - Campaign tracking IDs
                      </div>
                    </div>
                  </div>

                  {/* Organization */}
                  <div>
                    <h3 className="font-semibold mb-3 text-lg">Organization Routing</h3>
                    <div className="space-y-2 text-sm">
                      <div className="border-l-4 border-primary pl-3">
                        <strong>organization_id</strong> - Organization UUID
                      </div>
                      <div className="border-l-4 border-primary pl-3">
                        <strong>organization_slug</strong> - Organization slug (alternative to ID)
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Test Tab */}
          <TabsContent value="test">
            <Card>
              <CardHeader>
                <CardTitle>Test Webhook</CardTitle>
                <CardDescription>Send a test application to verify webhook configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="testPayload">JSON Payload (optional - leave empty for default)</Label>
                  <textarea
                    id="testPayload"
                    className="w-full h-64 p-3 border rounded-md font-mono text-sm"
                    placeholder={JSON.stringify(examplePayloadMinimal, null, 2)}
                    value={testPayload}
                    onChange={(e) => setTestPayload(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={testWebhook} 
                  disabled={testing}
                  className="w-full"
                >
                  {testing ? (
                    <>Sending Test...</>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Test Webhook
                    </>
                  )}
                </Button>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This will create a real application in your database. Check the Applications page to verify.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Integration Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Integration Guide</CardTitle>
            <CardDescription>How to integrate with external sources</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-semibold mb-2">1. CDL Job Cast Integration</h4>
                <p className="text-muted-foreground">
                  Contact CDL Job Cast support to configure this webhook URL for your account. 
                  They will send application data when candidates apply through their platform.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">2. Indeed Integration</h4>
                <p className="text-muted-foreground">
                  Use Indeed's Apply API to forward applications to this webhook endpoint.
                  Include the organization_id in your webhook configuration.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">3. Zapier/Make Integration</h4>
                <p className="text-muted-foreground">
                  Create a Zap or Make scenario that sends HTTP POST requests to this webhook URL
                  when new applications are received from any source.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">4. Custom Integration</h4>
                <p className="text-muted-foreground">
                  Use any platform that supports HTTP webhooks. Send a POST request with JSON data
                  matching the field structure documented above.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default WebhookManagement;
