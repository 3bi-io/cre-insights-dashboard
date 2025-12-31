import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Rss, TestTube2, Info, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PageLayout } from '@/features/shared';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const FeedsManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [testingFeed, setTestingFeed] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [showTestDialog, setShowTestDialog] = useState(false);

  const projectUrl = 'https://auwhcdpppldjlcaxzsme.supabase.co';

  const feedUrls = {
    platformSpecific: `${projectUrl}/functions/v1/job-feed-xml?platform={platform}&user_id=${user?.id}`,
    indeed: `${projectUrl}/functions/v1/indeed-xml-feed`,
    googleJobs: `${projectUrl}/functions/v1/google-jobs-xml?user_id=${user?.id}`,
  };

  const platforms = [
    { name: 'Indeed', slug: 'indeed', icon: '🔵' },
    { name: 'Google Jobs', slug: 'google jobs', icon: '🔴' },
    { name: 'SimplyHired', slug: 'simplyhired', icon: '🟢' },
    { name: 'Craigslist', slug: 'craigslist', icon: '🟡' },
    { name: 'Glassdoor', slug: 'glassdoor', icon: '🔵' },
    { name: 'Dice', slug: 'dice', icon: '🟠' },
    { name: 'Jooble', slug: 'jooble', icon: '🔵' },
    { name: 'Truck Driver Jobs 411', slug: 'truck-driver-jobs-411', icon: '🚛' },
    { name: 'NewJobs4You', slug: 'newjobs4you', icon: '📋' },
    { name: 'RoadWarriors', slug: 'roadwarriors', icon: '🛣️' },
  ];

  const copyToClipboard = async (url: string, label: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      toast({
        title: 'Copied!',
        description: `${label} feed URL copied to clipboard`,
      });
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Failed to copy URL to clipboard',
        variant: 'destructive',
      });
    }
  };

  const testFeed = async (url: string, feedName: string) => {
    setTestingFeed(true);
    setTestResult(null);

    try {
      const startTime = Date.now();
      const response = await fetch(url);
      const responseTime = Date.now() - startTime;
      const xmlText = await response.text();

      // Parse XML to count jobs
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      const jobElements = xmlDoc.querySelectorAll('job, item, url');

      setTestResult({
        success: response.ok,
        jobCount: jobElements.length,
        responseTime,
        xmlPreview: xmlText.substring(0, 2000),
        status: response.status,
        feedName,
      });
      setShowTestDialog(true);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        feedName,
      });
      setShowTestDialog(true);
    } finally {
      setTestingFeed(false);
    }
  };

  return (
    <PageLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Rss className="w-8 h-8" />
                XML Feed Management
              </h1>
              <p className="text-muted-foreground mt-2">
                Distribute your job listings to major job boards via XML feeds
              </p>
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Feed Access</AlertTitle>
            <AlertDescription>
              All XML feeds are publicly accessible and can be consumed by any job board or aggregator.
              Share these URLs with job boards to automatically sync your active job listings.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="feeds" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="feeds">Feed URLs</TabsTrigger>
              <TabsTrigger value="setup">Setup Instructions</TabsTrigger>
            </TabsList>

            <TabsContent value="feeds" className="space-y-4">
              {/* Platform-Specific Feeds */}
              <Card>
                <CardHeader>
                  <CardTitle>Platform-Specific Feeds</CardTitle>
                  <CardDescription>
                    Optimized XML feeds for specific job boards
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {platforms.map((platform) => {
                    const url = feedUrls.platformSpecific.replace('{platform}', platform.slug);
                    return (
                      <div key={platform.slug} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-2xl">{platform.icon}</span>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold">{platform.name}</h3>
                            <p className="text-xs text-muted-foreground font-mono truncate">{url}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(url, platform.name)}
                          >
                            {copiedUrl === url ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => testFeed(url, platform.name)}
                            disabled={testingFeed}
                          >
                            <TestTube2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(url, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Direct Platform Feeds */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Indeed XML Feed
                      <Badge variant="secondary">Direct</Badge>
                    </CardTitle>
                    <CardDescription>
                      All active job listings in Indeed format
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-xs font-mono break-all">{feedUrls.indeed}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => copyToClipboard(feedUrls.indeed, 'Indeed')}
                      >
                        {copiedUrl === feedUrls.indeed ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testFeed(feedUrls.indeed, 'Indeed')}
                        disabled={testingFeed}
                      >
                        <TestTube2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(feedUrls.indeed, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Google Jobs Sitemap
                      <Badge variant="secondary">User-Specific</Badge>
                    </CardTitle>
                    <CardDescription>
                      Sitemap for Google Jobs indexing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-xs font-mono break-all">{feedUrls.googleJobs}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => copyToClipboard(feedUrls.googleJobs, 'Google Jobs')}
                      >
                        {copiedUrl === feedUrls.googleJobs ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testFeed(feedUrls.googleJobs, 'Google Jobs')}
                        disabled={testingFeed}
                      >
                        <TestTube2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(feedUrls.googleJobs, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="setup" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Setup Instructions</CardTitle>
                  <CardDescription>
                    Step-by-step guides for submitting feeds to each job board
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="indeed">
                      <AccordionTrigger>Indeed Setup</AccordionTrigger>
                      <AccordionContent className="space-y-2 text-sm">
                        <ol className="list-decimal list-inside space-y-2">
                          <li>Visit Indeed's employer portal and create an account</li>
                          <li>Navigate to "Post Jobs" → "XML Feed"</li>
                          <li>Submit your feed URL: <code className="bg-muted px-1 py-0.5 rounded">{feedUrls.indeed}</code></li>
                          <li>Indeed will validate and begin pulling jobs within 24 hours</li>
                          <li>Monitor feed performance in the Indeed dashboard</li>
                        </ol>
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Ensure your jobs have complete information (title, location, description, salary) for best results.
                          </AlertDescription>
                        </Alert>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="google">
                      <AccordionTrigger>Google Jobs Setup</AccordionTrigger>
                      <AccordionContent className="space-y-2 text-sm">
                        <ol className="list-decimal list-inside space-y-2">
                          <li>Submit sitemap to Google Search Console</li>
                          <li>Use this URL: <code className="bg-muted px-1 py-0.5 rounded">{feedUrls.googleJobs}</code></li>
                          <li>Ensure job pages have proper JSON-LD structured data</li>
                          <li>Google will crawl and index jobs automatically</li>
                          <li>Monitor indexing status in Search Console</li>
                        </ol>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="simplyhired">
                      <AccordionTrigger>SimplyHired Setup</AccordionTrigger>
                      <AccordionContent className="space-y-2 text-sm">
                        <ol className="list-decimal list-inside space-y-2">
                          <li>Create an employer account at SimplyHired.com</li>
                          <li>Contact their feed team to set up XML integration</li>
                          <li>Provide feed URL with platform parameter: <code className="bg-muted px-1 py-0.5 rounded">?platform=simplyhired</code></li>
                          <li>SimplyHired will validate the feed format</li>
                          <li>Jobs will appear on SimplyHired within 48 hours</li>
                        </ol>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="other">
                      <AccordionTrigger>Other Platforms</AccordionTrigger>
                      <AccordionContent className="space-y-2 text-sm">
                        <p>For Glassdoor, Dice, Jooble, and other platforms:</p>
                        <ol className="list-decimal list-inside space-y-2">
                          <li>Contact the platform's employer support team</li>
                          <li>Request XML feed integration</li>
                          <li>Provide the platform-specific feed URL</li>
                          <li>Each platform has unique requirements and timelines</li>
                          <li>Most platforms validate feeds before going live</li>
                        </ol>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Test Results Dialog */}
        <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Feed Test Results - {testResult?.feedName}</DialogTitle>
              <DialogDescription>
                {testResult?.success ? 'Feed is working correctly' : 'Feed test failed'}
              </DialogDescription>
            </DialogHeader>
            {testResult && (
              <div className="space-y-4">
                {testResult.success ? (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-foreground">{testResult.jobCount}</div>
                        <div className="text-xs text-muted-foreground">Jobs Found</div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-foreground">{testResult.responseTime}ms</div>
                        <div className="text-xs text-muted-foreground">Response Time</div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{testResult.status}</div>
                        <div className="text-xs text-muted-foreground">HTTP Status</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">XML Preview (first 2000 chars)</h4>
                      <ScrollArea className="h-64 w-full border rounded-md p-4">
                        <pre className="text-xs font-mono">{testResult.xmlPreview}</pre>
                      </ScrollArea>
                    </div>
                  </>
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{testResult.error}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default FeedsManagement;
