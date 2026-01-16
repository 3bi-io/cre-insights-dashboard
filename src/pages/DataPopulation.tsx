import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertCircle, Users, Download, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SuperAdminFeedImport } from '@/components/SuperAdminFeedImport';
import { useOrganizations } from '@/features/admin/hooks/useOrganizationData';
import { logger } from '@/lib/logger';

const DataPopulation = () => {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const { organizations, isLoading: loadingOrgs } = useOrganizations();
  const [generatingApps, setGeneratingApps] = useState(false);
  const [importingJobs, setImportingJobs] = useState(false);
  const [appCount, setAppCount] = useState(100);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState<string>('');

  // Client feed configurations
  const clientFeeds = [
    {
      id: 'pemberton',
      name: 'Pemberton Truck Lines Inc',
      feedUrl: 'https://cdljobcast.com/client/recruiting/getfeeds?user=Pemberton-Truck-Lines-1749741664&board=ATSme',
      clientId: '67cadf11-8cce-41c6-8e19-7d2bb0be3b03'
    },
    {
      id: 'danny-herman',
      name: 'Danny Herman Trucking',
      feedUrl: 'https://cdljobcast.com/client/recruiting/getfeeds?user=danny_herman_trucking&board=AIRecruiter',
      clientId: null
    },
    {
      id: 'novco',
      name: 'Novco Inc',
      feedUrl: 'https://cdljobcast.com/client/recruiting/getfeeds?user=Novco%2C-Inc.-1760547390&board=ATSme',
      clientId: null
    },
    {
      id: 'day-and-ross',
      name: 'Day-and-Ross',
      feedUrl: 'https://cdljobcast.com/client/recruiting/getfeeds?user=Day-and-Ross-1745523293&board=ATSme',
      clientId: null
    }
  ];

  const loadStats = async () => {
    if (!selectedOrgId) {
      toast({
        title: "No Organization Selected",
        description: "Please select an organization first",
        variant: "destructive",
      });
      return;
    }
    
    setLoadingStats(true);
    try {
      // Get job count
      const { count: jobCount } = await supabase
        .from('job_listings')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', selectedOrgId)
        .eq('status', 'active');

      // Get applications with job listings joined
      const { data: applications, count: appCount } = await supabase
        .from('applications')
        .select('id, status, job_listing_id, job_listings!inner(organization_id)', { count: 'exact' })
        .eq('job_listings.organization_id', selectedOrgId);

      const statusBreakdown = applications?.reduce((acc: any, app: any) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {}) || {};

      setStats({
        jobs: jobCount || 0,
        applications: appCount || 0,
        statusBreakdown
      });
    } catch (error) {
      logger.error('Error loading stats', error, { organizationId: selectedOrgId });
    } finally {
      setLoadingStats(false);
    }
  };

  React.useEffect(() => {
    if (userRole === 'super_admin' && selectedOrgId) {
      loadStats();
    }
  }, [userRole, selectedOrgId]);

  const importJobs = async () => {
    if (!selectedFeed) {
      toast({
        title: "No Feed Selected",
        description: "Please select a client feed to import from",
        variant: "destructive",
      });
      return;
    }

    if (!selectedOrgId) {
      toast({
        title: "No Organization Selected",
        description: "Please select an organization to import jobs to",
        variant: "destructive",
      });
      return;
    }

    const feed = clientFeeds.find(f => f.id === selectedFeed);
    if (!feed) return;

    setImportingJobs(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-jobs-from-feed', {
        body: { 
          feedUrl: feed.feedUrl,
          organizationId: selectedOrgId,
          clientId: feed.clientId || null
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast({
        title: "Jobs Imported",
        description: `${data.message} from ${feed.name}`,
      });
      
      await loadStats();
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : 'Failed to import jobs',
        variant: "destructive",
      });
    } finally {
      setImportingJobs(false);
    }
  };

  const generateApplications = async () => {
    if (!selectedOrgId) {
      toast({
        title: "No Organization Selected",
        description: "Please select an organization to generate applications for",
        variant: "destructive",
      });
      return;
    }

    setGeneratingApps(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-applications', {
        body: {
          count: appCount,
          organization_id: selectedOrgId
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast({
        title: "Applications Generated",
        description: data.message,
      });
      
      await loadStats();
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : 'Failed to generate applications',
        variant: "destructive",
      });
    } finally {
      setGeneratingApps(false);
    }
  };

  const selectedOrgName = organizations?.find(org => org.id === selectedOrgId)?.name || 'Selected Organization';

  if (userRole !== 'super_admin') {
    return (
      <PageLayout title="Access Denied" description="Super admin privileges required">
        <div className="container mx-auto px-4 py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need super administrator permissions to access this page.
            </AlertDescription>
          </Alert>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Data Population" 
      description="Import jobs and generate sample applications for any organization"
      actions={
        <Button onClick={loadStats} disabled={loadingStats || !selectedOrgId} variant="outline">
          {loadingStats ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileText className="h-4 w-4 mr-2" />
          )}
          Refresh Stats
        </Button>
      }
    >
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Organization Selector - Primary Card */}
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Target Organization
            </CardTitle>
            <CardDescription>
              Choose which organization to populate with data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="orgSelect">Organization</Label>
              <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                <SelectTrigger id="orgSelect" className="bg-popover">
                  <SelectValue placeholder="Select an organization..." />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {loadingOrgs ? (
                    <SelectItem value="loading" disabled>Loading organizations...</SelectItem>
                  ) : (
                    organizations?.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {!selectedOrgId && (
                <p className="text-sm text-muted-foreground">
                  You must select an organization before importing jobs or generating applications.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Statistics Card */}
        <Card>
          <CardHeader>
            <CardTitle>Current Statistics</CardTitle>
            <CardDescription>
              {selectedOrgId ? `${selectedOrgName} data overview` : 'Select an organization to view statistics'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedOrgId ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Select an organization above to view its statistics.
                </AlertDescription>
              </Alert>
            ) : loadingStats ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Active Jobs</div>
                  <div className="text-3xl font-bold">{stats?.jobs || 0}</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Total Applications</div>
                  <div className="text-3xl font-bold">{stats?.applications || 0}</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Status Breakdown</div>
                  <div className="space-y-1 mt-2">
                    {stats?.statusBreakdown && Object.entries(stats.statusBreakdown).map(([status, count]) => (
                      <div key={status} className="flex justify-between text-sm">
                        <span className="capitalize">{status}:</span>
                        <Badge variant="secondary">{count as number}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Import Jobs Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Step 1: Import Jobs from CDL Job Cast
            </CardTitle>
            <CardDescription>
              Select a client feed and import job listings to the selected organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="feedSelect">Select Client Feed</Label>
                <Select value={selectedFeed} onValueChange={setSelectedFeed}>
                  <SelectTrigger id="feedSelect" className="bg-popover">
                    <SelectValue placeholder="Choose a client feed..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {clientFeeds.map((feed) => (
                      <SelectItem key={feed.id} value={feed.id}>
                        {feed.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedFeed && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Feed:</strong> {clientFeeds.find(f => f.id === selectedFeed)?.name}
                      <br />
                      <strong>URL:</strong> <span className="text-xs break-all">{clientFeeds.find(f => f.id === selectedFeed)?.feedUrl}</span>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Button 
                onClick={importJobs}
                disabled={importingJobs || !selectedFeed || !selectedOrgId}
                size="lg"
                className="w-full"
              >
                {importingJobs ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing Jobs...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Import Jobs to {selectedOrgId ? selectedOrgName : 'Selected Organization'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Generate Applications Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Step 2: Generate Sample Applications
            </CardTitle>
            <CardDescription>
              Create realistic CDL applicant data from various sources (Adzuna, Indeed, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Applications will be distributed across all active job listings for the selected organization with realistic:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Driver names, emails, phone numbers</li>
                  <li>CDL classes, endorsements, experience levels</li>
                  <li>Geographic locations across US trucking markets</li>
                  <li>Source tracking (Adzuna, Indeed, CDL Job Cast, etc.)</li>
                  <li>Application dates within the last 30 days</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="appCount">Number of Applications to Generate</Label>
                <Input
                  id="appCount"
                  type="number"
                  min="1"
                  max="500"
                  value={appCount}
                  onChange={(e) => setAppCount(parseInt(e.target.value) || 100)}
                />
                <p className="text-sm text-muted-foreground">
                  Recommended: 50-200 applications for realistic data
                </p>
              </div>
            </div>

            <Button 
              onClick={generateApplications}
              disabled={generatingApps || !stats?.jobs || !selectedOrgId}
              size="lg"
              className="w-full"
            >
              {generatingApps ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Applications...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  Generate {appCount} Applications for {selectedOrgId ? selectedOrgName : 'Selected Organization'}
                </>
              )}
            </Button>

            {selectedOrgId && !stats?.jobs && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No active jobs found for {selectedOrgName}. Please import jobs first (Step 1).
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>About This Tool</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              This tool helps populate any organization with realistic data for testing and demonstration purposes.
            </p>
            <div>
              <strong>Data Sources:</strong>
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>Jobs: CDL Job Cast XML feeds from multiple clients</li>
                <li>Applications: Generated with realistic CDL driver profiles</li>
              </ul>
            </div>
            <div>
              <strong>Available Client Feeds:</strong>
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                {clientFeeds.map(feed => (
                  <li key={feed.id}>{feed.name}</li>
                ))}
              </ul>
            </div>
            <div>
              <strong>Application Sources Simulated:</strong>
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>Adzuna (primary job board aggregator)</li>
                <li>Indeed</li>
                <li>CDL Job Cast</li>
                <li>ZipRecruiter</li>
                <li>LinkedIn</li>
                <li>Facebook</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default DataPopulation;
