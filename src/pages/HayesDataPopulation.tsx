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

const HayesDataPopulation = () => {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const { organizations, isLoading: loadingOrgs } = useOrganizations();
  const [generatingApps, setGeneratingApps] = useState(false);
  const [importingJobs, setImportingJobs] = useState(false);
  const [appCount, setAppCount] = useState(100);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('84214b48-7b51-45bc-ad7f-723bcf50466c');
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const dannyHermanFeedUrl = 'https://cdljobcast.com/client/recruiting/getfeeds?user=danny_herman_trucking&board=AIRecruiter';
  const pembertonFeedUrl = 'https://cdljobcast.com/client/recruiting/getfeeds?user=Pemberton-Truck-Lines-1749741664&board=ATSme';
  
  // Client IDs for proper job association
  const pembertonClientId = '67cadf11-8cce-41c6-8e19-7d2bb0be3b03';

  const loadStats = async () => {
    if (!selectedOrgId) return;
    
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
      console.error('Error loading stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  React.useEffect(() => {
    if (userRole === 'super_admin' && selectedOrgId) {
      loadStats();
    }
  }, [userRole, selectedOrgId]);

  const importJobs = async (feedUrl: string, feedName: string, clientId?: string) => {
    setImportingJobs(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-jobs-from-feed', {
        body: { 
          feedUrl,
          organizationId: selectedOrgId,
          clientId: clientId || null
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast({
        title: "Jobs Imported",
        description: `${data.message} from ${feedName}`,
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
    setGeneratingApps(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-hayes-applications', {
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
      title="Hayes Data Population" 
      description="Import jobs and generate applications for Hayes Recruiting Solutions"
      actions={
        <Button onClick={loadStats} disabled={loadingStats} variant="outline">
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
        {/* Statistics Card */}
        <Card>
          <CardHeader>
            <CardTitle>Current Statistics</CardTitle>
            <CardDescription>Hayes Recruiting Solutions data overview</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
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
              Import job listings from CDL Job Cast feeds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Feed:</strong> Pemberton Truck Lines Inc
                    <br />
                    <strong>URL:</strong> {pembertonFeedUrl}
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={() => importJobs(pembertonFeedUrl, 'Pemberton Truck Lines', pembertonClientId)}
                  disabled={importingJobs}
                  size="lg"
                  className="w-full mt-2"
                >
                  {importingJobs ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing Jobs...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Import Pemberton Jobs
                    </>
                  )}
                </Button>
              </div>

              <div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Feed:</strong> Danny Herman Trucking
                    <br />
                    <strong>URL:</strong> {dannyHermanFeedUrl}
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={() => importJobs(dannyHermanFeedUrl, 'Danny Herman Trucking')}
                  disabled={importingJobs}
                  size="lg"
                  variant="outline"
                  className="w-full mt-2"
                >
                  {importingJobs ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing Jobs...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Import Danny Herman Jobs
                    </>
                  )}
                </Button>
              </div>
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
                Applications will be distributed across all active Hayes job listings with realistic:
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
                <Label htmlFor="orgSelect">Select Organization</Label>
                <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                  <SelectTrigger id="orgSelect">
                    <SelectValue placeholder="Select an organization" />
                  </SelectTrigger>
                  <SelectContent>
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
              </div>

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
              disabled={generatingApps || !stats?.jobs}
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
                  Generate {appCount} Applications
                </>
              )}
            </Button>

            {!stats?.jobs && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No active jobs found. Please import jobs first (Step 1).
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
              This tool helps populate the Hayes Recruiting Solutions organization with realistic data for testing and demonstration purposes.
            </p>
            <div>
              <strong>Data Sources:</strong>
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>Jobs: CDL Job Cast XML feed (danny_herman_trucking via Adzuna)</li>
                <li>Applications: Generated with realistic CDL driver profiles</li>
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

export default HayesDataPopulation;
