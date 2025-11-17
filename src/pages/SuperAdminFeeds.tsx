import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, RefreshCw, AlertCircle, CheckCircle, ExternalLink, Download } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { JobSelectionList } from '@/components/feeds/JobSelectionList';

interface Feed {
  id?: string;
  name?: string;
  title?: string;
  url?: string;
  status?: string;
  type?: string;
  description?: string;
  last_updated?: string;
  category?: string;
  division?: string;
  company?: string;
  location?: string;
  source?: string;
  [key: string]: any;
}

const SuperAdminFeeds = () => {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userParam, setUserParam] = useState('danny_herman_trucking');
  const [boardParam, setBoardParam] = useState('AIRecruiter');
  const [importing, setImporting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [appCount, setAppCount] = useState(50);
  const [feedSource, setFeedSource] = useState<'cdl_jobcast' | 'crengland'>('cdl_jobcast');
  const [crEnglandDivision, setCrEnglandDivision] = useState<string>('');
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [selectiveImport, setSelectiveImport] = useState(false);

  // Available user options for the dropdown (CDL Job Cast partners)
  const availableUsers = [
    // Hayes & Major National Carriers
    { value: 'danny_herman_trucking', label: 'Danny Herman Trucking (Hayes)' },
    { value: 'prime_inc', label: 'Prime Inc' },
    { value: 'schneider', label: 'Schneider' },
    { value: 'swift_transportation', label: 'Swift Transportation' },
    { value: 'jb_hunt', label: 'J.B. Hunt' },
    { value: 'werner', label: 'Werner Enterprises' },
    { value: 'crete_carrier', label: 'Crete Carrier' },
    { value: 'maverick', label: 'Maverick Transportation' },
    { value: 'covenant', label: 'Covenant Transport' },
    { value: 'roehl', label: 'Roehl Transport' },
    { value: 'england_logistics', label: 'C.R. England' },
    { value: 'knight_transportation', label: 'Knight Transportation' },
    { value: 'landstar', label: 'Landstar System' },
    { value: 'heartland_express', label: 'Heartland Express' },
    
    // LTL & Regional Carriers
    { value: 'old_dominion', label: 'Old Dominion Freight Line' },
    { value: 'estes_express', label: 'Estes Express Lines' },
    { value: 'saia_motor', label: 'Saia Motor Freight' },
    { value: 'xpo_logistics', label: 'XPO Logistics' },
    { value: 'fedex_freight', label: 'FedEx Freight' },
    { value: 'ups_freight', label: 'UPS Freight' },
    { value: 'abf_freight', label: 'ABF Freight' },
    { value: 'yrc_freight', label: 'YRC Freight' },
    { value: 'central_transport', label: 'Central Transport' },
    { value: 'roadrunner', label: 'Roadrunner Transportation' },
    { value: 'oak_harbor', label: 'Oak Harbor Freight Lines' },
    { value: 'rl_carriers', label: 'R+L Carriers' },
    { value: 'dayton_freight', label: 'Dayton Freight Lines' },
    { value: 'averitt_express', label: 'Averitt Express' },
    { value: 'southeastern_freight', label: 'Southeastern Freight Lines' },
    { value: 'ward_trucking', label: 'Ward Trucking' },
    { value: 'a_duie_pyle', label: 'A. Duie Pyle' },
    { value: 'new_penn', label: 'New Penn Motor Express' },
    { value: 'pitt_ohio', label: 'Pitt Ohio' },
    { value: 'holland', label: 'Holland (YRC)' },
    
    // Mid-Size & Regional TL Carriers
    { value: 'usa_truck', label: 'USA Truck' },
    { value: 'pam_transport', label: 'PAM Transport' },
    { value: 'celadon', label: 'Celadon Group' },
    { value: 'stevens_transport', label: 'Stevens Transport' },
    { value: 'tmc_transportation', label: 'TMC Transportation' },
    { value: 'marten_transport', label: 'Marten Transport' },
    { value: 'western_express', label: 'Western Express' },
    { value: 'system_transport', label: 'System Transport' },
    { value: 'interstate_distributor', label: 'Interstate Distributor Co' },
    { value: 'epes_transport', label: 'EPES Transport' },
    { value: 'ptl', label: 'Paschall Truck Lines (PTL)' },
    { value: 'melton_truck_lines', label: 'Melton Truck Lines' },
    { value: 'boyd_bros', label: 'Boyd Bros Transportation' },
    { value: 'millis_transfer', label: 'Millis Transfer' },
    { value: 'interstate_companies', label: 'Interstate Companies' },
    { value: 'dart_transit', label: 'Dart Transit Company' },
    { value: 'trans_am', label: 'Trans Am Trucking' },
    { value: 'super_service', label: 'Super Service LLC' },
    { value: 'western_flyer', label: 'Western Flyer Xpress' },
    { value: 'pgt_trucking', label: 'PGT Trucking' },
    { value: 'cfi', label: 'CFI (Contract Freighters Inc)' },
    { value: 'comcar', label: 'COMCAR Industries' },
    { value: 'wilson_logistics', label: 'Wilson Logistics' },
    { value: 'may_trucking', label: 'May Trucking Company' },
    
    // Tanker & Specialized
    { value: 'trimac', label: 'Trimac Transportation' },
    { value: 'quality_carriers', label: 'Quality Carriers' },
    { value: 'kenan_advantage', label: 'Kenan Advantage Group' },
    { value: 'groendyke', label: 'Groendyke Transport' },
    { value: 'heniff', label: 'Heniff Transportation' },
    { value: 'bulk_transport', label: 'Bulk Transport Company' },
    { value: 'superior_bulk', label: 'Superior Bulk Logistics' },
    { value: 'odyssey_logistics', label: 'Odyssey Logistics' },
    { value: 'nussbaum', label: 'Nussbaum Transportation' },
    
    // Intermodal & Logistics
    { value: 'hub_group', label: 'Hub Group' },
    { value: 'forward_air', label: 'Forward Air' },
    { value: 'ascent_global', label: 'Ascent Global Logistics' },
    { value: 'dupre_logistics', label: 'Dupré Logistics' },
    { value: 'jb_poindexter', label: 'J.B. Poindexter & Co' },
    { value: 'panther_premium', label: 'Panther Premium Logistics' },
    
    // Regional & Smaller Carriers
    { value: 'new_england_motor', label: 'New England Motor Freight' },
    { value: 'crst', label: 'CRST Expedited' },
    { value: 'usa_truck_inc', label: 'USA Truck Inc' },
    { value: 'veriha_trucking', label: 'Veriha Trucking' },
    { value: 'mclane', label: 'McLane Company' },
    { value: 'anderson_trucking', label: 'Anderson Trucking Service' },
    { value: 'daseke', label: 'Daseke Companies' },
    { value: 'wil_trans', label: 'Wil-Trans' },
    { value: 'navajo_express', label: 'Navajo Express' },
    { value: 'pam_logistics', label: 'PAM Logistics' },
    { value: 'carter_express', label: 'Carter Express' },
    { value: 'Interstate_distributor', label: 'Interstate Distributor' },
    { value: 'england_carrier', label: 'England Carrier Services' },
    { value: 'kllm', label: 'KLLM Transport Services' },
    { value: 'usa_transport', label: 'USA Transport' },
    { value: 'gordon_trucking', label: 'Gordon Trucking' },
    { value: 'central_refrigerated', label: 'Central Refrigerated Service' },
    { value: 'jim_palmer', label: 'Jim Palmer Trucking' },
    { value: 'wabash_national', label: 'Wabash National' },
    { value: 'montgomery_transport', label: 'Montgomery Transport' },
    { value: 'interstate_logistics', label: 'Interstate Logistics Systems' },
    { value: 'u_s_xpress', label: 'U.S. Xpress' },
    { value: 'team_run_smart', label: 'Team Run Smart' },
    { value: 'trans_states', label: 'Trans States Holdings' },
    { value: 'quality_distribution', label: 'Quality Distribution' },
    { value: 'barr_nunn', label: 'Barr-Nunn Transportation' },
    { value: 'decker_transport', label: 'Decker Transport' },
    { value: 'navajo_shippers', label: 'Navajo Shippers' },
    { value: 'hirschbach', label: 'Hirschbach Motor Lines' },
    { value: 'k_limited', label: 'K-Limited Carriers' },
    { value: 'great_coastal', label: 'Great Coastal Express' },
    { value: 'daylight_transport', label: 'Daylight Transport' },
    { value: 'builders_transport', label: 'Builders Transportation' },
    { value: 'mountain_valley', label: 'Mountain Valley Express' },
    { value: 'cci', label: 'CCI (Carolina Cargo)' },
    { value: 'ruan', label: 'Ruan Transportation' },
    { value: 'western_dairy', label: 'Western Dairy Transport' },
    { value: 'schilli', label: 'Schilli Transportation' },
    { value: 'interstate_trucking', label: 'Interstate Trucking' },
    { value: 'mccollister', label: 'McCollister Transportation' },
    { value: 'tennessee_carriers', label: 'Tennessee Truck Carriers' },
    { value: 'summit_logistics', label: 'Summit Logistics' },
    { value: 'apache_trucking', label: 'Apache Trucking' }
  ].sort((a, b) => a.label.localeCompare(b.label));

  const fetchFeeds = async () => {
    setLoading(true);
    setError(null);
    setSelectedJobs(new Set());
    
    try {
      let data, functionError;
      
      if (feedSource === 'cdl_jobcast') {
        const response = await supabase.functions.invoke('fetch-feeds', {
          body: { user: userParam, board: boardParam }
        });
        data = response.data;
        functionError = response.error;
      } else if (feedSource === 'crengland') {
        const response = await supabase.functions.invoke('fetch-crengland-jobs', {
          body: { division: crEnglandDivision || null }
        });
        data = response.data;
        functionError = response.error;
      }
      
      if (functionError) {
        throw new Error(`Function error: ${functionError.message}`);
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch feeds');
      }
      
      const apiData = data.data;
      let processedFeeds: Feed[] = [];
      
      if (Array.isArray(apiData)) {
        processedFeeds = apiData;
      } else if (apiData.feeds && Array.isArray(apiData.feeds)) {
        processedFeeds = apiData.feeds;
      } else if (apiData.data && Array.isArray(apiData.data)) {
        processedFeeds = apiData.data;
      } else if (typeof apiData === 'object' && apiData !== null) {
        processedFeeds = [apiData];
      }
      
      const jobListings = processedFeeds.filter(feed => feed.type === 'job_listing');
      
      setFeeds(jobListings);
      
      toast({
        title: "Feed data loaded",
        description: `Found ${jobListings.length} job listings from ${feedSource === 'cdl_jobcast' ? userParam : 'CR England'}`,
      });

      if (!selectiveImport && jobListings.length > 0 && feedSource === 'cdl_jobcast') {
        setImporting(true);
        try {
          let feedUrl = `https://cdljobcast.com/client/recruiting/getfeeds?user=${encodeURIComponent(userParam)}`;
          if (boardParam) {
            feedUrl += `&board=${encodeURIComponent(boardParam)}`;
          }

          const { data: importData, error: importError } = await supabase.functions.invoke('import-jobs-from-feed', {
            body: { 
              feedUrl: feedUrl,
              organizationId: '84214b48-7b51-45bc-ad7f-723bcf50466c'
            }
          });
          
          if (importError) {
            throw new Error(`Import error: ${importError.message}`);
          }
          
          if (!importData.success) {
            throw new Error(importData.error || 'Failed to import jobs');
          }
          
          toast({
            title: "Jobs imported successfully",
            description: `${importData.message}. Total: ${importData.total}, Imported: ${importData.imported}`,
          });
        } catch (importErr) {
          const errorMessage = importErr instanceof Error ? importErr.message : 'Failed to import jobs';
          console.error('Error importing jobs:', importErr);
          toast({
            title: "Error importing jobs",
            description: errorMessage,
            variant: "destructive",
          });
        } finally {
          setImporting(false);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch feeds';
      setError(errorMessage);
      console.error('Error fetching feeds:', err);
      toast({
        title: "Error loading feeds",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleJob = (jobId: string) => {
    setSelectedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedJobs(new Set(feeds.map(job => job.id!)));
    } else {
      setSelectedJobs(new Set());
    }
  };

  const importSelectedJobs = async () => {
    if (selectedJobs.size === 0) {
      toast({
        title: "No jobs selected",
        description: "Please select at least one job to import",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    try {
      const jobsToImport = feeds.filter(job => selectedJobs.has(job.id!));
      
      const organizationId = feedSource === 'crengland'
        ? 'b8d5e7f9-4c2a-4e8d-9a1b-3f5c8d9e2a7b'
        : '84214b48-7b51-45bc-ad7f-723bcf50466c';

      const { data, error: importError } = await supabase.functions.invoke('import-selected-jobs', {
        body: { 
          jobs: jobsToImport,
          organizationId: organizationId,
          source: feedSource
        }
      });
      
      if (importError) {
        throw new Error(`Import error: ${importError.message}`);
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to import jobs');
      }
      
      toast({
        title: "Selected jobs imported",
        description: `Successfully imported ${data.imported} of ${selectedJobs.size} selected jobs`,
      });
      
      setSelectedJobs(new Set());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import selected jobs';
      console.error('Error importing selected jobs:', err);
      toast({
        title: "Error importing jobs",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const generateApplications = async () => {
    setGenerating(true);
    try {
      const { data, error: functionError } = await supabase.functions.invoke('generate-hayes-applications', {
        body: { 
          count: appCount,
          organization_id: '84214b48-7b51-45bc-ad7f-723bcf50466c'
        }
      });
      
      if (functionError) {
        throw new Error(`Function error: ${functionError.message}`);
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate applications');
      }
      
      toast({
        title: "Applications Generated",
        description: data.message,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate applications';
      console.error('Error generating applications:', err);
      toast({
        title: "Error generating applications",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (userRole === 'super_admin') {
      fetchFeeds();
    }
  }, [userRole]); // eslint-disable-line react-hooks/exhaustive-deps

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
      title="Super Admin Feeds Management" 
      description="Import jobs from multiple sources with selective import capabilities"
      actions={
        <Button onClick={fetchFeeds} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh Feeds
        </Button>
      }
    >
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Feed Source Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Feed Source Configuration</CardTitle>
            <CardDescription>
              Select feed source and configure parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={feedSource} onValueChange={(value) => setFeedSource(value as 'cdl_jobcast' | 'crengland')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="cdl_jobcast">CDL Job Cast</TabsTrigger>
                <TabsTrigger value="crengland">CR England</TabsTrigger>
              </TabsList>
              
              <TabsContent value="cdl_jobcast" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="userParam">User Parameter</Label>
                    <Select value={userParam} onValueChange={setUserParam}>
                      <SelectTrigger className="mt-1 bg-background">
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-md max-h-[300px] z-50">
                        {availableUsers.map((user) => (
                          <SelectItem key={user.value} value={user.value} className="hover:bg-muted">
                            {user.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="boardParam">Board Parameter</Label>
                    <Input
                      id="boardParam"
                      value={boardParam}
                      onChange={(e) => setBoardParam(e.target.value)}
                      placeholder="Enter board parameter"
                      className="mt-1"
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  URL: https://cdljobcast.com/client/recruiting/getfeeds?user={userParam}{boardParam ? `&board=${boardParam}` : ''}
                </p>
              </TabsContent>
              
              <TabsContent value="crengland" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="crEnglandDivision">Division (Optional)</Label>
                    <Select value={crEnglandDivision} onValueChange={setCrEnglandDivision}>
                      <SelectTrigger className="mt-1 bg-background">
                        <SelectValue placeholder="All Divisions" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-md z-50">
                        <SelectItem value="">All Divisions</SelectItem>
                        <SelectItem value="DEDICT">Dedicated</SelectItem>
                        <SelectItem value="OVER_THE_ROAD">Over the Road</SelectItem>
                        <SelectItem value="INTMDL">Intermodal</SelectItem>
                        <SelectItem value="REGIONAL">Regional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Fetching jobs from CR England job board (crengland.com/jobboard/)
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>

            <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
              <Checkbox
                id="selective-import"
                checked={selectiveImport}
                onCheckedChange={(checked) => setSelectiveImport(checked as boolean)}
                className="data-[state=checked]:bg-primary"
              />
              <label
                htmlFor="selective-import"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Enable Selective Import (Choose specific jobs to import)
              </label>
            </div>

            <Button onClick={fetchFeeds} disabled={loading || (feedSource === 'cdl_jobcast' && !userParam.trim())} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Fetch Jobs from {feedSource === 'cdl_jobcast' ? 'CDL Job Cast' : 'CR England'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generate Applications Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Generate Sample Applications</CardTitle>
            <CardDescription>
              Create realistic CDL applicant data for Hayes organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1 max-w-xs">
                <Label htmlFor="appCount">Number of Applications</Label>
                <Input
                  id="appCount"
                  type="number"
                  min="1"
                  max="500"
                  value={appCount}
                  onChange={(e) => setAppCount(parseInt(e.target.value) || 50)}
                  className="mt-1"
                />
              </div>
              <Button 
                onClick={generateApplications}
                disabled={generating || !appCount}
                variant="default"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  `Generate ${appCount} Applications`
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading feeds...</span>
          </div>
        )}

        {!loading && feeds.length > 0 && (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Job Listings ({feeds.length})</CardTitle>
                    <CardDescription>
                      {selectiveImport ? 'Select jobs to import' : 'All jobs fetched from feed'}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">
                    Source: {feedSource === 'cdl_jobcast' ? 'CDL Job Cast' : 'CR England'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {selectiveImport ? (
                  <div className="space-y-4">
                    <JobSelectionList
                      jobs={feeds}
                      selectedJobs={selectedJobs}
                      onToggleJob={handleToggleJob}
                      onToggleAll={handleToggleAll}
                    />
                    <Button
                      onClick={importSelectedJobs}
                      disabled={importing || selectedJobs.size === 0}
                      className="w-full"
                      size="lg"
                    >
                      {importing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Import {selectedJobs.size} Selected Job{selectedJobs.size !== 1 ? 's' : ''}
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {feeds.map((job, index) => (
                      <Card key={job.id || index} className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className="font-semibold text-sm">{job.title || job.name}</p>
                            <div className="flex flex-wrap gap-2 text-xs">
                              {job.company && <Badge variant="secondary">{job.company}</Badge>}
                              {job.location && <Badge variant="outline">📍 {job.location}</Badge>}
                              {job.category && <Badge variant="outline">{job.category}</Badge>}
                              {job.division && <Badge variant="outline">{job.division}</Badge>}
                            </div>
                            {job.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                {job.description}
                              </p>
                            )}
                          </div>
                          {job.url && (
                            <a
                              href={job.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {!loading && feeds.length === 0 && !error && (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <p className="font-semibold mb-2">Ready to fetch jobs</p>
              <p className="text-muted-foreground mb-4">
                Configure your feed source above and click "Fetch Jobs" to begin.
              </p>
              <Button onClick={fetchFeeds} variant="outline">
                Fetch Jobs Now
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
};

export default SuperAdminFeeds;
